import React, { useState } from 'react';
import { FileSearch, ShieldCheck, ExternalLink, Hash, CheckCircle2, Search } from 'lucide-react';
import { AgreementRecord, DisputeRecord, ActivityItem } from '../lib/types';
import { studionet, shortenAddress } from '../lib/genlayer';

interface ExplorerPageProps {
  agreements: AgreementRecord[];
  disputes: Record<number, DisputeRecord>;
  activities: ActivityItem[];
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({ agreements, disputes, activities }) => {
  const [selectedId, setSelectedId] = useState<number>(agreements[0]?.agreement_id || 1);

  const selectedAgreement = agreements.find((a) => a.agreement_id === selectedId);
  const selectedDispute = disputes[selectedId];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <FileSearch className="w-7 h-7 text-sky-400" />
          Digest Proof & Integrity Explorer
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Inspect immutable cryptographic evidence digests calculated by GenLayer validators directly from canonical GitHub responses.
        </p>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Select Agreement to Inspect:</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-xl font-mono focus:outline-none"
        >
          {agreements.map((ag) => (
            <option key={ag.agreement_id} value={ag.agreement_id}>
              #{ag.agreement_id} - {ag.repository}
            </option>
          ))}
        </select>
      </div>

      {/* Digest Details */}
      {selectedAgreement && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Cryptographic Integrity Proofs for Agreement #{selectedAgreement.agreement_id}
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Scope Commit SHA Anchor</span>
              <span className="font-mono text-xs text-sky-400 block">{selectedAgreement.scope_commit}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Scope Document Location</span>
              <span className="font-mono text-xs text-slate-200 block">
                {selectedAgreement.repository}/{selectedAgreement.scope_path}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Validator Aggregate Evidence Digest (SHA-256)</span>
              <span className="font-mono text-xs text-emerald-400 block break-all">
                {selectedDispute?.evidence_digest || 'No evidence digest recorded on-chain'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Diagnostic Ruling Code</span>
              <span className="font-mono text-xs text-purple-400 block">
                {selectedDispute?.reason_code || 'No reason code recorded'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Hash className="w-5 h-5 text-sky-400" />
          Recent Transaction Audit Trail
        </h2>

        {activities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
            No on-chain transactions submitted during this browser session.
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">{item.method}</span>
                  <span className="text-slate-500">by {shortenAddress(item.actor)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">{item.amount ? `${item.amount} GEN` : ''}</span>
                  <a
                    href={`${studionet.blockExplorers.default.url}/tx/${item.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {shortenAddress(item.txHash, 4)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
