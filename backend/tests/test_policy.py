"""
Policy Engine Tests
===================
Verify threshold-based decision making.
"""

import pytest


def _risk(score: int, level: str = "INFO", reasons=None):
    return {"risk_score": score, "risk_level": level, "reasons": reasons or ["test reason"]}


def test_score_10_allows(policy_engine):
    r = policy_engine.decide(_risk(10))
    assert r["decision"] == "ALLOW"


def test_score_0_allows(policy_engine):
    r = policy_engine.decide(_risk(0))
    assert r["decision"] == "ALLOW"


def test_score_29_allows(policy_engine):
    r = policy_engine.decide(_risk(29))
    assert r["decision"] == "ALLOW"


def test_score_30_sandboxes(policy_engine):
    r = policy_engine.decide(_risk(30))
    assert r["decision"] == "SANDBOX"


def test_score_45_sandboxes(policy_engine):
    r = policy_engine.decide(_risk(45))
    assert r["decision"] == "SANDBOX"


def test_score_59_sandboxes(policy_engine):
    r = policy_engine.decide(_risk(59))
    assert r["decision"] == "SANDBOX"


def test_score_60_requires_approval(policy_engine):
    r = policy_engine.decide(_risk(60))
    assert r["decision"] == "APPROVAL_REQUIRED"


def test_score_70_requires_approval(policy_engine):
    r = policy_engine.decide(_risk(70))
    assert r["decision"] == "APPROVAL_REQUIRED"


def test_score_84_requires_approval(policy_engine):
    r = policy_engine.decide(_risk(84))
    assert r["decision"] == "APPROVAL_REQUIRED"


def test_score_85_blocks(policy_engine):
    r = policy_engine.decide(_risk(85))
    assert r["decision"] == "BLOCK"


def test_score_95_blocks(policy_engine):
    r = policy_engine.decide(_risk(95))
    assert r["decision"] == "BLOCK"


def test_score_100_blocks(policy_engine):
    r = policy_engine.decide(_risk(100))
    assert r["decision"] == "BLOCK"


def test_decision_has_reason(policy_engine):
    r = policy_engine.decide(_risk(50, reasons=["Suspicious action"]))
    assert "reason" in r
    assert len(r["reason"]) > 0
