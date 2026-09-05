# Local verification evidence — 2026-09-02

This log deliberately separates test boundaries. No local test is represented as a Studionet transaction or real wallet transfer.

## Protocol v4 verification

- `python scripts/run_all_tests.py` runs mock and real-SDK suites in isolated
  interpreters, eliminating the previous `conftest.py` module collision.
- Direct Mode payable regressions cover invalid repository, commit, path, policy,
  deadline and arbitrator; unknown agreement; zero value; unauthorized funder;
  and terminal lifecycle funding. Every rejected call preserves state and custody
  accounting.
- Runtime custody tests inspect SDK `EthSend` requests, exact worker/client splits,
  reserve depletion, cumulative paid/refunded totals and replay blocking.
- `npm ci`, `npm test` and `npm run build` pass from the committed lockfile.
- Frontend tests cover account changes, unauthorized/stale lifecycle state,
  expiry, unresolved evidence, replay and finalized receipt error handling.
- The exact v4 source is deployed and the nonzero Studionet evidence is recorded
  below.

## Verified v4 deployment and adversarial custody evidence — 2026-09-05

Contract: [`0x8A2A62b6343627A0f2DDc4709aaaBe5303A4006f`](https://explorer-studio.genlayer.com/address/0x8A2A62b6343627A0f2DDc4709aaaBe5303A4006f)

- Deployed source SHA-256: `97f8adafe6b62b96220fa122320548f3bbdaf20fea9f05179ccc6d29d122d8c3`
- Source size: `49,064` bytes; protocol version `4`; schema: `20` methods.
- Initial state: `0` agreements, `0` disputes, zero contract balance and zero accounting.

Invalid payable creation attached `0.005 GEN`:

- Parent: [`0xc5575885f9684bef38b4e56f7f80b08479f1517745813ce43f62795f3efcbe9f`](https://explorer-studio.genlayer.com/tx/0xc5575885f9684bef38b4e56f7f80b08479f1517745813ce43f62795f3efcbe9f), finalized `SUCCESS` with no agreement created.
- Refund child: [`0x029bd2471494284b13395a55669188bcd7c934d9c75e457afe86077d90e33ac1`](https://explorer-studio.genlayer.com/tx/0x029bd2471494284b13395a55669188bcd7c934d9c75e457afe86077d90e33ac1), finalized.
- Client balance was `663906000000000000000` wei before and after; contract balance remained `0`; counts and all accounting fields remained zero.

Valid `0.01 GEN` agreement `1`:

1. [`create_agreement`](https://explorer-studio.genlayer.com/tx/0x7cc55e2fac594e8ca39642d90138904a4486b320a3f6957544da5f4744d1ac02)
2. [`accept_agreement`](https://explorer-studio.genlayer.com/tx/0xe8609de8e487a356c148a1a57a104c7093ca60a66fdee0ae0f0269dece715c88)
3. [`submit_delivery`](https://explorer-studio.genlayer.com/tx/0x1217397f31c642a1c75174755e26eed6a6156eb7a1fb2d1f41dbe054cc6c3f2e)
4. [`accept_delivery`](https://explorer-studio.genlayer.com/tx/0x7bf132ce3e6150dec44d9d6e7fc474e5bee1c352e57ac27f9d77dc0462f8bf94)
5. [Worker transfer child](https://explorer-studio.genlayer.com/tx/0xf67346e257d8d61d49c3ff7c40c6b26c8c86d057f4531eb703062b48ec168be2)

All parents and the transfer finalized. Client decreased exactly `0.01 GEN`, worker increased exactly `0.01 GEN`, contract returned to `0`; accounting is deposited `0.01`, paid `0.01`, reserved `0`, refunded `0`. Agreement state is `9`, deposit is `0`, decision origin is `CLIENT_ACCEPTANCE`, authorization/consumption are `1/1`, and worker split is `10000` bps.

Terminal funding and replay regressions:

- Attached `0.005 GEN` to terminal `fund_agreement`: [parent](https://explorer-studio.genlayer.com/tx/0x300107d9d7a275b9a31cacae8d9a10e81c1dcb69abe2c8b8ffa4225dceb42168), [refund child](https://explorer-studio.genlayer.com/tx/0xfa616ce11d1170ea4823a72acaebcf2a9334226ed07aec85bf346750da7a59b7). Both finalized; worker and contract balances plus accounting remained unchanged.
- Replayed `accept_delivery`: [`0x0280ac986d87489e20d309c134f69cf339ca37839b2abdaa3e171482ba100c5d`](https://explorer-studio.genlayer.com/tx/0x0280ac986d87489e20d309c134f69cf339ca37839b2abdaa3e171482ba100c5d), finalized `ERROR`; terminal state, all balances and accounting remained unchanged.

## Superseded v3 payable regression — 2026-09-05

Contract `0xee34Ca9cCc3bdBAA86fF75214C97830658dF7aEf` matched the reviewed v3
source and successfully completed a `0.01 GEN` agreement settlement. However,
adversarial transaction
[`0xf8862a387b7c699980a76ae960ff64ffc84007de3de826603993979b35e77344`](https://explorer-studio.genlayer.com/tx/0xf8862a387b7c699980a76ae960ff64ffc84007de3de826603993979b35e77344)
proved that Studionet retained `0.005 GEN` even though validators agreed on
`ERROR / INVALID_REPOSITORY_NAME`; contract accounting correctly remained
unchanged, leaving an unaccounted balance. V3 is therefore explicitly superseded.

V4 handles this runtime behavior directly: invalid value-bearing payable calls
finish by returning the entire attached value to the sender and return ID `0`,
without creating or funding an agreement. Direct Mode asserts the emitted refund
amount and unchanged state/accounting for every requested validation class.

## Results

| Boundary | Command | Result | What it establishes |
|---|---|---:|---|
| Python mock regression | `pytest tests -q -p no:cacheprovider` | 50 passed | Fast state-machine and regression checks using the explicitly fake module in `tests/conftest.py`. |
| SDK Direct Mode | `pytest runtime_tests -q -p no:cacheprovider` | 51 passed | Real installed SDK contract loading/storage and mocked external web/LLM boundaries. |
| GenVM lint/schema | `genvm-lint check contracts/milestone_scope_dispute_resolver.py` | passed | 2 lint checks; schema validation found 20 methods (8 view, 12 write). |
| Frontend type/build | `npm run build` | passed | TypeScript and Vite production bundle. |
| Dependency audit | `npm audit` | 0 vulnerabilities | Registry audit after Vite and router upgrades. |
| Browser smoke | local page in in-app browser | passed | No deployment configured is shown clearly; no record UI or fake data appears; contract settings cannot override address. |

## Direct Mode coverage

The isolated suite covers:

- deployment and view schema behavior;
- happy, malformed, failure and retry paths;
- wrong commit, tree truncation, incomplete compare head, forged blob, oversized body, symlink/submodule and path injection rejection;
- immutable clause IDs/materiality; omission, replacement, demotion, duplicate and invented added-scope rejection;
- later scope acquisition for genuine post-freeze additions;
- validator result mappings and `UNRESOLVED` non-payment;
- fallback arbitrator authority, waiting period, stale revision, invalid ruling and terminal overwrite prevention;
- nonzero emitted EVM transfer payloads for 100/0, 50/50 and 0/100, odd-value conservation and replay prevention.

Direct Mode observes `EthSend` payloads and exact custody invariants. The v4 Studionet evidence above separately proves that the emitted child transfers finalize and produce the expected recipient/contract balance changes.

## Remaining external proof

- Studionet schema-for-code response for this exact source.
- Deployment receipt and deployed source match.
- Happy/failure/conflict/retry transactions with Explorer links.
- Parent execution result plus triggered child transfer IDs and child receipts.
- Contract/client/worker balances before and after nonzero settlement.

## First Studionet deployment compatibility finding

Contract `0xAC02F48F905a57A21dCEC66aEE41b06b01a1dC60` matched the then-local source
checksum and exposed protocol v2 with 20 methods. Two zero-escrow creation calls
finalized with execution `ERROR` before storage mutation. The first intentionally
exercised a CLI numeric-only SHA coercion. The second proved the CLI/runtime
encodes a 0x arbitrator as `Address`, while that source expected string methods.
The contract signature was corrected to `Address` and normalized with `str(...)`.
The deployment is superseded and must not be used as submission evidence.

- Failed type-coercion tx: `0x49da6e66e66c48c60e2363efcf4110a186addca7b13a92397b53a9821bf16caf`
- Failed arbitrator-encoding tx: `0x7fdbaae6831e0855d49a9821b017fe7ba38cc60197bbe560aebefaa2101164f5`

## Verified Studionet deployment — 2026-09-02

Contract: `0x97b4EE3464132f5f1E172E76e78A6B06827A9df2`

The deployed source is an exact match for the reviewed local contract:

- SHA-256: `a9cc02308e7bce396e9b418b26a7d1298b37e86c5d0398c1bf6d686cd8fbb2e8`
- Source size: `48,324` bytes
- Protocol version: `2`
- Schema: `20` public methods (`8` read-only, `12` write)

Zero-value happy-path lifecycle:

1. `create_agreement`: `0xfa3651631ab1135ef83b9494b8b8ad846bf34eef1c65ba7e194afc679abb158a` — leader `SUCCESS`, `MAJORITY_AGREE`.
2. `accept_agreement`: `0x3a5645b1896b880dddc81b62824aa0eee7cfefbb624b79593d9d93e0253d84a4` — leader `SUCCESS`, `MAJORITY_AGREE`.
3. `submit_delivery`: `0xe92e32b96307d352c9dac8b39b3817ef78a862d1f49211bd595c1f8f82e851c5` — leader `SUCCESS`, `MAJORITY_AGREE`.
4. `accept_delivery`: `0x8f2fd19aedebe239fc5173651ace356b3ff8a2b8e1c443571176b1ea775a3b5d` — leader `SUCCESS`, `MAJORITY_AGREE`.

Replay protection:

- Repeating `accept_delivery` produced transaction `0x35ddff0ccc471095b33f72f4d6edab0db2e4c3e26ed6eaf256a585e3362024e8`.
- Validators agreed on the fail-closed rollback `INVALID_LIFECYCLE_STATE`.
- The agreement remained terminal at state `9`; counts remained `1 agreement / 0 disputes`; all accounting totals remained zero.

## Canonical GitHub assessment lifecycle — 2026-09-02

Public repository: `https://github.com/hathanh6819/MilestoneScopeDisputeResolver`

- Frozen/source revision: `d19b95d64f64edec7a47a64630e3e024a08dd841`
- Delivery attestation revision: `8bf87b200e981abacae969cd7e19e9077aa1e11f`
- The GitHub compare response was measured at `11,473` bytes, below the contract's `12,000` byte per-response bound.
- The fixture contains five regular files, below the contract's eight-file tree bound.
- The contract independently fetched GitHub commit objects, complete recursive trees, the compare relation, and every regular blob at both revisions. Blob contents were checked against Git blob SHA-1 and included in a canonical SHA-256 evidence commitment.

Agreement `2` canonical dispute lifecycle:

1. `create_agreement`: `0x2b2c7eca46445575dec9c19eb0112e274475b06e0f7bc6d00df290fa8d0a3788`
2. `accept_agreement`: `0xf27300c0b329ea395495b5a699945d671946c874c242ea1fa75a1734319c3f1c`
3. `submit_delivery`: `0xa5a49dbf498979491cebe0bbfffe18f4cab5c3abb11a5dcf148d5dbe48d8a0d7`
4. `open_dispute`: `0x6fd41c2b1a9b644cb1dba083c581f353b2918fd4b74ab504f70af5156cae72bb`
5. `assess_dispute`: `0xb8baed67ec0a2cea78b83fcdaa2b6705f3afa8fb544cb7c8cd055b20680742d9`
6. `authorize_settlement`: `0xf6dc75e07b8616729bfaafd47b43a50ba35d683586d5aa0127341d800fbb3a39`
7. `execute_settlement`: `0xb1633c41c8ad50a8b13b9e206357e900d1d2b7fc2ccf57854ccb1fb74bedd24b`

All seven transactions finalized with leader `SUCCESS` and `MAJORITY_AGREE`. Final on-chain state:

- Agreement state: `9` (`SETTLED`)
- Decision origin: `VALIDATOR_CONSENSUS`
- Clause: `MSR-001`, material `true`, result `SATISFIED`
- Ruling: `DELIVERED`; reason: `ALL_SCOPE_CLAUSES_SATISFIED`
- Split: worker `10000` bps, client `0` bps
- Evidence digest: `sha256:1a5508d6d22a7818f8a6970c02f25b1ad168cfb2a2846f3db15dd8eda288da67`
- Settlement authorization and consumption flags: `1 / 1`
- Zero-value test accounting remained conserved at `0 / 0 / 0 / 0`.
