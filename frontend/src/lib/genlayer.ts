import { defineChain, formatUnits, parseUnits, isAddress } from 'viem';


// GenLayer StudioNet Chain Configuration
export const studionet = defineChain({
  id: 61999,
  name: 'GenLayer StudioNet',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
    public: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Explorer',
      url: 'https://explorer-studio.genlayer.com',
    },
  },
});

export const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || '';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function getContractAddress(): string {
  return DEFAULT_CONTRACT_ADDRESS;
}

export function requireContractAddress(): `0x${string}` {
  if (!isAddress(DEFAULT_CONTRACT_ADDRESS) || DEFAULT_CONTRACT_ADDRESS.toLowerCase() === ZERO_ADDRESS) {
    throw new Error('No valid deployment configured. Set VITE_CONTRACT_ADDRESS after deployment.');
  }
  return DEFAULT_CONTRACT_ADDRESS as `0x${string}`;
}

export function formatGen(wei: bigint | string | number): string {
  try {
    const val = typeof wei === 'bigint' ? wei : BigInt(wei);
    return formatUnits(val, 18);
  } catch {
    return 'Unavailable';
  }
}

export function parseGenToWei(genAmount: string | number): bigint {
  const amount = String(genAmount).trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(amount)) throw new Error('Enter a nonnegative GEN amount with at most 18 decimal places.');
  const value = parseUnits(amount, 18);
  if (value >= 2n ** 256n) throw new Error('Amount exceeds contract bounds.');
  return value;
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function getAgreementStatusBadge(state: number) {
  switch (state) {
    case 1:
      return { label: 'DRAFT', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    case 2:
      return { label: 'AWAITING ACCEPTANCE', color: 'bg-amber-950/60 text-amber-400 border-amber-800/80' };
    case 3:
      return { label: 'ACTIVE', color: 'bg-blue-950/60 text-blue-400 border-blue-800/80' };
    case 4:
      return { label: 'DELIVERY SUBMITTED', color: 'bg-purple-950/60 text-purple-400 border-purple-800/80' };
    case 5:
      return { label: 'ACCEPTED', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' };
    case 6:
      return { label: 'DISPUTED', color: 'bg-rose-950/60 text-rose-400 border-rose-800/80' };
    case 7:
      return { label: 'ASSESSED', color: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/80' };
    case 8:
      return { label: 'SETTLEMENT AUTHORIZED', color: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80' };
    case 9:
      return { label: 'SETTLED', color: 'bg-emerald-900/80 text-emerald-300 border-emerald-500' };
    case 10:
      return { label: 'CANCELLED', color: 'bg-zinc-900 text-zinc-400 border-zinc-700' };
    default:
      return { label: 'UNKNOWN', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
}

export function getRulingBadge(ruling: number) {
  switch (ruling) {
    case 0:
      return { label: 'PENDING', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    case 1:
      return { label: 'DELIVERED (100% Worker)', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-700' };
    case 2:
      return { label: 'OUT OF SCOPE CHANGE (100% Worker)', color: 'bg-cyan-950/70 text-cyan-300 border-cyan-700' };
    case 3:
      return { label: 'PARTIAL (50% Worker / 50% Client)', color: 'bg-amber-950/70 text-amber-300 border-amber-700' };
    case 4:
      return { label: 'NOT DELIVERED (100% Client Refund)', color: 'bg-rose-950/70 text-rose-300 border-rose-700' };
    case 5:
      return { label: 'UNRESOLVED (Retry / Recover)', color: 'bg-purple-950/70 text-purple-300 border-purple-700' };
    default:
      return { label: 'UNKNOWN', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
}

export function getClauseResultBadge(result: number) {
  switch (result) {
    case 1:
      return { label: 'SATISFIED', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-800' };
    case 2:
      return { label: 'PARTIALLY SATISFIED', color: 'bg-amber-950/80 text-amber-400 border-amber-800' };
    case 3:
      return { label: 'UNSATISFIED', color: 'bg-rose-950/80 text-rose-400 border-rose-800' };
    case 4:
      return { label: 'ADDED AFTER FREEZE', color: 'bg-cyan-950/80 text-cyan-400 border-cyan-800' };
    default:
      return { label: 'NOT EVALUABLE', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
}
