# FlexKnit Link — Logistics × Merchandising Control Tower

Internal SaaS platform for **FlexKnit Factories** (Antananarivo, Madagascar) that connects the **logistics/import desk** with **merchandising colleagues** around one shared, live picture of everything moving into the factory.

**Design inspiration:** the operating discipline of the world's top knitwear manufacturers — vertically-integrated, data-driven supply chains like **ERDOS Group** (Ordos), **Consinee Group** (Ningbo), **Newtimes Group**, **Zhejiang Xinao** (Tongxiang) and **Crystal International** — where merchandising, sourcing and logistics work from a single control tower instead of email threads and spreadsheets.

---

## What it does

| Module | What logistics shares | What merchandising gets |
|---|---|---|
| **Dashboard / Import Timeline** | Merchandiser-first control tower: ETA timeline, **imports by buyer**, arrival watchlist — and one consolidated **Import Timeline** of every yarn shipment *and* trims PO inbound, filterable by buyer, delay status, customs, arriving ≤7d | A single answer to "where's my material?" |
| **Imports & Shipments** | Yarn/trim imports: supplier, PO, route (Ningbo/Shanghai/Qingdao/Yantian → **Toamasina** or **Ivato**), carrier/vessel/container, ETD/ETA/ATA, progress, MBL/AWB | Live ETA with countdown, ETA-change history with reasons, document readiness, comments thread |
| **Delay management** | Coded delay reasons (customs hold, transshipment congestion, weather, docs mismatch, dye-lot re-check…) + detail notes | Instant visibility of *why* a PO is slipping and the revised plan — no more chasing |
| **Sample Tracker** | Courier booking + tracking for Proto / Fit / PP / Size-set / TOP / SMS | Kanban pipeline requested → development → courier → review → approved/redo, due-date alerts |
| **Accessories & Trims** | Buttons, zips, labels, hangtags, polybags: ordered/received qty, PO, linked import shipment | Coverage vs. required-on-floor date, shortage flags before they hit the line |
| **Delay Analytics** | Root-cause Pareto, days lost, on-time trend by month, buyer filter | Evidence for promising delivery dates to buyers |
| **Activity feed & notifications** | Every ETA change, delay, status move, receipt and comment is logged | A bell with everything that needs attention, per role |

## Sign-in & roles

Every account signs in with a password (**default `flex2026`** — shown on the login screen; change it after first sign-in). Sessions persist on the device; passwords are stored as SHA-256 hashes.

- **Super Admin** — Jeroen Stuurop (Flex Sales Dept): everything below **plus** user management (add users, set any user's password) and data administration (JSON backup export/import, clear demo data, load demo data).
- **Logistics** — Hery (lead), Miora (imports), Naina (customs & docs): create shipments, update ETA (logged in ETA history), report/clear delays with reason codes, tick document checklists, book sample couriers, record trims receipts.
- **Merchandising** — Lova, Tojo, Faniry: full read access, comment/ask on any shipment or sample, raise sample requests, track everything affecting the production plan.
- **Management** — Rado: everything logistics can do, plus data administration.

Buyers and suppliers are **free-text with autocomplete** — type your own buyers/suppliers in any form; filters and dashboards pick them up automatically.

## Your own test data (vs demo)

Menu (avatar, bottom-left) → **Data: backup, import & demo**:

- **Export JSON backup** — full workspace in one file
- **Import JSON backup** — restore from a backup file
- **Clear demo data — use my own test data** — empties shipments/samples/trims (accounts stay) and switches the workspace to *custom mode*: your entries are kept permanently, never overwritten by the daily demo refresh (single-file build)
- **Load demo data** — bring the full demo back any time

## Run it

```bash
cd flexknit-link
node server.js          # → http://localhost:3000  (zero dependencies, Node ≥ 16)
```

- Data is seeded **relative to today**, so the demo always looks live (ETAs days away, customs holds in progress…).
- All data persists to `data/db.json`. Reset any time from the UI (shipments toolbar → *reset demo data*) or `POST /api/reset`.
- `PORT=8080 node server.js` to change the port.

## Architecture

```
flexknit-link/
├── server.js          # zero-dependency Node HTTP server: static hosting + REST API
├── server/seed.js     # realistic seed data (Madagascar knitwear export context)
├── data/db.json       # JSON persistence (auto-created)
└── public/
    ├── index.html     # SPA shell
    ├── styles.css     # design system (no external fonts/libs — works offline)
    ├── app.js         # state, API client, router, charts, notifications, events
    └── views.js       # screens, detail modals, forms
```

### API

| Method & route | Purpose |
|---|---|
| `GET /api/state` | Full workspace state |
| `POST /api/shipments` · `PATCH /api/shipments/:id` | Create / update shipment (ETA changes → history + activity; `delayed:true` **requires** a delay-reason code) |
| `POST /api/{shipments\|samples}/:id/comments` | Threaded discussion |
| `POST /api/samples` · `PATCH /api/samples/:id` | Sample request / status & courier updates |
| `POST /api/accessories` · `PATCH /api/accessories/:id` | Trims PO create / receipts |
| `GET /api/export?module=…` | CSV export (shipments, samples, accessories) · `module=json` → full backup |
| `POST /api/login` | Verify id + SHA-256 password hash |
| `POST /api/users` · `POST /api/users/:id/pass` | Add user / set password (Super Admin; self for own password) |
| `POST /api/clear` · `POST /api/import` | Empty workspace / restore backup (Super Admin, Management) |
| `POST /api/reset` | Re-seed demo data |

## Next steps beyond the demo
Real auth (SSO/Google Workspace) per role · email/WhatsApp notifications for ETA changes · supplier portal for document upload · Shima Seiki / ERP / carrier-tracking integrations · multi-factory workspaces.
