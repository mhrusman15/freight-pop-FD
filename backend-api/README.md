# Freight POP – Auth API (Node.js + Express + Supabase)

Backend uses **Supabase** (PostgreSQL + Auth). All app data is stored in your Supabase project—nothing is persisted in local files or in-memory stores.

## Setup

1. **Supabase project**: Create a project at [supabase.com](https://supabase.com).

2. **Schema**: In the SQL Editor, run `supabase/migrations/001_initial.sql` (or use `supabase db push` with the CLI).

3. **Environment**: Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL` – Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (server only; never expose to the browser)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – used by `npm run db:seed` for the first super admin

4. **Install and seed**:
   ```bash
   npm install
   npm run db:seed
   ```

5. **Run the API**:
   ```bash
   npm run dev
   ```
   API runs at `http://localhost:4000` by default.

## Auth

- **Register / login** use Supabase Auth (`signInWithPassword`, etc.). The API returns Supabase `access_token` and `refresh_token` as `token` and `refreshToken` for the existing frontend.
- **Profiles** live in `public.users` (role, approval, balance, task fields).

## Endpoints

- `POST /api/auth/register` – Register (pending approval). Duplicate email returns 409.
- `POST /api/auth/login` – Login (returns Supabase tokens; only approved users succeed)
- `POST /api/auth/logout` – Invalidate server-side session (Bearer token)
- `POST /api/auth/refresh` – Refresh access token
- `GET /api/auth/me` – Current user (Bearer token)
- `POST /api/auth/change-password` – Change password (Bearer; body: `oldPassword`, `newPassword`)
- Admin routes under `/api/admin/*` – require admin JWT + permissions as before

## Frontend

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in the frontend `.env.local`. Seed the admin with `npm run db:seed`, then log in with that email/password.
