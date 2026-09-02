import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { AgreementRecord } from '../lib/types';
import { formatGen } from '../lib/genlayer';

interface CancelAgreementPageProps {
  agreements: AgreementRecord[];
  onCancelAgreement: (agreementId: number) => Promise<void>;
}

export const CancelAgreementPage: React.FC<CancelAgreementPageProps> = ({
  agreements,
  onCancelAgreement,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agreementId = parseInt(id || '0', 10);
  const agreement = agreements.find((a) => a.agreement_id === agreementId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agreement) {
    return <div className="p-8 text-center text-white">Agreement not found.</div>;
  }

  const handleCancel = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onCancelAgreement(agreementId);
      navigate(`/agreement/${agreementId}`);
    } catch (err: any) {
      setError(err?.message || 'Cancellation / recovery failed.');
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

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            Timeout Recovery Phase
          </div>
          <h1 className="text-2xl font-extrabold text-white">Cancel Expired Agreement</h1>
          <p className="text-slate-400 text-xs mt-1">
            Only the client may refund an expired agreement with no delivery submitted. A delivered or disputed agreement cannot be unilaterally refunded.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Agreement ID:</span>
            <span className="font-mono text-white">#{agreement.agreement_id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Refund Amount:</span>
            <span className="font-bold text-emerald-400 font-mono">{formatGen(agreement.deposit_wei)} GEN</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Recipient (Client):</span>
            <span className="font-mono text-sky-400 truncate max-w-[200px]">{agreement.client}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Current Status:</span>
            <span className="font-mono text-amber-400">State #{agreement.state}</span>
          </div>
        </div>

        <button
          onClick={handleCancel}
          disabled={isProcessing || ![2, 3].includes(agreement.state)}
          className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isProcessing ? 'Processing Recovery on GenLayer...' : 'Confirm Cancellation & Refund Escrow'}
        </button>
      </div>
    </div>
  );
};
