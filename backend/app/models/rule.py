from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Rule(BaseModel):
    __tablename__ = "rules"

    step_id = Column(
        UUID(as_uuid=True),
        ForeignKey("steps.id")
    )

    condition = Column(Text)

    next_step_id = Column(UUID(as_uuid=True))

    priority = Column(Integer)

    step = relationship(
        "Step",
        back_populates="rules"
    )