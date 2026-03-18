from __future__ import annotations
from typing import Any, Dict, Optional
from pydantic import BaseModel


class WorkflowCreate(BaseModel):
    name: str
    version: int = 1
    is_active: bool = True
    input_schema: Optional[Dict[str, Any]] = None
    start_step_id: Optional[str] = None


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[int] = None
    is_active: Optional[bool] = None
    input_schema: Optional[Dict[str, Any]] = None
    start_step_id: Optional[str] = None
