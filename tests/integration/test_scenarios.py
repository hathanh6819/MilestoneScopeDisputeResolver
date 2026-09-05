import pytest
import json
from tests.conftest import (
    MockGl, MockUserError, MockAddress, MockWebResponse,
    CLIENT_ADDR, WORKER_ADDR, OTHER_ADDR,
    REPO_NAME, SCOPE_SHA, DELIVERY_SHA, SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT
)
import milestone_scope_dispute_resolver as contract_mod

Contract = contract_mod.Contract

def setup_function():
    MockGl.reset()

def _create_and_fund(deposit_wei=1000000000000000000, deadline=3600):
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = deposit_wei
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, deadline, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    return c, ag_id

# Scenario 1: HAPPY_ALL_CLAUSES_DELIVERED
def test_scenario_1_happy_all_clauses_delivered():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "TEST_ALL_DELIVERED")
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}
        ]
    }
    c.assess_dispute(ag_id, 1)
    c.authorize_settlement(ag_id, 1)
    c.execute_settlement(ag_id)
    
    assert c.get_agreement(ag_id)["state"] == contract_mod.STATE_SETTLED
    assert len(MockGl.transfers) == 1
    assert MockGl.transfers[0]["to"].lower() == WORKER_ADDR.lower()

# Scenario 2: SCOPE_EXPANDED_AFTER_FREEZE
def test_scenario_2_unsupported_scope_expansion_rejected():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "SCOPE_CREEP_CLAIM")
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "FROZEN_1", "status": "SATISFIED", "material": True},
            {"id": "EXPANDED_2", "status": "ADDED_AFTER_FREEZE", "material": False}
        ]
    }
    c.assess_dispute(ag_id, 1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED
    assert disp["worker_split_bps"] == 0
    
    with pytest.raises(MockUserError):
        c.authorize_settlement(ag_id, 1)
    assert MockGl.transfers == []

# Scenario 3: PARTIAL_DELIVERY_MIXED
def test_scenario_3_partial_delivery_mixed():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "PARTIAL_CLAIM")
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "PARTIALLY_SATISFIED", "material": True}
        ]
    }
    c.assess_dispute(ag_id, 1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_PARTIAL
    assert disp["worker_split_bps"] == 5000
    assert disp["client_split_bps"] == 5000
    
    c.authorize_settlement(ag_id, 1)
    c.execute_settlement(ag_id)
    assert len(MockGl.transfers) == 2

# Scenario 4: MATERIAL_SCOPE_MISSED
def test_scenario_4_material_scope_missed():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "UNFULFILLED_CLAIM")
    
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "UNSATISFIED", "material": True}
        ]
    }
    c.assess_dispute(ag_id, 1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_NOT_DELIVERED
    assert disp["client_split_bps"] == 10000
    
    c.authorize_settlement(ag_id, 1)
    c.execute_settlement(ag_id)
    assert MockGl.transfers[0]["to"].lower() == CLIENT_ADDR.lower()

# Scenario 5: NON_MATERIAL_OMISSIONS
def test_scenario_5_model_materiality_demotion_rejected():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "NON_MATERIAL_DISPUTE")
    
    # Clause is unsatisfied, but NOT material
    MockGl.nondet.custom_llm_json = {
        "clauses": [
            {"id": "CLAUSE_1", "status": "SATISFIED", "material": True},
            {"id": "CLAUSE_2", "status": "UNSATISFIED", "material": False}
        ]
    }
    c.assess_dispute(ag_id, 1)
    disp = c.get_dispute(ag_id)
    # The model cannot demote materiality frozen in the scope document.
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED

# Scenario 6: DIRECT_CLIENT_ACCEPTANCE
def test_scenario_6_direct_client_acceptance():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.accept_delivery(ag_id)
    assert c.get_agreement(ag_id)["state"] == contract_mod.STATE_SETTLED
    assert MockGl.transfers[0]["to"].lower() == WORKER_ADDR.lower()

# Scenario 7: EXPIRED_AGREEMENT_RECOVERY
def test_scenario_7_expired_agreement_recovery():
    MockGl.message_raw["timestamp"] = 1000
    c, ag_id = _create_and_fund(deadline=1000)
    
    MockGl.message_raw["timestamp"] = 2500
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.cancel_expired_agreement(ag_id)
    assert c.get_agreement(ag_id)["state"] == contract_mod.STATE_CANCELLED
    assert MockGl.transfers[0]["to"].lower() == CLIENT_ADDR.lower()

# Scenario 8: UNRESOLVED_NETWORK_RETRY_PASS
def test_scenario_8_unresolved_network_retry_pass():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "NETWORK_FAIL_CLAIM")
    
    url = f"https://api.github.com/repos/{REPO_NAME}/git/commits/{SCOPE_SHA}"
    MockGl.nondet.web.responses[url] = MockWebResponse(status=500, body=b"Error")
    c.assess_dispute(ag_id, 1)
    assert c.get_dispute(ag_id)["ruling"] == contract_mod.RULING_UNRESOLVED
    
    # Retry after network restores
    MockGl.nondet.web.responses.pop(url, None)
    c.retry_assessment(ag_id, 1)
    assert c.get_dispute(ag_id)["ruling"] == contract_mod.RULING_DELIVERED

# Scenario 9: REPLAY_SETTLEMENT_BLOCKED
def test_scenario_9_replay_settlement_blocked():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "REPLAY_CLAIM")
    c.assess_dispute(ag_id, 1)
    c.authorize_settlement(ag_id, 1)
    c.execute_settlement(ag_id)
    
    with pytest.raises(MockUserError):
        c.execute_settlement(ag_id)

# Scenario 10: OVERSIZED_PAYLOAD_FAIL_CLOSED
def test_scenario_10_oversized_payload_fail_closed():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "OVERSIZED_CLAIM")
    
    url = f"https://raw.githubusercontent.com/{REPO_NAME}/{SCOPE_SHA}/{SCOPE_PATH}"
    MockGl.nondet.web.responses[url] = MockWebResponse(status=200, body=b"X" * 50000)
    c.assess_dispute(ag_id, 1)
    disp = c.get_dispute(ag_id)
    assert disp["ruling"] == contract_mod.RULING_UNRESOLVED
    assert disp["reason_code"] == "SOURCE_TOO_LARGE"

# Scenario 11: UNAUTHORIZED_ACCESS_BLOCKED
def test_scenario_11_unauthorized_access_blocked():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(OTHER_ADDR)
    with pytest.raises(MockUserError):
        c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)

# Scenario 12: PROMPT_INJECTION_CONTAINMENT
def test_scenario_12_prompt_injection_containment():
    c, ag_id = _create_and_fund()
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "INJECTION_TEST")
    
    MockGl.nondet.custom_llm_json = {
        "status": "APPROVED_OVERRIDE",
        "payout": "100%",
        "clauses": [
            {"id": "CORE_TASK", "status": "UNSATISFIED", "material": True}
        ]
    }
    c.assess_dispute(ag_id, 1)
    # Omitted frozen clauses and invented identities cannot authorize a verdict.
    assert c.get_dispute(ag_id)["ruling"] == contract_mod.RULING_UNRESOLVED
