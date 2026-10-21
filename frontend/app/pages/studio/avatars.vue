<template>
  <div class="mx-auto max-w-6xl p-4 lg:p-6">
    <ClickLabSharedSimulatedNotice
      class="mb-6"
      message="Avatar uploads stay in your browser. Training progress is simulated — no files are sent to external providers."
    />

    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="clicklab-display text-2xl font-bold text-white sm:text-3xl">AI Avatars</h1>
        <p class="mt-1 max-w-xl text-sm text-[var(--cl-text-muted)]">
          Upload 15–20 training photos in the demo flow. No files are sent to external providers in this phase.
        </p>
      </div>
      <button type="button" class="clicklab-btn-primary" @click="showCreate = true">
        <Icon name="lucide:plus" size="18" />
        Create Avatar
      </button>
    </div>

    <div v-if="pendingGallery" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="skeleton h-48 rounded-2xl" />
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="av in avatars"
        :key="av.id"
        class="clicklab-glass rounded-2xl p-5"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="h-14 w-14 rounded-2xl border border-white/10" :style="{ background: `linear-gradient(135deg, ${av.accent}55, #0a0a0a)` }" />
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
            :class="statusClass(av.trainingStatus)"
          >
            {{ statusLabel(av.trainingStatus) }}
          </span>
        </div>
        <h2 class="mt-4 font-semibold text-white">{{ av.name }}</h2>
        <p class="text-xs text-[var(--cl-text-muted)]">{{ av.photoCount }} photos · {{ av.trained ? 'Selectable in studio' : 'Incomplete' }}</p>
        <button
          type="button"
          class="clicklab-btn-ghost mt-4 w-full !text-sm"
          :disabled="!av.trained"
          @click="selectInStudio(av.id)"
        >
          Use in studio
        </button>
      </article>
    </div>

    <dialog ref="createDialog" class="modal" :class="{ 'modal-open': showCreate }">
      <div class="modal-box clicklab-glass max-w-2xl border border-white/10 bg-[var(--cl-bg-elevated)]">
        <h3 class="clicklab-display text-lg font-bold text-white">Create avatar (demo)</h3>
        <p class="mt-1 text-sm text-[var(--cl-text-muted)]">Name your avatar and add 15–20 clear photos. Training is simulated locally.</p>

        <div class="mt-4 space-y-4">
          <input v-model="form.name" type="text" class="input input-bordered w-full border-white/10 bg-black/30" placeholder="Avatar name" />
          <div
            class="rounded-xl border-2 border-dashed border-[var(--cl-neon)]/30 bg-black/20 p-8 text-center transition-colors"
            :class="dragOver ? 'border-[var(--cl-neon)] bg-[var(--cl-neon)]/5' : ''"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
          >
            <Icon name="lucide:upload" size="32" class="mx-auto text-[var(--cl-neon)]" />
            <p class="mt-2 text-sm text-white">Drop photos here or</p>
            <label class="clicklab-btn-ghost mt-3 inline-flex cursor-pointer !text-sm">
              Browse files
              <input type="file" accept="image/*" multiple class="hidden" @change="onFiles" />
            </label>
            <p class="mt-2 text-xs text-[var(--cl-text-muted)]">12–20 photos recommended</p>
          </div>

          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="space-y-1">
            <progress class="progress progress-primary w-full" :value="uploadProgress" max="100" />
            <p class="text-xs text-[var(--cl-text-muted)]">Uploading previews locally… {{ uploadProgress }}%</p>
          </div>

          <div v-if="previews.length" class="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            <img v-for="(src, i) in previews" :key="i" :src="src" alt="" class="aspect-square rounded-lg object-cover" />
          </div>

          <p v-if="formError" class="text-sm text-error">{{ formError }}</p>

          <div v-if="trainingPhase" class="alert border border-[var(--cl-violet)]/30 bg-[var(--cl-violet)]/10 text-sm text-white">
            <Icon name="svg-spinners:90-ring-with-bg" size="20" />
            <span>{{ trainingPhase }}</span>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeCreate">Cancel</button>
          <button type="button" class="clicklab-btn-primary" :disabled="isBusy" @click="submitCreate">
            {{ isBusy ? 'Working…' : 'Start demo training' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/70" @click="closeCreate">
        <button type="button">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { DemoAvatar } from '~~/shared/clicklab/demo-data';
import { DEMO_AVATARS } from '~~/shared/clicklab/demo-data';
import { CLICKLAB_PRODUCT_NAME } from '~~/shared/clicklab/brand';

definePageMeta({ layout: 'clicklab-studio' });

useHead({ title: `Avatars | ${CLICKLAB_PRODUCT_NAME}` });

const router = useRouter();
const { state } = useClickLabStudio();
const toast = useToast();

const avatars = ref<DemoAvatar[]>([...DEMO_AVATARS]);
const pendingGallery = ref(true);
const showCreate = ref(false);
const form = reactive({ name: '' });
const previews = ref<string[]>([]);
const uploadProgress = ref(0);
const formError = ref('');
const trainingPhase = ref('');
const isBusy = ref(false);
const dragOver = ref(false);

onMounted(() => {
  setTimeout(() => { pendingGallery.value = false; }, 400);
});

function statusLabel(s: DemoAvatar['trainingStatus']) {
  const map: Record<DemoAvatar['trainingStatus'], string> = {
    idle: 'Not started',
    uploading: 'Uploading',
    training: 'Training',
    ready: 'Ready',
    error: 'Error',
  };
  return map[s];
}

function statusClass(s: DemoAvatar['trainingStatus']) {
  if (s === 'ready') return 'bg-[var(--cl-neon)]/20 text-[var(--cl-neon)]';
  if (s === 'training' || s === 'uploading') return 'bg-[var(--cl-violet)]/20 text-[var(--cl-violet-bright)]';
  if (s === 'error') return 'bg-error/20 text-error';
  return 'bg-white/10 text-[var(--cl-text-muted)]';
}

function addFiles(files: FileList | File[]) {
  formError.value = '';
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  for (const file of list) {
    if (previews.value.length >= 20) break;
    previews.value.push(URL.createObjectURL(file));
  }
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
}

function closeCreate() {
  showCreate.value = false;
  form.name = '';
  previews.value = [];
  uploadProgress.value = 0;
  formError.value = '';
  trainingPhase.value = '';
}

async function submitCreate() {
  formError.value = '';
  if (!form.name.trim()) {
    formError.value = 'Name is required.';
    return;
  }
  if (previews.value.length < 12) {
    formError.value = 'Add at least 12 photos for the demo (15–20 recommended).';
    return;
  }

  isBusy.value = true;
  uploadProgress.value = 0;
  trainingPhase.value = '';

  for (let i = 0; i <= 100; i += 20) {
    uploadProgress.value = i;
    await new Promise((r) => setTimeout(r, 200));
  }

  trainingPhase.value = 'Simulating LoRA training…';
  await new Promise((r) => setTimeout(r, 1800));

  const id = `av-demo-${Date.now()}`;
  avatars.value.unshift({
    id,
    name: form.name.trim(),
    trained: true,
    trainingStatus: 'ready',
    photoCount: previews.value.length,
    accent: '#39ff88',
  });

  isBusy.value = false;
  closeCreate();
  toast.show({ status: 'success', title: 'Demo avatar ready', message: 'This avatar is stored in memory only for this session.' });
}

function selectInStudio(id: string) {
  state.value.avatarId = id;
  router.push('/studio');
}
</script>
