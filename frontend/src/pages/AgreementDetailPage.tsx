import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  GitCommit,
  ExternalLink,
  Coins,
  Clock,
  User,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus
} from 'lucide-react';
import { AgreementRecord, DeliveryRecord, DisputeRecord } from '../lib/types';
import { formatGen, getAgreementStatusBadge, shortenAddress, ZERO_ADDRESS } from '../lib/genlayer';

interface AgreementDetailPageProps {
  agreements: AgreementRecord[];
  deliveries: Record<number, DeliveryRecord>;
  disputes: Record<number, DisputeRecord>;
  walletAddress: string | null;
  onAcceptAgreement: (agreementId: number) => Promise<void>;
  onFundAgreement: (agreementId: number, amountGen: string) => Promise<void>;
  onAcceptDelivery: (agreementId: number) => Promise<void>;
}

export const AgreementDetailPage: React.FC<AgreementDetailPageProps> = ({
  agreements,
  deliveries,
  disputes,
  walletAddress,
  onAcceptAgreement,
  onFundAgreement,
  onAcceptDelivery,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agreementId = parseInt(id || '0', 10);

  const agreement = agreements.find((a) => a.agreement_id === agreementId);
  const delivery = deliveries[agreementId];
  const dispute = disputes[agreementId];

  const [fundAmount, setFundAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!agreement) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Agreement #{id} Not Found</h2>
        <Link to="/agreements" className="text-xs text-sky-400 hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  const badge = getAgreementStatusBadge(agreement.state);
  const isClient = walletAddress && walletAddress.toLowerCase() === agreement.client.toLowerCase();
  const isWorker = walletAddress && agreement.worker !== ZERO_ADDRESS && walletAddress.toLowerCase() === agreement.worker.toLowerCase();

  const handleWorkerAccept = async () => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await onAcceptAgreement(agreementId);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to accept agreement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClientFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setActionError(null);
      await onFundAgreement(agreementId, fundAmount);
      setFundAmount('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to fund agreement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClientAcceptDelivery = async () => {
    try {
      setIsProcessing(true);
      setActionError(null);
      await onAcceptDelivery(agreementId);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to accept delivery.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Link to="/agreements" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      {/* Main Card */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 font-bold">AGREEMENT #{agreement.agreement_id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{agreement.repository}</h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Locked Escrow Deposit</span>
            <span className="text-2xl font-black text-emerald-400">{formatGen(agreement.deposit_wei)} GEN</span>
          </div>
        </div>

        {actionError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Scope Specifications */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Milestone Scope & Requirements</h3>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {agreement.policy_text}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Client (Sponsor)</span>
            <span className="font-mono text-xs text-sky-400 block">{agreement.client}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Worker (Deliverer)</span>
            <span className="font-mono text-xs text-slate-200 block">
              {agreement.worker === ZERO_ADDRESS ? 'None (Awaiting Worker Acceptance)' : agreement.worker}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Scope Commit SHA</span>
            <span className="font-mono text-xs text-sky-300 block">{agreement.scope_commit}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Scope Document Path</span>
            <span className="font-mono text-xs text-slate-200 block">{agreement.scope_path}</span>
          </div>
        </div>

        {/* Delivery Details if Submitted */}
        <div className="p-4 border border-slate-700 rounded-xl text-xs space-y-2">
          <p className="break-all">Locked arbitrator: {agreement.fallback_arbitrator}</p>
          <p>Accepting this agreement accepts the immutable scope, policy and seven-day fallback arbitration term.</p>
          {dispute && <p>Decision origin: {dispute.decision_origin}</p>}
          {agreement.state === 6 && <Link className="underline" to={`/dispute/${agreementId}/arbitrate`}>Pre-agreed arbitration</Link>}
        </div>
        {delivery && (
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/50 space-y-3">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Delivery Evidence Submitted
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Delivery Commit SHA</span>
                <span className="text-purple-300">{delivery.delivery_commit.slice(0, 10)}...</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Notes Path</span>
                <span className="text-slate-300">{delivery.delivery_notes_path}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pull Request #</span>
                <span className="text-slate-300">{delivery.delivery_pr_number}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Panel Based on State */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Available Actions</h3>

          {/* State 2: Awaiting Acceptance */}
          {agreement.state === 2 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleWorkerAccept}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Accepting Agreement...' : 'Accept Agreement as Worker'}
              </button>
            </div>
          )}

          {/* State 3: Active -> Submit Delivery */}
          {agreement.state === 3 && (
            <div className="flex items-center gap-3">
              <Link
                to={`/agreement/${agreementId}/submit`}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
              >
                Submit Milestone Delivery
              </Link>
            </div>
          )}

          {/* State 4: Delivery Submitted -> Client can Accept or Dispute */}
          {agreement.state === 4 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleClientAcceptDelivery}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Accepting & Paying Worker...' : 'Accept Delivery (100% Payout to Worker)'}
              </button>

              <Link
                to={`/agreement/${agreementId}/dispute`}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                Open Scope Dispute
              </Link>
            </div>
          )}

          {/* State 6: Disputed -> Assess */}
          {agreement.state === 6 && (
            <div className="flex items-center gap-3">
              <Link
                to={`/dispute/${agreementId}/assess`}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <Scale className="w-4 h-4" />
                Run Validator Consensus Assessment
              </Link>
            </div>
          )}

          {/* State 7: Assessed -> Settle */}
          {[7,8].includes(agreement.state) && (
            <div className="flex items-center gap-3">
              <Link
                to={`/dispute/${agreementId}/${agreement.state === 7 ? 'assess' : 'settle'}`}
                className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Continue Authorization / Settlement
              </Link>
            </div>
          )}

          {/* Extra Funding Form for Client */}
          {[2,3].includes(agreement.state) && (
            <form onSubmit={handleClientFund} className="flex items-center gap-3 pt-3">
              <input
                type="number"
                step="0.1"
                min="0.01"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="GEN amount"
                className="w-36 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100"
              />
              <button
                type="submit"
                disabled={isProcessing || !fundAmount}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Escrow Funds
              </button>
            </form>
          )}

          {/* Timeout Recovery Link */}
          {[2,3].includes(agreement.state) && (
            <div className="pt-2">
              <Link
                to={`/agreement/${agreementId}/cancel`}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Cancel or Recover Expired Agreement &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
