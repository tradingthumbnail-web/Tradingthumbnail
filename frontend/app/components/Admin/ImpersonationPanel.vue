<template>
  <div class="w-full space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Search Users</span>
      </label>
      <div class="relative">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, or username..."
          class="input input-bordered w-full border-base-100 bg-base-100"
          aria-label="Search users"
        />
        <span v-if="searchQuery" class="absolute right-3 top-3 text-xs opacity-50">
          {{ filteredUsers.length }} result(s)
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="space-y-2 max-h-96 overflow-y-auto">
      <div v-if="filteredUsers.length === 0" class="text-sm opacity-70 py-4 text-center">
        <span v-if="searchQuery">No users found matching your search</span>
        <span v-else>No users available</span>
      </div>

      <button
        v-for="u in filteredUsers"
        :key="u.id"
        type="button"
        class="w-full text-left p-3 rounded-lg border border-base-100 bg-base-100 hover:border-primary hover:bg-base-200 transition-colors"
        :class="selectedUser?.id === u.id ? 'border-primary bg-primary/10' : ''"
        @click="selectUser(u)"
      >
        <div class="font-medium text-sm">{{ u.name }}</div>
        <div class="text-xs opacity-70">{{ u.email }}</div>
        <div class="text-xs opacity-50 mt-1">@{{ u.username }} • {{ u.role }}</div>
        <div v-if="u.lastSignedInAt" class="text-xs opacity-50 mt-1">
          Last seen: {{ formatDate(u.lastSignedInAt) }}
        </div>
      </button>
    </div>

    <div v-if="selectedUser" class="card bg-base-200 p-4 mt-6">
      <div class="space-y-3">
        <div>
          <span class="font-medium">Selected User:</span>
          <div class="text-sm mt-1">{{ selectedUser.name }} ({{ selectedUser.email }})</div>
        </div>
        <button
          type="button"
          class="btn btn-primary w-full"
          :disabled="impersonating"
          @click="impersonate"
        >
          <span v-if="impersonating" class="loading loading-spinner loading-sm"></span>
          <span v-else>Impersonate User</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  credit: number;
  createdAt: string;
  lastSignedInAt: string | null;
}

const searchQuery = ref('');
const selectedUser = ref<AdminUser | null>(null);
const users = ref<AdminUser[]>([]);
const loading = ref(true);
const impersonating = ref(false);
const toast = useToast();
const impersonateStore = useImpersonateStore();

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(u => 
    u.name.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query) ||
    u.username.toLowerCase().includes(query)
  );
});

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function selectUser(user: AdminUser) {
  selectedUser.value = selectedUser.value?.id === user.id ? null : user;
}

async function impersonate() {
  if (!selectedUser.value) return;
  
  impersonating.value = true;
  try {
    await impersonateStore.impersonateUser(selectedUser.value.id);

    toast.show({
      title: 'Success',
      message: `Successfully impersonating ${selectedUser.value.name}`,
      status: 'success',
    });

    await navigateTo('/');
  } catch (error) {
    console.error('Impersonation failed', error);
    toast.show({
      title: 'Error',
      message: 'Failed to impersonate user',
      status: 'error',
    });
    impersonating.value = false;
  }
}

onMounted(async () => {
  try {
    users.value = await $fetch('/api/v1/admin/users');
  } catch (error) {
    console.error('Failed to fetch users', error);
    toast.show({
      title: 'Error',
      message: 'Failed to load users',
      status: 'error',
    });
  } finally {
    loading.value = false;
  }
});
</script>
