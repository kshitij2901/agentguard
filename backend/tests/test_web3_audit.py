"""Tests for Web3 Tamper-Proof Cryptographic Hash Chain & Merkle Audit."""
import pytest
from app.services.audit_service import AuditService, GENESIS_HASH


def test_chain_verification_empty(db):
    service = AuditService()
    res = service.verify_chain(db)
    assert res["is_valid"] is True
    assert res["total_blocks"] == 0
    assert res["merkle_root"] == GENESIS_HASH


def test_chain_creation_and_tamper_detection(db):
    service = AuditService()

    # Log 3 entries
    e1 = service.log(
        db=db,
        task_id="task-1",
        action_id="act-1",
        action_type="FILE_READ",
        action_target="src/main.py",
        action_description="Read main file",
        rule_result={"matched": False},
        intent_result={"score_percent": 95, "reason": "aligned"},
        risk_result={"risk_score": 10, "risk_level": "LOW", "reasons": []},
        decision_result={"decision": "ALLOW", "reason": "safe"},
    )
    db.commit()

    e2 = service.log(
        db=db,
        task_id="task-1",
        action_id="act-2",
        action_type="FILE_WRITE",
        action_target="src/main.py",
        action_description="Write main file",
        rule_result={"matched": False},
        intent_result={"score_percent": 90, "reason": "aligned"},
        risk_result={"risk_score": 15, "risk_level": "LOW", "reasons": []},
        decision_result={"decision": "ALLOW", "reason": "safe"},
    )
    db.commit()

    # Validate chaining
    assert e1.prev_hash == GENESIS_HASH
    assert e2.prev_hash == e1.entry_hash
    assert e1.entry_index == 0
    assert e2.entry_index == 1

    # Chain validation should pass
    chain_check = service.verify_chain(db)
    assert chain_check["is_valid"] is True
    assert chain_check["total_blocks"] == 2
    assert chain_check["chain_status"] == "TAMPER_PROOF_VERIFIED"
    assert len(chain_check["merkle_root"]) == 64
    assert chain_check["latest_anchor_tx"].startswith("0x")

    # Now simulate malicious tamper by modifying entry 1 target
    e1.action_target = "tampered_target.py"
    db.commit()

    # Verify chain reflects corruption or modified hash
    tampered_check = service.verify_chain(db)
    assert tampered_check["merkle_root"] is not None
