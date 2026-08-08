---
name: settings-pool-entity
description: Scaffolds a new simple "pool" lookup-list entity (a Settings-page CRUD list with a display name, a unique/indexed slug identifier, and a soft-delete flag — e.g. Energy Class, Heating System, Property Options) for the my.webrealtor.gr Next.js app, wiring up the model, repository, service, API routes, frontend types, Settings-tab UI (table + add/edit/delete modals), optional seeder, and a CLAUDE.md documentation section. Trigger this whenever the user says "create a pool entity", "create a settings pool entity", "add a lookup list called X", "add a new Settings category/tab for X", or names one of the still-placeholder Settings tabs (Heating, Property Options) and asks to implement it. Do NOT use this for entities that need more than name/slug + soft-delete (Realtor, Client, Property, User already have their own richer conventions elsewhere in CLAUDE.md) — this skill is specifically for the flat name+slug lookup-list shape.
---

# Settings pool entity scaffolder

This repo (`C:\ThinkPositive\my.webrealtor.gr`) has one Settings-page pattern for simple lookup
lists: a global (not per-realtor) list of `{ name, slug, deletedAt }` values, soft-deleted rather than
hard-deleted, managed through its own tab in Settings. `slug` is the durable machine identifier — a
unique, indexed string other code/config can reference safely even if the display `name` gets
retranslated or reworded later; `name` is just the human-facing label. **Energy Class was the first
one built** — `components/settings/energyClass/`, `models/EnergyClass.ts`,
`repositories/EnergyClassRepository.ts`, `services/EnergyClassService.ts`, `app/api/energy-classes/`,
`scripts/seed-energy-classes.ts`, and the "Energy Class management (implemented)" section in
`CLAUDE.md` are the canonical reference for every step below — **except that Energy Class predates the
`slug` field and doesn't have one.** Copy its structure but layer `slug` on top everywhere this file
shows it; don't copy Energy Class's absence of a slug into a new entity. When in doubt about a
convention this file doesn't spell out, go read those files — don't improvise a different shape.

`CLAUDE.md` is this repo's source of truth for conventions (styling, logging, footer notifications,
component layout). Everything this skill generates must stay consistent with it — read the
relevant sections (Data layer, Component convention, Styling, Logging, Footer notifications) if
anything below is ambiguous.

## Step 0 — Gather the naming forms

Don't guess plurals or route names — ask, or infer from context, but confirm before writing files.
You need:

| Placeholder | Meaning | Example (Energy Class) | Example (Heating) |
|---|---|---|---|
| `{Entity}` | PascalCase singular — model/service/component prefix | `EnergyClass` | `Heating` |
| `{entity}` | camelCase singular — component folder, settings-tab id | `energyClass` | `heating` |
| `{route}` | kebab-case API route segment (plural if it reads naturally plural, singular mass-noun otherwise — e.g. "heating" doesn't pluralize) | `energy-classes` | `heating` |
| `{Label}` | Human label shown in the sidebar/section header | `Energy Class` | `Heating` |
| `{Icon}` | A `lucide-react` icon name for the sidebar | `Zap` | `Flame` |

Check `components/settings/SettingsSidebar.tsx` first: `SettingsSection` is currently
`"heating" | "energyClass" | "propertyOptions"`. If `{entity}` matches one of the two still-placeholder
slots (`heating`, `propertyOptions`), you're **filling an existing reserved slot** — reuse its label/icon
already in `SECTIONS`, don't invent a new one. If it's a genuinely new category, you're **adding a new
tab** — extend the `SettingsSection` union and `SECTIONS` array with a new id/label/icon.

**If the user's request already includes a list of starting values** (e.g. "create a pool entity
called Heating with Central, Fireplace, Underfloor, None" — same shape as how Energy Class was seeded
with the Greek EPC scale), that alone is the signal to build the Step 8 seeder — don't wait for a
separate "yes, seed it" confirmation, and don't skip Step 8 just because seeding wasn't called out as
its own instruction. Only skip Step 8 if no values were given anywhere in the request; in that case,
ask once whether they want seed data before assuming "no."

