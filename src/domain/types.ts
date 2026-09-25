// Domain model. Deliberately loose: optional fields + string unions so the shape
// can change quickly while the product is still being discovered.
// IDs are immutable opaque strings; usernames are mutable and unique.
// Dates are ISO strings (what Firestore/JSON APIs will hand back anyway).

export type ID = string
export type ISODate = string

// ---------- Users & social graph ----------

/** Public-safe profile. Email/phone must NEVER live on this object (see SECURITY_REQUIREMENTS.md). */
export interface User {
  id: ID
  username: string // unique, without the @
  displayName: string
  photoUrl: string
  bio?: string
  city?: string
  country?: string // ISO 3166 alpha-2
  createdAt: ISODate
}

/** `pending` = follow request to a private profile awaiting approval. */
export interface Follow {
  followerId: ID
  followeeId: ID
  status: 'active' | 'pending'
  createdAt: ISODate
}

/** How the viewer relates to a profile. Derived, never stored. */
export type Relationship = 'self' | 'mutual' | 'following' | 'followed_by' | 'requested' | 'none'

// ---------- Cafés, menu, events ----------

export interface Cafe {
  id: ID
  name: string
  city: string
  country: string
  area: string // neighbourhood / terminal — used for approximate plan locations
  lat: number
  lng: number
  coverPhotoUrl: string
  tags: string[]
  airport?: { code: string; terminal?: string; airside?: boolean }
  /** Claimed = a verified café representative runs the official page (future paid layer). */
  claimStatus: 'unclaimed' | 'claimed'
  business?: CafeBusinessProfile // only meaningful when claimed
}

/** Café-supplied info. Business contact details are public by design — never staff personal data. */
export interface CafeBusinessProfile {
  about?: string
  hours?: string
  website?: string
  instagram?: string
}

/** Highlight categories are data (seeded), so new kinds need no component changes. */
export interface HighlightType {
  id: string
  label: string // e.g. "New on the Menu"
  icon: string
}

/** Café-owned content. Always rendered apart from community content. */
export interface CafeHighlight {
  id: ID
  cafeId: ID
  typeId: string // HighlightType.id; unknown ids still render with a generic label
  title: string
  body: string
  photoUrl?: string
  startsAt?: ISODate
  endsAt?: ISODate // hidden after this date
  createdAt: ISODate
}

export type ItemCategory = 'coffee' | 'tea' | 'cold_drink' | 'pastry' | 'dessert' | 'food' | 'other'

/** An item on a specific café's menu. The same drink at two cafés = two items.
 *  `tags` carry cross-café concepts (e.g. "tiramisu") that badges can count. */
export interface MenuItem {
  id: ID
  cafeId: ID
  name: string
  category: ItemCategory
  tags: string[]
  /** Optional cross-café concept, e.g. "spanish_latte" or "tiramisu". No global catalogue yet. */
  normalizedKey?: string
}

export interface CafeEvent {
  id: ID
  cafeId: ID
  hostUserId?: ID
  title: string
  description: string
  startsAt: ISODate
  coverPhotoUrl?: string
}

export interface EventAttendance {
  eventId: ID
  userId: ID
  status: 'interested' | 'going' | 'attended'
  recommended?: boolean
}

// ---------- Visits (core object) ----------

export interface VisitPhoto {
  id: ID
  url: string
  menuItemId?: ID // optionally tied to one of the visit's items
}

export interface VisitItem {
  menuItemId: ID
  quantity: number // each unit counts as one consumption
}

/** Positive recognition of a staff member, written by the visitor. Unverified user-generated text.
 *  Deliberately no rating/score field: shout-outs are never negative or ranked. */
export interface StaffShoutout {
  name: string // what the visitor calls them, e.g. first name
  role?: string
  message: string
}

export interface Visit {
  id: ID
  userId: ID
  cafeId: ID
  text: string // required
  photos: VisitPhoto[] // min 1
  items: VisitItem[]
  visitedAt: ISODate | null // null = retrospective visit with unknown date
  createdAt: ISODate // when posted; always set, independent of visitedAt
  // Provisional: the rating/recommendation system isn't decided. Both optional.
  rating?: 1 | 2 | 3 | 4 | 5
  recommends?: boolean
  staffShoutout?: StaffShoutout
  companionUserIds: ID[] // "who were you with": immutable user IDs; unconfirmed for now (SR-21). Counts toward the author's social badges.
  eventId?: ID
}

export interface WantToGo {
  userId: ID
  cafeId: ID
  createdAt: ISODate
}

// ---------- Plans ----------

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/** Publicly listable part of a plan. Never contains the exact café or time. */
export interface Plan {
  id: ID
  hostId: ID
  approxArea: string // e.g. "Kreuzberg, Berlin" or "DXB Terminal 3"
  date: ISODate // day only; broad
  timeOfDay: TimeOfDay
  description: string
  joinQuestion: string // exactly one host-written question
  maxAttendees?: number
  createdAt: ISODate
}

/** Locked part of a plan. Separate record so it maps to a separately-authorized
 *  document/subcollection later. Only host + accepted participants may read it. */
export interface PlanPrivateDetails {
  planId: ID
  cafeId: ID
  startsAt: ISODate
  notes?: string
}

export interface PlanJoinRequest {
  id: ID
  planId: ID
  userId: ID
  answer: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: ISODate
}

// ---------- Badges ----------

export type BadgeVerification = 'automatic' | 'mutual_confirmation' | 'evidence_required' | 'manual_review'
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

/** Stats a numeric badge rule can target. Add a key here + in computeStats to unlock new badges. */
export type StatKey =
  | 'totalVisits'
  | 'uniqueCafes'
  | 'totalConsumptions'
  | 'uniqueItems'
  | 'maxRepeatsOfOneItem'
  | 'maxVisitsToOneCafe'
  | 'uniqueCountries'
  | 'airportCafes'
  | 'visitsWithCompanions'

export type BadgeRule =
  | { kind: 'stat'; stat: StatKey; threshold: number }
  | { kind: 'tagConsumptions'; tag: string; threshold: number } // e.g. 5 tiramisus anywhere
  | { kind: 'award' } // not derivable from activity; granted via BadgeAward

/** Data-driven badge catalogue. New badges = new rows, not new components. */
export interface BadgeDefinition {
  id: ID
  name: string
  description: string
  icon: string // emoji for now; swap for artwork URLs later
  rarity: BadgeRarity
  verification: BadgeVerification
  rule: BadgeRule
  participants?: number // for social badges, how many users must confirm
  requiresProofPhoto?: boolean
}

/** A granted (or in-progress) non-automatic badge. One award can be shared by several users. */
export interface BadgeAward {
  id: ID
  badgeId: ID
  userIds: ID[]
  status: 'pending_confirmation' | 'pending_review' | 'confirmed'
  confirmations: { userId: ID; at: ISODate }[]
  proofPhotoUrls: string[] // early beta: never shown in the UI (SR-3 DEFERRED)
  cafeId?: ID
  note?: string
  awardedAt?: ISODate
  createdAt: ISODate
}
