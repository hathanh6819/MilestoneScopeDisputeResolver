import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Search, PlusCircle, Filter, ArrowRight, GitCommit, Scale } from 'lucide-react';
import { AgreementRecord } from '../lib/types';
import { formatGen, getAgreementStatusBadge, shortenAddress } from '../lib/genlayer';

interface AgreementsListPageProps {
  agreements: AgreementRecord[];
}

export const AgreementsListPage: React.FC<AgreementsListPageProps> = ({ agreements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'ALL'>('ALL');

  const filtered = agreements.filter((ag) => {
    const matchesSearch =
      ag.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ag.agreement_id.toString() === searchTerm.trim() ||
      ag.policy_text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ag.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-sky-400" />
            Milestone Agreements Directory
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse and inspect all registered bilateral milestone agreements and their lifecycle status.
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Agreement
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by repository name, agreement ID, or clause keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { label: 'All', val: 'ALL' },
            { label: 'Awaiting', val: 2 },
            { label: 'Active', val: 3 },
            { label: 'Delivered', val: 4 },
            { label: 'Disputed', val: 6 },
            { label: 'Assessed', val: 7 },
            { label: 'Settled', val: 9 }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.val as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.val
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agreements Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No agreements matched your criteria</h3>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ag) => {
            const badge = getAgreementStatusBadge(ag.state);
            return (
              <div
                key={ag.agreement_id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      #{ag.agreement_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors mb-2 truncate">
                    {ag.repository}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {ag.policy_text}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Deposit</span>
                      <span className="font-bold text-emerald-400">{formatGen(ag.deposit_wei)} GEN</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Scope Commit</span>
                      <span className="text-sky-400">{ag.scope_commit.slice(0, 7)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <Link
                    to={`/agreement/${ag.agreement_id}`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {ag.state === 6 && (
                    <Link
                      to={`/dispute/${ag.agreement_id}/assess`}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
                    >
                      Assess
                    </Link>
                  )}

                  {ag.state === 7 && (
                    <Link
                      to={`/dispute/${ag.agreement_id}/settle`}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                    >
                      Settle
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
