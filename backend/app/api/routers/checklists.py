from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.deps import get_current_user
from app.models.user import User
from app.models.trip import Trip, ChecklistItem
from app.schemas.trip import ChecklistItemCreate

router = APIRouter(prefix="/checklists", tags=["Trip Checklists"])

@router.post("", response_model=None)
def add_checklist_item(
    item_in: ChecklistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == item_in.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    new_item = ChecklistItem(
        trip_id=item_in.trip_id,
        category=item_in.category,
        item_text=item_in.item_text,
        is_completed=item_in.is_completed,
        assigned_to=item_in.assigned_to or current_user.name
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return success_response(
        data={"id": new_item.id, "item_text": new_item.item_text},
        message="Checklist item added",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{trip_id}", response_model=None)
def get_trip_checklists(trip_id: int, db: Session = Depends(get_db)):
    items = db.query(ChecklistItem).filter(ChecklistItem.trip_id == trip_id).order_by(ChecklistItem.created_at).all()
    results = [{
        "id": c.id,
        "trip_id": c.trip_id,
        "category": c.category,
        "item_text": c.item_text,
        "is_completed": c.is_completed,
        "assigned_to": c.assigned_to,
        "created_at": c.created_at.isoformat()
    } for c in items]
    return success_response(data=results, message="Checklists retrieved")

@router.put("/{item_id}/toggle", response_model=None)
def toggle_checklist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        return error_response(message="Checklist item not found", status_code=status.HTTP_404_NOT_FOUND)
    item.is_completed = not item.is_completed
    db.commit()
    return success_response(data={"id": item.id, "is_completed": item.is_completed}, message="Checklist item toggled")

@router.delete("/{item_id}", response_model=None)
def delete_checklist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        return error_response(message="Checklist item not found", status_code=status.HTTP_404_NOT_FOUND)
    db.delete(item)
    db.commit()
    return success_response(data={"id": item_id}, message="Checklist item deleted")