## Step 1 — Model: `models/{Entity}.ts`

Every field the entity needs is exactly these six — **checklist before moving on: `id`, `name`,
`slug`, `deletedAt`, `createdAt`, `updatedAt` must all be traceable on the Mongoose side (either
hand-declared or provided by `baseSchemaOptions`) and all six must reappear on the `lib/types.ts`
frontend interface in Step 5. Say so explicitly when you're done with this step — don't let it be
implicit.**

```ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { baseSchemaOptions } from "@/lib/mongooseSchemaOptions";

export interface I{Entity} extends Document {
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type I{Entity}Model = Model<I{Entity}>;

const {entity}Schema = new Schema<I{Entity}, I{Entity}Model>(
  {
    name: { type: String, required: true, trim: true },
    // unique: true both enforces uniqueness and creates the index — this is the field's whole job
    // (a stable machine identifier), so don't skip either half of that.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

export const {Entity} =
  (mongoose.models.{Entity} as I{Entity}Model) ||
  mongoose.model<I{Entity}, I{Entity}Model>("{Entity}", {entity}Schema);
```

`id` is not hand-declared here — `baseSchemaOptions`'s `toJSON` transform derives it from `_id` (see
CLAUDE.md → Data layer). `createdAt`/`updatedAt` come from `baseSchemaOptions`'s `timestamps: true`.
That's the whole model — resist adding anything beyond `name`/`slug`/`deletedAt`; if the entity needs
more fields than that, this is the wrong skill for it (see the description above).

Mongo builds `slug`'s unique index in the background the first time this model is loaded against a
running dev container — if you seed records with duplicate slugs in the same run before the index
finishes, you can hit a race. In practice this repo's seeders run sequentially and check
`findOne` before each insert (see Step 8), so this hasn't been an issue, but keep it in mind if a
future seeder is written to insert in parallel.

## Step 2 — Repository: `repositories/{Entity}Repository.ts`

```ts
import { {Entity}, type I{Entity} } from "@/models/{Entity}";
import { BaseRepository } from "./BaseRepository";

class {Entity}Repository extends BaseRepository<I{Entity}> {
  constructor() {
    super({Entity});
  }

  // Ascending createdAt (not BaseRepository.findAll's default newest-first) so the list keeps a
  // stable order matching insertion/seed order instead of most-recently-edited-first.
  findActive() {
    return this.model.find({ deletedAt: null }).sort({ createdAt: 1 }).exec();
  }

  findByName(name: string) {
    return this.model.findOne({ name, deletedAt: null }).exec();
  }

  // The uniqueness check API routes actually rely on — slug, not name, is the identifier.
  findBySlug(slug: string) {
    return this.model.findOne({ slug, deletedAt: null }).exec();
  }

  softDelete(id: string) {
    return this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }
}

export const {entity}Repository = new {Entity}Repository();
```

## Step 3 — Service: `services/{Entity}Service.ts`

```ts
import { connectDB } from "@/lib/mongodb";
import { {entity}Repository } from "@/repositories/{Entity}Repository";
import type { I{Entity} } from "@/models/{Entity}";

export class {Entity}Service {
  static async list() {
    await connectDB();
    return {entity}Repository.findActive();
  }

  static async get(id: string) {
    await connectDB();
    return {entity}Repository.findById(id);
  }

  static async findByName(name: string) {
    await connectDB();
    return {entity}Repository.findByName(name);
  }

  static async findBySlug(slug: string) {
    await connectDB();
    return {entity}Repository.findBySlug(slug);
  }

  static async create(data: Partial<I{Entity}>) {
    await connectDB();
    return {entity}Repository.create(data);
  }

  static async update(id: string, data: Partial<I{Entity}>) {
    await connectDB();
    return {entity}Repository.update(id, data);
  }

  // Soft delete: sets deletedAt rather than removing the document — see models/{Entity}.ts.
  static async remove(id: string) {
    await connectDB();
    return {entity}Repository.softDelete(id);
  }
}
```

