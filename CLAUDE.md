@AGENTS.md

# Architecture

This document is the source of truth for how **my.webrealtor.gr** is structured. It was produced by
analyzing two references before any code was written:

- **`C:\ThinkPositive\backend.think.cms`** — sibling Next.js + MongoDB project. Source of the backend
  conventions (Mongoose connection singleton, JWT auth, repository/service layering, the single shared
  Axios instance) and of the "one component per page/view" frontend convention.
- **`C:\Users\toska\Downloads\intergo\estatepulse-admin`** — Vite/React/Firebase prototype. Source of the
  **look and feel only** (layout, navigation, color palette, page inventory: Dashboard, Realtors, Clients,
  Properties, Users, Settings). Its Firebase auth, client-side-only data (localStorage) and Tailwind v4
  runtime are **not** carried over — this project uses MongoDB + our own JWT auth + Next.js API routes
  instead, styled with the SCSS approach described below.

The system is a **real estate management platform for realtors**: realtors manage their own properties and
clients, and an admin/root role manages the realtors themselves — mirroring `estatepulse-admin`'s
Dashboard / Realtors / Clients / Properties / Users / Settings views and its root-vs-member permission split.

> Reminder: this repo runs **Next.js 16** (see `AGENTS.md`). Consult `node_modules/next/dist/docs/` for any
> API/convention that looks unfamiliar before writing code — don't assume Next 13/14 patterns.
>
> Same caution applies to **Mongoose**, installed here at **v9** vs. backend.think.cms's v8 — some type
> exports were renamed (e.g. `FilterQuery<T>` → `QueryFilter<T>`; `repositories/BaseRepository.ts` uses the
> new name). Check `node_modules/mongoose/types/*.d.ts` rather than assuming v8 APIs/types still apply.

## Repository layout

Mirrors `backend.think.cms`: the repo root only holds docs, Docker and editor config; the app itself is
nested under `src/`, which is also what `docker-compose.yml`'s `backend` service build context expects.

```
my.webrealtor.gr/
├── docker-compose.yml
├── CLAUDE.md / AGENTS.md / README.md
└── src/
    ├── Dockerfile              # production image
    ├── Dockerfile.dev          # dev image (bind-mounted, no build step)
    ├── .env.example
    ├── proxy.ts                # route gating (auth redirect + role access) — Next 16's middleware.ts replacement
    ├── package.json / tsconfig.json / next.config.ts / eslint.config.mjs / postcss.config.mjs
    ├── public/
    ├── scripts/                # standalone tsx scripts (seed-root.ts + env.ts), run via predev/predev:docker
    ├── app/                    # App Router — routing/composition only, no business logic
    │   ├── layout.tsx
    │   ├── globals.css                 # Tailwind bootstrap + design tokens ONLY — see Styling
    │   ├── (auth)/login/page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx              # shell: Topbar + DashboardShell + Footer
    │       ├── dashboard/page.tsx
    │       ├── realtors/page.tsx
    │       ├── realtors/[id]/page.tsx
    │       ├── clients/page.tsx
    │       ├── properties/page.tsx
    │       ├── properties/[id]/page.tsx
    │       ├── lands/page.tsx
    │       ├── lands/[id]/page.tsx
    │       ├── users/page.tsx
    │       ├── logs/page.tsx
    │       └── settings/page.tsx
    │   └── api/                        # route handlers → services only, never touch mongoose directly
    │       ├── auth/login/route.ts + logout/route.ts + me/route.ts
    │       ├── realtors/route.ts + [id]/route.ts
    │       ├── clients/route.ts + [id]/route.ts
    │       ├── properties/route.ts + [id]/route.ts
    │       ├── lands/route.ts + [id]/route.ts
    │       ├── users/route.ts + [id]/route.ts
    │       └── logs/route.ts           # read-only, paginated — see Logging (LogEntry)
    ├── components/              # one folder per page/feature — see "Component convention" below
    │   ├── layout/               (Topbar, Footer, DashboardShell)
    │   ├── auth/                 (LoginPage)
    │   ├── dashboard/            (DashboardPage)
    │   ├── realtors/             (RealtorsPage, RealtorTable, RealtorForm, AddRealtorModal, EditRealtorModal, DeleteRealtorModal)
    │   ├── clients/               (ClientsPage, ClientCard, ...)
    │   ├── properties/           (PropertiesPage, PropertyTable, PropertyDetail, ...)
    │   ├── lands/                 (LandsPage, LandTable, LandDetail, ...)
    │   ├── users/                 (UsersPage, UserTable, UserForm, AddUserModal, EditUserModal, DeleteUserModal)
    │   ├── logs/                  (LogsPage — paginated audit trail)
    │   ├── settings/             (SettingsPage, ...)
    │   └── ui/                    (Button, Badge, Card, Modal, Dropdown, Table — shared primitives, reused everywhere)
    ├── models/                   # Mongoose schemas (User, Realtor, Client, Property, Land, LogEntry)
    ├── repositories/             # 1 per entity — only place that talks to Mongoose
    ├── services/                 # 1 per entity — business logic, calls repositories, called by route handlers
    ├── helpers/                  # messageHandler.ts — footer notification dispatch helper (see Footer notifications)
    ├── store/                    # Redux Toolkit — cross-cutting client state only (auth, ui, footer, locale), NOT
    │                             # entity CRUD data. hooks.ts also exports useCurrentUser()/useCanEdit()/
    │                             # useLocale()/useTranslation() for role checks and i18n (see Internationalization).
    ├── lib/
    │   ├── i18n/                 # locales.ts, translate.ts, messages/{en,el,ru,types,index}.ts — see Internationalization
    │   └── ...                   # mongodb.ts, mongooseSchemaOptions.ts, apiClient.ts, auth.ts, appSettings.ts, types.ts, errors.ts
    └── styles/                   # SCSS: tokens, mixins, shared component classes (see Styling)
```

## Data layer

- **Connection**: `lib/mongodb.ts` — the same cached-global-connection singleton as
  `backend.think.cms/src/lib/mongodb.ts` (`global.mongoose = { conn, promise }`), so hot-reload in dev
  doesn't open a new connection per request.
- **Every model has `createdAt` and `updatedAt`.** This is a hard rule, not a per-entity choice, and it's
  structurally enforced rather than copy-pasted: every Mongoose schema in `models/` passes
  `lib/mongooseSchemaOptions.ts`'s `baseSchemaOptions` (not an inline `{ timestamps: true }`) as its second
  `new Schema(...)` argument. `baseSchemaOptions` sets `timestamps: true` centrally, so it's impossible to
  forget on a new model — never add a schema without it, and never accept `createdAt`/`updatedAt` from
  request bodies (they're server-owned). It also configures `toJSON` to swap Mongoose's `_id`/`__v` for a
  plain `id` string (via `virtuals: true` + a transform deleting `_id`), matching the `id`-based frontend
  types in `lib/types.ts` — **do not** call `.lean()` on a query and expect `id` to appear; `.lean()` returns
  a plain object bypassing `toJSON`, so anything relying on `id` needs the full Mongoose document (the
  current repositories never use `.lean()` for this reason).
- **Schema field changes require a dev-server restart to take effect.** `mongoose.model("X", schema)` is
  guarded by `mongoose.models.X || mongoose.model(...)` in every model file so hot-reload doesn't redefine
  the model on every save — but that same guard means editing a schema's fields (renaming, adding, removing)
  does nothing until the process restarts, because `mongoose.models.X` already holds the old compiled model
  and short-circuits re-registration. In the Docker dev setup this means `docker restart webrealtor-backend`
  (or equivalent) after any schema shape change — a plain file edit + Webpack polling recompile is not
  enough. Hit twice while renaming `Realtor.gpsCoordinates` → `Realtor.googleMapsUrl`: the API kept returning
  the old field until the container was restarted.
- **Mongoose document serialization is NOT automatically password-safe — verify, don't assume.**
  `password: { select: false }` only changes the *default query projection* (`.find()`/`.findById()`
  correctly omit it, confirmed live). It does **not** retroactively hide the field from `.toJSON()` on a
  document that has it explicitly assigned in memory — which is every document fresh out of `.create()`,
  and any document whose password was just reassigned before `.save()`. Found live: `POST /api/users` and
  `PUT /api/users/[id]` (when changing the password) were both returning the bcrypt hash straight in the
  HTTP response before this was caught and fixed. The fix, applied in both route handlers: destructure
  `password` out of `doc.toJSON()` before it reaches `NextResponse.json(...)` **or** a `LogEntryService` call
  — never pass a User document (or its raw `.toJSON()`) straight through either sink. `GET` routes are safe
  because they never load the field to begin with. This is the same reason backend.think.cms's own
  `POST /api/users` manually strips `password` after `.toObject()` — that wasn't defensive redundancy, it
  was necessary.
  Initial entities:
  - `User` — login identity: `email` (unique), `password` (hashed), `role`
    (`"Root" | "Administrator" | "Operator"`, matching backend.think.cms's role set), `realtorId` (`Realtor`
    ref). **A `Root` user's `realtorId` is always `null`; `Administrator`/`Operator` always require one** —
    enforced in a schema `pre("validate")` hook (`models/User.ts`), not just in the route handler, so it can't
    be bypassed by any caller. Password hashing + `comparePassword` on the schema, same as
    backend.think.cms's `User` model. **Implemented**: full CRUD — see "User management" below.
  - `Realtor` — an individual realtor's profile: `firstName`, `lastName`, `email` (required, unique),
    `phone`, `mobile`, `city`, `address`, `postcode`, `googleMapsUrl`, `website`, plus an optional `userId`
    ref (`User`, nullable) so a realtor's profile can exist before — or independently of — a login account
    being provisioned for them. **Implemented**: full CRUD (model, repository, service, API routes, and the
    Realtors admin UI) — see "Realtor management" below. Not a brokerage/company entity (that was the
    original skeleton's shape, replaced once real requirements were given).
  - `Client` — belongs to a `Realtor` (`realtorId` ref): `name`, `email`, `phone`, `type` (buyer/seller/investor),
    `status`, `notes`. Skeleton only so far.
  - `Property` — belongs to a `Realtor` (`realtorId` ref), optionally linked to a `Client` (owner). A
    ~90-field listing record covering ownership, basic info, description, heating/consumption,
    construction, technical features/interior, outdoor spaces/plot location, "suitable for" flags,
    free-text description, location, and media. **Implemented**: full CRUD (model, repository, service,
    API routes, and a full-page create/edit form) — see "Property management" below.
  - `Land` — a **distinct entity from `Property`, not an extension of it** — belongs to a `Realtor`
    (`realtorId` ref), optionally linked to a `Client` (owner). A ~30-field listing record for plot/land
    sales, covering ownership, basic info, outdoor spaces/plot characteristics, free-text description,
    location, and media — no bedrooms/heating/construction fields, since those don't apply to a plot.
    **Implemented**: full CRUD (model, repository, service, API routes, and a full-page create/edit form)
    — see "Land management" below.
  - `LogEntry` — append-only audit trail. **Implemented** — see "Logging (LogEntry)" below, a mandatory
    convention for all future mutating/auth actions, not just what's wired up today.
- **Repository pattern**: one repository per entity in `repositories/` (e.g. `RealtorRepository.ts`) —
  the *only* code that imports the Mongoose model and runs queries. Exposes reusable CRUD
  (`findAll`, `findById`, `create`, `update`, `delete`, plus entity-specific finders like
  `findByRealtorId`).
- **Service layer**: one service per entity in `services/` (e.g. `RealtorService.ts`) — calls the
  repository, applies business rules and authorization scoping (e.g. a Realtor-role user only ever sees
  their own clients/properties), and is what API routes call. Route handlers under `app/api/**/route.ts`
  stay thin: parse request → call service → return `ApiResponse<T>`.
- Shared response/domain types live in `lib/types.ts`, following the `ApiResponse<T>` /
  `PaginatedResponse<T>` shape already used in backend.think.cms's `lib/types.ts`.

## Auth

JWT-based, not Firebase (estatepulse-admin used Firebase auth — replaced here to match backend.think.cms
and keep everything on our own MongoDB). **Implemented**: real login/logout, session persistence, and
route-level redirect + role gating for pages.

> **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** This tripped us up once already (see AGENTS.md's
> general warning about this Next version) — don't reach for "middleware" docs/patterns from training data
> or older tutorials. `proxy.ts` **defaults to the Node.js runtime** (confirmed via
> `node_modules/next/dist/docs/.../file-conventions/proxy.md`), which is exactly why `jsonwebtoken` (Node
> crypto) works fine in it with zero Edge-runtime workarounds — that would have been a real problem under
> the old Edge-only Middleware.

- `lib/auth.ts` — `signAuthToken` / `verifyAuthToken` via `jsonwebtoken`, `JWT_SECRET` / `JWT_EXPIRES_IN` env
  vars, same shape as `backend.think.cms/src/lib/auth.ts`. Also exports `AUTH_COOKIE_NAME`
  (`"webrealtor_token"`) and `AUTH_COOKIE_MAX_AGE_SECONDS` — the single source of truth for the session
  cookie name/lifetime, imported by the login/logout/me routes and by `proxy.ts`. The JWT payload includes
  `realtorId` alongside `sub`/`email`/`role`/`tokenVersion`.
- **Session = one httpOnly cookie, not a client-readable token.** `POST /api/auth/login` sets it
  (`httpOnly`, `sameSite: "lax"`, `secure` in production) on success; `POST /api/auth/logout` clears it.
  The browser attaches it automatically on every same-origin request — `lib/apiClient.ts` has **no**
  request interceptor anymore (it did, briefly, attaching a `Bearer` token read from `localStorage`; removed
  once the cookie took over, since client JS can't read an httpOnly cookie anyway and keeping both would
  just be confusing dead code). The 401→redirect-to-`/login` response interceptor stays.
- `src/proxy.ts` — reads the cookie, verifies the JWT, and:
  - redirects to `/login` if missing/invalid (except on `/login` itself);
  - redirects an already-logged-in user away from `/login` to `/dashboard`;
  - enforces section access by role: **Root reaches everywhere; `Administrator`/`Operator` are restricted
    to `/dashboard`, `/clients`, `/properties`** — everything else (`/realtors`, `/users`, `/settings`,
    `/logs`) redirects them to `/dashboard`. The allowed-path list is duplicated (by hand) in
    `components/layout/Topbar.tsx`'s `NON_ROOT_ALLOWED_HREFS` so the nav doesn't show links a role can't
    reach — **keep the two in sync** if the access rules change.
  - This is an **optimistic** check only (cookie-based, no DB hit) per Next's own authentication guide — no
    API route currently re-verifies the session itself (`TODO` comments mark every route). Don't treat
    `proxy.ts` as the only line of defense once real route-handler auth lands.
- `Topbar.tsx`'s account control is a click-to-toggle dropdown (own `useState` + a click-outside/`Escape`
  listener, no shared `Dropdown` UI component exists yet — this is the only menu in the app so far), not a
  static role tag + logout button. The trigger shows email + role; the panel repeats both plus the one
  "Sign out" action. If a second dropdown is ever needed elsewhere, that's the point to extract a reusable
  component instead of copying this one.
- `GET /api/auth/me` — reads the same cookie, returns the current user. Exists because Redux state doesn't
  survive a full page load; `components/layout/DashboardShell.tsx` calls it on mount to (re)populate
  `store/authSlice.ts`, which is what the UI (nav filtering, action-button gating) actually reads. This is
  **not** a security boundary — `proxy.ts` already guarantees you can't reach `DashboardShell` unauthenticated;
  this call only hydrates client-visible state.
- `models/User.ts` — `bcryptjs` password hashing in a `pre("save")` hook + `comparePassword` method.
- Three roles, matching backend.think.cms's set exactly: `Root` (platform-wide, `realtorId` always `null`,
  manages every Realtor and User), `Administrator` and `Operator` (both belong to exactly one Realtor via
  `realtorId`, scoped to that realtor's own data). The Root-has-no-realtor / others-must-have-one invariant
  is enforced in the `User` schema itself (see Data layer), not just at the API boundary.
  **`Administrator` can mutate; `Operator` is view-only** within the sections both can reach — enforced in
  the UI today via `store/hooks.ts`'s `useCanEdit()` (`role !== "Operator"`), e.g. `ClientsPage`/
  `PropertiesPage` hide their "New ..." button entirely for Operator. This is UI-only so far — the
  corresponding API-side enforcement is the same still-TODO route-handler auth work as everywhere else.
- **Seeding**: `scripts/seed-root.ts` (+ `scripts/env.ts`, which loads `.env*` via `@next/env` the same way
  `next` itself does, since standalone `tsx` scripts don't get that for free) creates the first Root user
  (`dimitris@thinkpozitive.net`) if it doesn't already exist — idempotent, safe to run every time. Wired via
  npm's `predev`/`predev:docker` lifecycle hooks (`npm run seed:root`), matching backend.think.cms's
  `seed:all` pattern exactly — it runs automatically before `next dev` / `next dev --webpack` starts, no
  manual step needed. Add more seed scripts here the same way if that need comes up.

## HTTP client — single reusable instance

All client-side HTTP calls go through **one** Axios instance, declared once and imported everywhere —
never call `axios.create()` a second time anywhere else in the app. Mirrors
`backend.think.cms/src/lib/apiClient.ts` exactly:

```
lib/apiClient.ts
  - axios.create({ baseURL: appSettings.apiUrl })
  - request interceptor: attaches Bearer token from storage when present
  - response interceptor: on 401, clears stored auth and redirects to /login
lib/appSettings.ts
  - { apiUrl: process.env.NEXT_PUBLIC_API_URL, environment: process.env.NODE_ENV }
```

Every component/hook that needs to call `/api/...` imports `apiClient` from `lib/apiClient.ts` — no
ad-hoc `fetch()` calls and no per-component Axios instances.

## Component convention

**Every page and every independent model/view gets its own component**, matching backend.think.cms's
`components/<feature>/<Feature>Page.tsx` layout and estatepulse-admin's per-entity split
(`AddRealtorModal.tsx`, `EditRealtorModal.tsx`, `DeleteRealtorModal.tsx`):

- `app/**/page.tsx` files are thin route entries — they render a single `components/<feature>/<Feature>Page.tsx`
  and do no layout/markup of their own.
- Each feature folder under `components/` owns its full vertical slice: the page component, any
  list/table/card sub-components, and its modals (Add/Edit/Delete), all colocated.
- Cross-feature primitives (buttons, badges, cards, modals shell, table shell) live once in `components/ui/`
  and are reused by every feature — never redefined per-feature (estatepulse-admin's inline `Button`
  component in `App.tsx` is the anti-pattern to avoid; it becomes `components/ui/Button.tsx` here).

## Styling: SCSS + Tailwind, reused classes only

**Decision: SCSS is preferred, used everywhere.** Rationale:

- Both reference projects lean entirely on inline Tailwind utility strings (see e.g.
  `estatepulse-admin/src/App.tsx`'s repeated `"bg-white border border-slate-200 rounded-xl shadow-sm"` and
  `"px-2 py-1 rounded text-[10px] font-bold uppercase"` blocks across Dashboard/Clients/Properties). That's
  exactly the copy-paste this project must avoid.
- Tailwind v4 (already installed, CSS-first config via `@theme`) stays available for **one-off inline
  utility classes directly in JSX** and provides the design-token source of truth (`@theme` in
  `app/globals.css`). Recurring utility combinations are grouped once into a named SCSS class instead of
  being repeated inline.
- SCSS gives nesting, `$variables`, and `@mixin`s for grouping those recurring styles.

**`@apply` is deliberately NOT used inside `.module.scss` / CSS Modules — this was tried and reverted.**
Tailwind v4's `@apply`, for any utility touching a "tracked" custom property (font-weight, letter-spacing,
spacing/gap, borders, shadows, rings — i.e. almost everything beyond raw colors), emits a global
`@property`-fallback rule (`*, ::before, ::after, ::backdrop { --tw-*: initial; ... }`) directly into that
file's compiled CSS. Webpack's css-loader enforces "pure" CSS Modules (every top-level selector must
contain a local class/id) and **rejects** that framework-injected global selector with `Syntax error:
Selector "*, ::before, ::after, ::backdrop" is not pure`. Turbopack tolerates it, which is why this only
surfaces under Webpack — and this project's Docker dev/prod path (`Dockerfile`, `Dockerfile.dev`,
`dev:docker` script) deliberately forces Webpack for reliable bind-mount file watching (see `docker-compose.yml`
comment), so the incompatibility is unavoidable here, not a corner case. Reproduce with
`npx next build --webpack` if this needs re-verifying after a Tailwind/Next upgrade.

