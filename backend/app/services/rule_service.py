from __future__ import annotations

from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.rule import Rule
from app.schemas.rule_schema import RuleCreate, RuleUpdate


def create_new_rule(db: Session, step_id: str, data: RuleCreate) -> Rule:
    rule = Rule(step_id=step_id, **data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def list_rules(db: Session, step_id: str):
    return (
        db.query(Rule)
        .filter(Rule.step_id == step_id)
        .order_by(Rule.priority)
        .all()
    )


def get_rule_by_id(db: Session, rule_id: str) -> Rule:
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


def update_rule_by_id(db: Session, rule_id: str, data: RuleUpdate) -> Rule:
    rule = get_rule_by_id(db, rule_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def remove_rule(db: Session, rule_id: str) -> dict:
    rule = get_rule_by_id(db, rule_id)
    db.delete(rule)
    db.commit()
    return {"deleted": rule_id}


def reorder_rules(db: Session, step_id: str, ordered_ids: List[str]) -> list:
    """
    Accept rule IDs in desired priority order (index 0 = priority 1).
    Reassigns consecutive priorities and returns the updated rule list.
    """
    rules_by_id = {
        r.id: r
        for r in db.query(Rule).filter(Rule.step_id == step_id).all()
    }
    for priority, rule_id in enumerate(ordered_ids, start=1):
        rule = rules_by_id.get(rule_id)
        if rule:
            rule.priority = priority
            db.add(rule)
    db.commit()
    return list_rules(db, step_id)
