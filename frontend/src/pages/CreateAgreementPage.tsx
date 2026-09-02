import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, ShieldCheck, AlertCircle, Info, Coins, Clock, FileCode } from 'lucide-react';
import { parseGenToWei } from '../lib/genlayer';

interface CreateAgreementPageProps {
  onCreateAgreement: (
    repository: string,
    scopeCommit: string,
    scopePath: string,
    policyText: string,
    depositGen: string,
    deadlineSeconds: number,
    arbitrator: string
  ) => Promise<void>;
}

export const CreateAgreementPage: React.FC<CreateAgreementPageProps> = ({ onCreateAgreement }) => {
  const navigate = useNavigate();

  const [repo, setRepo] = useState('');
  const [scopeSha, setScopeSha] = useState('');
  const [scopePath, setScopePath] = useState('');
  const [policyText, setPolicyText] = useState('');
  const [arbitrator, setArbitrator] = useState('');
  const [depositGen, setDepositGen] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('14');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!repo.includes('/') || repo.split('/').length !== 2) {
      setError("Repository must be in 'owner/repo' format.");
      return;
    }

    const shaTrim = scopeSha.trim().toLowerCase();
    if (shaTrim.length !== 40 || !/^[0-9a-f]{40}$/.test(shaTrim)) {
      setError('Scope Commit SHA must be exactly 40 hexadecimal characters.');
      return;
    }

    if (!scopePath.trim() || scopePath.includes('..')) {
      setError('Invalid scope path. Directory traversal (..) is not permitted.');
      return;
    }

    if (!policyText.trim() || policyText.length > 4000) {
      setError('Policy text must be non-empty and under 4,000 characters.');
      return;
    }

    const depNum = parseFloat(depositGen);
    if (isNaN(depNum) || depNum < 0) {
      setError('Deposit must be 0 or a positive GEN value.');
      return;
    }

    const days = parseInt(deadlineDays, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      setError('Deadline must be between 1 and 30 days.');
      return;
    }

    const deadlineSecs = days * 86400;

    try {
      setIsSubmitting(true);
      parseGenToWei(depositGen);
      await onCreateAgreement(repo.trim(), shaTrim, scopePath.trim(), policyText.trim(), depositGen, deadlineSecs, arbitrator.trim());
      navigate('/agreements');
    } catch (err: any) {
      setError(err?.message || 'Failed to create agreement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <Link to="/agreements" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Bilateral Agreement Initialization
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create Milestone Scope Agreement</h1>
          <p className="text-slate-400 text-xs mt-1">
            Lock the scope at an exact immutable Git commit SHA. If work diverges, independent validators judge delivery facts against this exact revision.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs text-slate-300">Pre-agreed independent arbitrator
            <input required value={arbitrator} onChange={e => setArbitrator(e.target.value)} placeholder="0x…" pattern="0x[0-9a-fA-F]{40}" className="block w-full p-3 bg-slate-950 border border-slate-700 rounded-xl mt-2" />
            <span className="block mt-2 text-slate-400">Locked at creation. Neither client nor worker may be the arbitrator. After the fallback waiting period this address may resolve an undecided dispute. Both parties must trust its fairness and availability.</span>
          </label>
          {/* Repository & Commit SHA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                GitHub Repository (owner/repo)
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repository"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Scope Document Path
              </label>
              <input
                type="text"
                value={scopePath}
                onChange={(e) => setScopePath(e.target.value)}
                placeholder="SCOPE.md"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Frozen Scope Git Commit SHA (40 Characters)
            </label>
            <input
              type="text"
              value={scopeSha}
              onChange={(e) => setScopeSha(e.target.value)}
              placeholder="40-character Git commit SHA"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-sky-400 font-mono focus:border-sky-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Validators fetch raw content directly from <span className="font-mono text-slate-400">raw.githubusercontent.com/.../{'{'}scope_sha{'}'}/...</span>
            </p>
          </div>

          {/* Policy Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Milestone Acceptance Policy & Scope Clauses
            </label>
            <textarea
              rows={4}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              placeholder="Detail the exact deliverables and acceptance criteria..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Deposit & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-sky-400" />
                Initial Escrow Deposit (GEN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={depositGen}
                onChange={(e) => setDepositGen(e.target.value)}
                placeholder="2.5"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold font-mono focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Sent as payable message.value with contract creation.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Delivery Deadline (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                placeholder="14"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Allows timeout recovery if worker fails to deliver.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Agreement on GenLayer...' : 'Create & Lock Agreement'}
          </button>
        </form>
      </div>
    </div>
  );
};
