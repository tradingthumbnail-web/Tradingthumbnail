<template>
    <div class="flex flex-col gap-4">
        <div class="form-control">
            <label class="label">
                <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.scene') }}</span>
            </label>
            <textarea 
                class="textarea textarea-bordered bg-base-100 h-20 w-full" 
                v-model="prompt.scene"
                :placeholder="$t('structuredPrompt.scenePlaceholder')" 
            />
        </div>

        <div class="form-control">
            <div class="flex items-center justify-between mb-2">
                <label class="label p-0">
                    <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.subjects') }}</span>
                </label>
                <button type="button" class="btn btn-ghost btn-xs gap-1" @click="addSubject">
                    <Icon name="lucide:plus" size="14" />
                    {{ $t('structuredPrompt.addSubject') }}
                </button>
            </div>
            
            <div v-if="prompt.subjects.length === 0" class="p-3 bg-base-100 border border-base-200 rounded-lg text-sm text-base-content/60 text-center">
                {{ $t('structuredPrompt.noSubjects') }}
            </div>
            
            <div v-for="(subject, index) in prompt.subjects" :key="index" class="p-3 bg-base-100 border border-base-200 rounded-lg mb-2">
                <div class="flex items-start justify-between gap-2 mb-2">
                    <select class="select select-sm select-bordered bg-base-200 flex-shrink-0" v-model="subject.type">
                        <option value="person">{{ $t('structuredPrompt.subjectTypes.person') }}</option>
                        <option value="object">{{ $t('structuredPrompt.subjectTypes.object') }}</option>
                        <option value="animal">{{ $t('structuredPrompt.subjectTypes.animal') }}</option>
                        <option value="text">{{ $t('structuredPrompt.subjectTypes.text') }}</option>
                    </select>
                    <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="removeSubject(index)">
                        <Icon name="lucide:x" size="14" />
                    </button>
                </div>
                <input 
                    type="text" 
                    class="input input-sm input-bordered bg-base-200 w-full mb-2" 
                    v-model="subject.description"
                    :placeholder="$t('structuredPrompt.subjectDescriptionPlaceholder')" 
                />
                <div class="grid grid-cols-2 gap-2">
                    <input 
                        type="text" 
                        class="input input-sm input-bordered bg-base-200 w-full" 
                        v-model="subject.pose"
                        :placeholder="$t('structuredPrompt.posePlaceholder')" 
                    />
                    <input 
                        type="text" 
                        class="input input-sm input-bordered bg-base-200 w-full" 
                        v-model="subject.position"
                        :placeholder="$t('structuredPrompt.positionPlaceholder')" 
                    />
                </div>
            </div>
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.style') }}</span>
            </label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button 
                    v-for="style in stylePresets" 
                    :key="style.value" 
                    type="button"
                    class="btn btn-sm"
                    :class="prompt.style === style.value ? 'btn-primary' : 'btn-ghost border border-base-100 bg-base-100'"
                    @click="prompt.style = style.value"
                >
                    {{ style.label }}
                </button>
            </div>
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.lighting') }}</span>
            </label>
            <select class="select select-bordered bg-base-100 w-full" v-model="prompt.lighting">
                <option v-for="lighting in lightingPresets" :key="lighting.value" :value="lighting.value">{{ lighting.label }}</option>
            </select>
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.camera') }}</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
                <select class="select select-sm select-bordered bg-base-100" v-model="prompt.camera!.angle">
                    <option v-for="angle in cameraAnglePresets" :key="angle.value" :value="angle.value">{{ angle.label }}</option>
                </select>
                <select class="select select-sm select-bordered bg-base-100" v-model="prompt.camera!.lens">
                    <option value="">{{ $t('structuredPrompt.noLens') }}</option>
                    <option v-for="lens in lensPresets" :key="lens.value" :value="lens.value">{{ lens.label }}</option>
                </select>
            </div>
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text text-sm font-medium">{{ $t('structuredPrompt.colorPalette') }}</span>
            </label>
            <div class="flex flex-wrap gap-2">
                <div 
                    v-for="(color, index) in prompt.color_palette" 
                    :key="index" 
                    class="flex items-center gap-1 bg-base-100 border border-base-200 rounded-lg px-2 py-1"
                >
                    <input 
                        type="color" 
                        :value="color" 
                        @input="updateColor(index, ($event.target as HTMLInputElement).value)"
                        class="w-5 h-5 rounded cursor-pointer border-0"
                    />
                    <span class="text-xs text-base-content/70">{{ color }}</span>
                    <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="removeColor(index)">
                        <Icon name="lucide:x" size="12" />
                    </button>
                </div>
                <button 
                    v-if="prompt.color_palette && prompt.color_palette.length < 5"
                    type="button" 
                    class="btn btn-ghost btn-xs gap-1 border border-dashed border-base-content/20"
                    @click="addColor"
                >
                    <Icon name="lucide:plus" size="12" />
                    {{ $t('structuredPrompt.addColor') }}
                </button>
            </div>
        </div>

        <div v-if="props.showJsonPreview" class="collapse collapse-arrow bg-base-100 border border-base-200 rounded-lg">
            <input type="checkbox" v-model="showJsonPreview" />
            <div class="collapse-title text-sm font-medium py-2 min-h-0">
                {{ $t('structuredPrompt.jsonPreview') }}
            </div>
            <div class="collapse-content">
                <pre class="text-xs bg-base-200 p-2 rounded overflow-x-auto max-h-40">{{ jsonPreview }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { 
    type StructuredPrompt, 
    type StructuredPromptSubject,
    createEmptyStructuredPrompt 
} from '~~/shared/generation/types';

const { t } = useI18n();

const props = defineProps<{
    modelValue?: StructuredPrompt;
    showJsonPreview?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: StructuredPrompt): void;
}>();

