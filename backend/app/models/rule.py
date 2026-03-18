from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Rule(BaseModel):
    __tablename__ = "rules"

    step_id      = Column(String(36), ForeignKey("steps.id"), nullable=False)
    condition    = Column(Text)
    next_step_id = Column(String(36), nullable=True)   # null = workflow ends
    priority     = Column(Integer)

    step = relationship("Step", back_populates="rules")
