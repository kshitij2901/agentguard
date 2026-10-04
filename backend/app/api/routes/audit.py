from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.deps import get_audit_service
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api", tags=["audit"])


def _to_dict(log) -> dict:
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "task_id": log.task_id,
        "task_goal": getattr(log, "task_goal", None),
        "action_id": log.action_id,
        "action_type": log.action_type,
        "action_target": log.action_target,
        "action_description": log.action_description,
        "rule_matched": log.rule_matched,
        "rule_severity": log.rule_severity,
        "rule_id": log.rule_id,
        "intent_score": log.intent_score,
        "intent_reason": getattr(log, "intent_reason", None),
        "risk_score": log.risk_score,
        "risk_level": log.risk_level,
        "risk_reasons": getattr(log, "risk_reasons", []) or [],
        "decision": log.decision,
        "reason": log.reason,
        "execution_result": log.execution_result,
        "entry_index": getattr(log, "entry_index", 0),
        "prev_hash": getattr(log, "prev_hash", None),
        "entry_hash": getattr(log, "entry_hash", None),
        "merkle_root": getattr(log, "merkle_root", None),
        "anchor_tx_hash": getattr(log, "anchor_tx_hash", None),
        "tier_analysis": getattr(log, "tier_analysis", {}) or {},
    }


@router.get("/audit")
def get_audit_log(
    task_id: Optional[str] = Query(None, description="Filter by task ID"),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Return audit log entries, newest first."""
    logs = audit_service.get_logs(db=db, task_id=task_id, limit=limit)
    return [_to_dict(log) for log in logs]


@router.get("/audit/verify-chain")
def verify_audit_chain(
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    """
    Cryptographically verify the entire SHA-256 audit hash chain.
    Returns proof of action integrity, Merkle root, and anchor transaction hash.
    """
    return audit_service.verify_chain(db=db)


@router.get("/audit/merkle-root")
def get_merkle_root(
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Return current Merkle root and simulated EVM anchor status."""
    res = audit_service.verify_chain(db=db)
    return {
        "merkle_root": res["merkle_root"],
        "total_blocks": res["total_blocks"],
        "latest_anchor_tx": res["latest_anchor_tx"],
        "network": "Polygon Amoy / Arbitrum Sepolia (Simulated Proof-of-Action)",
        "chain_status": res["chain_status"],
    }


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Return aggregate statistics for the dashboard."""
    return audit_service.get_stats(db=db)
