# HYPER TECH — Production Deployment Guide

Full production architecture: **Next.js 16 (App Router) + Neon PostgreSQL + Cloudinary + signed admin sessions**.

---

## 1. Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4, GSAP 3.15 | Single-route SPA on `/` with hash-based virtual router (`src/lib/router.ts`) |
| API | Next.js Route Handlers (`src/app/api/**`) | Server-only, no secrets in the browser |
| Database | Neon PostgreSQL via Prisma 6 | Schema: `prisma/schema.prisma` |
| Images | Cloudinary (folder `hypertech/**`) | Signed direct browser uploads with real progress |
| Backups | Cloudinary raw (folder `hypertech/backups`) | PDF rendered client-side, uploaded, downloaded via admin-only proxy |
| Auth | scrypt password hashes + HMAC-signed HTTP-only cookies | 8h sessions, login rate limiting (5 fails / 10 min per IP+user) |

### Data flow

1. **Boot**: `GET /api/bootstrap` hydrates the client store (`src/lib/store/db-store.ts`) with products, categories, builds, settings and the server's intelligent hero pick.
2. **Mutations**: every write goes through `src/lib/repositories.ts` → API route → Neon → response updates the client cache. The browser is never trusted (order totals are computed server-side from live DB prices).
3. **Admin auth**: `POST /api/admin/login` (rate-limited) → signed cookie → every admin route validates via `requireAdmin()`.
4. **Backups**: `POST /api/admin/backups` takes an atomic snapshot → the browser renders a premium paginated A4 report (html2canvas + jsPDF, perfect Arabic RTL) → uploads to Cloudinary raw storage (`.dat` storage extension — Cloudinary blocks direct `.pdf` CDN delivery on some accounts) → `PATCH /api/admin/backups/{id}` finalizes → downloads stream through `GET /api/admin/backups/{id}/download` (admin-only proxy, correct `application/pdf` + `.pdf` filename).
5. **Safe reset**: `POST /api/admin/reset` requires the phrase `RESET-STORE` AND a server-verified reachable latest backup (HEAD check), then transactionally wipes operational tables only — admin accounts, backup records, audit logs and store settings are preserved.

---

## 2. Environment Variables

Copy `.env.example` → `.env` and fill in:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (use the pooled `-pooler` endpoint + `&pgbouncer=true`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Signed upload signing (server-side only) |
| `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD` | One-time admin provisioning on first boot |
| `SESSION_SECRET` | `openssl rand -hex 32` — signs admin session cookies |
| `NEXT_PUBLIC_APP_URL` | Public base URL |

---

## 3. Local Development

```bash
bun install                       # postinstall runs `prisma generate`
bunx prisma db push             # sync schema to Neon
bun run seed                     # one-time catalog seed + image migration to Cloudinary + admin provisioning
bun run dev                      # start on :3000
```

The seeder is idempotent (`--force` wipes operational tables first). It uploads every referenced image to your Cloudinary account (`hypertech/store`) and seeds Neon with the Cloudinary URLs.

---

## 4. Vercel Deployment

1. Push the repository to GitHub (the `.env` file is git-ignored — secrets never leave your machine).
2. Import the repository into Vercel (Next.js preset — the `build` script `prisma generate && next build` runs as-is; `output: standalone` is auto-disabled on Vercel).
3. Add ALL environment variables from `.env.example` in **Project → Settings → Environment Variables** (Production + Preview). Use the Neon **pooled** connection string for serverless.
4. Ensure the database schema is pushed (`bunx prisma db push` against the production `DATABASE_URL`) and the initial seed ran (`bun run seed` — run once locally against the production DB, or from a one-off job).
5. Deploy. Verify:
   - `https://YOUR-DOMAIN/api/bootstrap` returns JSON.
   - Admin login at `https://YOUR-DOMAIN/#/admin` with the initial credentials → **rotate the password immediately** afterwards (update the `AdminUser` row with a new scrypt hash, or re-provision with fresh env vars).
6. No local-disk dependency exists: images live on Cloudinary, data in Neon, sessions in signed cookies.

### Security hardening already included
- HTTP-only, SameSite=Lax, Secure (in production) signed session cookies.
- scrypt password hashing with per-user salts.
- Login rate limiting (in-memory per instance; add a shared store if you scale to many instances).
- Server-side validation (zod) on every mutation; server-computed order totals.
- Cloudinary uploads only through signed params; folder whitelist (`hypertech/**`).
- Backup downloads and all admin APIs require a valid session.
- `x-content-type-options: nosniff` on file streaming.

---

## 5. Administrator Setup

- Initial account comes from `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD` env vars, provisioned automatically on the first server boot (idempotent — safe on every deploy).
- The password is stored ONLY as a scrypt hash in `AdminUser.passwordHash`.
- To rotate: change the env vars and manually delete the old `AdminUser` row (a fresh boot provisions the new one), or UPDATE the hash directly.
- Sessions expire after 8 hours; logout clears the cookie server-side and is audit-logged.

---

## 6. Backup & Reset Operations (Admin → البيانات)

1. **Create backup** → renders the full PDF report (cover, store info, products, categories, builds, orders, maintenance — Arabic RTL, repeated headers, page numbers) → uploads to Cloudinary → appears in the log with download.
2. **Reset** stays disabled until a successful backup exists and its file is verifiably reachable (server HEAD check). Type `RESET-STORE` to confirm.
3. Audit trail: every login/logout/CRUD/backup/reset action is recorded in `AuditLog`.

---

## 7. Database Schema Summary

`AdminUser`, `Product` (JSON images/specs), `Category`, `PCBuild` (JSON components/performance), `OrderRecord` (JSON items, server-computed totals), `MaintenanceRecord`, `StoreSettings` (singleton), `BackupRecord`, `AuditLog`.

Resettable by the reset flow: products, categories, builds, orders, maintenance. Preserved: admin users, backups, audit logs, settings.

---

## 8. Known Limitations

- WhatsApp commerce flow (order/maintenance confirmation) remains message-based — no WhatsApp Business API delivery confirmation.
- Product ratings are editorial data (no review system).
- Cloudinary PDF CDN delivery is blocked on the current account; downloads stream through the admin proxy instead (`.dat` storage extension).
- Neon free-tier cold starts can add ~500ms to the first request after idle.
