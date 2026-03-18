from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.step import Step
from app.schemas.step_schema import StepCreate, StepUpdate


def create_new_step(db: Session, workflow_id: str, data: StepCreate) -> Step:
    step = Step(workflow_id=workflow_id, **data.model_dump())
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def list_steps(db: Session, workflow_id: str):
    return (
        db.query(Step)
        .filter(Step.workflow_id == workflow_id)
        .order_by(Step.step_order)
        .all()
    )


def get_step_by_id(db: Session, step_id: str) -> Step:
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    return step


def update_step_by_id(db: Session, step_id: str, data: StepUpdate) -> Step:
    step = get_step_by_id(db, step_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(step, field, value)
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def remove_step(db: Session, step_id: str) -> dict:
    step = get_step_by_id(db, step_id)
    db.delete(step)
    db.commit()
    return {"deleted": step_id}
