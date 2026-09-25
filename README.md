# Social Café

Mobile-first prototype of a social café discovery app: discover cafés through people, log visits, collect badges, make real-world plans.

**Live:** https://pgpgpgpgpgk.github.io/Social_Cafe/

Prototype only — mock seed data, localStorage persistence, no backend or real security. See [SECURITY_REQUIREMENTS.md](SECURITY_REQUIREMENTS.md) for everything deferred.

## Run locally

```
npm install
npm run dev      # open the printed URL (use devtools' mobile view)
npm run check    # domain logic checks (stats, visit validation, companions)
npm run build
```

Use the "Viewing as" switcher at the top to see the app as different seed users (privacy states), and "Reset data" to clear locally created visits and Want to Go changes.

## Structure

- `src/domain/` — types, stats/badge evaluation, visibility rules, visit validation
- `src/data/` — `seed.ts` (mock data) and `api.ts`, the only module screens use; swap it for Firestore/API later
- `src/screens/` — Profile, Discover, Café detail, Add visit
- `src/components/` — shared UI bits

Pushes to `main` deploy automatically via GitHub Actions.
