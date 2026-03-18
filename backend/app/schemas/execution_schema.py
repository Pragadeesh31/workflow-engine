from __future__ import annotations
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ExecutionStartRequest(BaseModel):
    data: Dict[str, Any] = {}
    triggered_by: Optional[str] = None
    max_iterations: int = 100


class ExecutionApproveRequest(BaseModel):
    approver_id: Optional[str] = None
    approved: bool = True
