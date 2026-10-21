import {
  getNicheById,
  type TradingNicheId,
} from '~~/shared/clicklab/niches';
import {
  CLICKLAB_PLATFORMS,
  type ClickLabPlatformId,
} from '~~/shared/clicklab/platforms';
import {
  DEMO_THUMBNAIL_VARIANTS,
  type DemoThumbnailVariant,
} from '~~/shared/clicklab/demo-data';

const STORAGE_KEY = 'clicklab-studio-state';

export interface ClickLabStudioState {
  nicheId: TradingNicheId;
  topic: string;
  title: string;
  description: string;
  platformId: ClickLabPlatformId;
  stylePresetId: string;
  avatarId: string | null;
  aspectOverride: string | null;
  variationCount: number;
}

const defaultState = (): ClickLabStudioState => ({
  nicheId: 'forex-ict',
  topic: '',
  title: '',
  description: '',
  platformId: 'youtube',
  stylePresetId: 'session-breakout',
  avatarId: 'av-demo-1',
  aspectOverride: null,
  variationCount: 4,
});

function loadPersisted(): ClickLabStudioState {
  if (!import.meta.client) return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function useClickLabStudio() {
  const state = useState<ClickLabStudioState>('clicklab-studio', loadPersisted);
  const isGenerating = ref(false);
  const demoResults = ref<DemoThumbnailVariant[]>([]);
  const selectedVariantId = ref<string | null>(null);
  const generationError = ref<string | null>(null);

  const niche = computed(() => getNicheById(state.value.nicheId));
  const platform = computed(
    () => CLICKLAB_PLATFORMS.find((p) => p.id === state.value.platformId) ?? CLICKLAB_PLATFORMS[0]!,
  );

  const stylePresets = computed(() => niche.value.stylePresets);

  watch(
    () => state.value.nicheId,
    (id) => {
      const n = getNicheById(id);
      const first = n.stylePresets[0];
      if (first && !n.stylePresets.some((s) => s.id === state.value.stylePresetId)) {
        state.value.stylePresetId = first.id;
      }
      if (!state.value.title && n.sampleTopics[0]) {
        state.value.topic = n.sampleTopics[0]!;
      }
    },
    { immediate: true },
  );

  watch(
    state,
    (s) => {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      }
    },
    { deep: true },
  );

  function setNiche(id: TradingNicheId) {
    state.value.nicheId = id;
  }

  function applyNicheFromQuery(queryId: string | undefined) {
    if (!queryId) return;
    const match = getNicheById(queryId);
    if (match) state.value.nicheId = match.id;
  }

  async function runDemoGeneration() {
    generationError.value = null;
    isGenerating.value = true;
    demoResults.value = [];
    selectedVariantId.value = null;

    await new Promise((r) => setTimeout(r, 1400));

    const pool = DEMO_THUMBNAIL_VARIANTS.filter(
      (v) => v.nicheId === state.value.nicheId,
    );
    const source = pool.length ? pool : DEMO_THUMBNAIL_VARIANTS;
    const count = Math.min(state.value.variationCount, 4);
    demoResults.value = source.slice(0, count).map((v, i) => ({
      ...v,
      id: `${v.id}-${Date.now()}-${i}`,
      title: state.value.title.trim() || v.title,
      subtitle: state.value.topic.trim() || v.subtitle,
    }));
    selectedVariantId.value = demoResults.value[0]?.id ?? null;
    isGenerating.value = false;
  }

  return {
    state,
    niche,
    platform,
    stylePresets,
    isGenerating,
    demoResults,
    selectedVariantId,
    generationError,
    setNiche,
    applyNicheFromQuery,
    runDemoGeneration,
  };
}
