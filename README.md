# Universal Game Manager (UGM)

Local-first multi-game manager for Pixel Worlds and Sunflower Land.

## Current modules

### Pixel Worlds
- Inventory, worlds, and event tracking.
- Pixel Worlds Exchange (PWE) market snapshot import, history, and trend analysis.
- PWE prices remain blank until a public/API source is independently verified. Manual imports are labeled as user-provided data.

### Sunflower Land
- Inventory, crop, and goal tracking.
- Seasonal crop reference and season assignment for market snapshots.
- SFL.world public P2P price-feed history and selling-signal analysis.
- FLOWER target-progress and transaction reconciliation display.

## Data and privacy
- Browser IndexedDB is the application's local storage.
- JSON backup/restore is manual. Export backups regularly before changing devices or clearing browser data.
- Backups are not encrypted. Do not put passwords, tokens, wallet secrets, or other credentials in them.
- Public market snapshots may be synchronized to the UGM shared-data registry. Private wallet balances and transaction details must not be copied into public/shared market tables.
- No automatic cloud or cross-device sync is currently guaranteed by this repository.

## Market data sources
- Sunflower Land: https://sfl.world/api/v1/prices
- Pixel Worlds: no public PWE price API has been verified; keep prices blank until a source is validated.
- Pixel Worlds announcements: https://steamcommunity.com/app/636040/allnews/

## Development and validation
Run a local static server from the repository directory:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Service-worker/PWA behavior requires HTTPS or localhost.

Changes to market validation and seasonal analysis are being reviewed in open pull requests. Do not treat an unmerged PR as deployed production behavior. Browser/IndexedDB runtime and backup-restore round-trip tests remain required before merging those changes.
