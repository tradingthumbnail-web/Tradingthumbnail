export type HeroShowcaseId = 'forex' | 'crypto' | 'prop' | 'options';

export interface HeroShowcaseConcept {
  id: HeroShowcaseId;
  kicker: string;
  headline: string;
  accent: string;
  accentSecondary: string;
}

export const HERO_SHOWCASE_CONCEPTS: HeroShowcaseConcept[] = [
  {
    id: 'forex',
    kicker: 'Forex · ICT',
    headline: 'EUR/USD LIQUIDITY SWEEP',
    accent: '#39ff88',
    accentSecondary: '#22d3ee',
  },
  {
    id: 'crypto',
    kicker: 'Crypto momentum',
    headline: 'BITCOIN BREAKOUT SETUP',
    accent: '#f59e0b',
    accentSecondary: '#8b5cf6',
  },
  {
    id: 'prop',
    kicker: 'Prop firm',
    headline: '100K CHALLENGE PASSED',
    accent: '#39ff88',
    accentSecondary: '#eab308',
  },
  {
    id: 'options',
    kicker: '0DTE · Gamma',
    headline: 'SPY LEVELS & GAMMA PIN',
    accent: '#a855f7',
    accentSecondary: '#39ff88',
  },
];
