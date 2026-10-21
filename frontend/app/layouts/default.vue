<template>
    <div class="clicklab-dashboard-shell flex h-screen w-screen overflow-hidden bg-[#030506]">
        <BaseToast />
        <AppSidebar />
        <div class="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main class="flex-1 overflow-auto">
                <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 h-full">
                    <slot />
                </div>
            </main>
        </div>
        
        <BaseImageModal />
        <BaseFeedbackButton />
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
main {
    background: #030506;
}
</style>  