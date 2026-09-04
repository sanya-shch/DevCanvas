import type { Tutorial } from "./types";

import { apiArchitecture } from "@/content/tutorials/api-architecture";
import { flowchartBasics } from "@/content/tutorials/flowchart-basics";
import { frontendArchitecture } from "@/content/tutorials/frontend-architecture";

export const tutorials: Tutorial[] = [flowchartBasics, apiArchitecture, frontendArchitecture];

export function getTutorialBySlug(slug: string): Tutorial | undefined {
  return tutorials.find((tutorial) => tutorial.slug === slug);
}
