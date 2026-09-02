import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  GitCompare,
  FileCheck2,
  AlertCircle,
  Coins,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AgreementRecord, DeliveryRecord, DisputeRecord, ClauseResultRecord } from '../lib/types';
import { getRulingBadge, getClauseResultBadge, shortenAddress } from '../lib/genlayer';

interface AssessDisputePageProps {
  agreements: AgreementRecord[];
  deliveries: Record<number, DeliveryRecord>;
  disputes: Record<number, DisputeRecord>;
  clauses: Record<number, ClauseResultRecord[]>;
  onAssessDispute: (agreementId: number, expectedRevision: number) => Promise<void>;
  onAuthorizeSettlement: (agreementId: number, expectedRevision: number) => Promise<void>;
  onRetryAssessment: (agreementId: number, expectedRevision: number) => Promise<void>;
}

export const AssessDisputePage: React.FC<AssessDisputePageProps> = ({
  agreements,
  deliveries,
  disputes,
  clauses,
  onAssessDispute,
  onAuthorizeSettlement,
  onRetryAssessment,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agreementId = parseInt(id || '0', 10);
  const agreement = agreements.find((a) => a.agreement_id === agreementId);
  const delivery = deliveries[agreementId];
  const dispute = disputes[agreementId];
  const clauseList = clauses[agreementId] || [];

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agreement) {
    return <div className="p-8 text-center text-white">Agreement not found.</div>;
  }

  const activeRev = dispute?.active_revision || 1;
  const rulingBadge = dispute ? getRulingBadge(dispute.ruling) : getRulingBadge(0);

  const handleRunAssessment = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onAssessDispute(agreementId, activeRev);
    } catch (err: any) {
      setError(err?.message || 'Assessment execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onAuthorizeSettlement(agreementId, activeRev);
      navigate(`/dispute/${agreementId}/settle`);
    } catch (err: any) {
      setError(err?.message || 'Settlement authorization failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onRetryAssessment(agreementId, activeRev);
    } catch (err: any) {
      setError(err?.message || 'Retry assessment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Link to={`/agreement/${agreementId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Agreement #{agreementId}
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 font-bold">DISPUTE REVISION #{activeRev}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rulingBadge.color}`}>
                {rulingBadge.label}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Validator Consensus Assessment</h1>
          </div>

          <button
            onClick={handleRunAssessment}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <Scale className="w-4 h-4" />
            {isProcessing ? 'Adjudicating on GenLayer...' : 'Run / Re-evaluate Assessment'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Canonical GitHub Endpoints */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Autonomous Canonical GitHub Evidence Endpoints
          </h3>
          <p className="text-xs text-slate-400">
            Constructed strictly by the contract from registered <span className="font-mono text-slate-300">{agreement.repository}</span> and validated SHAs:
          </p>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
              1. https://api.github.com/repos/{agreement.repository}/git/commits/{agreement.scope_commit}
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
              2. https://api.github.com/repos/{agreement.repository}/git/commits/{delivery?.delivery_commit || '{delivery_sha}'}
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
              3. https://raw.githubusercontent.com/{agreement.repository}/{agreement.scope_commit}/{agreement.scope_path}
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
              4. https://raw.githubusercontent.com/{agreement.repository}/{delivery?.delivery_commit || '{delivery_sha}'}/{delivery?.delivery_notes_path || '{notes_path}'}
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 truncate">
              5. https://api.github.com/repos/{agreement.repository}/compare/{agreement.scope_commit}...{delivery?.delivery_commit || '{delivery_sha}'}
            </div>
          </div>
        </div>

        {/* Clause Evaluation Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Clause-Level Consensus Adjudication</h3>
          {clauseList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
              No clause breakdown recorded yet. Click "Run / Re-evaluate Assessment" to trigger the validator jury.
            </div>
          ) : (
            <div className="space-y-2">
              {clauseList.map((cl, idx) => {
                const cBadge = getClauseResultBadge(cl.result);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold">{cl.clause_id}</span>
                      <span className="text-[10px] text-slate-500">
                        {cl.material ? '(Material Clause)' : '(Non-Material Clause)'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cBadge.color}`}>
                      {cBadge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derived Split Band & Action */}
        {dispute && dispute.ruling !== 0 && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Derived Policy Split Band</span>
                <span className="text-lg font-bold text-white">
                  Worker: {dispute.worker_split_bps / 100}% | Client: {dispute.client_split_bps / 100}%
                </span>
              </div>
              <span className="font-mono text-[11px] text-sky-400 bg-sky-950/60 px-3 py-1 rounded-lg border border-sky-800/60">
                Reason: {dispute.reason_code}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              {dispute.ruling === 5 ? (
                <button
                  onClick={handleRetry}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Transient Assessment
                </button>
              ) : dispute.settlement_authorized === 1 ? (
                <Link
                  to={`/dispute/${agreementId}/settle`}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  Proceed to Settlement Execution &rarr;
                </Link>
              ) : (
                <button
                  onClick={handleAuthorize}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Authorize Settlement Permission
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
