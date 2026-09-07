<script setup lang="ts"></script>

<template>
  <div class="not-found-page">
    <span class="eyebrow"> 404 </span>

    <h1>Page not found</h1>

    <p>The page you're looking for doesn't exist or may have moved.</p>

    <div class="actions">
      <RouterLink to="/" class="primary-button"> Go home </RouterLink>

      <RouterLink to="/editor" class="secondary-button"> Open editor </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 12px;

  min-height: 60vh;
  padding: 32px 24px;

  text-align: center;
}

.eyebrow {
  color: var(--accent-color);

  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;

  color: var(--text-primary);

  font-size: 32px;
}

p {
  margin: 0 0 12px;
  max-width: 420px;

  color: var(--text-secondary);

  font-size: 15px;
}

.actions {
  display: flex;
  gap: 12px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 10px 20px;

  border-radius: 8px;

  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.primary-button {
  border: 1px solid transparent;

  background: var(--accent-color);
  color: var(--accent-contrast-color);
}

.primary-button:hover {
  opacity: 0.9;
}

.secondary-button {
  border: 1px solid var(--border-color);

  background: transparent;
  color: var(--text-primary);
}

.secondary-button:hover {
  background: var(--hover-background);
}
</style>
