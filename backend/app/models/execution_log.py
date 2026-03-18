from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ExecutionLog(BaseModel):
    __tablename__ = "execution_logs"

    execution_id      = Column(String(36), ForeignKey("executions.id"), nullable=False)
    step_id           = Column(String(36), nullable=True)
    step_name         = Column(String)
    step_type         = Column(String)
    evaluated_rules   = Column(JSON, nullable=True)
    status            = Column(String)   # in_progress | completed | failed | pending | rejected
    selected_next_step = Column(String)
    approver_id       = Column(String, nullable=True)
    error_message     = Column(Text)
    started_at        = Column(DateTime)
    ended_at          = Column(DateTime)
    attempt           = Column(Integer, default=1)

    execution = relationship("Execution", back_populates="logs")
