from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.api_route("", methods=["GET", "HEAD"])
def check_health(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return success_response(
            data={
                "status": "online",
                "project": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "database": "connected (SQLite)",
                "environment": "development"
            },
            message="FastAPI backend and SQLite database are operational"
        )

    except Exception as e:
        return error_response(
            message=f"Database connection failed: {str(e)}",
            status_code=500
        )
