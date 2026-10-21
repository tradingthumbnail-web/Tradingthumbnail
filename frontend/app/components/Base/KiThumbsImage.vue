<template>
    <div
        class="group relative overflow-hidden w-full h-full rounded-[var(--radius-box)] shadow-sm bg-[var(--color-base-200)] transition-all duration-200"
        :class="[
            animationOnHover ? 'hover:scale-[0.98]' : '',
            containerClass
        ]"
        role="img"
        :aria-label="alt || 'image'"
    >
        <div
            v-if="!isLoaded && !hasError"
            aria-busy="true"
            class="absolute inset-0 skeleton opacity-60 animate-[pulse_2.5s_ease-in-out_infinite]"
        ></div>

        <slot name="placeholder" v-if="!isLoaded && !hasError"></slot>

        <img
            :src="src"
            :alt="alt"
            loading="lazy"
            decoding="async"
            draggable="false"
            @load="onLoad"
            @error="onError"
            :class="[
                'w-full h-full object-cover transition-all duration-200',
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.01]',
                animationOnHover ? 'hover:scale-110 cursor-pointer' : ''
            ]"
            class="transition-all duration-200"
        />

        <div v-if="hasError" class="absolute inset-0 flex items-center justify-center text-[var(--color-neutral-content)]">
            <slot name="error">
                <span class="text-sm opacity-70">{{ $t('common.imageUnavailable') }}</span>
            </slot>
        </div>

        <div v-if="showDownloadOnHover && !hasError" class="pointer-events-none absolute inset-0">
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <button class="btn btn-ghost btn-xs" @click.stop.prevent="downloadImage" aria-label="{{ $t('common.download') }}">
                    <Icon name="lucide:download" size="16" mode="svg" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    src: string;
    alt?: string;
    containerClass?: string;
    showDownloadOnHover?: boolean;
    animationOnHover?: boolean;
}>(), {
    alt: '',
    containerClass: '',
    showDownloadOnHover: false,
    animationOnHover: true,
});

const isLoaded = ref(false);
const hasError = ref(false);

const containerClass = computed(() => props.containerClass);

function onLoad() {
    isLoaded.value = true;
}

function onError() {
    hasError.value = true;
}

function getExtensionFromType(contentType: string): string {
    if (!contentType) return '';
    if (contentType.includes('jpeg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    return '';
}

async function downloadImage() {
    const url = props.src;
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = getExtensionFromType(blob.type) || 'png';
        const base = 'kithumbs-image';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${base}.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(a.href);
            a.remove();
        }, 0);
    } catch {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kithumbs-image';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
}
</script>

<style scoped>

</style>