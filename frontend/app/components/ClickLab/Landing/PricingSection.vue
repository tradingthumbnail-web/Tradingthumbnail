<template>
  <section id="pricing" ref="sectionRoot" class="py-20 sm:py-28">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center" data-reveal>
        <h2 class="clicklab-display text-3xl font-bold text-white sm:text-4xl">Pricing</h2>
        <p class="mt-4 text-[var(--cl-text-muted)]">Example plans for the marketing site — edit centrally in shared config. No payment providers connected.</p>
        <div class="mt-6 inline-flex rounded-full border border-white/10 p-1">
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            :class="billing === 'monthly' ? 'bg-[var(--cl-neon)] text-black' : 'text-[var(--cl-text-muted)]'"
            @click="billing = 'monthly'"
          >
            Monthly
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            :class="billing === 'yearly' ? 'bg-[var(--cl-neon)] text-black' : 'text-[var(--cl-text-muted)]'"
            @click="billing = 'yearly'"
          >
            Yearly
          </button>
        </div>
      </div>
      <div class="mt-12 grid gap-6 lg:grid-cols-3" data-reveal-stagger>
        <article
          v-for="plan in CLICKLAB_PRICING_PLANS"
          :key="plan.id"
          class="clicklab-glass cl-hover-card flex flex-col rounded-2xl p-6"
          :class="plan.highlighted ? 'clicklab-glow-border ring-1 ring-[var(--cl-neon)]/30' : ''"
        >
          <p v-if="plan.highlighted" class="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--cl-neon)]">Most popular</p>
          <h3 class="clicklab-display text-xl font-bold text-white">{{ plan.name }}</h3>
          <p class="mt-1 text-sm text-[var(--cl-text-muted)]">{{ plan.description }}</p>
          <p class="clicklab-display mt-6 text-4xl font-extrabold text-white">
            ${{ billing === 'monthly' ? plan.priceMonthly : plan.priceYearly }}
            <span class="text-base font-medium text-[var(--cl-text-muted)]">/{{ billing === 'monthly' ? 'mo' : 'yr' }}</span>
          </p>
          <ul class="mt-6 flex-1 space-y-2 text-sm text-[var(--cl-text-muted)]">
            <li v-for="f in plan.features" :key="f" class="flex gap-2">
              <Icon name="lucide:check" class="mt-0.5 shrink-0 text-[var(--cl-neon)]" size="16" />
              <span>{{ f }}</span>
            </li>
          </ul>
          <NuxtLink to="/signup" class="clicklab-btn-primary mt-8 w-full">{{ plan.ctaLabel }}</NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CLICKLAB_PRICING_PLANS } from '~~/shared/clicklab/pricing';

const sectionRoot = ref<HTMLElement | null>(null);
useClickLabSectionReveal(sectionRoot);
const billing = ref<'monthly' | 'yearly'>('monthly');
</script>
