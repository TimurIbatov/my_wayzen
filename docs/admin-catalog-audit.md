# Admin & catalog audit

**Date:** 2026-10-21  
**Branch:** `cursor/catalog-seed-50-69f8`  
**Seed result:** **50** places in Postgres / `GET /api/places` / overview `placesTotal=50`, all `verificationStatus=preliminary`.

---

## Catalog seed (~50)

| Item | Status |
| --- | --- |
| Place count | **50** (was 16) |
| Upsert by slug | Yes (`ON CONFLICT (slug) DO UPDATE`) |
| Verification | Forced to **`preliminary`** in seed — never auto-`verified` |
| Stories RU/EN | All 50 hand-written (2–4 paragraphs) |
| Practical notes, tags, seasonality, accessDifficulty | Present |
| Images | 1–3 URLs each; Wikimedia Commons preferred with credit in `source` |
| Hours / prices / safety | Not invented (disclaimers in notes + stories) |
| Further growth | Intended via AdminPlaces / admin APIs |

Regenerate extras: `node scripts/build-seed-extra.mjs` then `npm run seed`.

---

## Admin can / can’t

### Can do today (basic improve-via-admin)

| Capability | UI (`/admin/places`) | API |
| --- | --- | --- |
| List all places (incl. drafts) | Yes | `GET /admin/places` |
| Create place | Yes | `POST /admin/places` |
| Update fields | Yes | `PATCH /admin/places/{slug}` |
| Delete place | Yes (confirm) | `DELETE /admin/places/{slug}` |
| Multilingual names | RU / EN / UZ | Same |
| Stories + practical notes RU/EN | Yes | Same |
| Coords, region, category, kind | Yes | Same |
| Tags, seasonality, accessDifficulty | Yes (comma / free text) | Arrays |
| Image URL list | Yes (one URL per line) | `imageUrls[]` |
| Upload photos | Yes → signed URL → App Storage | `POST /api/storage/uploads/request-url` (admin) |
| Change verification status | Yes (`draft` / `preliminary` / `verified` / `stale`) | Same enum |
| Source / credit text | Yes | `source` |
| Auth gate | Clerk + `WAYZEN_ADMIN_USER_IDS` | `requireAdminId` → 401/403 |

Public catalog hides `draft` (`ne(verificationStatus, "draft")`).

### Gaps (editor wants later — not built)

| Gap | Notes |
| --- | --- |
| Bulk import / CSV / JSON | No bulk endpoint or UI |
| Search / filter / sort in admin list | Flat list only |
| Slug rename | Slug immutable after create (by design) |
| Dedicated image gallery / reorder / captions | URLs only; credit lives in free-text `source` |
| Structured categories / regions enums | Free text (easy to typo) |
| UZ story / notes fields | Only `nameUz` in schema; stories stay RU/EN |
| Preview of public card | No side-by-side public preview |
| Audit log / who changed what | No |
| Soft-delete / trash | Hard delete |
| Map pin picker | Lat/lng number fields only |
| Storage without GCS/sidecar | Upload returns **503** when object storage env unset (expected) |
| Partner CMS / bookings | Out of scope |

### Blockers fixed this PR

1. **Duplicate slug on create** → API **409** with clear message (was opaque 500).  
2. **Save closed the form before mutation finished** → waits on `mutateAsync`; keeps editor open and shows **save error**.  
3. **Accidental “verified”** → confirm dialog before saving `verificationStatus=verified`.

---

## Honest verdict

AdminPlaces + `/admin/places` (+ storage signed upload) are **enough to modernize the archive one place at a time**: full CRUD, status workflow, multilingual names, rich text fields, tags/coords, and photo URLs. They are **not** a bulk editorial CMS. Next editor-quality upgrades (if needed): admin search/filter, bulk import, richer media credits, UZ body fields.

---

## How to verify

```bash
npm run seed
curl -s http://127.0.0.1:5055/api/overview   # placesTotal ≥ 50
curl -s http://127.0.0.1:5055/api/places | jq 'length'
```

Admin UI needs a Clerk user id listed in `WAYZEN_ADMIN_USER_IDS` and (for uploads) working object-storage env.
