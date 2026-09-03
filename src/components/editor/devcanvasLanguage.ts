import * as monaco from "monaco-editor";

export const DEV_CANVAS_LANGUAGE = "devcanvas";

export function registerDevCanvasLanguage() {
  monaco.languages.register({
    id: DEV_CANVAS_LANGUAGE,
  });

  monaco.languages.setMonarchTokensProvider(DEV_CANVAS_LANGUAGE, {
    tokenizer: {
      root: [
        [/^(\s*)(flowchart)(\s+)(TD|LR)/, ["white", "keyword", "white", "direction"]],
        [/^\s*\/\/.*$/, "comment"],
        [/->/, "operator"],
        [/[a-zA-Z_][\w-]*/, "identifier"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(DEV_CANVAS_LANGUAGE, {
    comments: {
      lineComment: "//",
    },

    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
  });
}
