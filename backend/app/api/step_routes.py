from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.step_schema import StepCreate, StepUpdate
from app.services.step_service import (
    create_new_step,
    get_step_by_id,
    list_steps,
    remove_step,
    update_step_by_id,
)

router = APIRouter(tags=["Steps"])


@router.post("/workflows/{workflow_id}/steps")
def create_step(workflow_id: str, data: StepCreate, db: Session = Depends(get_db)):
    return create_new_step(db, workflow_id, data)


@router.get("/workflows/{workflow_id}/steps")
def get_steps(workflow_id: str, db: Session = Depends(get_db)):
    return list_steps(db, workflow_id)


@router.get("/steps/{step_id}")
def get_step(step_id: str, db: Session = Depends(get_db)):
    return get_step_by_id(db, step_id)


@router.put("/steps/{step_id}")
def update_step(step_id: str, data: StepUpdate, db: Session = Depends(get_db)):
    return update_step_by_id(db, step_id, data)


@router.delete("/steps/{step_id}")
def delete_step(step_id: str, db: Session = Depends(get_db)):
    return remove_step(db, step_id)
