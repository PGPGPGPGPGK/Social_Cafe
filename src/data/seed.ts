// Mock seed data. Only src/data/api.ts may import this file.
// Images are placeholder services (picsum / pravatar) — needs network.
import type {
  BadgeAward, BadgeDefinition, Cafe, CafeEvent, CafeHighlight, HighlightType, EventAttendance, Follow, MenuItem, Plan,
  PlanJoinRequest, PlanPrivateDetails, User, Visit, WantToGo,
} from '../domain/types.ts'

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`
const avatar = (n: number) => `https://i.pravatar.cc/200?img=${n}`

export const users: User[] = [
  { id: 'u_lina', username: 'lina.sips', displayName: 'Lina Haddad', photoUrl: avatar(47), bio: 'Flat whites, long walks, longer layovers.', city: 'Berlin', country: 'DE', createdAt: '2025-11-02T10:00:00Z' },
  { id: 'u_omar', username: 'omar', displayName: 'Omar Farouk', photoUrl: avatar(12), bio: 'Always in transit. Always caffeinated.', city: 'Dubai', country: 'AE', createdAt: '2025-10-14T08:00:00Z' },
  { id: 'u_sofia', username: 'sofia.nata', displayName: 'Sofia Marques', photoUrl: avatar(45), bio: 'Pastel de nata completionist.', city: 'Lisbon', country: 'PT', createdAt: '2026-01-20T12:00:00Z' },
  { id: 'u_mei', username: 'meiko', displayName: 'Mei Tanaka', photoUrl: avatar(44), city: 'Tokyo', country: 'JP', createdAt: '2026-02-03T09:00:00Z' },
  { id: 'u_jonas', username: 'jonas_k', displayName: 'Jonas Krüger', photoUrl: avatar(15), bio: 'Filter coffee only.', city: 'Berlin', country: 'DE', createdAt: '2026-03-11T15:00:00Z' },
  { id: 'u_amara', username: 'amara', displayName: 'Amara Okafor', photoUrl: avatar(32), bio: 'Weekend café crawls in London.', city: 'London', country: 'GB', createdAt: '2026-04-01T11:00:00Z' },
]

export const follows: Follow[] = [
  ['u_lina', 'u_omar'], ['u_omar', 'u_lina'], // mutual
  ['u_lina', 'u_amara'], ['u_amara', 'u_lina'], // mutual
  ['u_lina', 'u_sofia'], // one-way
  ['u_mei', 'u_lina'],
  ['u_omar', 'u_sofia'], ['u_sofia', 'u_omar'],
  ['u_jonas', 'u_omar'], ['u_omar', 'u_jonas'],
].map(([followerId, followeeId]) => ({ followerId, followeeId, status: 'active' as Follow['status'], createdAt: '2026-05-01T00:00:00Z' }))
  .concat({ followerId: 'u_lina', followeeId: 'u_jonas', status: 'pending', createdAt: '2026-09-20T00:00:00Z' })