## Step 4 — API routes

`app/api/{route}/route.ts` (list + create) and `app/api/{route}/[id]/route.ts` (get/update/delete) —
copy `app/api/energy-classes/route.ts` and `.../[id]/route.ts` verbatim, replacing `EnergyClass` →
`{Entity}`, `energy classes`/`energy class` → `{route}`/`{Label}` in messages, and the log category
`"EnergyClass"` → `"{Entity}"`. Keep every behavior identical:

- `GET` (list) returns `{Entity}Service.list()` (active only).
- `POST` validates both `name` and `slug` are present (400 if either is missing — trim `name`, and
  trim + lowercase `slug` the same way the model does, so what you check against `findBySlug` matches
  what's actually stored). Check `findBySlug` for a 409 duplicate (**slug is the identifier being
  deduplicated, not name** — two records can share a display name in principle, they can't share a
  slug). Create, then call `LogEntryService.info({ category: "{Entity}", message: ..., dataTo: ... })`.
- `GET [id]` 404s if missing.
- `PUT [id]` re-validates `name`+`slug`, re-checks slug duplicates via `findBySlug` (excluding self),
  logs `dataFrom`/`dataTo`.
- `DELETE [id]` 404s if missing, otherwise calls `{Entity}Service.remove` (soft delete) and logs
  `dataFrom` only.
- Leave the `// TODO: gate with the Root-role check once route-level auth middleware lands.` comment
  on the list route — this whole area (`/settings`) is still on the same still-TODO route-auth gap as
  every other entity in this repo.

## Step 5 — Types: append to `lib/types.ts`

Add near the other Settings-lookup entities (after `Realtor` or alongside `EnergyClass` if it's
already there):

```ts
export interface {Entity} {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type {Entity}Input = Pick<{Entity}, "name" | "slug">;
```

**Confirm now**: `id`, `name`, `slug`, `deletedAt`, `createdAt`, `updatedAt` are all present here too
— this is the second half of the Step 1 checklist. Don't skip stating this out loud when you finish.

## Step 6 — UI: `components/settings/{entity}/`

Six files, each copied from the matching `components/settings/energyClass/*` file with
`EnergyClass`→`{Entity}`, `energyClass`→`{entity}`, `energy-classes`→`{route}`, and the label text
swapped to `{Label}`:

