import assert from "node:assert/strict";
import { readFileSync,readdirSync } from "node:fs";
import { chunkFeatures,tilePoint,metricColor,visibleChunks, type CompactChunk, type AtlasManifest } from "./map-data";
const point=tilePoint(28388,12025,0,0);
assert.ok(Math.abs(point[0]-131.8798828)<0.000001);
assert.ok(Math.abs(point[1]-43.1250432)<0.000001);
const f=chunkFeatures({tiles:[{x:28388,y:12025,buildings:[[1,16,[0,0,100,0,100,100],null,null,null]]}]}).features[0];
assert.equal(f.geometry.coordinates[0].length,4);
assert.deepEqual(f.geometry.coordinates[0][0],f.geometry.coordinates[0].at(-1));
assert.equal(f.properties.infra,-1);
assert.equal(metricColor(-1,'infra',false),'#c8c8ce');
assert.equal(metricColor(0,'infra',false),'#e4e1ea');
assert.equal(metricColor(100,'infra',false),'#4a3ad6');
assert.equal(metricColor(100,'infra',true),'#9e92ff');
const m=JSON.parse(readFileSync('public/geo/inside/manifest.json','utf8')) as AtlasManifest;
assert.ok(m.buildings>60_000);
assert.equal(m.chunks.reduce((n,c)=>n+c.buildings,0),m.buildings);
assert.ok(visibleChunks(m.chunks,{west:131.88,south:43.11,east:131.90,north:43.13}).length>0);
assert.equal(visibleChunks(m.chunks,{west:0,south:0,east:1,north:1}).length,0);
let count=0,scored=0;
for(const name of readdirSync('public/geo/inside').filter(p=>p!=='manifest.json')){
 const data=JSON.parse(readFileSync(`public/geo/inside/${name}`,'utf8')) as CompactChunk;
 const geo=chunkFeatures(data); count+=geo.features.length;
 for(const f of geo.features){assert.ok(Number.isFinite(f.properties.height));assert.ok(f.properties.height>0);if(Number(f.properties.infra)>=0)scored++;
  const p=f.geometry.coordinates[0][0];assert.ok(p[0]>131&&p[0]<133&&p[1]>42&&p[1]<44);}
}
assert.equal(count,m.buildings);assert.ok(scored>15_000);
console.log(`map data: ${count} building polygons, ${scored} infrastructure scores verified`);
