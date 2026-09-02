# System Architecture: MilestoneScopeDisputeResolver

## 1. Core Architectural Principle: Judgment Authority ≠ Execution Authority

```text
TRUSTWORTHY EVIDENCE CHAIN
  - Registered Repository (owner/repo)
  - Scope Frozen at exact 40-char Git SHA (SCOPE.md)
  - Delivery Frozen at exact 40-char Git SHA (DELIVERY.md)
  - Canonical GitHub API Compare (scope_sha...delivery_sha)
        ↓
BOUNDED MULTI-VALIDATOR AI JUDGMENT
  - Inner nondeterministic function (no storage access)
  - Evaluates every frozen JSON clause against complete bounded repository snapshots
  - Outputs strictly bounded enums (SATISFIED, PARTIALLY_SATISFIED, UNSATISFIED, ADDED_AFTER_FREEZE, NOT_EVALUABLE)
        ↓
CONSEQUENTIAL CONSENSUS BOUNDARY
  - gl.eq_principle.prompt_comparative across independent validators
  - Strict agreement on normalized clause results and diagnostic codes
        ↓
DETERMINISTIC CONTRACT ENFORCEMENT
  - Contract checks: revision valid, lifecycle active, not already settled, authorization unused
  - Derives final operational ruling: DELIVERED, OUT_OF_SCOPE_CHANGE, PARTIAL, NOT_DELIVERED, UNRESOLVED
  - Derives locked split band (e.g. 100/0, 50/50, 0/100)
        ↓
SAFE FAILURE / RECOVERY / CUSTODY
  - Conservation invariant: deposited == worker_paid + client_refunded + remaining_locked
  - Terminal settlement executes strictly once
  - Replay and stale revisions blocked
```

---

## 2. Participant Roles & Epistemic Boundaries

### Roles
- **Client:** Creates agreement, locks scope commit and criteria, funds milestone escrow (if custody enabled), reviews delivery, may accept or open dispute.
- **Worker:** Accepts agreement, commits delivery to repository, submits exact delivery commit SHA and delivery notes path.
- **Public Resolver:** Any caller can invoke `assess_dispute`, but cannot alter evidence or inject arbitrary URLs.
- **Integrator:** Reads authenticated post-state and verified rulings.

### Epistemic Proof Boundary
The contract proves ONLY:
> *At exact GitHub revisions S and D in registered repository R, the canonical scope clauses and canonical delivery evidence support a bounded milestone ruling under locked policy version P.*

The contract does NOT claim to prove off-chain labor, hidden intent, quality beyond explicit criteria, or GitHub platform integrity.

---

## 3. Canonical Evidence Acquisition Pipeline

Callers supply only repository and commit identifiers. The contract autonomously constructs allowlisted URLs:

```text
1. Scope Commit Verification:
   https://api.github.com/repos/{owner}/{repo}/git/commits/{scope_sha}

2. Delivery Commit Verification:
   https://api.github.com/repos/{owner}/{repo}/git/commits/{delivery_sha}

3. Scope Specification Document:
   https://raw.githubusercontent.com/{owner}/{repo}/{scope_sha}/{scope_path}

4. Delivery Release Notes Document:
   https://raw.githubusercontent.com/{owner}/{repo}/{delivery_sha}/{delivery_notes_path}

5. Complete bounded tree and blob acquisition:
   https://api.github.com/repos/{owner}/{repo}/compare/{scope_sha}...{delivery_sha}
```

### Invariant Checks:
- Pure HTTPS only; exact domain allowlist (`api.github.com`, `raw.githubusercontent.com`).
- Response byte length inspected prior to decoding; oversized responses fail closed with `SOURCE_TOO_LARGE`.
- SHA-256 computed directly from fetched bytes and stored on-chain.
- Complete identity checks run deterministically before LLM invocation.

---

## 4. Agreement Lifecycle & State Machine

```text
[DRAFT]
   │ create_agreement()
   ▼
[AWAITING_ACCEPTANCE]
   │ accept_agreement() [Worker]
   ▼
[ACTIVE] ──(optional fund_agreement())
   │ submit_delivery() [Worker]
   ▼
[DELIVERY_SUBMITTED]
   ├─── accept_delivery() [Client] ──────────► [ACCEPTED] ──► [SETTLED] (100% to Worker)
   │
   └─── open_dispute() [Client]
          ▼
       [DISPUTED]
          │ assess_dispute() [Validators]
          ▼
       [ASSESSED] (Ruling Derived)
          │ authorize_settlement()
          ▼
       [SETTLEMENT_AUTHORIZED]
          │ execute_settlement()
          ▼
       [SETTLED] (Terminal, irreversible)
```

### Timeout & Recovery:
If worker or client abandons or validator assessment fails repeatedly, role-balanced timeouts allow `cancel_expired_agreement()` or `recover_dispute_timeout()` to refund the appropriate party without deadlock.

---

## 5. Deterministic Ruling Derivation

The model classifies each clause into:
- `SATISFIED`: Clause fully implemented and evidenced.
- `PARTIALLY_SATISFIED`: Clause partially implemented or incomplete.
- `UNSATISFIED`: Clause unfulfilled in delivery commit.
- `ADDED_AFTER_FREEZE`: Clause was introduced after the scope commit was frozen.
- `NOT_EVALUABLE`: Evidence unavailable or contradictory.

Smart contract deterministic logic applies the strict mapping:
1. If all frozen required clauses are `SATISFIED` $\rightarrow$ **`DELIVERED`** (Worker 100%, Client 0%).
2. If all unsatisfied clauses are `ADDED_AFTER_FREEZE` $\rightarrow$ **`OUT_OF_SCOPE_CHANGE`** (Worker 100%, Client 0%).
3. If some frozen clauses are `PARTIALLY_SATISFIED` and none `UNSATISFIED` $\rightarrow$ **`PARTIAL`** (Worker 50%, Client 50%).
4. If one or more material frozen clauses are `UNSATISFIED` $\rightarrow$ **`NOT_DELIVERED`** (Worker 0%, Client 100%).
5. If any mandatory evidence is `NOT_EVALUABLE` or source failed $\rightarrow$ **`UNRESOLVED`** (No transfer, retryable).
