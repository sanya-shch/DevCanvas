import { createRouter, createWebHistory } from "vue-router";

import AppShell from "@/components/layout/AppShell.vue";
import HomePage from "@/pages/HomePage.vue";
import EditorPage from "@/pages/EditorPage.vue";
import TutorialsPage from "@/pages/TutorialsPage.vue";

export const router = createRouter({
  history: createWebHistory(),

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
          component: TutorialsPage,
        },
      ],
    },
    {
      path: "/editor",
      component: EditorPage,
    },
  ],
});
