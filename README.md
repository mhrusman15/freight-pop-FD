# E‑Freight POP – Full Stack Setup

This project has:

- **Frontend**: Next.js (App Router) with Tailwind CSS (`frontend/`)
- **Backend**: FastAPI + SQLAlchemy + Alembic with MySQL (`backend/`)

Below are the main commands you’ll use to run everything.

---

## Prerequisites

- **Node.js** (LTS) and **npm**
- **Python 3.10+**
- **MySQL** server (local or remote)

---

## 1. Frontend – Next.js + Tailwind

### Install dependencies (first time)

```bash
cd frontend
npm install
```

### Run dev server

```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## 2. Backend – FastAPI + MySQL + Alembic

All backend commands are run from the `backend/` directory.

### 2.1 Create and activate a Python virtual environment

From the project root:

```bash
cd backend
python -m venv .venv
```

#### On Windows (PowerShell)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

#### On Windows (Cmd)

```cmd
cd backend
.venv\Scripts\activate.bat
```

#### On macOS / Linux

```bash
cd backend
source .venv/bin/activate
```

When the venv is active you’ll see `(.venv)` at the start of your shell prompt.

### 2.2 Install backend dependencies

With the virtual environment **activated**:

```bash
cd backend
pip install -r requirements.txt
```

### 2.3 Configure the database URL

Set the `DATABASE_URL` environment variable to point to your MySQL instance.
Example connection string:

```text
mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE_NAME
```

#### Windows (PowerShell)

```powershell
cd backend
$env:DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/e_freight_pop"
```

#### Windows (Cmd)

```cmd
cd backend
set DATABASE_URL=mysql+pymysql://user:password@localhost:3306/e_freight_pop
```

#### macOS / Linux (bash/zsh)

```bash
cd backend
export DATABASE_URL="mysql+pymysql://user:password@localhost:3306/e_freight_pop"
```

You can also create a `.env` file in `backend/` and put:

```text
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/e_freight_pop
```

---

## 3. Alembic migrations (database schema)

Alembic is already configured to use `DATABASE_URL` and the SQLAlchemy `Base` metadata.
You’ll typically follow this flow:

1. Define or update SQLAlchemy models under `backend/app/models/`.
2. Make sure models are imported so `Base.metadata` can see them.
3. Autogenerate a migration.
4. Apply the migration.

All commands below are run **from `backend/` with the venv active**.

### 3.1 Create a new migration

```bash
cd backend
alembic revision -m "describe change" --autogenerate
```

This creates a new file under `backend/alembic/versions/`.

### 3.2 Apply migrations (upgrade)

```bash
cd backend
alembic upgrade head
```

This upgrades the database to the latest version.

### 3.3 Roll back last migration (optional)

```bash
cd backend
alembic downgrade -1
```

---

## 4. Run the servers

### Frontend dev server

```bash
cd frontend
npm run dev
```

This will start the frontend at `http://localhost:3000`.

### Backend dev server (FastAPI)

With the **venv active** and `DATABASE_URL` set:

```bash
cd backend
uvicorn app.main:app --reload
```

This will start the API at `http://localhost:8000`.

You can then open:

- `http://localhost:8000/docs` for the interactive Swagger UI
- `http://localhost:8000/health` to check DB connectivity

---

## 5. Quick start checklist

1. **Frontend**
   - `cd frontend`
   - `npm install` (first time)
   - `npm run dev`
2. **Backend**
   - `cd backend`
   - `python -m venv .venv` (first time)
   - Activate venv (see section 2.1)
   - `pip install -r requirements.txt` (first time)
   - Set `DATABASE_URL`
   - `alembic upgrade head` (after you have at least one migration)
   - `uvicorn app.main:app --reload`

Once both servers are running, you’ll have:

- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:8000`



- Database pooling ---- must
