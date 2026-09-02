import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, GitCommit, AlertCircle, Send, FileText } from 'lucide-react';
import { AgreementRecord } from '../lib/types';

interface SubmitDeliveryPageProps {
  agreements: AgreementRecord[];
  onSubmitDelivery: (
    agreementId: number,
    deliveryCommit: string,
    deliveryNotesPath: string,
    prNumber: number
  ) => Promise<void>;
}

export const SubmitDeliveryPage: React.FC<SubmitDeliveryPageProps> = ({ agreements, onSubmitDelivery }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agreementId = parseInt(id || '0', 10);
  const agreement = agreements.find((a) => a.agreement_id === agreementId);

  const [deliverySha, setDeliverySha] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [prNum, setPrNum] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!agreement) {
    return <div className="p-8 text-center text-white">Agreement not found.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const shaTrim = deliverySha.trim().toLowerCase();
    if (shaTrim.length !== 40 || !/^[0-9a-f]{40}$/.test(shaTrim)) {
      setError('Delivery commit SHA must be exactly 40 hexadecimal characters.');
      return;
    }

    if (shaTrim === agreement.scope_commit.toLowerCase()) {
      setError('Delivery commit SHA cannot be identical to the frozen scope commit SHA.');
      return;
    }

    if (!deliveryNotes.trim() || deliveryNotes.includes('..')) {
      setError('Invalid delivery notes path. Directory traversal (..) is prohibited.');
      return;
    }

    const pr = parseInt(prNum, 10);
    if (isNaN(pr) || pr < 0) {
      setError('Pull Request number must be 0 or a positive integer.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitDelivery(agreementId, shaTrim, deliveryNotes.trim(), pr);
      navigate(`/agreement/${agreementId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit delivery.');
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

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GitCommit className="w-4 h-4" />
            Worker Delivery Phase
          </div>
          <h1 className="text-2xl font-extrabold text-white">Submit Milestone Delivery Evidence</h1>
          <p className="text-slate-400 text-xs mt-1">
            Publish your exact delivery commit SHA and delivery release notes path to anchor completed work.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Delivery Git Commit SHA (40 Hexadecimal Characters)
            </label>
            <input
              type="text"
              value={deliverySha}
              onChange={(e) => setDeliverySha(e.target.value)}
              placeholder="40-character delivery commit SHA"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-purple-300 font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Delivery Notes Path
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="DELIVERY.md"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pull Request # (Optional)
              </label>
              <input
                type="number"
                value={prNum}
                onChange={(e) => setPrNum(e.target.value)}
                placeholder="42"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting Delivery to Chain...' : 'Record Delivery Submission'}
          </button>
        </form>
      </div>
    </div>
  );
};
