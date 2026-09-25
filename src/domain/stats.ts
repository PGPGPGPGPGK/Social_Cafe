import type { BadgeAward, BadgeDefinition, Cafe, MenuItem, StatKey, Visit } from './types.ts'

export type CafeStats = Record<StatKey, number>

// ponytail: computed from the full visit list on every read. Fine for seed data;
// with Firestore, store these as counters updated server-side on visit write.
export function computeStats(visits: Visit[], cafes: Map<string, Cafe>): CafeStats {
  const perCafe = new Map<string, number>()
  const perItem = new Map<string, number>()
  let totalConsumptions = 0
  let visitsWithCompanions = 0

  for (const v of visits) {
    perCafe.set(v.cafeId, (perCafe.get(v.cafeId) ?? 0) + 1)
    if (v.companionUserIds.length) visitsWithCompanions++
    for (const it of v.items) {
      perItem.set(it.menuItemId, (perItem.get(it.menuItemId) ?? 0) + it.quantity)
      totalConsumptions += it.quantity
    }
  }

  const visitedCafes = [...perCafe.keys()].map((id) => cafes.get(id)).filter((c) => c !== undefined)

  return {
    totalVisits: visits.length,
    uniqueCafes: perCafe.size,
    totalConsumptions,
    uniqueItems: perItem.size,
    maxRepeatsOfOneItem: Math.max(0, ...perItem.values()),
    maxVisitsToOneCafe: Math.max(0, ...perCafe.values()),
    uniqueCountries: new Set(visitedCafes.map((c) => c.country)).size,
    airportCafes: visitedCafes.filter((c) => c.airport).length,
    visitsWithCompanions,
  }
}

export function countTagConsumptions(visits: Visit[], items: Map<string, MenuItem>, tag: string): number {
  let n = 0
  for (const v of visits) for (const it of v.items) if (items.get(it.menuItemId)?.tags.includes(tag)) n += it.quantity
  return n
}

export interface BadgeProgress {
  badge: BadgeDefinition
  earned: boolean
  current?: number // numeric badges only
  target?: number
  award?: BadgeAward // award-based badges only
}

/** Evaluates every badge definition for one user. Unknown future rule kinds simply show as locked. */
export function evaluateBadges(
  defs: BadgeDefinition[],
  stats: CafeStats,
  visits: Visit[],
  items: Map<string, MenuItem>,
  awards: BadgeAward[],
): BadgeProgress[] {
  return defs.map((badge) => {
    const r = badge.rule
    if (r.kind === 'stat' || r.kind === 'tagConsumptions') {
      const current = r.kind === 'stat' ? stats[r.stat] : countTagConsumptions(visits, items, r.tag)
      return { badge, earned: current >= r.threshold, current, target: r.threshold }
    }
    const award = awards.find((a) => a.badgeId === badge.id)
    return { badge, earned: award?.status === 'confirmed', award }
  })
}
