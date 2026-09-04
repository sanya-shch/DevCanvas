<script setup lang="ts">
import { RouterLink } from 'vue-router'

const tutorials = [
  {
    slug: 'flowchart-basics',
    title: 'Flowchart Basics',
    description:
      'Learn how to create your first flowchart with DevCanvas.',
  },
  {
    slug: 'api-architecture',
    title: 'API Architecture',
    description:
      'Visualize a typical browser, API and database architecture.',
  },
  {
    slug: 'frontend-architecture',
    title: 'Frontend Architecture',
    description:
      'Explore how to represent frontend application architecture as a diagram.',
  },
]
</script>

<template>
  <div class="tutorials-page">
    <header class="page-header">
      <span class="eyebrow">
        Learn
      </span>

      <h1>
        Tutorials
      </h1>

      <p>
        Learn diagramming concepts through small,
        practical examples you can open directly in the editor.
      </p>
    </header>

    <section class="tutorial-list">
      <article
        v-for="tutorial in tutorials"
        :key="tutorial.slug"
        class="tutorial-card"
      >
        <div class="tutorial-content">
          <h2>
            {{ tutorial.title }}
          </h2>

          <p>
            {{ tutorial.description }}
          </p>
        </div>

        <RouterLink
          to="/editor"
          class="tutorial-link"
        >
          Open in editor →
        </RouterLink>
      </article>
    </section>
  </div>
</template>

<style scoped>
.tutorials-page {
  width: min(1000px, calc(100% - 48px));

  margin: 0 auto;
  padding: 72px 0;
}

.page-header {
  max-width: 680px;

  margin-bottom: 48px;
}

.eyebrow {
  color: var(--text-secondary);

  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 0;

  color: var(--accent-color);

  font-size: 42px;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.page-header p {
  margin: 16px 0 0;

  color: var(--text-secondary);

  font-size: 16px;
  line-height: 1.6;
}

.tutorial-list {
  display: grid;
  gap: 12px;
}

.tutorial-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  padding: 22px 24px;

  border: 1px solid var(--border-color);
  border-radius: 10px;

  background: var(--panel-background);
}

.tutorial-content {
  min-width: 0;
}

.tutorial-content h2 {
  margin: 0;

  font-size: 16px;
}

.tutorial-content p {
  margin: 7px 0 0;

  color: var(--text-secondary);

  font-size: 13px;
  line-height: 1.5;
}

.tutorial-link {
  flex-shrink: 0;

  color: var(--text-primary);

  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.tutorial-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .tutorial-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>