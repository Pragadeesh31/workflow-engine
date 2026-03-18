from __future__ import annotations
from typing import Any, Dict, Optional
from pydantic import BaseModel


class StepCreate(BaseModel):
    name: str
    step_type: Optional[str] = None
    step_order: Optional[int] = None
    step_metadata: Optional[Dict[str, Any]] = None


class StepUpdate(BaseModel):
    name: Optional[str] = None
    step_type: Optional[str] = None
    step_order: Optional[int] = None
    step_metadata: Optional[Dict[str, Any]] = None
