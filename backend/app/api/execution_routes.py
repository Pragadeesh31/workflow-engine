from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.execution_schema import ExecutionApproveRequest
from app.services.execution_service import ExecutionService

router = APIRouter(prefix="/executions", tags=["Executions"])


@router.get("/")
def list_executions(db: Session = Depends(get_db)):
    return ExecutionService.list_executions(db)


@router.get("/{execution_id}")
def get_execution(execution_id: str, db: Session = Depends(get_db)):
    return ExecutionService.get_execution(db, execution_id)


@router.get("/{execution_id}/logs")
def get_execution_logs(execution_id: str, db: Session = Depends(get_db)):
    return ExecutionService.get_execution_logs(db, execution_id)


@router.post("/{execution_id}/approve")
def approve_step(execution_id: str, payload: ExecutionApproveRequest, db: Session = Depends(get_db)):
    return ExecutionService.approve_current_step(db, execution_id, payload)


@router.post("/{execution_id}/cancel")
def cancel_execution(execution_id: str, db: Session = Depends(get_db)):
    return ExecutionService.cancel_execution(db, execution_id)


@router.post("/{execution_id}/retry")
def retry_execution(execution_id: str, db: Session = Depends(get_db)):
    return ExecutionService.retry_failed_step(db, execution_id)