export const cafes: Cafe[] = [
  { id: 'c_kiez', name: 'Kiez Kaffee', city: 'Berlin', country: 'DE', area: 'Kreuzberg', lat: 52.4986, lng: 13.4180, coverPhotoUrl: img('kiez'), tags: ['specialty', 'laptop-friendly'], claimStatus: 'claimed',
    business: { about: 'Neighbourhood specialty bar roasting small lots in Neukölln.', hours: 'Mon–Fri 8–18 · Sat–Sun 9–18', website: 'kiezkaffee.example', instagram: '@kiezkaffee' } },
  { id: 'c_milch', name: 'Milchbar Mitte', city: 'Berlin', country: 'DE', area: 'Mitte', lat: 52.5270, lng: 13.4010, coverPhotoUrl: img('milch'), tags: ['brunch'], claimStatus: 'unclaimed' },
  { id: 'c_dxb', name: 'Terminal 3 Roastery', city: 'Dubai', country: 'AE', area: 'DXB Terminal 3', lat: 25.2528, lng: 55.3644, coverPhotoUrl: img('dxb'), tags: ['airport', '24h'], airport: { code: 'DXB', terminal: '3', airside: true }, claimStatus: 'unclaimed' },
  { id: 'c_lhr', name: 'Gate Brew', city: 'London', country: 'GB', area: 'LHR Terminal 5', lat: 51.4723, lng: -0.4877, coverPhotoUrl: img('lhr'), tags: ['airport'], airport: { code: 'LHR', terminal: '5', airside: true }, claimStatus: 'unclaimed' },
  { id: 'c_alfama', name: 'Pastelaria Alfama', city: 'Lisbon', country: 'PT', area: 'Alfama', lat: 38.7116, lng: -9.1300, coverPhotoUrl: img('alfama'), tags: ['bakery', 'historic'], claimStatus: 'claimed',
    business: { about: 'Family bakery since 1962. Natas baked every 40 minutes.', hours: 'Daily 7–20' } },
  { id: 'c_yanaka', name: 'Kissa Yanaka', city: 'Tokyo', country: 'JP', area: 'Yanaka', lat: 35.7266, lng: 139.7670, coverPhotoUrl: img('yanaka'), tags: ['kissaten', 'quiet'], claimStatus: 'unclaimed' },
  { id: 'c_trast', name: 'Caffè Trastevere', city: 'Rome', country: 'IT', area: 'Trastevere', lat: 41.8893, lng: 12.4700, coverPhotoUrl: img('trast'), tags: ['espresso bar'], claimStatus: 'unclaimed' },
  { id: 'c_galata', name: 'Galata Kahve', city: 'Istanbul', country: 'TR', area: 'Beyoğlu', lat: 41.0256, lng: 28.9741, coverPhotoUrl: img('galata'), tags: ['turkish coffee', 'view'], claimStatus: 'unclaimed' },
  { id: 'c_bean', name: 'Nørrebro Bean', city: 'Copenhagen', country: 'DK', area: 'Nørrebro', lat: 55.6930, lng: 12.5490, coverPhotoUrl: img('bean'), tags: ['specialty', 'cinnamon buns'], claimStatus: 'unclaimed' },
  { id: 'c_shore', name: 'Shoreditch Grind', city: 'London', country: 'GB', area: 'Shoreditch', lat: 51.5250, lng: -0.0780, coverPhotoUrl: img('shore'), tags: ['late-night'], claimStatus: 'unclaimed' },
]

const item = (cafeId: string, key: string, name: string, category: MenuItem['category'], tags: string[] = []): MenuItem =>
  ({ id: `${cafeId}:${key}`, cafeId, name, category, tags, normalizedKey: key }) // seed keys double as concepts

export const menuItems: MenuItem[] = [
  item('c_kiez', 'spanish_latte', 'Spanish Latte', 'coffee', ['latte']),
  item('c_kiez', 'cold_brew', 'Cold Brew', 'cold_drink'),
  item('c_kiez', 'cardamom_bun', 'Cardamom Bun', 'pastry', ['bun']),
  item('c_milch', 'flat_white', 'Flat White', 'coffee'),
  item('c_milch', 'shakshuka', 'Shakshuka', 'food'),
  item('c_dxb', 'karak', 'Karak Chai', 'tea'),
  item('c_dxb', 'date_latte', 'Date Latte', 'coffee', ['latte']),
  item('c_lhr', 'americano', 'Americano', 'coffee'),
  item('c_alfama', 'nata', 'Pastel de Nata', 'pastry', ['pastel_de_nata']),
  item('c_alfama', 'bica', 'Bica', 'coffee', ['espresso']),
  item('c_yanaka', 'hand_drip', 'Hand Drip Blend', 'coffee'),
  item('c_yanaka', 'tiramisu', 'Matcha Tiramisu', 'dessert', ['tiramisu']),
  item('c_trast', 'espresso', 'Espresso', 'coffee', ['espresso']),
  item('c_trast', 'tiramisu', 'Tiramisù della Casa', 'dessert', ['tiramisu']),
  item('c_galata', 'turkish', 'Turkish Coffee', 'coffee'),
  item('c_bean', 'kanelsnegl', 'Kanelsnegl', 'pastry', ['bun']),
  item('c_shore', 'tiramisu', 'Espresso Tiramisu', 'dessert', ['tiramisu']),
  item('c_shore', 'oat_cortado', 'Oat Cortado', 'coffee'),
]

