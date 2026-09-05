import type { AgreementRecord, DisputeRecord } from './types';

export function walletChanged(expected: string, actual: string | null) {
  return !actual || expected.toLowerCase() !== actual.toLowerCase();
}

export function settlementBlockReason(agreement: AgreementRecord, dispute: DisputeRecord, now: number) {
  if (agreement.state !== 8) return 'NOT_AUTHORIZED';
  if (dispute.settlement_authorized !== 1 || dispute.settlement_consumed !== 0) return 'NOT_AUTHORIZED';
  if (Number(agreement.deadline) < now && dispute.decision_origin === 'NONE') return 'DEADLINE_EXPIRED';
  if (dispute.ruling === 5) return 'UNRESOLVED';
  return '';
}
