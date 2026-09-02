"""Observe actual SDK EthSend encoding, NOT real network balance transfers."""
import json
import pytest
from test_runtime import prepare


@pytest.mark.parametrize("status,worker", [("SATISFIED",101), ("PARTIALLY_SATISFIED",50), ("UNSATISFIED",0)])
def test_nonzero_sdk_message_splits_and_replay(direct_deploy, direct_vm, direct_bob, status, worker):
    direct_vm.value = 101
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.value = 0
    requests = []
    def observe(vm, request):
        if "EthSend" in request:
            requests.append(request["EthSend"])
            return {"ok": None}
        return None
    direct_vm._gl_call_hook = observe
    direct_vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": [{"id":"C1", "material":True, "status":status}]}))
    c.assess_dispute(aid, 1)
    c.authorize_settlement(aid, 1)
    c.execute_settlement(aid)
    agreement = c.get_agreement(aid)
    actual = {str(item["address"]).lower(): int(item["value"]) for item in requests}
    expected = {}
    if worker: expected[agreement["worker"].lower()] = worker
    if 101 - worker: expected[agreement["client"].lower()] = 101 - worker
    assert actual == expected
    assert all(item["calldata"] == b"" for item in requests)
    accounting = c.get_accounting()
    assert accounting == {"total_deposited_wei":"101", "total_reserved_wei":"0", "total_paid_wei":str(worker), "total_refunded_wei":str(101-worker)}
    count = len(requests)
    with pytest.raises(Exception): c.execute_settlement(aid)
    with pytest.raises(Exception): c.cancel_expired_agreement(aid)
    assert c.get_accounting() == accounting
    assert len(requests) == count


@pytest.mark.xfail(strict=True, raises=AssertionError, reason="gltest 0.29.2 cannot execute SDK spawn_sandbox validator; requires real GenVM")
def test_validator_conflict_rejects_different_full_result(direct_deploy, direct_vm, direct_bob):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", '{"clauses":[{"id":"C1","material":true,"status":"SATISFIED"}]}')
    c.assess_dispute(aid, 1)
    assert direct_vm.run_validator() is True
    direct_vm._llm_mocks.clear()
    direct_vm.mock_llm("impartial dispute arbitrator", '{"clauses":[{"id":"C1","material":true,"status":"UNSATISFIED"}]}')
    assert direct_vm.run_validator() is False
