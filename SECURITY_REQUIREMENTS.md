# Security Requirements (deferred)

The prototype has **no real security**. All data ships to the browser, and the
privacy checks in `src/domain/visibility.ts` and `src/data/api.ts` only model
product rules in the UI. Before any real users, every item below must be enforced
server-side (Firestore security rules / Storage rules / Cloud Functions / API).

**Rule for contributors:** whenever a prototype feature implies an authorization,
privacy or abuse requirement, add it here in the same change.

Status: `OPEN` = not implemented (everything, for now). `UI-MODELLED` = the prototype shows the behaviour, but nothing enforces it. `DEFERRED` = intentionally not in the early beta; revisit in the growth phase.

## Early beta policy: public profiles, public social activity

The early beta **intentionally** treats every profile and all normal social activity as public to every signed-in user: visits, badges, Want to Go, companions, staff shout-outs, recommendations and café social counts. There are no private profiles, follow requests/approvals, mutual-follow gating or friends-only visibility yet. The goal is a small community that feels active and easy to understand.

**Exception: badge proof photos are not public.** `BadgeAward.proofPhotoUrls` stays in the data model but is hidden from the UI for everyone during the early beta. The backend must not serve proof photos to other users (Storage rules: owner and reviewers only) until the mutual-follow access rule (SR-3, `DEFERRED`) is built.

The prototype's modelled privacy rules (`src/domain/visibility.ts`: relationship, private-activity filtering, proof-photo and plan-detail checks) were removed for this phase. They can be restored from git history (commit `91708e4`). All privacy requirements below are kept and marked `DEFERRED`.

**Public does not mean unsecured.** This phase simplifies product *visibility*, not database protection. Random anonymous visitors must never be able to destroy or overwrite shared data, so no open/"test mode" Firestore or Storage rules (e.g. `allow read, write: if true`), not even briefly. Even in the early beta the backend must enforce, at minimum:

- authentication for every write, with identity from the auth session (SR-10, SR-11, SR-20)
- no anonymous writes or deletes of any shared data (cafés, menus, visits, Want to Go, badges, highlights)
- users can only create/edit/delete their **own** profile, visits, Want to Go and uploads (SR-14, SR-26, SR-22)
- server-side validation of required fields and referenced IDs (SR-27, SR-28)
- private account data (email, phone) never exposed, even though profiles are public (SR-13)
- server-owned fields not client-writable: badges/awards, claim status, counters (SR-16, SR-40, SR-70)
- café content editable only by authorized café representatives, who cannot touch user content (SR-71, SR-73)
- EXIF/GPS stripping on uploads (SR-22a), and reporting, moderation and blocking before *public* beta (SR-6, SR-60, SR-74)
- reads limited to signed-in users, with basic rate limiting against scraping

## Identity & accounts

| ID | Requirement | Status |
|----|-------------|--------|
| SR-10 | Real authentication (e.g. Firebase Auth / OAuth). The prototype's "Viewing as" switcher and `cs.viewerId` localStorage key must be removed. | OPEN |
| SR-11 | Internal user IDs are immutable and server-assigned; clients can never choose or change them. | OPEN |
| SR-12 | `@username` uniqueness enforced server-side (atomic reservation, case-insensitive, reserved words). Username changes must not break references (always reference by ID). | OPEN |
| SR-13 | Email/phone never become public profile data. Store them outside the public `User` document, readable only by the owner and the backend. | OPEN |
| SR-14 | Users can only edit their own profile fields; `visibility`, counts and badges are not client-writable. | OPEN |

## Profiles & social graph

