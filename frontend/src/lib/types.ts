export interface AgreementRecord {
  agreement_id: number;
  client: string;
  worker: string;
  repository: string;
  scope_commit: string;
  scope_path: string;
  policy_text: string;
  deposit_wei: string;
  state: number;
  created_at: string;
  deadline: string;
  fallback_arbitrator: string;
  fallback_wait_seconds: string;
}

export interface DeliveryRecord {
  delivery_commit: string;
  delivery_notes_path: string;
  delivery_pr_number: number;
  delivery_submitted_at: string;
}

export interface DisputeRecord {
  active_revision: number;
  claim_code: string;
  ruling: number;
  worker_split_bps: number;
  client_split_bps: number;
  evidence_digest: string;
  reason_code: string;
  settlement_authorized: number;
  settlement_consumed: number;
  clause_count: number;
  fallback_after: string;
  decision_origin: string;
  arbitration_reference: string;
}

export interface ClauseResultRecord {
  clause_id: string;
  result: number;
  material: boolean;
}

export interface AccountingRecord {
  total_deposited_wei: string;
  total_reserved_wei: string;
  total_paid_wei: string;
  total_refunded_wei: string;
}

export type TxStep = 'IDLE' | 'PREPARING' | 'WAITING_WALLET' | 'SUBMITTED' | 'CONSENSUS' | 'SUCCESS' | 'ERROR';

export interface ActivityItem {
  id: string;
  txHash: string;
  method: string;
  actor: string;
  amount?: string;
  timestamp: number;
  status: TxStep;
}
