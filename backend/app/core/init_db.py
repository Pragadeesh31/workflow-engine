from app.core.database import engine
from app.models.base import Base
from app.models.workflow import Workflow
from app.models.step import Step
from app.models.rule import Rule
from app.models.execution import Execution
from app.models.execution_log import ExecutionLog

def init_db():
    Base.metadata.create_all(bind=engine)