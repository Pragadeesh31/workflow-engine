from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.execution_engine.workflow_executor import WorkflowExecutor
from app.models.execution import Execution
from app.models.execution_log import ExecutionLog
from app.models.rule import Rule
from app.models.workflow import Workflow
from app.rule_engine.rule_service import RuleEngine
from app.schemas.execution_schema import ExecutionApproveRequest, ExecutionStartRequest


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExecutionService:

    @staticmethod
    def start_workflow(db: Session, workflow_id: str, payload: ExecutionStartRequest) -> Execution:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        if not workflow.is_active:
            raise HTTPException(status_code=400, detail="Workflow is not active")
        if not workflow.start_step_id:
            raise HTTPException(status_code=400, detail="Workflow has no start step defined")

        execution = Execution(
            workflow_id=workflow_id,
            workflow_version=workflow.version,
            status="in_progress",
            data=payload.data,
            current_step_id=workflow.start_step_id,
            max_iterations=payload.max_iterations,
            triggered_by=payload.triggered_by,
            started_at=_utcnow(),
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        return WorkflowExecutor.run_to_completion_or_pause(
            db, execution, max_iterations=payload.max_iterations
        )

    @staticmethod
    def list_executions(db: Session):
        return db.query(Execution).order_by(Execution.created_at.desc()).all()

    @staticmethod
    def get_execution(db: Session, execution_id: str) -> Execution:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        return execution

    @staticmethod
    def get_execution_logs(db: Session, execution_id: str):
        ExecutionService.get_execution(db, execution_id)
        return (
            db.query(ExecutionLog)
            .filter(ExecutionLog.execution_id == execution_id)
            .order_by(ExecutionLog.started_at)
            .all()
        )

    @staticmethod
    def cancel_execution(db: Session, execution_id: str) -> Execution:
        execution = ExecutionService.get_execution(db, execution_id)
        if execution.status not in ("in_progress", "pending"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel execution with status '{execution.status}'"
            )
        execution.status = "canceled"
        execution.ended_at = _utcnow()
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution

    @staticmethod
    def retry_failed_step(db: Session, execution_id: str) -> Execution:
        """Re-executes only the failed step — not the whole workflow."""
        execution = ExecutionService.get_execution(db, execution_id)
        if execution.status != "failed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot retry execution with status '{execution.status}'"
            )
        execution.status = "in_progress"
        execution.ended_at = None
        db.add(execution)
        db.commit()
        db.refresh(execution)

        return WorkflowExecutor.run_to_completion_or_pause(
            db, execution, max_iterations=execution.max_iterations or 100
        )

    @staticmethod
    def approve_current_step(
        db: Session,
        execution_id: str,
        payload: ExecutionApproveRequest,
    ) -> Execution:
        execution = ExecutionService.get_execution(db, execution_id)
        if execution.status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Execution is not pending approval (status='{execution.status}')"
            )

        pending_log = (
            db.query(ExecutionLog)
            .filter(
                ExecutionLog.execution_id == execution_id,
                ExecutionLog.step_id == execution.current_step_id,
                ExecutionLog.status == "pending",
            )
            .order_by(ExecutionLog.attempt.desc())
            .first()
        )

        if pending_log:
            pending_log.status = "completed" if payload.approved else "rejected"
            pending_log.approver_id = payload.approver_id
            pending_log.ended_at = _utcnow()
            db.add(pending_log)

        if not payload.approved:
            execution.status = "failed"
            execution.ended_at = _utcnow()
            db.add(execution)
            db.commit()
            db.refresh(execution)
            return execution

        rules = db.query(Rule).filter(Rule.step_id == execution.current_step_id).all()
        next_step_id, _, _ = RuleEngine.evaluate_rules(rules, execution.data or {})

        execution.current_step_id = next_step_id
        execution.status = "in_progress"
        db.add(execution)
        db.commit()
        db.refresh(execution)

        return WorkflowExecutor.run_to_completion_or_pause(
            db, execution, max_iterations=execution.max_iterations or 100
        )
