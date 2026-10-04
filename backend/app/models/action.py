import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from app.database.database import Base


class Action(Base):
    """An action proposed by the AI agent, intercepted by AgentGuard."""

    __tablename__ = "actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)

    # Action type: FILE_READ, FILE_WRITE, COMMAND_EXECUTE, NETWORK_REQUEST, GIT_OPERATION
    action_type = Column(String, nullable=False)
    target = Column(String, nullable=False)
    description = Column(String, nullable=True)
    extra_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
