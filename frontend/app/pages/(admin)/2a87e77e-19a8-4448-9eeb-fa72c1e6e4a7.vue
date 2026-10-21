<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <h1 class="text-2xl font-semibold text-base-content">Admin Control</h1>

    <div class="join">
      <button
        type="button"
        :class="['join-item btn', selectedSection === 'styles' ? 'btn-primary' : 'btn-ghost']"
        @click="selectSection('styles')"
      >
        Styles
      </button>
      <button
        type="button"
        :class="['join-item btn', selectedSection === 'tools' ? 'btn-primary' : 'btn-ghost']"
        @click="selectSection('tools')"
      >
        Tools
      </button>
      <button
        type="button"
        :class="['join-item btn', selectedSection === 'impersonate' ? 'btn-primary' : 'btn-ghost']"
        @click="selectSection('impersonate')"
      >
        Impersonate
      </button>
    </div>

    <div class="card bg-base-200 shadow-md rounded-box">
      <div class="card-body p-6">
        <AdminStylesPanel v-if="selectedSection === 'styles'" />
        <div v-if="selectedSection === 'tools'">Tools</div>
        <AdminImpersonationPanel v-if="selectedSection === 'impersonate'" />
        <div v-if="selectedSection && !['styles', 'tools', 'impersonate'].includes(selectedSection)">
          <p class="text-sm opacity-70">Select a section to configure.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sections = ['styles', 'tools', 'impersonate'] as const;
const selectedSection = ref<typeof sections[number]>('styles');

function selectSection(s: typeof sections[number]) {
  selectedSection.value = s as typeof sections[number];
};

definePageMeta({
  middleware: ['admin'],
});
</script>

<style scoped>

</style>