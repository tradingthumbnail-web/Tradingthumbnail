<template>
  <div class="mx-auto max-w-[1600px] p-4 lg:p-6">
    <ClickLabSharedSimulatedNotice
      class="mb-6"
      message="Thumbnail generation, editing, and export on this page are simulated in your browser. No AI models or server uploads are called."
    />

    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="clicklab-display text-2xl font-bold text-white sm:text-3xl">Trading Thumbnail Studio</h1>
        <p class="mt-1 text-sm text-[var(--cl-text-muted)]">
          Niche: <span class="text-[var(--cl-neon)]">{{ niche.title }}</span>
        </p>
      </div>
      <button type="button" class="clicklab-btn-primary" @click="onCreateNew">
        <Icon name="lucide:plus" size="18" />
        Create New Thumbnail
      </button>
    </div>

    <div class="grid gap-6 xl:grid-cols-12">
      <div class="clicklab-glass relative space-y-5 overflow-visible rounded-2xl p-4 sm:p-5 xl:col-span-4">
        <fieldset class="relative">
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Trading niche</legend>
          <ClickLabSharedStudioSelect
            v-model="state.nicheId"
            :options="nicheOptions"
          />
          <p class="mt-2 text-xs text-[var(--cl-text-muted)]">{{ niche.description }}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="t in niche.terminology.slice(0, 5)" :key="t" class="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--cl-cyan)]">{{ t }}</span>
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Video topic</legend>
          <input v-model="state.topic" type="text" class="input input-bordered w-full border-white/10 bg-black/30" placeholder="e.g. EUR/USD liquidity sweep recap" />
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Thumbnail title</legend>
          <input v-model="state.title" type="text" class="input input-bordered w-full border-white/10 bg-black/30" placeholder="Bold headline on the thumbnail" />
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Description (optional)</legend>
          <textarea v-model="state.description" class="textarea textarea-bordered h-24 w-full border-white/10 bg-black/30" placeholder="Scene notes, emotions, objects to include..." />
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Platform</legend>
          <ClickLabSharedStudioSelect
            v-model="state.platformId"
            :options="platformOptions"
          />
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Style preset</legend>
          <ClickLabSharedStudioSelect
            v-model="state.stylePresetId"
            :options="stylePresetOptions"
          />
          <p class="mt-1 text-xs text-[var(--cl-text-muted)]">{{ activeStyle?.description }}</p>
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Avatar</legend>
          <div class="space-y-2">
            <label
              v-for="av in demoAvatars"
              :key="av.id"
              class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
              :class="state.avatarId === av.id ? 'border-[var(--cl-neon)]/50 bg-[var(--cl-neon)]/5' : 'border-white/10 bg-black/20'"
            >
              <input v-model="state.avatarId" type="radio" class="radio radio-primary radio-sm" :value="av.id" :disabled="!av.trained" />
              <div class="h-9 w-9 rounded-full border border-white/20" :style="{ background: `linear-gradient(135deg, ${av.accent}44, #111)` }" />
              <div class="flex-1">
                <p class="text-sm font-medium text-white">{{ av.name }}</p>
                <p class="text-xs" :class="av.trained ? 'text-[var(--cl-neon)]' : 'text-[var(--cl-text-muted)]'">
                  {{ av.trained ? 'Trained · demo' : 'Not trained — create in Avatars' }}
                </p>
              </div>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Generation settings</legend>
          <label class="flex items-center justify-between text-sm text-[var(--cl-text-muted)]">
            Variations
            <input v-model.number="state.variationCount" type="range" min="2" max="4" step="1" class="range range-primary range-xs w-32" />
            <span class="w-4 text-white">{{ state.variationCount }}</span>
          </label>
          <label class="mt-2 flex items-center justify-between text-sm text-[var(--cl-text-muted)]">
            Aspect override
            <ClickLabSharedStudioSelect
              v-model="state.aspectOverride"
              class="min-w-[9rem]"
              :options="aspectOptions"
            />
          </label>
        </fieldset>

        <button
          type="button"
          class="clicklab-btn-primary w-full"
          :disabled="isGenerating"
          @click="runDemoGeneration"
        >
          <Icon v-if="isGenerating" name="svg-spinners:90-ring-with-bg" size="18" />
          <Icon v-else name="lucide:sparkles" size="18" />
          {{ isGenerating ? 'Generating demo previews…' : 'Generate demo variations' }}
        </button>
        <p v-if="generationError" class="text-sm text-error">{{ generationError }}</p>
      </div>

      <div class="xl:col-span-8">
        <div class="clicklab-glass rounded-2xl p-4 sm:p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-semibold text-white">Sample results <span class="text-xs font-normal text-[var(--cl-text-muted)]">(simulated)</span></h2>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm btn-ghost" :disabled="!selectedVariantId" @click="onPreview">Preview (simulated)</button>
              <NuxtLink to="/login" class="btn btn-sm btn-outline border-[var(--cl-violet)]/40" title="Real editing requires sign-in and backend">Edit (sign in for live editor)</NuxtLink>
              <button type="button" class="btn btn-sm btn-primary" :disabled="!selectedVariantId" @click="onExport">Simulated export</button>
            </div>
          </div>

          <div v-if="isGenerating" class="grid gap-4 sm:grid-cols-2">
            <div v-for="n in state.variationCount" :key="n" class="skeleton aspect-video rounded-xl" />
          </div>

          <div v-else-if="!demoResults.length" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
            <Icon name="lucide:images" size="40" class="text-[var(--cl-text-muted)]" />
            <p class="mt-3 text-sm text-[var(--cl-text-muted)]">Run a demo generation to see sample variations for your niche.</p>
          </div>

          <div v-else class="grid gap-4 sm:grid-cols-2">
            <ClickLabSharedSampleThumbnailCard
              v-for="v in demoResults"
              :key="v.id"
              :variant="v"
              :aspect="previewAspect"
              selectable
              :selected="selectedVariantId === v.id"
              @select="selectedVariantId = v.id"
            />
          </div>
        </div>

        <div id="recent" class="clicklab-glass mt-6 rounded-2xl p-4 sm:p-5">
          <h2 class="font-semibold text-white">Recent projects (demo)</h2>
          <ul class="mt-4 divide-y divide-white/5">
            <li v-for="p in DEMO_RECENT_PROJECTS" :key="p.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span class="text-white">{{ p.title }}</span>
              <span class="text-[var(--cl-text-muted)]">{{ p.platform }} · {{ p.updatedAt }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TRADING_NICHES } from '~~/shared/clicklab/niches';