export const events: CafeEvent[] = [
  { id: 'e_latteart', cafeId: 'c_kiez', title: 'Latte Art Throwdown', description: 'Friendly latte art battle — bring your worst hearts.', startsAt: '2026-08-14T18:00:00Z', coverPhotoUrl: img('throwdown') },
  { id: 'e_cupping', cafeId: 'c_bean', title: 'Sunday Cupping', description: 'Taste four Kenyan lots side by side.', startsAt: '2026-10-11T10:00:00Z', coverPhotoUrl: img('cupping') },
]

export const eventAttendance: EventAttendance[] = [
  { eventId: 'e_latteart', userId: 'u_lina', status: 'attended', recommended: true },
  { eventId: 'e_cupping', userId: 'u_lina', status: 'interested' },
  { eventId: 'e_cupping', userId: 'u_sofia', status: 'going' },
]

// Compact visit builder: items as [menuItemId, qty?]
let n = 0
function visit(userId: string, cafeId: string, visitedAt: string | null, text: string,
  items: [string, number?][], extra: Partial<Visit> = {}): Visit {
  n++
  return {
    id: `v${n}`, userId, cafeId, text, visitedAt,
    createdAt: extra.createdAt ?? visitedAt ?? '2026-09-01T12:00:00Z',
    photos: [{ id: `ph${n}`, url: img(`visit${n}`), menuItemId: items[0] && `${cafeId}:${items[0][0]}` }],
    items: items.map(([k, q]) => ({ menuItemId: `${cafeId}:${k}`, quantity: q ?? 1 })),
    companionUserIds: [], ...extra,
  }
}

