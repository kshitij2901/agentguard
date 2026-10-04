"""
Action Interceptor
==================
Central entry point for every agent action.  No action may reach the
execution gateway without passing through this pipeline.

Pipeline:
  Agent Action
       ↓
  Action Interceptor   (this file)
       ↓
  Rule Engine          → rule_result
       ↓
  Intent Engine        → intent_result
       ↓
  Risk Engine          → risk_result
       ↓
  Policy Engine        → decision_result
       ↓
  Audit Logger
       ↓
  (optional) Execution Gateway → execution_result

The interceptor depends *only* on the ABC interfaces defined in
interfaces.py.  Concrete engines are injected at startup via deps.py.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from app.services.interfaces import (
    RuleEngineInterface,
    IntentEngineInterface,
    RiskEngineInterface,
    PolicyEngineInterface,
    ExecutionGatewayInterface,
)
from app.services.intent_manager import IntentManager
from app.services.audit_service import AuditService
from app.models.action import Action
from app.models.decision import Decision


class ActionInterceptor:
    """
    Orchestrates the full AgentGuard security pipeline.
    All dependencies are injected — never instantiated here.
    """

    def __init__(
        self,
        rule_engine: RuleEngineInterface,
        intent_engine: IntentEngineInterface,
        risk_engine: RiskEngineInterface,
        policy_engine: PolicyEngineInterface,
        execution_gateway: ExecutionGatewayInterface,
        intent_manager: IntentManager,
        audit_service: AuditService,
    ) -> None:
        self.rule_engine = rule_engine
        self.intent_engine = intent_engine
        self.risk_engine = risk_engine
        self.policy_engine = policy_engine
        self.execution_gateway = execution_gateway
        self.intent_manager = intent_manager
        self.audit_service = audit_service

    def intercept(
        self,
        db: Session,
        task_id: str,
        action_type: str,
        target: str,
        description: Optional[str] = None,
        execute: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate (and optionally execute) an agent action.

        Returns a dict matching the EvaluationResponse schema.
        On unknown task_id, returns a BLOCK decision immediately.
        """
        metadata = metadata or {}

        # ── 1. Resolve task context ──────────────────────────────────────
        task = self.intent_manager.get_task(task_id, db)
        if task is None:
            return {
                "error": f"Task '{task_id}' not found or inactive",
                "action_id": str(uuid.uuid4()),
                "task_id": task_id,
                "action_type": action_type,
                "action_target": target,
                "rule_result": {"matched": False, "severity": None, "reason": None, "rule_id": None},
                "intent_result": {"score": 0.0, "score_percent": 0, "reason": "Unknown task"},
                "risk_result": {"risk_score": 100, "risk_level": "CRITICAL", "reasons": ["Unknown task"]},
                "decision_result": {"decision": "BLOCK", "reason": "Task not found — cannot evaluate intent"},
                "execution_result": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        context = {
            "task_id": task.id,
            "task_goal": task.goal,
            "sensitive_access_allowed": task.sensitive_access_allowed,
            "network_access_allowed": task.network_access_allowed,
            "destructive_actions_allowed": task.destructive_actions_allowed,
            "git_push_allowed": task.git_push_allowed,
        }

        # ── 2. Persist action ────────────────────────────────────────────
        action = Action(
            id=str(uuid.uuid4()),
            task_id=task_id,
            action_type=action_type,
            target=target,
            description=description,
            extra_metadata=metadata,
        )
        db.add(action)
        db.flush()          # get action.id without committing

        # ── 3. Rule Engine ───────────────────────────────────────────────
        rule_result = self.rule_engine.evaluate(
            action_type=action_type,
            target=target,
            description=description,
            context=context,
        )

        # ── 4. Intent Engine ─────────────────────────────────────────────
        intent_result = self.intent_engine.analyze(
            task_goal=task.goal,
            allowed_paths=task.allowed_paths or [],
            action_type=action_type,
            target=target,
            description=description,
        )

        # ── 5. Risk Engine ───────────────────────────────────────────────
        risk_result = self.risk_engine.calculate(
            rule_result=rule_result,
            intent_result=intent_result,
            action_type=action_type,
            context=context,
        )

        # ── 6. Policy Engine ─────────────────────────────────────────────
        decision_result = self.policy_engine.decide(
            risk_result=risk_result,
            context=context,
        )

        # ── 7. (Optional) Execution Gateway ─────────────────────────────
        execution_result: Optional[str] = None
        if execute:
            execution_result = self.execution_gateway.execute(
                action_type=action_type,
                target=target,
                description=description,
                decision=decision_result["decision"],
            )

        # ── 8. Persist decision ──────────────────────────────────────────
        decision_row = Decision(
            id=str(uuid.uuid4()),
            action_id=action.id,
            task_id=task_id,
            decision=decision_result["decision"],
            reason=decision_result["reason"],
            rule_result=rule_result,
            intent_score=intent_result["score"],
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            execution_result=execution_result,
        )
        db.add(decision_row)

        # ── 9. Audit log ─────────────────────────────────────────────────
        tier_analysis = intent_result.get("tier_analysis", {})
        audit_entry = self.audit_service.log(
            db=db,
            task_id=task_id,
            action_id=action.id,
            action_type=action_type,
            action_target=target,
            action_description=description,
            rule_result=rule_result,
            intent_result=intent_result,
            risk_result=risk_result,
            decision_result=decision_result,
            execution_result=execution_result,
            task_goal=task.goal,
            tier_analysis=tier_analysis,
        )

        db.commit()

        timestamp = action.created_at or datetime.now(timezone.utc)

        return {
            "action_id": action.id,
            "task_id": task_id,
            "action_type": action_type,
            "action_target": target,
            "rule_result": rule_result,
            "intent_result": intent_result,
            "risk_result": risk_result,
            "decision_result": decision_result,
            "execution_result": execution_result,
            "tier_analysis": tier_analysis,
            "block_hash": audit_entry.entry_hash,
            "prev_hash": audit_entry.prev_hash,
            "anchor_tx_hash": audit_entry.anchor_tx_hash,
            "timestamp": timestamp.isoformat(),
        }
