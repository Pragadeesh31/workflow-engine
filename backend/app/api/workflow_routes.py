from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.execution_schema import ExecutionStartRequest
from app.schemas.workflow_schema import WorkflowCreate, WorkflowUpdate
from app.services.execution_service import ExecutionService
from app.services.workflow_service import (
    create_new_workflow,
    list_workflows,
    get_workflow_by_id,
    update_workflow_by_id,
    remove_workflow,
)

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.post("/")
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db)):
    return create_new_workflow(db, data)


@router.get("/")
def get_workflows(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    return list_workflows(db, q=q, offset=offset, limit=limit)


@router.get("/{workflow_id}")
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    return get_workflow_by_id(db, workflow_id)


@router.put("/{workflow_id}")
def update_workflow(workflow_id: str, data: WorkflowUpdate, db: Session = Depends(get_db)):
    return update_workflow_by_id(db, workflow_id, data)


@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    return remove_workflow(db, workflow_id)


@router.post("/{workflow_id}/execute")
def execute_workflow(workflow_id: str, payload: ExecutionStartRequest, db: Session = Depends(get_db)):
    return ExecutionService.start_workflow(db, workflow_id, payload)
