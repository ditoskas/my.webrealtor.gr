@AGENTS.md

# Architecture (my.webrealtor.gr)

Real estate management platform for realtors: realtors manage their own properties/clients; a Root/admin
role manages the realtors themselves. Modeled on `backend.think.cms` (backend conventions: Mongoose
connection singleton, JWT auth, repository/service layering, one shared Axios instance, one-component-
per-page/view) and `estatepulse-admin` (look/feel only — layout, palette, page inventory: Dashboard,
Realtors, Clients, Properties, Users, Settings; its Firebase auth, localStorage-only data, and Tailwind
v4 runtime were **not** carried over — this project uses MongoDB + JWT + Next.js API routes).

> Runs **Next.js 16** — check `node_modules/next/dist/docs/` before assuming Next 13/14 conventions.
> `middleware.ts` is renamed **`proxy.ts`** here; don't reach for old Middleware docs/patterns.
> **Mongoose v9** here (not backend.think.cms's v8) — some type exports renamed (e.g. `FilterQuery<T>` →
> `QueryFilter<T>`). Check `node_modules/mongoose/types/*.d.ts`, don't assume v8 APIs.

## Repository layout

```
my.webrealtor.gr/
├── docker-compose.yml
├── CLAUDE.md / AGENTS.md / README.md / PUBLIC_API.md
└── src/
    ├── Dockerfile              # production image
    ├── Dockerfile.dev          # dev image (bind-mounted, no build step)
    ├── proxy.ts                 # route gating (auth + role) — Next 16's middleware.ts replacement
    ├── scripts/                 # seed-root.ts + per-pool-entity seeders, run via predev/predev:docker
    ├── app/                      # App Router — routing/composition only, no business logic
    │   ├── (auth)/               # login, signup, confirm-registration
    │   └── (dashboard)/          # dashboard, realtors, clients, properties, lands, users, logs,
    │                             # settings, transactions, profile, plus [id]/view pages
    │   └── api/                  # route handlers → services only, never touch mongoose directly
    ├── components/               # one folder per feature/page — see Component convention
    ├── models/                   # Mongoose schemas
    ├── repositories/             # 1 per entity — only code that imports the Mongoose model
    ├── services/                 # 1 per entity — business logic + auth scoping, called by routes
    ├── helpers/                  # messageHandler.ts (footer notifications)
    ├── store/                    # Redux Toolkit — cross-cutting client state only (auth, ui, footer,
    │                             # locale); hooks.ts exports useCurrentUser()/useCanEdit()/useLocale()/
    │                             # useTranslation()
    ├── lib/                      # i18n/, mongodb.ts, apiClient.ts, auth.ts, types.ts, errors.ts,
    │                             # formatDate.ts, uploads.ts, listingLabel.ts, displayName.ts, mail.ts
    └── styles/                   # SCSS: tokens, mixins, shared component classes
```

## Data layer

- `lib/mongodb.ts` — cached global connection singleton (`global.mongoose = { conn, promise }`), avoids
  reopening a connection on every hot reload.
- **Every model has `createdAt`/`updatedAt`, structurally enforced**: every schema passes
  `lib/mongooseSchemaOptions.ts`'s `baseSchemaOptions` (not an inline `{ timestamps: true }`) — sets
  `timestamps: true` and configures `toJSON` to swap `_id`/`__v` for a plain `id` string. Never accept
  `createdAt`/`updatedAt` from request bodies. **Never `.lean()`** a query expecting `id` — `.lean()`
  bypasses the `toJSON` transform.
- **Schema field changes require a dev-server restart.** `mongoose.models.X || mongoose.model(...)`
  guards against hot-reload re-registering the model — but that means editing a schema's field shape does
  nothing until the process restarts (`docker restart webrealtor-backend` in the Docker dev setup).
- **Password fields aren't automatically hidden from serialization.** `select: false` only affects the
  default query *projection* — a document fresh out of `.create()`, or with password just reassigned in
  memory before `.save()`, still has it in `.toJSON()`. Confirmed live as a real leak in `POST`/`PUT
  /api/users`. Every route returning or logging a User document must destructure `password` out first.
