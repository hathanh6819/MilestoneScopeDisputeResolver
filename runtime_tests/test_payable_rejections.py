import pytest


ARBITRATOR = "0x4444444444444444444444444444444444444444"


def deploy(direct_deploy):
    return direct_deploy("contracts/milestone_scope_dispute_resolver.py")


@pytest.mark.parametrize("repo,commit,path,policy,deadline,arbitrator", [
    ("invalid", "1" * 40, "SCOPE.md", "Policy", 3600, ARBITRATOR),
    ("example/repository", "bad", "SCOPE.md", "Policy", 3600, ARBITRATOR),
    ("example/repository", "1" * 40, "../SCOPE.md", "Policy", 3600, ARBITRATOR),
    ("example/repository", "1" * 40, "SCOPE.md", "", 3600, ARBITRATOR),
    ("example/repository", "1" * 40, "SCOPE.md", "Policy", 1, ARBITRATOR),
    ("example/repository", "1" * 40, "SCOPE.md", "Policy", 3600, "0x" + "0" * 40),
])
def test_invalid_creation_never_changes_custody(direct_deploy, direct_vm, repo, commit, path, policy, deadline, arbitrator):
    c = deploy(direct_deploy)
    before = c.get_accounting()
    refunds = []
    direct_vm._gl_call_hook = lambda vm, request: refunds.append(request["EthSend"]) or {"ok": None} if "EthSend" in request else None
    direct_vm.value = 101
    assert c.create_agreement(repo, commit, path, policy, deadline, arbitrator) == 0
    assert c.get_counts()["agreement_count"] == 0
    assert c.get_accounting() == before
    assert len(refunds) == 1 and int(refunds[0]["value"]) == 101


def test_invalid_funding_preserves_reserve_and_deposit(direct_deploy, direct_vm, direct_bob):
    c = deploy(direct_deploy)
    aid = c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Policy", 3600, ARBITRATOR)
    before_agreement, before_accounting = c.get_agreement(aid), c.get_accounting()
    direct_vm.value = 101
    with direct_vm.prank(direct_bob):
        assert c.fund_agreement(aid) == 0
    assert c.get_agreement(aid) == before_agreement
    assert c.get_accounting() == before_accounting


def test_zero_value_funding_preserves_accounting(direct_deploy):
    c = deploy(direct_deploy)
    aid = c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Policy", 3600, ARBITRATOR)
    before = c.get_accounting()
    with pytest.raises(Exception, match="DEPOSIT_MUST_BE_GREATER_THAN_ZERO"):
        c.fund_agreement(aid)
    assert c.get_accounting() == before


def test_unknown_agreement_with_value_preserves_accounting(direct_deploy, direct_vm):
    c = deploy(direct_deploy)
    before = c.get_accounting()
    direct_vm.value = 101
    assert c.fund_agreement(999) == 0
    assert c.get_counts()["agreement_count"] == 0
    assert c.get_accounting() == before


def test_terminal_agreement_with_value_preserves_accounting(direct_deploy, direct_vm):
    c = deploy(direct_deploy)
    direct_vm.value = 101
    aid = c.create_agreement("example/repository", "1" * 40, "SCOPE.md", "Policy", 600, ARBITRATOR)
    direct_vm.value = 0
    direct_vm.warp("2030-01-01T00:00:00Z")
    c.cancel_expired_agreement(aid)
    before_agreement, before_accounting = c.get_agreement(aid), c.get_accounting()
    direct_vm.value = 77
    assert c.fund_agreement(aid) == 0
    assert c.get_agreement(aid) == before_agreement
    assert c.get_accounting() == before_accounting