import { CLICKLAB_PLATFORMS } from '~~/shared/clicklab/platforms';
import { DEMO_AVATARS, DEMO_RECENT_PROJECTS } from '~~/shared/clicklab/demo-data';
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

definePageMeta({ layout: 'clicklab-studio' });

useHead({ title: `Studio | ${CLICKLAB_PRODUCT_NAME}` });

const route = useRoute();
const toast = useToast();

const {
  state,
  niche,
  stylePresets,
  isGenerating,
  demoResults,
  selectedVariantId,
  generationError,
  applyNicheFromQuery,
  runDemoGeneration,
} = useClickLabStudio();

const demoAvatars = DEMO_AVATARS;

const nicheOptions = computed(() =>
  TRADING_NICHES.map((n) => ({ value: n.id, label: n.title })),
);

const platformOptions = computed(() =>
  CLICKLAB_PLATFORMS.map((p) => ({ value: p.id, label: `${p.label} (${p.aspectRatio})` })),
);

const stylePresetOptions = computed(() =>
  stylePresets.value.map((s) => ({ value: s.id, label: s.label })),
);

const aspectOptions = [
  { value: null, label: 'Platform default' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
];

const activeStyle = computed(() => stylePresets.value.find((s) => s.id === state.value.stylePresetId));

const previewAspect = computed(() => {
  const o = state.value.aspectOverride;
  if (o === '9:16') return 'portrait' as const;
  if (o === '1:1') return 'square' as const;
  return 'video' as const;
});

onMounted(() => {
  applyNicheFromQuery(typeof route.query.niche === 'string' ? route.query.niche : undefined);
});

function onCreateNew() {
  state.value.title = '';
  state.value.topic = '';
  state.value.description = '';
  demoResults.value = [];
  selectedVariantId.value = null;
}

function onPreview() {
  toast.show({ status: 'info', title: 'Simulated preview', message: 'This is a UI-only preview. A real export or editor opens after sign-in when generation APIs are available.' });
}

function onExport() {
  toast.show({ status: 'info', title: 'Simulated export', message: 'No image file was created or downloaded. Connect the backend to enable real exports.' });
}
</script>