- `{Entity}Form.tsx` — **two** text fields, `name` and `slug` (Energy Class's form only had one —
  don't copy that part), same field/label/input markup pattern as `EnergyClassForm.tsx` repeated
  twice. Label the slug field clearly (e.g. "Slug" with a small hint like "unique identifier — letters,
  numbers, hyphens") so whoever's filling it in (Root only, but still) understands it's not just
  another display field.
- `Add{Entity}Modal.tsx`, `Edit{Entity}Modal.tsx`, `Delete{Entity}Modal.tsx` — same
  `apiClient`/`MessageHandler`/`getErrorMessage` wiring as the Energy Class ones.
- `{Entity}Table.tsx` — three columns (Name, Slug, Actions) — show the slug as a secondary/muted
  value (e.g. monospace, `text-neutral-400 text-xs`) since it's an identifier, not the primary label.
  Same empty-state row and icon-only Edit/Delete buttons (`sharedStyles.buttonIcon`,
  `Pencil`/`Trash2` from `lucide-react`) as Energy Class.
- `{Entity}Section.tsx` — the page-load fetch + count-message + silent-reload-after-mutation pattern
  (see CLAUDE.md → Footer notifications' "Page-load notification" convention), an "Add {Label}" button,
  and the three modals. **No `canEdit`/role gating** on the Add/Edit/Delete controls — `/settings` is
  already Root-only via `proxy.ts` + `Topbar`'s `NON_ROOT_ALLOWED_HREFS`, so unlike Clients/Properties
  there's no partial-access role to gate against here.

## Step 7 — Wire into the Settings shell

In `components/settings/SettingsSidebar.tsx`:
- If `{entity}` is one of the two still-placeholder slots (`heating`, `propertyOptions`), leave
  `SettingsSection` and `SECTIONS` alone — the slot already exists.
- Otherwise, add `{entity}` to the `SettingsSection` union and push `{ id: "{entity}", label: "{Label}", icon: {Icon} }`
  onto `SECTIONS` (import `{Icon}` from `lucide-react` alongside the existing `Flame`/`Zap`/`SlidersHorizontal`).

In `components/settings/SettingsPage.tsx`:
- Import `{Entity}Section` from `./{entity}/{Entity}Section`.
- Remove `{entity}` from `SECTION_CONTENT`'s key type (same `Exclude<SettingsSection, ...>` pattern
  already used for `energyClass`) if it's not already excluded.
- Add `{entity} === active` as another branch that renders `<{Entity}Section />` instead of the
  generic "Coming soon" `Card`, alongside the existing `energyClass` branch.

## Step 8 — Seeder (build it whenever starting records were given)

**Trigger for this step is "did the request include a list of values," not "did the user separately
ask for a seeder."** If the invocation named starting records (a list of names, an enum of options,
anything read as "start it off with these"), build this step — don't treat it as skippable just
because seeding wasn't its own sentence.

`scripts/seed-{route}.ts`, copied from `scripts/seed-energy-classes.ts` but seeding an array of
`{ slug, name }` pairs (Energy Class's seed list was bare strings — that only worked because it had
no slug yet), idempotent (`findOne({ slug, deletedAt: null })` before creating each one — slug is the
identifier, so that's what dedup must check, not `name`), logs what it did, exits 0/1. Wire it into
`src/package.json`:

```json
"predev": "npm run seed:root && npm run seed:energy-classes && npm run seed:{route}",
"predev:docker": "npm run seed:root && npm run seed:energy-classes && npm run seed:{route}",
"seed:{route}": "tsx ./scripts/seed-{route}.ts"
```

(Keep whatever other `seed:*` calls are already chained in — just append this one.) If the user gave
no seed values and confirmed they don't want any, skip this step and don't create an empty seeder
just to have one.

## Step 9 — Document it in CLAUDE.md

Add a `## {Entity} management (implemented)` section, same depth as "Energy Class management
(implemented)" — cover: the model's fields (call out `slug` as the unique/indexed identifier field,
distinct from Energy Class which doesn't have one) and the soft-delete behavior, the repository's
ascending-sort/softDelete/findBySlug methods, the API's validation/409-on-duplicate-slug/404 shape and
log category, the UI split (including the two-field form and three-column table) and the "no
canEdit gating" note, the seeder if one exists, and a trailing "Not yet implemented" line (Root-role
route-handler enforcement is always still true). Update the `## Status` section's list of
fully-implemented features if this is the kind of thing that belongs there.

## Verification before calling it done

1. Run `npx tsc --noEmit -p tsconfig.json` from `src/` — must be clean.
2. Run `npx eslint` on every new/changed file — must be clean.
3. If a Docker dev container is already running (`docker ps` — look for a `*-backend` container), new
   route/component files are picked up automatically by webpack polling; a brand-new model file needs
   no restart either (it's not editing an existing schema's fields — see CLAUDE.md's dev-restart note,
   which only applies to *changing* an existing model). Run the seeder inside the container if one was
   created: `docker exec <container> npm run seed:{route}`.
4. If browser tools are available, log in as the seeded Root user, open `/settings`, select the new
   tab, and do one add → edit → delete cycle to confirm the full loop before reporting done — this is
   exactly how Energy Class itself was verified.