- **Core entities**: `User` (email, hashed password, role `Root|Administrator|Operator`, `realtorId` —
  Root always `null`, others required, enforced in a `pre("validate")` hook), `Realtor` (profile fields +
  optional `userId` + `saleCommission`/`rentCommission` fractions), `Client` (belongs to a Realtor),
  `Property` (~90 fields, belongs to a Realtor, optional Client owner), `Land` (~30 fields, a **distinct**
  entity from Property — no bedrooms/heating/construction), `LogEntry` (append-only audit trail — see
  Logging below).
- **Repository pattern**: one repository per entity, the only code that imports the Mongoose model —
  `findAll`/`findById`/`create`/`update`/`delete` plus entity-specific finders.
- **Service layer**: one service per entity — business rules + authorization scoping, calls the
  repository; API routes stay thin (parse request → call service → return `ApiResponse<T>`).
- Shared types in `lib/types.ts` (`ApiResponse<T>`, `PaginatedResponse<T>`).

## Auth

JWT-based (not Firebase). `lib/auth.ts` — `signAuthToken`/`verifyAuthToken` via `jsonwebtoken`,
`AUTH_COOKIE_NAME` (`"webrealtor_token"`), `AUTH_COOKIE_MAX_AGE_SECONDS`. JWT payload:
`sub`/`email`/`role`/`tokenVersion`/`realtorId`. `proxy.ts` defaults to the Node runtime, so
`jsonwebtoken` (Node crypto) works with no Edge workarounds.

- **Session = one httpOnly cookie**, never client-readable. Login sets it, logout clears it, browser
  attaches it automatically. `lib/apiClient.ts` has no request interceptor (removed once the cookie took
  over) but keeps a 401→redirect-to-`/login` response interceptor.
- `proxy.ts`: redirects to `/login` if missing/invalid; redirects an already-logged-in user away from
  `/login`; enforces role access — **Root reaches everywhere; Administrator/Operator restricted to
  `/dashboard`, `/clients`, `/properties`, `/lands`, `/transactions`, `/profile`** (everything else
  redirects to `/dashboard`). This allowlist is **hand-duplicated** in `Topbar.tsx`'s
  `NON_ROOT_ALLOWED_HREFS` — keep the two in sync. **Optimistic check only** (cookie-based, no DB hit) —
  no route handler re-verifies the session yet (`TODO` marks every route).
- `GET /api/auth/me` rehydrates Redux `authSlice` on mount (`DashboardShell`) since Redux state doesn't
  survive a full page load — not itself a security boundary.
- Three roles matching backend.think.cms: `Root` (`realtorId` always null, manages every Realtor/User),
  `Administrator`/`Operator` (scoped to exactly one realtor via `realtorId`). **Administrator can mutate;
  Operator is view-only**, enforced client-side via `store/hooks.ts`'s `useCanEdit()`
  (`role !== "Operator"`) — no API-side enforcement yet.
- `scripts/seed-root.ts` (+ `scripts/env.ts`) idempotently creates the first Root user
  (`dimitris@thinkpozitive.net`), wired via `predev`/`predev:docker`.

## HTTP client

One reusable Axios instance, `lib/apiClient.ts` (`axios.create({ baseURL: appSettings.apiUrl })`) — never
call `axios.create()` a second time, never use ad-hoc `fetch()`. Every component imports `apiClient`.

## Component convention

Every page and independent model/view gets its own component. `app/**/page.tsx` files are thin route
entries rendering a single `components/<feature>/<Feature>Page.tsx`, no markup of their own. Each feature
folder under `components/` owns its full vertical slice (page, sub-components, Add/Edit/Delete modals).
Cross-feature primitives (`Button`, `Badge`, `Card`, `Modal`, `Dropdown`, `Table`, `ConfirmModal`,
`SearchableSelect`, `Tabs`) live once in `components/ui/`, reused everywhere, never redefined per-feature.

## Styling: SCSS + Tailwind, reused classes only

