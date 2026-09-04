import type { Tutorial } from "@/features/tutorials/types";

export const apiArchitecture: Tutorial = {
  slug: "api-architecture",
  title: "API Architecture",
  description: "Visualize how a frontend communicates with an API and external services.",

  source: `flowchart LR

Client["Frontend"] -- "HTTP request" -> API["API Gateway"]
API -- "request" -> Service["Backend Service"]
Service -- "query" -> Database["PostgreSQL"]
Service -- "cache" -> Redis["Redis"]
`,
};
