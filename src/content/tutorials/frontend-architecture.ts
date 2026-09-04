import type { Tutorial } from "@/features/tutorials/types";

export const frontendArchitecture: Tutorial = {
  slug: "frontend-architecture",
  title: "Frontend Architecture",
  description: "Explore a typical frontend architecture with UI, state management and API layers.",

  source: `flowchart TD

UI["UI Components"] -> State["State Management"]
State -> API["API Client"]
API -> Backend["Backend API"]
`,
};
