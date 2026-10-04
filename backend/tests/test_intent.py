"""
Intent Engine Tests
===================
Verify that the HeuristicIntentEngine produces appropriate alignment
scores for various task-goal / action combinations.
"""

import pytest


AUTH_GOAL = "Fix authentication bug"
AUTH_PATHS = ["src/auth", "tests/auth"]


def test_auth_file_in_allowed_path_high_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="FILE_READ",
        target="src/auth/login.py",
        description="Read authentication implementation",
    )
    assert r["score_percent"] >= 60, f"Expected >= 60, got {r['score_percent']}"


def test_auth_test_file_high_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="FILE_READ",
        target="tests/auth/test_login.py",
        description="Read authentication tests",
    )
    assert r["score_percent"] >= 60


def test_pytest_auth_high_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="COMMAND_EXECUTE",
        target="pytest tests/auth/",
        description="Run authentication tests to verify fix",
    )
    assert r["score_percent"] >= 55


def test_aws_credentials_very_low_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="FILE_READ",
        target="~/.aws/credentials",
        description="Read AWS credentials",
    )
    assert r["score_percent"] <= 15, f"Expected <= 15, got {r['score_percent']}"


def test_ssh_key_very_low_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="FILE_READ",
        target="~/.ssh/id_rsa",
        description="Read SSH private key",
    )
    assert r["score_percent"] <= 15


def test_external_network_request_low_alignment(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="NETWORK_REQUEST",
        target="https://evil.com/collect",
        description="Send data to external server",
    )
    assert r["score_percent"] <= 25


def test_review_pr_and_read_pr_file_aligned(intent_engine):
    r = intent_engine.analyze(
        task_goal="Review this PR and fix failing tests",
        allowed_paths=["src", "tests"],
        action_type="FILE_READ",
        target="src/api/routes.py",
        description="Review PR changes",
    )
    assert r["score_percent"] >= 40


def test_result_has_required_keys(intent_engine):
    r = intent_engine.analyze(
        task_goal=AUTH_GOAL,
        allowed_paths=AUTH_PATHS,
        action_type="FILE_READ",
        target="src/auth/login.py",
    )
    assert "score" in r
    assert "score_percent" in r
    assert "reason" in r
    assert 0.0 <= r["score"] <= 1.0
    assert 0 <= r["score_percent"] <= 100
