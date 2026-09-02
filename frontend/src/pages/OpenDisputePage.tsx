import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Scale, ShieldAlert } from 'lucide-react';
import { AgreementRecord } from '../lib/types';

interface OpenDisputePageProps {
  agreements: AgreementRecord[];
  onOpenDispute: (agreementId: number, claimCode: string) => Promise<void>;
}

export const OpenDisputePage: React.FC<OpenDisputePageProps> = ({ agreements, onOpenDispute }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agreementId = parseInt(id || '0', 10);
  const agreement = agreements.find((a) => a.agreement_id === agreementId);

  const [claimCode, setClaimCode] = useState('MISSING_CORE_CLAUSE');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!agreement) {
    return <div className="p-8 text-center text-white">Agreement not found.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!claimCode.trim()) {
      setError('Claim code must not be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onOpenDispute(agreementId, claimCode.trim());
      navigate(`/dispute/${agreementId}/assess`);
    } catch (err: any) {
      setError(err?.message || 'Failed to open dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Link to={`/agreement/${agreementId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Agreement #{agreementId}
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-900/50 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            Bilateral Dispute Initiation
          </div>
          <h1 className="text-2xl font-extrabold text-white">Open Milestone Scope Dispute</h1>
          <p className="text-slate-400 text-xs mt-1">
            If the delivered commit does not align with the frozen scope, initiate validator consensus adjudication.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dispute Category / Claim Code
            </label>
            <select
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
            >
              <option value="MISSING_CORE_CLAUSE">MISSING_CORE_CLAUSE - Core deliverable omitted</option>
              <option value="SCOPE_CREEP_CLAIM">SCOPE_CREEP_CLAIM - Deliverables conflict with scope</option>
              <option value="TEST_COVERAGE_FAIL">TEST_COVERAGE_FAIL - Required test suites not delivered</option>
              <option value="SIGNATURE_DEFECT">SIGNATURE_DEFECT - Non-functional security implementation</option>
              <option value="CUSTOM_CLAIM">CUSTOM_CLAIM - Other scope mismatch</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Scale className="w-4 h-4" />
            {isSubmitting ? 'Registering Dispute Revision on GenLayer...' : 'Open Dispute & Trigger Validators'}
          </button>
        </form>
      </div>
    </div>
  );
};
