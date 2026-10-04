"""
Shared pytest fixtures.
Uses an in-memory SQLite database so tests are fully isolated.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base


@pytest.fixture(scope="function")
def db():
    """Fresh in-memory database for each test function."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def rule_engine():
    from app.services.rule_engine import HeuristicRuleEngine
    return HeuristicRuleEngine()


@pytest.fixture
def intent_engine():
    from app.services.intent_engine import HeuristicIntentEngine
    return HeuristicIntentEngine()


@pytest.fixture
def risk_engine():
    from app.services.risk_engine import DefaultRiskEngine
    return DefaultRiskEngine()


@pytest.fixture
def policy_engine():
    from app.services.policy_engine import ThresholdPolicyEngine
    return ThresholdPolicyEngine()


@pytest.fixture
def interceptor():
    from app.services.rule_engine import HeuristicRuleEngine
    from app.services.intent_engine import HeuristicIntentEngine
    from app.services.risk_engine import DefaultRiskEngine
    from app.services.policy_engine import ThresholdPolicyEngine
    from app.services.execution_gateway import MockExecutionGateway
    from app.services.intent_manager import IntentManager
    from app.services.audit_service import AuditService
    from app.services.action_interceptor import ActionInterceptor

    return ActionInterceptor(
        rule_engine=HeuristicRuleEngine(),
        intent_engine=HeuristicIntentEngine(),
        risk_engine=DefaultRiskEngine(),
        policy_engine=ThresholdPolicyEngine(),
        execution_gateway=MockExecutionGateway(),
        intent_manager=IntentManager(),
        audit_service=AuditService(),
    )


@pytest.fixture
def auth_task_id(db):
    from app.services.intent_manager import IntentManager
    mgr = IntentManager()
    task = mgr.create_task(
        db=db,
        goal="Fix authentication bug",
        allowed_paths=["src/auth", "tests/auth"],
    )
    return task.id
