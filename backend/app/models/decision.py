import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Integer, JSON, ForeignKey
from app.database.database import Base


class Decision(Base):
    """The security decision produced by AgentGuard for a given action."""

    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action_id = Column(String, ForeignKey("actions.id"), nullable=False)
    task_id = Column(String, nullable=False)

    # ALLOW | SANDBOX | APPROVAL_REQUIRED | BLOCK
    decision = Column(String, nullable=False)
    reason = Column(String, nullable=True)

    # Serialised results from each pipeline stage
    rule_result = Column(JSON, nullable=True)
    intent_score = Column(Float, nullable=True)
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String, nullable=True)

    execution_result = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
