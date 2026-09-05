# MilestoneScopeDisputeResolver

Protocol v3 validates repository, commit, path, policy, deadline, arbitrator,
agreement, lifecycle and caller conditions before attached GEN is recorded as a
deposit or reserve. Rejected payable calls roll back without changing agreement
state or custody accounting. Real GenLayer Direct Mode regressions exercise these
failure paths through the contract boundary.

Status: **deployed on Studionet; canonical GitHub dispute lifecycle verified**.

- Frontend: https://milestonescopedisputeresolver.pages.dev/
- Contract: https://explorer-studio.genlayer.com/address/0x97b4EE3464132f5f1E172E76e78A6B06827A9df2
- On-chain evidence log: [docs/test-evidence-log.md](docs/test-evidence-log.md)

This Intelligent Contract resolves milestone disputes against a frozen, machine-readable scope at an exact Git commit. It never accepts contributor-authored URLs, hashes, delivery notes or test claims as truth.

Run every Python suite with `python scripts/run_all_tests.py`. From `frontend/`,
run `npm ci`, `npm test`, and `npm run build`.

## Evidence and decision model

Each validator independently constructs GitHub-controlled endpoints from the stored `owner/repository`, frozen commit and delivery commit. The contract verifies:

- both Git commit identities and complete recursive Git trees;
- at most 8 regular files per tree, 32 entries, 8 commits and bounded response sizes;
- no symlinks, submodules, Git LFS pointers, binary text or truncated trees;
- every fetched raw file against its Git blob SHA-1 and declared size;
- delivery ancestry, final compared head and optional merged PR identity;
- the later scope manifest before recognizing added-after-freeze clauses.

The frozen scope file must be strict JSON:

```json
{"clauses":[{"id":"CLAUSE_ID","text":"Acceptance requirement","material":true}]}
```

Clause IDs and materiality are immutable. The model must return every frozen clause exactly once and cannot invent, omit, demote, duplicate or classify one as added-after-freeze. The model receives the complete bounded contents of both repository snapshots; release notes remain untrusted claims.

All accepted evidence, identities, policy and acquisition receipts are serialized canonically and SHA-256 bound. Any unavailable, oversized, malformed, incomplete or conflicting input produces a non-paying `UNRESOLVED` result.

## Lifecycle and custody

- Client creates and funds an agreement, locking scope, policy, deadline and an independent fallback arbitrator.
- A worker accepts all locked terms and submits an exact delivery commit plus optional merged PR number.
- Either party can open a dispute.
- Validator consensus maps bounded clause statuses to deterministic 100/0, 50/50 or 0/100 settlement bands.
- An unresolved dispute can be retried without changing its immutable evidence identity.
- After seven days from the later of deadline or dispute opening, the locked non-party arbitrator may sign one of the same three split bands. This is explicitly recorded as `FALLBACK_ARBITRATOR`, never as validator evidence.
- Settlement uses a separate revision-bound authorization and a single-use execution. Client timeout refund is available only before delivery.

## Frontend

The frontend uses `genlayer-js` 1.1.8 and a browser wallet. It has no mock records, fake wallet, random hash, demo transaction, local address override or substitute evidence digest.

For a new deployment, copy `frontend/.env.example` to `frontend/.env` and set:

```text
VITE_CONTRACT_ADDRESS=0x...
```

The app verifies protocol name/version, reads all displayed state from Studionet, waits for a finalized successful execution receipt, then reads the affected record back. An uncertain transaction hash is retained for receipt checking instead of automatically resending it.

## Local verification

```powershell
python scripts/verify_local.py
$env:PYTHONIOENCODING='utf-8'
genvm-lint check contracts/milestone_scope_dispute_resolver.py
cd frontend
npm ci
npm audit
npm run build
```

Current local results are recorded in [docs/test-evidence-log.md](docs/test-evidence-log.md). Mock-backed Python tests are labeled as such. SDK Direct Mode proves schema/runtime behavior and emitted transfer payloads, but it is not proof of activated child transfers or wallet balance changes on Studionet.

## Deployment verification

The deployed source matches the reviewed contract SHA-256, the production frontend is bound to that address, and agreement `2` completed the canonical GitHub acquisition, assessment, authorization and zero-value settlement path on Studionet. Exact revisions, transaction hashes, verdict, evidence digest and final state are recorded in [docs/test-evidence-log.md](docs/test-evidence-log.md).

The zero-value lifecycle does not prove activated native-asset child transfers. Before representing nonzero custody as production-verified, separately verify child transaction IDs, child receipts, accounting and before/after balances on Studionet.