export const visits: Visit[] = [
  // Lina — Kiez Kaffee x5: Spanish Latte x4 + Cold Brew x1 (the spec counting example) + one bun
  visit('u_lina', 'c_kiez', '2026-03-02T09:10:00Z', 'Found my new local. The Spanish latte is dangerously good.', [['spanish_latte'], ['cardamom_bun']], { rating: 5, recommends: true, staffShoutout: { name: 'Marta', role: 'Barista', message: 'Remembered my order on my second visit.' } }),
  visit('u_lina', 'c_kiez', '2026-04-11T08:40:00Z', 'Same order, same window seat.', [['spanish_latte']]),
  visit('u_lina', 'c_kiez', '2026-06-20T15:00:00Z', 'Too hot for anything but cold brew.', [['cold_brew']]),
  visit('u_lina', 'c_kiez', '2026-08-14T18:30:00Z', 'Latte art throwdown! My heart looked like a potato.', [['spanish_latte']], { eventId: 'e_latteart', companionUserIds: ['u_jonas'] }),
  visit('u_lina', 'c_kiez', '2026-09-22T09:00:00Z', 'Monday ritual.', [['spanish_latte']]),
  visit('u_lina', 'c_milch', '2026-05-03T11:00:00Z', 'Shakshuka brunch with Amara.', [['flat_white'], ['shakshuka']], { companionUserIds: ['u_amara'], rating: 4 }),
  visit('u_lina', 'c_dxb', '2026-07-08T03:20:00Z', '4-hour layover turned into the best chat of the trip. Met @omar here through a plan!', [['karak', 2], ['date_latte']], { companionUserIds: ['u_omar'], rating: 5, recommends: true }),
  visit('u_lina', 'c_lhr', '2026-07-09T07:15:00Z', 'Jet-lagged americano. It did its job.', [['americano']], { rating: 3 }),
  visit('u_lina', 'c_alfama', '2026-02-10T10:00:00Z', 'Three natas in one sitting. No regrets.', [['nata', 3], ['bica']], { rating: 5, recommends: true }),
  visit('u_lina', 'c_trast', '2026-06-01T16:00:00Z', 'The tiramisù that started the hunt.', [['tiramisu'], ['espresso']], { rating: 5, recommends: true }),
  // Retrospective: visited years ago, date unknown
  visit('u_lina', 'c_yanaka', null, 'Throwback to Tokyo — tiny kissaten, perfect matcha tiramisu.', [['tiramisu'], ['hand_drip']], { createdAt: '2026-09-18T20:00:00Z', rating: 5 }),

  visit('u_omar', 'c_dxb', '2026-07-08T03:20:00Z', 'Layover buddy acquired ☕✈️', [['karak']], { companionUserIds: ['u_lina'] }),
  visit('u_omar', 'c_galata', '2026-08-02T17:00:00Z', 'Sunset + Turkish coffee.', [['turkish']], { rating: 5 }),
  visit('u_sofia', 'c_alfama', '2026-09-10T09:00:00Z', 'Nata #214.', [['nata', 2]], { rating: 5, recommends: true, staffShoutout: { name: 'Rosa', message: 'Warm natas straight from the oven and a warmer welcome.' } }),
  visit('u_sofia', 'c_trast', '2026-08-20T16:00:00Z', 'Came for espresso, stayed for the tiramisù.', [['tiramisu'], ['espresso']], { recommends: true, staffShoutout: { name: 'Gianni', role: 'Host', message: 'Made a table of strangers feel like family.' } }),
  visit('u_amara', 'c_kiez', '2026-09-05T10:00:00Z', 'Finally tried Lina’s spot. That cardamom bun!', [['cardamom_bun'], ['spanish_latte']], { rating: 5, recommends: true, staffShoutout: { name: 'Marta', role: 'Barista', message: 'Talked me through every bean on the shelf.' } }),
  visit('u_omar', 'c_kiez', '2026-09-19T15:00:00Z', 'Scouting for our plan. Approved.', [['cold_brew']], { recommends: true }),
  visit('u_jonas', 'c_kiez', '2026-09-15T08:00:00Z', 'Filter was fine. Cold brew better.', [['cold_brew']]),
  visit('u_mei', 'c_yanaka', '2026-09-01T14:00:00Z', 'My quiet place.', [['hand_drip']]),
  visit('u_amara', 'c_shore', '2026-09-12T21:00:00Z', 'Late-night tiramisu run.', [['tiramisu'], ['oat_cortado']], { rating: 4 }),
]

export const wantToGo: WantToGo[] = [
  ['u_lina', 'c_galata'], ['u_lina', 'c_bean'],
  ['u_omar', 'c_bean'], ['u_amara', 'c_galata'], ['u_sofia', 'c_bean'], ['u_mei', 'c_galata'],
].map(([userId, cafeId]) => ({ userId, cafeId, createdAt: '2026-09-01T00:00:00Z' }))

export const plans: Plan[] = [
  { id: 'p_kreuz', hostId: 'u_omar', approxArea: 'Kreuzberg, Berlin', date: '2026-10-03', timeOfDay: 'afternoon', description: 'In Berlin for a weekend — who wants to show me their favourite flat white?', joinQuestion: 'What is your go-to order?', maxAttendees: 4, createdAt: '2026-09-20T10:00:00Z' },
  { id: 'p_lisbon', hostId: 'u_sofia', approxArea: 'Alfama, Lisbon', date: '2026-10-05', timeOfDay: 'morning', description: 'Nata tasting crawl, 3 bakeries, 1 verdict.', joinQuestion: 'Custard: warm or room temp?', createdAt: '2026-09-21T10:00:00Z' },
]

export const planPrivateDetails: PlanPrivateDetails[] = [
  { planId: 'p_kreuz', cafeId: 'c_kiez', startsAt: '2026-10-03T14:00:00Z', notes: 'Table by the window, I\'ll wear a green scarf.' },
  { planId: 'p_lisbon', cafeId: 'c_alfama', startsAt: '2026-10-05T09:30:00Z' },
]

