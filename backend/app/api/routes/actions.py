from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.action import ActionCreate
from app.schemas.decision import EvaluationResponse
from app.api.deps import get_interceptor
from app.services.action_interceptor import ActionInterceptor

router = APIRouter(prefix="/api/actions", tags=["actions"])


def _build_response(result: dict) -> dict:
    """Normalise the interceptor result to match EvaluationResponse."""
    return {
        **result,
        "timestamp": datetime.now(timezone.utc),
    }


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_action(
    action_in: ActionCreate,
    db: Session = Depends(get_db),
    interceptor: ActionInterceptor = Depends(get_interceptor),
):
    """
    Evaluate an action through the full security pipeline.
    Does NOT execute the action — returns the decision only.
    """
    result = interceptor.intercept(
        db=db,
        task_id=action_in.task_id,
        action_type=action_in.type.value,
        target=action_in.target,
        description=action_in.description,
        execute=False,
        metadata=action_in.metadata,
    )
    if result.get("error") and result.get("decision_result", {}).get("decision") == "BLOCK":
        # Task not found — still return a 200 with a BLOCK decision so the
        # frontend can display it; only raise 404 if caller needs strict semantics.
        pass
    return _build_response(result)


@router.post("/execute", response_model=EvaluationResponse)
def execute_action(
    action_in: ActionCreate,
    db: Session = Depends(get_db),
    interceptor: ActionInterceptor = Depends(get_interceptor),
):
    """
    Evaluate AND execute an action (via MockExecutionGateway in Phase 1).
    The execution result is included in the response.
    """
    result = interceptor.intercept(
        db=db,
        task_id=action_in.task_id,
        action_type=action_in.type.value,
        target=action_in.target,
        description=action_in.description,
        execute=True,
        metadata=action_in.metadata,
    )
    return _build_response(result)
