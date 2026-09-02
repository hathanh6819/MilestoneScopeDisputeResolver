# Antigravity Build Plan: MilestoneScopeDisputeResolver

## 0. Mission and non-negotiable outcome

Build a production-shaped GenLayer dApp for resolving milestone scope disputes
between a client and a worker/agency. The contract must independently acquire
canonical GitHub evidence at immutable revisions, bind the evidence to one
agreement and milestone, obtain strict consensus on a bounded semantic result,
and deterministically enforce the allowed next action.

The dApp is not complete when the UI renders or a transaction is merely signed.
Completion requires:

```text
exact repository source
-> exact deployed source
-> real Studionet transactions
-> consensus result
-> authoritative state readback
-> verified frontend using the exact address
```

Work only inside:

```text
G:\Genlayer Dino\MilestoneScopeDisputeResolver
```

Do not modify sibling projects. Do not copy their UI, naming, fixtures, state
machine, prompts, or evidence matrix. Security principles may be reused;
mechanisms and product identity must be designed for this domain.

## 1. Mandatory Antigravity skills

Before implementation, inspect the skills installed in Antigravity. The build
must use these skills as named when available:

1. `code-review` for contract/API/frontend review.
2. `debug` whenever a test, schema load, transaction, consensus call, wallet
   action, or browser flow fails.
3. `adversarial-audit` for the threat-driven multi-transaction audit.

Skill usage is a release artifact. Create `docs/skill-review-log.md` and record:

```text
skill name
date/checkpoint
scope reviewed
findings
fix commit
regression test
remaining limitation
```

If an exact skill is unavailable, do not claim it was used. Record the missing
skill and run the equivalent checklist manually under a clearly labeled
`MANUAL FALLBACK REVIEW`. A missing audit skill is not permission to omit the
audit.

Required skill checkpoints:

| Checkpoint | Required skill | Exit condition |
|---|---|---|
| Architecture frozen | `code-review` | No invalid trust assumptions or unsupported GenLayer types |
| First failing test/runtime error | `debug` | Root cause documented; regression test added before fix |
| Contract locally green | `code-review` | No high/critical finding; all consequential fields bound |
| Threat fixtures ready | `adversarial-audit` | Happy, failure and adversarial combination matrix executed |
| Frontend connected | `code-review` | No mock/fallback verdict; exact address/network used |
| Studionet mismatch/failure | `debug` | Explorer logs and post-state explain the outcome |
| Before submission | all three | Findings closed or explicitly declared as blockers |

## 2. Product definition

### Primary tag

`Dispute Resolution`

### Users

- Client: creates and funds a milestone agreement.
- Worker: accepts the agreement and submits an exact delivery revision.
- Public resolver: may trigger assessment but cannot select or alter evidence.
- Integrator: reads the bounded ruling and final settlement state.

### Core question

Given a scope frozen at one exact Git commit and a delivery frozen at another
exact Git commit in the same registered repository, does the delivered work
satisfy the locked milestone, omit material requirements, or primarily reflect
requirements added after the scope was frozen?

### Why GenLayer

Ordinary contracts can compare hashes and enforce state transitions, but cannot
semantically compare a natural-language scope, acceptance criteria, release
notes, and the actual changed-file summary. GenLayer validators can independently
fetch the canonical immutable sources and agree on a bounded clause-level
classification. Deterministic contract code then derives the operational ruling
and settlement permission.

## 3. Proof obligation and epistemic boundary

The contract may prove only:

```text
At exact GitHub revisions S and D in registered repository R,
the canonical scope clauses and canonical delivery evidence support
a bounded milestone ruling under locked policy version P.
```

It must not claim to prove:

- authorship merely because a party supplied a URL;
- off-chain labor, intent, quality beyond the stated criteria, or legal breach;
- that GitHub itself is uncompromised;
- payment when no real value transfer occurred;
- completeness when fetched evidence was missing, oversized, malformed, or
  truncated.

Positive outcomes require all of these hard gates:

