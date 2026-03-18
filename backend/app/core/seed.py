"""
Seed script — creates two sample workflows on first run.
Run:  python -m app.core.seed
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.init_db import init_db
from app.models.rule import Rule
from app.models.step import Step
from app.models.workflow import Workflow


def seed(db: Session) -> None:
    if db.query(Workflow.id).filter(Workflow.name == "Expense Approval").first():
        return  # already seeded

    # ── Workflow 1: Expense Approval ──────────────────────────────────────────
    expense = Workflow(
        name="Expense Approval",
        version=1,
        is_active=True,
        input_schema={
            "amount":     {"type": "number", "required": True},
            "country":    {"type": "string", "required": True},
            "department": {"type": "string", "required": False},
            "priority":   {"type": "string", "required": True, "allowed_values": ["High", "Medium", "Low"]},
        },
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    s_mgr = Step(workflow_id=expense.id, name="Manager Approval",    step_type="approval",     step_order=1, step_metadata={"assignee_email": "manager@example.com"})
    s_fin = Step(workflow_id=expense.id, name="Finance Notification", step_type="notification", step_order=2, step_metadata={"channel": "email", "to": "finance@example.com"})
    s_ceo = Step(workflow_id=expense.id, name="CEO Approval",         step_type="approval",     step_order=3, step_metadata={"assignee_email": "ceo@example.com"})
    s_rej = Step(workflow_id=expense.id, name="Task Rejection",       step_type="task",         step_order=4, step_metadata={"instructions": "Mark request as rejected"})
    db.add_all([s_mgr, s_fin, s_ceo, s_rej])
    db.commit()
    for s in [s_mgr, s_fin, s_ceo, s_rej]:
        db.refresh(s)

    expense.start_step_id = s_mgr.id
    db.add(expense)
    db.commit()

    db.add_all([
        Rule(step_id=s_mgr.id, priority=1,   condition="amount > 100 && country == 'US' && priority == 'High'", next_step_id=s_fin.id),
        Rule(step_id=s_mgr.id, priority=2,   condition="amount <= 100 || department == 'HR'",                   next_step_id=s_ceo.id),
        Rule(step_id=s_mgr.id, priority=3,   condition="priority == 'Low' && country != 'US'",                  next_step_id=s_rej.id),
        Rule(step_id=s_mgr.id, priority=999, condition="DEFAULT",                                               next_step_id=s_rej.id),
        Rule(step_id=s_fin.id, priority=1,   condition="DEFAULT",                                               next_step_id=s_ceo.id),
        Rule(step_id=s_ceo.id, priority=1,   condition="DEFAULT",                                               next_step_id=None),
        Rule(step_id=s_rej.id, priority=1,   condition="DEFAULT",                                               next_step_id=None),
    ])
    db.commit()

    # ── Workflow 2: Employee Onboarding ───────────────────────────────────────
    onboarding = Workflow(
        name="Employee Onboarding",
        version=1,
        is_active=True,
        input_schema={
            "employee_name": {"type": "string", "required": True},
            "department":    {"type": "string", "required": True},
        },
    )
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)

    s_create = Step(workflow_id=onboarding.id, name="Create Accounts", step_type="task",         step_order=1, step_metadata={"system": "IT"})
    s_notify = Step(workflow_id=onboarding.id, name="Notify Manager",  step_type="notification", step_order=2, step_metadata={"channel": "slack", "template": "New hire ready"})
    db.add_all([s_create, s_notify])
    db.commit()
    db.refresh(s_create)
    db.refresh(s_notify)

    onboarding.start_step_id = s_create.id
    db.add(onboarding)
    db.commit()

    db.add_all([
        Rule(step_id=s_create.id, priority=1, condition="DEFAULT", next_step_id=s_notify.id),
        Rule(step_id=s_notify.id, priority=1, condition="DEFAULT", next_step_id=None),
    ])
    db.commit()
    print("Seed complete — 2 workflows created.")


if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
