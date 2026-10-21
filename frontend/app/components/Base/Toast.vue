<template>
    <TransitionGroup
        aria-live="polite"
        name="toast"
        tag="div"
        class="fixed inset-0 z-[9999] pointer-events-none">
        <div
            v-for="toastItem in toasts"
            :key="toastItem.id"
            :class="['pointer-events-none fixed inset-0 flex px-4 py-6 sm:py-5 lg:px-8', positionWrapper(toastItem.position)]">
            <div class="pointer-events-auto w-full max-w-sm">
                <div :class="surfaceBase" role="status">
                    <div class="flex items-start gap-3.5 p-4">
                        <span :class="[iconBase, iconAccent(toastItem.status)]">
                            <Icon :name="iconName(toastItem.status)" class="h-5 w-5" aria-hidden="true" />
                        </span>

                        <div class="flex-1 min-w-0 pt-0.5">
                            <p class="text-sm font-semibold text-base-content leading-tight">
                                {{ toastItem.title || statusLabel(toastItem.status) }}
                            </p>
                            <p v-if="toastItem.message" class="mt-1 text-sm leading-relaxed text-base-content/60">
                                {{ toastItem.message }}
                            </p>
                        </div>

                        <button
                            :aria-label="$t('common.dismissToast')"
                            @click="dismiss(toastItem.id)"
                            class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base-content/40 hover:text-base-content hover:bg-base-200/50 transition-colors">
                            <Icon name="lucide:x" size="16" />
                        </button>
                    </div>

                    <div class="h-1 w-full bg-base-200/50 overflow-hidden">
                        <div
                            :class="['animate-toast-progress h-full origin-left', progressAccent(toastItem.status)]"
                            :style="progressStyle(toastItem.duration)"></div>
                    </div>
                </div>
            </div>
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
import useToast from '../../composables/useToast'

const toast = useToast()
const toasts = toast.toasts

const surfaceBase =
    'relative overflow-hidden rounded-xl border border-base-100/20 bg-base-100/95 backdrop-blur-xl text-base-content shadow-xl'
const iconBase =
    'flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg'

function positionWrapper(position: string) {
    switch (position) {
        case 'top-left':
            return 'items-start justify-start'
        case 'top-center':
            return 'items-start justify-center'
        case 'top-right':
            return 'items-start justify-end'
        case 'bottom-left':
            return 'items-end justify-start'
        case 'bottom-center':
            return 'items-end justify-center'
        case 'bottom-right':
            return 'items-end justify-end'
        default:
            return 'items-start justify-end'
    }
}

function iconAccent(status: string) {
    switch (status) {
        case 'success':
            return 'bg-success/15 text-success'
        case 'error':
            return 'bg-error/15 text-error'
        case 'warning':
            return 'bg-warning/15 text-warning'
        case 'info':
            return 'bg-info/15 text-info'
        default:
            return 'bg-primary/15 text-primary'
    }
}

function iconName(status: string) {
    switch (status) {
        case 'success':
            return 'lucide:check-circle-2'
        case 'error':
            return 'lucide:alert-octagon'
        case 'warning':
            return 'lucide:alert-triangle'
        default:
            return 'lucide:info'
    }
}

function progressAccent(status: string) {
    switch (status) {
        case 'success':
            return 'bg-success'
        case 'error':
            return 'bg-error'
        case 'warning':
            return 'bg-warning'
        default:
            return 'bg-primary'
    }
}

function statusLabel(status: string) {
    switch (status) {
        case 'success':
            return 'Success'
        case 'error':
            return 'Error'
        case 'warning':
            return 'Warning'
        default:
            return 'Notice'
    }
}

function progressStyle(duration?: number) {
    const ms = duration && duration > 0 ? duration : 4000
    return { animationDuration: `${ms}ms` }
}

function dismiss(id: number) {
    toast.dismiss(id)
}
</script>

<style scoped>
@keyframes toast-progress {
    from {
        transform: scaleX(1);
    }
    to {
        transform: scaleX(0);
    }
}

.animate-toast-progress {
    animation-name: toast-progress;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(16px) scale(0.95);
}

.toast-enter-active,
.toast-leave-active {
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
    position: absolute;
    width: 100%;
}

.toast-move {
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>