export const planJoinRequests: PlanJoinRequest[] = [
  { id: 'jr1', planId: 'p_kreuz', userId: 'u_lina', answer: 'Spanish latte, obviously.', status: 'accepted', createdAt: '2026-09-21T09:00:00Z' },
  { id: 'jr2', planId: 'p_kreuz', userId: 'u_jonas', answer: 'V60, black.', status: 'pending', createdAt: '2026-09-22T09:00:00Z' },
]

const stat = (s: Extract<BadgeDefinition['rule'], { kind: 'stat' }>['stat'], threshold: number) => ({ kind: 'stat' as const, stat: s, threshold })

export const badgeDefinitions: BadgeDefinition[] = [
  { id: 'first_sip', name: 'First Sip', description: 'Log your first café visit.', icon: '☕', rarity: 'common', verification: 'automatic', rule: stat('totalVisits', 1) },
  { id: 'cafe_explorer', name: 'Café Explorer', description: 'Visit 5 different cafés.', icon: '🧭', rarity: 'common', verification: 'automatic', rule: stat('uniqueCafes', 5) },
  { id: 'cafe_cartographer', name: 'Café Cartographer', description: 'Visit 25 different cafés.', icon: '🗺️', rarity: 'rare', verification: 'automatic', rule: stat('uniqueCafes', 25) },
  { id: 'menu_explorer', name: 'Menu Explorer', description: 'Try 10 different menu items.', icon: '📜', rarity: 'common', verification: 'automatic', rule: stat('uniqueItems', 10) },
  { id: 'regular', name: 'Regular', description: 'Visit the same café 5 times.', icon: '🪑', rarity: 'uncommon', verification: 'automatic', rule: stat('maxVisitsToOneCafe', 5) },
  { id: 'creature_of_habit', name: 'Creature of Habit', description: 'Order the same item 4 times.', icon: '🔁', rarity: 'uncommon', verification: 'automatic', rule: stat('maxRepeatsOfOneItem', 4) },
  { id: 'tiramisu_hunter', name: 'Tiramisu Hunter', description: 'Eat 5 tiramisus, anywhere in the world.', icon: '🍰', rarity: 'uncommon', verification: 'automatic', rule: { kind: 'tagConsumptions', tag: 'tiramisu', threshold: 5 } },
  { id: 'nata_pilgrim', name: 'Nata Pilgrim', description: 'Eat 3 pastéis de nata.', icon: '🥧', rarity: 'common', verification: 'automatic', rule: { kind: 'tagConsumptions', tag: 'pastel_de_nata', threshold: 3 } },
  { id: 'social_sipper', name: 'Social Sipper', description: 'Log 3 visits with friends.', icon: '👯', rarity: 'common', verification: 'automatic', rule: stat('visitsWithCompanions', 3) },
  { id: 'airport_hopper', name: 'Airport Hopper', description: 'Visit cafés at 2 different airports.', icon: '✈️', rarity: 'uncommon', verification: 'automatic', rule: stat('airportCafes', 2) },
  { id: 'coffee_traveller', name: 'Coffee Traveller', description: 'Visit cafés in 5 countries.', icon: '🌍', rarity: 'rare', verification: 'automatic', rule: stat('uniqueCountries', 5) },
  { id: 'centurion', name: 'Centurion', description: '100 café visits.', icon: '💯', rarity: 'legendary', verification: 'automatic', rule: stat('totalVisits', 100) },
  { id: 'strangers_in_transit', name: 'Strangers in Transit', description: 'Meet a fellow traveller through the app at an airport café. Both confirm, with a photo.', icon: '🛫', rarity: 'legendary', verification: 'evidence_required', rule: { kind: 'award' }, participants: 2, requiresProofPhoto: true },
  { id: 'coffee_twins', name: 'Coffee Twins', description: 'Order the exact same thing as a friend, same café, same day. Both confirm.', icon: '👥', rarity: 'rare', verification: 'mutual_confirmation', rule: { kind: 'award' }, participants: 2 },
  { id: 'table_for_strangers', name: 'Table for Strangers', description: 'Host a plan where 3 people you had never met show up.', icon: '🫖', rarity: 'rare', verification: 'manual_review', rule: { kind: 'award' } },
]

