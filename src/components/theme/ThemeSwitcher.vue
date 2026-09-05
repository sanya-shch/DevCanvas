<script setup lang="ts">
import { storeToRefs } from 'pinia'

import {
  useThemeStore,
  type Theme,
} from '@/stores/theme'

const themeStore = useThemeStore()

const { theme } = storeToRefs(themeStore)

const themes: Array<{
  value: Theme
  label: string
}> = [
  {
    value: 'dark',
    label: 'Dark',
  },
  {
    value: 'light',
    label: 'Light',
  },
  {
    value: 'midnight',
    label: 'Midnight',
  },
]

function handleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  themeStore.setTheme(value as Theme)
}
</script>

<template>
  <label class="theme-switcher">
    <span class="theme-switcher__label">
      Theme
    </span>

    <select
      :value="theme"
      class="theme-switcher__select"
      aria-label="Select theme"
      @change="handleChange"
    >
      <option
        v-for="item in themes"
        :key="item.value"
        :value="item.value"
      >
        {{ item.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.theme-switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.theme-switcher__label {
  color: var(--text-secondary);
  font-size: 12px;
}

.theme-switcher__select {
  height: 32px;
  padding: 0 28px 0 10px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  background: var(--input-background);
  color: var(--text-primary);

  font-size: 13px;
  cursor: pointer;
}

.theme-switcher__select:hover {
  border-color: var(--text-secondary);
}

.theme-switcher__select:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 1px;
}
</style>