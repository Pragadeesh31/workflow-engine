from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.models.step import Step
from app.models.workflow import Workflow
from app.schemas.workflow_schema import WorkflowCreate, WorkflowUpdate


def create_new_workflow(db: Session, data: WorkflowCreate) -> Workflow:
    workflow = Workflow(**data.model_dump())
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


def list_workflows(
    db: Session,
    q: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    query = db.query(Workflow)
    if q:
        query = query.filter(Workflow.name.ilike(f"%{q}%"))
    workflows = query.offset(offset).limit(limit).all()

    result = []
    for wf in workflows:
        d = jsonable_encoder(wf)
        d["step_count"] = db.query(Step.id).filter(Step.workflow_id == wf.id).count()
        result.append(d)
    return result


def get_workflow_by_id(db: Session, workflow_id: str) -> Workflow:
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


def update_workflow_by_id(db: Session, workflow_id: str, data: WorkflowUpdate) -> Workflow:
    workflow = get_workflow_by_id(db, workflow_id)
    updates = data.model_dump(exclude_unset=True)

    # Auto-increment version on every PUT unless caller explicitly supplies one
    if "version" not in updates:
        workflow.version = (workflow.version or 1) + 1

    for field, value in updates.items():
        setattr(workflow, field, value)

    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


def remove_workflow(db: Session, workflow_id: str) -> dict:
    workflow = get_workflow_by_id(db, workflow_id)
    db.delete(workflow)
    db.commit()
    return {"deleted": workflow_id}
