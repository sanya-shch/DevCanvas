import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  const base = command === "build" && repoName ? `/${repoName}/` : "/";

  return {
    base,

    plugins: [vue()],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
