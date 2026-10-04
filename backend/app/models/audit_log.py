import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, JSON
from app.database.database import Base


class AuditLog(Base):
    """Immutable audit trail — one row per evaluated action."""

    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    task_id = Column(String, nullable=False)
    task_goal = Column(String, nullable=True)
    action_id = Column(String, nullable=True)

    # Action details
    action_type = Column(String, nullable=True)
    action_target = Column(String, nullable=True)
    action_description = Column(String, nullable=True)

    # Rule engine output
    rule_matched = Column(Boolean, nullable=True)
    rule_severity = Column(String, nullable=True)
    rule_id = Column(String, nullable=True)

    # Intent engine output
    intent_score = Column(Integer, nullable=True)   # 0-100 percent
    intent_reason = Column(String, nullable=True)

    # Risk engine output
    risk_score = Column(Integer, nullable=True)     # 0-100
    risk_level = Column(String, nullable=True)
    risk_reasons = Column(JSON, default=list, nullable=True)

    # Policy decision
    decision = Column(String, nullable=False)
    reason = Column(String, nullable=True)

    # Execution gateway output
    execution_result = Column(String, nullable=True)

    # Web3 Cryptographic Proof-of-Action & Multi-Tier Analysis
    entry_index = Column(Integer, nullable=True, default=0)
    prev_hash = Column(String, nullable=True)
    entry_hash = Column(String, nullable=True)
    merkle_root = Column(String, nullable=True)
    anchor_tx_hash = Column(String, nullable=True)
    tier_analysis = Column(JSON, default=dict, nullable=True)
