import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  GitCommit,
  Scale,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Coins,
  FileCheck2,
  AlertOctagon,
  Layers
} from 'lucide-react';
import { AgreementRecord, AccountingRecord } from '../lib/types';
import { formatGen, getAgreementStatusBadge, shortenAddress } from '../lib/genlayer';

interface DashboardPageProps {
  agreements: AgreementRecord[];
  accounting: AccountingRecord;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ agreements, accounting }) => {
  const activeAgreements = agreements.filter((a) => a.state === 3 || a.state === 4);
  const disputedAgreements = agreements.filter((a) => a.state === 6 || a.state === 7);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1628] via-[#0f1d38] to-[#0a1224] border border-sky-500/20 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-4">
            <Scale className="w-3.5 h-3.5" />
            GenLayer Multi-Validator Semantic Adjudication
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Bilateral Milestone Scope <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-teal-300">
              Dispute Resolution Protocol
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Lock milestone scope at exact Git commit SHAs. When delivery disputes arise, independent GenLayer
            validators autonomously acquire canonical GitHub diffs, adjudicate clause fulfillment, isolate post-freeze
            scope creep, and enforce deterministic proportional payouts.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create Agreement
            </Link>
            <Link
              to="/agreements"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <FolderKanban className="w-4 h-4" />
              Browse Agreements ({agreements.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Global Protocol Accounting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Deposited
            </span>
            <span className="text-2xl font-black text-white">{formatGen(accounting.total_deposited_wei)} GEN</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Active Reserved
            </span>
            <span className="text-2xl font-black text-white">{formatGen(accounting.total_reserved_wei)} GEN</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Paid to Workers
            </span>
            <span className="text-2xl font-black text-emerald-400">{formatGen(accounting.total_paid_wei)} GEN</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Refunded to Clients
            </span>
            <span className="text-2xl font-black text-amber-400">{formatGen(accounting.total_refunded_wei)} GEN</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
            <GitCommit className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Dual Git Commit Boundary</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The agreement establishes an immutable boundary between the frozen scope commit (C_scope) and delivery commit (C_delivery). No subsequent branch edits can tamper with scope facts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Clause Consensus Isolation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI validators do not decide monetary payouts. They only classify clauses into discrete enums (SATISFIED, ADDED_AFTER_FREEZE, etc.). Smart contract code deterministically computes the split.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Scope Creep Defense</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Demands added by clients after milestone freeze are automatically tagged ADDED_AFTER_FREEZE. Workers receive 100% payout even if newly demanded features were omitted.
          </p>
        </div>
      </div>

      {/* Active & Disputed Agreements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-sky-400" />
            Active Agreements
          </h2>
          <Link to="/agreements" className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
            View All ({agreements.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {agreements.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
            No agreements created yet. Click "Create Agreement" to register your first milestone.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((ag) => {
              const badge = getAgreementStatusBadge(ag.state);
              return (
                <div
                  key={ag.agreement_id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-slate-400 font-semibold">
                        AGREEMENT #{ag.agreement_id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate mb-1">
                      {ag.repository}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {ag.policy_text}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Deposit</span>
                        <span className="font-bold text-white">{formatGen(ag.deposit_wei)} GEN</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Scope SHA</span>
                        <span className="text-sky-400">{ag.scope_commit.slice(0, 7)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <Link
                      to={`/agreement/${ag.agreement_id}`}
                      className="flex-1 text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      View Details
                    </Link>
                    {ag.state === 6 && (
                      <Link
                        to={`/dispute/${ag.agreement_id}/assess`}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                      >
                        Assess Dispute
                      </Link>
                    )}
                    {ag.state === 7 && (
                      <Link
                        to={`/dispute/${ag.agreement_id}/settle`}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                      >
                        Settle Split
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
