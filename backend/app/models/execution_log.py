from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ExecutionLog(BaseModel):
    __tablename__ = "execution_logs"

    execution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("executions.id")
    )

    step_name = Column(String)

    step_type = Column(String)

    status = Column(String)

    selected_next_step = Column(String)

    error_message = Column(Text)

    started_at = Column(DateTime)

    ended_at = Column(DateTime)

    execution = relationship(
        "Execution",
        back_populates="logs"
    )