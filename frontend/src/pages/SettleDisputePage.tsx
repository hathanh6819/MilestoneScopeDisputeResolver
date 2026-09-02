import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Coins, CheckCircle2, AlertCircle, ShieldCheck, Scale } from 'lucide-react';
import { AgreementRecord, DisputeRecord } from '../lib/types';
import { formatGen, shortenAddress } from '../lib/genlayer';

interface SettleDisputePageProps {
  agreements: AgreementRecord[];
  disputes: Record<number, DisputeRecord>;
  onExecuteSettlement: (agreementId: number) => Promise<void>;
}

export const SettleDisputePage: React.FC<SettleDisputePageProps> = ({
  agreements,
  disputes,
  onExecuteSettlement,
}) => {
  const { id } = useParams<{ id: string }>();
  const agreementId = parseInt(id || '0', 10);
  const agreement = agreements.find((a) => a.agreement_id === agreementId);
  const dispute = disputes[agreementId];

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agreement || !dispute) {
    return <div className="p-8 text-center text-white">Dispute record not found.</div>;
  }

  const depositWei = BigInt(agreement.deposit_wei || 0);
  const workerBps = BigInt(dispute.worker_split_bps || 0);
  const clientBps = BigInt(dispute.client_split_bps || 0);

  const workerPayoutWei = (depositWei * workerBps) / 10000n;
  const clientRefundWei = depositWei - workerPayoutWei;

  const isConsumed = dispute.settlement_consumed === 1 || agreement.state === 9;

  const handleExecute = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onExecuteSettlement(agreementId);
    } catch (err: any) {
      setError(err?.message || 'Settlement execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Link to={`/agreement/${agreementId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Agreement #{agreementId}
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-800/50 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            Execution Phase
          </div>
          <h1 className="text-2xl font-extrabold text-white">Authorized Proportional Settlement</h1>
          <p className="text-slate-400 text-xs mt-1">
            Single-use cryptographic execution: disburses native GEN escrow strictly once according to the locked split band.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Conservation Equation Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Balance Conservation Equation
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">
                WORKER PAYOUT ({dispute.worker_split_bps / 100}%)
              </span>
              <span className="text-xl font-extrabold text-white">{formatGen(workerPayoutWei)} GEN</span>
              <span className="text-[10px] font-mono text-slate-400 block truncate">{agreement.worker}</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">
                CLIENT REFUND ({dispute.client_split_bps / 100}%)
              </span>
              <span className="text-xl font-extrabold text-white">{formatGen(clientRefundWei)} GEN</span>
              <span className="text-[10px] font-mono text-slate-400 block truncate">{agreement.client}</span>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 font-mono">
            Total Deposited: {formatGen(depositWei)} GEN == {formatGen(workerPayoutWei)} + {formatGen(clientRefundWei)}
          </div>
        </div>

        {/* Action Button */}
        {isConsumed ? (
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Settlement has already been executed and finalized on-chain.
          </div>
        ) : (
          <button
            onClick={handleExecute}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Coins className="w-4 h-4" />
            {isProcessing ? 'Transferring Escrow Funds on GenLayer...' : 'Execute Settlement & Transfer Native GEN'}
          </button>
        )}
      </div>
    </div>
  );
};
