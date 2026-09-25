// The ONLY module screens talk to for data. Everything is async and returns
// view-shaped objects, so this file can be swapped for Firestore/API calls
// without touching components.
//
// It also plays "server": privacy filtering happens HERE (fields the viewer may
// not see are omitted), so the UI is already written against filtered payloads.
// In the prototype this is not security — see SECURITY_REQUIREMENTS.md.
import * as seed from './seed.ts'
import { computeStats, evaluateBadges, type BadgeProgress, type CafeStats } from '../domain/stats.ts'
import { canViewActivity, canViewProofPhotos, relationship } from '../domain/visibility.ts'
import { localToday, validateVisit, type VisitDraft } from '../domain/visits.ts'
import type { Cafe, CafeHighlight, HighlightType, ID, MenuItem, Relationship, StaffShoutout, User, Visit, WantToGo } from '../domain/types.ts'

// ---------- localStorage helpers (per-browser prototype persistence) ----------

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable: stay in-memory */ }
}

/** Fires after every write. `useApi` re-runs screen loaders on it, so screens never hold
 *  their own copy of shared state (e.g. Want to Go). A Firestore version would fire it
 *  from onSnapshot listeners instead. */
export const dataChanged = new EventTarget()
const changed = () => dataChanged.dispatchEvent(new Event('change'))

const WTG_KEY = 'cs.wantToGo.v1'
const VISITS_KEY = 'cs.visits.v1' // user-created visits only; seed visits stay in seed.ts
const ITEMS_KEY = 'cs.menuItems.v1' // user-added menu items
let wantToGo: WantToGo[] = load(WTG_KEY, seed.wantToGo)
let createdVisits: Visit[] = load(VISITS_KEY, [])
let customItems: MenuItem[] = load(ITEMS_KEY, [])

// ---------- Mock session ----------

const VIEWER_KEY = 'cs.viewerId'
const DEFAULT_VIEWER = 'u_lina'

export const getViewerId = (): ID => load(VIEWER_KEY, DEFAULT_VIEWER)
export const setViewerId = (id: ID) => save(VIEWER_KEY, id)
export const resetPrototypeData = () => {
  try { for (const k of [WTG_KEY, VISITS_KEY, ITEMS_KEY]) localStorage.removeItem(k) } catch { /* nothing stored */ }
}

// ---------- Lookups ----------

const cafesById = new Map(seed.cafes.map((c) => [c.id, c]))
const usersById = new Map(seed.users.map((u) => [u.id, u]))
const allVisits = () => [...seed.visits, ...createdVisits]
const itemsById = () => new Map([...seed.menuItems, ...customItems].map((i) => [i.id, i]))
const activeFollowees = (id: ID) => seed.follows.filter((f) => f.followerId === id && f.status === 'active').map((f) => f.followeeId)

// Community aggregates (café pages, Discover) only ever see activity the viewer may see (SR-29, SR-76).
const canSee = (viewerId: ID, userId: ID) => {
  const u = usersById.get(userId)
  return !!u && canViewActivity(u, relationship(seed.follows, viewerId, userId))
}
const visibleVisits = (viewerId: ID) => allVisits().filter((v) => canSee(viewerId, v.userId))
const visibleWantToGo = (viewerId: ID) => wantToGo.filter((w) => canSee(viewerId, w.userId))

export async function listUsers(): Promise<User[]> {
  return seed.users
}

// ---------- Profile ----------

export interface WantToGoEntry {
  cafe: Cafe
  alsoWant: User[] // people the viewer follows who also want to go — plan seed
}

export interface VisitCard {
  visit: Visit
  cafe: Cafe
  items: MenuItem[]
  author: User
  companions: User[] // only companions the viewer may see
  hiddenCompanions: number // private companions shown as "+N other"
}

