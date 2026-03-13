from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Execution(BaseModel):
    __tablename__ = "executions"

    workflow_id = Column(UUID(as_uuid=True))

    workflow_version = Column(Integer)

    status = Column(String)

    data = Column(JSONB)

    current_step_id = Column(UUID(as_uuid=True))

    retries = Column(Integer, default=0)

    triggered_by = Column(String)

    started_at = Column(DateTime)

    ended_at = Column(DateTime)

    logs = relationship(
        "ExecutionLog",
        back_populates="execution"
    )