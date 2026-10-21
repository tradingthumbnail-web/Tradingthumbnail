<template>
  <article
    ref="tiltRoot"
    class="clicklab-showcase-card cl-reveal-on-scroll group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#050708] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-[box-shadow,border-color] duration-500 will-change-transform"
    :style="{ '--card-i': index }"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div class="clicklab-showcase-card__sheen pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
    <div class="clicklab-grid-bg absolute inset-0 opacity-[0.28]" />
    <div
      class="absolute inset-0 opacity-95 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      :style="{
        background: `radial-gradient(120% 80% at 20% 0%, ${concept.accent}22 0%, transparent 55%), linear-gradient(160deg, #0a0e12 0%, #050708 100%)`,
      }"
    />

    <!-- Forex / ICT -->
    <svg
      v-if="concept.id === 'forex'"
      class="clicklab-showcase-graph absolute inset-x-0 bottom-0 h-[62%] w-full transition-transform duration-700 group-hover:translate-y-[-2px]"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(57,255,136,0.08)" stroke-width="0.5" />
      <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(57,255,136,0.08)" stroke-width="0.5" />
      <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(57,255,136,0.08)" stroke-width="0.5" />
      <g class="clicklab-showcase-candles">
        <rect x="24" y="58" width="8" height="22" rx="1" fill="#39ff88" opacity="0.95" />
        <line x1="28" y1="52" x2="28" y2="82" stroke="#39ff88" stroke-width="1" />
        <rect x="38" y="62" width="8" height="14" rx="1" fill="#f87171" opacity="0.85" />
        <rect x="52" y="48" width="8" height="28" rx="1" fill="#39ff88" />
        <line x1="56" y1="42" x2="56" y2="78" stroke="#39ff88" stroke-width="1" />
        <rect x="66" y="52" width="8" height="18" rx="1" fill="#39ff88" opacity="0.9" />
        <rect x="80" y="44" width="8" height="32" rx="1" fill="#39ff88" />
      </g>
      <polyline
        class="clicklab-showcase-line"
        fill="none"
        stroke="#22d3ee"
        stroke-width="1.2"
        stroke-dasharray="240"
        points="0,72 30,68 55,55 78,58 98,42 118,46 138,32 158,38 178,28 200,34"
      />
      <line
        class="clicklab-showcase-sweep"
        x1="118"
        y1="8"
        x2="118"
        y2="92"
        stroke="#39ff88"
        stroke-opacity="0.45"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="122" y="18" fill="rgba(232,237,242,0.55)" font-size="7" font-family="DM Sans, sans-serif">1.0842</text>
    </svg>

    <!-- Crypto -->
    <template v-else-if="concept.id === 'crypto'">
      <div
        class="absolute right-[12%] top-[18%] h-[38%] w-[38%] rounded-full border border-amber-200/20 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.5),0_0_24px_rgba(245,158,11,0.25)] transition-transform duration-700 group-hover:scale-105"
        style="background: radial-gradient(circle at 32% 28%, #fde68a 0%, #d97706 38%, #451a03 72%, #1a1208 100%)"
        aria-hidden="true"
      >
        <span
          class="absolute inset-[22%] rounded-full border border-amber-100/25 bg-gradient-to-br from-amber-200/30 to-transparent"
          aria-hidden="true"
        />
      </div>
      <svg class="clicklab-showcase-graph absolute inset-x-0 bottom-0 h-[55%] w-full" viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          class="clicklab-showcase-line"
          fill="none"
          :stroke="concept.accentSecondary"
          stroke-width="1.6"
          stroke-dasharray="260"
          points="0,70 25,65 45,48 65,52 85,35 105,38 125,22 145,28 165,15 200,18"
        />
        <polygon points="165,15 200,18 200,90 165,90" fill="url(#cl-breakout-fill)" opacity="0.35" />
        <defs>
          <linearGradient id="cl-breakout-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </template>

    <!-- Prop firm -->
    <svg
      v-else-if="concept.id === 'prop'"
      class="clicklab-showcase-graph absolute inset-x-2 top-[22%] h-[48%] w-[calc(100%-1rem)]"
      viewBox="0 0 180 70"
      aria-hidden="true"
    >
      <path
        class="clicklab-showcase-line"
        fill="none"
        :stroke="concept.accent"
        stroke-width="2"
        stroke-dasharray="220"
        d="M8 52 C 32 48, 48 38, 68 42 S 108 28, 128 32 S 160 18, 172 22"
      />
      <rect x="8" y="58" width="164" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />
      <rect x="8" y="58" width="145" height="5" rx="2.5" fill="#39ff88" class="clicklab-showcase-progress" />
    </svg>
    <div v-if="concept.id === 'prop'" class="absolute inset-x-3 top-[58%] flex justify-between text-[8px] font-semibold tabular-nums text-white/65 sm:text-[9px]">
      <span>+$12,480</span>
      <span class="text-[var(--cl-neon)]">PASSED</span>
    </div>

    <!-- Options -->
    <svg
      v-else-if="concept.id === 'options'"
      class="clicklab-showcase-graph absolute inset-x-1 bottom-[28%] h-[50%] w-[calc(100%-0.5rem)]"
      viewBox="0 0 180 80"
      aria-hidden="true"
    >
      <path
        class="clicklab-showcase-line"
        fill="none"
        :stroke="concept.accent"
        stroke-width="1.8"
        stroke-dasharray="200"
        d="M10 55 Q 45 55, 70 35 T 130 40 T 170 25"
      />
      <circle cx="70" cy="35" r="3" fill="#a855f7" opacity="0.9" />
      <circle cx="130" cy="40" r="2.5" fill="#39ff88" opacity="0.85" />
      <line x1="70" y1="35" x2="70" y2="72" stroke="#a855f7" stroke-opacity="0.35" stroke-dasharray="2 2" />
      <text x="12" y="22" fill="rgba(168,85,247,0.75)" font-size="7" font-family="DM Sans, sans-serif">Γ · SPY</text>
      <text x="100" y="22" fill="rgba(57,255,136,0.65)" font-size="7" font-family="DM Sans, sans-serif">QQQ</text>
    </svg>

    <div class="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.06] to-transparent" />

    <div class="relative z-10 flex h-full flex-col justify-end p-2.5 sm:p-3">
      <span class="clicklab-showcase-kicker">{{ concept.kicker }}</span>
      <h3 class="clicklab-showcase-headline mt-0.5" :style="{ '--accent': concept.accent }">
        {{ concept.headline }}
      </h3>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { HeroShowcaseConcept } from '~~/shared/clicklab/hero-showcase';

defineProps<{
  concept: HeroShowcaseConcept;
  index: number;
}>();

const { root: tiltRoot, onPointerMove, onPointerLeave } = useClickLabTilt(6);
useClickLabReveal(tiltRoot, { once: false });
</script>
