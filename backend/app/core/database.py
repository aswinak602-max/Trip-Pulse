from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SQLite specific connect args
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_compatibility():
    """Ensures newly added columns in SQLite database exist without data loss."""
    from sqlalchemy import text
    with engine.connect() as conn:
        def add_column_if_missing(table_name, col_name, col_type):
            try:
                res = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
                existing_cols = [row[1] for row in res]
                if existing_cols and col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
            except Exception:
                pass

        # Expenses table columns
        add_column_if_missing("expenses", "split_type", "VARCHAR(50) DEFAULT 'EQUAL'")
        add_column_if_missing("expenses", "receipt_url", "VARCHAR(500)")
        add_column_if_missing("expenses", "split_details", "TEXT")
        add_column_if_missing("expenses", "notes", "TEXT")

        # Reservations table columns
        add_column_if_missing("reservations", "destination", "VARCHAR(150)")
        add_column_if_missing("reservations", "service_type", "VARCHAR(50)")
        add_column_if_missing("reservations", "provider_name", "VARCHAR(150)")
        add_column_if_missing("reservations", "official_url", "VARCHAR(500)")

        # Users table columns
        add_column_if_missing("users", "username", "VARCHAR(100)")
        add_column_if_missing("users", "avatar_url", "VARCHAR(500)")
        add_column_if_missing("users", "preferences", "TEXT")
        add_column_if_missing("users", "notification_settings", "TEXT")
        add_column_if_missing("users", "is_verified", "BOOLEAN DEFAULT 1")
        add_column_if_missing("users", "verification_token", "VARCHAR(255)")
        add_column_if_missing("users", "reset_token", "VARCHAR(255)")
        add_column_if_missing("users", "reset_token_expires", "DATETIME")
        add_column_if_missing("users", "google_id", "VARCHAR(100)")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