// Companions are visible to the author, to themselves, and per SR-1 otherwise (SR-82).
function visitCard(viewerId: ID, visit: Visit, items: Map<string, MenuItem>): VisitCard {
  const tagged = visit.companionUserIds.map((id) => usersById.get(id)).filter((u) => u !== undefined)
  const companions = tagged.filter((u) => viewerId === visit.userId || viewerId === u.id || canSee(viewerId, u.id))
  return {
    visit, cafe: cafesById.get(visit.cafeId)!, items: visit.items.map((i) => items.get(i.menuItemId)!),
    author: usersById.get(visit.userId)!, companions, hiddenCompanions: tagged.length - companions.length,
  }
}

const byVisitDate = (a: Visit, b: Visit) => (b.visitedAt ?? b.createdAt).localeCompare(a.visitedAt ?? a.createdAt)

export interface ProfileView {
  user: User
  relationship: Relationship
  followerCount: number
  followingCount: number
  mutualCount: number
  canViewActivity: boolean
  // Omitted (undefined) when the viewer may not see detailed activity:
  stats?: CafeStats
  wantToGo?: WantToGoEntry[]
  recentVisits?: VisitCard[]
  taggedVisits?: VisitCard[] // other people's visits this user was tagged in
  // Badges are always visible; progress numbers and proof photos are filtered.
  badges: BadgeProgress[]
}

export async function getProfileView(viewerId: ID, username: string): Promise<ProfileView | null> {
  const user = seed.users.find((u) => u.username === username)
  if (!user) return null

  const rel = relationship(seed.follows, viewerId, user.id)
  const allowed = canViewActivity(user, rel)
  const followers = seed.follows.filter((f) => f.followeeId === user.id && f.status === 'active').map((f) => f.followerId)
  const following = activeFollowees(user.id)

  const items = itemsById()
  const visits = allVisits().filter((v) => v.userId === user.id)
  const stats = computeStats(visits, cafesById)
  const awards = seed.badgeAwards.filter((a) => a.userIds.includes(user.id))
  const proofOk = canViewProofPhotos(rel)

  const badges = evaluateBadges(seed.badgeDefinitions, stats, visits, items, awards).map((b) => ({
    ...b,
    current: allowed ? b.current : undefined,
    award: b.award && (proofOk ? b.award : { ...b.award, proofPhotoUrls: [] }),
  }))

  const base: ProfileView = {
    user, relationship: rel, canViewActivity: allowed, badges,
    followerCount: followers.length,
    followingCount: following.length,
    mutualCount: following.filter((id) => followers.includes(id)).length,
  }
  if (!allowed) return base

  const viewerFollows = activeFollowees(viewerId)
  return {
    ...base,
    stats,
    wantToGo: wantToGo
      .filter((w) => w.userId === user.id)
      .map((w) => ({
        cafe: cafesById.get(w.cafeId)!,
        alsoWant: wantToGo
          .filter((o) => o.cafeId === w.cafeId && o.userId !== user.id && o.userId !== viewerId && viewerFollows.includes(o.userId))
          .map((o) => usersById.get(o.userId)!),
      })),
    recentVisits: visits.toSorted(byVisitDate).slice(0, 6).map((v) => visitCard(viewerId, v, items)),
    taggedVisits: allVisits()
      .filter((v) => v.userId !== user.id && v.companionUserIds.includes(user.id) && canSee(viewerId, v.userId))
      .toSorted(byVisitDate).slice(0, 6).map((v) => visitCard(viewerId, v, items)),
  }
}

// ---------- Want to go ----------

export async function toggleWantToGo(userId: ID, cafeId: ID): Promise<boolean> {
  const exists = wantToGo.some((w) => w.userId === userId && w.cafeId === cafeId)
  wantToGo = exists
    ? wantToGo.filter((w) => !(w.userId === userId && w.cafeId === cafeId))
    : [...wantToGo, { userId, cafeId, createdAt: new Date().toISOString() }]
  save(WTG_KEY, wantToGo)
  changed()
  return !exists
}

// ---------- Add visit ----------

