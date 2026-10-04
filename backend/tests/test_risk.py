"""
Risk Engine Tests
=================
Verify that the DefaultRiskEngine produces correctly scaled composite scores.
"""

import pytest


def _rule(severity, matched=True, reason="Test rule matched", rule_id="TEST_RULE"):
    return {"matched": matched, "severity": severity, "reason": reason, "rule_id": rule_id}


def _intent(score: float):
    return {"score": score, "score_percent": int(score * 100), "reason": "test"}


def test_critical_rule_low_intent_produces_critical_risk(risk_engine):
    r = risk_engine.calculate(_rule("CRITICAL"), _intent(0.05), "FILE_READ")
    assert r["risk_score"] >= 85
    assert r["risk_level"] == "CRITICAL"


def test_no_rule_high_intent_produces_low_risk(risk_engine):
    r = risk_engine.calculate(
        {"matched": False, "severity": None, "reason": None, "rule_id": None},
        _intent(0.90),
        "FILE_READ",
    )
    assert r["risk_score"] <= 30


def test_high_rule_medium_intent_produces_high_risk(risk_engine):
    r = risk_engine.calculate(_rule("HIGH"), _intent(0.50), "FILE_READ")
    assert r["risk_score"] >= 40


def test_medium_rule_medium_intent_medium_risk(risk_engine):
    r = risk_engine.calculate(_rule("MEDIUM"), _intent(0.50), "COMMAND_EXECUTE")
    assert 30 <= r["risk_score"] <= 80


def test_network_request_elevates_risk(risk_engine):
    r_file = risk_engine.calculate(
        {"matched": False, "severity": None, "reason": None, "rule_id": None},
        _intent(0.50),
        "FILE_READ",
    )
    r_net = risk_engine.calculate(
        {"matched": False, "severity": None, "reason": None, "rule_id": None},
        _intent(0.50),
        "NETWORK_REQUEST",
    )
    assert r_net["risk_score"] > r_file["risk_score"]


def test_risk_score_within_bounds(risk_engine):
    r = risk_engine.calculate(_rule("CRITICAL"), _intent(0.0), "NETWORK_REQUEST")
    assert 0 <= r["risk_score"] <= 100


def test_risk_result_has_required_keys(risk_engine):
    r = risk_engine.calculate(_rule("HIGH"), _intent(0.3), "FILE_READ")
    assert "risk_score" in r
    assert "risk_level" in r
    assert "reasons" in r
    assert isinstance(r["reasons"], list)
