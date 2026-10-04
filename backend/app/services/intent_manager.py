from typing import Optional
from sqlalchemy.orm import Session
from app.models.task import Task
import uuid


class IntentManager:
    """
    Manages task / intent contexts.
    Thin service layer over the Task ORM model.
    """

    def create_task(
        self,
        db: Session,
        goal: str,
        allowed_paths: list,
        sensitive_access_allowed: bool = False,
        network_access_allowed: bool = False,
        destructive_actions_allowed: bool = False,
        git_push_allowed: bool = False,
    ) -> Task:
        task = Task(
            id=str(uuid.uuid4()),
            goal=goal,
            allowed_paths=allowed_paths,
            sensitive_access_allowed=sensitive_access_allowed,
            network_access_allowed=network_access_allowed,
            destructive_actions_allowed=destructive_actions_allowed,
            git_push_allowed=git_push_allowed,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def get_task(self, task_id: str, db: Session) -> Optional[Task]:
        return (
            db.query(Task)
            .filter(Task.id == task_id, Task.is_active == True)  # noqa: E712
            .first()
        )

    def list_tasks(self, db: Session, limit: int = 50) -> list:
        return (
            db.query(Task)
            .filter(Task.is_active == True)  # noqa: E712
            .order_by(Task.created_at.desc())
            .limit(limit)
            .all()
        )
