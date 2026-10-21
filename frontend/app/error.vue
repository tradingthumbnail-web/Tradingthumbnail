<template>
    <div class="min-h-screen grid place-items-center p-4 bg-base-200">
        <div class="card w-full max-w-md bg-base-100 shadow-2xl">
            <div class="card-body items-center text-center gap-3">
                <div class="text-6xl font-semibold text-error">{{ displayCode }} 😔</div>
                <h1 class="card-title text-base-content/90">{{ $t('common.errors.pageTitle') }}</h1>
                <p class="text-base-content/70 w-full break-words">{{ displayMessage }}</p>
                <div class="card-actions mt-2">
                    <button class="btn btn-primary" @click="goBack">{{ $t('common.goBack') }}</button>
                    <button class="btn btn-ghost" @click="reload">{{ $t('common.tryAgain') }}</button>
                </div>
            </div>
        </div>
    </div>
    
</template>

<script setup lang="ts">
const router = useRouter()
const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()

const displayCode = computed(() => props.error?.statusCode ?? 500)
const displayMessage = computed(() => props.error?.statusMessage ?? props.error?.message ?? 'Unexpected error')

const goBack = () => router.back()
const reload = () => window.location.reload()
</script>

<style scoped>

</style>