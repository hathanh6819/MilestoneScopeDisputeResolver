import pytest
from tests.conftest import (
    MockGl, MockUserError, MockAddress, MockWebResponse,
    CLIENT_ADDR, WORKER_ADDR, OTHER_ADDR,
    REPO_NAME, SCOPE_SHA, DELIVERY_SHA, SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT
)
import milestone_scope_dispute_resolver as contract_mod

Contract = contract_mod.Contract

def setup_function():
    MockGl.reset()

def test_cancel_expired_agreement_refunds_client():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = 3000000000000000000
    MockGl.message_raw["timestamp"] = 1000
    
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, deadline_seconds=1000, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    # 1. Premature cancellation rejected (timestamp 1500 <= deadline 2000)
    MockGl.message_raw["timestamp"] = 1500
    with pytest.raises(MockUserError, match="DEADLINE_NOT_PASSED"):
        c.cancel_expired_agreement(ag_id)
        
    # 2. Non-client cannot cancel
    MockGl.message_raw["timestamp"] = 2500  # past deadline
    MockGl.message.sender = MockAddress(OTHER_ADDR)
    with pytest.raises(MockUserError, match="ONLY_CLIENT_CAN_CANCEL"):
        c.cancel_expired_agreement(ag_id)
        
    # 3. Client cancels after deadline
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.cancel_expired_agreement(ag_id)
    
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_CANCELLED
    assert len(MockGl.transfers) == 1
    assert MockGl.transfers[0]["to"].lower() == CLIENT_ADDR.lower()
    assert MockGl.transfers[0]["value"] == 3000000000000000000
    
    acc = c.get_accounting()
    assert acc["total_refunded_wei"] == "3000000000000000000"
    assert acc["total_reserved_wei"] == "0"
    
    # 4. Second cancellation rejected
    with pytest.raises(MockUserError, match="AGREEMENT_ALREADY_TERMINAL"):
        c.cancel_expired_agreement(ag_id)

def test_retry_assessment_after_source_unavailable():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "NETWORK_TRANSIENT_TEST")
    
    # 1. First attempt fails due to 503
    url_sc = f"https://api.github.com/repos/{REPO_NAME}/git/commits/{SCOPE_SHA}"
    MockGl.nondet.web.responses[url_sc] = MockWebResponse(status=503, body=b"Error")
    c.assess_dispute(ag_id, expected_revision=1)
    
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED
    
    # 2. Server recovers, retry succeeds
    MockGl.nondet.web.responses.pop(url_sc, None)
    MockGl.nondet.custom_llm_json = {
        "clauses": [{"id": "CLAUSE_1", "status": "SATISFIED", "material": True}, {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}]
    }
    
    c.retry_assessment(ag_id, expected_revision=1)
    disp_after = c.get_dispute(ag_id)
    assert disp_after["ruling"] == contract_mod.RULING_DELIVERED