export const badgeAwards: BadgeAward[] = [
  { id: 'ba1', badgeId: 'strangers_in_transit', userIds: ['u_lina', 'u_omar'], status: 'confirmed', cafeId: 'c_dxb',
    confirmations: [{ userId: 'u_lina', at: '2026-07-08T04:00:00Z' }, { userId: 'u_omar', at: '2026-07-08T04:05:00Z' }],
    proofPhotoUrls: [img('proof-dxb')], awardedAt: '2026-07-08T04:05:00Z', createdAt: '2026-07-08T04:00:00Z' },
  { id: 'ba2', badgeId: 'coffee_twins', userIds: ['u_lina', 'u_amara'], status: 'pending_confirmation', cafeId: 'c_milch',
    confirmations: [{ userId: 'u_lina', at: '2026-05-03T12:00:00Z' }], proofPhotoUrls: [], createdAt: '2026-05-03T12:00:00Z' },
]

// Demo photos for the Add Visit prototype — stand-ins for real uploads.
const demoSvg = (label: string, bg: string) =>
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${bg}"/>` +
    `<text x="300" y="320" font-family="system-ui,sans-serif" font-size="72" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`)

export const demoPhotos = [
  { id: 'demo1', label: 'Test 1', url: demoSvg('Test 1', '#c2410c') },
  { id: 'demo2', label: 'Test 2', url: demoSvg('Test 2', '#0f766e') },
  { id: 'demo3', label: 'Test 3', url: demoSvg('Test 3', '#6d28d9') },
]

export const highlightTypes: HighlightType[] = [
  { id: 'new_on_menu', label: 'New on the Menu', icon: '🆕' },
  { id: 'highlight_week', label: 'Highlight of the Week', icon: '⭐' },
  { id: 'upcoming_event', label: 'Upcoming Event', icon: '📅' },
  { id: 'limited_special', label: 'Limited-time Special', icon: '⏳' },
]

export const cafeHighlights: CafeHighlight[] = [
  { id: 'h1', cafeId: 'c_kiez', typeId: 'new_on_menu', title: 'Pistachio Spanish Latte', body: 'Our Spanish latte with house pistachio cream. Here to stay.', createdAt: '2026-09-20T08:00:00Z' },
  { id: 'h2', cafeId: 'c_kiez', typeId: 'highlight_week', title: 'Huila, Colombia', body: 'Red fruit and panela on filter all week.', createdAt: '2026-09-22T08:00:00Z' },
  { id: 'h3', cafeId: 'c_kiez', typeId: 'upcoming_event', title: 'Latte Art Throwdown #2', body: 'Friday from 6pm. Free entry, prizes for the worst heart.', startsAt: '2026-10-16T18:00:00Z', createdAt: '2026-09-23T08:00:00Z' },
  { id: 'h4', cafeId: 'c_kiez', typeId: 'limited_special', title: 'Pumpkin Cardamom Bun', body: 'Weekends only through October.', endsAt: '2026-10-31T23:59:00Z', createdAt: '2026-09-24T08:00:00Z' },
  { id: 'h5', cafeId: 'c_kiez', typeId: 'limited_special', title: 'Cold Brew Tonic', body: 'Summer special.', endsAt: '2026-08-31T23:59:00Z', createdAt: '2026-06-01T08:00:00Z' }, // expired: hidden
  { id: 'h6', cafeId: 'c_alfama', typeId: 'highlight_week', title: 'Lemon-zest nata', body: 'This week only, alongside the classic.', createdAt: '2026-09-21T08:00:00Z' },
]
