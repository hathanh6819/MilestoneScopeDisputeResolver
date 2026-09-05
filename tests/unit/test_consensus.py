import pytest
import json
from tests.conftest import (
    MockGl, MockUserError, MockAddress, MockWebResponse,
    CLIENT_ADDR, WORKER_ADDR, REPO_NAME, SCOPE_SHA, DELIVERY_SHA,
    SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT
)
import milestone_scope_dispute_resolver as contract_mod

Contract = contract_mod.Contract

def setup_function():
    MockGl.reset()

def _setup_disputed_agreement():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = 2000000000000000000
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "TEST_DISPUTE")
    return c, ag_id

def test_consensus_ruling_delivered():
    c, ag_id = _setup_disputed_agreement()
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}
        ],
        "diagnostic_code": "ALL_PASSED"
    }
    
    c.assess_dispute(ag_id, expected_revision=1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_DELIVERED
    assert disp["worker_split_bps"] == 10000
    assert disp["client_split_bps"] == 0
    assert disp["clause_count"] == 2
    
    cl1 = c.get_clause_result(ag_id, 0)
    assert cl1["result"] == contract_mod.CLAUSE_RESULT_SATISFIED

def test_model_cannot_invent_added_after_freeze():
    c, ag_id = _setup_disputed_agreement()
    
    # Requirement added after scope freeze
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "ADDED_AFTER_FREEZE", "material": False}
        ],
        "diagnostic_code": "SCOPE_CREEP_DETECTED"
    }
    
    c.assess_dispute(ag_id, expected_revision=1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED
    assert disp["worker_split_bps"] == 0
    assert disp["client_split_bps"] == 0

def test_consensus_ruling_partial():
    c, ag_id = _setup_disputed_agreement()
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "PARTIALLY_SATISFIED", "material": True}
        ],
        "diagnostic_code": "PARTIAL_DELIVERY"
    }
    
    c.assess_dispute(ag_id, expected_revision=1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_PARTIAL
    assert disp["worker_split_bps"] == 5000
    assert disp["client_split_bps"] == 5000

def test_consensus_ruling_not_delivered():
    c, ag_id = _setup_disputed_agreement()
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "UNSATISFIED", "material": True}
        ],
        "diagnostic_code": "MATERIAL_CLAUSE_MISSED"
    }
    
    c.assess_dispute(ag_id, expected_revision=1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_NOT_DELIVERED
    assert disp["worker_split_bps"] == 0
    assert disp["client_split_bps"] == 10000

def test_consensus_ruling_unresolved_on_source_unavailable():
    c, ag_id = _setup_disputed_agreement()
    
    # Simulate GitHub 503 error
    url_sc = f"https://api.github.com/repos/{REPO_NAME}/git/commits/{SCOPE_SHA}"
    MockGl.nondet.web.responses[url_sc] = MockWebResponse(status=503, body=b"Service Unavailable")
    
    c.assess_dispute(ag_id, expected_revision=1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED
    assert disp["reason_code"] == "SOURCE_UNAVAILABLE"
    
    ag = c.get_agreement(ag_id)
    # State remains DISPUTED so it can be retried
    assert ag["state"] == contract_mod.STATE_DISPUTED

def test_assess_dispute_stale_revision_rejected():
    c, ag_id = _setup_disputed_agreement()
    
    with pytest.raises(MockUserError, match="STALE_REVISION"):
        c.assess_dispute(ag_id, expected_revision=0)
