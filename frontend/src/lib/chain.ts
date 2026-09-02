import { isAddress } from 'viem';
import { requireContractAddress } from './genlayer';
import type { AgreementRecord, DeliveryRecord, DisputeRecord, ClauseResultRecord, AccountingRecord } from './types';

let sdkPromise: Promise<any> | null = null;
let readClientPromise: Promise<any> | null = null;

async function getSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import('genlayer-js'),
      import('genlayer-js/chains'),
      import('genlayer-js/types'),
    ]).then(([sdk, chains, types]) => ({
      createClient: sdk.createClient,
      sdkChain: chains.studionet,
      TransactionStatus: types.TransactionStatus,
    }));
  }
  return sdkPromise;
}

async function getReadClient() {
  if (!readClientPromise) {
    readClientPromise = getSdk().then(({ createClient, sdkChain }) => createClient({ chain: sdkChain }));
  }
  return readClientPromise;
}
export function walletProvider() {
  const provider = (window as any).ethereum;
  if (!provider?.request) throw new Error('No wallet provider found. Install a compatible wallet.');
  return provider;
}
export async function connectWallet(): Promise<`0x${string}`> {
  const provider = walletProvider();
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || !isAddress(accounts[0])) throw new Error('Wallet returned no valid account.');
  const { createClient, sdkChain } = await getSdk();
  await createClient({ chain: sdkChain, provider, account: accounts[0] }).connect('studionet');
  return accounts[0];
}
export async function read<T>(functionName: string, args: (string | number)[] = []): Promise<T> {
  const readClient = await getReadClient();
  const result = await readClient.readContract({ address: requireContractAddress(), functionName, args, jsonSafeReturn: true });
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error(`Invalid ${functionName} response`);
  return result as T;
}
export type Snapshot = {
  agreements: AgreementRecord[]; deliveries: Record<number, DeliveryRecord>;
  disputes: Record<number, DisputeRecord>; clauses: Record<number, ClauseResultRecord[]>;
  accounting: AccountingRecord; total: number;
};
export async function loadSnapshot(): Promise<Snapshot> {
  const [protocol, counts, accounting] = await Promise.all([
    read<{ name: string; version: number }>('get_protocol'),
    read<{ agreement_count: number }>('get_counts'),
    read<AccountingRecord>('get_accounting'),
  ]);
  if (protocol.name !== 'MilestoneScopeDisputeResolver' || protocol.version !== 2) throw new Error('Wrong contract or incompatible deployment version');
  if (!Number.isSafeInteger(counts.agreement_count) || counts.agreement_count < 0) throw new Error('Invalid agreement count');
  for (const key of ['total_deposited_wei', 'total_reserved_wei', 'total_paid_wei', 'total_refunded_wei'] as const) {
    if (!/^\d+$/.test(accounting[key])) throw new Error('Invalid accounting response');
  }
  const result: Snapshot = { agreements: [], deliveries: {}, disputes: {}, clauses: {}, accounting, total: counts.agreement_count };
  const firstId = Math.max(1, counts.agreement_count - 99);
  const ids = Array.from({ length: Math.max(0, counts.agreement_count - firstId + 1) }, (_, index) => firstId + index);
  const loadAgreement = async (id: number) => {
    const [ag, delivery, dispute] = await Promise.all([
      read<AgreementRecord>('get_agreement', [id]), read<DeliveryRecord>('get_delivery', [id]), read<DisputeRecord>('get_dispute', [id]),
    ]);
    if (ag.agreement_id !== id || !Number.isInteger(ag.state) || !/^\d+$/.test(ag.deposit_wei) || !isAddress(ag.fallback_arbitrator)) throw new Error('Contract response incompatible with this frontend');
    if (!Number.isInteger(dispute.clause_count) || dispute.clause_count < 0 || dispute.clause_count > 16) throw new Error('Invalid clause count');
    if (![0,1,2,3,4,5].includes(dispute.ruling) || ![0,5000,10000].includes(dispute.worker_split_bps) || ![0,5000,10000].includes(dispute.client_split_bps) || !Number.isSafeInteger(dispute.active_revision)) throw new Error('Invalid dispute fields');
    if ([1,2,3,4].includes(dispute.ruling) && dispute.worker_split_bps + dispute.client_split_bps !== 10000) throw new Error('Invalid settlement split');
    const clauseRecords = await Promise.all(Array.from({ length: dispute.clause_count }, (_, index) => read<ClauseResultRecord>('get_clause_result', [id, index])));
    return { id, ag, delivery, dispute, clauseRecords };
  };
  // Bound concurrency so a large directory cannot flood the public RPC.
  for (let offset = 0; offset < ids.length; offset += 8) {
    const batch = await Promise.all(ids.slice(offset, offset + 8).map(loadAgreement));
    for (const { id, ag, delivery, dispute, clauseRecords } of batch) {
      result.agreements.push(ag);
      if (delivery.delivery_commit) result.deliveries[id] = delivery;
      result.disputes[id] = dispute;
      result.clauses[id] = clauseRecords;
    }
  }
  return result;
}

export class FinalizedExecutionError extends Error {}
export function assertSuccessfulReceipt(receipt: any, hash: string, address: string) {
  if ((receipt.statusName ?? receipt.status) !== 'FINALIZED') throw new Error('Transaction is not finalized. Do not resend blindly.');
  const actualHash = receipt.hash ?? receipt.txId;
  if (actualHash && actualHash.toLowerCase() !== hash.toLowerCase()) throw new Error('Receipt hash mismatch');
  const target = receipt.to_address ?? receipt.recipient;
  if (!target || target.toLowerCase() !== address.toLowerCase()) throw new Error('Receipt target not verified');
  const leaders = receipt.consensus_data?.leader_receipt;
  const list = Array.isArray(leaders) ? leaders : leaders ? [leaders] : [];
  const execution = receipt.txExecutionResultName;
  if (execution ? execution !== 'FINISHED_WITH_RETURN' : !list.length || list.some((r: any) => r.execution_result !== 'SUCCESS')) {
    if (execution === 'FINISHED_WITH_ERROR' || list.some((r: any) => r.execution_result === 'ERROR')) throw new FinalizedExecutionError('Finalized transaction execution failed. Inspect Explorer.');
    throw new Error('Finalized receipt has no recognized successful execution. Inspect Explorer before retrying.');
  }
}
export async function waitForSuccess(hash: `0x${string}`) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Invalid transaction hash');
  const [{ TransactionStatus }, readClient] = await Promise.all([getSdk(), getReadClient()]);
  const receipt = await readClient.waitForTransactionReceipt({ hash: hash as `0x${string}` & { length: 66 }, status: TransactionStatus.FINALIZED, interval: 4000, retries: 90 });
  assertSuccessfulReceipt(receipt, hash, requireContractAddress());
  return receipt;
}
export async function send(functionName: string, args: (string | number)[], value: bigint, expectedAccount: string): Promise<`0x${string}`> {
  const address = requireContractAddress();
  const provider = walletProvider();
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (!accounts[0] || accounts[0].toLowerCase() !== expectedAccount.toLowerCase()) throw new Error('Wallet account changed. Reconnect before signing.');
  const chain = await provider.request({ method: 'eth_chainId' });
  const { createClient, sdkChain } = await getSdk();
  if (Number(chain) !== sdkChain.id) throw new Error('Wrong wallet network. Reconnect to Studionet.');
  const client = createClient({ chain: sdkChain, provider, account: accounts[0] });
  const hash = await client.writeContract({ address, functionName, args, value });
  if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Wallet returned no valid transaction hash; inspect wallet before retrying.');
  return hash as `0x${string}`;
}
