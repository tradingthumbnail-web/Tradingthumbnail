<template>
    <div>
        <button
            class="btn btn-primary btn-circle fixed bottom-6 right-6 z-50 shadow-xl size-12 md:size-16"
            type="button"
            @click="open()"
            aria-label="Open feedback form"
        >
            <span class="text-2xl">
                <Icon name="lucide:message-circle" size="28" mode="svg" />
            </span>
        </button>

        <dialog ref="dialogEl" class="modal">
            <div class="modal-box max-w-xl p-0">
                <div class="px-6 pt-6 pb-2 border-b border-base-300 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <Icon name="lucide:message-circle" size="24" mode="svg" />
                        <h3 class="text-xl font-semibold">{{ $t('feedback.title') }}</h3>
                    </div>
                    <button class="btn btn-ghost btn-sm" @click="close()">
                        <Icon name="lucide:x" size="24" mode="svg" />
                    </button>
                </div>

                <form @submit.prevent="submit" class="px-6 py-6 space-y-6">
                    <div class="space-y-2 text-center">
                        <h4 class="text-2xl md:text-3xl font-extrabold">{{ $t('feedback.description') }}</h4>
                        <p class="text-base-content/70 max-w-md mx-auto">
                            {{ $t('feedback.message') }}
                        </p>
                    </div>

                    <div class="flex items-center justify-center gap-4 md:gap-6">
                        <button
                            v-for="m in moods"
                            :key="m.value"
                            type="button"
                            @click="rating = m.value"
                            :aria-pressed="rating === m.value"
                            class="relative grid place-items-center size-12 md:size-14 rounded-full transition-all"
                            :class="rating === m.value ? 'ring ring-primary bg-primary/10' : 'bg-base-200 hover:bg-base-300'"
                        >
                            <span class="text-2xl md:text-3xl select-none">{{ m.emoji }}</span>
                        </button>
                    </div>
                    <div class="text-center min-h-6">
                        <span v-if="selectedMood" class="px-3 py-1 rounded-full bg-base-200 text-sm">{{ selectedMood.label }}</span>
                    </div>

                    <label class="form-control w-full space-y-2">
                        <span class="label"><span class="label-text">{{ $t('feedback.comment') }}</span></span>
                        <textarea
                            v-model="comment"
                            class="textarea textarea-bordered w-full min-h-28"
                            :placeholder="$t('feedback.commentPlaceholder')"
                        />
                    </label>

                    <div class="flex items-center justify-between gap-4 pt-4">
                        <div class="text-xs text-base-content/60">
                            {{ $t('feedback.page') }}: {{ route.fullPath }}
                        </div>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="submitting || rating === null"
                        >
                            <span v-if="!submitting">{{ $t('feedback.submitNow') }}</span>
                            <span v-else class="loading loading-spinner"></span>
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop"><button>{{ $t('common.close') }}</button></form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

type Mood = { value: number; label: string; emoji: string }

const dialogEl = ref<HTMLDialogElement | null>(null)
const rating = ref<number>(3)
const comment = ref('')
const submitting = ref(false)
const route = useRoute()
const toast = useToast()

const moods: Mood[] = [
    { value: 1, label: t('feedback.moods.awul'), emoji: '🤢' },
    { value: 2, label: t('feedback.moods.bad'), emoji: '😴' },
    { value: 3, label: t('feedback.moods.medium'), emoji: '😐' },
    { value: 4, label: t('feedback.moods.good'), emoji: '🙂' },
    { value: 5, label: t('feedback.moods.great'), emoji: '🥳' },
]

const selectedMood = computed(() => moods.find((m) => m.value === rating.value) || null)

function open() {
    dialogEl.value?.showModal()
}

function close() {
    dialogEl.value?.close()
}

async function submit() {
    if (rating.value === null) {
        toast.show({ status: 'warning', title: t('feedback.selectMoodFirst') })
        return
    }
    submitting.value = true
    const payload = {
        rating: rating.value,
        mood: selectedMood.value || moods[2],
        comment: comment.value.trim(),
        path: route.fullPath,
        createdAt: new Date().toISOString(),
    }
    try {
        await $fetch('/api/v1/user/send-feedback', {
            method: 'POST',
            body: payload,
        });
        toast.show({ status: 'success', title: t('feedback.submittedDescription'), message: t('feedback.submittedMessage') })
        rating.value = 3
        comment.value = ''
        close()
    } catch (e) {
        toast.show({ status: 'error', title: t('feedback.failedToSendFeedback'), message: t('feedback.failedToSendFeedbackMessage', { email: 'support@kithumbs.com' }) })
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>

</style>