```text
registered repository identity
+ exact scope commit verified by GitHub Commit API
+ exact delivery commit verified by GitHub Commit API
+ scope and delivery commits belong to the same repository
+ fetched bytes are non-empty and within explicit limits
+ validator consensus covers every consequential clause/result field
+ dispute is in the correct revision and lifecycle phase
+ settlement authorization is unused
```

Any false, unknown, missing, malformed, oversized, or inconsistent prerequisite
must route to a non-paying/non-settling state.

## 4. Canonical evidence architecture

Callers supply identifiers, never fact JSON:

```text
repository: owner/repo
scope_commit: exact 40-character SHA
scope_path: e.g. SCOPE.md
delivery_commit: exact 40-character SHA
delivery_notes_path: e.g. DELIVERY.md
optional pull_request_number
```

The contract constructs allowlisted canonical endpoints:

```text
https://api.github.com/repos/{owner}/{repo}/git/commits/{scope_sha}
https://api.github.com/repos/{owner}/{repo}/git/commits/{delivery_sha}
https://raw.githubusercontent.com/{owner}/{repo}/{scope_sha}/{scope_path}
https://raw.githubusercontent.com/{owner}/{repo}/{delivery_sha}/{delivery_notes_path}
https://api.github.com/repos/{owner}/{repo}/compare/{scope_sha}...{delivery_sha}
```

If a PR is used, construct its API URL from the already registered repository;
never accept an arbitrary PR URL. Verify base/head repository and exact SHA.

For every source:

- inspect the full byte length before decoding;
- never silently slice or truncate;
- reject oversized evidence with `SOURCE_TOO_LARGE`;
- decode strictly or return `SOURCE_INVALID_ENCODING`;
- compute SHA-256 from exactly the fetched bytes;
- store canonical source identity, byte length and digest;
- do not invoke the LLM until all deterministic identity checks pass.

Use conservative per-source and total-context limits compatible with GenVM.
Document the exact numbers in `SPEC.md` and test boundary-1, boundary, and
boundary+1.

## 5. Original mechanism and anti-clone statement

This project must not become a renamed one-shot verifier. Its mechanism is a
two-party, version-frozen dispute protocol with clause-level persistence and a
deterministic settlement authorization:

```text
bilateral agreement
-> immutable scope freeze
-> delivery revision
-> optional acceptance or dispute
-> clause-level canonical comparison
-> revision-bound ruling
-> single-use settlement authorization
-> terminal settlement
```

Before coding, create `docs/originality.md` comparing this design against at
least:

- `ReleaseWorkflowPolicyGate`;
- `CanonicalSecurityAdvisoryRevocationLedger`;
- `OpenSourceMilestoneEscrow` if present locally;
- the nearest external dispute/escrow reference found during research.

Compare proof obligation, acquisition, leader task, validator task, consensus
fields, lifecycle, persistence, economic consequence, replay and recovery.
If the abstract graph is merely renamed, redesign before implementation.

## 6. Recommended state model

Use explicit string constants or bounded numeric constants consistently.

Agreement states:

```text
DRAFT
AWAITING_ACCEPTANCE
ACTIVE
DELIVERY_SUBMITTED
ACCEPTED
DISPUTED
ASSESSED
SETTLEMENT_AUTHORIZED
SETTLED
CANCELLED
```

Assessment result enums:

```text
DELIVERED
PARTIAL
OUT_OF_SCOPE_CHANGE
NOT_DELIVERED
UNRESOLVED
```

Clause result enums:

```text
SATISFIED
PARTIALLY_SATISFIED
UNSATISFIED
ADDED_AFTER_FREEZE
NOT_EVALUABLE
```

Failure reason enums must be bounded, for example:

```text
SOURCE_UNAVAILABLE
SOURCE_TOO_LARGE
SOURCE_EMPTY
SOURCE_INVALID_ENCODING
COMMIT_IDENTITY_MISMATCH
REPOSITORY_BINDING_MISMATCH
COMPARE_RESPONSE_INVALID
CONSENSUS_RESULT_INVALID
CONSENSUS_INVARIANT_FAILED
STALE_REVISION
INVALID_LIFECYCLE_STATE
```

