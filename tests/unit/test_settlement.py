import pytest
from conftest import (
    MockGl, MockUserError, MockAddress,
    CLIENT_ADDR, WORKER_ADDR, REPO_NAME, SCOPE_SHA, DELIVERY_SHA,
    SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT
)
import milestone_scope_dispute_resolver as contract_mod

Contract = contract_mod.Contract

def setup_function():
    MockGl.reset()

def _setup_assessed_dispute(ruling_type="DELIVERED"):
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    deposit = 2000000000000000000  # 2.0 GEN
    MockGl.message.value = deposit
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(ag_id, "TEST_DISPUTE")
    
    if ruling_type == "DELIVERED":
        clauses = [{"id": "CLAUSE_1", "status": "SATISFIED", "material": True}, {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}]
    elif ruling_type == "PARTIAL":
        clauses = [{"id": "CLAUSE_1", "status": "PARTIALLY_SATISFIED", "material": True}, {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}]
    elif ruling_type == "NOT_DELIVERED":
        clauses = [{"id": "CLAUSE_1", "status": "UNSATISFIED", "material": True}, {"id": "CLAUSE_2", "status": "SATISFIED", "material": True}]
    else:
        clauses = []
        
    MockGl.nondet.custom_llm_json = {"clauses": clauses}
    c.assess_dispute(ag_id, expected_revision=1)
    return c, ag_id

def test_settle_delivered_100_percent_to_worker():
    c, ag_id = _setup_assessed_dispute("DELIVERED")
    
    # 1. Authorize
    c.authorize_settlement(ag_id, expected_revision=1)
    assert c.is_settleable(ag_id) is True
    
    # 2. Execute
    c.execute_settlement(ag_id)
    
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_SETTLED
    assert len(MockGl.transfers) == 1
    assert MockGl.transfers[0]["to"].lower() == WORKER_ADDR.lower()
    assert MockGl.transfers[0]["value"] == 2000000000000000000
    
    acc = c.get_accounting()
    assert acc["total_paid_wei"] == "2000000000000000000"
    assert acc["total_refunded_wei"] == "0"
    assert acc["total_reserved_wei"] == "0"
    assert int(acc["total_deposited_wei"]) == int(acc["total_paid_wei"]) + int(acc["total_refunded_wei"])

def test_settle_partial_50_50():
    c, ag_id = _setup_assessed_dispute("PARTIAL")
    
    c.authorize_settlement(ag_id, expected_revision=1)
    c.execute_settlement(ag_id)
    
    assert len(MockGl.transfers) == 2
    assert MockGl.transfers[0] == {"to": WORKER_ADDR, "value": 1000000000000000000}
    assert MockGl.transfers[1] == {"to": CLIENT_ADDR, "value": 1000000000000000000}
    
    acc = c.get_accounting()
    assert acc["total_paid_wei"] == "1000000000000000000"
    assert acc["total_refunded_wei"] == "1000000000000000000"
    assert acc["total_reserved_wei"] == "0"

def test_settle_not_delivered_100_percent_to_client():
    c, ag_id = _setup_assessed_dispute("NOT_DELIVERED")
    
    c.authorize_settlement(ag_id, expected_revision=1)
    c.execute_settlement(ag_id)
    
    assert len(MockGl.transfers) == 1
    assert MockGl.transfers[0]["to"].lower() == CLIENT_ADDR.lower()
    assert MockGl.transfers[0]["value"] == 2000000000000000000
    
    acc = c.get_accounting()
    assert acc["total_paid_wei"] == "0"
    assert acc["total_refunded_wei"] == "2000000000000000000"
    assert acc["total_reserved_wei"] == "0"

def test_execute_settlement_single_use_replay_prevention():
    c, ag_id = _setup_assessed_dispute("DELIVERED")
    c.authorize_settlement(ag_id, expected_revision=1)
    c.execute_settlement(ag_id)
    
    # Second call must raise SETTLEMENT_ALREADY_CONSUMED or SETTLEMENT_NOT_AUTHORIZED
    with pytest.raises(MockUserError):
        c.execute_settlement(ag_id)
        
    # Exactly one transfer occurred
    assert len(MockGl.transfers) == 1
