# Originality & Anti-Clone Analysis: MilestoneScopeDisputeResolver

This document establishes the material architectural and mechanism distinctness of `MilestoneScopeDisputeResolver` compared to prior projects in accordance with `BUILD_PLAN.md` Section 5.

---

## 1. Architectural Differentiation Matrix

| Dimension | OpenSourceMilestoneEscrow | ReleaseWorkflowPolicyGate | CanonicalSecurityAdvisoryRevocationLedger | **MilestoneScopeDisputeResolver (This Project)** |
|---|---|---|---|---|
| **Primary Domain** | Public GitHub Bug / Feature Bounty Escrow | CI/CD Release Promotion & Compliance Gate | Vulnerability Advisory Revocation Registry | **Bilateral Client–Worker Milestone Scope Dispute Resolution** |
| **Bilateral Dynamics** | Unilateral sponsor deposits; any developer claims | Release manager triggers promotion against static policy | Reporter files advisory; maintainer disputes | **Client & Worker enter bilateral agreement with mutual obligations** |
| **Scope Definition** | Pre-set JSON Acceptance Manifest | Static natural language release policy | Advisory CVE / GHSA metadata schema | **Dual Git Commit Boundary: Scope Commit (`SCOPE.md`) vs Delivery Commit (`DELIVERY.md`)** |
| **Evidence Sources** | Single GitHub PR URL + merge commit | GitHub Workflow runs, artifact hashes, approval logs | CVE database record, maintainer patch PR, NVD feed | **Canonical commit/tree APIs + complete bounded file snapshots + blob identity verification + compare/PR identity** |
| **Consensus Task** | Binary criteria checklist verification | Multi-policy compliance evaluation | Advisory validity / patch existence check | **Clause-level semantic comparison & out-of-scope addition classification** |
| **Consensus Output** | Bitwise pass/fail criteria mask | APPROVED / REJECTED / MANUAL_REVIEW | REVOCATION_UPHELD / DISMISSED | **Per-clause status (SATISFIED, UNSATISFIED, ADDED_AFTER_FREEZE) + diagnostic flags** |
| **Economic Mechanism** | Binary all-or-nothing payout to developer or refund | Zero economic custody (pure gate) | Slashing bond on fraudulent advisories | **Continuous proportional split bands (100/0, 50/50, 0/100) tied to frozen scope clauses** |
| **Scope Creep Handling** | Rejects submission if not matching manifest | Rejects release if not compliant | N/A | **Explicitly isolates clauses added post-freeze (`ADDED_AFTER_FREEZE`) to prevent client withholding** |
| **Settlement Enforcement** | Direct settlement after dispute challenge window | Unlocks deployment token | Revokes advisory status in registry | **Single-use Settlement Authorization (`SETTLEMENT_AUTHORIZED`) transitioning to final `SETTLED`** |

---

## 2. Distinct Mechanism Highlights

1. **Dual Commit Anchoring:**
   Unlike bounty systems that verify a single pull request, `MilestoneScopeDisputeResolver` anchors two distinct points in git history: the exact commit where scope was agreed upon ($C_{scope}$) and the exact commit where work was delivered ($C_{delivery}$).

2. **Isolation of Scope Creep (`ADDED_AFTER_FREEZE`):**
   In freelance and agency milestone work, the most common dispute is the client demanding features not present in the original agreement. The validator jury specifically identifies requirements added *after* the scope freeze commit and marks them `ADDED_AFTER_FREEZE`, ensuring the worker is not unfairly penalized or denied payout.

3. **Deterministic Split Bands:**
   Rather than asking an AI to pick an arbitrary financial split, the contract deterministically translates clause counts into locked policy bands:
   - Full delivery $\rightarrow$ 100% to Worker.
   - Delivery meeting all original scope but omitting post-freeze additions $\rightarrow$ 100% to Worker.
   - Partial delivery $\rightarrow$ 50% Worker / 50% Client refund.
   - Material scope missed $\rightarrow$ 100% Refund to Client.

4. **Two-Party Settlement Authorization:**
   Separates the derivation of the ruling from the execution of the transfer, enabling single-use consumable authorizations and robust replay defense.
