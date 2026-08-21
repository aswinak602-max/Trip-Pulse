from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from collections import defaultdict

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.deps import get_current_user
from app.models.user import User
from app.models.trip import Trip, Expense, TripMember
from app.schemas.trip import ExpenseCreate

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("", response_model=None)
def add_expense(
    exp_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == exp_in.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    new_exp = Expense(
        trip_id=exp_in.trip_id,
        user_id=current_user.id,
        category=exp_in.category,
        amount=exp_in.amount,
        paid_by=exp_in.paid_by,
        date=exp_in.date,
        description=exp_in.description,
        split_type=exp_in.split_type or "EQUAL",
        notes=exp_in.notes,
        receipt_url=exp_in.receipt_url,
        split_details=exp_in.split_details
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)

    return success_response(
        data={"id": new_exp.id, "amount": new_exp.amount},
        message="Expense recorded successfully",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{trip_id}", response_model=None)
def get_trip_expenses(
    trip_id: int,
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).order_by(Expense.created_at.desc()).all()
    
    total_actual = sum(e.amount for e in expenses)
    members_count = max(1, trip.members_count)
    cost_per_person = round(total_actual / members_count, 2)
    remaining_budget = round(trip.budget - total_actual, 2)

    # Category breakdown
    categories = {}
    for e in expenses:
        categories[e.category] = round(categories.get(e.category, 0.0) + e.amount, 2)

    items_data = [{
        "id": e.id,
        "trip_id": e.trip_id,
        "user_id": e.user_id,
        "category": e.category,
        "amount": e.amount,
        "paid_by": e.paid_by,
        "date": e.date,
        "description": e.description,
        "split_type": e.split_type or "EQUAL",
        "notes": e.notes,
        "receipt_url": e.receipt_url,
        "created_at": e.created_at.isoformat()
    } for e in expenses]

    return success_response(
        data={
            "trip_id": trip.id,
            "total_budget": trip.budget,
            "total_estimated": trip.estimated_cost,
            "total_actual": round(total_actual, 2),
            "remaining_budget": remaining_budget,
            "cost_per_person": cost_per_person,
            "members_count": members_count,
            "by_category": categories,
            "expenses": items_data
        },
        message="Expenses and group split analysis retrieved"
    )

@router.get("/{trip_id}/settlement", response_model=None)
def get_debt_settlement(
    trip_id: int,
    db: Session = Depends(get_db)
):
    """
    Computes net member balances and uses bipartite debt graph reduction
    (Splitwise-style minimum transaction solver) to generate who owes whom.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    members = db.query(TripMember).filter(TripMember.trip_id == trip_id).all()
    member_names = [m.name for m in members] if members else ["Aswin", "Rahul", "Priya", "Sneha"]
    n_members = max(1, len(member_names))

    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()
    
    # Net balance tracker: Positive means owed money, Negative means owes money
    paid_amounts = defaultdict(float)
    owed_amounts = defaultdict(float)

    for exp in expenses:
        payer = exp.paid_by.strip()
        amt = exp.amount
        paid_amounts[payer] += amt
        
        # Check custom split or equal split
        if exp.split_details:
            try:
                splits = json.loads(exp.split_details)
                for person, share in splits.items():
                    owed_amounts[person] += float(share)
                continue
            except Exception:
                pass

        # Default equal split across all active trip members
        share_per_head = amt / n_members
        for m in member_names:
            owed_amounts[m] += share_per_head

    # Calculate net balance for all participating members
    all_people = set(list(paid_amounts.keys()) + list(owed_amounts.keys()) + member_names)
    net_balances = {}
    for person in all_people:
        paid = round(paid_amounts.get(person, 0.0), 2)
        owed = round(owed_amounts.get(person, 0.0), 2)
        net = round(paid - owed, 2)
        net_balances[person] = {
            "name": person,
            "total_paid": paid,
            "total_share": owed,
            "net_balance": net,
            "status": "Owed Money" if net > 0 else ("Owes Money" if net < 0 else "Settled")
        }

    # Minimum transaction simplification algorithm
    debtors = []   # (name, amount_owed)
    creditors = [] # (name, amount_to_receive)

    for person, info in net_balances.items():
        balance = info["net_balance"]
        if balance < -0.01:
            debtors.append([person, abs(balance)])
        elif balance > 0.01:
            creditors.append([person, balance])

    # Sort largest debtors and creditors first for minimal transaction count
    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)

    transactions = []
    d_idx = 0
    c_idx = 0

    while d_idx < len(debtors) and c_idx < len(creditors):
        debtor_name, debt_amt = debtors[d_idx]
        creditor_name, cred_amt = creditors[c_idx]

        settle_amt = round(min(debt_amt, cred_amt), 2)
        if settle_amt > 0.01:
            transactions.append({
                "from": debtor_name,
                "to": creditor_name,
                "amount": settle_amt,
                "note": f"{debtor_name} pays ₹{settle_amt:,.2f} to {creditor_name}"
            })

        debtors[d_idx][1] -= settle_amt
        creditors[c_idx][1] -= settle_amt

        if debtors[d_idx][1] <= 0.01:
            d_idx += 1
        if creditors[c_idx][1] <= 0.01:
            c_idx += 1

    return success_response(
        data={
            "trip_id": trip_id,
            "member_balances": list(net_balances.values()),
            "simplified_transactions": transactions,
            "total_transactions_count": len(transactions),
            "total_group_spent": round(sum(e.amount for e in expenses), 2)
        },
        message="Group debt simplification matrix and settlements generated"
    )

@router.delete("/{expense_id}", response_model=None)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        return error_response(message="Expense not found", status_code=status.HTTP_404_NOT_FOUND)

    db.delete(exp)
    db.commit()
    return success_response(data={"id": expense_id}, message="Expense deleted")
