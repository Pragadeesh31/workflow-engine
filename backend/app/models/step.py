from sqlalchemy import Column, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Step(BaseModel):
    __tablename__ = "steps"

    workflow_id   = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    name          = Column(String, nullable=False)
    step_type     = Column(String)          # task | approval | notification
    step_order    = Column(Integer)
    step_metadata = Column(JSON)

    workflow = relationship("Workflow", back_populates="steps")
    rules    = relationship("Rule", back_populates="step", cascade="all, delete")
