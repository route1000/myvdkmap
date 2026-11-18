import { defineConfig, normalizePath } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
const local = (p: string) => normalizePath(fileURLToPath(new URL(p, import.meta.url)));
export default defineConfig({
  plugins: [{
    name: "myvdkmap-worker-storage",
    enforce: "pre",
    load(id) {
      for (const name of ["db", "storage", "vote-store"]) {
        if (normalizePath(id) === local(`./lib/${name}.ts`)) return `export * from ${JSON.stringify(local(`./lib/${name}-worker.ts`))};`;
      }
    },
  }, vinext(), cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })],
  resolve: { alias: [
    { find: "@/lib/db", replacement: local("./lib/db-worker.ts") },
    { find: "@/lib/storage", replacement: local("./lib/storage-worker.ts") },
    { find: "@/lib/vote-store", replacement: local("./lib/vote-store-worker.ts") },
  ] },
});
