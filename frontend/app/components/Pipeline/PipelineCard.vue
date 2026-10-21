<template>
    <div class="card bg-base-200 border border-base-content/10 hover:border-primary/50 transition-all duration-200 cursor-pointer group">
        <div class="card-body p-4 flex flex-col justify-between">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-base-content truncate">{{ pipeline.name }}</h3>
                    <p v-if="pipeline.description" class="text-sm text-base-content/60 line-clamp-2 mt-1">
                        {{ pipeline.description }}
                    </p>
                </div>
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="lucide:more-vertical" class="w-4 h-4" />
                    </label>
                    <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-40">
                        <li>
                            <a @click.stop="$emit('edit', pipeline)">
                                <Icon name="lucide:pencil" class="w-4 h-4" />
                                {{ $t('common.edit') }}
                            </a>
                        </li>
                        <li>
                            <a @click.stop="$emit('delete', pipeline)" class="text-error">
                                <Icon name="lucide:trash-2" class="w-4 h-4" />
                                {{ $t('common.delete') }}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="flex items-center gap-4 mt-3 text-xs text-base-content/50">
                <div class="flex items-center gap-1">
                    <Icon name="lucide:layers" class="w-3 h-3" />
                    <span>{{ elementCount }} {{ $t('pipeline.elements') }}</span>
                </div>
                <div class="flex items-center gap-1">
                    <Icon name="lucide:play" class="w-3 h-3" />
                    <span>{{ pipeline.executionCount }} {{ $t('pipeline.runs') }}</span>
                </div>
            </div>

            <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span 
                    v-for="element in configurableElements.slice(0, 3)" 
                    :key="element.id"
                    class="badge badge-sm badge-ghost"
                >
                    <Icon 
                        :name="getElementIcon(element.type)" 
                        class="w-3 h-3 mr-1" 
                    />
                    {{ element.label }}
                </span>
                <span 
                    v-if="configurableElements.length > 3" 
                    class="badge badge-sm badge-ghost"
                >
                    +{{ configurableElements.length - 3 }}
                </span>
            </div>

            <div class="card-actions mt-4">
                <button 
                    type="button" 
                    class="btn btn-primary btn-sm flex-1"
                    @click.stop="$emit('run', pipeline)"
                >
                    <Icon name="lucide:play" class="w-4 h-4" />
                    {{ $t('pipeline.run') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Pipeline, PipelineElement } from '~~/server/database/schemas/pipeline.schema';

const props = defineProps<{
    pipeline: Pipeline;
}>();

defineEmits<{
    (e: 'run', pipeline: Pipeline): void;
    (e: 'edit', pipeline: Pipeline): void;
    (e: 'delete', pipeline: Pipeline): void;
}>();

const elementCount = computed(() => props.pipeline.canvasData?.elements?.length ?? 0);

const configurableElements = computed(() => 
    (props.pipeline.canvasData?.elements ?? []).filter(e => e.isConfigurable)
);

function getElementIcon(type: PipelineElement['type']) {
    switch (type) {
        case 'ASSET': return 'lucide:image';
        case 'AVATAR': return 'lucide:user';
        case 'TEXT': return 'lucide:type';
        default: return 'lucide:box';
    }
}
</script>