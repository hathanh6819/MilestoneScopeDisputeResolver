import { createAccount, createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { TransactionStatus } from '../frontend/node_modules/genlayer-js/dist/types/index.js';

const address = process.argv[2];
const mode = process.argv[3];
const clientKey = process.env.MSR_CLIENT_PRIVATE_KEY;
const workerKey = process.env.MSR_WORKER_PRIVATE_KEY;
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) throw new Error('Invalid contract address');
if (!/^[0-9a-fA-F]{64}$/.test(clientKey || '') || !/^[0-9a-fA-F]{64}$/.test(workerKey || '')) throw new Error('Set both test private-key environment variables');

const clientAccount = createAccount(`0x${clientKey}`);
const workerAccount = createAccount(`0x${workerKey}`);
const rpc = createClient({ chain: studionet });
const clientWallet = createClient({ chain: studionet, account: clientAccount });
const workerWallet = createClient({ chain: studionet, account: workerAccount });
const amount = 10_000_000_000_000_000n;
const invalidAmount = 5_000_000_000_000_000n;

const read = (name, args = []) => rpc.readContract({ address, functionName: name, args, jsonSafeReturn: true });
const balance = async (who) => BigInt(await rpc.request({ method: 'eth_getBalance', params: [who, 'latest'] }));
const snapshot = async () => ({
  client: String(await balance(clientAccount.address)), worker: String(await balance(workerAccount.address)),
  contract: String(await balance(address)), counts: await read('get_counts'), accounting: await read('get_accounting'),
});
const wait = (hash) => rpc.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 4000, retries: 150 });
const conciseReceipt = (hash, receipt) => ({
  hash, status: receipt.statusName ?? receipt.status,
  execution: receipt.txExecutionResultName ?? receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  consensus: receipt.consensus_data?.consensus_result,
});
const send = async (wallet, functionName, args, value = 0n) => {
  const hash = await wallet.writeContract({ address, functionName, args, value });
  return { hash, receipt: await wait(hash) };
};
const waitForBalances = async (expectedClient, expectedContract) => {
  for (let i = 0; i < 45; i++) {
    if (await balance(clientAccount.address) === expectedClient && await balance(address) === expectedContract) return true;
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  return false;
};

if (mode === 'invalid') {
  const before = await snapshot();
  const tx = await send(clientWallet, 'create_agreement', ['invalid repo', 'd19b95d64f64edec7a47a64630e3e024a08dd841', 'SPEC.md', 'Only frozen scope is binding.', 604800, '0x4444444444444444444444444444444444444444'], invalidAmount);
  const childIds = await rpc.getTriggeredTransactionIds({ hash: tx.hash });
  const children = [];
  for (const childHash of childIds) children.push(conciseReceipt(childHash, await wait(childHash)));
  const restored = await waitForBalances(BigInt(before.client), BigInt(before.contract));
  const after = await snapshot();
  console.log(JSON.stringify({ mode, before, parent: conciseReceipt(tx.hash, tx.receipt), children, restored, after }, null, 2));
} else if (mode === 'lifecycle') {
  const before = await snapshot();
  const steps = [];
  const create = await send(clientWallet, 'create_agreement', ['hathanh6819/MilestoneScopeDisputeResolver', 'd19b95d64f64edec7a47a64630e3e024a08dd841', 'SPEC.md', 'Only the milestone scope frozen at the canonical Git commit is binding.', 604800, '0x4444444444444444444444444444444444444444'], amount);
  steps.push(conciseReceipt(create.hash, create.receipt));
  const counts = await read('get_counts');
  const agreementId = counts.agreement_count;
  const accept = await send(workerWallet, 'accept_agreement', [agreementId]); steps.push(conciseReceipt(accept.hash, accept.receipt));
  const submit = await send(workerWallet, 'submit_delivery', [agreementId, '8bf87b200e981abacae969cd7e19e9077aa1e11f', 'README.md', 42]); steps.push(conciseReceipt(submit.hash, submit.receipt));
  const settle = await send(clientWallet, 'accept_delivery', [agreementId]); steps.push(conciseReceipt(settle.hash, settle.receipt));
  const children = [];
  for (const childHash of await rpc.getTriggeredTransactionIds({ hash: settle.hash })) children.push(conciseReceipt(childHash, await wait(childHash)));
  const after = await snapshot();
  console.log(JSON.stringify({ mode, agreementId, before, steps, settlementTransfers: children, agreement: await read('get_agreement', [agreementId]), dispute: await read('get_dispute', [agreementId]), after }, null, 2));
} else if (mode === 'invalid-fund') {
  const counts = await read('get_counts');
  const agreementId = counts.agreement_count;
  const before = await snapshot();
  const tx = await send(workerWallet, 'fund_agreement', [agreementId], invalidAmount);
  const children = [];
  for (const childHash of await rpc.getTriggeredTransactionIds({ hash: tx.hash })) children.push(conciseReceipt(childHash, await wait(childHash)));
  const after = await snapshot();
  console.log(JSON.stringify({ mode, agreementId, before, parent: conciseReceipt(tx.hash, tx.receipt), children, after }, null, 2));
} else if (mode === 'replay') {
  const counts = await read('get_counts');
  const agreementId = counts.agreement_count;
  const before = await snapshot();
  const tx = await send(clientWallet, 'accept_delivery', [agreementId]);
  const after = await snapshot();
  console.log(JSON.stringify({ mode, agreementId, before, transaction: conciseReceipt(tx.hash, tx.receipt), after }, null, 2));
} else {
  throw new Error('Mode must be invalid, lifecycle, invalid-fund, or replay');
}
