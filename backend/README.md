# Backend (FastAPI + MySQL)

This backend is a **FastAPI** service using:

- **SQLAlchemy 2.x** for ORM
- **MySQL** as the database
- **Alembic** for schema migrations

## Project structure

- `app/main.py` – FastAPI app entrypoint
- `app/core/config.py` – settings and DB URL
- `app/db/session.py` – SQLAlchemy engine and session
- `app/models/` – ORM models
- `alembic.ini` / `alembic/` – migration configuration

## Setup

1. Create and activate a virtual environment (optional but recommended):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # on Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure the database URL via environment variable (recommended):

```bash
set DATABASE_URL=mysql+pymysql://user:password@localhost:3306/e_freight_pop
```

4. Run migrations (after you add models and revisions):

```bash
alembic upgrade head
```

5. Start the API server:

```bash
uvicorn app.main:app --reload
```

You can adjust models and migrations later as business requirements become clear.
