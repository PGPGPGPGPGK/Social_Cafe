// Run: npm run check   — fails loudly if the visit/consumption counting drifts.
import { computeStats } from './stats.ts'
import type { Cafe, Visit } from './types.ts'

const cafeA = { id: 'A', country: 'DE' } as Cafe
const visit = (i: number, item: string): Visit => ({
  id: `v${i}`, userId: 'u', cafeId: 'A', text: '.', photos: [{ id: 'p', url: '' }],
  items: [{ menuItemId: item, quantity: 1 }], visitedAt: i === 0 ? null : '2026-01-01', createdAt: '2026-01-01',
  companionUserIds: [],
})
// Spec example: Café A x5 — Spanish Latte x4, Cold Brew x1.
const visits = [0, 1, 2, 3].map((i) => visit(i, 'latte')).concat(visit(4, 'coldbrew'))
const s = computeStats(visits, new Map([['A', cafeA]]))

const expect = { totalVisits: 5, uniqueCafes: 1, totalConsumptions: 5, uniqueItems: 2, maxRepeatsOfOneItem: 4, maxVisitsToOneCafe: 5 }
for (const [k, want] of Object.entries(expect)) {
  const got = s[k as keyof typeof s]
  if (got !== want) throw new Error(`${k}: expected ${want}, got ${got}`)
}
console.log('stats check ok', s)

// Visit publish rules
import { validateVisit } from './visits.ts'
const ok = { cafeId: 'A', text: 'nice', photos: [{ id: 'p', url: '' }], items: [], visitedAt: null, companionUserIds: [] }
const cases: [string, object, number][] = [
  ['valid retrospective (no date)', {}, 0],
  ['no photo', { photos: [] }, 1],
  ['blank text', { text: '  ' }, 1],
  ['no café', { cafeId: '' }, 1],
  ['future date', { visitedAt: '2099-01-01' }, 1],
  ['today is fine', { visitedAt: '2026-09-25' }, 0],
  ['photo linked to missing item', { photos: [{ id: 'p', url: '', menuItemId: 'x' }] }, 1],
  ['shout-out ok', { staffShoutout: { name: 'Marta', message: 'Remembered my order' } }, 0],
  ['shout-out without message', { staffShoutout: { name: 'Marta', message: ' ' } }, 1],
  ['shout-out too long', { staffShoutout: { name: 'M', message: 'x'.repeat(281) } }, 1],
]
for (const [name, patch, want] of cases) {
  const got = validateVisit({ ...ok, ...patch }, '2026-09-25').length
  if (got !== want) throw new Error(`validateVisit "${name}": expected ${want} errors, got ${got}`)
}
console.log('visit validation check ok')

// Quantity counts toward consumptions: 1 visit, Spanish Latte x2 + Tiramisu x1 -> 3 consumptions, 2 unique items
const one = computeStats([{ ...visit(0, 'latte'), items: [{ menuItemId: 'latte', quantity: 2 }, { menuItemId: 'tiramisu', quantity: 1 }] }], new Map([['A', cafeA]]))
if (one.totalVisits !== 1 || one.totalConsumptions !== 3 || one.uniqueItems !== 2) throw new Error(`quantity counting wrong: ${JSON.stringify(one)}`)
console.log('quantity check ok')

// Companions: a visit with ≥1 companion counts once toward visitsWithCompanions (Social Sipper),
// regardless of how many people were tagged or whether visitedAt is known.
const social = computeStats([
  { ...visit(0, 'latte'), companionUserIds: ['u1', 'u2'] }, // retrospective (visitedAt null), 2 companions
  { ...visit(1, 'latte'), companionUserIds: ['u1'] },
  visit(2, 'latte'), // alone
], new Map([['A', cafeA]]))
if (social.visitsWithCompanions !== 2) throw new Error(`companion counting wrong: ${social.visitsWithCompanions}`)
console.log('companion check ok')

// Social sentence joining
import { listText } from '../components/format.ts'
for (const [parts, want] of [[['You'], 'You'], [['You', '@a'], 'You and @a'], [['You', '@a', '@b'], 'You, @a and @b']] as const) {
  if (listText([...parts]) !== want) throw new Error(`listText ${JSON.stringify(parts)}: got "${listText([...parts])}"`)
}
console.log('listText check ok')
