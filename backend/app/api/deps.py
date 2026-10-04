"""
Dependency injection — wires concrete engines into the interceptor.
All routes import only `get_interceptor`; they never import engine classes.
To swap an engine, change only this file.
"""

from app.services.rule_engine import HeuristicRuleEngine
from app.services.intent_engine import HeuristicIntentEngine
from app.services.risk_engine import DefaultRiskEngine
from app.services.policy_engine import ThresholdPolicyEngine
from app.services.execution_gateway import MockExecutionGateway
from app.services.intent_manager import IntentManager
from app.services.audit_service import AuditService
from app.services.action_interceptor import ActionInterceptor

# Singletons — created once, shared across all requests (all are stateless)
_rule_engine = HeuristicRuleEngine()
_intent_engine = HeuristicIntentEngine()
_risk_engine = DefaultRiskEngine()
_policy_engine = ThresholdPolicyEngine()
_execution_gateway = MockExecutionGateway()
_intent_manager = IntentManager()
_audit_service = AuditService()

_interceptor = ActionInterceptor(
    rule_engine=_rule_engine,
    intent_engine=_intent_engine,
    risk_engine=_risk_engine,
    policy_engine=_policy_engine,
    execution_gateway=_execution_gateway,
    intent_manager=_intent_manager,
    audit_service=_audit_service,
)


def get_interceptor() -> ActionInterceptor:
    return _interceptor


def get_intent_manager() -> IntentManager:
    return _intent_manager


def get_audit_service() -> AuditService:
    return _audit_service
