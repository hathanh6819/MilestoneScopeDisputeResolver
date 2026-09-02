import pytest
from test_runtime import prepare

ARBITRATOR = "0x4444444444444444444444444444444444444444"


@pytest.mark.parametrize("ruling,worker_bps", [(1, 10000), (3, 5000), (4, 0)])
def test_fallback_wait_authority_settlement_and_replay(direct_deploy, direct_vm, direct_bob, ruling, worker_bps):
    direct_vm.warp("2026-09-02T00:00:00Z")
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    before = c.get_dispute(aid)
    with pytest.raises(Exception, match="ONLY_FALLBACK_ARBITRATOR"):
        c.resolve_by_arbitrator(aid, 1, ruling, "decision-2026-001")
    assert c.get_dispute(aid) == before
    with direct_vm.prank(ARBITRATOR):
        with pytest.raises(Exception, match="FALLBACK_WAIT_NOT_ELAPSED"):
            c.resolve_by_arbitrator(aid, 1, ruling, "decision-2026-001")
    direct_vm.warp("2026-09-09T01:00:00Z")
    with direct_vm.prank(ARBITRATOR):
        with pytest.raises(Exception, match="STALE_REVISION"):
            c.resolve_by_arbitrator(aid, 0, ruling, "decision-2026-001")
        for invalid in [0, 2, 5, 6]:
            with pytest.raises(Exception, match="INVALID_ARBITRATOR_RULING"):
                c.resolve_by_arbitrator(aid, 1, invalid, "decision-2026-001")
        c.resolve_by_arbitrator(aid, 1, ruling, "decision-2026-001")
    decision = c.get_dispute(aid)
    assert decision["decision_origin"] == "FALLBACK_ARBITRATOR"
    assert decision["arbitration_reference"] == "decision-2026-001"
    assert decision["worker_split_bps"] == worker_bps
    assert decision["client_split_bps"] == 10000 - worker_bps
    assert decision["evidence_digest"] == ""  # Never fabricate validator evidence.
    with pytest.raises(Exception, match="INVALID_LIFECYCLE_STATE"):
        c.assess_dispute(aid, 1)
    c.authorize_settlement(aid, 1)
    c.execute_settlement(aid)
    before = (c.get_agreement(aid), c.get_accounting())
    with direct_vm.prank(ARBITRATOR):
        with pytest.raises(Exception, match="INVALID_LIFECYCLE_STATE"):
            c.resolve_by_arbitrator(aid, 1, 4, "changed-decision")
    assert before == (c.get_agreement(aid), c.get_accounting())


def test_arbitrator_cannot_take_worker_role(direct_deploy, direct_vm):
    c = direct_deploy("contracts/milestone_scope_dispute_resolver.py")
    c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Policy", 3600, ARBITRATOR)
    with direct_vm.prank(ARBITRATOR):
        with pytest.raises(Exception, match="ARBITRATOR_CANNOT_BE_WORKER"):
            c.accept_agreement(1)
    assert c.get_agreement(1)["state"] == 2


def test_consensus_winner_cannot_be_overturned(direct_deploy, direct_vm, direct_bob):
    direct_vm.warp("2026-09-02T00:00:00Z")
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", '{"clauses":[{"id":"C1","status":"SATISFIED","material":true}]}')
    c.assess_dispute(aid, 1)
    direct_vm.warp("2026-09-10T00:00:00Z")
    before = c.get_dispute(aid)
    with direct_vm.prank(ARBITRATOR):
        with pytest.raises(Exception, match="INVALID_LIFECYCLE_STATE"):
            c.resolve_by_arbitrator(aid, 1, 4, "decision-overturn")
    assert c.get_dispute(aid) == before
