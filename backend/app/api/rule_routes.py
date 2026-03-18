from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.rule_engine.rule_service import RuleEngine
from app.schemas.rule_schema import RuleCreate, RuleUpdate
from app.services.rule_service import (
    create_new_rule,
    get_rule_by_id,
    list_rules,
    remove_rule,
    reorder_rules,
    update_rule_by_id,
)

router = APIRouter(tags=["Rules"])


class ReorderRequest(BaseModel):
    ordered_ids: List[str]


class ValidateConditionRequest(BaseModel):
    condition: str


@router.post("/steps/{step_id}/rules")
def create_rule(step_id: str, data: RuleCreate, db: Session = Depends(get_db)):
    return create_new_rule(db, step_id, data)


@router.get("/steps/{step_id}/rules")
def get_rules(step_id: str, db: Session = Depends(get_db)):
    return list_rules(db, step_id)


@router.post("/steps/{step_id}/rules/reorder")
def reorder_step_rules(step_id: str, payload: ReorderRequest, db: Session = Depends(get_db)):
    """Reorder rules by supplying rule IDs in the desired priority order."""
    return reorder_rules(db, step_id, payload.ordered_ids)


@router.post("/rules/validate-condition")
def validate_condition(payload: ValidateConditionRequest):
    """Validate a rule condition string without saving it."""
    error = RuleEngine.validate_condition(payload.condition)
    return {"valid": error is None, "error": error}


@router.get("/rules/{rule_id}")
def get_rule(rule_id: str, db: Session = Depends(get_db)):
    return get_rule_by_id(db, rule_id)


@router.put("/rules/{rule_id}")
def update_rule(rule_id: str, data: RuleUpdate, db: Session = Depends(get_db)):
    return update_rule_by_id(db, rule_id, data)


@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    return remove_rule(db, rule_id)
