# MilestoneScopeDisputeResolver

Status: **local review complete; Studionet deployment and lifecycle proof pending**.

This Intelligent Contract resolves milestone disputes against a frozen, machine-readable scope at an exact Git commit. It never accepts contributor-authored URLs, hashes, delivery notes or test claims as truth.

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

After deployment copy `frontend/.env.example` to `frontend/.env` and set:

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

## Deployment gate

Do not submit this project from local results alone. Required next steps:

1. Verify source schema through Studionet and deploy this exact file.
2. Set the deployed address in the frontend and rebuild.
3. Run a full Studionet lifecycle with real canonical test repository resources.
4. Verify every parent transaction is finalized and successful.
5. Verify emitted transfer child transaction IDs, child receipts and before/after balances.
6. Publish exact repository revision, contract address and Explorer transaction links.
