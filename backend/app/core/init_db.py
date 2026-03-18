from app.core.database import engine
from app.models.base import BaseModel  # noqa: F401 — registers metadata
from app.models.workflow import Workflow  # noqa: F401
from app.models.step import Step  # noqa: F401
from app.models.rule import Rule  # noqa: F401
from app.models.execution import Execution  # noqa: F401
from app.models.execution_log import ExecutionLog  # noqa: F401
from app.core.database import Base


def init_db():
    Base.metadata.create_all(bind=engine)
