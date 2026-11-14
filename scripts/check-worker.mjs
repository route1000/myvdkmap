import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root='dist/server';
if (!existsSync(join(root,'index.js'))) throw new Error('Worker entrypoint is missing');
function walk(dir) {
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const path=join(dir,e.name);
    if (e.isDirectory()) walk(path);
    else if (path.endsWith('.js') && /libquery_engine-[^`"\s]+\.so\.node/.test(readFileSync(path,'utf8')))
      throw new Error(`Native Prisma engine leaked into Worker: ${path}`);
  }
}
walk(root);
console.log('Worker compatibility: no native SQLite engine bundled');

if (!existsSync('dist/client/vendor/maplibre-gl.worker.mjs')) throw new Error('MapLibre browser worker is missing from the published assets');
console.log('Map assets: standalone browser worker packaged');
