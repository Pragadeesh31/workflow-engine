from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.execution import Execution
from app.models.execution_log import ExecutionLog
from app.models.rule import Rule
from app.models.step import Step
from app.rule_engine.rule_service import RuleEngine


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkflowExecutor:

    @staticmethod
    def run_to_completion_or_pause(
        db: Session,
        execution: Execution,
        *,
        max_iterations: int,
    ) -> Execution:
        """
        Run steps sequentially until:
          - An approval step is reached (pause → status = pending)
          - The workflow finishes (status = completed)
          - max_iterations exceeded (status = failed)
          - A step fails (status = failed)
          - Execution is canceled
        """
        iterations = (
            db.query(ExecutionLog.id)
            .filter(ExecutionLog.execution_id == execution.id)
            .count()
        )

        while True:
            db.refresh(execution)

            if execution.status == "canceled":
                execution.ended_at = _utcnow()
                db.add(execution)
                db.commit()
                return execution

            if not execution.current_step_id:
                execution.status = "completed"
                execution.ended_at = _utcnow()
                db.add(execution)
                db.commit()
                return execution

            iterations += 1
            if iterations > max_iterations:
                execution.status = "failed"
                execution.ended_at = _utcnow()
                db.add(execution)
                db.commit()
                return execution

            step = db.query(Step).filter(Step.id == execution.current_step_id).first()
            if not step:
                execution.status = "failed"
                execution.ended_at = _utcnow()
                db.add(execution)
                db.commit()
                return execution

            status, next_step_id = WorkflowExecutor._execute_one_step(db, execution, step)

            if status == "pending":
                return execution  # paused for approval

            execution.current_step_id = next_step_id
            if next_step_id is None:
                execution.status = "completed"
                execution.ended_at = _utcnow()
                db.add(execution)
                db.commit()
                return execution

    @staticmethod
    def _execute_one_step(
        db: Session,
        execution: Execution,
        step: Step,
    ) -> Tuple[str, Optional[str]]:
        started_at = _utcnow()

        latest_attempt = (
            db.query(ExecutionLog)
            .filter(ExecutionLog.execution_id == execution.id, ExecutionLog.step_id == step.id)
            .order_by(ExecutionLog.attempt.desc())
            .first()
        )
        attempt = (latest_attempt.attempt if latest_attempt else 0) + 1

        log = ExecutionLog(
            execution_id=execution.id,
            step_id=step.id,
            step_name=step.name,
            step_type=step.step_type,
            status="in_progress",
            started_at=started_at,
            attempt=attempt,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        try:
            if (step.step_type or "").lower() == "approval":
                # Pause and wait for external approval via POST /executions/:id/approve
                log.status = "pending"
                log.ended_at = _utcnow()
                db.add(log)
                execution.status = "pending"
                db.add(execution)
                db.commit()
                return "pending", execution.current_step_id

            # task / notification — execute (placeholder; extend here for real actions)
            WorkflowExecutor._run_step_action(step, execution.data or {})

            rules = db.query(Rule).filter(Rule.step_id == step.id).all()
            next_step_id, evaluations, had_error = RuleEngine.evaluate_rules(rules, execution.data or {})

            if next_step_id:
                next_step = db.query(Step).filter(Step.id == next_step_id).first()
                log.selected_next_step = next_step.name if next_step else next_step_id
            else:
                log.selected_next_step = "END"

            log.evaluated_rules = evaluations
            log.status = "failed" if had_error else "completed"
            log.ended_at = _utcnow()
            db.add(log)

            execution.status = "in_progress"
            db.add(execution)
            db.commit()
            return log.status, next_step_id

        except Exception as exc:
            log.status = "failed"
            log.error_message = str(exc)
            log.ended_at = _utcnow()
            db.add(log)
            execution.status = "failed"
            execution.ended_at = _utcnow()
            db.add(execution)
            db.commit()
            return "failed", None

    @staticmethod
    def _run_step_action(step: Step, data: Dict[str, Any]) -> None:
        """
        Placeholder for real step execution logic.
        Extend here to send emails, call webhooks, update databases, etc.
        """
        step_type = (step.step_type or "").lower()
        if step_type in {"task", "notification"}:
            return  # no-op in this implementation
        raise HTTPException(status_code=400, detail=f"Unknown step_type: {step.step_type}")
