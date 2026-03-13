from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Step(BaseModel):
    __tablename__ = "steps"

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id")
    )

    name = Column(String, nullable=False)

    step_type = Column(String)

    step_order = Column(Integer)

    step_metadata = Column(JSONB)

    workflow = relationship(
        "Workflow",
        back_populates="steps"
    )

    rules = relationship(
        "Rule",
        back_populates="step",
        cascade="all, delete"
    )