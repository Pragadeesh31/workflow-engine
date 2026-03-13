from sqlalchemy import Column, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Workflow(BaseModel):
    __tablename__ = "workflows"

    name = Column(String, nullable=False)

    version = Column(Integer, default=1)

    is_active = Column(Boolean, default=False)

    input_schema = Column(JSONB)

    start_step_id = Column(UUID(as_uuid=True))

    steps = relationship(
        "Step",
        back_populates="workflow",
        cascade="all, delete"
    )