Rules:

- **Every stylesheet is `.scss`**, with one unavoidable exception: `app/globals.css` stays plain CSS
  because Tailwind v4's `@import "tailwindcss"` bootstrap and `@theme` token block must live in a file
  that isn't first compiled by Sass (Sass tries — and fails — to resolve `@import "tailwindcss"` as a Sass
  partial).
- A Tailwind utility string used **once**, for a one-off layout tweak on a single element, can stay inline
  in JSX `className`. This is unaffected by the `@apply` issue above — it's not CSS-Modules-processed.
- A utility combination used **twice or more** (card container, status badge, table header cell, form
  input, button variant, stat tile) must become a named class, written as **plain hand-authored CSS/SCSS**
  (not `@apply`) using the tokens/mixins in `styles/_variables.scss` and `styles/_mixins.scss`:
  - Cross-feature primitives → `styles/components/_*.scss` (e.g. `_button.scss`, `_badge.scss`, `_card.scss`,
    `_modal.scss`), forwarded into `styles/shared.module.scss` and used by `components/ui/*`.
  - Feature-specific look → a colocated `<Component>.module.scss` next to that component, `@use`-ing
    `styles/_variables.scss` / `styles/_mixins.scss` via a relative path (e.g.
    `@use "../../styles/variables" as v;`).
- Design tokens (colors, spacing, radii, shadows) live in `styles/_variables.scss` as `$variables`, and are
  **hand-kept in sync** with the equivalent `--color-brand-*` entries in `app/globals.css`'s `@theme` block
  (the two can't `@use`/`@import` each other, since one is Sass and the other must stay plain CSS — see
  above). The primary palette is ported from `estatepulse-admin/src/index.css`'s overridden `indigo` scale
  (`#004261` primary) rather than default Tailwind indigo, to match the reference design.
- `styles/_mixins.scss` holds shared mixins (`card`, `flex-center`, `status-variant`, `button-base`,
  `badge-base`) instead of duplicating conditional class strings like
  `p.status === 'Active' ? '...' : '...'` inline in components.

## Data scoping by realtor — mandatory convention (CRITICAL)

**For every query, on every page, in every component: if the logged-in user's role is not `Root`
(i.e. `Administrator` or `Operator`), that user must only ever see data belonging to their own
`realtorId` — never another realtor's, and never platform-wide.** `Root` is the only role allowed to
see across every realtor. This is a standing instruction for all future work, the same way LogEntry
logging, the i18n convention, and the date-formatting convention are — don't wait to be asked
per-feature, and don't ship a new list/fetch/query without checking this first.

- **Scope by the logged-in user's own `realtorId` (`useCurrentUser().realtorId` client-side,
  `getCurrentUserId()` + a `User` lookup server-side once route-handler auth lands) — never by a
  `realtorId` read off some other fetched record.** A record's own `realtorId` field (a `Client`'s,
  a `Property`'s, ...) is data returned by an endpoint that — today — trusts its caller completely
  (see the "not yet implemented: Root-role route-handler enforcement" TODO repeated across nearly
  every section of this file). Until that TODO is closed, trusting a fetched record's `realtorId` to
  decide what else to show is circular: if that first fetch ever returned the wrong realtor's record
  (bad id in the URL, a future bug, a not-yet-landed auth gap), every *subsequent* fetch scoped off
  it would silently leak that other realtor's data too. Scoping off the session's own `realtorId`
  instead has no such dependency chain.
  - Caught live: `ViewingPanel`'s Property/Land picker (see "Viewings (Client)") originally scoped
    its `?realtorId=` fetches off the *Client's* `realtorId` (threaded down from `ClientViewPage`).
    Fixed to use `useCurrentUser().realtorId` for `Administrator`/`Operator` instead — the client's
    own `realtorId` is now only a `Root`-only fallback (`Root` has no `realtorId` of its own, so it
    falls back to the one specific realtor whose client page it's looking at, not every realtor's).
- **`Root` is the only exception.** Every other role is scoped, full stop — there is no third case.
- This governs client-side data-fetching decisions (which `?realtorId=` to pass, whether to call
  `list()`/`listForClient()` vs `listForRealtor()`, etc.) today, since that's the only enforcement
  that currently exists — see the Root-role route-handler TODO on almost every entity above. It does
  **not** relax or replace that TODO: route handlers must still gain real server-side role checks:
  this convention describes what those checks (and every scoping decision made ahead of them) must
  enforce once they land, not a substitute for landing them.