SCSS is preferred and used everywhere, to avoid the repeated inline-Tailwind-string anti-pattern both
reference projects lean on. Tailwind v4 stays available for one-off inline utility classes in JSX and as
the design-token source (`@theme` in `app/globals.css`). A utility combination used **twice or more**
becomes a named class, hand-authored plain CSS/SCSS (not `@apply`) using `styles/_variables.scss`/
`styles/_mixins.scss` — cross-feature primitives → `styles/components/_*.scss` (forwarded through
`styles/shared.module.scss`), feature-specific → a colocated `<Component>.module.scss`.

**`@apply` is banned inside `.module.scss`/CSS Modules.** For any utility touching a "tracked" custom
property (font-weight, spacing, borders, shadows — almost everything beyond raw color), Tailwind v4's
`@apply` emits a global `@property`-fallback selector (`*, ::before, ::after, ::backdrop { ... }`) into
the compiled CSS, which Webpack's css-loader rejects as an impure CSS-Modules selector. Turbopack
tolerates it, but this repo's Docker dev/prod path deliberately forces Webpack (reliable bind-mount file
watching), so the incompatibility is unavoidable here. Design tokens live in `styles/_variables.scss` as
`$variables`, hand-kept in sync with `globals.css`'s `@theme` block (the two can't share an
import/`@use` — one is Sass, one must stay plain CSS for Tailwind's bootstrap).

## Data scoping by realtor — mandatory, CRITICAL standing instruction

**For every query, on every page, in every component: a non-Root user (Administrator/Operator) must only
ever see data belonging to their own `realtorId` — never another realtor's, never platform-wide.** Root
is the only role allowed to see across every realtor. Applies to all future work by default, not just
when asked.

- **Scope off the logged-in user's own `realtorId`** (`useCurrentUser().realtorId` client-side) — **never
  off a `realtorId` read from some other fetched record.** That field is only as trustworthy as the
  (currently unauthenticated) endpoint that returned it — trusting it creates a dependency chain where one
  wrong/compromised fetch silently leaks into every subsequent one scoped off it.
  Caught live: `ViewingPanel`'s Property/Land picker originally scoped off the *Client's* `realtorId`
  (threaded down from `ClientViewPage`); fixed to use the session's own `realtorId` for
  Administrator/Operator, falling back to the client's `realtorId` only for Root (which has none of its
  own).
- **Root is the only exception** — every other role is scoped, full stop.
- Governs client-side fetch decisions today (which `?realtorId=` to pass, `list()` vs `listForRealtor()`)
  since route-handler auth doesn't exist yet — this does **not** replace that still-needed enforcement.
