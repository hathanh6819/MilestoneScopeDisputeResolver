import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AgreementRecord, DisputeRecord } from '../lib/types';

export function ArbitrationPage({ agreements, disputes, walletAddress, onResolve }: {
  agreements: AgreementRecord[]; disputes: Record<number, DisputeRecord>; walletAddress: string | null;
  onResolve: (id: number, revision: number, ruling: number, reference: string) => Promise<void>;
}) {
  const id = Number(useParams().id);
  const agreement = agreements.find(a => a.agreement_id === id);
  const dispute = disputes[id];
  const [ruling, setRuling] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!agreement || !dispute) return <p>Record not loaded.</p>;
  const eligible = walletAddress?.toLowerCase() === agreement.fallback_arbitrator.toLowerCase() && agreement.state === 6 && [0,5].includes(dispute.ruling);
  return <div className="max-w-2xl space-y-5">
    <Link to={`/agreement/${id}`} className="underline">Back to agreement</Link>
    <h1 className="text-2xl font-bold">Pre-agreed arbitration</h1>
    <p>This is a signed decision by the locked arbitrator, not AI consensus or a validator evidence receipt.</p>
    <p className="break-all">Arbitrator: {agreement.fallback_arbitrator}</p>
    <p>Available after: {Number(dispute.fallback_after) > 0 ? new Date(Number(dispute.fallback_after) * 1000).toLocaleString() : 'No dispute opened'}. The contract enforces transaction time.</p>
    <p>Recorded decision origin: {dispute.decision_origin}</p>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await onResolve(id,dispute.active_revision,Number(ruling),reference.trim()); } catch (err) { setError(String(err)); } finally { setBusy(false); } }}>
      <label className="block">Ruling<select required value={ruling} onChange={e => setRuling(e.target.value)} className="block p-3 bg-slate-900 border border-slate-700">
        <option value="">Choose a ruling</option><option value="1">Delivered — 100% worker</option><option value="3">Partial — 50% each</option><option value="4">Not delivered — 100% client</option>
      </select></label>
      <label className="block">Decision reference<input required minLength={8} maxLength={256} value={reference} onChange={e => setReference(e.target.value)} className="block w-full p-3 bg-slate-900 border border-slate-700" /></label>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      <button disabled={!eligible || busy} className="p-3 bg-indigo-600 disabled:opacity-40">Sign arbitration decision</button>
    </form>
  </div>;
}
