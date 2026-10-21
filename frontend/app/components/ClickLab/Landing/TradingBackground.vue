<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="clicklab-hero-vignette absolute inset-0" />
    <div
      class="clicklab-hero-glow-spot absolute inset-0 opacity-80"
      :class="{ 'clicklab-hero-glow-spot--live': glowLive }"
    />

    <div class="absolute -left-40 top-16 h-[28rem] w-[28rem] rounded-full bg-[var(--cl-neon)]/8 blur-[120px] cl-animate-pulse-glow" />
    <div
      class="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-[var(--cl-violet)]/12 blur-[100px] cl-animate-pulse-glow"
      style="animation-delay: 1.2s"
    />
    <div class="absolute bottom-0 left-1/2 h-72 w-[130%] -translate-x-1/2 bg-gradient-to-t from-[var(--cl-neon)]/6 via-transparent to-transparent" />

    <div class="clicklab-grid-bg clicklab-grid-bg--drift absolute inset-0 opacity-[0.22]" />

    <svg class="clicklab-hero-chart-layer absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cl-hero-line-a" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#39ff88" stop-opacity="0" />
          <stop offset="45%" stop-color="#39ff88" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="cl-hero-line-b" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#a855f7" stop-opacity="0" />
          <stop offset="55%" stop-color="#22d3ee" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#39ff88" stop-opacity="0" />
        </linearGradient>
        <filter id="cl-hero-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        class="clicklab-hero-path clicklab-hero-path--a"
        d="M-40 520 C 180 480, 320 560, 520 500 S 920 440, 1180 480 S 1520 420, 1520 420"
        fill="none"
        stroke="url(#cl-hero-line-a)"
        stroke-width="1.5"
        filter="url(#cl-hero-glow)"
      />
      <path
        class="clicklab-hero-path clicklab-hero-path--b"
        d="M-40 620 C 220 580, 400 640, 640 590 S 1040 540, 1320 580 S 1520 520, 1520 520"
        fill="none"
        stroke="url(#cl-hero-line-b)"
        stroke-width="1"
        opacity="0.65"
      />

      <g class="clicklab-hero-candles" opacity="0.35">
        <rect x="980" y="560" width="10" height="28" rx="1" fill="#39ff88" opacity="0.9" />
        <line x1="985" y1="552" x2="985" y2="592" stroke="#39ff88" stroke-width="1" />
        <rect x="1004" y="548" width="10" height="22" rx="1" fill="#ef4444" opacity="0.75" />
        <line x1="1009" y1="542" x2="1009" y2="574" stroke="#ef4444" stroke-width="1" />
        <rect x="1028" y="538" width="10" height="34" rx="1" fill="#39ff88" />
        <line x1="1033" y1="530" x2="1033" y2="576" stroke="#39ff88" stroke-width="1" />
        <rect x="1052" y="532" width="10" height="18" rx="1" fill="#39ff88" opacity="0.85" />
      </g>

      <g class="clicklab-hero-data-dots" fill="#39ff88">
        <circle v-for="(p, i) in dataDots" :key="i" :cx="p.x" :cy="p.y" r="1.5" :opacity="p.o">
          <animate attributeName="opacity" :values="`${p.o};${p.o * 1.8};${p.o}`" :dur="`${p.d}s`" repeatCount="indefinite" :begin="`${p.delay}s`" />
        </circle>
      </g>
    </svg>

    <div
      v-for="(n, i) in particles"
      :key="`s-${i}`"
      class="cl-data-stream absolute h-10 w-px bg-gradient-to-b from-transparent via-[var(--cl-neon)] to-transparent opacity-35"
      :style="{
        left: `${n.x}%`,
        top: `${n.y}%`,
        animation: `cl-stream ${n.dur}s linear infinite`,
        animationDelay: `${n.delay}s`,
      }"
    />
    <div
      v-for="(n, i) in trails"
      :key="`t-${i}`"
      class="clicklab-hero-trail absolute h-px w-24 opacity-30"
      :style="{
        left: `${n.x}%`,
        top: `${n.y}%`,
        animation: `cl-trail ${n.dur}s ease-in-out infinite`,
        animationDelay: `${n.delay}s`,
        transform: `rotate(${n.rot}deg)`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{ glowLive?: boolean }>();

const particles = [
  { x: 8, y: 62, dur: 4.6, delay: 0 },
  { x: 22, y: 68, dur: 5.4, delay: 0.6 },
  { x: 38, y: 58, dur: 4.9, delay: 1.1 },
  { x: 54, y: 72, dur: 5.8, delay: 0.2 },
  { x: 70, y: 64, dur: 4.7, delay: 1.4 },
  { x: 86, y: 70, dur: 5.1, delay: 0.9 },
  { x: 94, y: 56, dur: 4.4, delay: 1.8 },
];

const trails = [
  { x: 15, y: 28, dur: 7, delay: 0, rot: -12 },
  { x: 72, y: 22, dur: 8.5, delay: 1.2, rot: 8 },
  { x: 48, y: 38, dur: 9, delay: 2, rot: -4 },
];

const dataDots = [
  { x: 320, y: 490, o: 0.45, d: 3.2, delay: 0 },
  { x: 480, y: 510, o: 0.35, d: 4.1, delay: 0.5 },
  { x: 720, y: 470, o: 0.5, d: 3.8, delay: 1 },
  { x: 890, y: 455, o: 0.4, d: 4.5, delay: 0.3 },
  { x: 1100, y: 495, o: 0.42, d: 3.5, delay: 1.2 },
];
</script>
