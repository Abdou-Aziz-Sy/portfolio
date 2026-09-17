export const iconKeys = [
  "docker",
  "express",
  "github",
  "githubactions",
  "linux",
  "minio",
  "nextdotjs",
  "nginx",
  "nodedotjs",
  "ollama",
  "postgresql",
  "react",
  "redis",
  "trpc",
  "typescript",
] as const;

export type IconKey = (typeof iconKeys)[number];

export const iconLabel: Record<IconKey, string> = {
  docker: "Docker",
  express: "Express",
  github: "GitHub",
  githubactions: "GitHub Actions",
  linux: "Linux",
  minio: "MinIO",
  nextdotjs: "Next.js",
  nginx: "Nginx",
  nodedotjs: "Node.js",
  ollama: "Ollama",
  postgresql: "PostgreSQL",
  react: "React",
  redis: "Redis",
  trpc: "tRPC",
  typescript: "TypeScript",
};

export const SPRITE = "/icons.svg";
