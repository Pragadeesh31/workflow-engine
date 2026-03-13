from fastapi import FastAPI

app = FastAPI(
    title="Workflow Automation Engine",
    description="Industry level workflow automation backend",
    version="1.0"
)

@app.get("/health")
def health_check():
    return {"status": "Workflow Engine Running"}

from app.core.init_db import init_db

init_db()