- Existing precedent this already matches: `ClientsPage`/`PropertiesPage`/`LandsPage` already pass
  `?realtorId={user.realtorId}` for non-Root callers and omit it (seeing everyone's) only for `Root`
  — see Client/Property/Land management above. Any new list-fetching component follows that same
  shape.

## Registration (implemented)

Self-service signup — anyone can create an account at `/signup` (email + password only), gets a
branded confirmation email, and finishes on `/confirm-registration?token=...` by filling in their
realtor profile. On success they're a fully linked `Administrator` + `Realtor` pair and are signed
in immediately (same cookie-setting behavior as login). Both `/signup` and `/confirm-registration`
are in `proxy.ts`'s `PUBLIC_PATHS`, alongside `/login`.

- **Why not just create an unconfirmed `User` at signup?** `models/User.ts`'s `pre("validate")`
  hook requires Administrator/Operator to already have a `realtorId` — and there's no `Realtor` yet
  at signup time (that's only collected on the confirmation step). Rather than relaxing that
  invariant, signup writes to a new, separate collection instead: **`PendingRegistration`**
  (`email`, `passwordHash`, `token`, `expiresAt` — 48h TTL). It only ever holds `email`+
  `passwordHash`, never a plaintext password, even temporarily — the password is bcrypt-hashed
  once at signup (`bcryptjs.hash`, same cost factor as `models/User.ts`'s own hook) and carried as
  a hash the whole way through.
- **The hash can't just be handed to `new User({ password: hash })` as-is** — Mongoose's
  password-hashing `pre("save")` hook would hash it a second time on creation (a new document's
  set paths are always "modified"), corrupting it. Fixed with a `$locals` flag: `UserRepository.
  createWithHashedPassword()` sets `user.$locals.skipPasswordHash = true` before `.save()`, and
  the hook checks that flag before re-hashing (`models/User.ts`). `$locals` is a Mongoose-native,
  never-persisted per-document scratch object — exactly the right tool for "skip this hook once,"
  and it doesn't touch the schema shape, so no restart-inducing field change was needed for it.
- **`services/RegistrationService.ts`** orchestrates all three steps:
  - `signup(email, password)` — 409-free by design: if the email already belongs to a real `User`,
    it logs a `Registration`-category warning and returns *silently*, no error. The route above it
    (`POST /api/auth/signup`) always sends back the same generic "if this email can be registered,
    a confirmation link has been sent" response either way — this is deliberate email-enumeration
    protection, the same reasoning as login's generic "Invalid credentials" message (see Auth). A
    second signup attempt for an email with an existing *pending* (unconfirmed) registration just
    replaces it with a fresh token/expiry rather than erroring — handles "I lost the first email."
  - `getPendingByToken(token)` — used by both the confirmation page's initial GET (to show/validate
    the email before rendering the realtor form) and by `completeRegistration` itself; treats an
    expired row as not-found rather than deleting it (no cleanup job exists yet — see below).
  - `completeRegistration(token, realtorInput)` — re-checks the email isn't already a `User` and
    the realtor email isn't already taken (race-condition safety, same checks `POST /api/realtors`
    itself makes), creates the `Realtor` first, then the `User` (role `Administrator`, `realtorId`
    = the new realtor's id) via `createWithHashedPassword`, then updates `Realtor.userId` to point
    back at the new user — same "profile can exist before, or independently of, a login account"
    two-step linkage the rest of the app already relies on (see Data layer). Deletes the
    `PendingRegistration` row (single-use token) and logs under category `"Registration"`.
- **Email — `lib/mail.ts` + `lib/mailTemplates.ts`, `nodemailer` + plain SMTP env vars** (`SMTP_HOST`/
  `PORT`/`SECURE`/`USER`/`PASSWORD`/`FROM_NAME`/`FROM_EMAIL`, see `.env.example`), not the DB-driven
  `ApplicationSetting`-backed SMTP settings panel `backend.think.cms` has — this app has no
  equivalent app-config-in-the-database system (Settings here is pool-entity lookups only), so SMTP
  config follows the same plain-env-var convention as every other credential in this repo
  (`JWT_SECRET`, `MONGODB_URI`, ...). `getTransporter()` in `lib/mail.ts` returns `null` when
  `SMTP_HOST`/`SMTP_USER` are unset, and `sendMail()` treats that as **best-effort, not fatal** —
  logs a console warning and returns `false` rather than throwing, so signup still works end-to-end
  in an environment with no SMTP configured (confirmed live: the dev container has no SMTP set, and
  a full signup → confirm → login round-trip still completes; the log line reads `[mail] SMTP not
  configured — skipping email to ...`). `lib/mailTemplates.ts` builds the actual HTML: a table-based
  layout (inline styles throughout, since email clients don't reliably support `<style>` blocks or
  external CSS) with a `$brand-600` (`#004261`) header bar, the WebRealtor logo embedded as a CID
  attachment (`cid:webrealtor-logo`, attached by `sendMail()` itself from `assets/img/
  webrealtor-logo.png` so every template can reference the same `cid:` without re-attaching it), a
  primary CTA button linking to `${APP_BASE_URL}/confirm-registration?token=...`, and a muted footer
  — reusing this repo's own brand palette rather than introducing new one-off colors, per the "make
  it branded" ask. `APP_BASE_URL` (new env var) is what makes that link absolute and
  recipient-clickable — it must be reachable by the recipient's browser, not just other containers,
  unlike `MONGODB_URI`'s in-network hostname.
- **UI** — `components/auth/SignupPage.tsx` and `components/auth/ConfirmRegistrationPage.tsx` both
  `import styles from "./LoginPage.module.scss"` directly rather than colocating their own nearly-
  identical stylesheet — deliberate, not an oversight: the ask was "same design [as login]," and the
  existing `.wrapper`/`.panel`/`.title`/`.logo`/`.subtitle` classes are exactly that design with
  nothing feature-specific to differentiate (confirmed the shared 28rem `.panel` width is already
  what `RealtorForm`'s 2-column grid renders at inside `EditRealtorModal`, so no wider panel was
  needed for the confirmation page's realtor form either). `SignupPage` only collects email +
  password and shows a "check your email" confirmation state in place of the form on success — it
  never redirects or signs the user in, since there's no session yet at that point.
  `ConfirmRegistrationPage` reads `?token=` via `useSearchParams()` (wrapped in `<Suspense>` at the
  route's `page.tsx`, which `useSearchParams()` requires), GETs `/api/auth/registrations/[token]` on
  mount to validate the token and recover the pending email, then reuses `components/realtors/
  RealtorForm.tsx` as-is (prefilled with `{ email }`, same component `EditRealtorModal`/`ProfilePage`
  use) for the realtor-info step — no new form was built for this. On success it dispatches
  `setUser` and redirects to `/dashboard`, exactly like `LoginPage`. **Login and Signup now cross-link**:
  `LoginPage` gained a "Don't have an account? Sign up" line below its card, `SignupPage` a mirrored
  "Already have an account? Sign in" line.
- Not yet implemented: a cleanup job for expired `PendingRegistration` rows (they're simply treated
  as not-found once `expiresAt` passes, not deleted — harmless since the unique index on `email`
  means a fresh signup attempt just replaces the stale row anyway, but there's no scheduled sweep for
  ones nobody retries), a "resend confirmation email" affordance (the workaround today is signing up
  again with the same email, which silently issues a fresh token), and Root-role route-handler
  enforcement (same TODO as every other entity) — though `/api/auth/complete-registration` is
  inherently self-scoped by construction (it only ever creates a `Realtor`+`User` pair from the token
  it's given, never acts on a caller-supplied id), the same reasoning that already applies to
  `/api/auth/change-password`.

## Realtor management (implemented)

The first fully implemented feature, following every convention above end-to-end:

- **Model** — `models/Realtor.ts`: `firstName`, `lastName` (required), `email` (required, unique,
  lowercased/trimmed), `phone`, `mobile`, `city`, `address`, `postcode`, `googleMapsUrl`, `website`
  (all optional strings), `userId` (optional `User` ref), `saleCommission`/`rentCommission`
  (optional numbers, nullable, `min: 0` — see "Realtor commission rates" below), plus
  `createdAt`/`updatedAt` via `timestamps: true`.
- **Repository** — `repositories/RealtorRepository.ts` extends `BaseRepository` and adds `findByEmail`
  (uniqueness checks) and `findByUserId`.
- **Service** — `services/RealtorService.ts`: mostly a thin pass-through to the repository (`get`,
  `findByEmail`, `create`, `update`, `remove`), except `list()` — it also computes `clientCount`/
  `propertyCount` per realtor (via `ClientService.countForRealtor`/`PropertyService.countForRealtor`,
  parallel `countDocuments` calls, one round of `Promise.all` per realtor) and merges them onto each
  returned object. These counts are **derived, not stored** on the `Realtor` document — they exist only on
  `list()`'s response (`Realtor.clientCount`/`propertyCount` are typed optional in `lib/types.ts` for exactly
  this reason: absent right after `create`/`update`, present after `list`). Deliberately **not** a separate
  `/api/realtors/[id]/stats` endpoint — that was the first pass and got replaced because it meant one extra
  HTTP request per realtor row from the browser; bundling the counts into the existing list response is a
  single request regardless of how many realtors there are. Request validation and the email-uniqueness
  check live in the route handlers (matching backend.think.cms's own `POST /api/users` precedent), not the
  service.
- **API** — `app/api/realtors/route.ts` (`GET` list, `POST` create) and `app/api/realtors/[id]/route.ts`
  (`GET`/`PUT`/`DELETE`). Validates required fields (`firstName`, `lastName`, `email`) → `400`, duplicate
  email → `409`, missing record → `404`. `TODO` comments mark where Admin-role gating still needs to land
  once route-level auth middleware exists — right now these routes are unauthenticated.
- **UI** — `components/realtors/`:
  - `RealtorsPage.tsx` — fetches the list via `apiClient` on mount, re-fetches after every mutation (no
    optimistic updates, kept simple on purpose). Shows the page-load count message (see Footer notifications
    below) on the initial load only — reloads after Add/Edit/Delete pass `{ silent: true }` so they don't
    stomp on that mutation's own success message.
  - `RealtorTable.tsx` — Contact column icons (`Mail`/`Phone`/`Smartphone`) are clickable `mailto:`/`tel:`
    links, not just decoration. Location is a clickable link to `realtor.googleMapsUrl` (opens in a new tab)
    when that field is set, plain text otherwise. Stats column reads `realtor.clientCount`/`propertyCount`
    directly (see Service note above) — no per-row fetch.
  - `RealtorForm.tsx` (shared by both modals), `AddRealtorModal.tsx`, `EditRealtorModal.tsx`,
    `DeleteRealtorModal.tsx` — each does one job, per the component convention above.
  - Form field styles (`.field`/`.label`/`.input`/`.formGrid`/`.formActions`/`.errorText`) were factored out
    of `LoginPage.module.scss` into `styles/components/_form.scss` (forwarded through
    `styles/shared.module.scss`) the moment a second form needed them — LoginPage now consumes the same
    shared classes instead of its own copies.
- Not yet implemented: Admin-only route guarding, pagination/search on the list endpoint, and linking a
  `Realtor` to a `User` login (the `userId` field exists but nothing sets it yet).

### Realtor commission rates

`Realtor.saleCommission` / `Realtor.rentCommission` are each a **fraction of price, not a
percentage 0–100** (e.g. `0.1` means 10%, `0.5` means 50%) — the UI field
(`realtors.form.saleCommission`/`rentCommission` in `RealtorForm.tsx`) accepts that fraction
directly (placeholder text: `realtors.form.commissionPlaceholder`, "e.g. 0.1 for 10%"), there's no
0–100 → fraction conversion layer. Both are optional/nullable (`null` by default) — an unset rate
just means TransactionForm's auto-fill (see "Transactions" below) leaves commission for manual
entry instead of computing one. `RealtorForm.tsx` is shared by `AddRealtorModal`/`EditRealtorModal`
**and** `ConfirmRegistrationPage` (self-registration, see "Registration"), so a self-registering
realtor sees these two fields too — left blank by default, settable later by Root/Administrator via
the normal edit flow. `saleCommission` applies to a **"buy" action** (a completed purchase/sale),
`rentCommission` to a **"rent" action** — matching `Transaction.action`'s own vocabulary
(`"rent" | "buy"`, see "Transactions"), not `Property`/`Land.transactionType`'s `"sale" | "rent"`
(a listing's posture, a different concept — see "Transactions"' own field doc for why those two
vocabularies are deliberately not reused for each other).

## User management (implemented)

- **Model** — `models/User.ts`: `email` (required, unique), `password` (hashed, `select: false`), `role`
  (`Root`/`Administrator`/`Operator`, from `USER_ROLES` in `lib/types.ts` — the single source of truth,
  imported by both the schema's `enum` and the API routes' validation), `realtorId` (nullable `Realtor` ref),
  `language` (`Locale` — `"en" | "el" | "ru"`, from `LOCALES`/`DEFAULT_LOCALE` in `lib/i18n/locales.ts`,
  required, defaults to `"en"`). The Root ⇒ `realtorId: null` / others ⇒ `realtorId` required invariant is
  enforced in a `pre("validate")` hook, so it holds regardless of caller. `language` has no such invariant —
  every role has one, self-service editable on the Profile page (`POST /api/auth/language`, see Profile
  below), not exposed on the admin-facing `UserForm` (deliberately out of scope — a Root/Administrator
  creating/editing *another* user has no reason to set that user's own display-language preference for
  them; new users simply get the schema default until they change it themselves).
- **Repository** — `repositories/UserRepository.ts`: `findByEmail` (used for both login and uniqueness
  checks), `findByRealtorId`, and `updateWithPassword` — a dedicated update path that fetches the document
  and calls `.save()` instead of `findByIdAndUpdate`, because the password-hashing `pre("save")` hook only
  fires on `.save()`. `BaseRepository.update()` (which every other entity uses) would silently persist a
  **plain-text** password if used here.
- **Service** — `services/UserService.ts`: thin pass-through, `update()` calls `updateWithPassword`.
- **API** — `app/api/users/route.ts` + `app/api/users/[id]/route.ts`: validates email/password
  (min 8 chars)/role, validates `realtorId` both for presence (per the Root rule above) and existence (via
  `RealtorService.get`), 409 on duplicate email. Password is optional on `PUT` — omitted/blank means "keep
  the current one". **The route handlers strip `password` from every response and log payload** — see the
  Data layer's serialization warning above; this is not optional, it was a real leak caught via live testing.
- **UI** — `components/users/`: `UserForm.tsx` fetches the realtor list itself (for the realtor `<select>`)
  and conditionally hides that field entirely when `role === "Root"`; `UserTable.tsx` resolves `realtorId` →
  display name via a `Record<string, string>` map built client-side from the realtors list (deliberately
  *not* via `.populate()` in the repository — a populated `realtorId` would return a nested object where the
  form/table code otherwise always treats it as a plain string id; keeping it a string everywhere and
  joining client-side avoided a dual-shape type). `UserForm` deliberately does **not** use
  `sharedStyles.formGrid` (the 2-column layout `RealtorForm` uses) — every field stacks one-per-row instead,
  per an explicit request. That's a per-form choice, not a change to the shared grid class itself; a future
  form can pick either layout.
- Not yet implemented: Root/Administrator-only route guarding (same TODO as Realtors), scoping the Users
  list to the caller's own realtor for non-Root callers.

## Profile (implemented)

Self-service account page — every logged-in user (any role) can reach it via a "Profile" link in
`Topbar.tsx`'s account dropdown, positioned above "Sign out" (`components/layout/Topbar.tsx`, `UserCircle`
icon, `router.push("/profile")`). Lives at `app/(dashboard)/profile/page.tsx` → `components/profile/
ProfilePage.tsx`; not in `proxy.ts`'s `ROOT_ONLY_PREFIXES`, so it's reachable by every role by default, the
same "not in the list" behavior as `/lands` (see Land management).

- **Password change is a new dedicated endpoint, not a reuse of `PUT /api/users/:id`.** The existing
  users-management endpoint has no current-password check and is meant for Root/Administrator resetting
  *other* users' passwords — reusing it for self-service would let a stolen session change the password
  with no re-proof of identity. Instead: `POST /api/auth/change-password` (`{ currentPassword,
  newPassword }`), backed by `AuthService.changePassword(userId, currentPassword, newPassword)` —
  identifies the caller via `getCurrentUserId()` (session cookie), loads the user via the new
  `UserRepository.findByIdWithPassword()` (mirrors `findByEmail`'s `.select("+password")`, since the field
  is `select: false` by default), verifies `currentPassword` via the existing `comparePassword` method, and
  on success calls the existing `updateWithPassword()` so the `pre("save")` hashing hook fires. Logs via
  `LogEntryService` under category `"Security"` (info on success, warning on a wrong-current-password
  attempt) — same category/severity convention as login. **Unlike login's deliberately generic "Invalid
  credentials" message** (which exists to prevent email enumeration for an unauthenticated caller), the
  change-password route returns a specific "Current password is incorrect" 400 — there's no enumeration
  risk here since the caller's identity is already established by their session.
- **Realtor-info editing reuses the existing `PUT /api/realtors/:id` endpoint directly** — no new backend
  code, since there's no route-level auth restricting callers yet (the same blanket TODO as every other
  entity) and `ProfilePage` already knows the current user's own `realtorId` from Redux auth state. The
  form itself reuses `components/realtors/RealtorForm.tsx` as-is (the same component `EditRealtorModal`
  uses), rather than duplicating its ~10 fields.
- **The requested "root or admin can edit realtor info" rule is reconciled with the data model, not
  followed literally.** `models/User.ts`'s `pre("validate")` hook enforces Root's `realtorId` is always
  `null` — so a role-based `role === "Root" || role === "Administrator"` gate would render a realtor-info
  form for Root with nothing to load. `ProfilePage` instead gates the section on `user.realtorId` being
  truthy, which in practice means only Administrator ever sees it (Operator never has edit rights on
  anything per `useCanEdit()`, and Root never has a `realtorId`) — functionally identical to the request,
  but correct if that invariant ever changes. Verified live: logging in as the seeded Root user shows only
  the Change Password card; a Root or Operator response never renders "Realtor Info".
- **UI** — `components/profile/ProfilePage.tsx`: two stacked `Card`s — Realtor Info (conditional, see
  above) and Change Password (always shown, every role including Operator). Neither form navigates away or
  closes anything on cancel/success (there's nowhere to navigate to on a standalone page, unlike a modal),
  so both `RealtorForm`'s `onCancel` and a successful password change instead force a remount via an
  incrementing `key` state to reset the form's fields back to their initial values — cheaper than adding
  an imperative reset method to either form. `components/profile/ChangePasswordForm.tsx` is a new,
  dedicated form (current/new/confirm-new fields, client-side match check before calling `onSubmit`) rather
  than a repurposed `UserForm` — `UserForm`'s password field is optional-on-edit with no current-password
  concept at all, since it's built for an admin resetting someone else's password, not a self-service flow.
- **Language change** — a third `Card`, `components/profile/LanguageForm.tsx` (a single `<select>` of
  `LOCALE_OPTIONS` + a Save button, mirroring `ChangePasswordForm`'s shape), always shown like Change
  Password. Posts to `POST /api/auth/language` (`{ language }`, backed by `AuthService.updateLanguage`),
  which validates via `isLocale()` and persists via a plain `userRepository.update()` (not
  `updateWithPassword` — no password involved, so the `.save()` detour that hook needs isn't necessary
  here). On success, `ProfilePage` dispatches **both** `authSlice.setUser` (so `user.language` in Redux
  matches what's now in the DB) **and** `localeSlice.setLocale` (so the UI actually switches language
  immediately, not just on next login) — the two slices are related but distinct: `authSlice.user.language`
  is "what the account has saved," `localeSlice.locale` is "what the UI is rendering *right now*," and a
  successful save should update both in lockstep. `LanguageForm` remounts via `key={user.language}` (same
  reset-via-remount trick `ProfilePage` already uses for `RealtorForm`) so its local `<select>` state
  re-syncs if `user.language` changes from outside the form itself.
- **The account's own `language` now wins over `store/localeSlice`'s localStorage-only guess** — every
  place that dispatches `authSlice.setUser` (`LoginPage`, `ConfirmRegistrationPage`,
  `DashboardShell`'s `GET /api/auth/me` hydration) now also dispatches `localeSlice.setLocale(user.
  language)` right after, so the account's stored preference is authoritative the moment it's known,
  overriding whatever `LocaleHydrator` guessed from `localStorage` before that. `LocaleHydrator` itself is
  unchanged and still needed — it's what makes the **login page itself** (reached before any `User` is
  known) render in the last-used language rather than always `DEFAULT_LOCALE`.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity) — the new
  `POST /api/auth/change-password`/`POST /api/auth/language` routes are scoped to the caller's own account
  by construction (they always operate on `getCurrentUserId()`, never a caller-supplied id), so this gap
  doesn't apply to them the way it does to the admin-facing entity routes.
- **Display name** — a fourth `Card`, `components/profile/DisplayNameForm.tsx` (a single free-text input +
  Save button, same shape as `LanguageForm`), shown first, above Language. Backed by `models/User.ts`'s new
  `displayName` field (`String`, `default: ""`, `trim: true` — deliberately **not** part of the
  Root-realtorId-null-style invariants, every role can set one) and `POST /api/auth/display-name`
  (`{ displayName }`, backed by `AuthService.updateDisplayName`) — same self-scoped-by-construction shape as
  `/api/auth/language`, an empty string is a valid value (clears it). Not exposed on the admin-facing
  `UserForm`, same reasoning `language` isn't: an admin creating/editing *another* user has no reason to set
  that user's own display identity for them.
  **`lib/displayName.ts`'s `getDisplayName(user)`** (`user.displayName.trim() || user.email`) is the single
  source of truth for "what name do we show for this user" — used by `Topbar.tsx`'s account-menu
  trigger/header (replacing the raw `user.email` display) and by the post-login welcome message
  (`LoginPage.tsx`, `ConfirmRegistrationPage.tsx` — `auth.welcomeMessage`'s interpolation param was renamed
  `{email}` → `{name}` across all three locale catalogs to match). Falls back to `email` whenever
  `displayName` is unset, so nothing regresses for existing accounts. `DisplayNameForm` remounts via
  `key={user.displayName}`, same reset-via-remount trick `LanguageForm` uses for `key={user.language}`.

## Client management (implemented)

Belongs to a `Realtor`, not a global entity like Users/Realtors — the first feature where the
Root-sees-everything / Administrator-Operator-scoped-to-their-own-realtor split (see Auth) actually shapes
the data layer, not just page/nav access.

- **Model** — `models/Client.ts`: `gender` (nullable, `"Male" | "Female"` from `GENDERS` in
  `lib/types.ts` — no third "Other" option, by explicit request), `firstName`/`lastName` (required), `tin`,
  `city`, `address`, `zipcode`, `email`, `phone`, `mobile` (all optional strings), `realtorId` (required
  `Realtor` ref). There is no owner/customer classification — a client is just a client; an earlier
  `isOwner`/`isCustomer` pair (with a `pre("validate")` hook requiring at least one to be true) was removed
  by explicit request shortly after being built, along with the hook.
- **Repository/Service** — `repositories/ClientRepository.ts` + `services/ClientService.ts`: `list()` (every
  client, any realtor — for Root), `listForRealtor(realtorId)` (scoped — for Administrator/Operator),
  `countForRealtor(realtorId)` (used by `RealtorService.list()`'s stats, see Realtor management).
- **API** — `GET /api/clients` takes an **optional** `?realtorId=` — present ⇒ scoped
  (`listForRealtor`), absent ⇒ every client (`list()`). The frontend decides which to send based on the
  logged-in user's role (see UI below); the route itself doesn't yet enforce that an Administrator/Operator
  caller can't omit it and see everyone's clients — same still-TODO route-level auth gap as every other
  entity. `POST`/`PUT` validate `firstName`/`lastName`/`realtorId` (existence, via `RealtorService.get`) →
  `400`.
- **UI** — `components/clients/`:
  - `ClientsPage.tsx` reads `useCurrentUser()`: if `role === "Root"`, calls `GET /api/clients` (all) and
    also fetches `/api/realtors` to resolve names for a Realtor column; otherwise calls
    `GET /api/clients?realtorId={user.realtorId}` and skips the realtor fetch entirely (nothing to resolve —
    every row belongs to the same realtor already visible in the page header context).
  - `ClientForm.tsx` mirrors this: shows a Realtor `<select>` only for Root (same pattern as `UserForm`);
    for Administrator/Operator, `realtorId` defaults to `user.realtorId` and the field never renders — they
    physically cannot assign a client to a different realtor from the UI. **This Root-only visibility rule
    is the one part of the original design explicitly reconfirmed when the owner/customer fields were
    removed — do not regress it.**
  - `ClientTable.tsx` — Contact icons (`Mail`/`Phone`/`Smartphone`) are clickable `mailto:`/`tel:` links,
    same convention as `RealtorTable`; no Type column (removed along with `isOwner`/`isCustomer`); Realtor
    column and the Actions column are each conditionally rendered (`showRealtorColumn`, `canEdit` props)
    rather than always present with empty cells.
  - Page-load count message (`"Number of clients: {count}"`) and silent post-mutation reloads — same
    convention as Realtors/Users (see Footer notifications).
- Not yet implemented: route-level enforcement that Administrator/Operator can't pass someone else's
  `realtorId` (the API trusts the caller for now, same gap as everywhere else). `Property.clientId` links
  a property to its owning client and is set from `PropertyDetail`'s Client dropdown (see Property
  management below), but nothing on the Client side surfaces which properties belong to a given client yet.

## Property management (implemented)

The largest entity in the system by field count (~90 fields) and the first to deviate from the
modal-based CRUD every other entity uses — a create/edit form that size doesn't fit a modal, so it's a
full page instead (see UI below). Fields came from auditing a real competing property portal's
edit-listing form (the same audit that produced the 11 attribute pool entities above) plus explicit
follow-up requests (`publishedAt`, Location fields, multi-image support).

- **Model** — `models/Property.ts`: `realtorId` (required `Realtor` ref), `clientId` (optional `Client`
  ref — the owner), then ~85 more fields grouped the same way the UI groups them (Basic Info, Property
  Description, Heating & Consumption, Construction, Technical Features & Interior, Outdoor Spaces &
  Location on Plot, Suitable For, Description, Location, Media). Thirteen fields are ObjectId refs into
  the pool entities above (`propertyCategoryId`, `floorLevelId`, `energyClassId`, `heatingSystemId`,
  `heatingMediumId`, `buildingFloorsId`, `joineryTypeId`, `glassTypeId`, `floorTypeId`, `gardenTypeId`,
  `orientationId`, `zoningTypeId`, `roadAccessTypeId`) — `energyClassId` and `propertyCategoryId` are
  required, the rest optional. There is no separate free-text "category" field — see "Property attribute
  pool entities" below for why it was removed in favor of the `propertyCategoryId` dropdown. `descriptions` is a `Map<string, string>` keyed by locale (only Greek is
  populated by the UI today, but the shape allows more later) — Mongoose's `flattenMaps: true` (set
  globally, see Data layer) means it serializes as a plain object automatically, no manual conversion
  needed on the way out. `images` is a plain `string[]` of URLs — **not file upload**, deliberately out of
  scope for now (the UI's "Add Image" control just appends a pasted URL to the array).
- **Repository** — `repositories/PropertyRepository.ts` extends `BaseRepository`, adds
  `findByRealtorId`/`countByRealtorId` (same scoping pattern as `ClientRepository`). Hard delete, unlike
  the Settings pool entities' soft delete — a listing has no audit-trail reason to survive removal the
  way a lookup value does.
- **Service** — `services/PropertyService.ts`: `list()` (every property, any realtor — for Root),
  `listForRealtor(realtorId)`/`countForRealtor(realtorId)` (scoped — for Administrator/Operator, and for
  `RealtorService.list()`'s stats), plus `get`/`create`/`update`/`remove` pass-throughs.
- **API** — `app/api/properties/route.ts` (`GET` optional `?realtorId=`, same scoped-vs-all pattern as
  Clients; `POST`) and `app/api/properties/[id]/route.ts` (`GET`/`PUT`/`DELETE`). **Validation/coercion is
  a shared helper, not hand-mapped per route** — `app/api/properties/parsePropertyBody.ts` exports
  `parsePropertyBody(body)`, returning `{ errors, data }`. This is a deliberate deviation from the
  Client/Realtor precedent (where each route hand-maps its own fields): at ~90 fields, duplicating the
  same string→number/boolean/Date/ObjectId coercion in both POST and PUT would have been ~180 lines of
  copy-paste. The file lives directly under `app/api/properties/` (not `lib/` or `services/`) but is
  invisible to Next's router since only `route.ts`/`page.tsx` (etc.) are routable — it's a colocated
  helper, not a route. `price`/`area`/`propertyCategoryId`/`energyClassId` are required (→ `400` listing
  every missing field); `transactionType` must be `"sale"` or `"rent"`. Every boolean field coerces via
  `Boolean(value)`, every ObjectId ref via `new mongoose.Types.ObjectId(value)` when a non-empty string is
  present, else `null`. Logs via `LogEntryService.info` under category `"Properties"` on create/update/
  delete, same as every other entity.
- **UI** — `components/properties/`:
  - `PropertiesPage.tsx` — same Root-sees-all / Administrator-Operator-scoped pattern as `ClientsPage`
    (reads `useCurrentUser()`, calls `GET /api/properties` or `?realtorId=` accordingly), but list-row
    actions navigate via `useRouter` to `/properties/new` and `/properties/[id]` instead of opening a
    modal — see the full-page rationale below.
  - `PropertyTable.tsx` — Listing/Status/Location/Price/[Realtor]/[Actions] columns (Realtor column
    conditional on Root, same `showRealtorColumn` pattern as `ClientTable`), status `Badge`, icon-only
    Edit/Delete actions.
  - `DeletePropertyModal.tsx` — the one piece of Property CRUD that *is* a modal (a delete confirmation
    is small regardless of entity size, so it doesn't need the full-page treatment).
  - `PropertyDetail.tsx` (**full page, not a modal — the one deliberate deviation from this repo's
    modal-based CRUD convention**): at ~90 fields, a modal would either need internal scrolling inside a
    small fixed-size box or become unusably tall — a full page with normal document scroll is simply the
    right container size for a form this large. Used for both create (`mode="create"`, at
    `/properties/new`) and edit (`mode="edit"` + `propertyId`, at `/properties/[id]`) — one component,
    not two, since the two modes only differ in whether a property is fetched on mount and whether the
    submit calls `POST` or `PUT`. Fetches all 13 pool-entity lists plus the realtor list (and, for
    Administrator/Operator, only their own scoped client list) in parallel on mount to populate the
    `<select>`s. Keeps its own `FormValues` shape — **all fields as strings/booleans for controlled
    inputs**, deliberately distinct from the typed `Property`/`PropertyInput` domain interfaces — and
    relies entirely on server-side coercion (`parsePropertyBody`) to convert strings to numbers/dates/
    ObjectIds on submit; this kept the form free of manual type-juggling and typechecked clean on the
    first pass. `propertyToFormValues()` is the inverse conversion used to populate the form in edit mode.
  - `PropertyFormFields.tsx` — `SelectField`/`TextField`/`BoolField`/`SectionHeading`, small reusable
    renderers extracted the moment the same label+input JSX shape would've been repeated ~90 times (see
    Styling's "a utility combination used twice or more must become a named class/component," the same
    reasoning scaled up to whole form-field components, not just CSS classes).
  - Media section: a plain URL-list add/remove UI (type a URL, click "Add Image", or "Remove" an existing
    one) — no file picker/upload endpoint exists yet.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity) and file-upload
  support for images (URL-list only, by explicit scope decision). `Property.clientId` (set from
  `PropertyDetail`'s Client dropdown) is now surfaced from the Client side too, via the read-only
  Owns tab on the Client View Page — see CLAUDE.md → "Owns (Client)".

## Property View Page (implemented)

A read-only, "nice design" presentation of a single property — distinct from the ~90-field edit
form at `/properties/[id]` (`PropertyDetail.tsx`), which stays a form. Lives at
`/properties/[id]/view`, visible to **every role**, unlike Media/Edit/Delete which stay
`canEdit`-gated.

- **UI** — `components/properties/PropertyViewPage.tsx` (+ `.module.scss`): fetches the property,
  then in parallel resolves everything the raw document only stores as an id — the realtor
  (`GET /api/realtors/:id`, **Root-only** — the Listing Realtor card is gated behind `isRoot`, since
  a non-Root caller already knows their own realtor), the owning client if `clientId` is set
  (`GET /api/clients/:id`), all 13 pool-entity names referenced by the property's `*Id` fields
  (`GET /api/<route>/:id` per field, via a small `fetchPoolName(route, id)` helper — chosen over
  fetching each pool list in full, since the view page only ever needs one resolved name per field,
  not the whole list the edit form needs for its `<select>`s), and this listing's price history (see
  below). Layout: hero image + thumbnail strip (falls back to an "No photos yet" empty state), a
  stats bar (price/status/transaction type/bedrooms/bathrooms/area/category — the "For Sale"/"For
  Rent" tag is a solid red/white pill, deliberately distinct from the softer status `Badge` next to
  it), then a two-column body — owner/description/features/price-history/technical-details/**notes**
  on the left (owner and price-history were deliberately moved above description/technical-details
  per explicit request), Listing Realtor (Root-only)/listing-meta on the right. The location line
  under the page title is itself a clickable link straight to Google Maps — there's no separate
  Location card in the body. The Features & Amenities list re-filters the existing ~45
  `properties.detail.*` boolean-flag label keys down to whichever are `true` on this property,
  rather than introducing new keys for the same concepts.
- **User resolution is scoped, not global.** Price history rows show who changed the price, but
  this page (unlike the Root-only `LogsPage`) is reachable by every role — fetching the entire
  `/api/users` list the way `LogsPage` does would leak every system user's email to an Operator.
  Instead, `PropertyViewPage` collects only the distinct `userId`s actually referenced in this
  listing's price history and resolves each individually via `GET /api/users/:id` (safe: that
  route never loads the `password` field to begin with, see Data layer). Notes' own author
  resolution follows the exact same scoped pattern, independently, inside `NotesPanel` — see "Notes".
- **Notes** — a `Card` section wrapping `<NotesPanel entityType="Property" entityId={property.id} />`
  (see "Notes" above), placed after Technical Details. This *replaced* what used to be a
  `StickyNote` row action + `NotesModal` on `PropertyTable`/`PropertiesPage` — moved here once the
  view page existed to host it, per the same reasoning Realtor/Client got their own view pages for.
- **Table wiring** — `PropertyTable.tsx` has an always-visible `Eye`-icon "View" action; the
  Actions `<td>`/column-count logic was restructured so the column itself is no longer conditional
  on `canEdit` (only the Media/Edit/Delete buttons inside it still are). `PropertiesPage.tsx` wires
  `onView` to `router.push(`/properties/${id}/view`)`.
- Not yet implemented: an equivalent Land view page (Land still only has the edit form) — see
  Price History below for why its backend already supports Land regardless, and "Notes" above for
  why `LandTable` still opens Notes via a modal instead.

## Realtor View Page (implemented)

A read-only detail page at `/realtors/[id]/view`, visible to every role (though in practice only
Root ever reaches `/realtors` at all, per `proxy.ts`'s `ROOT_ONLY_PREFIXES`). Distinct from the
Add/Edit modals `RealtorsPage` already uses — this is a new page, not a replacement for them; editing
still happens via `EditRealtorModal` from the list.

- **UI** — `components/realtors/RealtorViewPage.tsx` (+ `.module.scss`): fetches the realtor, then
  (if `userId` is set) the linked login account via `GET /api/users/:id` to show its email/role in
  an "Login Account" card. Layout: back link + name + email subtitle, a stats bar reusing
  `realtors.table.stats*` i18n keys (property/land/client counts — same derived, not-stored fields
  `RealtorService.list()` already computes), a 3-column row of Contact/Location/Account cards, then
  a Notes section (see "Notes" above) full-width below.
- **Table wiring** — `RealtorTable.tsx`'s row-action `StickyNote` "Notes" button was replaced with
  an `Eye`-icon "View" button; `RealtorsPage.tsx` wires it to `router.push('/realtors/${id}/view')`
  instead of opening `NotesModal` (which `RealtorsPage` no longer renders at all).
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Client View Page (implemented)

A read-only detail page at `/clients/[id]/view`, same rationale and relationship to
`AddClientModal`/`EditClientModal` as the Realtor View Page above — editing stays on the list.

- **UI** — `components/clients/ClientViewPage.tsx` (+ `.module.scss`): fetches the client, and (Root
  only) its owning realtor via `GET /api/realtors/:id` for a Realtor line in the Details card — the
  same Root-only visibility rule `ClientsPage`/`ClientForm` already enforce for the Realtor
  column/field, reapplied here rather than showing it to everyone. Layout: back link + name + email
  subtitle, a 3-column row of Contact/Location/Details cards (Details holds gender — reusing
  `clients.form.gender{Male,Female}`, not a new key — TIN, and the Root-only realtor line), then a
  Notes section full-width below.
- **Table wiring** — `ClientTable.tsx`'s row-action `StickyNote` "Notes" button was replaced with an
  `Eye`-icon "View" button, always visible now (previously the whole Actions column, Notes included,
  was hidden for `!canEdit`; the column is no longer conditional, only Edit/Delete inside it still
  are). `ClientsPage.tsx` wires it to `router.push('/clients/${id}/view')` instead of opening
  `NotesModal` (which `ClientsPage` no longer renders at all).
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Price History (implemented)

Tracks every price a Property or Land listing has ever had — one entry per creation and per price
change on update — surfaced as a table in the Price History section of the Property View Page
above.

- **Model** — `models/PriceHistory.ts`: a single shared collection (not split per entity), the
  same "one generic audit-style collection, discriminated by a type field" shape `LogEntry` already
  established — `listingId` (no `ref`, since it points at either `Property` or `Land` depending on
  `listingType`, and is never `.populate()`'d, same reasoning as `LogEntry`'s `userId`/`realtorId`),
  `listingType` (`"Property" | "Land"`), `price`, `currency`, `userId` (nullable `User` ref). No
  separate `date` field — `createdAt` (from `baseSchemaOptions`, mandatory on every model) already
  *is* "the date this price was recorded," so a redundant field was skipped.
- **Repository/Service** — `repositories/PriceHistoryRepository.ts` (`findByListing(listingId,
  listingType)`, newest-first), `services/PriceHistoryService.ts` (`record(...)`,
  `listForListing(...)`). **`record()` is best-effort**, same discipline as `LogEntryService.write()`
  — wrapped in try/catch, swallows and `console.error`s its own failures so a price-history write
  can never break the property/land save it rides along with.
- **Wiring** — every one of the four mutating routes calls it: `POST /api/properties` and
  `POST /api/lands` record the initial price on creation unconditionally; `PUT /api/properties/[id]`
  and `PUT /api/lands/[id]` record a new entry **only when the price actually changed**
  (`existing.price !== data.price`), so an edit that doesn't touch price doesn't spam the history.
  `userId` comes from the same `getCurrentUserId()` call already made for that route's
  `LogEntryService` call — not a second lookup.
- **API** — `GET /api/properties/[id]/price-history` and `GET /api/lands/[id]/price-history`,
  read-only (same convention as `GET /api/logs` — price history is never written through these
  endpoints, only from within the create/update routes above).
- **Built for both Property and Land from day one** (per explicit request — "for each property or
  land"), even though only the Property View Page exists yet to display it. Land listings have been
  recording price history since this landed; there's simply no Land-side UI to show it until a Land
  View Page is built — at that point it's a `GET /api/lands/[id]/price-history` call away, no
  backend work required.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity), a
  Land View Page to surface Land's own price history, and any backfill for listings that existed
  before this feature — their price history starts from whenever their price next changes, not from
  their original creation date.

## Energy Class management (implemented)

The first implemented **Settings** lookup list (Property Options is still the "Coming soon"
placeholder in `SettingsSidebar`/`SettingsPage`; Heating was filled in next — see "Heating System
management" below) — a flat, global (not per-realtor) list of values used elsewhere as a property's
energy rating. Built before the `slug` field convention (below) was introduced, so it's `name` +
`deletedAt` only — don't copy that gap into a new pool entity going forward.

- **Model** — `models/EnergyClass.ts`: `name` (required string), plus `deletedAt` (nullable `Date`,
  default `null`) alongside the usual `createdAt`/`updatedAt`. **Soft delete, not hard delete**:
  `EnergyClassRepository.softDelete(id)` sets `deletedAt` via `findByIdAndUpdate` rather than
  removing the document (`EnergyClassService.remove()` calls this, not `BaseRepository.delete`) —
  the audit trail (and any future property that references a since-retired rating) keeps the row
  around. `findActive()`/`findByName()` both filter `{ deletedAt: null }`, so a soft-deleted row
  never resurfaces in the list or in the create/update duplicate-name check.
- **Repository** — `repositories/EnergyClassRepository.ts`: `findActive()` sorts **ascending** by
  `createdAt` (the opposite of `BaseRepository.findAll`'s newest-first default) so the ratings keep
  a stable best→worst order matching how they were seeded, rather than most-recently-edited-first.
- **Service** — `services/EnergyClassService.ts`: thin pass-through (`list` → `findActive`, `get`,
  `findByName`, `create`, `update`, `remove` → `softDelete`).
- **API** — `app/api/energy-classes/route.ts` (`GET` list, `POST` create) and
  `app/api/energy-classes/[id]/route.ts` (`GET`/`PUT`/`DELETE`) — same validation/409-on-duplicate/
  404-on-missing shape as Realtors, `LogEntryService.info` under category `"EnergyClass"` on
  create/update/delete. `DELETE` calls the service's soft delete, so the HTTP contract looks like a
  normal delete even though the row survives.
- **UI** — `components/settings/energyClass/`: `EnergyClassSection.tsx` (rendered by
  `SettingsPage.tsx` in place of the generic "Coming soon" card when the Energy Class tab is
  active — every other tab still falls through to that placeholder), `EnergyClassTable.tsx`,
  `EnergyClassForm.tsx`, `Add`/`Edit`/`DeleteEnergyClassModal.tsx` — same one-job-per-file split as
  `components/realtors/`. No `canEdit`/role gating on the Add/Edit/Delete actions — unlike
  Clients/Properties, `/settings` is already Root-only end-to-end (`proxy.ts` + `Topbar`'s
  `NON_ROOT_ALLOWED_HREFS`), so anyone who can reach this page can already mutate. Same page-load
  count message / silent-reload-after-mutation convention as Realtors (see Footer notifications).
- **Seeding** — `scripts/seed-energy-classes.ts`: idempotent (checks `findOne({ name, deletedAt:
  null })` before creating), seeds the Greek residential EPC scale in best→worst order (`Α+`, `Α`,
  `Β+`, `Β`, `Γ`, `Δ`, `Ε`, `Ζ`, `Η`) — that insertion order is what `findActive()`'s ascending sort
  then preserves. Wired into `predev`/`predev:docker` via `npm run seed:energy-classes`, same
  lifecycle-hook pattern as `seed:root`.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity), and
  nothing yet references `EnergyClass` from `Property` (that field doesn't exist on `Property` yet).

## Heating System management (implemented)

The second Settings pool entity, and the one that fills the previously-placeholder **Heating** tab
(`SettingsSidebar`'s `heating` slot — reused as-is rather than adding a new tab, since "heating types
for property listings" is exactly what that slot was already labeled for). Same shape as Energy
Class, plus one addition established here as the convention going forward for every future pool
entity: a **`slug`** field — a unique, indexed machine identifier distinct from the human-facing
`name`, so other code (or a future `Property.heatingSystemId`-style reference) can point at a stable
value that survives the display label being reworded or retranslated.

- **Model** — `models/HeatingSystem.ts`: `name` (required string), `slug` (required string, `unique:
  true` — this both enforces uniqueness and creates the index, trimmed + lowercased), `deletedAt`
  (nullable `Date`, default `null`), `createdAt`/`updatedAt`. Same soft-delete discipline as
  `EnergyClass` — `HeatingSystemService.remove()` calls `HeatingSystemRepository.softDelete()`, never
  a hard delete.
- **Repository** — `repositories/HeatingSystemRepository.ts`: `findActive()` (ascending `createdAt`,
  same reasoning as `EnergyClassRepository`), `findByName()`, and `findBySlug()` — **`findBySlug` is
  the one the API routes actually use for duplicate detection**, not `findByName`, since slug (not
  name) is the field guaranteed unique.
- **Service** — `services/HeatingSystemService.ts`: thin pass-through, mirroring `EnergyClassService`.
- **API** — `app/api/heating-systems/route.ts` + `.../[id]/route.ts`: validates both `name` and
  `slug` are present, 409 on duplicate `slug` (via `findBySlug`, excluding self on update), 404 on
  missing, `LogEntryService.info` under category `"HeatingSystem"`.
- **UI** — `components/settings/heatingSystem/`: `HeatingSystemForm.tsx` has **two** fields (name,
  slug) — the one place this diverges from `EnergyClassForm`'s single field.
  `HeatingSystemTable.tsx` shows slug as a muted monospace secondary column, not the primary label.
  Otherwise identical structure/conventions to Energy Class (no `canEdit` gating, same page-load
  count message / silent-reload pattern).
- **Seeding** — `scripts/seed-heating-systems.ts`: idempotent on `slug` (not `name`), seeds
  `autonomi`/`kentriki`/`atomiki`/`none` (Αυτόνομη, Κεντρική, Ατομική Θέρμανση, Χωρίς θέρμανση).
  Wired into `predev`/`predev:docker` via `npm run seed:heating-systems`.
- A reusable scaffold for this whole pattern (model → repository → service → API → types → UI →
  Settings wiring → optional seeder → this kind of CLAUDE.md section) lives at
  `.claude/skills/settings-pool-entity/SKILL.md` — use it for the next pool entity (Property Options)
  rather than hand-rolling the boilerplate again.
- Not yet implemented: Root-role route-handler enforcement (same TODO as everywhere else); nothing
  yet references `HeatingSystem` from `Property`.

## Property attribute pool entities (implemented)

Eleven more Settings pool entities, all built with the `.claude/skills/settings-pool-entity/SKILL.md`
scaffold and identical in shape to Heating System (`name` + unique `slug` + soft-delete `deletedAt`,
own Settings tab, own seeder). They exist because a real competing property portal's edit-listing
form was audited for every dropdown that belongs to the property itself (excluding currency, the
description-language switcher, and the agent/owner pickers — those are relations or generic UI, not
fixed enum lookups), and each was turned into its own pool entity:

| Entity | Settings tab | Route | Seeded records |
|---|---|---|---|
| `PropertyCategory` | Property Category | `/api/property-categories` | 12 (Διαμέρισμα, Μονοκατοικία, Βίλα, …) |
| `FloorLevel` | Floor Level | `/api/floor-levels` | 54 (Υπόγειο, Ημιυπόγειο, Ισόγειο, Ημιόροφος, 1ος–50ος) |
| `BuildingFloors` | Building Floors | `/api/building-floors` | 50 (plain numbers `1`–`50`, both `name` and `slug`) |
| `HeatingMedium` | Heating Medium | `/api/heating-mediums` | 13 (Πετρέλαιο, Φυσικό αέριο, Pellet, …) |
| `JoineryType` | Joinery Type | `/api/joinery-types` | 6 (Ξύλινα, Αλουμινίου, Συνθετικά, …) |
| `GlassType` | Glass Type | `/api/glass-types` | 3 (Μονός/Διπλός/Τριπλός υαλοπίνακας) |
| `FloorType` | Floor Type | `/api/floor-types` | 14 (Μάρμαρο, Ξύλο, Πλακάκι, …) |
| `GardenType` | Garden Type | `/api/garden-types` | 2 (Ιδιωτικός/Κοινόχρηστος κήπος) |
| `ZoningType` | Zoning Type | `/api/zoning-types` | 6 (Οικιστική/Αγροτική/Εμπορική ζώνη, …) |
| `Orientation` | Orientation | `/api/orientations` | 12 (Βόρειος, Νοτιοανατολικός, …) |
| `RoadAccessType` | Road Access Type | `/api/road-access-types` | 7 (Άσφαλτο, Πεζόδρομο, …) |

- **Generated, not hand-typed.** All 11 × 11 files (model, repository, service, 2 API routes, 5 UI
  components, seeder) were produced by a one-off Node codegen script that read the already-built
  `HeatingSystem` files as a template and did ordered string substitution (kebab route → title-case
  label → sentence-case label → lowercase plural → lowercase singular → the two remaining bare
  "Heating"/description strings → the `HeatingSystem`/`heatingSystem` code identifiers, in that exact
  order to avoid one substitution's output being re-matched by a later, broader one). If you need a
  12th entity in this family, don't hand-copy one of these — either use the settings-pool-entity skill
  directly, or re-derive a similar script; hand-copying 11 near-identical files is exactly the
  copy-paste this project's conventions exist to avoid.
- **Slugs are greeklish transliterations** of the Greek option text (e.g. `Μονοκατοικία` → `monokatoikia`,
  `Πλακάκι-Ξύλο` → `plakaki-ksylo`), chosen by hand per record, not derived by an automated
  transliteration library — there wasn't one in the dependency tree, and a hand pass was cheap at this
  volume. If a 12th list is added later, keep using the same manual-but-consistent scheme (strip Greek
  diacritics, transliterate letter-by-letter, kebab-case multi-word values) so slugs stay predictable.
- **Source of the seed data**: an actual Spitogatos property-edit-listing page's dropdown option lists,
  supplied by the user directly (the rendered HTML alone only ever exposes the *currently selected*
  option per dropdown, never the full list — Vue populates `<li>` options client-side from a store,
  not from server-rendered markup — so the real values had to come from the user, not be scraped or
  guessed from the page source).
- **`Orientation` records were supplied in a follow-up message** after the other 10 — if you're
  grepping history for why it looks like a late addition, that's why, not an oversight.
- **`PropertySubtype` was renamed to `PropertyCategory`** (model, repository, service, API route
  `/api/property-subtypes` → `/api/property-categories`, Settings UI folder, seed script) in a later
  pass, at the same time `Property.category` — a separate free-text field that had coexisted with the
  subtype dropdown — was removed outright. The two concepts had overlapped since day one; removing the
  free-text field and renaming the dropdown to "Category" collapsed them into one. `Property.propertySubtypeId`
  is now `Property.propertyCategoryId`. The Settings tab/modal label is "Property Category" (not bare
  "Category") specifically to stay unambiguous next to Land's own "Land Category" tab in the same
  sidebar — see "Land attribute pool entities" below; the *property form's* field label is still just
  "Category" since there's no adjacent ambiguity there.
- Wired into `predev`/`predev:docker` via 11 additional `npm run seed:*` script entries, same
  lifecycle-hook chain as `seed:root`/`seed:energy-classes`/`seed:heating-systems`.
- `SettingsPage.tsx` switched from a hand-written ternary chain (viable for 3 tabs) to a
  `Record<SettingsSection, () => ReactElement>` lookup table once the tab count reached 14 — a ternary
  chain that long would have been unreadable. `SECTION_CONTENT` (the generic "Coming soon" placeholder
  data) now only covers the one tab that still doesn't have a real implementation (`propertyOptions`).
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity in this
  repo); no pool entity exists yet for the Property Options tab or for any dropdown category not found on
  the audited edit-listing page. All 11 of these entities (plus Energy Class and Heating System) are now
  referenced from `Property` via ObjectId ref fields — see "Property management" below.

## Land attribute pool entities (implemented)

Two more pool entities, built the same way as the 11 property ones above (via the
`.claude/skills/settings-pool-entity/SKILL.md` scaffold, `name` + unique `slug` + soft-delete
`deletedAt`, own Settings tab, own seeder), added specifically to support `Land` (see "Land management"
below) rather than `Property`:

| Entity | Settings tab | Route | Seeded records |
|---|---|---|---|
| `LandCategory` | Land Category | `/api/land-categories` | 4 (Οικόπεδο, Αγροτεμάχιο, Νησί, Λοιπές κατηγορίες) |
| `Slope` | Slope | `/api/slopes` | 3 (Επίπεδο, Επικλινές, Αμφιθεατρικό) |

- **`LandCategory` is deliberately a separate entity from `PropertyCategory`**, even though both serve
  the same conceptual role (a listing's category) — a plot's category options (Οικόπεδο,
  Αγροτεμάχιο, Νησί, ...) are a completely different list from a building's (Διαμέρισμα, Μονοκατοικία,
  ...), so sharing one pool entity between them would mean either entity's dropdown showing irrelevant
  options for the other's type. Originally named `SubLandCategory`; renamed to `LandCategory` in the
  same pass that renamed `PropertySubtype` → `PropertyCategory` (see above), for naming symmetry between
  the two — `Land.category` (the free-text field that had coexisted with it) was removed at the same
  time, same reasoning as Property's.
- **`Land` does *not* get its own Orientation/ZoningType/RoadAccessType pool entities** — it reuses the
  three that already exist for `Property`, since those concepts (compass orientation, zoning
  classification, road access type) don't differ between a building and a plot. Only the two above are
  land-specific.
- Wired into `predev`/`predev:docker` via 2 additional `npm run seed:*` script entries, same
  lifecycle-hook chain as the other 13 pool entities. **Caught live**: the seed scripts don't run
  automatically on a running `docker compose` session — they're wired into `predev`/`predev:docker`,
  which only fires when `next dev` itself starts, so a `docker restart webrealtor-backend` was needed
  once these two were added mid-session, the same restart requirement CLAUDE.md's Data layer section
  already documents for schema changes.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity in this
  repo).

## Settings-embedded Realtors and Logs (implemented)

**Realtors and Logs were dropped from `Topbar`'s main nav and moved into Settings' own sidebar
instead**, by explicit request — both were already `Root`-only (`ROOT_ONLY_PREFIXES` in `proxy.ts`),
same as Settings itself, so nothing about *who* can reach them changed, only *where* they're reached
from.

- **`SettingsSidebar.tsx`**: `SettingsSection` gained `"realtors"` and `"logs"`, added as the first
  two entries in `SECTIONS` (`Contact`/`ScrollText` icons — `ScrollText` is the same icon the Topbar
  used for Logs before this move; `Contact` is new, chosen over reusing `Building2` since that's
  already `propertyCategory`'s icon in this same sidebar). Both reuse the existing `nav.realtors`/
  `nav.logs` translation keys rather than adding new ones — same label, new location.
- **`SettingsPage.tsx`**: `SECTION_COMPONENTS` gained `realtors: RealtorsPage` and `logs: LogsPage` —
  the *exact* existing page components (`components/realtors/RealtorsPage.tsx`,
  `components/logs/LogsPage.tsx`), unmodified and rendered directly in Settings' content pane, the
  same way every pool-entity tab (`EnergyClassSection`, etc.) already renders its own component
  there. No new component was written for this. The default active tab changed from `"heating"` to
  `"realtors"`, since it's now first in the sidebar.
- **Routes are untouched** — `/realtors`, `/realtors/[id]`, `/realtors/[id]/view`, and `/logs` still
  exist and still work exactly as before (`RealtorViewPage`'s "Back to Realtors" link, for instance,
  still lands on the standalone `/realtors` list page, not back inside Settings — a minor
  inconsistency left as-is since only nav placement was asked to change, not the routes themselves).
  `Topbar.tsx`'s `NAV_LINKS` simply no longer includes `/realtors`/`/logs`; `NON_ROOT_ALLOWED_HREFS`
  never included them to begin with (both were already Root-only), so it needed no change.

## Land management (implemented)

A **distinct entity from `Property`, not an extension of it** — a plot/land listing has a much smaller
field set (no bedrooms, heating, or construction fields, since none apply to a parcel of land) and was
built the same way Property was: fields derived from auditing the same competing portal's land-listing
edit form (the "Γη" property type), excluding the same "Διαχείριση ακινήτου" section.

- **Model** — `models/Land.ts`: `realtorId` (required `Realtor` ref), `clientId` (optional `Client` ref —
  the owner), then ~25 more fields grouped as Ownership, Basic Info, Outdoor Spaces & Location on Plot,
  Description, Location, Media — a subset of Property's groupings, since Land has no Property Description
  (physical layout)/Heating & Consumption/Construction/Technical Features & Interior/Suitable For
  sections. Five fields are ObjectId refs: `landCategoryId`, `orientationId`, `zoningTypeId`,
  `roadAccessTypeId` (the last three reused from Property's pool entities, see above), `slopeId` (new,
  land-specific). `landCategoryId` is required, the rest optional. There is no separate free-text
  "category" field, same reasoning as Property — see "Land attribute pool entities" below. `descriptions`
  and `images` follow the exact same `Map<string, string>` / `string[]` shape as Property, for the same
  reasons (locale-keyed descriptions via `flattenMaps: true`; URL-list media, no file upload).
- **Repository** — `repositories/LandRepository.ts` extends `BaseRepository`, adds
  `findByRealtorId`/`countByRealtorId` — identical shape to `PropertyRepository`. Hard delete, same
  reasoning as Property (a listing has no audit-trail reason to survive removal).
- **Service** — `services/LandService.ts`: `list()` (every land listing, any realtor — for Root),
  `listForRealtor(realtorId)`/`countForRealtor(realtorId)` (scoped — for Administrator/Operator, and now
  also for `RealtorService.list()`'s stats — see below), plus `get`/`create`/`update`/`remove`
  pass-throughs. Structurally identical to `PropertyService`.
- **`RealtorService.list()` now also computes `landCount`** alongside the existing `clientCount`/
  `propertyCount`, via the same parallel-`countDocuments`-per-realtor pattern — `Realtor.landCount` is
  typed optional in `lib/types.ts` for the same reason `propertyCount` is (derived, not stored; absent
  right after create/update, present on `list()`). `RealtorTable.tsx` shows it as a third stat line
  alongside properties/clients.
- **API** — `app/api/lands/route.ts` (`GET` optional `?realtorId=`, same scoped-vs-all pattern as
  Properties/Clients; `POST`) and `app/api/lands/[id]/route.ts` (`GET`/`PUT`/`DELETE`). Validation/coercion
  uses the same shared-helper pattern as Property — `app/api/lands/parseLandBody.ts` exports
  `parseLandBody(body)`, returning `{ errors, data }`, mirroring `parsePropertyBody.ts`'s `toObjectId`/
  `toOptionalNumber`/`toBool`/`toOptionalDate`/`toDescriptions` helpers. `price`/`area`/
  `landCategoryId` are required; `transactionType` must be `"sale"` or `"rent"`. Logs via
  `LogEntryService.info` under category `"Land"` on create/update/delete, with `userId: await
  getCurrentUserId()` included from the start (this entity was built after the `userId` attribution fix
  landed, so unlike Property it never had the gap).
- **UI** — `components/lands/`:
  - `LandsPage.tsx` — same Root-sees-all / Administrator-Operator-scoped pattern as `PropertiesPage`,
    navigates to `/lands/new` and `/lands/[id]` for create/edit (not a modal — see below), same
    page-load count message / silent-reload-after-mutation convention.
  - `LandTable.tsx` — Listing/Status/Location/Price/[Realtor]/[Actions] columns, identical shape to
    `PropertyTable`.
  - `DeleteLandModal.tsx` — standard confirm-delete modal, the one piece of Land CRUD that is a modal
    (same reasoning as `DeletePropertyModal`: a delete confirmation doesn't need the full-page treatment
    regardless of the parent entity's field count).
  - `LandDetail.tsx` (**full page, not a modal — same deviation as `PropertyDetail`**, for the same
    reason: even at ~30 fields rather than ~90, a full page with normal document scroll is still the
    right container for a form this size, and reusing the established pattern keeps the two entities
    consistent rather than introducing a third CRUD convention). Used for both create (`mode="create"`,
    at `/lands/new`) and edit (`mode="edit"` + `landId`, at `/lands/[id]`). Fetches 5 pool-entity lists
    (LandCategory, Orientation, ZoningType, RoadAccessType, Slope) plus the realtor list (and, for
    Administrator/Operator, only their own scoped client list) in parallel on mount. Keeps its own
    `FormValues` shape (all strings/booleans for controlled inputs) distinct from the typed
    `Land`/`LandInput` domain interfaces, same reasoning as `PropertyDetail`. `landToFormValues()` is the
    inverse conversion used to populate the form in edit mode.
  - `LandFormFields.tsx` — `SelectField`/`TextField`/`BoolField`/`SectionHeading`, colocated in
    `components/lands/` rather than shared with `components/properties/`'s equivalent file — each
    feature folder owns its full vertical slice per the component convention, and two consumers isn't
    enough to justify a cross-feature extraction.
- **Navigation** — `Topbar.tsx`'s `NAV_LINKS` gained a "Land" entry (`/lands`, `LandPlot` icon) and
  `NON_ROOT_ALLOWED_HREFS` gained `/lands` — Administrator/Operator can reach it the same as Properties/
  Clients/Dashboard. **`proxy.ts` needed no change**: its `ROOT_ONLY_PREFIXES` is a Root-only allowlist
  (Realtors/Users/Settings/Logs), and `/lands` was never added to it, so it's accessible to every role by
  default the same way `/properties` and `/clients` are — this is the same "not in the list" default
  behavior, not a new code path.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity), file-upload
  support for images (URL-list only, same explicit scope decision as Property).

## Notes (implemented)

A free-form note (date, title, text, importance) attachable to a Realtor, Client, Property, or
Land. Unlike LogEntry/PriceHistory (both append-only, system-written), Notes are user-authored and
get full CRUD (add/edit/delete), so this is the first cross-cutting shared collection with its own
create/update/delete UI rather than just a read surface.

**Surfaced as one tab of `EntityDetailTabs` (the other being Files), not a table row action** —
Realtor, Client, and Property each embed it on their own view/detail page (`RealtorViewPage`,
`ClientViewPage`, `PropertyViewPage`); Land doesn't have a view page yet (see "Land management"), so
`LandTable` is the one remaining table that opens the tabs via a modal row action, purely because it
has nowhere else to put them. If a Land View Page is ever built, embed `EntityDetailTabs` there the
same way Property's was — see "Property View Page" below. See "Files (Attachments)" below for the
Files tab and the shared `EntityDetailTabs`/`EntityDetailModal` components.

- **Model** — `models/Note.ts`: one shared collection discriminated by `entityType` (`"Realtor" |
  "Client" | "Property" | "Land"`), same "single generic collection, no `ref`, never
  `.populate()`'d" shape as `LogEntry`/`PriceHistory` — `entityId` points at whichever of the four
  collections `entityType` names. `title`, `text` (both required), `importance` (`"Low" | "Normal" |
  "High"`, default `"Normal"`), `userId` (nullable `User` ref — the author). No separate `date`
  field — `createdAt` (mandatory on every model via `baseSchemaOptions`) already is "the date this
  note was written," same reasoning as `PriceHistory`.
- **Repository/Service** — `repositories/NoteRepository.ts` (`findByEntity(entityType, entityId)`,
  newest-first), `services/NoteService.ts` (`listForEntity`, `get`, `create`, `update`, `remove`) —
  standard full-CRUD shape, not best-effort/swallow-errors like `LogEntryService`/
  `PriceHistoryService`, since a note *is* the user's actual data, not a side-effect audit record.
- **API** — `app/api/notes/route.ts` (`GET ?entityType=&entityId=`, `POST`) and
  `app/api/notes/[id]/route.ts` (`GET`/`PUT`/`DELETE`) — **one generic resource, not four
  per-entity nested sub-resources.** This deliberately diverges from `PriceHistory`'s precedent
  (`/api/properties/[id]/price-history` + `/api/lands/[id]/price-history`, duplicated per entity):
  Notes needs full CRUD across **four** entity types rather than a read-only endpoint across two, and
  duplicating a whole CRUD resource four times was judged worse than one generic resource filtered
  by `entityType`/`entityId` — consistent with this repo's general preference for shared helpers over
  copy-paste (see `parsePropertyBody.ts`'s reasoning). Both routes resolve the note's parent record
  (via `RealtorService`/`ClientService`/`PropertyService`/`LandService`, dispatched on `entityType`)
  for two reasons: `POST` validates `entityId` actually exists (400 if not, same convention as
  Property/Land validating `realtorId`) before creating; all three mutating handlers derive a
  `realtorId` from that parent (a Realtor's own id, or the realtorId of the Client/Property/Land it
  belongs to) to pass to `LogEntryService` — every Note mutation logs under category `"Notes"`,
  same mandatory-logging convention as everywhere else, with real actor attribution via
  `getCurrentUserId()`.
- **UI** — `components/notes/`: `NotesPanel.tsx` is the actual notes UI (fetch-on-mount list +
  inline add form + inline per-note edit, `canEdit`-gated the same way `PropertyTable`'s
  canEdit-gated actions are — Operators can view notes but not add/edit/delete) — it takes just
  `{entityType, entityId}` and renders no chrome of its own, which is what lets `EntityDetailTabs`
  drop it straight into a tab panel (see "Files (Attachments)"). `NoteForm.tsx` (shared add/edit
  form: title, text, importance), `NoteItem.tsx` (one note's display: title, an importance `Badge` —
  `Low`→inactive, `Normal`→active, `High`→danger — text, and an author-email + timestamp meta line).
  Author emails are resolved the same scoped way `PropertyViewPage`'s price history does: only the
  distinct `userId`s actually referenced by the loaded notes are fetched via `GET /api/users/:id`,
  never the whole `/api/users` list, since every one of these surfaces is reachable by every role,
  unlike the Root-only `LogsPage`. Delete asks for confirmation via `components/ui/ConfirmModal.tsx`
  (see "Files (Attachments)" below for why that's a new shared primitive rather than a one-off) — an
  earlier version of this feature deliberately skipped confirmation as a "low-stakes sub-resource
  item, immediate remove" shortcut (matching `MediaManager`'s image removal), but that was reversed
  by explicit request; immediate-delete is no longer the convention for Notes/Files. There is no more
  `NotesModal.tsx` — it was deleted once `EntityDetailModal` (tabs, not just Notes) took over its one
  remaining caller (`LandTable`).
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Files (Attachments) (implemented)

An uploaded file (title, description) attachable to a Realtor, Client, Property, or Land — the
second of `EntityDetailTabs`'s two tabs, alongside Notes. Structurally the polymorphic-attachment
half of Notes' design (same `entityType`/`entityId` discriminator, same four entities) crossed with
the upload mechanics already established for Property/Land media images.

- **Dangerous files are rejected by a whitelist, not a denylist.** `lib/uploads.ts` exports
  `ALLOWED_ATTACHMENT_TYPES` (PDF, Word/Excel/PowerPoint + their legacy `.doc`/`.xls`/`.ppt` forms,
  txt, csv, rtf, zip, and the same four image types `ALLOWED_IMAGE_TYPES` already allows) — same
  "the stored extension is derived from this map, keyed by the browser-reported MIME type, never
  from the client-supplied filename" discipline as the pre-existing image whitelist. `.exe`/`.bat`/
  `.sh`/`.ps1`/scripts/etc. are rejected simply by not appearing in the map — enumerating "dangerous"
  extensions was deliberately avoided as the weaker, easier-to-bypass approach. `GET
  /uploads/[...path]` (the one route that serves everything under `UPLOADS_DIR`, images and
  attachments alike) now checks both whitelists via a merged `mimeForExtension` lookup, since it
  doesn't know or care which upload flow wrote a given file.
- **Storage layout is entity-first, not listing-first** — deliberately different from
  `listingUploadDir`'s `realtors/<realtorId>/<listingId>/` (Property/Land media only):
  `attachmentUploadDir(entityType, entityId)` → `<UPLOADS_DIR>/<realtors|clients|properties|lands>/
  <entityId>/`, because Files needs to cover Realtor/Client directly, which have no "listing" to
  nest under. `MAX_UPLOAD_SIZE_BYTES` (10MB) is shared with the image upload flow, not a separate
  limit.
- **Model** — `models/Attachment.ts`: same shared-collection/`entityType`+`entityId` discriminator
  shape as `Note`, plus `fileName` (original name, display-only — never used to build a path),
  `url`, `mimeType`, `size`, `userId` (nullable `User` ref — the uploader).
- **Repository/Service** — `repositories/AttachmentRepository.ts` (`findByEntity`, newest-first),
  `services/AttachmentService.ts` — `create`/`update`(title+description only)/`get`/`listForEntity`
  are thin pass-throughs, but `remove()` does two things: deletes the Mongo record, then best-effort
  `unlink()`s the underlying file (reconstructing the path from the stored `url` via
  `resolveUploadPath`, the same path-traversal-safe helper the serving route uses) — a missing/
  already-gone file on disk must never block the DB delete, same discipline as
  `LogEntryService`/`PriceHistoryService`'s best-effort writes.
- **API** — `app/api/attachments/route.ts` (`GET ?entityType=&entityId=`; `POST`, multipart) and
  `app/api/attachments/[id]/route.ts` (`GET`/`PUT`/`DELETE`) — same **one generic resource across all
  four entity types** decision as `/api/notes`, for the same reasoning (see "Notes" above). `POST`
  accepts **multiple files in one request** (`files` field, repeated) — each becomes its own
  `Attachment` document, `title` defaulting to the original filename minus its extension and
  `description` starting empty (upload now, caption later, same flow as the Property/Land media
  manager), and every file's type/size is validated **before** any of them are written so a batch
  either fully succeeds or fails with no partial writes. Same `resolveParent`-dispatched
  entityId-exists validation + `realtorId` derivation for `LogEntryService` (category `"Attachments"`)
  as `/api/notes`.
- **UI** — `components/files/`: `FilesPanel.tsx` (upload dropzone — click or drag, reusing
  `MediaManager`'s dropzone interaction pattern but without the reordering half, since attachments
  aren't a reorderable gallery — plus fetch-on-mount list + inline per-file edit, `canEdit`-gated the
  same as Notes), `FileEditForm.tsx` (title + description only — a replacement file isn't supported,
  delete and re-upload instead). `FileItem.tsx` renders each attachment as a compact **grid card**,
  not a list row — `.fileGrid` is capped at 4 columns on wide screens, stepping down to 3/2 on
  narrower ones (explicit request: "4 per row on max, responsive"), rather than an auto-fill/minmax
  layout that could exceed 4. Image attachments (`mimeType.startsWith("image/")`) get a real `<img>`
  thumbnail in the card's preview area; everything else gets a MIME-type icon via a `renderFileIcon()`
  function that returns JSX directly rather than a component reference, specifically to avoid the
  `react-hooks/static-components` lint rule's "component created during render" false positive for a
  capitalized variable used as `<Icon />`. Given the card's small footprint, only title (truncated)
  and a compact size+date meta line are shown — description and uploader are dropped from the
  compact view (uploader is still available as a native `title` hover-tooltip on the card) to keep
  cards small, per explicit request. Edit/Delete icons sit at the card's bottom-right. Uploader
  emails are still resolved the same scoped per-file way Notes/price-history do, just not always
  rendered. Delete asks for confirmation via `components/ui/ConfirmModal.tsx` — a new generic
  yes/no dialog primitive (title, message, `onConfirm`/`onCancel`, loading/error), introduced
  specifically because Notes and Files both needed the *same* small confirm-dialog behavior and
  neither warranted a bespoke `DeleteXModal` the way whole-entity deletes (Realtor, Client, Property,
  Land, the 15 Settings pool entities) already have their own. Both `NotesPanel` and `FilesPanel` hold
  a `noteToDelete`/`attachmentToDelete` piece of state (set by the row's Delete click, cleared on
  confirm/cancel) and render one `<ConfirmModal>` each.
- **`components/entityDetails/`** — `EntityDetailTabs.tsx` (a `Tabs` — see `components/ui/Tabs.tsx`,
  a new generic controlled-tab primitive — switching between `<NotesPanel>` and `<FilesPanel>`, no
  chrome of its own) is what every consumer actually embeds, not `NotesPanel`/`FilesPanel` directly.
  `EntityDetailModal.tsx` is a thin `<Modal><EntityDetailTabs /></Modal>` wrapper, used only by
  `LandTable` (no view page to embed the tabs in directly).
- **Table wiring** — `LandTable`'s row action was renamed from a `StickyNote` "Notes" button to a
  `FolderOpen` "Details" button (`t("entityDetails.action")`), opening `EntityDetailModal` instead of
  the deleted `NotesModal`; `LandsPage` renamed its `landForNotes` state to `landForDetails`
  accordingly. `RealtorTable`/`ClientTable`/`PropertyTable` need no Files-specific wiring — their
  existing `Eye`/"View" action already lands on a page where `EntityDetailTabs` (Notes + Files) is
  just one more `Card` section.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity); no
  server-side content-sniffing beyond the MIME-type whitelist (same accepted tradeoff the image
  upload flow already made — a renamed file could in principle misreport its `type`, but this
  matches the existing precedent rather than introducing a new, heavier-weight tradeoff just for
  Files).

## Owns (Client) (implemented)

A read-only tab, shown **first** (before Interest For) and only when `entityType === "Client"` in
`EntityDetailTabs`, listing every Property and Land whose `clientId` points at this client — the
gap CLAUDE.md's own Property management section had flagged since day one ("nothing on the Client
side surfaces which properties belong to a given client yet"). Unlike Interest For, this is **not**
a new entity — Property and Land already have full CRUD (`/properties/[id]`, `/lands/[id]`), so
this tab only lists and links out, it never creates/edits/deletes anything itself.

- **API** — `GET /api/properties` and `GET /api/lands` both gained an optional `?clientId=` query
  param, alongside the existing `?realtorId=` — mutually exclusive with it (a request passes one or
  the other, never both; `clientId` takes precedence if somehow both were sent), backed by new
  `findByClientId`/`listForClient` methods on `PropertyRepository`/`PropertyService` and
  `LandRepository`/`LandService`, same shape as the existing `findByRealtorId`/`listForRealtor` pair.
  No new route files — this reuses the existing list endpoints rather than adding a
  `/api/clients/[id]/owns`-style nested resource, since Property/Land are already independently
  listable by other filters and a client's owned listings are just one more filter, not a new
  concept needing its own CRUD surface the way Interest For did.
- **UI** — `components/owns/`: `OwnsPanel.tsx` fetches `/api/properties?clientId=` and
  `/api/lands?clientId=` in parallel (plus the full `PropertyCategory`/`LandCategory` lists, same
  scoped-fetch-once-per-tab pattern `InterestForPanel` already uses, independently — no shared state
  between the two tabs), tags each result with a `kind: "Property" | "Land"` discriminator
  (`OwnedListing` type in `OwnsTable.tsx`), merges both arrays, and sorts the combined list by
  `createdAt` descending. `OwnsTable.tsx` renders Status/Type/For/Category/Price/City/Area/Actions —
  intentionally the same "basic info, not full detail" column shape as `InterestForTable`, not the
  ~90-field Property or ~30-field Land record. The single Actions-column button navigates
  (`useRouter().push`, not a `<Link>` wrapped around `Button` — `Button` renders a real `<button>`,
  and nesting one inside an `<a>` is invalid HTML) to `/properties/[id]/view` for a Property or
  `/lands/[id]` for a Land, since **Land has no view page of its own yet** (see "Property View
  Page") — same edit-page fallback `LandTable`'s own row actions already use.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity) —
  though this only adds a new optional filter to two already-unauthenticated endpoints, not a new
  attack surface beyond what already existed.

## Interest For (Client) (implemented)

A Client's stated interest in buying/renting a Property or Land — a table with full CRUD, surfaced
as the **first** tab of `EntityDetailTabs` (before Notes/Files), **shown only when
`entityType === "Client"`**. Structurally the closest precedent is Notes/Attachments (a small
CRUD-able record with its own tab), but deliberately **not** built as a third polymorphic
`entityType`/`entityId` case: InterestFor only ever belongs to a Client, so it's a plain `clientId`
FK, and its API is nested under the client (`/api/clients/[id]/interest-for`) the same way
PriceHistory nests read-only under a listing (`/api/properties/[id]/price-history`), rather than
adding a fifth value to `AttachableEntityType`/`ATTACHABLE_ENTITY_TYPES` for one single-owner entity.

- **Model** — `models/InterestFor.ts`: `clientId` (required `Client` ref), `date`, `transactionType`
  (`"sale" | "rent"` — reuses Property/Land's existing `TransactionType`, no reason to duplicate),
  `listingType` (`"Property" | "Land"`, new `InterestForListingType`/`INTEREST_FOR_LISTING_TYPES` in
  `lib/types.ts`), `categoryId`, `price` (required), `city`, `area`, `remarks` (all optional),
  `isActive` (boolean, default `true`). **`categoryId` has no `ref`** — it points at a
  `PropertyCategory` document when `listingType === "Property"` or a `LandCategory` document when
  `listingType === "Land"`, exactly the same "dynamic target, resolved client-side, never
  `.populate()`'d" convention `Note.entityId` already established, just discriminated by
  `listingType` instead of `entityType`. Hard delete (no soft-delete/audit-trail reason to keep a
  removed interest entry around, same reasoning as Property/Land listings themselves).
- **Repository/Service** — `repositories/InterestForRepository.ts` (`findByClientId`, newest-date-
  first), `services/InterestForService.ts` (`listForClient`, `get`, `create`, `update`, `remove`) —
  same thin-pass-through shape as every other entity.
- **API** — `app/api/clients/[id]/interest-for/route.ts` (`GET` list for this client, `POST`
  create) and `.../[interestForId]/route.ts` (`GET`/`PUT`/`DELETE`) — both mutating routes validate
  the parent `Client` exists (404 otherwise), then `date`/`transactionType`/`listingType`/
  `categoryId`/`price` are required, and the referenced category is looked up via
  `PropertyCategoryService.get`/`LandCategoryService.get` (dispatched on `listingType`) to confirm it
  actually exists (`400` otherwise) — the same existence-check discipline Client/Property/Land
  already apply to their own FK fields. Logs via `LogEntryService.info` under category
  `"InterestFor"` on create/update/delete, `realtorId` derived from the parent client (`client.
  realtorId`) exactly like Notes derives it from whichever parent it's attached to, `userId` via
  `getCurrentUserId()` from day one.
- **UI** — `components/interestFor/`: `InterestForPanel.tsx` (the tab's actual content — fetches
  this client's interests plus the full `PropertyCategory`/`LandCategory` lists once on mount, for
  the form's category `<select>` and for resolving a category id back to its display name in the
  table; `canEdit`-gated Add button, same as Notes/Files), `InterestForTable.tsx`,
  `InterestForForm.tsx` (shared add/edit form — picking a different `listingType` clears `categoryId`
  rather than carrying over a value from the wrong pool entity), `Add`/`Edit`/
  `DeleteInterestForModal.tsx`. **Add/Edit/Delete are modals, not NotesPanel's inline add/edit** — an
  explicit choice for this feature (Notes/Files use inline forms because they're simple two/three-
  field records; InterestFor has more fields and two dependent selects, closer in shape to
  Realtor/Client/Settings-pool-entity CRUD, so it follows that modal convention instead). The table
  shows Date/For/Type/Category/Price/City/Area/Status/Actions, with `remarks` folded into the
  Category cell as a muted secondary line (same "extra context as a subtext line, not its own
  column" pattern `RealtorTable` uses for `website`) rather than given its own column, and `isActive`
  rendered as a `Badge` (`active`/`inactive` variant) rather than a checkbox column.
- **`EntityDetailTabs.tsx`** takes on the conditional: `entityType === "Client"` both adds the
  `interestFor` tab and makes it the initially-active one (`isClient ? "interestFor" : "notes"`).
  Realtor/Property/Land's tab set is unaffected — they still open on Notes, and never see the
  Interest For tab at all.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Viewings (Client) (implemented)

A record of a Client viewing a specific Property or Land listing — a third Client-only CRUD tab,
positioned **after** Interest For (so the Client-only tab order is Owns, Interest For, Viewings,
then Notes/Files). Structurally closest to Interest For (same modal-based CRUD, same
`InterestForListingType` Property-or-Land discriminator, reused rather than duplicated — see
CLAUDE.md → "Interest For (Client)"), but the "category" concept is replaced with a reference to an
**actual** Property or Land document (which listing was shown), and it adds one more thing neither
Owns nor Interest For has: an optional link to a signed document.

- **Model** — `models/Viewing.ts`: `clientId` (required `Client` ref), `date` (required),
  `listingType` (`InterestForListingType`, reused — see above), `listingId` (no `ref` — points at
  `Property` or `Land` depending on `listingType`, same dynamic-target convention as
  `Note.entityId`/`PriceHistory.listingId`), `comment` (optional free text), and
  `signatureDocumentId` (optional, `ref: "Attachment"` — a *fixed* target type unlike `listingId`
  above, so a real `ref` applies even though it's never `.populate()`'d, same as `Property.clientId`).
  **The signature document is not a new upload mechanism** — it's a plain reference to an
  `Attachment` already uploaded through the existing Files flow (`POST /api/attachments`, with
  `entityType="Client"`/`entityId=<this client>`). This is deliberate: the ask was "multiple
  viewings will be possible to have the same file," i.e. a many-Viewings-to-one-Attachment
  relationship, so a Viewing must reference an existing file rather than own one outright — deleting
  a Viewing must never delete a document other Viewings (or the Files tab itself) still point at,
  and `Viewing` doesn't have its own upload/storage code at all.
- **Repository/Service** — `repositories/ViewingRepository.ts` (`findByClientId`, newest-date-first),
  `services/ViewingService.ts` (`listForClient`, `get`, `create`, `update`, `remove`) — same
  thin-pass-through shape as `InterestForService`.
- **API** — `app/api/clients/[id]/viewings/route.ts` (`GET`/`POST`) and `.../[viewingId]/route.ts`
  (`GET`/`PUT`/`DELETE`), nested under the client exactly like `interest-for`. Both mutating routes
  validate the parent `Client` exists, then `date`/`listingType`/`listingId` are required and the
  referenced `Property`/`Land` is looked up (`PropertyService.get`/`LandService.get`, dispatched on
  `listingType`) to confirm it exists (`400` otherwise). **`signatureDocumentId`, when provided, is
  validated to actually be an `Attachment` belonging to this same Client** (`resolveSignatureDocument`
  checks both `attachment.entityType === "Client"` and `attachment.entityId === clientId`, not just
  that the id resolves to *some* attachment) — prevents linking a Viewing to a Realtor/Property/Land
  attachment, or another client's, by id-guessing. Logs via `LogEntryService.info` under category
  `"Viewings"`, `realtorId` derived from the parent client, `userId` via `getCurrentUserId()`.
- **UI** — `components/viewings/`: `ViewingPanel.tsx` fetches this client's viewings, the client's
  own realtor's Property/Land lists (`?realtorId=` — see below), and the client's existing
  Attachments (`GET /api/attachments?entityType=Client&entityId=...`, the same list the Files tab
  itself would show) — all independently of `OwnsPanel`/`InterestForPanel`'s own fetches, same
  each-tab-fetches-its-own-scoped-data precedent `InterestForPanel` set. `ViewingTable.tsx` (Date/
  Type/Listing/Comment/Signature Document/Actions — Signature Document renders as a clickable link
  to `attachment.url` when set, same `target="_blank"` convention as `FileItem`, otherwise "—").
  `ViewingForm.tsx` (shared add/edit form): the Property/Land `<select>` swaps options when Type
  changes (clearing the previously picked listing, same pattern as `InterestForForm`'s category
  clear); the Signature Document field is a `<select>` of the client's existing attachments **plus**
  an inline "Upload New File" button (hidden `<input type="file">`, triggered on click) that uploads
  immediately via `POST /api/attachments` the moment a file is chosen, then auto-selects the newly
  created attachment — so picking an existing file and uploading a new one are both done without
  leaving the Viewing form. `onAttachmentUploaded` bubbles the new `Attachment` back up to
  `ViewingPanel`, which prepends it to its own `attachments` state so it's immediately available to
  pick from on a subsequent Add/Edit without a full reload. `Add`/`Edit`/`DeleteViewingModal.tsx`
  follow the same modal-CRUD shape as Interest For's.
- **Property/Land scoping — see CLAUDE.md → "Data scoping by realtor" (CRITICAL).**
  `ViewingPanel` computes its own `effectiveRealtorId`: `useCurrentUser().realtorId` for
  `Administrator`/`Operator` (their own realtor, full stop — never the client's), falling back to a
  `realtorId` prop threaded down from `ClientViewPage` → `EntityDetailTabs` (a new optional
  `realtorId` prop, used by no other tab) only for `Root`, which has no `realtorId` of its own and so
  falls back to the one realtor whose client page it's looking at, not every realtor's. **This was
  originally implemented scoping off the prop unconditionally (the client's `realtorId`) and fixed**
  — see the CRITICAL section for why that's the wrong default for non-Root callers.
- **The listing picker (`ViewingForm`'s Property/Land field) is `components/ui/SearchableSelect.tsx`**,
  not a plain `<select>` — a new generic type-to-filter combobox primitive (text input + a filtered
  dropdown list, click-outside/`Escape`-to-close), added because a plain `<select>` has no search and
  a realtor's listing count can be large. Built in `components/ui/` rather than colocated under
  `components/viewings/` since "pick one item from a long list by typing" isn't Viewings-specific —
  reuse it for the next searchable-list need rather than hand-rolling another one. It isn't a native
  form control, so HTML's `required` can't reach it — `ViewingForm` does the equivalent check by hand
  in its `onSubmit` handler (`listingError` state) before calling the parent's `onSubmit`. Gained an
  optional `disabled` prop once `TransactionForm.tsx` needed it too — see "Transactions" for the
  full story of that form's listing picker.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Transactions (implemented)

A completed deal (rent or buy) tying one of a Realtor's own Clients to one of that same Realtor's
own Property/Land listings, with the price and the commission earned. Unlike Owns/Interest
For/Viewings, **this is not Client-scoped** — it's a first-class top-level entity with its own nav
item (`Handshake` icon, placed after Land in `Topbar.tsx`'s `NAV_LINKS`, accessible to every role
the same as Clients/Properties/Land — added to `NON_ROOT_ALLOWED_HREFS` too, not
`ROOT_ONLY_PREFIXES`), because a transaction is a record in its own right (financial/commission
tracking), not an attribute of any one Client's page.

- **Model** — `models/Transaction.ts`: `realtorId` (required `Realtor` ref — mandatory so this
  entity can be scoped the same way Client/Property/Land already are, see CLAUDE.md → "Data scoping
  by realtor"), `clientId` (required `Client` ref), `date`, `listingType`
  (`InterestForListingType`, reused — same "Property or Land" discriminator Viewing already
  established, not a new duplicate type), `listingId` (no `ref` — points at `Property` or `Land`
  depending on `listingType`, same dynamic-target convention as `Viewing.listingId`), `action`
  (`"rent" | "buy"`, new `TransactionAction`/`TRANSACTION_ACTIONS` in `lib/types.ts` — **deliberately
  not** a reuse of Property/Land's own `TransactionType` (`"sale" | "rent"`): that type describes a
  *listing's* posture ("this property is for sale"), this one describes what the *client* actually
  did ("this client bought it") — different vocabulary for a different concept, even though "rent"
  overlaps), `price`/`commission` (both required numbers), `tax` (optional number, `default: 0`),
  `comment` (optional string, `default: ""`); no `currency` field (not requested, kept to the exact
  field list asked for). Hard delete (a transaction record has no soft-delete/audit-trail reason to
  survive removal, same reasoning as Property/Land listings and `InterestFor`/`Viewing`).
- **Repository/Service** — `repositories/TransactionRepository.ts` (`findByRealtorId`/
  `countByRealtorId`, newest-date-first — same shape as `ClientRepository`/`PropertyRepository`),
  `services/TransactionService.ts` (`list()` for Root, `listForRealtor()` for Administrator/
  Operator, `get`/`create`/`update`/`remove`).
- **API** — `app/api/transactions/route.ts` (`GET` optional `?realtorId=`, same scoped-vs-all
  pattern as `/api/clients`/`/api/properties`; `POST`) and `.../[id]/route.ts`
  (`GET`/`PUT`/`DELETE`). Validates `realtorId` (via `RealtorService.get`), `clientId` (via
  `ClientService.get`), `date`/`listingType`/`action`/`price`/`commission` presence, and the
  referenced listing's existence (`PropertyService.get`/`LandService.get`, dispatched on
  `listingType`, same as Viewing's own routes) — all `400` on failure. `tax`/`comment` are optional
  (default `0`/`""` when absent from the body, no presence check). Logs via `LogEntryService.info`
  under category `"Transactions"`, `userId` via `getCurrentUserId()` from day one.
- **UI** — `components/transactions/`: `TransactionsPage.tsx` follows the exact
  Root-sees-all/Administrator-Operator-scoped pattern `ClientsPage` established (`isRoot` branches
  the `?realtorId=` query and whether the realtor list is fetched at all, `realtorNames` map built
  the same way, `showRealtorColumn`/`canEdit` passed through to the table). It additionally fetches
  Property/Land listings (same scoping) and the three Category/Floor pool-entity lists, needed to
  resolve each transaction's `listingId` back to a readable label via the shared `listingLabel()`
  helper (see below). `TransactionTable.tsx` — Date/Client/Type/Listing/Action (`Badge`, `buy`→
  active/`rent`→pending)/Price/Commission/[Realtor]/Actions, `canEdit`-gated Edit/Delete same as
  `ClientTable`.
- **`TransactionForm.tsx` — the listing picker drives everything else, not a set of independent
  fields.** This shape (merged listing picker first, Client/Action derived not picked) replaced an
  earlier version with a separate Type `<select>`, a manually-picked Client `<select>`, and a manually-
  picked Action `<select>` — reworked in the same pass that added the price/commission auto-fill
  below, once it became clear the listing itself already carries everything those three fields were
  asking the user to duplicate by hand:
  - **One merged Property+Land `SearchableSelect`** (`components/ui/SearchableSelect.tsx`, see its
    own doc note below), shown first (right after the Root-only Realtor `<select>`) and full-row —
    replaces the old separate `listingType` `<select>` + per-type picker. Built from
    `propertyListings`/`landListings` (both `?realtorId=`-scoped, refetched whenever `realtorId`
    changes, per the CRITICAL "Data scoping by realtor" convention), each option's `listingLabel()`
    text suffixed with `(Property)`/`(Land)` (`transactions.listingType.*`) so the merged list stays
    disambiguated. **Only `status === "active" || "pending"` listings are offered** — an inactive
    listing isn't an in-progress deal, so `listingOptions` filters both source arrays before mapping
    (the unfiltered `propertyListings`/`landListings` are still searched in full by
    `handleListingSelect`, so an already-saved transaction pointing at a since-inactivated listing
    still resolves correctly in edit mode, it just can't be picked fresh from the dropdown).
  - **Client is read-only, not a picker** — a plain `<p>` (styled with `sharedStyles.input` for
    visual consistency, not an actual form control) showing the selected listing's owning client
    (`Property`/`Land.clientId`, resolved against the scoped `clients` fetch — which now exists
    *only* to resolve this display name, no longer to populate a dropdown), or `"—"` before any
    listing is picked. If the selected listing has no owner set, `clientId` ends up `""` and
    `handleSubmit` blocks with `transactions.form.clientMissing` ("set an owner on the
    property/land first") rather than silently submitting an ownerless transaction.
  - **Action is derived, not picked** — no `<select>` at all. `handleListingSelect` reads the
    selected listing's own `transactionType` (`"sale" | "rent"`) and maps it to
    `Transaction.action`'s vocabulary: `"rent"` stays `"rent"`, `"sale"` becomes `"buy"`. The value
    is still saved on the transaction (for `TransactionTable`'s Action column and any future
    filtering by it) — "derived" only describes how the form fills it in, not whether it's
    persisted.
  - **Price/commission auto-fill** — selecting a listing copies its `price` onto the form, then
    computes `commission = price × rate`, where `rate` is the **currently selected realtor's**
    `saleCommission` (derived action `"buy"`) or `rentCommission` (derived action `"rent"`) — see
    "Realtor commission rates" under Realtor management for what those fields mean. Rounded to 2
    decimals (`Math.round(price * rate * 100) / 100`) by the shared `computeCommission()` helper. If
    the realtor has no rate set for that action, commission is left alone (untouched, not zeroed)
    for manual entry — `computeCommission()` returns `null` in that case and the form keeps
    `prev.commission`. The realtor whose rate is used comes from a dedicated `selectedRealtor` state
    (`GET /api/realtors/:id`, refetched whenever `realtorId` changes) — **independent of** the
    Root-only `realtors` list used for the Realtor `<select>`'s options, so the same auto-fill logic
    works for Administrator/Operator too (who never populate that list, gated `if (!isRoot) return;`,
    but still have exactly one realtor whose id is fixed in `values.realtorId` from mount). Auto-fill
    only ever runs from `handleListingSelect` (a direct `onChange` handler) — never from an effect
    reacting to `values.price`/`commission` themselves, so it can never clobber a value the user is
    mid-typing, and it never touches an already-saved transaction's price/commission on edit-mode
    mount (those come through `initialValues`, not through this path). Since there's no Action
    `<select>` to switch after the fact, re-pricing for the other action means picking a different
    listing (one whose own `transactionType` differs) — there's no dedicated "recompute on action
    change" path anymore, unlike an earlier version of this form that had one.
  - **`tax`/`commission` sit together in the field grid (Date/Price/Commission/Tax), `comment` is a
    full-row `<textarea>` last** — both are plain manual-entry number/text fields, no auto-fill.
  - **Realtor-change reset** — picking a different Realtor (Root only) clears the previously-selected
    listing (and the client/action/price/commission derived from it) via a `useRef`-guarded effect
    (fires on real changes only, not the initial mount value — same reasoning `ViewingForm`'s
    `listingType` clear needed, just effect-driven here instead of a direct `onChange` handler since
    the dependent lists are refetched asynchronously).
  - Since `SearchableSelect` isn't a native form control, the browser's own `required` can't reach
    it — `handleSubmit` manually checks `listingId` (`listingError`) and, once a listing is picked,
    `clientId` (`clientError`, see above).
- **`components/ui/SearchableSelect.tsx` gained an optional `disabled` prop** for the listing
  picker's "disabled until a realtor is chosen" state (Root only — non-Root always has a realtor
  from mount) — greys the input out and skips opening the menu on focus, mirroring a native disabled
  control; the same prop the old Client `<select disabled={!values.realtorId}>` used to have.
- **`lib/listingLabel.ts`** — the `listingLabel(listing, kind, propertyCategories, floorLevels,
  landCategories)` helper (Category · Floor · Address, falling back to title/id) was **extracted
  here from `ViewingForm.tsx`** the moment Transactions needed the identical logic — per CLAUDE.md's
  general "reuse over copy-paste" convention, the same reasoning `AttachableEntityType`/
  `listingUploadDir` etc. already follow. `ViewingForm.tsx` and `ViewingTable.tsx` (which previously
  had its own, simpler title-only version) both now import the shared one — `ViewingTable`'s listing
  column display gained Category/Floor context as a side effect of this extraction, for consistency
  with what the Viewing popup already showed.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity).

## Dashboard (implemented)

`components/dashboard/DashboardPage.tsx` — was a static placeholder (`STATS` array of hardcoded
`"—"` values, a `TODO` comment) until wired to real aggregates. Same Root-sees-all /
Administrator-Operator-scoped-to-their-own-realtor pattern as every list page (see CLAUDE.md →
"Data scoping by realtor") — fetches `Client`/`Property`/`Land`/`Transaction` (all `?realtorId=`-
scoped for non-Root) in parallel, the same shape `TransactionsPage` already uses.

- **Stat tiles (3, `styles.grid` capped at 3 columns)**: Active Listings (`Property` + `Land` docs
  with `status === "active"`), Total Clients, and **Monthly Revenue** (replaced the old "Pending
  Deals" placeholder tile) — the sum of `Transaction.commission` for the trailing (current) month
  bucket, see below. `Transaction.date` (the deal date) drives every monthly computation here, not
  `createdAt`. **No "Total Realtors" tile** — briefly existed (Root: `realtors.length`; every other
  role trivially `1`, since they have exactly one realtor) but was removed by explicit request; the
  `Realtor` fetch that only existed to feed it was removed from `loadData` along with it.
- **Two charts, side by side below the tiles** (`styles.chartsGrid`, 1 column under `64rem`, 2
  above): `dashboard.chartTransactionsTitle` (count of transactions per month) and
  `dashboard.chartRevenueTitle` (summed commission per month), both fed by the same trailing
  6-month bucketing (`monthBuckets` in `DashboardPage.tsx`, oldest → newest, ending this month) —
  the Monthly Revenue tile is just that window's last bucket, so the tile and the chart's rightmost
  bar always agree.
- **`components/dashboard/MonthlyBarChart.tsx`** — a small reusable single-series bar chart, built
  as plain HTML/CSS (a flex row of `<div>` columns with `height: {pct}%`), not an SVG chart library
  — there's no charting dependency in this repo and one bar chart this size didn't justify adding
  one. Per the dataviz skill's mark spec: bars capped at 24px (`max-width: 1.5rem`), 4px rounded top
  / square baseline, a hairline baseline rule, muted axis labels. **No legend** — a single series
  needs none (the card title already names what's plotted). The hover/focus tooltip is pure CSS
  (`:hover`/`:focus-visible` opacity toggle on a sibling `<span>`), not JS pointer-tracking state —
  each bar's wrapper is a `tabIndex={0}` element with an `aria-label` carrying the same value the
  tooltip shows, so the value is reachable on keyboard focus too, not hover-only. Month labels use
  `Intl.DateTimeFormat(locale, { month: "short" })` with the app's own `useLocale()` value (not the
  browser's), so they follow the user's chosen locale like everything else — this is a deliberate
  exception to the app's dd/MM/yyyy date-formatting convention (see CLAUDE.md → "Date/time
  formatting"), which governs exact date/timestamp *values*, not a chart axis's month names.
- Not yet implemented: Root-role route-handler enforcement (same TODO as every other entity); no
  date-range control (the 6-month window is fixed, not user-adjustable).

## Logging (LogEntry) — mandatory convention

**Every action that mutates data, or is a security event (login/logout, auth failures), must write a
`LogEntry`.** This is a standing instruction for all future work, not a one-off — when adding a new
mutating route or service method, wire in a `LogEntryService` call the same way Realtors/Users/Auth already
do below. Don't wait to be asked again.

- **Model** — `models/LogEntry.ts`: `category` (free-form string section name — `"Realtors"`, `"Users"`,
  `"Security"` for login/logout, etc.; new categories are just new strings, not a closed enum), `logType`
  (`"Information" | "Warning" | "Error"`, from `LOG_TYPES` in `lib/types.ts`), `userId` (nullable `User` ref —
  who did it, when known), `realtorId` (nullable `Realtor` ref — which realtor's data this is about),
  `message` (human-readable summary), `dataFrom`/`dataTo` (nullable arbitrary JSON snapshots of before/after
  state, `Schema.Types.Mixed`).
- **Repository** — `repositories/LogEntryRepository.ts`: standard `BaseRepository` + `findByRealtorId`/
  `findByUserId`. Pagination comes from `BaseRepository.findPaginated(filter, page, pageSize)` — added to
  the *base* class (not a LogEntry-specific override) so any entity can reuse it later, clamps `pageSize` to
  500 and `page` to ≥ 1, returns `{ items, total, page, pageSize }` (the `PaginatedResponse<T>` shape).
- **Service** — `services/LogEntryService.ts` is the only way anything writes a log entry:
  `LogEntryService.info(...)` / `.warning(...)` / `.error(...)`, each taking
  `{ category, message, userId?, realtorId?, dataFrom?, dataTo? }`. **Logging is best-effort and must never
  break the action it's logging** — the private `write()` method catches and swallows its own errors
  (`console.error`s them) rather than throwing, so a logging hiccup can never fail a Realtor/User
  create/update/delete or a login. `LogEntryService.list(page, pageSize)` (defaults `1`/`100`) wraps the
  paginated repository call for the API route.
- **API** — `app/api/logs/route.ts` is **read-only** (`GET` only, `?page=&pageSize=`, default `pageSize=100`
  per the explicit ask) — log entries are never created directly through the API, only ever via
  `LogEntryService` from server-side code, so nothing can forge or tamper with the audit trail through a
  client request.
- **UI** — `components/logs/LogsPage.tsx` (Root-only, per the Auth section's access rules — filtered out of
  non-Root nav and blocked by `proxy.ts` like Realtors/Users/Settings): fetches one page at a time (no
  page-size selector, fixed at 100), Previous/Next buttons, "Page X of Y · N total" footer. Resolves
  `userId`/`realtorId` to email/name client-side the same way `UsersPage` resolves realtor names — fetches
  `/api/users` and `/api/realtors` once and builds lookup maps, rather than `.populate()`-ing in the
  repository (same reasoning as `UsersPage`: keeps `userId`/`realtorId` a plain string everywhere).
- **Convention for severity**: `info` for successful mutations and successful login; `warning` for rejected/
  invalid attempts worth a security signal (failed login — both "no such user" and "wrong password" are
  logged, deliberately with the same external message shape so a log reader can't distinguish a valid email
  from an invalid one just by reading `message`); `error` is reserved for logging unexpected failures
  (not yet wired into the generic 500 branches — currently only the success paths and login failures log).
- **Never let sensitive fields reach a log.** See the Data layer's password-serialization note — the same
  discipline applies to any future entity with secrets (API keys, tokens, etc.): strip them before they
  reach `dataFrom`/`dataTo`, not after.
- **`userId` attribution** — `lib/auth.ts`'s `getCurrentUserId()` reads the httpOnly session cookie
  server-side (via `next/headers`'s `cookies()` + `verifyAuthToken`) and returns the acting user's id, or
  `null` if there isn't one. Every mutating route calls `userId: await getCurrentUserId()` inside its
  `LogEntryService` call so the Logs page's User column shows who actually did it, instead of always
  showing "—" (the row's own `realtorId` column is a separate concept — *whose* data was affected, not
  *who* changed it). This is attribution only, **not** an authorization check — it never rejects a request,
  it just identifies the caller when a session exists. Don't confuse it with the still-TODO route-handler
  auth enforcement everywhere else in this file; that's about permission, this is about the audit trail.
  Retrofitted across every existing mutating route in one pass (Realtors, Users, Clients, Properties,
  Energy Class, Heating System, and all 11 property-attribute pool entities) — **any new mutating route
  must call `getCurrentUserId()` the same way from day one**, not as a follow-up fix.
- Currently wired (create/update/delete, all with `userId` attribution): Realtor, User, Client, Property
  (category `"Properties"`), Land (category `"Land"`), Energy Class, Heating System, Note (category
  `"Notes"`), and the 13 property/land-attribute pool entities (Property Category, Floor Level, Building
  Floors, Heating Medium, Joinery Type, Glass Type, Floor Type, Garden Type, Zoning Type, Orientation, Road
  Access Type, Land Category, Slope) — plus login success/failure (`userId` set directly from the
  authenticating user, not via `getCurrentUserId()`, since login doesn't have a session cookie yet at the
  point it logs). Not yet
  wired: logout (the route exists — `POST /api/auth/logout` — but doesn't log; add a call there if that's
  wanted later).

## Footer notifications (implemented)

Ported from `backend.think.cms/src/store/footerSlice.ts` — same slice shape, same `MessageHandler` helper
API, **one deliberate change**: no `dangerouslySetInnerHTML`.

- **Types** — `lib/types.ts`: `MessageStyle` (`"normal" | "success" | "error" | "warning" | "info"`),
  `FooterMessage { text, style }`, `FooterState { message: FooterMessage | null }`.
- **Slice** — `store/footerSlice.ts`: `setMessage`, `setSuccess`, `setError`, `setWarning`, `setInfo`,
  `clearMessage`. Registered in `store/index.ts` as `state.footer`.
- **Helper** — `helpers/messageHandler.ts` (new top-level folder, mirroring backend.think.cms's `helpers/`
  convention — the first thing to live there): `MessageHandler.success/error/warning/info/normal(dispatch,
  text)` + `.clear(dispatch)`. Every call site imports this rather than dispatching `footerSlice` actions
  directly, exactly like backend.think.cms's own usage.
- **UI** — `components/layout/Footer.tsx`, rendered inside `DashboardShell` (so it's absent on `/login`,
  which has no shell): a message area (falls back to italic "No messages") plus a live `Clock` sub-component
  ticking every second via `setInterval` + `toLocaleTimeString`.
- **The one deviation from backend.think.cms, and why**: their `Footer.tsx` renders the message with
  `dangerouslySetInnerHTML` so call sites can bold parts of it (e.g. `` `User <strong>${email}</strong>
  created` ``). Since these messages routinely embed **user-controlled data** (emails, names), that's a
  stored-XSS vector — a value like `<img src=x onerror=...>` as a realtor's name would execute. This
  project's `Footer.tsx` renders `{message.text}` as plain text (React auto-escapes); call sites just don't
  wrap parts of the string in `<strong>`. No functionality is actually lost — only decorative bolding — so
  this isn't a partial port, it's the same feature made safe. If you're tempted to add rich formatting back,
  don't reach for `dangerouslySetInnerHTML` — sanitize first (e.g. escape everything except a small
  allow-listed set of tags) or don't allow HTML in call-site strings at all.
- **Wired into**: Realtor add/edit/delete, User add/edit/delete, Property add/edit/delete, login success
  (`"Welcome, {email}"`) — same call sites that already write a `LogEntry` for the same action. A mutating
  action doing one without the other going forward is a signal something was missed, not a deliberate
  choice.

### Page-load notification — mandatory convention

**Every page that loads a list must show a summary message on the footer via `MessageHandler.normal(...)`
once the load succeeds** — e.g. RealtorsPage shows `"Number of realtors: {count}"`, UsersPage shows
`"Number of users: {count}"`, LogsPage shows `"Number of log entries: {total}"` (the paginated total, not
just the current page's item count). This is a standing instruction for all future list-loading pages, the
same way LogEntry logging is — wire it in when a new page fetches a list, don't wait to be asked per-page.

- **Silence it on post-mutation reloads.** A list page normally reloads itself after Add/Edit/Delete (so
  the table reflects the change) — if that reload also fires the count message, it immediately overwrites
  the mutation's own `MessageHandler.success("X created")` message before anyone reads it. The fix used in
  `RealtorsPage`/`UsersPage`: the load function takes an `options?: { silent?: boolean }` param that skips
  the count message; a `reloadSilently` wrapper (`() => loadX({ silent: true })`) is what gets passed to the
  Add/Edit/Delete modals' `onSaved`/`onDeleted`, while the mount-time `useEffect` call stays non-silent.
  Don't use a mutable ref for this (backend.think.cms's `UsersPage` does, via a `suppressRef`) — the
  `options.silent` parameter is equivalent and doesn't need a ref reset dance.
- Applies each time a *fresh* load happens, not just on mount — `LogsPage`'s Previous/Next pagination calls
  `loadLogs(newPage)` directly (no silent variant), so paging shows an updated count each time, which is the
  desired behavior there (no competing per-row success message to protect).

## Internationalization (i18n) — infra + Realtors reference pattern (implemented)

**Decision: a lightweight client-side dictionary + Redux, not `next-intl` and not `app/[locale]/...` route
segmentation.** Considered both; picked this one because the app has no SEO/multi-domain requirement for
locale-scoped URLs, and it avoids restructuring every existing route under a `[locale]` segment. **Three
locales: Greek (`el`), English (`en`), Russian (`ru`)** — the Greek-first domain data (pool-entity seed
values) doesn't dictate the UI's default locale; `en` is the default until a real usage signal says
otherwise.

- **`lib/i18n/locales.ts`** — `Locale` type (`"en" | "el" | "ru"`), `DEFAULT_LOCALE` (`"en"`),
  `LOCALE_STORAGE_KEY` (`"webrealtor_locale"`), `LOCALE_OPTIONS` (value+label pairs for the switcher UI),
  and `isLocale()` (a type guard used when reading the untyped string back out of `localStorage`).
- **`lib/i18n/messages/en.ts`** is the **source of truth for the catalog shape** — `el.ts`/`ru.ts` each
  import `type { Messages } from "./types"` (`typeof en`) and annotate their default export with it, so
  adding a key to `en.ts` without adding the matching key to the other two is a **compile error**, not a
  silent runtime fallback to English or a blank string. Catalogs are plain nested TS objects (not JSON) for
  exactly this type-checking benefit. `lib/i18n/messages/index.ts` exports `MESSAGES: Record<Locale,
  Messages>`.
- **`lib/i18n/translate.ts`** — `translate(messages, key, params?)`: dot-path lookup (`"realtors.table.empty"`)
  plus `{param}` interpolation (`"Number of realtors: {count}"` + `{ count: 5 }`). Returns the raw key
  string (not a throw) when a lookup misses, so a missing translation is an obviously-wrong string in the
  UI rather than a crash.
- **`store/localeSlice.ts`** — holds `{ locale: Locale }` (`DEFAULT_LOCALE` initial), one `setLocale`
  reducer that both updates state and writes through to `localStorage` under `LOCALE_STORAGE_KEY`.
  Registered in `store/index.ts` as `state.locale`, same pattern as every other slice.
- **`store/hooks.ts`** — `useLocale()` (plain selector) and `useTranslation()`, which returns a memoized
  `t(key, params?)` closed over the current locale's catalog. Every component that renders user-facing text
  calls `const t = useTranslation();` and uses `t("...")` — no component reads `MESSAGES`/`translate`
  directly.
- **Hydration** — Redux state doesn't survive a full page load (same reasoning as `authSlice`'s `GET
  /api/auth/me` rehydration), so `app/LocaleHydrator.tsx` (rendered inside `app/providers.tsx`'s
  `<Provider>`, app-wide) has a mount-time `useEffect` that reads `LOCALE_STORAGE_KEY` from `localStorage`
  and dispatches `setLocale` if it holds a valid `Locale` (via `isLocale()`). Without this, every fresh page
  load would silently reset the UI to `DEFAULT_LOCALE` regardless of what the user picked last. **Lives at
  the `Providers` level, not in `DashboardShell`** — it originally did, but that meant the login page (never
  wrapped by `DashboardShell`, which only wraps the `(dashboard)` route group) never got the user's saved
  locale, so `LoginPage` always rendered in `DEFAULT_LOCALE` regardless of what they'd picked last session.
  Moved once `LoginPage` itself needed translating, for exactly that reason.
- **UI** — `components/layout/Topbar.tsx` gained a `Languages`-icon dropdown (the 3 `LOCALE_OPTIONS`, a
  checkmark on the active one) next to the existing account menu, and its `NAV_LINKS` now carry a
  `labelKey` (`"nav.dashboard"`, etc.) translated via `t()` instead of a hardcoded `label` string.
  `components/layout/Footer.tsx`'s static `"No messages"` fallback is now `t("common.noMessages")` — the
  *dynamic* `message.text` coming from `MessageHandler` calls elsewhere is **out of scope for this pass**
  (translating every `MessageHandler.success/error/...` call site across the whole app is follow-up work,
  not part of the infra pass).
- **`components/ui/Dropdown.tsx`** (new shared primitive) — extracted the moment the language switcher
  became **the second** click-to-toggle dropdown in the app (Topbar's account menu was the first, and its
  own comment already flagged this exact trigger point: *"If a second dropdown is ever needed elsewhere,
  that's the point to extract a reusable component instead of copying this one."*). Owns the
  outside-click/`Escape`-to-close behavior and menu positioning; takes a render-prop `children: (close: ()
  => void) => ReactNode` so callers can close the menu themselves after handling a click (sign-out, picking
  a language). Topbar's account menu was refactored to use it alongside the new language switcher — both
  now share `components/ui/Dropdown.module.scss`'s `.item`/`.itemActive`/`.header` classes, while
  Topbar-specific trigger content (avatar/email/role layout) stays in `Topbar.module.scss`.
- **Every feature is now translated.** Realtors was the reference pattern (`RealtorsPage.tsx`,
  `RealtorTable.tsx`, `RealtorForm.tsx`, `Add/Edit/DeleteRealtorModal.tsx`), and every other feature
  followed the same shape: `useTranslation()` + `t("feature.key")` for every label, header, empty state,
  button, and success/error `MessageHandler` message, reusing `common.*` (`cancel`/`save`/`saving`/
  `delete`/`deleting`/`selectPlaceholder`) instead of duplicating those per-feature. Catalog namespaces:
  `auth.*` (LoginPage), `clients.*`, `users.*`, `land.*` (LandsPage/LandTable/LandDetail/LandFormFields/
  DeleteLandModal), `properties.*` (PropertiesPage/PropertyTable/PropertyDetail's ~90 fields/
  PropertyFormFields/DeletePropertyModal), `media.*` (PropertyMediaPage/LandMediaPage/MediaManager/
  LocationMapPicker — one shared namespace since those are genuinely shared components, not duplicated
  per-entity), `logs.*`, and `settings.*`/`settingsPool.*`/`settingsEntities.*` (see below for why Settings
  needed a different shape).
- **Settings' 15 pool entities use a shared template, not 15 duplicate catalog blocks.** Since all 15 are
  structurally identical (name+slug shape, see "Property attribute pool entities" above), their
  Table/Form/Add/Edit/Delete text lives once under `settingsPool.*` (e.g. `addModalTitle: "Add {label}"`,
  `createdMessage: "{label} {name} created"`), interpolated with each entity's own translated display name
  from `settingsEntities.*` (`energyClass`, `heatingSystem`, `propertyCategory`, ... `slope`). Only
  `EnergyClassSection.tsx`/`HeatingSystemSection.tsx` keep hand-written text (`settings.energyClass.*` /
  `settings.heatingSystem.*`) since those two predate the codegen pattern and have their own subtitle
  wording — HeatingSystem's section heading also deliberately still says just "Heating" (`settings.
  heatingTabLabel`), not "Heating System", matching the pre-existing English behavior (see "Heating System
  management" above for why). **The el/ru templates deliberately avoid grammatical case agreement** (no
  genitive/accusative inflection of the interpolated `{label}`, no gendered Russian past-tense participles)
  since a single template spans 15 nouns of different genders/declensions — e.g. Russian success messages
  use an invariant "Запись «{name}» ({label}) создана" (lit. "Record '{name}' ({label}) created") with the
  always-feminine noun "запись" as the grammatical subject, rather than trying to conjugate around
  `{label}`'s actual gender. This is a deliberate simplicity/correctness trade-off for the templated part
  only — every hand-written feature catalog (Realtors, Clients, Land, Properties, etc.) uses fully natural,
  correctly-declined sentences since each one only needed translating once, not parameterized across 15
  different nouns.
- **`app/LocaleHydrator.tsx`** (see Hydration above) had to move out of `DashboardShell` specifically
  because of this pass — translating `LoginPage` was pointless while the locale slice only rehydrated
  post-login.

### New UI text — mandatory convention

**Every new user-facing string ships translated into all three locales (`en`, `el`, `ru`) in the same
change that introduces it.** This is a standing instruction for all future work, the same way LogEntry
logging and the page-load count message are — don't wait to be asked per-feature, and don't land a new
page/component/modal with hardcoded English text "to translate later." Concretely, when a change adds or
edits any label, heading, button, placeholder, empty state, or `MessageHandler` call:

- Add the key to `lib/i18n/messages/en.ts` first (it's the type source of truth — `el.ts`/`ru.ts` importing
  `type { Messages } from "./types"` means a missing key is a compile error, not a silent fallback), then
  fill in the matching `el.ts`/`ru.ts` entries — never leave a key English-only "for now."
  Prefer natural/idiomatic translations over literal word-for-word ones (this is a Greek-market product,
  so `el` in particular should read like copy a Greek realtor would actually use, not a machine-translated
  gloss). Reuse `common.*` keys (`cancel`/`save`/`saving`/`delete`/`deleting`/...) instead of adding a
  near-duplicate feature-scoped key for the same word.
- The component calls `useTranslation()` and renders `t("feature.key")` — never a raw string literal — same
  granularity and pattern as the Realtors reference feature above.
- This applies to every kind of UI element, not just full pages: a single new button, a new modal, a new
  form field label, a new table column header, a new footer/toast message — all of it goes through `t()`
  with all three locales filled in before the change is considered done.

## Date/time formatting — mandatory convention

**Every date/timestamp rendered in the UI uses a fixed `dd/MM/yyyy` (date-only) or `dd/MM/yyyy HH:mm`
(date+time, 24-hour) format — never `.toLocaleDateString()`/`.toLocaleString()`/`.toLocaleTimeString()`
called directly on a `Date`.** Those locale-dependent methods render differently depending on the
browser's locale (12h vs 24h, `mm/dd` vs `dd/mm`, ...), which is exactly what this rule exists to
avoid — the platform's dates should look the same for every user regardless of their browser
settings. This is a standing instruction for all future work, the same way the i18n and LogEntry
conventions are — don't wait to be asked per-feature.

- `lib/formatDate.ts` exports `formatDate(value)` (`dd/MM/yyyy`, for date-only fields like "Created"/
  "Last updated") and `formatDateTime(value)` (`dd/MM/yyyy HH:mm`, for timestamps where the time also
  matters — log entries, notes, price history rows). Both accept a `string | Date | null | undefined`
  and return `"—"` for a missing/invalid value instead of throwing, so callers don't need their own
  guard. Both format in the browser's local timezone (same as the `.toLocale*()` calls they replaced),
  only the *shape* of the output is fixed, not the timezone.
- Currently used by `PropertyViewPage` (price history rows, created/updated-on), `NoteItem` (note
  timestamp), and `LogsPage` (log entry timestamp) — every date/timestamp display in the app at the
  time this convention was introduced. Any new feature that renders a date must import from
  `lib/formatDate.ts` rather than reaching for `.toLocaleDateString()`/`.toLocaleString()` again.
- **Not covered**: `components/layout/Footer.tsx`'s live ticking clock (seconds-resolution "current
  time" display, no date component) still calls `toLocaleTimeString()` directly, but was switched to
  `hour12: false` (24-hour) to match the spirit of this rule — it doesn't use `formatDate.ts` since
  that module has no time-only formatter and this is the one place that needs one. `<input
  type="date">` values in edit forms (`PropertyDetail`, `LandDetail`) are also unaffected — those are
  HTML form values (always `yyyy-MM-dd`, mandated by the input type itself), not a rendered display.

## Icons

`lucide-react` is the icon set (matches both reference projects). Convention, set by the Topbar/RealtorTable
usage: navigation links show an icon **next to** the label (`<Icon size={14} /> <span>{label}</span>`);
row-level actions (table Edit/Delete, etc.) are **icon-only** — use `components/ui/Button` with the
`sharedStyles.buttonIcon` class (from `styles/components/_button.scss`, a compact square padding variant)
plus a `title`/`aria-label` for accessibility, no visible text.

## State management

Redux Toolkit (`store/`), same as `backend.think.cms/src/store/`, but scoped to **cross-cutting client
state only** — `authSlice` (current user/token), `uiSlice` (sidebar/nav state), `footerSlice` (see Footer
notifications), and `localeSlice` (see Internationalization). Entity data (realtors/clients/properties) is
**not** kept in Redux: pages fetch it directly through `apiClient` in the feature's own page
component/hook, same division of responsibility as backend.think.cms (its store only holds `authSlice`,
`navigationSlice`, `modulesSlice`, `footerSlice` — never entity CRUD data).

## Docker / environment

`docker-compose.yml` builds the `backend` service from `./src` (Dockerfile.dev for dev, bind-mounted, no
build step; Dockerfile for a production multi-stage build) — copied from backend.think.cms's compose file
and adjusted to this project's naming (`webrealtor` network/containers, `webrealtor` Mongo database). The
Redis service/dependency that existed in the backend.think.cms compose file was **dropped** — this project
has no caching requirement yet; add it back the same way backend.think.cms does if one shows up later.

## Status

Partly a **skeleton**, partly implemented. **Fully implemented**: Realtor management, User management,
Property management (full ~90-field CRUD, the one full-page-instead-of-modal deviation — see its section
above), Land management (a distinct ~30-field entity, same full-page CRUD pattern as Property), LogEntry
logging (including `userId` actor attribution via `getCurrentUserId()`), Auth (login/logout/session,
`proxy.ts` route + role gating, the paginated Logs page), self-service **Registration** (`/signup` +
branded email confirmation + realtor-info completion at `/confirm-registration`, ending in a linked
Administrator/Realtor pair — see its section above), and 15 Settings pool entities — Energy Class,
Heating System, the 11 property-attribute pool entities (Property Category, Floor Level, Building Floors,
Heating Medium, Joinery Type, Glass Type, Floor Type, Garden Type, Zoning Type, Orientation, Road Access
Type), and the 2 land-attribute pool entities (Land Category, Slope) — and Client management — see
their sections above. Also implemented: read-only **Property/Realtor/Client View Pages**
(`/properties/[id]/view`, `/realtors/[id]/view`, `/clients/[id]/view`, all visible to every role) and
**Price History** (tracked for both Property and Land on every create/price change, surfaced on the
Property View Page) — see their sections above; Land doesn't have its own View Page yet, so its price
history has no UI to attach to until one is built. Also implemented: **Notes**
(date/title/text/importance) and **Files/Attachments** (uploaded files with a title/description,
whitelist-validated against dangerous types), both attachable to a Realtor, Client, Property, or
Land via one generic `/api/notes`/`/api/attachments` resource each — surfaced together as the two
tabs of `EntityDetailTabs` on the Realtor/Client/Property View Pages, and via
`EntityDetailModal` (the same tabs, modal-wrapped) only on `LandTable` (Land has no view page yet) —
see their sections above. Also implemented: **Owns**, a read-only Client-only tab listing every
Property/Land this client owns (basic columns only, links out to the existing Property/Land pages),
**Interest For**, a Client-only CRUD table (date, for sale/rent, property-or-land type, category,
price, city, area, remarks, active flag), and **Viewings**, a Client-only CRUD table recording a
client viewing a specific Property/Land listing (date, type, listing, comment, and an optional link
to a signed document already uploaded via Files) — all three surfaced as tabs of `EntityDetailTabs`
only when viewing a Client, in the order Owns, Interest For, Viewings — see their sections above. Also implemented: **Transactions** (`/transactions`, a top-level nav item accessible to every role,
scoped by realtor for Administrator/Operator) — recording a completed rent/buy deal tying a
Realtor's Client to that Realtor's own Property/Land listing, with price and commission — see its
section above. Also implemented: a self-service **Profile** page (`/profile`, reachable by
every role via the Topbar account dropdown) — password change for everyone, a self-service
**display-language** change (persisted on `User.language`, not just the browser-local
`store/localeSlice`), plus realtor-info editing gated on `user.realtorId` being set (Administrator
in practice) — see its section above.
Also implemented: the
**Internationalization infra** (locale slice, translation hook,
3-locale message catalogs, language switcher) with **every feature now translated** (Realtors was the
reference pattern; Clients, Users, Land, Properties, the Media feature, Logs, Auth, and all 15 Settings
pool entities followed — see that section above for the full catalog-namespace breakdown and the shared
`settingsPool.*` template the 15 pool entities use instead of duplicating). **Still skeleton-only**: the
Property Options Settings tab (its placeholder text is translated, but the feature itself isn't built), and
**route-handler-level auth** (every API route today trusts its caller; `proxy.ts` only gates *pages*, per
Next's own guidance that Proxy is an optimistic first line, not the only one — the `TODO` comments in each
route handler mark exactly where a real check needs to land).