Persist flattened records using workspace-supported GenLayer storage types.
Avoid custom storage classes. Store at least:

- agreement and milestone IDs;
- client and worker;
- repository, scope SHA/path, delivery SHA/path;
- amount/deposit accounting if custody is enabled;
- locked policy version and required criteria count;
- dispute revision and supersedes pointer;
- per-clause normalized identifier and bounded result;
- source byte lengths and digests;
- aggregate evidence digest;
- ruling, split band and reason code;
- attempt count, settlement authorization and consumed flag.

## 7. Contract API draft

Keep public signatures flat and Studio-compatible. Validate exact names during
implementation rather than forcing unsupported annotations.

Suggested writes:

```text
create_agreement(repository, scope_commit, scope_path, policy_text, amount)
accept_agreement(agreement_id)
fund_agreement(agreement_id)                 # only if real custody is supported
submit_delivery(agreement_id, delivery_commit, delivery_notes_path, pr_number)
accept_delivery(agreement_id)
open_dispute(agreement_id, claim_code)
assess_dispute(agreement_id, expected_revision)
authorize_settlement(agreement_id, expected_revision)
execute_settlement(agreement_id)
cancel_expired_agreement(agreement_id)
retry_assessment(agreement_id, expected_revision)
```

Suggested views:

```text
get_agreement(agreement_id)
get_dispute(agreement_id, revision)
get_clause_result(agreement_id, revision, clause_index)
get_source_receipt(agreement_id, revision, source_index)
get_accounting(agreement_id)
get_counts()
```

Do not allow a public caller to continually append evidence and block
settlement. Evidence identity freezes at delivery/dispute creation. Reassessment
creates a bounded new revision with `supersedes`; stale revisions cannot execute.

## 8. Consensus design

Keep all web and LLM nondeterminism inside a local function passed through the
GenLayer consensus primitive. The inner function must not access storage.

Validators should independently:

1. Fetch and validate both commit identities.
2. Fetch the exact scope and delivery bytes.
3. Fetch a bounded canonical compare response or a safe reduced canonical fact
   source; reject if its complete response exceeds limits.
4. Compute source digests.
5. Extract a bounded set of scope clauses.
6. Classify each clause using only bounded enums.
7. Return exact normalized clause IDs/results and bounded diagnostic codes.

Contract code must validate the returned schema and deterministically derive the
final ruling. Do not ask the model to choose arbitrary payout amounts.

Example deterministic mapping, to be finalized in `SPEC.md`:

```text
all required clauses SATISFIED                       -> DELIVERED
only clauses added after scope freeze are missing    -> OUT_OF_SCOPE_CHANGE
some frozen clauses PARTIALLY_SATISFIED              -> PARTIAL
one or more material frozen clauses UNSATISFIED      -> NOT_DELIVERED
any mandatory source/result UNKNOWN or invalid       -> UNRESOLVED
```

If settlement bands are used, derive them from the ruling:

```text
DELIVERED            -> worker 100%, client 0%
OUT_OF_SCOPE_CHANGE  -> worker 100%, client 0%
PARTIAL              -> fixed policy band, e.g. worker 50%, client 50%
NOT_DELIVERED        -> worker 0%, client 100%
UNRESOLVED           -> no transfer; retry/recovery only
```

The exact bands must be locked when the agreement is created and cannot be
changed during dispute.

## 9. Consensus Binding Matrix

Create the full matrix in `SPEC.md`. Minimum fields:

