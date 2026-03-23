# Freight POP – Auth API (Node.js + PostgreSQL)

Backend for the authentication flow with admin approval. Uses JWT and PostgreSQL.

## Persistence (users visible in admin panel)

**Use PostgreSQL so registered users persist.** If you run without a database (`USE_MEMORY_STORE=1` or empty `DATABASE_URL`), user accounts are stored only in memory and are **lost when the server restarts**. To keep all users and see them in the admin panel, set `DATABASE_URL` and run `npm run db:init` then `npm run db:seed`.

## Setup

1. **PostgreSQL**: Create a database (e.g. `freight_pop`).

2. **Environment**: Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` – e.g. `postgresql://postgres:postgres@localhost:5432/freight_pop` (required for persistent users)
   - `JWT_SECRET` – strong secret for signing JWTs
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – used by `npm run db:seed` to create the first admin

3. **Install and init DB**:
   ```bash
   npm install
   npm run db:init
   npm run db:seed
   ```

4. **Run the API**:
   ```bash
   npm run dev
   ```
   API runs at `http://localhost:4000` by default.

## Endpoints

- `POST /api/auth/register` – Register (status = pending). Duplicate email returns 409.
- `POST /api/auth/login` – Login (returns JWT; only approved users succeed)
- `GET /api/auth/me` – Current user (Bearer token required)
- `POST /api/auth/change-password` – Change password (Bearer token; body: `oldPassword`, `newPassword`)
- `GET /api/admin/pending?page=1&limit=10` – Pending users (admin, paginated)
- `GET /api/admin/users?status=approved|pending|rejected&page=1&limit=10` – Users list (admin)
- `PATCH /api/admin/users/:id/approve` – Approve user (admin)
- `PATCH /api/admin/users/:id/reject` – Reject user (admin; user is not deleted)

## Frontend

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in the frontend `.env.local` and run the Next.js app. Admin login uses the same JWT; create the admin with `npm run db:seed` then log in with that email/password.
