# Public API

This file is the canonical list of endpoints in this app that are meant for **external, third-
party consumption** — e.g. a realtor's own website posting a contact-form submission into
my.webrealtor.gr. Everything else under `/api/**` is internal-only: it's called solely by this
app's own frontend, and while it isn't authenticated yet either (see CLAUDE.md's route-level-auth
TODO), it is not a supported integration surface and its shape can change without notice.

Endpoints listed here get a stable, explicit request/response contract and CORS support, since
they're expected to be called from a different origin than my.webrealtor.gr.

## Response envelope

**Every endpoint under `/api/public/**` returns the same JSON envelope**, regardless of outcome:

```json
{
  "success": true,
  "payload": null,
  "message": ""
}
```

| Field     | Type            | Notes                                                                 |
|-----------|-----------------|------------------------------------------------------------------------|
| `success` | boolean         | `true` for any 2xx response, `false` otherwise.                        |
| `payload` | object \| null  | Endpoint-specific data, if any. `null` when there's nothing to return. |
| `message` | string          | Human-readable status/error text. May be empty on success.             |

Built server-side via `PublicApiResponse` (`src/lib/publicApiResponse.ts`) — every route under
`/api/public/**` must use it (`PublicApiResponse.success(payload?, message?)` /
`PublicApiResponse.error(message)`, `.toResponse(status, headers)`) rather than constructing
`NextResponse.json()` bodies by hand, so this envelope can never drift between endpoints. This is
intentionally distinct from `ApiResponse<T>` (`lib/types.ts`, `data`/`message`/`success`), which is
for this app's own internal `/api/**` routes only.

---

## `POST /api/public/message`

Receives a submission from an embedded public form (e.g. a website contact form) and:
1. Stores it as a `Message` row, scoped to the realtor that owns the form.
2. Emails the form's configured recipient a plain `key: value` rendering of the submission.

Unauthenticated by design — no cookie/token is required or checked. The `guid` in the request body
is the only credential: it identifies which realtor/form (and therefore which subject/recipient)
the submission belongs to. A realtor's guid is generated automatically when a Root user creates a
Message Form for them (Realtors → the "Message Forms" row action) and should be pasted into the
website form's markup — see the example below.

### CORS

Cross-origin requests are allowed from any origin:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
Browsers will send a preflight `OPTIONS` request first; this endpoint answers it with `204` and
the headers above.

### Request

`Content-Type: application/json`

```json
{
  "guid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+30 210 1234567",
    "message": "I'm interested in the listing at..."
  }
}
```

| Field     | Type   | Required | Notes                                                            |
|-----------|--------|----------|-------------------------------------------------------------------|
| `guid`    | string | yes      | From the Message Forms table for the realtor this form belongs to |
| `message` | object | yes      | Flat key/value pairs — whatever fields the form collects. Max 100 keys. |

### Response

