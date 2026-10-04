from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db():
    """Yield a database session and ensure it is closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and execute lightweight column additions if upgrading existing SQLite."""
    from app.models import task, action, decision, audit_log  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Lightweight migration for SQLite existing tables
    with engine.connect() as conn:
        try:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(audit_logs)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            cols_to_add = [
                ("entry_index", "INTEGER DEFAULT 0"),
                ("prev_hash", "TEXT"),
                ("entry_hash", "TEXT"),
                ("merkle_root", "TEXT"),
                ("anchor_tx_hash", "TEXT"),
                ("tier_analysis", "JSON"),
            ]
            for col_name, col_type in cols_to_add:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type}")
            conn.connection.commit()
        except Exception:
            pass
