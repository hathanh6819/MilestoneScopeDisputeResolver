import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X } from 'lucide-react';
import { TxStep } from '../lib/types';
import { studionet } from '../lib/genlayer';

interface TransactionProgressProps {
  isOpen: boolean;
  step: TxStep;
  txHash?: string;
  errorMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  isOpen,
  step,
  txHash,
  errorMessage,
  onClose,
  onRetry,
}) => {
  if (!isOpen || step === 'IDLE') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* State Icon */}
        <div className="flex justify-center mb-4">
          {step === 'PREPARING' || step === 'WAITING_WALLET' || step === 'SUBMITTED' || step === 'CONSENSUS' ? (
            <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : step === 'SUCCESS' ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white mb-2">
          {step === 'PREPARING' && 'Preparing Transaction Payload'}
          {step === 'WAITING_WALLET' && 'Awaiting Wallet Signature'}
          {step === 'SUBMITTED' && 'Transaction Broadcast to GenLayer'}
          {step === 'CONSENSUS' && 'Waiting for Finalized Receipt'}
          {step === 'SUCCESS' && 'Transaction Successfully Confirmed'}
          {step === 'ERROR' && 'Transaction Failed'}
        </h3>

        <p className="text-xs text-slate-400 mb-6">
          {step === 'PREPARING' && 'Validating parameters against canonical Git SHAs and bounds...'}
          {step === 'WAITING_WALLET' && 'Please approve the transaction inside your browser wallet.'}
          {step === 'SUBMITTED' && 'Transaction has been submitted to the GenLayer StudioNet RPC node.'}
          {step === 'CONSENSUS' && 'The transaction was broadcast. Waiting for its execution result; do not send it again.'}
          {step === 'SUCCESS' && 'Successful finalized receipt checked and contract state read back. An unresolved ruling is not a payment approval; emitted transfers require their own confirmation.'}
          {step === 'ERROR' && (errorMessage || 'An unhandled execution error occurred.')}
        </p>

        {/* Tx Hash Link */}
        {txHash && (
          <div className="mb-6 p-3 bg-slate-900 rounded-xl border border-slate-800 text-left">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider mb-1">
              Transaction Hash
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-sky-400 truncate">{txHash}</span>
              <a
                href={`${studionet.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white shrink-0 p-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Action Button */}
        {step === 'SUCCESS' ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        ) : step === 'ERROR' ? (
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
