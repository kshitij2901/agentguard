import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from app.database.database import Base


class Task(Base):
    """Represents a user-defined task / intent context."""

    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    goal = Column(String, nullable=False)

    # Allowed file-system paths for this task
    allowed_paths = Column(JSON, default=list)

    # Explicit permission flags (default-deny)
    sensitive_access_allowed = Column(Boolean, default=False, nullable=False)
    network_access_allowed = Column(Boolean, default=False, nullable=False)
    destructive_actions_allowed = Column(Boolean, default=False, nullable=False)
    git_push_allowed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True, nullable=False)
