import pytest
import milestone_scope_dispute_resolver as module
from conftest import (
    MockGl, MockAddress, MockUserError, MockWebResponse, CLIENT_ADDR, WORKER_ADDR,
    REPO_NAME, SCOPE_SHA, DELIVERY_SHA, SCOPE_PATH, DELIVERY_PATH, POLICY_TEXT,
)


def setup_case():
    MockGl.reset()
    c = module.Contract()
    MockGl.message.value = 100
    aid = c.create_agreement(REPO_NAME, SCOPE_SHA, SCOPE_PATH, POLICY_TEXT, 1000, fallback_arbitrator="0x4444444444444444444444444444444444444444")
    MockGl.message.sender = MockAddress(WORKER_ADDR)
    c.accept_agreement(aid)
    c.submit_delivery(aid, DELIVERY_SHA, DELIVERY_PATH, 0)
    MockGl.message.sender = MockAddress(CLIENT_ADDR)
    c.open_dispute(aid, "SCOPE_MISMATCH")
    return c, aid


def test_client_cannot_refund_worker_winning_ruling_after_deadline():
    c, aid = setup_case()
    c.assess_dispute(aid, 1)
    c.authorize_settlement(aid, 1)
    before = (c.get_agreement(aid), c.get_dispute(aid), c.get_accounting(), list(MockGl.transfers))
    MockGl.message_raw["timestamp"] = 3000
    with pytest.raises(MockUserError, match="DELIVERY_PREVENTS_UNILATERAL_REFUND"):
        c.cancel_expired_agreement(aid)
    assert before == (c.get_agreement(aid), c.get_dispute(aid), c.get_accounting(), list(MockGl.transfers))
    c.execute_settlement(aid)
    assert MockGl.transfers == [{"to": WORKER_ADDR, "value": 100}]


@pytest.mark.parametrize("payload", [
    {"clauses": [{"id": "A", "status": "SATISFIED", "material": "false"}]},
    {"clauses": [{"id": "A", "status": "UNKNOWN", "material": True}]},
    {"clauses": [{"id": "A", "status": "SATISFIED", "material": True}] * 17},
    {"clauses": [{"id": "A", "status": "SATISFIED", "material": True}] * 2},
    "broken json",
])
def test_invalid_output_cannot_authorize_or_store_digest(payload):
    c, aid = setup_case()
    MockGl.nondet.custom_llm_json = payload
    before = c.get_accounting()
    c.assess_dispute(aid, 1)
    assert c.get_agreement(aid)["state"] == module.STATE_DISPUTED
    assert c.get_dispute(aid)["evidence_digest"] == ""
    assert c.get_dispute(aid)["clause_count"] == 0
    with pytest.raises(MockUserError):
        c.authorize_settlement(aid, 1)
    assert before == c.get_accounting()
    assert MockGl.transfers == []


def test_fetched_wrong_sha_is_rejected_before_model():
    c, aid = setup_case()
    url = f"https://api.github.com/repos/{REPO_NAME}/git/commits/{SCOPE_SHA}"
    MockGl.nondet.web.responses[url] = MockWebResponse(200, '{"sha":"wrong"}')
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["reason_code"] == "COMMIT_IDENTITY_MISMATCH"
    assert c.get_dispute(aid)["evidence_digest"] == ""
