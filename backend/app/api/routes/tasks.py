from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.task import TaskCreate, TaskResponse
from app.api.deps import get_intent_manager
from app.services.intent_manager import IntentManager

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
@router.post("/", response_model=TaskResponse, status_code=201, include_in_schema=False)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    intent_manager: IntentManager = Depends(get_intent_manager),
):
    """Create a new task / intent context for the agent."""
    task = intent_manager.create_task(
        db=db,
        goal=task_in.goal,
        allowed_paths=task_in.allowed_paths,
        sensitive_access_allowed=task_in.sensitive_access_allowed,
        network_access_allowed=task_in.network_access_allowed,
        destructive_actions_allowed=task_in.destructive_actions_allowed,
        git_push_allowed=task_in.git_push_allowed,
    )
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    intent_manager: IntentManager = Depends(get_intent_manager),
):
    """Retrieve a task by ID."""
    task = intent_manager.get_task(task_id, db)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    return task


@router.get("", response_model=list[TaskResponse])
@router.get("/", response_model=list[TaskResponse], include_in_schema=False)
def list_tasks(
    db: Session = Depends(get_db),
    intent_manager: IntentManager = Depends(get_intent_manager),
):
    """List all active tasks."""
    return intent_manager.list_tasks(db)