Follows the [response envelope](#response-envelope) above; `payload` is always `null` for this
endpoint.

| Status | Body                                                            | Meaning                                              |
|--------|-------------------------------------------------------------------|-------------------------------------------------------|
| 201    | `{ "success": true, "payload": null, "message": "Message received" }` | Stored and (best-effort) emailed.                     |
| 400    | `{ "success": false, "payload": null, "message": "Invalid request" }` | Missing `guid`, or `message` isn't a non-empty object. |
| 404    | `{ "success": false, "payload": null, "message": "Not found" }`       | `guid` doesn't match any configured form.              |
| 500    | `{ "success": false, "payload": null, "message": "Internal server error" }` | Unexpected failure.                              |

A `201` response does not guarantee the notification email was delivered — sending is
best-effort (same discipline as every other email in this app, see CLAUDE.md → registration
email). The submission is durably stored either way.

### Example: plain HTML form (message)

```html
<form id="contact-form">
  <input type="hidden" name="guid" value="3fa85f64-5717-4562-b3fc-2c963f66afa6" />
  <input type="text" name="name" placeholder="Your name" required />
  <input type="email" name="email" placeholder="Your email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>

<script>
  document.getElementById("contact-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const guid = form.get("guid");
    const message = Object.fromEntries(
      [...form.entries()].filter(([key]) => key !== "guid")
    );

    const response = await fetch("https://my.webrealtor.gr/api/public/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guid, message }),
    });

    if (response.ok) {
      event.target.reset();
      alert("Thanks — your message was sent.");
    } else {
      alert("Something went wrong, please try again.");
    }
  });
</script>
```

---

## `GET /api/public/assets`

Returns a realtor's own **active or pending** listings — both properties and land assets (see
CLAUDE.md → "Asset management"; never `inactive` ones — that status isn't exposed publicly, and
isn't one of the filters below). Meant for a realtor's own website to pull its own listings and
render them, e.g. as a "current listings" page.

> **Renamed from `/api/public/properties`:** this endpoint used to live at
> `GET /api/public/properties` and return only properties. Renamed to `/api/public/assets` and
> broadened to return land assets too — done before this app had any real external integrations,
> so the old path is gone rather than kept as an alias. Every payload item now carries a new
> `isLand: boolean` field; pass `kind=property` (see below) to get only property-shaped results.

Unauthenticated by design, same as `POST /api/public/message` — but note this endpoint is keyed
by a **different guid**: a `Realtor.guid` (one per realtor, identifies *all* of that realtor's
listings), not a `MessageForm.guid` (one per contact form, identifies where a submission should be
emailed). The two are unrelated identifiers on different models and are never interchangeable. A
realtor's guid is generated automatically (`models/Realtor.ts`) and is visible to a Root user on
that realtor's View page ("Public API" card).

### CORS

Cross-origin requests are allowed from any origin:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
Browsers will send a preflight `OPTIONS` request first; this endpoint answers it with `204` and
the headers above.

### Request

`GET /api/public/assets?guid=...&kind=...&type=...&landType=...&action=...&minPrice=...&maxPrice=...`

All filters are optional query string parameters and can be combined.

| Param      | Type   | Required | Notes                                                                 |
|------------|--------|----------|-------------------------------------------------------------------------|
| `guid`     | string | yes      | The realtor's own guid (see above) — identifies whose listings to return. |
| `kind`     | string | no       | `property` or `land` — restricts results to just that kind. Omitted → both. Any other value → `400`. |
| `type`     | string | no       | A Property Category **slug** (Settings → Property Category, e.g. `diamerisma`) — only ever matches property results. Unknown slug → `400`. |
| `landType` | string | no       | A Land Category **slug** (Settings → Land Category) — only ever matches land results. Unknown slug → `400`. |
| `action`   | string | no       | `sale` or `rent` — matches `transactionType`, applies to both kinds. Any other value → `400`. |
| `minPrice` | number | no       | Inclusive lower bound on `price`. Negative/non-numeric → `400`.          |
| `maxPrice` | number | no       | Inclusive upper bound on `price`. Negative/non-numeric, or below `minPrice` → `400`. |

### Response

Follows the [response envelope](#response-envelope) above; `payload` is an array of listing
objects (empty array, not an error, when nothing matches). Each object is the asset's full
`toJSON()` shape (see `models/Asset.ts` — the merged property/land field set: description, area,
rooms, energy/construction/technical flags, location, `images`, etc., with land-only or
property-only fields simply absent/null depending on kind) with these changes for the public
contract:
- `isLand: boolean` — the kind discriminator; `true` for a land asset, `false` for a property.
- `clientId` and `realtorId` are stripped (internal refs — the client is the listing's private
  owner record, and the realtor is already implied by `guid`).
- For a property (`isLand: false`): `propertyCategoryId` is replaced by a populated
  `propertyCategory: { id, name, slug }` object (or `null`); no `landCategory` key is present.
- For a land asset (`isLand: true`): `landCategoryId` is replaced by a populated
  `landCategory: { id, name, slug }` object (or `null`); no `propertyCategory` key is present.
- Every other `*Id` ref (`energyClassId`, `heatingSystemId`, `slopeId`, etc.) is still a raw
  ObjectId — not populated, out of scope for this endpoint today.

| Status | Body                                                                        | Meaning                                    |
|--------|-------------------------------------------------------------------------------|----------------------------------------------|
| 200    | `{ "success": true, "payload": [ { ... }, ... ], "message": "" }`             | Query executed (possibly zero results).      |
| 400    | `{ "success": false, "payload": null, "message": "Invalid request" }`         | Missing `guid`, or an invalid `kind`/`type`/`landType`/`action`/`minPrice`/`maxPrice`. |
| 404    | `{ "success": false, "payload": null, "message": "Not found" }`               | `guid` doesn't match any realtor.             |
| 500    | `{ "success": false, "payload": null, "message": "Internal server error" }`   | Unexpected failure.                           |

### Example

```js
const response = await fetch(
  "https://my.webrealtor.gr/api/public/assets?" +
    new URLSearchParams({
      guid: "9c6f2b1a-9e2d-4b2b-8a3e-1f2c3d4e5f6a",
      kind: "property",
      type: "diamerisma",
      action: "sale",
      minPrice: "100000",
      maxPrice: "300000",
    })
);
const { success, payload } = await response.json();
if (success) {
  payload.forEach((listing) => console.log(listing.isLand, listing.title, listing.price));
}
```

---

## `GET /api/public/assets/{id}`

Detail counterpart to `GET /api/public/assets` above — returns a single listing (property or
land asset, see the list endpoint's contract note) instead of a filtered collection. Same guid (a
`Realtor.guid`, not a `MessageForm.guid`) and same active/pending-only scoping: a listing that's
`inactive`, or that belongs to a different realtor than the one `guid` identifies, is treated
identically to a nonexistent `id` — both return `404`, so the endpoint never confirms or denies a
listing's existence outside the caller's own guid.

### CORS

Cross-origin requests are allowed from any origin:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
Browsers will send a preflight `OPTIONS` request first; this endpoint answers it with `204` and
the headers above.

### Request

`GET /api/public/assets/{id}?guid=...`

| Param  | Type   | Required | Notes                                                                    |
|--------|--------|----------|---------------------------------------------------------------------------|
| `id`   | string | yes      | Path segment — the listing's `id`. Not a 24-char hex ObjectId → `400`.    |
| `guid` | string | yes      | The realtor's own guid (see the list endpoint above).                     |

### Response

Follows the [response envelope](#response-envelope) above; `payload` is a single listing object on
success — same shape as one entry of the list endpoint's `payload` array (full `toJSON()` shape
with `clientId`/`realtorId` stripped, `isLand` present, and `propertyCategoryId`/`landCategoryId`
replaced by a populated `propertyCategory`/`landCategory` object depending on `isLand` — see the
list endpoint's Response section for the exact rule).

| Status | Body                                                                         | Meaning                                                                                            |
|--------|---------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| 200    | `{ "success": true, "payload": { ... }, "message": "" }`                        | Listing found, belongs to this guid's realtor, active/pending.                                         |
| 400    | `{ "success": false, "payload": null, "message": "Invalid request" }`           | Missing `guid`, or `id` isn't a valid ObjectId shape.                                                   |
| 404    | `{ "success": false, "payload": null, "message": "Not found" }`                 | `guid` doesn't match any realtor, or `id` doesn't resolve to an active/pending listing owned by that realtor. |
| 500    | `{ "success": false, "payload": null, "message": "Internal server error" }`     | Unexpected failure.                                                                                     |

### Example

```js
const response = await fetch(
  "https://my.webrealtor.gr/api/public/assets/64f1a2b3c4d5e6f7a8b9c0d1?" +
    new URLSearchParams({ guid: "9c6f2b1a-9e2d-4b2b-8a3e-1f2c3d4e5f6a" })
);
const { success, payload } = await response.json();
if (success) {
  console.log(payload.isLand, payload.title, payload.price);
}
```
