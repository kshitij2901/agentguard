"""
Threshold Policy Engine
=======================
Converts a 0-100 risk score into a policy decision using thresholds that
come *exclusively* from config.  No magic numbers here.

Implements: PolicyEngineInterface
"""

from typing import Optional, Dict, Any

from app.services.interfaces import PolicyEngineInterface
from app.core.config import settings


class ThresholdPolicyEngine(PolicyEngineInterface):
    """
    Linear threshold policy:

        0  – (ALLOW_THRESHOLD-1)      → ALLOW
        ALLOW_THRESHOLD – (SANDBOX_THRESHOLD-1)    → SANDBOX
        SANDBOX_THRESHOLD – (APPROVAL_THRESHOLD-1) → APPROVAL_REQUIRED
        APPROVAL_THRESHOLD – 100                   → BLOCK
    """

    def __init__(self) -> None:
        self._allow = settings.ALLOW_THRESHOLD
        self._sandbox = settings.SANDBOX_THRESHOLD
        self._approval = settings.APPROVAL_THRESHOLD

    def decide(
        self,
        risk_result: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        score: int = risk_result.get("risk_score", 0)
        primary_reason: str = (risk_result.get("reasons") or ["No specific reason"])[0]

        if score < self._allow:
            return {
                "decision": "ALLOW",
                "reason": (
                    f"Risk score {score} is within safe threshold "
                    f"(< {self._allow}). Action permitted."
                ),
            }
        if score < self._sandbox:
            return {
                "decision": "SANDBOX",
                "reason": (
                    f"Risk score {score} requires sandboxed execution "
                    f"(threshold {self._allow}-{self._sandbox - 1}). {primary_reason}"
                ),
            }
        if score < self._approval:
            return {
                "decision": "APPROVAL_REQUIRED",
                "reason": (
                    f"Risk score {score} requires human approval "
                    f"(threshold {self._sandbox}-{self._approval - 1}). {primary_reason}"
                ),
            }
        return {
            "decision": "BLOCK",
            "reason": (
                f"Risk score {score} exceeds block threshold "
                f"(>= {self._approval}). {primary_reason}"
            ),
        }
