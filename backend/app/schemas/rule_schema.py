from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class RuleCreate(BaseModel):
    condition: str
    next_step_id: Optional[str] = None
    priority: int = 999


class RuleUpdate(BaseModel):
    condition: Optional[str] = None
    next_step_id: Optional[str] = None
    priority: Optional[int] = None
