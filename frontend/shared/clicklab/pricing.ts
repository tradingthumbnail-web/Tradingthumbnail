export interface ClickLabPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  highlighted?: boolean;
  features: string[];
  ctaLabel: string;
}

export const CLICKLAB_PRICING_PLANS: ClickLabPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceYearly: 290,
    description: 'Solo creators testing trading thumbnail workflows.',
    features: [
      '50 AI thumbnail generations / month',
      'Trading niche presets',
      'YouTube & Shorts layouts',
      '3 style variations per run',
      'Demo avatar placeholders',
    ],
    ctaLabel: 'Start Creating',
  },
  {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 59,
    priceYearly: 590,
    description: 'Active trading channels publishing weekly.',
    highlighted: true,
    features: [
      '200 generations / month',
      'All platform aspect ratios',
      '1 trained AI avatar slot',
      'Title & description assist',
      'Thumbnail critique checklist',
      'Brand consistency kit',
    ],
    ctaLabel: 'Go Creator',
  },
  {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 129,
    priceYearly: 1290,
    description: 'Educators and agencies running multiple shows.',
    features: [
      '600 generations / month',
      '5 trained avatar slots',
      'Team workspace (3 seats)',
      'Niche campaign templates',
      'Priority export presets',
      'Agency review mode',
    ],
    ctaLabel: 'Scale Your Brand',
  },
];
