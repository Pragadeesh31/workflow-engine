from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.init_db import init_db
from app.api.workflow_routes import router as workflow_router
from app.api.step_routes import router as step_router
from app.api.rule_routes import router as rule_router
from app.api.execution_routes import router as execution_router

app = FastAPI(title="Workflow Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(workflow_router)
app.include_router(step_router)
app.include_router(rule_router)
app.include_router(execution_router)


@app.get("/health")
def health_check():
    return {"status": "Workflow Engine Running"}
