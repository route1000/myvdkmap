import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
const local = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  plugins: [vinext(), cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })],
  resolve: { alias: [
    { find: "@/lib/db", replacement: local("./lib/db-worker.ts") },
    { find: "@/lib/storage", replacement: local("./lib/storage-worker.ts") },
    { find: "@/lib/vote-store", replacement: local("./lib/vote-store-worker.ts") },
  ] },
});
