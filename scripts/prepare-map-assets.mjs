import { createRequire } from 'node:module';
import { dirname,join } from 'node:path';
import { copyFileSync,mkdirSync,existsSync } from 'node:fs';
const require=createRequire(import.meta.url);
const root=dirname(require.resolve('maplibre-gl/package.json'));
mkdirSync('public/vendor',{recursive:true});
copyFileSync(join(root,'dist/maplibre-gl-worker.mjs'),'public/vendor/maplibre-gl.worker.mjs');
for(const name of ['LICENSE.txt','LICENSE'])if(existsSync(join(root,name))){copyFileSync(join(root,name),'public/vendor/maplibre-LICENSE.txt');break;}
console.log('MapLibre module worker copied to public/vendor');
