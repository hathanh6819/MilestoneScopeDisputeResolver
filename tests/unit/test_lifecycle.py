import pytest
from conftest import (
    MockGl, MockUserError, MockAddress,
    CLIENT_ADDR, WORKER_ADDR, OTHER_ADDR,
    REPO_NAME, SCOPE_SHA, DELIVERY_SHA, SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT
)
import milestone_scope_dispute_resolver as contract_mod

Contract = contract_mod.Contract

def setup_function():
    MockGl.reset()

def test_create_agreement_success():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = 1000000000000000000  # 1.0 GEN
    
    ag_id = c.create_agreement(
        repository=REPO_NAME,
        scope_commit=SCOPE_SHA,
        scope_path=SCOPE_PATH,
        policy_text=POLICY_TEXT,
        deadline_seconds=3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    assert ag_id == 1
    ag = c.get_agreement(ag_id)
    assert ag["client"].lower() == CLIENT_ADDR.lower()
    assert ag["state"] == contract_mod.STATE_AWAITING_ACCEPTANCE
    assert ag["deposit_wei"] == "1000000000000000000"
    
    acc = c.get_accounting()
    assert acc["total_deposited_wei"] == "1000000000000000000"
    assert acc["total_reserved_wei"] == "1000000000000000000"

def test_create_agreement_invalid_arguments():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    
    # Invalid repository
    with pytest.raises(MockUserError, match="INVALID_REPOSITORY_NAME"):
        c.create_agreement("invalidrepo", SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
        
    # Invalid commit SHA
    with pytest.raises(MockUserError, match="INVALID_SCOPE_COMMIT_SHA"):
        c.create_agreement(REPO_NAME, "badsha", SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
        
    # Path traversal rejected
    with pytest.raises(MockUserError, match="INVALID_SCOPE_PATH"):
        c.create_agreement(REPO_NAME, SCOPE_SHA, "../secret.txt", POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
        
    # Invalid deadline (too short)
    with pytest.raises(MockUserError, match="INVALID_DEADLINE_SECONDS"):
        c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 100, fallback_arbitrator="0x4444444444444444444444444444444444444444")

def test_accept_agreement_lifecycle():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    # Client cannot accept as worker
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    with pytest.raises(MockUserError, match="CLIENT_CANNOT_BE_WORKER"):
        c.accept_agreement(ag_id)
        
    # Worker accepts
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_ACTIVE
    assert ag["worker"].lower() == WORKER_ADDR.lower()
    
    # Second accept rejected
    with pytest.raises(MockUserError, match="INVALID_LIFECYCLE_STATE"):
        c.accept_agreement(ag_id)

def test_fund_agreement():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    # Additional funding by Client
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = 500000000000000000
    c.fund_agreement(ag_id)
    
    ag = c.get_agreement(ag_id)
    assert ag["deposit_wei"] == "500000000000000000"
    
    # Non-client cannot fund
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    with pytest.raises(MockUserError, match="ONLY_CLIENT_CAN_FUND"):
        c.fund_agreement(ag_id)

def test_submit_delivery():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    
    # Non-worker cannot submit
    MockGl.message.sender = MockAddress(OTHER_ADDR)
    with pytest.raises(MockUserError, match="ONLY_WORKER_CAN_SUBMIT_DELIVERY"):
        c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
        
    # Delivery sha == scope sha rejected
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    with pytest.raises(MockUserError, match="DELIVERY_SHA_CANNOT_EQUAL_SCOPE_SHA"):
        c.submit_delivery(ag_id, SCOPE_SHA, DELIVERY_PATH, 42)
        
    # Valid delivery submission
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_DELIVERY_SUBMITTED
    deliv = c.get_delivery(ag_id)
    assert deliv["delivery_commit"] == DELIVERY_SHA
    assert deliv["delivery_pr_number"] == 42

def test_client_direct_acceptance_settles_immediately():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    MockGl.message.value = 1000000000000000000
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    # Client accepts delivery
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.accept_delivery(ag_id)
    
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_SETTLED
    assert len(MockGl.transfers) == 1
    assert MockGl.transfers[0]["to"].lower() == WORKER_ADDR.lower()
    assert MockGl.transfers[0]["value"] == 1000000000000000000
    
    acc = c.get_accounting()
    assert acc["total_paid_wei"] == "1000000000000000000"
    assert acc["total_reserved_wei"] == "0"

def test_open_dispute():
    c = Contract()
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    ag_id = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 3600, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(ag_id)
    c.submit_delivery(ag_id, DELIVERY_SHA, DELIVERY_PATH, 42)
    
    # Client opens dispute
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    rev = c.open_dispute(ag_id, "MISSING_STRIPE_WEBHOOK")
    assert rev == 1
    
    ag = c.get_agreement(ag_id)
    assert ag["state"] == contract_mod.STATE_DISPUTED
    disp = c.get_dispute(ag_id)
    assert disp["active_revision"] == 1
    assert disp["claim_code"] == "MISSING_STRIPE_WEBHOOK"
