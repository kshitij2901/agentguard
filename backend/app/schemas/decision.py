from typing import Optional, List
from enum import Enum
from pydantic import BaseModel
from datetime import datetime


class DecisionType(str, Enum):
    ALLOW = "ALLOW"
    SANDBOX = "SANDBOX"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    BLOCK = "BLOCK"


class RuleResult(BaseModel):
    matched: bool
    severity: Optional[str] = None
    reason: Optional[str] = None
    rule_id: Optional[str] = None


class IntentResult(BaseModel):
    score: float           # 0.0 – 1.0
    score_percent: int     # 0 – 100
    reason: str


class RiskResult(BaseModel):
    risk_score: int        # 0 – 100
    risk_level: str        # INFO | LOW | MEDIUM | HIGH | CRITICAL
    reasons: List[str]


class DecisionResult(BaseModel):
    decision: DecisionType
    reason: str


class EvaluationResponse(BaseModel):
    """Full pipeline result returned by /api/actions/evaluate and /api/actions/execute."""
    action_id: str
    task_id: str
    action_type: str
    action_target: str
    rule_result: RuleResult
    intent_result: IntentResult
    risk_result: RiskResult
    decision_result: DecisionResult
    execution_result: Optional[str] = None
    timestamp: datetime