| ID | Requirement | Status |
|----|-------------|--------|
| SR-1 | Private profile content (visits, stats, Want to Go, badge progress numbers) is server-authorized: only the owner and **approved** (`active`) followers may read it. Everyone may read basic identity (name, @username, photo, bio, city/country) and earned badges. | DEFERRED (growth phase: private profiles & granular activity visibility) |
| SR-15 | Follow requests to private profiles stay `pending` until the target approves; only the target can approve. Only the follower can create/delete their follow edge. | DEFERRED (growth phase: follower approval) |
| SR-16 | Follower/following/mutual counts computed server-side, not client-writable. | OPEN |
| SR-5 | Being a plan host (or a plan participant) does **not** grant access to anyone's private profile. Plan relationships and follow relationships are separate authorization paths. | DEFERRED (applies once private profiles exist) |
| SR-17 | No private DMs exist; do not introduce a hidden messaging channel via comments/plans without moderation review. | OPEN |

## Visits & media

| ID | Requirement | Status |
|----|-------------|--------|
| SR-20 | Visit creation requires an authenticated user; `userId` is taken from the auth session, never from the client payload (the prototype passes the "Viewing as" ID). | OPEN |
| SR-26 | Only the author can edit/delete their own visits; `userId`, `createdAt` and `id` are immutable after creation. | OPEN |
| SR-27 | Server-side validation of required fields: café present, ≥1 photo, non-empty text (trimmed, length-limited), quantities are positive integers, `createdAt` server-generated, `visitedAt` optional/nullable and not in the future. Client checks (`validateVisit`) are UX only. | UI-MODELLED |
| SR-28 | Server validates referential integrity: `cafeId` exists; every `menuItemId` exists and belongs to that café; photo↔item links point at items in the same visit (see SR-25). The prototype's mock API checks this, but only in the browser. | UI-MODELLED |
| SR-29 | Visit documents of a private profile are readable only per SR-1. This also applies to derived views (café pages, feeds, "people you follow visited", stats/badge progress) — aggregates must not leak private visits. | DEFERRED (growth phase: granular activity visibility) |
| SR-21 | Tagged companions ("Who were you with?") must be able to confirm the tag or remove themselves before broader/public use. Unconfirmed tags never count toward the *tagged* user's stats or badges. (Today they count only toward the author's Social Sipper.) | OPEN |
| SR-81 | Users must not be able to falsely associate others with visits: tag only people who can plausibly be tagged (e.g. mutual follows or accepted plan participants), rate-limit tagging, allow reporting, and require confirmation before a tag becomes public. Server validates companion IDs exist, aren't the author, and aren't blocked. | OPEN |
| SR-82 | Visibility of tagged companions respects profile privacy and blocks: a private companion is only named to the visit author, the companion themselves, and the companion's approved followers. Everyone else sees at most "+N other". The same rule applies to "was there too" lists on profiles. | DEFERRED (growth phase: private profiles / mutual-follow visibility) |
| SR-22 | Media ownership: uploads go to an owner-scoped Storage path; only the owner can write/delete; enforce size, count and MIME/type limits; a visit may only reference photos its author uploaded. | OPEN |
| SR-22a | Deliberate EXIF/location metadata policy before production: strip GPS and device metadata from served images by default; decide explicitly whether any capture time/location is kept (server-side only, never public). | OPEN |
| SR-24 | User-added menu items ("Not listed? Add an item") are untrusted: server-side length/character limits, rate limits, moderation before they appear on the café's shared menu, and dedupe/merge tooling. | OPEN |
| SR-25 | Visit photo ↔ item links must reference items within the same visit (validated server-side; the prototype checks it in `validateVisit`). | UI-MODELLED |
| SR-23 | Photos of a private profile's visits are only readable by the users allowed by SR-1 (Storage rules, not just hidden URLs). | DEFERRED (growth phase: private profiles) |

## Cafés, claimed pages & staff shout-outs

