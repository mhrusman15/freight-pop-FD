from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)


@app.get("/health", tags=["health"])
def health_check(db: Session = Depends(get_db)) -> dict:
    """
    Simple health endpoint that also ensures we can acquire a DB connection.
    """
    # Touch the connection once; if this fails you'll see an error in the logs.
    db.execute("SELECT 1")
    return {"status": "ok"}


@app.get("/", tags=["root"])
def read_root() -> dict:
    return {"message": "Backend is running. Define your APIs here."}

