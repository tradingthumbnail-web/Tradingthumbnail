<template>
    <header data-tour="home-header" class="clicklab-dashboard-card overflow-hidden">
        <div class="border-b border-white/5 px-5 py-5 sm:px-7 sm:py-6">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 flex-1 space-y-3">
                    <p class="text-xs font-medium uppercase tracking-wider text-[var(--cl-text-muted)]">
                        {{ $t('home.welcome', { name: userName }) }}
                    </p>
                    <h1 class="clicklab-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {{ $t('home.title') }}
                    </h1>
                    <p class="max-w-xl text-sm leading-relaxed text-[var(--cl-text-muted)] sm:text-base">
                        {{ $t('home.description') }}
                    </p>
                    <div class="flex flex-wrap gap-3 pt-1">
                        <NuxtLink to="/studio" class="clicklab-btn-primary !text-sm">
                            <Icon name="lucide:image-plus" size="16" />
                            {{ $t('home.quickActions.createThumbnail') }}
                        </NuxtLink>
                        <NuxtLink to="/studio" class="clicklab-btn-secondary !text-sm">
                            Open demo studio
                        </NuxtLink>
                    </div>
                </div>

                <div class="w-full shrink-0 lg:w-64">
                    <div class="rounded-xl border border-white/8 bg-[#0a0e12] p-4">
                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)]">{{ $t('common.credits') }}</span>
                            <span class="text-lg font-semibold tabular-nums text-white">
                                {{ currentCredits }}<span v-if="maxCredits > 0" class="text-sm font-normal text-[var(--cl-text-muted)]"> / {{ maxCredits }}</span>
                            </span>
                        </div>
                        <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                v-if="maxCredits > 0"
                                class="h-full rounded-full bg-[var(--cl-neon)] transition-all duration-500"
                                :style="{ width: `${Math.min((currentCredits / maxCredits) * 100, 100)}%` }"
                            />
                        </div>
                        <div class="mt-3 flex items-center justify-between gap-2">
                            <NuxtLink v-if="!userStore.tier" to="/settings/plans" class="text-xs font-medium text-[var(--cl-violet-bright)] hover:underline">
                                {{ $t('home.upgradePlan') }}
                            </NuxtLink>
                            <span v-else class="text-xs text-[var(--cl-text-muted)]">{{ $t('common.plan') }}: <strong class="text-white">{{ tierName }}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
const userStore = useUserStore()

const userName = computed(() => (userStore.user?.name as string) || 'User')
const tierName = computed(() => (userStore.tier && (userStore.tier as any).name) || 'Free')

const currentCredits = computed(() => userStore.user?.credit ?? 0)

const maxCredits = computed(() => {
    if (userStore.tier?.features?.maxCredits) {
        return userStore.tier.features.maxCredits as number;
    }
    return 0;
})
</script>
