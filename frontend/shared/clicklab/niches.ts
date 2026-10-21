export type TradingNicheId =
  | 'forex-ict'
  | 'crypto'
  | 'prop-firm'
  | 'stocks'
  | 'options'
  | 'futures'
  | 'psychology'
  | 'market-news'
  | 'educators';

export interface TradingNicheStylePreset {
  id: string;
  label: string;
  description: string;
}

export interface TradingNiche {
  id: TradingNicheId;
  title: string;
  shortTitle: string;
  description: string;
  terminology: string[];
  accentHue: number;
  gradient: string;
  stylePresets: TradingNicheStylePreset[];
  sampleTopics: string[];
}

export const TRADING_NICHES: TradingNiche[] = [
  {
    id: 'forex-ict',
    title: 'Forex / ICT / Smart Money',
    shortTitle: 'Forex & ICT',
    description: 'Liquidity sweeps, fair value gaps, and session-based setups with institutional price-action aesthetics.',
    terminology: ['EUR/USD', 'GBP/USD', 'ICT', 'SMC', 'FVG', 'Order blocks'],
    accentHue: 145,
    gradient: 'from-emerald-500/20 via-cyan-500/10 to-violet-600/20',
    stylePresets: [
      { id: 'session-breakout', label: 'London Killzone', description: 'High-contrast session open with pair ticker' },
      { id: 'smc-map', label: 'SMC Map Overlay', description: 'Chart markup with liquidity labels' },
      { id: 'pair-focus', label: 'Major Pair Focus', description: 'Bold pair symbol and pip move callout' },
    ],
    sampleTopics: ['EUR/USD liquidity grab before NY open', 'GBP/USD SMC reversal setup'],
  },
  {
    id: 'crypto',
    title: 'Crypto / Bitcoin / Altcoins',
    shortTitle: 'Crypto',
    description: 'Volatility, breakouts, and narrative-driven thumbnails for Bitcoin, Ethereum, and altcoin audiences.',
    terminology: ['Bitcoin', 'Ethereum', 'Solana', 'Altcoins', 'Funding', 'Liquidations'],
    accentHue: 280,
    gradient: 'from-violet-500/25 via-fuchsia-500/10 to-emerald-400/15',
    stylePresets: [
      { id: 'btc-dominance', label: 'BTC Dominance', description: 'Orange-violet split with large BTC mark' },
      { id: 'alt-season', label: 'Alt Season Pulse', description: 'Multi-coin stack and momentum arrows' },
      { id: 'on-chain', label: 'On-Chain Drama', description: 'Wallet flow and exchange inflow cues' },
    ],
    sampleTopics: ['Bitcoin reclaim of key level', 'Solana breakout vs Ethereum lag'],
  },
  {
    id: 'prop-firm',
    title: 'Prop-Firm Challenges',
    shortTitle: 'Prop Firms',
    description: 'Funded account journeys, challenge rules, payout proof, and risk-limit storytelling.',
    terminology: ['Funded account', 'Challenge', 'Payout', 'Drawdown', 'Evaluation', 'Scaling'],
    accentHue: 165,
    gradient: 'from-emerald-400/20 via-teal-500/10 to-purple-600/20',
    stylePresets: [
      { id: 'payout-proof', label: 'Payout Proof', description: 'Certificate-style layout with green accent' },
      { id: 'challenge-pass', label: 'Challenge Passed', description: 'Progress bar and account size badge' },
      { id: 'rules-breakdown', label: 'Rules Breakdown', description: 'Checklist overlay on dark glass panel' },
    ],
    sampleTopics: ['How I passed a 100K evaluation', 'Prop firm payout week breakdown'],
  },
  {
    id: 'stocks',
    title: 'Stocks / Earnings / Analysis',
    shortTitle: 'Stocks',
    description: 'Ticker-led layouts for earnings reactions, sector rotation, and macro-linked equity stories.',
    terminology: ['NVDA', 'AAPL', 'Earnings', 'EPS beat', 'Guidance', 'Sector rotation'],
    accentHue: 210,
    gradient: 'from-cyan-500/15 via-blue-600/10 to-violet-500/20',
    stylePresets: [
      { id: 'earnings-beat', label: 'Earnings Beat', description: 'Ticker + candle reaction panel' },
      { id: 'watchlist', label: 'Watchlist Stack', description: 'Multi-ticker grid with heat colors' },
      { id: 'macro-stocks', label: 'Macro × Equities', description: 'Rates and index linkage headline' },
    ],
    sampleTopics: ['NVDA earnings reaction playbook', 'Top 3 stocks before CPI'],
  },
  {
    id: 'options',
    title: 'Options / SPY / QQQ / 0DTE',
    shortTitle: 'Options',
    description: 'Strike maps, expiry countdowns, and gamma-focused visuals for index options creators.',
    terminology: ['SPY', 'QQQ', '0DTE', 'Strike', 'Gamma', 'IV crush'],
    accentHue: 300,
    gradient: 'from-purple-500/25 via-pink-500/10 to-lime-400/15',
    stylePresets: [
      { id: '0dte-countdown', label: '0DTE Countdown', description: 'Expiry timer and strike ladder' },
      { id: 'gamma-pin', label: 'Gamma Pin', description: 'Level-focused SPY/QQQ layout' },
      { id: 'spread-recap', label: 'Spread Recap', description: 'Risk/reward card with neon legs' },
    ],
    sampleTopics: ['SPY 0DTE levels for FOMC', 'QQQ call spread walkthrough'],
  },
  {
    id: 'futures',
    title: 'Futures / Indices / Day Trading',
    shortTitle: 'Futures',
    description: 'Fast-moving index futures visuals with order flow, levels, and session rhythm.',
    terminology: ['NQ', 'ES', 'Order flow', 'VWAP', 'Opening range', 'Delta'],
    accentHue: 130,
    gradient: 'from-lime-400/20 via-emerald-500/10 to-indigo-600/20',
    stylePresets: [
      { id: 'nq-levels', label: 'NQ Level Map', description: 'Large NQ tag with intraday zones' },
      { id: 'order-flow', label: 'Order Flow Clip', description: 'Footprint-inspired abstract panel' },
      { id: 'open-drive', label: 'Opening Drive', description: 'First 15 minutes highlight frame' },
    ],
    sampleTopics: ['NQ opening range strategy', 'ES vs NQ divergence today'],
  },
  {
    id: 'psychology',
    title: 'Trading Psychology / Education',
    shortTitle: 'Psychology',
    description: 'Mindset, discipline, and risk framing for educational trading channels.',
    terminology: ['Discipline', 'Risk', 'Mindset', 'Journaling', 'Tilt', 'Process'],
    accentHue: 260,
    gradient: 'from-violet-600/20 via-purple-500/10 to-emerald-400/15',
    stylePresets: [
      { id: 'mindset-card', label: 'Mindset Card', description: 'Quote-led minimal neon frame' },
      { id: 'risk-rules', label: 'Risk Rules', description: 'Three-rule checklist composition' },
      { id: 'journal', label: 'Journal Prompt', description: 'Notebook texture with soft glow' },
    ],
    sampleTopics: ['Stop revenge trading in 3 steps', 'Risk rules I never break'],
  },
  {
    id: 'market-news',
    title: 'Market News / Commentary',
    shortTitle: 'Market News',
    description: 'Breaking macro headlines, central bank weeks, and fast commentary layouts.',
    terminology: ['CPI', 'FOMC', 'NFP', 'Rates', 'Risk-on', 'Headlines'],
    accentHue: 195,
    gradient: 'from-cyan-400/20 via-sky-500/10 to-violet-600/20',
    stylePresets: [
      { id: 'breaking', label: 'Breaking Banner', description: 'News ticker strip and alert glow' },
      { id: 'calendar-week', label: 'Calendar Week', description: 'Event stack with time zones' },
      { id: 'headline-split', label: 'Headline Split', description: 'Dual headline compare layout' },
    ],
    sampleTopics: ['CPI surprise: what moves first', 'FOMC week game plan'],
  },
  {
    id: 'educators',
    title: 'Trading Educators / Agencies',
    shortTitle: 'Educators',
    description: 'Agency-grade consistency for educators running multi-channel trading brands.',
    terminology: ['Brand kit', 'Series', 'Cohort', 'Playbook', 'Template', 'Campaign'],
    accentHue: 155,
    gradient: 'from-emerald-500/20 via-violet-500/15 to-cyan-400/10',
    stylePresets: [
      { id: 'series-ep', label: 'Series Episode', description: 'Episode badge with unified brand frame' },
      { id: 'agency-grid', label: 'Agency Grid', description: 'Multi-client consistent thumbnail grid' },
      { id: 'masterclass', label: 'Masterclass', description: 'Premium course-style title block' },
    ],
    sampleTopics: ['Episode 12: liquidity masterclass', 'Client campaign: Q1 futures series'],
  },
];

export function getNicheById(id: TradingNicheId | string | null | undefined): TradingNiche {
  const found = TRADING_NICHES.find((n) => n.id === id);
  return found ?? TRADING_NICHES[0]!;
}
