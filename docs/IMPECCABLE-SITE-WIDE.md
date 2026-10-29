# Impeccable — site-wide AI-template cleanup

This work covers the deployed vivlica.com source repository `ka1tetsu/hikaku-labo`, not a separate deployment at the former name.

## Installation for a coding agent
Run from the project root:
```sh
npx impeccable@4.8.0 install -y --providers=codex --scope=project
```
Then run `/impeccable init` in a supported coding agent (or `$impeccable` in Codex). `PRODUCT.md` and `DESIGN.md` contain the initial verified context. The CI scanner does not install agent hooks.

## Scans
```sh
npm run design:scan
npx --yes impeccable@4.8.0 detect --github src/
npx --yes impeccable@4.8.0 detect --viewport 390x844 https://vivlica.com
```
Impeccable currently checks 62 deterministic rules. Exit 0 = no primary findings, 2 = primary findings exist, 1 = scan failure. See https://impeccable.style/docs/detector/.

The `impeccable-design.yml` GitHub workflow performs **full checkout scans** of both base and head with pinned CLI 4.8.0; it uploads both JSON reports and rejects any increase in primary findings for a particular file/rule. This gives a zero-regression gate without hiding legacy findings or breaking all CI until old debt is fixed. An unrun workflow is not verification that the scan passed.

## Editorial changes
Site-wide Japanese-first typography; flat forest/mineral hero surfaces instead of decorative gradients; lower-shadow reading surfaces; the home directory changed from generic rounded-card tiles to editorial dividers; chat recommendation panels flattened into text-first rows. Existing pricing, forms, affiliate URLs, analytics and legal disclosures must stay intact.

## Before release
Run `npm run lint`, `npm run test:all`, `npm run build`, `npm run verify:build`, inspect root /compare /life /tools /travel /travel/hotels and guides at 375/768/1440 widths, and review both mobile/desktop screenshots. The detector is not a substitute for live visual or accessibility inspection.
