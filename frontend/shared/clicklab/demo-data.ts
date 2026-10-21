import type { TradingNicheId } from './niches';

export interface DemoThumbnailVariant {
  id: string;
  nicheId: TradingNicheId;
  title: string;
  subtitle: string;
  palette: [string, string, string];
  layout: 'split' | 'hero-face' | 'chart-focus';
}

export interface DemoAvatar {
  id: string;
  name: string;
  trained: boolean;
  trainingStatus: 'idle' | 'uploading' | 'training' | 'ready' | 'error';
  photoCount: number;
  accent: string;
}

export interface DemoProject {
  id: string;
  title: string;
  nicheId: TradingNicheId;
  platform: string;
  updatedAt: string;
}

export const DEMO_THUMBNAIL_VARIANTS: DemoThumbnailVariant[] = [
  {
    id: 'v1',
    nicheId: 'forex-ict',
    title: 'EUR/USD LIQUIDITY GRAB',
    subtitle: 'ICT · London Session',
    palette: ['#0a0f0d', '#39ff88', '#8b5cf6'],
    layout: 'chart-focus',
  },
  {
    id: 'v2',
    nicheId: 'crypto',
    title: 'BITCOIN BREAKOUT',
    subtitle: 'Altcoins lagging?',
    palette: ['#0c0a12', '#f97316', '#a855f7'],
    layout: 'split',
  },
  {
    id: 'v3',
    nicheId: 'prop-firm',
    title: '100K PASSED',
    subtitle: 'Payout proof inside',
    palette: ['#050807', '#4ade80', '#22d3ee'],
    layout: 'hero-face',
  },
  {
    id: 'v4',
    nicheId: 'options',
    title: 'SPY 0DTE LEVELS',
    subtitle: 'Gamma pin watch',
    palette: ['#0a0810', '#c084fc', '#84cc16'],
    layout: 'chart-focus',
  },
  {
    id: 'v5',
    nicheId: 'futures',
    title: 'NQ OPENING DRIVE',
    subtitle: 'ES divergence',
    palette: ['#080b0f', '#34d399', '#6366f1'],
    layout: 'split',
  },
  {
    id: 'v6',
    nicheId: 'stocks',
    title: 'NVDA EARNINGS',
    subtitle: 'Beat vs guide',
    palette: ['#0b0c10', '#22d3ee', '#eab308'],
    layout: 'hero-face',
  },
  {
    id: 'v7',
    nicheId: 'psychology',
    title: 'STOP REVENGE TRADES',
    subtitle: '3 rules that work',
    palette: ['#0d0a14', '#a78bfa', '#4ade80'],
    layout: 'split',
  },
  {
    id: 'v8',
    nicheId: 'market-news',
    title: 'CPI SURPRISE',
    subtitle: 'What moves first',
    palette: ['#090c10', '#38bdf8', '#f472b6'],
    layout: 'chart-focus',
  },
  {
    id: 'v9',
    nicheId: 'educators',
    title: 'MASTERCLASS EP.12',
    subtitle: 'Liquidity series',
    palette: ['#0a0f0c', '#2dd4bf', '#7c3aed'],
    layout: 'hero-face',
  },
];

export const DEMO_AVATARS: DemoAvatar[] = [
  { id: 'av-demo-1', name: 'Alex (Demo)', trained: true, trainingStatus: 'ready', photoCount: 18, accent: '#39ff88' },
  { id: 'av-demo-2', name: 'Jordan (Demo)', trained: false, trainingStatus: 'idle', photoCount: 0, accent: '#a855f7' },
];

export const DEMO_RECENT_PROJECTS: DemoProject[] = [
  { id: 'p1', title: 'EUR/USD liquidity sweep recap', nicheId: 'forex-ict', platform: 'YouTube', updatedAt: '2h ago' },
  { id: 'p2', title: 'Bitcoin weekly levels', nicheId: 'crypto', platform: 'Shorts', updatedAt: 'Yesterday' },
  { id: 'p3', title: 'SPY 0DTE game plan', nicheId: 'options', platform: 'YouTube', updatedAt: '3d ago' },
];

export const LANDING_GALLERY_ITEMS = DEMO_THUMBNAIL_VARIANTS.slice(0, 6);
