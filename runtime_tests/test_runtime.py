import json
import pytest
import re
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "samples"))
from fixture_data import evidence_responses


def test_real_direct_deploy_and_create(direct_deploy):
    c = direct_deploy("contracts/milestone_scope_dispute_resolver.py")
    assert c.get_counts()["agreement_count"] == 0
    aid = c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Test policy", 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    assert aid == 1
    assert c.get_agreement(1)["state"] == 2


def prepare(direct_deploy, direct_vm, direct_bob):
    c = direct_deploy("contracts/milestone_scope_dispute_resolver.py")
    aid = c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Test policy", 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    with direct_vm.prank(direct_bob):
        c.accept_agreement(aid)
        c.submit_delivery(aid, "2" * 40, "DELIVERY.md", 0)
    c.open_dispute(aid, "SCOPE_MISMATCH")
    for url, body in evidence_responses("example/repository", "1" * 40, "2" * 40, "SCOPE.md", "DELIVERY.md", [{"id": "C1", "text": "Implement validation", "material": True}]).items():
        direct_vm.mock_web("^" + re.escape(url) + "$", {"status": 200, "body": body})
    return c, aid


def test_real_direct_happy_and_replay(direct_deploy, direct_vm, direct_bob):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": [{"id": "C1", "status": "SATISFIED", "material": True}]}))
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 1
    assert len(c.get_dispute(aid)["evidence_digest"]) == 71
    c.authorize_settlement(aid, 1)
    c.execute_settlement(aid)
    before = c.get_agreement(aid)
    with pytest.raises(Exception, match="SETTLEMENT_NOT_AUTHORIZED"):
        c.execute_settlement(aid)
    assert c.get_agreement(aid) == before


def test_real_direct_malformed_output_is_nonpaying(direct_deploy, direct_vm, direct_bob):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", "broken-json")
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 5
    assert c.get_dispute(aid)["evidence_digest"] == ""
    assert c.get_agreement(aid)["state"] == 6


@pytest.mark.parametrize("payload", ["null", "[]", "true", "123", '"text"'])
def test_model_wrong_json_type_is_retryable(direct_deploy, direct_vm, direct_bob, payload):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", payload)
    before = c.get_accounting()
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["reason_code"] == "MALFORMED_MODEL_OUTPUT"
    assert c.get_dispute(aid)["ruling"] == 5
    assert c.get_accounting() == before
    with pytest.raises(Exception, match="INVALID_LIFECYCLE_STATE"):
        c.authorize_settlement(aid, 1)
    # gltest matches the first registered response; replace only the LLM boundary.
    direct_vm._llm_mocks.clear()
    direct_vm._llm_mocks_hit.clear()
    direct_vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": [{"id": "C1", "status": "SATISFIED", "material": True}]}))
    c.retry_assessment(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 1


@pytest.mark.parametrize("path", ["/SCOPE.md", "a/../SCOPE.md", "a//SCOPE.md", "SCOPE.md?x=1", "SCOPE.md#x", "%2e%2e/SCOPE.md", "a\\SCOPE.md"])
def test_scope_path_injection_rejected(direct_deploy, path):
    c = direct_deploy("contracts/milestone_scope_dispute_resolver.py")
    with pytest.raises(Exception, match="INVALID_SCOPE_PATH"):
        c.create_agreement("example/repository", "1" * 40, path, "Policy", 3600,
                           fallback_arbitrator="0x4444444444444444444444444444444444444444")
    assert c.get_counts()["agreement_count"] == 0


def test_clause_index_cannot_read_other_agreement(direct_deploy, direct_vm, direct_bob):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    assert c.get_clause_result(aid, 100) == {}
    assert c.get_clause_result(0, 0) == {}
    assert c.get_clause_result(999, 0) == {}
