import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  FolderKanban,
  FileSearch,
  Wallet,
  ExternalLink,
  Settings,
  Scale,
  GitCommit,
  Layers,
  HelpCircle,
  Activity
} from 'lucide-react';
import { shortenAddress, getContractAddress } from '../lib/genlayer';

interface AppShellProps {
  children: React.ReactNode;
  walletAddress: string | null;
  onConnectWallet: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  walletAddress,
  onConnectWallet,
}) => {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Activity },
    { label: 'Create Agreement', path: '/create', icon: PlusCircle },
    { label: 'Agreements Directory', path: '/agreements', icon: FolderKanban },
    { label: 'Proof Explorer', path: '/explorer', icon: FileSearch },
  ];


  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-sky-500/10 border border-sky-500/30 group-hover:border-sky-400 transition-all flex items-center justify-center bg-slate-900">
              <img
                src="/logo.jpg"
                alt="MilestoneScopeDisputeResolver Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback icon if logo image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Scale className="w-5 h-5 text-sky-400 absolute" style={{ zIndex: -1 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  MilestoneScope
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/60">
                  Dispute Resolver
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Decentralized Milestone Scope Dispute Resolution
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Contract Address, Settings, Connect Wallet */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Contract Settings"
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onConnectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                walletAddress
                  ? 'bg-slate-800/90 text-emerald-300 border border-emerald-500/40 hover:bg-slate-800'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-600/20'
              }`}
            >
              <Wallet className="w-4 h-4" />
              {walletAddress ? shortenAddress(walletAddress) : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Modal / Dropdown for Contract Address Settings */}
        {showSettings && (
          <div className="max-w-7xl mx-auto mt-3 p-4 bg-slate-900/95 border border-slate-700/80 rounded-xl text-xs shadow-xl animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white">Target Intelligent Contract Address</span>
                <p className="text-slate-400 text-[11px]">Build-time deployment address (no browser override):</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {getContractAddress() ? <a className="font-mono underline" href={`https://explorer-studio.genlayer.com/address/${getContractAddress()}`} target="_blank" rel="noreferrer">{getContractAddress()}</a> : <span>Not configured</span>}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 px-4 lg:px-8 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            
            <span>Target network: GenLayer Studionet</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">{shortenAddress(getContractAddress(), 6)}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Judgment Authority ≠ Execution Authority</span>
            <span>•</span>
            <span className="text-sky-400">Canonical GitHub Git Commits API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