export async function listCafes(): Promise<Cafe[]> {
  return seed.cafes.toSorted((a, b) => a.name.localeCompare(b.name))
}

export async function getCafeMenu(cafeId: ID): Promise<MenuItem[]> {
  return [...seed.menuItems, ...customItems].filter((i) => i.cafeId === cafeId)
}

/** Users can add items the café menu doesn't list yet. */
export async function addMenuItem(cafeId: ID, name: string): Promise<MenuItem> {
  const clean = name.trim()
  const existing = (await getCafeMenu(cafeId)).find((i) => i.name.toLowerCase() === clean.toLowerCase())
  if (existing) return existing
  const created: MenuItem = { id: `${cafeId}:custom_${crypto.randomUUID()}`, cafeId, name: clean, category: 'other', tags: [] }
  customItems = [...customItems, created]
  save(ITEMS_KEY, customItems)
  changed()
  return created
}

export async function listDemoPhotos() {
  return seed.demoPhotos
}

export async function createVisit(userId: ID, draft: VisitDraft): Promise<Visit> {
  const errors = validateVisit(draft, localToday())
  if (errors.length) throw new Error(errors.join(' '))
  // Referential integrity for the mock store (server must repeat this: SR-26).
  if (!cafesById.has(draft.cafeId)) throw new Error('Unknown café.')
  const menu = new Set((await getCafeMenu(draft.cafeId)).map((i) => i.id))
  if (draft.items.some((i) => !menu.has(i.menuItemId))) throw new Error('An item isn’t on this café’s menu.')
  const companionUserIds = [...new Set(draft.companionUserIds)]
  if (companionUserIds.some((id) => id === userId || !usersById.has(id))) throw new Error('Invalid companion.')
  const visit: Visit = { ...draft, companionUserIds, id: `v_${crypto.randomUUID()}`, userId, createdAt: new Date().toISOString() }
  createdVisits = [...createdVisits, visit]
  save(VISITS_KEY, createdVisits)
  changed()
  return visit
}

// ---------- Discover & café detail ----------

export interface CafeSummary {
  cafe: Cafe
  viewerWantsToGo: boolean
  notableItems: string[] // most consumed by the community, topped up from the menu
  visitCount: number
  followedVisitors: User[] // people the viewer follows who visited
  followedWantToGo: User[] // people the viewer follows who also want to go
  wantToGoCount: number
  recommendation?: { user: User; itemName?: string } // prefers people the viewer follows
}

export interface CafeView extends CafeSummary {
  highlights: (CafeHighlight & { type: HighlightType })[] // café-owned; empty unless claimed
  photos: { url: string; user: User; itemName?: string }[]
  visits: VisitCard[]
  triedItems: { item: MenuItem; consumptions: number; people: number }[]
  recommendations: { user: User; visit: Visit; items: MenuItem[] }[]
  shoutouts: { shoutout: StaffShoutout; user: User; at: string }[]
  wantToGoUsers: User[]
}

function summarize(viewerId: ID, cafe: Cafe, visits: Visit[], wtg: WantToGo[], items: Map<string, MenuItem>): CafeSummary {
  const follows = new Set(activeFollowees(viewerId))
  const perItem = new Map<string, number>()
  for (const v of visits) for (const i of v.items) perItem.set(i.menuItemId, (perItem.get(i.menuItemId) ?? 0) + i.quantity)
  const popular = [...perItem].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  const menu = [...items.values()].filter((i) => i.cafeId === cafe.id).map((i) => i.id)
  const notable = [...new Set([...popular, ...menu])].slice(0, 3).map((id) => items.get(id)?.name ?? '')

  const recs = visits.filter((v) => v.recommends && v.userId !== viewerId)
  const rec = recs.find((v) => follows.has(v.userId)) ?? recs[0]
  const recItem = rec && (rec.photos.find((p) => p.menuItemId)?.menuItemId ?? rec.items[0]?.menuItemId)

  const others = (ids: ID[]) => [...new Set(ids)].filter((id) => id !== viewerId && follows.has(id)).map((id) => usersById.get(id)!)
  return {
    cafe,
    viewerWantsToGo: wantToGo.some((w) => w.userId === viewerId && w.cafeId === cafe.id),
    notableItems: notable.filter(Boolean),
    visitCount: visits.length,
    followedVisitors: others(visits.map((v) => v.userId)),
    followedWantToGo: others(wtg.map((w) => w.userId)),
    wantToGoCount: wtg.length,
    recommendation: rec && { user: usersById.get(rec.userId)!, itemName: recItem && items.get(recItem)?.name },
  }
}