| Field | Origin | Persisted | Consequence | Binding |
|---|---|---:|---|---|
| repository | deterministic agreement | yes | source authority | exact |
| scope SHA/path | caller identifier + GitHub verification | yes | frozen scope | exact |
| delivery SHA/path | caller identifier + GitHub verification | yes | reviewed delivery | exact |
| source lengths/digests | validator fetched bytes | yes | provenance/integrity | exact |
| normalized clause ID | semantic extraction | yes | result indexing | exact |
| clause result | semantic classification | yes | final ruling | exact |
| material flag | locked scope or bounded classification | yes | ruling | exact |
| result counts | derived | yes | invariant | recomputed |
| ruling | deterministic | yes | settlement | recomputed |
| dispute revision | deterministic state | yes | stale guard | exact |
| split band | deterministic policy | yes | value transfer | recomputed |

Add differential tests that mutate one consequential field at a time and prove
the validator/contract rejects the inconsistent result.

## 10. Custody capability gate

Do not promise escrow until real value behavior is proven on the target runtime.

Checkpoint A:

- confirm the current GenLayer runner supports the intended payable input and
  transfer primitive;
- write the smallest direct test for deposit and payout/refund;
- verify balance/accounting before integrating custody into the main contract.

If supported, enforce:

```text
deposited == worker_paid + client_refunded + remaining_locked
worker_paid + client_refunded <= deposited
terminal settlement executes at most once
failed/unresolved assessment transfers nothing
stale authorization transfers nothing
late verdict after timeout recovery is economically inert
```

If the hosted runtime cannot prove real transfers, do not add fake balances,
mock payout, or frontend simulation. Change the product scope explicitly to a
`settlement authorization resolver`, expose claimable deterministic amounts,
and state that an external compatible escrow consumes the authorization. This
is a product decision and submission description change, not a hidden fallback.

## 11. Repository structure