const stylePresets = [
    { value: 'photorealistic', label: t('structuredPrompt.stylePresets.photorealistic') },
    { value: 'cinematic', label: t('structuredPrompt.stylePresets.cinematic') },
    { value: 'anime', label: t('structuredPrompt.stylePresets.anime') },
    { value: 'digital art', label: t('structuredPrompt.stylePresets.digitalArt') },
    { value: 'oil painting', label: t('structuredPrompt.stylePresets.oilPainting') },
    { value: 'watercolor', label: t('structuredPrompt.stylePresets.watercolor') },
    { value: 'sketch', label: t('structuredPrompt.stylePresets.sketch') },
    { value: '3D render', label: t('structuredPrompt.stylePresets.3Drender') },
    { value: 'comic book', label: t('structuredPrompt.stylePresets.comicBook') },
    { value: 'pop art', label: t('structuredPrompt.stylePresets.popArt') },
]
const lightingPresets = [
    { value: 'natural daylight', label: t('structuredPrompt.lightingPresets.naturalDaylight') },
    { value: 'golden hour', label: t('structuredPrompt.lightingPresets.goldenHour') },
    { value: 'studio lighting', label: t('structuredPrompt.lightingPresets.studioLighting') },
    { value: 'dramatic shadows', label: t('structuredPrompt.lightingPresets.dramaticShadows') },
    { value: 'soft diffused', label: t('structuredPrompt.lightingPresets.softDiffused') },
    { value: 'neon glow', label: t('structuredPrompt.lightingPresets.neonGlow') },
    { value: 'moonlight', label: t('structuredPrompt.lightingPresets.moonlight') },
    { value: 'backlit silhouette', label: t('structuredPrompt.lightingPresets.backlitSilhouette') },
];
const cameraAnglePresets = [
    { value: 'eye level', label: t('structuredPrompt.cameraAnglePresets.eyeLevel') },
    { value: 'low angle', label: t('structuredPrompt.cameraAnglePresets.lowAngle') },
    { value: 'high angle', label: t('structuredPrompt.cameraAnglePresets.highAngle') },
    { value: 'bird\'s eye view', label: t('structuredPrompt.cameraAnglePresets.birdsEyeView') },
    { value: 'dutch angle', label: t('structuredPrompt.cameraAnglePresets.dutchAngle') },
    { value: 'close-up', label: t('structuredPrompt.cameraAnglePresets.closeUp') },
    { value: 'medium shot', label: t('structuredPrompt.cameraAnglePresets.mediumShot') },
    { value: 'wide shot', label: t('structuredPrompt.cameraAnglePresets.wideShot') },
];
const lensPresets = [
    { value: 'wide', label: t('structuredPrompt.lensPresets.wide') },
    { value: 'standard', label: t('structuredPrompt.lensPresets.standard') },
    { value: 'portrait', label: t('structuredPrompt.lensPresets.portrait') },
    { value: 'telephoto', label: t('structuredPrompt.lensPresets.telephoto') },
    { value: 'macro', label: t('structuredPrompt.lensPresets.macro') },
];

const showJsonPreview = ref(false);

const prompt = ref<StructuredPrompt>(props.modelValue ?? createEmptyStructuredPrompt());

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        prompt.value = newValue;
    }
}, { deep: true });

watch(prompt, (newValue) => {
    emit('update:modelValue', newValue);
}, { deep: true });

const jsonPreview = computed(() => {
    return JSON.stringify(prompt.value, null, 2);
});

function addSubject() {
    const newSubject: StructuredPromptSubject = {
        type: 'person',
        description: '',
        pose: '',
        position: '',
    };
    prompt.value.subjects.push(newSubject);
}

function removeSubject(index: number) {
    prompt.value.subjects.splice(index, 1);
}

function addColor() {
    if (!prompt.value.color_palette) {
        prompt.value.color_palette = [];
    }
    prompt.value.color_palette.push('#6366f1');
}

function removeColor(index: number) {
    prompt.value.color_palette?.splice(index, 1);
}

function updateColor(index: number, color: string) {
    if (prompt.value.color_palette) {
        prompt.value.color_palette[index] = color;
    }
}
</script>

<style scoped>
input[type="color"] {
    padding: 0;
}
input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
}
input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
}
</style>


