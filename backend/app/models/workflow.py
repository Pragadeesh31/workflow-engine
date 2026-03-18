from sqlalchemy import Boolean, Column, Integer, JSON, String
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Workflow(BaseModel):
    __tablename__ = "workflows"

    name         = Column(String, nullable=False)
    version      = Column(Integer, default=1)
    is_active    = Column(Boolean, default=True)
    input_schema = Column(JSON)
    start_step_id = Column(String(36), nullable=True)

    steps = relationship("Step", back_populates="workflow", cascade="all, delete")