- Precedent: Clients/Properties/Lands/Transactions/Dashboard all pass `?realtorId={user.realtorId}` for
  non-Root callers, omit it (seeing everyone's) only for Root.

## Implemented features (condensed reference)

- **Registration** — `/signup` (email+password) → branded confirmation email → `/confirm-registration?
  token=` completes the realtor profile → linked Administrator+Realtor pair, signed in immediately. Signup
  writes to a separate `PendingRegistration` collection (email, bcrypt hash, token, 48h TTL) since `User`
  requires a `realtorId` at validation time that doesn't exist yet at signup. The hash is carried via a
  `$locals.skipPasswordHash` flag so `User`'s own `pre("save")` hook doesn't re-hash it.
  Enumeration-safe: signup always returns the same generic response. Email via `lib/mail.ts`/nodemailer +
  plain SMTP env vars; `sendMail()` is best-effort (returns `false`, doesn't throw, if SMTP unconfigured).

- **Realtor management** — Full CRUD. Model: firstName/lastName/email(unique)/phone/mobile/city/address/
  postcode/googleMapsUrl/website/realtorNumber(business registration no., e.g. Greek "ΓΕΜΗ 51795619000" —
  printed on the Order tool below)/userId(optional)/saleCommission/rentCommission (fractions, e.g. `0.1` =
  10%, applied to buy/rent actions respectively). `RealtorService.list()` merges **derived, not stored**
  `clientCount`/`propertyCount`/`landCount` (parallel `countDocuments`) — absent right after create/
  update, present on `list()`. View page `/realtors/[id]/view` (every role). Realtors/Logs nav moved into
  Settings' own sidebar (same routes, same Root-only gating, just relocated).

- **User management** — Full CRUD. Model: email/password(hashed, `select:false`)/role/realtorId/
  language(en|el|ru, self-service only via Profile). `UserRepository.updateWithPassword()` uses `.save()`
  (not `findByIdAndUpdate`) so the hashing hook fires. Routes strip `password` from every response/log.

- **Profile** (`/profile`, every role) — Change Password (`POST /api/auth/change-password`, requires
  current password, unlike admin's `PUT /api/users/:id` reset), Realtor Info edit (gated on
  `user.realtorId` truthy — effectively Administrator only, reuses `RealtorForm`), Language (`POST
  /api/auth/language`, updates both `authSlice.user.language` and `localeSlice.locale`), Display Name
  (`POST /api/auth/display-name` — `lib/displayName.ts`'s `getDisplayName()` = `displayName || email`).

- **Order tool** (`/tools/order`, also under the Topbar "Tools" menu) — a printable broker order form
  ("Εντολή", ported from a standalone legacy HTML tool) plus an editable list of properties shown to the
  client, reached via a new canEdit-gated "Order" row action on `ClientTable`/`ClientsPage`
  (`/tools/order?clientId=...`). Auto-fills from the target `Client` and their realtor (scoped off the
  session's own `realtorId` for non-Root — see "Data scoping by realtor" — falling back to the client's
  own realtor only for Root); `Realtor.realtorNumber` fills the printed "Αριθμός" line. Unlike
  Receipt/Contract (each tied to a `Transaction`, saved to a dedicated `receiptUrl`/`contractUrl` slot),
  an Order has no transaction to hang a file off, so "Save as PDF" reuses the generic
  `POST /api/attachments` resource (`entityType: "Client"`) instead — same reasoning as Notes/Files.
  Printed document text stays hardcoded Greek (a Greek legal document), same convention as
  `receipt.*`/`contract.*`.

- **Messages** — Public form intake. A realtor can have any number of **Message Forms**
  (guid/slug/subject/recipient) configured only by Root, as a row action on `/realtors`
  (`/realtors/[id]/messages` — see `RealtorMessageFormsPage.tsx`), not self-service. `guid` is
  always server-generated (`crypto.randomUUID()`, `models/MessageForm.ts`), never client-supplied,
  and is the lookup key an external site (e.g. the realtor's own website contact form) posts to
  the new **public, unauthenticated, CORS-enabled** `POST /api/public/message` — see
  `PUBLIC_API.md` for the full third-party-facing contract, and its own top intro for why that
  file exists separately from this one. **Every `/api/public/**` route, present and future, must
  return `PublicApiResponse` (`lib/publicApiResponse.ts`) — a `success`/`payload`/`message`
  envelope, built via `PublicApiResponse.success(payload?, message?)` /
  `PublicApiResponse.error(message)` then `.toResponse(status, headers)`, never a hand-rolled
  `NextResponse.json()` body — so third-party callers get one stable shape across every public
  endpoint.** This is deliberately distinct from `ApiResponse<T>` (`lib/types.ts`,
  `data`/`message`/`success`), which internal `/api/**` routes use instead. A successful post
  stores a `Message` row (denormalizing slug/subject/recipient from the form *at receipt time*,
  so later config edits never rewrite
  already-received history) and best-effort emails the recipient a `key: value` rendering of the
  submitted JSON (`MessageService.receive`, `lib/mail.ts`'s `sendMail` — same best-effort
  discipline as every other email in this app). Received messages surface on their own top-level
  `/messages` page (every role, realtor-scoped like Clients/Properties — see "Data scoping by
  realtor"), paginated like `/logs`.

- **Client management** — Belongs to a Realtor. Model: gender(nullable, Male|Female only)/firstName/
  lastName/tin/city/address/zipcode/email/phone/mobile/realtorId. `GET /api/clients` takes optional
  `?realtorId=` (scoped vs all). Realtor `<select>`/column shown only for Root. View page
  `/clients/[id]/view`.

- **Property management** — Belongs to a Realtor, optional Client owner. ~90 fields (Basic Info,
  Description, Heating/Consumption, Construction, Technical/Interior, Outdoor/Plot, Suitable For,
  Location, Media), 13 ObjectId refs into pool entities (`energyClassId`+`propertyCategoryId` required).
  `descriptions` is a locale-keyed `Map`, `images` a plain URL `string[]` (no file upload). **Full-page**
  create/edit at `/properties/new` / `/properties/[id]` (not a modal — 90 fields don't fit one), one
  shared `PropertyDetail` component for both modes, coercion centralized in
  `app/api/properties/parsePropertyBody.ts`. View page `/properties/[id]/view` (every role): hero+
  thumbnails, stats bar, owner/description/price-history/technical/notes, Listing Realtor card
  (Root-only).

- **Land management** — Belongs to a Realtor, optional Client owner, **distinct entity from Property**
  (~30 fields, no bedrooms/heating/construction). 5 ObjectId refs (3 reused from Property's pool —
  orientation/zoningType/roadAccessType — plus 2 new: `landCategoryId`(required)/`slopeId`). Same
  full-page create/edit pattern (`/lands/new`, `/lands/[id]`), `parseLandBody.ts` mirrors Property's
  helper. **No Land view page yet** — its Notes/Files are reached via `EntityDetailModal` (modal-wrapped
  tabs) on `LandTable` instead.

- **Price History** — Shared `PriceHistory` collection (`listingId`/`listingType` discriminator, no
  ref/populate), one entry per creation and per price change on update. `PriceHistoryService.record()` is
  best-effort. `GET /api/properties|lands/[id]/price-history`, read-only. Recorded for both Property and
  Land from day one; only the Property View Page displays it so far.

- **Settings pool entities (15 total)** — flat name + unique `slug` + soft-delete (`deletedAt`) lookup
  lists, global not per-realtor: EnergyClass, HeatingSystem, PropertyCategory, FloorLevel,
  BuildingFloors, HeatingMedium, JoineryType, GlassType, FloorType, GardenType, ZoningType, Orientation,
  RoadAccessType (all reused by Property), LandCategory, Slope (Land-specific). Each has its own
  model/repository/service/2 API routes/Settings-tab UI (table + add/edit/delete modals)/idempotent
  seeder wired into `predev`. Slugs are hand-transliterated greeklish (no library in the dependency
  tree). Scaffold for a new one: `.claude/skills/settings-pool-entity/SKILL.md` — use it rather than
  hand-copying an existing entity's files.

- **Notes** — Free-form (implicit date = `createdAt`, title, text, importance Low|Normal|High, userId
  author) attachable to Realtor/Client/Property/Land via one shared `Note` collection
  (`entityType`+`entityId` discriminator, never populated). One generic `/api/notes` CRUD resource, not
  four per-entity. Inline add/edit UI, `canEdit`-gated; author resolved per-note only (never fetches the
  full `/api/users` list, since this surface is reachable by every role). Surfaced as a tab of
  `EntityDetailTabs`.

- **Files (Attachments)** — Same shared entityType/entityId shape as Notes, plus fileName/url/mimeType/
  size/userId. **Whitelist, not denylist**: `lib/uploads.ts`'s `ALLOWED_ATTACHMENT_TYPES` (office docs,
  text, zip, images) — anything unlisted (`.exe`, scripts) is rejected by omission. Storage:
  `<UPLOADS_DIR>/<realtors|clients|properties|lands>/<entityId>/`. Multi-file upload per request,
  all-or-nothing validation before any write. Delete removes the DB row then best-effort `unlink()`s the
  file. Grid-card UI (`FilesPanel`/`FileItem`, 4 cols max, responsive), real thumbnail for images, MIME
  icon otherwise. Delete on both Notes and Files requires confirmation via the shared `ConfirmModal`.

- **EntityDetailTabs / EntityDetailModal** — a `Tabs` primitive switching Notes/Files (+ Owns/Interest
  For/Viewings when `entityType === "Client"`). Embedded directly on Realtor/Client/Property view pages;
  modal-wrapped (`EntityDetailModal`) only on `LandTable` (Land has no view page).

- **Owns (Client)** — Read-only tab, shown first for Client, listing every Property/Land whose `clientId`
  points at this client, via a new optional `?clientId=` filter on the existing `/api/properties`/
  `/api/lands` list endpoints (not a new resource). Links out to the Property view page / Land edit page.

- **Interest For (Client)** — CRUD tab: date/transactionType(sale|rent)/listingType(Property|Land)/
  categoryId(no ref, dynamic target resolved client-side)/price/city/area/remarks/isActive. Nested under
  the client: `/api/clients/[id]/interest-for`. Modal-based CRUD (unlike Notes' inline forms — more
  fields, two dependent selects).

- **Viewings (Client)** — CRUD tab: date/listingType/listingId(dynamic ref to a Property or Land)/
  comment/signatureDocumentId(optional ref to an existing `Attachment` — many-Viewings-to-one-file,
  reuses the Files upload flow rather than owning its own). Nested under the client:
  `/api/clients/[id]/viewings`. Listing picker uses `SearchableSelect` (generic type-to-filter combobox in
  `components/ui/`), scoped to the **session's own `realtorId`** for non-Root (see the CRITICAL scoping
  rule above — this was the bug that motivated writing that rule down).

- **Transactions** — Top-level entity, own nav item (`/transactions`, every role, realtor-scoped for
  non-Root) — a completed rent/buy deal. Model: realtorId(required)/clientId/date/listingType/
  listingId(dynamic)/action(rent|buy — **deliberately distinct vocabulary** from Property/Land's own
  `transactionType` sale|rent)/price/commission/tax/comment. `TransactionForm`: the **listing picker
  drives everything else** — picking a Property/Land (merged `SearchableSelect`, active/pending listings
  only) auto-fills Client (read-only, derived from the listing's owner), Action (derived from the
  listing's `transactionType`), and Price/Commission (`commission = price × realtor's saleCommission or
  rentCommission`, via `computeCommission()`, left untouched if no rate is set). `lib/listingLabel.ts` is
  shared between Transactions and Viewings.

- **Dashboard** — Real aggregates (was a static placeholder). 3 stat tiles: Active Listings, Total
  Clients, Monthly Revenue (sum of `Transaction.commission` for the current month, bucketed by
  `Transaction.date`, not `createdAt`). 2 charts (transaction count, summed commission) over a fixed
  trailing 6-month window, via `MonthlyBarChart` (plain HTML/CSS bars, no charting library). Same
  Root-vs-scoped fetch pattern as every list page.

## Logging (LogEntry) — mandatory, standing instruction

**Every action that mutates data, or is a security event (login/logout, auth failures), must write a
`LogEntry`.** Wire this into any new mutating route/service the same way existing ones do — don't wait to
be asked.

- Model: `category`(free string)/`logType`(Information|Warning|Error)/`userId`(nullable)/
  `realtorId`(nullable)/`message`/`dataFrom`/`dataTo`(Mixed snapshots).
- `LogEntryService.info/warning/error(...)` is the only write path — **best-effort, swallows its own
  errors** (`console.error`s them) so a logging failure can never break the action it's logging.
- `GET /api/logs` is read-only, paginated (`BaseRepository.findPaginated`, clamped page/pageSize), Root-
  only UI at `/logs` (now also reachable via Settings' sidebar).
- Severity: `info` = successful mutation/login; `warning` = rejected/invalid attempt (login failures use
  an identical message for "no such user" vs "wrong password" — no enumeration via the log); `error` is
  reserved for unexpected failures (not yet wired into generic 500 branches).
- **Never let sensitive fields (passwords, tokens) reach `dataFrom`/`dataTo`.**
- `userId` attribution via `lib/auth.ts`'s `getCurrentUserId()` (session cookie, server-side) —
  attribution only, **not** an authorization check. Every mutating route calls this from day one.
- Currently wired: Realtor, User, Client, Property, Land, Energy Class, Heating System, Note, all 13
  property/land pool entities, Interest For, Viewings, Transactions, Attachments, login success/failure.
  Not wired: logout (route exists, doesn't log yet).

## Footer notifications

Ported from `backend.think.cms/src/store/footerSlice.ts`, **one deliberate change: no
`dangerouslySetInnerHTML`.** Messages routinely embed user-controlled data (names/emails), so
`Footer.tsx` renders `{message.text}` as plain text only (React auto-escapes) instead of rich `<strong>`
formatting, avoiding a stored-XSS vector. `helpers/messageHandler.ts`'s
`MessageHandler.success/error/warning/info/normal(dispatch, text)` is the only way to set it — never
dispatch `footerSlice` actions directly.

**Mandatory: every page that loads a list shows `MessageHandler.normal("Number of X: {count}")` on load
success.** Silence it on post-mutation reloads via a `{ silent: true }` load option (not a mutable ref) so
it doesn't overwrite that mutation's own success message.

## Internationalization (i18n)

Lightweight client-side dictionary + Redux — not `next-intl`, no `[locale]` route segmentation (no
SEO/multi-domain need). **3 locales: `en` (default), `el`, `ru`.** `lib/i18n/messages/en.ts` is the type
source of truth (`el.ts`/`ru.ts` annotate against `typeof en` via `Messages` — a missing key is a
**compile error**, not a silent fallback). `translate()` does dot-path lookup + `{param}` interpolation,
returning the raw key on a miss (never throws). `store/localeSlice` persists to `localStorage`;
`app/LocaleHydrator.tsx` (at the `Providers` level, not `DashboardShell`, so `/login` gets it too)
rehydrates on mount. `useTranslation()` (`store/hooks.ts`) is the only way components read text — never
import `MESSAGES`/`translate` directly. Settings' 15 pool entities share one templated `settingsPool.*`
catalog (interpolated with `settingsEntities.*` display names) instead of duplicating per entity,
deliberately without grammatical case agreement.

**Mandatory: every new UI string ships translated into all 3 locales in the same change that introduces
it.** Add the key to `en.ts` first, then fill `el.ts`/`ru.ts`, then render via `t("feature.key")` — never
a raw string literal, never "English only for now." Prefer natural/idiomatic `el` translations (Greek-
market product). Reuse `common.*` keys (`cancel`/`save`/`saving`/`delete`/`deleting`/...) over near-
duplicate feature-scoped keys.

## Date/time formatting

**Never call `.toLocaleDateString()`/`.toLocaleString()`/`.toLocaleTimeString()` directly** — output
varies by the browser's locale settings. `lib/formatDate.ts`'s `formatDate()` (`dd/MM/yyyy`) and
`formatDateTime()` (`dd/MM/yyyy HH:mm`, 24h) are the only allowed formatters; both accept
`string|Date|null|undefined` and return `"—"` for missing/invalid input instead of throwing. Exception:
Footer's live ticking clock (seconds-resolution, no date component) still uses
`toLocaleTimeString(..., { hour12: false })` since `formatDate.ts` has no time-only formatter.
`<input type="date">` values are unaffected (native `yyyy-MM-dd`).

## Icons, state management, Docker

- **Icons**: `lucide-react`. Nav links show icon + label; row-level actions (table Edit/Delete) are
  icon-only via `Button`'s `sharedStyles.buttonIcon` plus a `title`/`aria-label`.
- **State**: Redux Toolkit for cross-cutting client state only (`authSlice`/`uiSlice`/`footerSlice`/
  `localeSlice`) — entity CRUD data is never kept in Redux, always fetched per-page via `apiClient`.
- **Docker**: `docker-compose.yml` builds the `backend` service from `./src` (`Dockerfile.dev`
  bind-mounted for dev, `Dockerfile` multi-stage for prod). No Redis (dropped from the backend.think.cms
  template — add back only if a real caching need arises).

## Status

**Fully implemented**: Realtor/User/Property/Land/Client management, LogEntry logging (with actor
attribution), Auth (login/logout/session/role gating, Logs page), self-service Registration, all 15
Settings pool entities, Property/Realtor/Client View Pages, Price History, Notes, Files/Attachments (+
`EntityDetailTabs`/`Modal`), Owns/Interest For/Viewings (Client-only tabs), Transactions, Dashboard (real
aggregates), self-service Profile, i18n infra with every feature translated, Messages (Root-only
Message Form config + public intake API, see `PUBLIC_API.md`).

**Still skeleton-only**: the Property Options Settings tab (placeholder text only, no backing entity).

**Not implemented anywhere yet**: route-handler-level auth — every API route currently trusts its caller;
`proxy.ts` only gates pages (Next's own guidance: Proxy is an optimistic first line, not the only one).
`TODO` comments mark exactly where each route needs a real check.