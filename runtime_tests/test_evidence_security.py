import json
import re
import pytest
from test_runtime import prepare, evidence_responses

CLAUSES = [{"id": "C1", "text": "Implement validation", "material": True}]


def install(vm, changes=None, added=None):
    vm.clear_mocks()
    data = evidence_responses("example/repository", "1" * 40, "2" * 40, "SCOPE.md", "DELIVERY.md", CLAUSES, added)
    if changes:
        changes(data)
    for url, body in data.items():
        vm.mock_web("^" + re.escape(url) + "$", {"status": 200, "body": body})
    vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": [{"id": "C1", "material": True, "status": "SATISFIED"}]}))


@pytest.mark.parametrize("mutation,reason", [
    ("truncated", "TREE_INCOMPLETE"), ("blob", "BLOB_DIGEST_MISMATCH"),
    ("head", "COMPARE_IDENTITY_OR_COMPLETENESS_FAILED"),
    ("oversize", "SOURCE_TOO_LARGE"), ("symlink", "SYMLINK_OR_SUBMODULE_UNSUPPORTED"),
    ("wrong_repo_sha", "COMMIT_IDENTITY_MISMATCH"),
])
def test_bad_evidence_cannot_pay_then_recovers(direct_deploy, direct_vm, direct_bob, mutation, reason):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    def change(data):
        if mutation in ("truncated", "symlink"):
            url = next(k for k in data if "/git/trees/" in k)
            value = json.loads(data[url])
            if mutation == "truncated": value["truncated"] = True
            else: value["tree"][0]["mode"] = "120000"
            data[url] = json.dumps(value)
        elif mutation in ("blob", "oversize"):
            url = next(k for k in data if k.endswith("/implementation.py"))
            data[url] = "forged content" if mutation == "blob" else "X" * 12001
        elif mutation == "wrong_repo_sha":
            url = next(k for k in data if "/git/commits/" in k)
            value = json.loads(data[url]); value["sha"] = "9" * 40; data[url] = json.dumps(value)
        else:
            url = next(k for k in data if "/compare/" in k)
            value = json.loads(data[url]); value["commits"][-1]["sha"] = "9" * 40; data[url] = json.dumps(value)
    install(direct_vm, change)
    before = c.get_accounting()
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["reason_code"] == reason
    assert c.get_dispute(aid)["evidence_digest"] == ""
    assert c.get_agreement(aid)["state"] == 6
    with pytest.raises(Exception): c.authorize_settlement(aid, 1)
    assert c.get_accounting() == before
    install(direct_vm)
    c.retry_assessment(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 1


@pytest.mark.parametrize("clauses", [[], [{"id": "OTHER", "status": "SATISFIED", "material": True}],
    [{"id": "C1", "status": "SATISFIED", "material": False}],
    [{"id": "C1", "status": "ADDED_AFTER_FREEZE", "material": True}],
    [{"id": "C1", "status": "SATISFIED", "material": True}] * 2])
def test_model_cannot_omit_replace_demote_or_duplicate(direct_deploy, direct_vm, direct_bob, clauses):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": clauses}))
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 5
    assert c.get_dispute(aid)["evidence_digest"] == ""
    assert c.get_dispute(aid)["worker_split_bps"] == 0


def test_added_scope_requires_fetched_later_manifest(direct_deploy, direct_vm, direct_bob):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    install(direct_vm, added=[{"id": "C2", "text": "New requirement", "material": False}])
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["ruling"] == 2
    assert c.get_dispute(aid)["worker_split_bps"] == 10000


@pytest.mark.parametrize("status,ruling,bps", [("SATISFIED",1,10000), ("PARTIALLY_SATISFIED",3,5000), ("UNSATISFIED",4,0), ("NOT_EVALUABLE",5,0)])
def test_frozen_clause_mapping(direct_deploy, direct_vm, direct_bob, status, ruling, bps):
    c, aid = prepare(direct_deploy, direct_vm, direct_bob)
    direct_vm.mock_llm("impartial dispute arbitrator", json.dumps({"clauses": [{"id":"C1", "material":True, "status":status}]}))
    c.assess_dispute(aid, 1)
    assert c.get_dispute(aid)["ruling"] == ruling
    assert c.get_dispute(aid)["worker_split_bps"] == bps
