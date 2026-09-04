import type { Tutorial } from "@/features/tutorials/types";

export const flowchartBasics: Tutorial = {
  slug: "flowchart-basics",
  title: "Flowchart Basics",
  description: "Learn how to describe a simple system using nodes and connections.",

  source: `flowchart LR

Browser["Web Browser"] -> API["API"]
API -> Database["Database"]
`,
};
