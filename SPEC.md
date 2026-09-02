# Technical Specification: MilestoneScopeDisputeResolver

Formal specification for `contracts/milestone_scope_dispute_resolver.py`.

---

## 1. Constants & Enums

### 1.1 Agreement Lifecycle States
```python
STATE_DRAFT = 1
STATE_AWAITING_ACCEPTANCE = 2
STATE_ACTIVE = 3
STATE_DELIVERY_SUBMITTED = 4
STATE_ACCEPTED = 5
STATE_DISPUTED = 6
STATE_ASSESSED = 7
STATE_SETTLEMENT_AUTHORIZED = 8
STATE_SETTLED = 9
STATE_CANCELLED = 10
```

### 1.2 Dispute Assessment Rulings
```python
RULING_PENDING = 0
RULING_DELIVERED = 1            # All frozen clauses satisfied -> 100% Worker
RULING_OUT_OF_SCOPE_CHANGE = 2  # Only post-freeze additions missing -> 100% Worker
RULING_PARTIAL = 3              # Some frozen clauses partial -> 50% Worker / 50% Client
RULING_NOT_DELIVERED = 4        # Material frozen clauses unsatisfied -> 100% Client
RULING_UNRESOLVED = 5           # Missing evidence or error -> retry/recovery only
```

### 1.3 Clause Results
```python
CLAUSE_RESULT_PENDING = 0
CLAUSE_RESULT_SATISFIED = 1
CLAUSE_RESULT_PARTIALLY_SATISFIED = 2
CLAUSE_RESULT_UNSATISFIED = 3
CLAUSE_RESULT_ADDED_AFTER_FREEZE = 4
CLAUSE_RESULT_NOT_EVALUABLE = 5
```

### 1.4 Failure & Diagnostic Reason Codes
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
SETTLEMENT_ALREADY_CONSUMED
UNAUTHORIZED_CALLER
```

### 1.5 Safe Operational Limits
```python
MAX_URL_LENGTH = 512
MAX_STRING_LENGTH = 500
MAX_CLAUSES = 16
MAX_SOURCE_BYTES = 12000         # 12 KB per fetched artifact to stay within GenVM bounds
MAX_DISPUTE_REVISIONS = 5
MIN_DISPUTE_WINDOW_SECONDS = 300
MAX_DISPUTE_WINDOW_SECONDS = 2592000
```

---

## 2. Persistent Storage Model

Storage is strictly flattened using workspace-supported types (`u256`, `str`, `TreeMap[u256, str]`, `TreeMap[u256, u256]`, `DynArray[str]`, `DynArray[u256]`):

```python
class Contract(gl.Contract):
    # Counters & Global Totals
    agreement_count: u256
    dispute_count: u256
    
    total_deposited_wei: u256
    total_reserved_wei: u256
    total_paid_wei: u256
    total_refunded_wei: u256
    
    # Agreement Core (ID -> Field)
    agreement_client: TreeMap[u256, str]
    agreement_worker: TreeMap[u256, str]
    agreement_repository: TreeMap[u256, str]
    agreement_scope_commit: TreeMap[u256, str]
    agreement_scope_path: TreeMap[u256, str]
    agreement_policy_text: TreeMap[u256, str]
    agreement_deposit_wei: TreeMap[u256, u256]
    agreement_state: TreeMap[u256, u256]
    agreement_created_at: TreeMap[u256, u256]
    agreement_deadline: TreeMap[u256, u256]
    
    # Delivery Info (ID -> Field)
    delivery_commit: TreeMap[u256, str]
    delivery_notes_path: TreeMap[u256, str]
    delivery_pr_number: TreeMap[u256, u256]
    delivery_submitted_at: TreeMap[u256, u256]
    
    # Dispute & Assessment Info (ID -> Field)
    dispute_active_revision: TreeMap[u256, u256]
    dispute_claim_code: TreeMap[u256, str]
    dispute_ruling: TreeMap[u256, u256]
    dispute_worker_split_bps: TreeMap[u256, u256]   # Basis points (10000 = 100%)
    dispute_client_split_bps: TreeMap[u256, u256]
    dispute_evidence_digest: TreeMap[u256, str]
    dispute_reason_code: TreeMap[u256, str]
    dispute_settlement_authorized: TreeMap[u256, u256] # 1 if authorized, 0 otherwise
    dispute_settlement_consumed: TreeMap[u256, u256]   # 1 if consumed, 0 otherwise
    
    # Granular Clause Results (AgreementID * 100 + ClauseIndex -> Field)
    clause_identifier: TreeMap[u256, str]
    clause_result: TreeMap[u256, u256]
    clause_material: TreeMap[u256, u256]            # 1 = Material, 0 = Non-material
    clause_count: TreeMap[u256, u256]
