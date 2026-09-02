import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { TransactionProgress } from './components/TransactionProgress';

import { DashboardPage } from './pages/DashboardPage';
import { CreateAgreementPage } from './pages/CreateAgreementPage';
import { AgreementsListPage } from './pages/AgreementsListPage';
import { AgreementDetailPage } from './pages/AgreementDetailPage';
import { SubmitDeliveryPage } from './pages/SubmitDeliveryPage';
import { OpenDisputePage } from './pages/OpenDisputePage';
import { AssessDisputePage } from './pages/AssessDisputePage';
import { SettleDisputePage } from './pages/SettleDisputePage';
import { CancelAgreementPage } from './pages/CancelAgreementPage';
import { ExplorerPage } from './pages/ExplorerPage';

import {
  AgreementRecord,
  DeliveryRecord,
  DisputeRecord,
  ClauseResultRecord,
  AccountingRecord,
  ActivityItem,
  TxStep,
} from './lib/types';


import { connectWallet, loadSnapshot, send, waitForSuccess, FinalizedExecutionError, type Snapshot } from './lib/chain';
import { getContractAddress, parseGenToWei } from './lib/genlayer';
import { ArbitrationPage } from './pages/ArbitrationPage';

export const App: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const busy = useRef(false);
  const pendingKey = 'pending-tx:' + getContractAddress();
  const [pending, setPending] = useState<string | null>(() => sessionStorage.getItem(pendingKey));
  const refresh = async () => {
    setLoading(true);
    try { const next = await loadSnapshot(); setSnapshot(next); setLoadError(''); return next; }
    catch (err) { setSnapshot(null); setLoadError(String(err)); throw err; }
    finally { setLoading(false); }
  };
  useEffect(() => { if (getContractAddress()) void refresh().catch(() => {}); }, []);
  useEffect(() => {
    const provider = (window as any).ethereum;
    const changed = () => setWalletAddress(null);
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    provider?.on?.('disconnect', changed);
    return () => {
      provider?.removeListener?.('accountsChanged', changed);
      provider?.removeListener?.('chainChanged', changed);
      provider?.removeListener?.('disconnect', changed);
    };
  }, []);
  const agreements = snapshot?.agreements ?? [];
  const deliveries = snapshot?.deliveries ?? {};
  const disputes = snapshot?.disputes ?? {};
  const clauses = snapshot?.clauses ?? {};

  // Transaction Progress Modal State
  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    step: TxStep;
    txHash?: string;
    errorMessage?: string;
    onRetry?: () => void;
  }>({
    isOpen: false,
    step: 'IDLE',
  });

  const handleConnectWallet = async () => {
    try { setWalletAddress(await connectWallet()); }
    catch (err) { setTxModal({ isOpen: true, step: 'ERROR', errorMessage: String(err) }); }
  };
  const execute = async (method: string, args: (string | number)[], value = 0n) => {
    if (busy.current || pending) throw new Error('A transaction is pending. Check its receipt before sending another.');
    if (!walletAddress || !snapshot) throw new Error('Connect wallet and load contract state first.');
    busy.current = true;
    let hash: `0x${string}` | undefined;
    try {
      setTxModal({ isOpen: true, step: 'WAITING_WALLET' });
      hash = await send(method, args, value, walletAddress);
      sessionStorage.setItem(pendingKey, hash);
      setPending(hash);
      setTxModal({ isOpen: true, step: 'CONSENSUS', txHash: hash });
      await waitForSuccess(hash);
      const next = await refresh();
      if (method !== 'create_agreement') {
        const record = next.agreements.find(a => a.agreement_id === args[0]);
        if (!record) throw new Error('Receipt succeeded but affected record could not be read back.');
        const expected: Record<string, number[]> = { accept_agreement: [3], submit_delivery: [4], open_dispute: [6], assess_dispute: [6,7], retry_assessment: [6,7], resolve_by_arbitrator: [7], authorize_settlement: [8], execute_settlement: [9], accept_delivery: [9], cancel_expired_agreement: [10], fund_agreement: [2,3] };
        if (!expected[method]?.includes(record.state)) throw new Error('Receipt finalized; state differs from expected (possible concurrent action). Inspect Explorer.');
      } else if (!next.agreements.some(a => a.client.toLowerCase() === walletAddress.toLowerCase() && a.repository === args[0] && a.scope_commit === args[1])) {
        throw new Error('Creation receipt succeeded but matching agreement was not found.');
      }
      setActivities(prev => [{ id: hash!, txHash: hash!, method, actor: walletAddress, timestamp: Date.now(), status: 'SUCCESS' }, ...prev]);
      sessionStorage.removeItem(pendingKey); setPending(null);
      setTxModal({ isOpen: true, step: 'SUCCESS', txHash: hash });
    } catch (err) {
      if (err instanceof FinalizedExecutionError) { sessionStorage.removeItem(pendingKey); setPending(null); }
      setTxModal({ isOpen: true, step: 'ERROR', txHash: hash, errorMessage: String(err) + (hash ? ' Do not resend automatically; check the existing hash.' : '') });
      throw err;
    } finally { busy.current = false; }
  };
  const checkPending = async () => {
    if (!pending || busy.current) return;
    busy.current = true;
    try {
      await waitForSuccess(pending as `0x${string}`);
      await refresh();
      sessionStorage.removeItem(pendingKey); setPending(null);
      setTxModal({ isOpen: true, step: 'SUCCESS', txHash: pending });
    } catch (err) {
      if (err instanceof FinalizedExecutionError) { sessionStorage.removeItem(pendingKey); setPending(null); }
      setTxModal({ isOpen: true, step: 'ERROR', txHash: pending, errorMessage: String(err) });
    }
    finally { busy.current = false; }
  };
  const handleCreateAgreement = (repo: string, sha: string, path: string, policy: string, amount: string, deadline: number, arbitrator: string) => execute('create_agreement', [repo,sha,path,policy,deadline,arbitrator], parseGenToWei(amount));
  const handleAcceptAgreement = (id: number) => execute('accept_agreement',[id]);
  const handleFundAgreement = (id: number, amount: string) => execute('fund_agreement',[id],parseGenToWei(amount));
  const handleSubmitDelivery = (id: number, sha: string, path: string, pr: number) => execute('submit_delivery',[id,sha,path,pr]);
  const handleAcceptDelivery = (id: number) => execute('accept_delivery',[id]);
  const handleOpenDispute = (id: number, claim: string) => execute('open_dispute',[id,claim]);
  const handleAssessDispute = (id: number, revision: number) => execute('assess_dispute',[id,revision]);
  const handleAuthorizeSettlement = (id: number, revision: number) => execute('authorize_settlement',[id,revision]);
  const handleExecuteSettlement = (id: number) => execute('execute_settlement',[id]);
  const handleCancelAgreement = (id: number) => execute('cancel_expired_agreement',[id]);
  const handleRetryAssessment = (id: number, revision: number) => execute('retry_assessment',[id,revision]);

  return (
    <BrowserRouter>
      <AppShell walletAddress={walletAddress} onConnectWallet={handleConnectWallet}>
        <div role="status" className="p-4 mb-6 border border-slate-700 rounded-xl text-slate-300">
          {!getContractAddress() ? 'Not deployed. Configure the verified contract address after deployment.' : loading ? 'Reading contract from Studionet…' : loadError || 'Contract state loaded from Studionet.'}
          {getContractAddress() && <button className="ml-4 underline" disabled={loading} onClick={() => void refresh().catch(() => {})}>Refresh</button>}
          {snapshot && snapshot.total > 100 && <p>Directory displays the latest 100 of {snapshot.total} agreements.</p>}
          {pending && <p>Unresolved transaction: {pending} <button className="underline" onClick={() => void checkPending()}>Check existing receipt</button></p>}
        </div>
        {loading && !snapshot && !loadError && (
          <div aria-label="Loading verified contract state" className="space-y-6 animate-pulse">
            <div className="h-32 rounded-2xl border border-slate-800 bg-slate-900/60" />
            <div className="grid gap-5 md:grid-cols-3">
              <div className="h-28 rounded-2xl border border-slate-800 bg-slate-900/60" />
              <div className="h-28 rounded-2xl border border-slate-800 bg-slate-900/60" />
              <div className="h-28 rounded-2xl border border-slate-800 bg-slate-900/60" />
            </div>
            <div className="h-56 rounded-2xl border border-slate-800 bg-slate-900/60" />
          </div>
        )}
        {snapshot && !loadError && <>
        <Routes>
          <Route path="/" element={<DashboardPage agreements={agreements} accounting={snapshot.accounting} />} />
          <Route path="/create" element={<CreateAgreementPage onCreateAgreement={handleCreateAgreement} />} />
          <Route path="/agreements" element={<AgreementsListPage agreements={agreements} />} />
          <Route
            path="/agreement/:id"
            element={
              <AgreementDetailPage
                agreements={agreements}
                deliveries={deliveries}
                disputes={disputes}
                walletAddress={walletAddress}
                onAcceptAgreement={handleAcceptAgreement}
                onFundAgreement={handleFundAgreement}
                onAcceptDelivery={handleAcceptDelivery}
              />
            }
          />
          <Route
            path="/agreement/:id/submit"
            element={<SubmitDeliveryPage agreements={agreements} onSubmitDelivery={handleSubmitDelivery} />}
          />
          <Route
            path="/agreement/:id/dispute"
            element={<OpenDisputePage agreements={agreements} onOpenDispute={handleOpenDispute} />}
          />
          <Route
            path="/dispute/:id/assess"
            element={
              <AssessDisputePage
                agreements={agreements}
                deliveries={deliveries}
                disputes={disputes}
                clauses={clauses}
                onAssessDispute={handleAssessDispute}
                onAuthorizeSettlement={handleAuthorizeSettlement}
                onRetryAssessment={handleRetryAssessment}
              />
            }
          />
          <Route
            path="/dispute/:id/settle"
            element={
              <SettleDisputePage
                agreements={agreements}
                disputes={disputes}
                onExecuteSettlement={handleExecuteSettlement}
              />
            }
          />
          <Route
            path="/agreement/:id/cancel"
            element={<CancelAgreementPage agreements={agreements} onCancelAgreement={handleCancelAgreement} />}
          />
          <Route
            path="/explorer"
            element={<ExplorerPage agreements={agreements} disputes={disputes} activities={activities} />}
          />
          <Route path="/dispute/:id/arbitrate" element={<ArbitrationPage agreements={agreements} disputes={disputes} walletAddress={walletAddress} onResolve={(id,rev,ruling,ref) => execute('resolve_by_arbitrator',[id,rev,ruling,ref])} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>}
      </AppShell>

      <TransactionProgress
        isOpen={txModal.isOpen}
        step={txModal.step}
        txHash={txModal.txHash}
        errorMessage={txModal.errorMessage}
        onClose={() => setTxModal((prev) => ({ ...prev, isOpen: false, step: 'IDLE' }))}
        onRetry={txModal.onRetry}
      />
    </BrowserRouter>
  );
};