export async function listDiscover(viewerId: ID, query = ''): Promise<CafeSummary[]> {
  const q = query.trim().toLowerCase()
  const visits = visibleVisits(viewerId)
  const wtg = visibleWantToGo(viewerId)
  const items = itemsById()
  const socialScore = (s: CafeSummary) => s.followedVisitors.length + s.followedWantToGo.length + (s.recommendation ? 1 : 0)
  return seed.cafes
    .filter((c) => !q || `${c.name} ${c.area} ${c.city} ${c.country} ${c.tags.join(' ')}`.toLowerCase().includes(q))
    .map((c) => summarize(viewerId, c, visits.filter((v) => v.cafeId === c.id), wtg.filter((w) => w.cafeId === c.id), items))
    .sort((a, b) => socialScore(b) - socialScore(a) || a.cafe.name.localeCompare(b.cafe.name)) // people first, not ratings
}

export async function getCafeView(viewerId: ID, cafeId: ID): Promise<CafeView | null> {
  const cafe = cafesById.get(cafeId)
  if (!cafe) return null
  const items = itemsById()
  const visits = visibleVisits(viewerId).filter((v) => v.cafeId === cafeId).toSorted(byVisitDate)
  const wtg = visibleWantToGo(viewerId).filter((w) => w.cafeId === cafeId)
  const user = (id: ID) => usersById.get(id)!

  const tried = new Map<string, { consumptions: number; people: Set<ID> }>()
  for (const v of visits) for (const i of v.items) {
    const t = tried.get(i.menuItemId) ?? { consumptions: 0, people: new Set() }
    t.consumptions += i.quantity
    t.people.add(v.userId)
    tried.set(i.menuItemId, t)
  }

  const types = new Map(seed.highlightTypes.map((t) => [t.id, t]))
  const now = new Date().toISOString()
  const highlights = cafe.claimStatus !== 'claimed' ? [] : seed.cafeHighlights
    .filter((h) => h.cafeId === cafeId && (!h.endsAt || h.endsAt >= now))
    .map((h) => ({ ...h, type: types.get(h.typeId) ?? { id: h.typeId, label: 'From the Café', icon: '📣' } }))

  return {
    ...summarize(viewerId, cafe, visits, wtg, items),
    highlights,
    photos: visits.flatMap((v) => v.photos.map((p) => ({ url: p.url, user: user(v.userId), itemName: p.menuItemId && items.get(p.menuItemId)?.name }))),
    visits: visits.map((v) => visitCard(viewerId, v, items)),
    triedItems: [...tried].map(([id, t]) => ({ item: items.get(id)!, consumptions: t.consumptions, people: t.people.size }))
      .sort((a, b) => b.people - a.people || b.consumptions - a.consumptions),
    recommendations: visits.filter((v) => v.recommends)
      .map((v) => ({ user: user(v.userId), visit: v, items: v.items.map((i) => items.get(i.menuItemId)!) })),
    shoutouts: visits.filter((v) => v.staffShoutout)
      .map((v) => ({ shoutout: v.staffShoutout!, user: user(v.userId), at: v.visitedAt ?? v.createdAt })),
    wantToGoUsers: wtg.filter((w) => w.userId !== viewerId).map((w) => user(w.userId)),
  }
}
