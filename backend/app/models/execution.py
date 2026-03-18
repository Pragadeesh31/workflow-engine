from sqlalchemy import Column, DateTime, Integer, JSON, String
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Execution(BaseModel):
    __tablename__ = "executions"

    workflow_id      = Column(String(36), nullable=False)
    workflow_version = Column(Integer)
    status           = Column(String)   # pending | in_progress | completed | failed | canceled
    data             = Column(JSON)
    current_step_id  = Column(String(36), nullable=True)
    retries          = Column(Integer, default=0)
    max_iterations   = Column(Integer, default=100)
    triggered_by     = Column(String)
    started_at       = Column(DateTime)
    ended_at         = Column(DateTime)

    logs = relationship("ExecutionLog", back_populates="execution")
