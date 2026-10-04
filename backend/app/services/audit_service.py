from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.models.audit_log import AuditLog


class AuditService:
    """
    Writes and queries the immutable audit log.
    Every evaluated action produces exactly one audit entry.
    """

    def log(
        self,
        db: Session,
        task_id: str,
        action_id: str,
        action_type: str,
        action_target: str,
        action_description: Optional[str],
        rule_result: Dict[str, Any],
        intent_result: Dict[str, Any],
        risk_result: Dict[str, Any],
        decision_result: Dict[str, Any],
        execution_result: Optional[str] = None,
        task_goal: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            task_id=task_id,
            task_goal=task_goal,
            action_id=action_id,
            action_type=action_type,
            action_target=action_target,
            action_description=action_description,
            rule_matched=rule_result.get("matched", False),
            rule_severity=rule_result.get("severity"),
            rule_id=rule_result.get("rule_id"),
            intent_score=intent_result.get("score_percent", 0),
            intent_reason=intent_result.get("reason"),
            risk_score=risk_result.get("risk_score", 0),
            risk_level=risk_result.get("risk_level"),
            risk_reasons=risk_result.get("reasons", []),
            decision=decision_result.get("decision", "BLOCK"),
            reason=decision_result.get("reason"),
            execution_result=execution_result,
        )
        db.add(entry)
        return entry

    def get_logs(
        self,
        db: Session,
        task_id: Optional[str] = None,
        limit: int = 200,
    ) -> List[AuditLog]:
        q = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
        if task_id:
            q = q.filter(AuditLog.task_id == task_id)
        return q.limit(limit).all()

    def get_stats(self, db: Session) -> Dict[str, Any]:
        total = db.query(func.count(AuditLog.id)).scalar() or 0
        allowed = (
            db.query(func.count(AuditLog.id))
            .filter(AuditLog.decision == "ALLOW")
            .scalar() or 0
        )
        sandboxed = (
            db.query(func.count(AuditLog.id))
            .filter(AuditLog.decision == "SANDBOX")
            .scalar() or 0
        )
        approval_required = (
            db.query(func.count(AuditLog.id))
            .filter(AuditLog.decision == "APPROVAL_REQUIRED")
            .scalar() or 0
        )
        blocked = (
            db.query(func.count(AuditLog.id))
            .filter(AuditLog.decision == "BLOCK")
            .scalar() or 0
        )
        avg_risk = db.query(func.avg(AuditLog.risk_score)).scalar() or 0.0

        return {
            "total_actions": total,
            "allowed": allowed,
            "sandboxed": sandboxed,
            "approval_required": approval_required,
            "blocked": blocked,
            "average_risk": round(float(avg_risk), 1),
        }
