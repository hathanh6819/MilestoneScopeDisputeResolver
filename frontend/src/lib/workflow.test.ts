import { describe, expect, it } from 'vitest';
import { assertSuccessfulReceipt, FinalizedExecutionError } from './chain';
import { settlementBlockReason, walletChanged } from './workflow';

const address = '0x1111111111111111111111111111111111111111';
const agreement: any = { state: 8, deadline: '2000' };
const dispute: any = { settlement_authorized: 1, settlement_consumed: 0, ruling: 1, decision_origin: 'CONSENSUS' };

describe('frontend governance and receipt guards', () => {
  it('detects wallet/account changes', () => expect(walletChanged(address, '0x2222222222222222222222222222222222222222')).toBe(true));
  it('permits an unconsumed authorized settlement', () => expect(settlementBlockReason(agreement, dispute, 1000)).toBe(''));
  it('blocks unresolved evidence', () => expect(settlementBlockReason(agreement, {...dispute, ruling: 5}, 1000)).toBe('UNRESOLVED'));
  it('blocks replay after consumption', () => expect(settlementBlockReason(agreement, {...dispute, settlement_consumed: 1}, 1000)).toBe('NOT_AUTHORIZED'));
  it('blocks stale lifecycle state', () => expect(settlementBlockReason({...agreement, state: 7}, dispute, 1000)).toBe('NOT_AUTHORIZED'));
  it('accepts a matching finalized successful receipt', () => expect(() => assertSuccessfulReceipt({statusName:'FINALIZED',hash:'0x'+'1'.repeat(64),to_address:address,consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}},'0x'+'1'.repeat(64),address)).not.toThrow());
  it('rejects a finalized execution error', () => expect(() => assertSuccessfulReceipt({statusName:'FINALIZED',to_address:address,consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}},'0x'+'1'.repeat(64),address)).toThrow(FinalizedExecutionError));
});
