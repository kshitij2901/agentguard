"""
Default Risk Engine
===================
Combines rule-engine severity, intent-misalignment, and action-type base
risk into a single 0–100 risk score.

Implements: RiskEngineInterface
"""

from typing import Optional, Dict, Any, List

from app.services.interfaces import RiskEngineInterface


# ---------------------------------------------------------------------------
# Scoring tables
# ---------------------------------------------------------------------------

# Base risk contribution from the rule severity (maps to a 0-85 scale)
_SEVERITY_BASE: Dict[Optional[str], int] = {
    None: 0,
    "INFO": 5,
    "LOW": 15,
    "MEDIUM": 35,
    "HIGH": 60,
    "CRITICAL": 85,
}

# Baseline risk added by the action type (independent of rules)
_ACTION_BASE_RISK: Dict[str, int] = {
    "FILE_READ": 8,
    "FILE_WRITE": 18,
    "COMMAND_EXECUTE": 30,
    "NETWORK_REQUEST": 40,
    "GIT_OPERATION": 22,
}

# (threshold, label) – evaluated highest-first
_RISK_LEVELS = [
    (85, "CRITICAL"),
    (60, "HIGH"),
    (30, "MEDIUM"),
    (10, "LOW"),
    (0, "INFO"),
]


def _risk_level_for(score: int) -> str:
    for threshold, label in _RISK_LEVELS:
        if score >= threshold:
            return label
    return "INFO"


# ---------------------------------------------------------------------------
# Weights (must sum to 1.0)
# ---------------------------------------------------------------------------
_W_RULE = 0.45       # rule severity dominates
_W_INTENT = 0.35     # intent misalignment is second
_W_ACTION = 0.20     # action type provides a floor


class DefaultRiskEngine(RiskEngineInterface):
    """
    Weighted composite risk engine.

    Formula:
        raw = rule_score * W_RULE
            + misalignment_score * W_INTENT
            + action_base * W_ACTION

    A 20 % escalation boost is applied when the rule is CRITICAL *and*
    intent alignment is below 30 % — this combination is almost certainly
    an attack scenario.
    """

    def calculate(
        self,
        rule_result: Dict[str, Any],
        intent_result: Dict[str, Any],
        action_type: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        reasons: List[str] = []

        # --- Rule component ---
        severity = rule_result.get("severity")
        rule_score = _SEVERITY_BASE.get(severity, 0)
        if rule_result.get("matched"):
            reasons.append(rule_result.get("reason", "Security rule matched"))

        # --- Intent component (misalignment = high risk) ---
        intent_score = intent_result.get("score", 0.5)
        misalignment = (1.0 - intent_score) * 100  # 0-100
        if intent_score < 0.30:
            reasons.append(
                f"Action does not align with user intent "
                f"(alignment: {intent_result.get('score_percent', 0)}%)"
            )

        # --- Action type base ---
        action_base = _ACTION_BASE_RISK.get(action_type, 20)

        # --- Weighted sum ---
        raw = (
            rule_score * _W_RULE
            + misalignment * _W_INTENT
            + action_base * _W_ACTION
        )

        # --- Escalation boost ---
        if severity == "CRITICAL":
            if intent_score < 0.60:
                raw = max(raw * 1.35, 88.0)
                reasons.append("Critical security violation with insufficient task authorization")
            else:
                raw = raw * 1.15

        risk_score = int(min(100, max(0, raw)))
        risk_level = _risk_level_for(risk_score)

        if not reasons:
            if risk_score < 30:
                reasons.append("Action appears safe and aligned with user intent")
            else:
                reasons.append(f"Elevated risk detected (score: {risk_score})")

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
        }