| ID | Requirement | Status |
|----|-------------|--------|
| SR-70 | Café claims must be verified (proof of ownership/authority, manual review) before `claimStatus` becomes `claimed`. `claimStatus` is never client-writable. | OPEN |
| SR-71 | Only authorized café representatives (per-café, revocable roles) may create or edit official content: business profile and highlights. | OPEN |
| SR-72 | Official/paid café content must always stay clearly labelled and visually distinct from community content, and never be mixed into community sections or feeds without a label. Any paid placement is disclosed. | UI-MODELLED ("From the Café" block) |
| SR-73 | Café owners cannot edit, hide, reorder-to-suppress, or delete user visits, recommendations, community photos, staff shout-outs or social signals through business controls. Removal only via the general moderation process, with an audit trail. | UI-MODELLED (no such controls exist) |
| SR-74 | Staff shout-outs are unverified user-generated claims. Reporting and moderation are required before public beta, and so is filtering for harassment or disguised negativity. The product stays positive-only: no staff ratings, negative reviews or rankings. | OPEN |
| SR-75 | Employee personal information handled carefully: first name and optional role only. No surnames, photos, contact details or shift times. No searchable staff index or staff profiles. Staff (or the café, on their behalf) can request removal of shout-outs naming them. | OPEN |
| SR-76 | Want to Go visibility respects profile privacy and blocks: a private user's Want to Go (including their contribution to counts and "want to go" lists) is visible only to approved followers. | DEFERRED (growth phase: private profiles) |
| SR-77 | Café social aggregates (visit counts, want-to-go counts, "people you follow have been here", recommendations, "tried here", photos, shout-outs) are computed server-side from data the viewer is authorized to see, so private activity can't be inferred from counts or lists (extends SR-29). | DEFERRED (growth phase: granular activity visibility) |

## Plans

| ID | Requirement | Status |
|----|-------------|--------|
| SR-2 | Exact café and exact time of a plan (`PlanPrivateDetails`) are readable only by the host and **accepted** participants. Stored separately from the public plan document so rules can protect it. | UI-MODELLED |
| SR-30 | Public plan exposes only approximate area, broad time of day, description, host, attendee count. | UI-MODELLED (data model) |
| SR-31 | Join-request answers are visible only to the host (and the requester). Only the host can accept/decline. | OPEN |
| SR-32 | Rate-limit plan creation and join requests to prevent spam and location-probing. | OPEN |

## Badges

| ID | Requirement | Status |
|----|-------------|--------|
| SR-3 | Badge proof photos are visible between two users only when **both follow each other** (mutual). Enforced in Storage rules, not by omitting URLs client-side. | DEFERRED (growth phase: proof-photo access rules / mutual-follow visibility) |
| SR-40 | Badges are awarded only by the server (automatic evaluation, mutual confirmation or review). Clients cannot write `BadgeAward`. | OPEN |
| SR-41 | Mutual-confirmation badges require independent confirmation from every participant's own authenticated session. | OPEN |
| SR-42 | Evidence/manual-review badges need a moderation queue and anti-fraud checks (duplicate photos, collusion rings). | OPEN |

## Location & airport / serendipity features

| ID | Requirement | Status |
|----|-------------|--------|
| SR-50 | Never broadcast a user's exact real-time location, gate, or flight. Airport discovery shows at most airport/terminal and a broad time window. | OPEN |
| SR-51 | Location-based discovery must resist trilateration (coarse buckets, no distance-to-user values). | OPEN |

## Safety & abuse (required before public beta)

| ID | Requirement | Status |
|----|-------------|--------|
| SR-6 | Blocking: a blocked user cannot see the blocker's profile content, plans, want-to-go overlap, or request to join their plans. Blocks override every other visibility rule. | OPEN |
| SR-60 | Reporting for users, visits, photos, plans and events, with a moderation workflow. | OPEN |
| SR-61 | Social-overlap hints ("You and @x both want to go") only reveal users the viewer is allowed to see, and respect blocks and private profiles. | DEFERRED (growth phase; early beta shows overlap with everyone) |
| SR-62 | Prototype `localStorage` data is untrusted and must never be migrated into production as-is. | OPEN |
