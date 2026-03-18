# Workflow Engine

A full-stack workflow automation system — design workflows, define branching rules, execute processes, track every step.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database | SQLite (default, zero-config) or PostgreSQL |
| Frontend | React 18, Vite, Tailwind CSS |

---

## Quick Start (SQLite — no database needed)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.core.seed          # seed sample workflows
uvicorn app.main:app --reload --port 8000
```

API is now live at http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Quick Start (Docker Compose — PostgreSQL)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend:  http://localhost:8000  
- Postgres: localhost:5432

---

## Using PostgreSQL manually

Set `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/workflow_engine
```

Then run the backend as above.

---

## API Reference

### Workflows
| Method | Endpoint | Description |
|---|---|---|
| POST | /workflows | Create workflow |
| GET | /workflows | List (search, pagination) |
| GET | /workflows/:id | Get with steps & rules |
| PUT | /workflows/:id | Update (auto-increments version) |
| DELETE | /workflows/:id | Delete |
| POST | /workflows/:id/execute | Start execution |

### Steps
| Method | Endpoint | Description |
|---|---|---|
| POST | /workflows/:id/steps | Add step |
| GET | /workflows/:id/steps | List steps |
| PUT | /steps/:id | Update step |
| DELETE | /steps/:id | Delete step |

### Rules
| Method | Endpoint | Description |
|---|---|---|
| POST | /steps/:id/rules | Add rule |
| GET | /steps/:id/rules | List rules |
| POST | /steps/:id/rules/reorder | Reorder by priority (drag-drop) |
| PUT | /rules/:id | Update rule |
| DELETE | /rules/:id | Delete rule |
| POST | /rules/validate-condition | Validate condition syntax |

### Executions
| Method | Endpoint | Description |
|---|---|---|
| GET | /executions | List all (audit log) |
| GET | /executions/:id | Get status & data |
| GET | /executions/:id/logs | Step-by-step logs |
| POST | /executions/:id/approve | Approve/reject pending step |
| POST | /executions/:id/cancel | Cancel |
| POST | /executions/:id/retry | Retry failed step only |

---

## Rule Engine

Rules are evaluated in **priority order** (1 = highest). The first matching rule wins.

### Supported operators
```
==   !=   <   >   <=   >=
&&   ||
```

### String functions
```
contains(field, "value")       # field contains substring
startsWith(field, "prefix")    # field starts with prefix
endsWith(field, "suffix")      # field ends with suffix
```

### Special keyword
```
DEFAULT   # always matches — use as the last/fallback rule
```

### Example rules
```
amount > 100 && country == 'US' && priority == 'High'
amount <= 100 || department == 'HR'
contains(country, 'US')
startsWith(priority, 'Hi')
DEFAULT
```

---

## Sample Workflows (seeded automatically)

### 1. Expense Approval
Input: `amount`, `country`, `department`, `priority`

Steps: Manager Approval → Finance Notification → CEO Approval → Task Rejection

Rules on Manager Approval:
| Priority | Condition | Next Step |
|---|---|---|
| 1 | amount > 100 && country == 'US' && priority == 'High' | Finance Notification |
| 2 | amount <= 100 \|\| department == 'HR' | CEO Approval |
| 3 | priority == 'Low' && country != 'US' | Task Rejection |
| 999 | DEFAULT | Task Rejection |

### 2. Employee Onboarding
Input: `employee_name`, `department`

Steps: Create Accounts → Notify Manager

---

## Sample Execution

```bash
curl -X POST http://localhost:8000/workflows/{id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"amount": 250, "country": "US", "department": "Finance", "priority": "High"},
    "triggered_by": "user@example.com"
  }'
```

Expected result: execution pauses at **Manager Approval** (approval step). Approve it:

```bash
curl -X POST http://localhost:8000/executions/{execution_id}/approve \
  -H "Content-Type: application/json" \
  -d '{"approver_id": "manager@example.com", "approved": true}'
```

Workflow then runs: Finance Notification → CEO Approval (pauses again).

---

## Project Structure

```
backend/
  app/
    api/              # FastAPI route handlers
    core/             # DB setup, config, seeder
    execution_engine/ # WorkflowExecutor (step runner, loop protection)
    models/           # SQLAlchemy ORM models
    rule_engine/      # RuleEngine (eval, string helpers, validator)
    schemas/          # Pydantic request/response schemas
    services/         # Business logic layer

frontend/
  src/
    api/              # API client (all endpoints)
    components/       # Form, Modal, StatusBadge
    pages/
      WorkflowsPage   # List + create/edit + execute
      StepsPage       # Step editor + rule editor (DnD reorder, live validation)
      ExecutionsPage  # Audit log + approve/retry/cancel
```