```

---

## 3. Consensus Binding Matrix

| Field | Evidence Source | Stored Field | Downstream Deterministic Effect | Validator Check |
|---|---|---|---|---|
| `scope_commit_valid` | GitHub Git Commits API | N/A (Gate) | If `False` $\rightarrow$ aborts with `COMMIT_IDENTITY_MISMATCH` | Exact 40-character commit exists in repository |
| `delivery_commit_valid` | GitHub Git Commits API | N/A (Gate) | If `False` $\rightarrow$ aborts with `COMMIT_IDENTITY_MISMATCH` | Exact 40-character commit exists in repository |
| `repository_binding` | GitHub Commit API `parents`/`compare` | N/A (Gate) | If `False` $\rightarrow$ aborts with `REPOSITORY_BINDING_MISMATCH` | Both commits belong to the registered `owner/repo` |
| `scope_digest` | SHA-256 of fetched `SCOPE.md` | `dispute_evidence_digest` | Immutable anchor for frozen scope | Exact byte hash comparison |
| `delivery_digest` | SHA-256 of fetched `DELIVERY.md` | `dispute_evidence_digest` | Immutable anchor for delivery claims | Exact byte hash comparison |
| `clause_results` | Multi-validator AI evaluation | `clause_result` | Drives deterministic ruling calculation | `SATISFIED`, `PARTIAL`, `UNSATISFIED`, `ADDED_AFTER_FREEZE` |
| `derived_ruling` | Deterministic contract logic | `dispute_ruling` | Governs settlement permission & split band | Calculated on-chain post-consensus |
| `settlement_band` | Derived from ruling | `worker/client_split_bps` | Dictates exact native GEN transfer amounts | Irreversible terminal split |

---

## 4. Public Method Signatures

All public write and view methods use flat StudioNet-compatible arguments (`str`, `u256`, `typing.Any`):

### Write Methods:
- `@gl.public.write.payable create_agreement(repository: str, scope_commit: str, scope_path: str, policy_text: str, deadline_seconds: u256) -> u256`
- `@gl.public.write accept_agreement(agreement_id: u256) -> u256`
- `@gl.public.write.payable fund_agreement(agreement_id: u256) -> u256`
- `@gl.public.write submit_delivery(agreement_id: u256, delivery_commit: str, delivery_notes_path: str, pr_number: u256) -> u256`
- `@gl.public.write accept_delivery(agreement_id: u256) -> u256`
- `@gl.public.write open_dispute(agreement_id: u256, claim_code: str) -> u256`
- `@gl.public.write assess_dispute(agreement_id: u256, expected_revision: u256) -> u256`
- `@gl.public.write authorize_settlement(agreement_id: u256, expected_revision: u256) -> u256`
- `@gl.public.write execute_settlement(agreement_id: u256) -> u256`
- `@gl.public.write cancel_expired_agreement(agreement_id: u256) -> u256`
- `@gl.public.write retry_assessment(agreement_id: u256, expected_revision: u256) -> u256`

### View Methods:
- `@gl.public.view get_agreement(agreement_id: u256) -> dict`
- `@gl.public.view get_delivery(agreement_id: u256) -> dict`
- `@gl.public.view get_dispute(agreement_id: u256) -> dict`
- `@gl.public.view get_clause_result(agreement_id: u256, clause_index: u256) -> dict`
- `@gl.public.view get_accounting() -> dict`
- `@gl.public.view get_counts() -> dict`
- `@gl.public.view is_settleable(agreement_id: u256) -> bool`
