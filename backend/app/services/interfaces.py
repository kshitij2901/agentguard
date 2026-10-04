"""
AgentGuard Service Interfaces
=============================
All security components depend on these abstract base classes.
Concrete implementations (Heuristic*, LLM*, Docker*, etc.) are injected
at startup — nothing in the routing or interceptor layer imports them directly.

This makes it possible to swap:
  HeuristicIntentEngine  →  LLMIntentEngine  →  EmbeddingIntentEngine
  MockExecutionGateway   →  DockerExecutionGateway
without touching any caller code.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List


class RuleEngineInterface(ABC):
    """
    Evaluates an action against a set of deterministic security rules.

    Returns a structured result dict:
        {
            "matched": bool,
            "severity": str | None,   # INFO | LOW | MEDIUM | HIGH | CRITICAL
            "reason":   str | None,
            "rule_id":  str | None,
        }
    """

    @abstractmethod
    def evaluate(
        self,
        action_type: str,
        target: str,
        description: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ...


class IntentEngineInterface(ABC):
    """
    Calculates the alignment score between the user's intent (task goal)
    and the proposed action.

    Returns:
        {
            "score":         float,   # 0.0 – 1.0
            "score_percent": int,     # 0 – 100
            "reason":        str,
        }

    Phase 1: heuristic keyword/path matching.
    Phase 5: drop-in LLM implementation.
    """

    @abstractmethod
    def analyze(
        self,
        task_goal: str,
        allowed_paths: List[str],
        action_type: str,
        target: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        ...


class RiskEngineInterface(ABC):
    """
    Combines rule, intent, and action-type signals into a single risk score.

    Returns:
        {
            "risk_score": int,        # 0 – 100
            "risk_level": str,        # INFO | LOW | MEDIUM | HIGH | CRITICAL
            "reasons":    list[str],
        }
    """

    @abstractmethod
    def calculate(
        self,
        rule_result: Dict[str, Any],
        intent_result: Dict[str, Any],
        action_type: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ...


class PolicyEngineInterface(ABC):
    """
    Converts a risk score into a policy decision using configurable thresholds.

    Returns:
        {
            "decision": str,   # ALLOW | SANDBOX | APPROVAL_REQUIRED | BLOCK
            "reason":   str,
        }
    """

    @abstractmethod
    def decide(
        self,
        risk_result: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ...


class ExecutionGatewayInterface(ABC):
    """
    Executes (or simulates) an action after a policy decision has been made.

    Phase 1: MockExecutionGateway  – safe, never calls the OS.
    Phase 4: DockerExecutionGateway – sandboxed container execution.
    Phase 5: RealToolExecutionGateway – MCP tool calls.

    Returns a human-readable execution result string.
    """

    @abstractmethod
    def execute(
        self,
        action_type: str,
        target: str,
        description: Optional[str] = None,
        decision: str = "ALLOW",
    ) -> str:
        ...
