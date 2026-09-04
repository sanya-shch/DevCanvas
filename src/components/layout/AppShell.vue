<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: var(--app-background);
  color: var(--text-primary);
}

.app-content {
  flex: 1;
  min-width: 0;
}
</style>