```text
MilestoneScopeDisputeResolver/
|-- contracts/
|   `-- milestone_scope_dispute_resolver.py
|-- tests/
|   |-- conftest.py
|   |-- unit/
|   |-- regression/
|   |-- adversarial/
|   `-- integration/
|-- frontend/
|   |-- src/
|   |   |-- app/ or pages/
|   |   |-- components/
|   |   |-- lib/genlayer.ts
|   |   `-- contracts/
|   `-- package.json
|-- samples/
|-- scripts/
|-- deployments/
|   `-- studionet.json
|-- docs/
|   |-- architecture.md
|   |-- threat-model.md
|   |-- originality.md
|   |-- consensus-binding-matrix.md
|   |-- skill-review-log.md
|   `-- release-evidence.md
|-- README.md
|-- SPEC.md
|-- gltest.config.yaml
|-- pyproject.toml
`-- .gitignore
```

Never commit `.env`, private keys, wallet mnemonics, API secrets, generated
artifacts, node modules or caches.

## 12. Contract implementation rules

The deployable Python file must start exactly with the workspace-approved three
header lines from `G:\Genlayer Dino\CONTRACT.md`. Before deployment:

- pure ASCII source;
- imports limited to approved standard modules;
- class name `Contract`, inheriting `gl.Contract`;
- flattened supported storage types only;
- bounded strings, arrays, clauses, attempts and revisions;
- validate before any mutation;
- no storage access inside nondeterministic consensus function;
- explicit failure codes;
- no truncation;
- strict consensus on all consequential semantic fields;
- deterministic final ruling and settlement band;
- replay and stale-revision protection on every terminal effect.

## 13. Required local test plan

### Static and shape tests

- exact runner/dependency/import header;
- ASCII scan;
- AST/compile pass;
- schema/public API shape;
- unsupported storage/import rejection;
- limits and enums match `SPEC.md`.

### Happy path

- create -> accept -> fund (if enabled) -> submit -> accept -> settle;
- create -> accept -> submit -> dispute -> assess `DELIVERED` -> settle;
- canonical sources produce stored exact digests and expected state.

### Failure paths

- GitHub 404/429/500/timeout;
- missing commit, wrong SHA, wrong repository;
- empty, malformed, undecodable and oversized source;
- compare response too large;
- invalid path, traversal, arbitrary URL attempt;
- malformed/unknown LLM output;
- validator disagreement;
- wrong caller and invalid lifecycle transition;
- insufficient/wrong deposit if custody is enabled.

All failure tests assert both return/reason and complete post-state no-mutation.

### Conflict paths

- delivery commit does not descend from the scope commit;
- scope change exists only after freeze;
- PR base/head belongs to another repository;
- contradictory clause results/counts;
- duplicate dispute for the same revision;
- two assessment attempts race; stale revision cannot overwrite current state;
- client acceptance races with dispute opening;
- timeout recovery races with late assessment.

### Replay paths

- duplicate submission;
- repeat assessment after terminal ruling;
- repeat settlement/payout/refund;
- reuse evidence identity across agreements;
- reuse settlement authorization across revisions;
- reuse stale transaction after supersession.

### Recovery paths

- source unavailable -> same frozen evidence can be retried;
- consensus invalid -> retry increments attempt but does not rewrite evidence;
- bounded retry exhaustion -> role-balanced timeout resolution;
- inactive party timeout without rewarding the defaulting party;
- late verdict after economic recovery cannot reopen or transfer.

### Prompt and semantic adversarial tests

- prompt injection inside scope and delivery notes;
- safe text first, unsafe/missing requirement after old byte boundary;
- Unicode/control-character delimiter tricks;
- clause omission by leader;
- plausible wrong leader result independently falsified;
- one-field differential mutations for clause text, result, count, digest,
  ruling, revision and split band;
- self-authored JSON pretending to be GitHub evidence;
- valid digest for the wrong agreement/object/version.

## 14. Complete adversarial audit definition

Do not call failure tests alone an adversarial audit. The mandatory audit is:

```text
happy-path reachability
+ isolated failure safety
+ multi-input and multi-transaction attack sequences
+ invariant/state readback after every step
```

Use `adversarial-audit` to execute at least these sequences:

1. Create -> submit valid delivery -> dispute -> assess -> settle -> replay.
2. Create -> oversized evidence -> assess failure -> retry -> recovery.
3. Create -> two dispute/assessment revisions -> finalize newer -> execute stale.
4. Create -> unauthorized actor calls every privileged method in sequence.
5. Create -> dispute -> timeout recovery -> late positive verdict -> settle retry.
6. Deposit -> partial ruling -> settlement -> refund/payout replay, if custody.
7. Prompt injection + contradictory model fields + valid-looking wrong digest.

For every transaction record:

```text
caller
method and arguments
attached value
pre-state
transaction/result
post-state
invariant checked
```

No audit PASS if only return strings are checked.

## 15. Debug protocol

Whenever anything fails, invoke `debug` and follow this order:

1. Preserve the failing input, transaction hash and logs.
2. Classify the layer: frontend, wallet, SDK, RPC, schema, GenVM, web fetch,
   consensus, deterministic invariant, storage or transfer.
3. Reproduce with the smallest direct-contract test.
4. Add a failing regression test before changing implementation.
5. Fix the root cause; do not weaken the assertion or introduce a mock fallback.
6. Run the focused test, then full suite.
7. On Studionet, read state from the exact address after finality.
8. Record the incident and fix in `docs/skill-review-log.md`.

Never treat `FINALIZED` alone as business success. Confirm GenVM result,
consensus result, method return and authoritative post-state.

## 16. Code-review protocol

Invoke `code-review` with explicit scopes:

### Contract review

- authority and object/version binding;
- all positive-state prerequisites;
- mutation ordering;
- strict consensus coverage;
- state/count reconciliation;
- lifecycle/revision/replay;
- custody arithmetic and terminal exclusivity;
- liveness and race safety;
- source bounds with no silent truncation.

### Test review

- tests call the real contract instance;
- negative tests assert no mutation/accounting change;
- mocks model only external nondeterminism, not a separate fake contract;
- every old rejection lesson maps to a regression test;
- adversarial combinations are sequences, not isolated unit cases.

### Frontend review

- no mock data or fallback verdict;
- no private key or LLM secret;
- wallet/network guard;
- exact deployed address and ABI/schema;
- waits for finality and consensus;
- reads state again before showing success;
- displays failure/retry/stale/terminal states accurately;
- Explorer links point to exact contract and transaction.

All high and critical findings are blockers. Medium findings affecting evidence,
money, authorization, replay, recovery or user-visible truth are also blockers.

## 17. Frontend information architecture

Build each major function as its own route. Do not create one giant dashboard.

Suggested routes:

```text
/                         Home
/agreements/new           Create agreement
/agreements               My agreements
/agreements/[id]          Agreement detail and timeline
/agreements/[id]/accept   Worker acceptance
/agreements/[id]/fund     Fund escrow (only if real custody enabled)
/agreements/[id]/deliver  Submit exact delivery revision
/agreements/[id]/review   Client acceptance or dispute choice
/agreements/[id]/dispute  Open dispute
/agreements/[id]/resolve  Trigger/read assessment
/agreements/[id]/settle   Execute/read settlement
/evidence/[id]            Canonical sources, digests and transaction evidence
```

Visual identity: professional contractual workspace using slate/graphite,
muted amber and warm off-white. Use clause cards, a revision timeline and a
two-party status rail. Do not copy layouts, gradients, iconography or component
structure from prior projects.

Every write screen must show:

```text
wallet/network check
-> explicit parameters and value
-> wallet confirmation
-> submitted tx hash
-> consensus/finality state
-> authoritative contract readback
-> Explorer link
```

## 18. Frontend implementation requirements

- Use a maintained React stack already supported by the workspace (Vite or
  Next.js), TypeScript and `genlayer-js`.
- Centralize network and contract configuration.
- Generate or maintain exact method typing from deployed schema.
- Never use localStorage as protocol truth.
- Refresh views from contract state after every finalized write.
- Distinguish transport error, rejected transaction, consensus disagreement,
  unresolved business result and successful terminal action.
- Provide accessible labels, keyboard navigation, loading/empty/error states,
  mobile layouts and reduced-motion behavior.
- Add unit/component tests and browser flows against a local deterministic test
  environment, followed by a live smoke test against the deployed address.

## 19. Build phases and gates

### Phase 1: Design only

Deliver:

- `docs/architecture.md`;
- `docs/threat-model.md`;
- `docs/originality.md`;
- initial `SPEC.md` and binding matrix;
- custody capability decision.

Run `code-review`. Do not code until GO/NO-GO passes.

### Phase 2: Contract skeleton and deterministic state machine

Implement storage, roles, lifecycle, bounds, revision and replay logic without
LLM/web calls. Write direct tests first.

### Phase 3: Canonical acquisition and consensus

Add GitHub endpoint construction, complete-response limits, exact SHA/repository
binding, digests, clause consensus and deterministic ruling derivation.

### Phase 4: Local verification

Run compile, ASCII, full Direct Mode tests and coverage. Invoke `code-review`,
then `adversarial-audit`. Use `debug` for every failure. Do not proceed with an
open high/critical finding.

### Phase 5: Deployment handoff

Stop and report to the user:

```text
exact contract path
source SHA-256
constructor inputs
attached deployment value
test summary
known limitations
```

The user deploys manually. Do not deploy automatically.

### Phase 6: Studionet lifecycle verification

After the user supplies the address:

1. Confirm deployment `FINALIZED / SUCCESS / Accepted`.
2. Compare Explorer source with local source and SHA expectations.
3. Read initial state.
4. Execute happy, failure, conflict/replay and recovery scenarios.
5. If custody is claimed, execute real deposit and deterministic settlement,
   then verify balances/accounting and recipient.
6. Record every hash and post-state in `docs/release-evidence.md`.

Use `debug` immediately for any mismatch. Any source edit requires a new
deployment and fresh lifecycle.

### Phase 7: Frontend build and connection

Only after the public API is stable, build all routes and connect the exact
Studionet address. Run frontend `code-review`, component tests, production build
and browser flow verification.

### Phase 8: Hosting and final audit

Deploy frontend only when requested and credentials/target are provided. Verify
the production URL, wallet connection, Explorer links and live state. Invoke all
three required skills for the final release review.

## 20. Studionet evidence matrix

Prepare this matrix before deployment and fill it only from real transactions:

| ID | Scenario | Expected state/effect | Tx hash | Consensus/GenVM | Readback | Status |
|---|---|---|---|---|---|---|
| LIVE-01 | Deploy exact source | empty initial state | | | | NOT RUN |
| LIVE-02 | Create/accept agreement | ACTIVE | | | | NOT RUN |
| LIVE-03 | Real funding if enabled | exact deposit/accounting | | | | NOT RUN |
| LIVE-04 | Submit bounded delivery | DELIVERY_SUBMITTED | | | | NOT RUN |
| LIVE-05 | Happy assessment | actionable bounded ruling | | | | NOT RUN |
| LIVE-06 | Oversized evidence | UNRESOLVED/SOURCE_TOO_LARGE, no digest/effect | | | | NOT RUN |
| LIVE-07 | Wrong repository/SHA | binding failure, no mutation | | | | NOT RUN |
| LIVE-08 | Stale revision | cannot overwrite/settle | | | | NOT RUN |
| LIVE-09 | Settlement | exact single effect | | | | NOT RUN |
| LIVE-10 | Replay settlement | no mutation/no transfer | | | | NOT RUN |
| LIVE-11 | Recovery/timeout | valid forward path | | | | NOT RUN |
| LIVE-12 | Unauthorized sequence | no privileged mutation | | | | NOT RUN |

Do not replace `NOT RUN` with `PASS` from local mocks or screenshots alone.

## 21. Documentation and submission artifacts

`README.md` must explain:

- problem and why GenLayer;
- proof obligation and limitations;
- canonical evidence and trust boundary;
- lifecycle and public methods;
- local test commands;
- deployed address and production URL only after verification;
- link to exact release evidence.

`docs/release-evidence.md` must include:

- repository commit;
- contract source SHA-256;
- deployed address and deployment tx;
- Explorer source parity;
- every major call with caller/value/pre-state/hash/result/post-state;
- final accounting/authorization state;
- frontend commit and URL;
- honest status: `NOT DEPLOYED`, `DEPLOYED`, `VERIFIED`, or `BLOCKED`.

## 22. Definition of done

Do not say `ready`, `complete`, or `verified` until all applicable boxes pass:

```text
[ ] architecture and originality reviewed
[ ] proof obligation matches evidence capability
[ ] interested party cannot manufacture canonical truth
[ ] exact object/version/repository binding enforced
[ ] all consequential semantic fields consensus-bound
[ ] no truncation or positive-state bypass
[ ] deterministic lifecycle/revision/replay/recovery enforced
[ ] custody capability proven or honestly removed from claim
[ ] complete happy/failure/adversarial combination audit passes
[ ] code-review findings closed
[ ] debug regressions retained
[ ] contract compile/ASCII/Direct Mode suite passes
[ ] exact source manually deployed
[ ] real Studionet lifecycle and post-state readback pass
[ ] frontend uses exact address and no mocks/fallback verdicts
[ ] production browser flow verified
[ ] release evidence committed and reviewer-verifiable
```

## 23. Immediate first actions for Antigravity

1. Read `G:\Genlayer Dino\CONTRACT.md` and
   `G:\Genlayer Dino\thamkhao.md` completely.
2. Inventory this directory and preserve existing user files.
3. Discover the exact installed `code-review`, `debug`, and
   `adversarial-audit` skills; record availability.
4. Complete the design documents and originality comparison.
5. Decide the custody capability gate with a minimal runtime test.
6. Present the architecture and GO/NO-GO result before implementing the full
   contract.
7. Build through Phase 4, then stop and tell the user exactly when manual
   deployment is required.

