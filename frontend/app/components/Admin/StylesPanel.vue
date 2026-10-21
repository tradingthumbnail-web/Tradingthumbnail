<template>
    <div class="w-full">
        <div class="flex flex-col gap-4 md:grid md:grid-cols-10">
            <div class="md:col-span-3 bg-base-200 p-4 rounded-lg shadow-sm">
                <h2 class="text-lg font-medium mb-4">Create Style</h2>
                <form @submit.prevent="createStyle" class="space-y-3">
                    <input v-model="form.name" placeholder="Name" class="input input-bordered w-full"
                        aria-label="style name" />
                    <textarea v-model="form.description" placeholder="Description"
                        class="textarea textarea-bordered w-full" aria-label="style description"></textarea>

                    <input type="file" placeholder="Upload preview image" class="file-input w-full"
                        aria-label="preview url" @change="onFileChange" accept="image/*" />
                    <div v-if="fileBase64Preview" class="mt-2 text-xs text-base-content/70 flex items-center gap-2">
                        <img :src="fileBase64Preview" alt="preview" class="h-10 w-10 rounded object-cover" />
                        <span>Preview</span>
                    </div>

                    <div class="form-control">
                        <label class="label flex items-center justify-between p-0">
                            <span class="label-text">Public</span>
                            <input type="checkbox" v-model="form.isPublic" class="toggle" aria-label="is public" />
                        </label>
                    </div>

                    <div>
                        <label class="label flex items-center justify-between p-0">
                            <span class="label-text">Style JSON</span>
                            <div class="flex gap-2">
                                <button type="button" class="btn btn-ghost btn-xs" @click="formatStyleJson">Format
                                    JSON</button>
                                <button type="button" class="btn btn-ghost btn-xs"
                                    @click="clearStyleJson">Clear</button>
                            </div>
                        </label>
                        <textarea v-model="styleRaw" placeholder='{"mood_keywords":["calm"]}'
                            class="textarea textarea-bordered w-full h-40" aria-label="style json"></textarea>
                        <div v-if="styleJsonError" class="text-xs text-error mt-1">{{ styleJsonError }}</div>
                    </div>

                    <div class="pt-2">
                        <button class="btn btn-primary w-full">Create</button>
                    </div>
                </form>
            </div>

            <div class="md:col-span-7 bg-base-200 p-4 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-medium">Existing Styles</h2>
                    <button class="btn btn-ghost btn-sm" @click="refreshStyles()">Refresh</button>
                </div>

                <div v-if="styles?.length === 0" class="text-sm opacity-70">No styles found yet.</div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="s in styles || []" :key="s.id" class="card bg-base-100 p-3 rounded">
                        <div class="flex gap-3 items-start">
                            <div class="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                                <BaseKiThumbsImage :src="`/api/v1/style/${s.id}/view`" alt="style preview" />
                            </div>

                            <div class="flex-1">
                                <div class="font-medium">{{ s.name }}</div>
                                <div class="text-xs opacity-70">{{ s.description }}</div>
                                <div class="text-xs opacity-60 mt-1">{{ s.createdAt ? (new
                                    Date(s.createdAt)).toLocaleString() : '' }}</div>
                                <div class="flex gap-2 mt-2 flex-wrap">
                                    <span v-for="t in s.tags" :key="t" class="badge badge-outline">{{ t }}</span>
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                <button class="btn btn-sm btn-error" @click="deleteStyle(s.id)">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Style, InsertStyle } from '~~/server/database/schemas/style.schema';

const { data: styles, refresh: refreshStyles } = await useFetch('/api/v1/style');
const toast = useToast();
const { convertFileToBase64 } = useFile();

const fileBase64Preview = ref<string | null>(null);
const base64File = ref<string | null>(null);
const form = reactive({
    name: '',
    description: '',
    style: {},
    isPublic: false,
    version: 1,
    tags: [] as string[],
} as InsertStyle);

const styleRaw = ref<string>(JSON.stringify(form.style || {}, null, 2));
const styleJsonError = ref<string | null>(null);

watch(styleRaw, (val) => {
    if (!val) {
        form.style = {} as any;
        styleJsonError.value = null;
        return;
    }
    try {
        const parsed = JSON.parse(val);
        form.style = parsed as any;
        styleJsonError.value = null;
    } catch (e) {
        styleJsonError.value = 'Invalid JSON';
    }
});

const onFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    // local preview:
    fileBase64Preview.value = URL.createObjectURL(file); // keep this for preview only
    // real payload:
    const base64 = await convertFileToBase64(file);
    base64File.value = base64;
};

function formatStyleJson() {
    try {
        const parsed = styleRaw.value ? JSON.parse(styleRaw.value) : {};
        styleRaw.value = JSON.stringify(parsed, null, 2);
        styleJsonError.value = null;
    } catch (e) {
        styleJsonError.value = 'Cannot format: invalid JSON';
    }
}

function clearStyleJson() {
    styleRaw.value = '{}';
    form.style = {} as any;
    styleJsonError.value = null;
}

const createStyle = async () => {
    try {
        const payload = {
            name: form.name,
            description: form.description,
            style: form.style,
            isPublic: form.isPublic,
            version: form.version,
            tags: form.tags,
            base64Image: base64File.value,
        };
        if (!payload.base64Image) {
            throw new Error('No file selected');
        }

        await $fetch('/api/v1/style', { method: 'POST', body: payload });
        await refreshStyles();
        toast.show({
            title: 'Success',
            message: 'Style created successfully',
            status: 'success',
        });
    } catch (error) {
        console.error('createStyle failed', error);
        toast.show({
            title: 'Error',
            message: 'Failed to create style',
            status: 'error',
        });
    }
};

const deleteStyle = async (id: string) => {
    if (!styles.value) return;
    try {
        await $fetch(`/api/v1/style/${id}`, { method: 'DELETE' });
        await refreshStyles();
        toast.show({
            title: 'Success',
            message: 'Style deleted successfully',
            status: 'success',
        });
    } catch (error) {
        console.error("-x- Error deleting style", error);
        toast.show({
            title: 'Error',
            message: 'Failed to delete style',
            status: 'error',
        });
    }
}
</script>

<style scoped></style>