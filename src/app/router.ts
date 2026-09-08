import { createRouter, createWebHistory } from "vue-router";

import AppShell from "@/components/layout/AppShell.vue";
import HomePage from "@/pages/HomePage.vue";

import { setDocumentTitle } from "./pageTitle";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      component: AppShell,
      children: [
        {
          path: "",
          component: HomePage,
        },
        {
          path: "tutorials",
          component: () => import("@/pages/TutorialsPage.vue"),
          meta: {
            title: "Tutorials",
          },
        },
        {
          path: "diagrams",
          component: () => import("@/pages/DiagramsPage.vue"),
          meta: {
            title: "My Diagrams",
          },
        },
      ],
    },
    {
      path: "/editor",
      component: () => import("@/pages/EditorPage.vue"),
      meta: {
        title: "Editor",
      },
    },
    {
      /*
       * A minimal, read-only route meant for embedding a single
       * diagram in an iframe on another site — no app chrome, no
       * editing.
       */
      path: "/embed",
      component: () => import("@/pages/EmbedPage.vue"),
      meta: {
        title: "Embed",
      },
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("@/pages/NotFoundPage.vue"),
      meta: {
        title: "Page not found",
      },
    },
  ],
});

router.afterEach((to) => {
  setDocumentTitle(to.meta.title as string | undefined);
});
