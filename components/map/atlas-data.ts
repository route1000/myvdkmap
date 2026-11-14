"use client";
import { useEffect,useState } from "react";
import { chunkFeatures, type AtlasManifest, type CompactChunk } from "@/lib/map-data";
let manifestPromise:Promise<AtlasManifest>|null=null;
export function atlasManifest() {
 if(!manifestPromise) manifestPromise=fetch('/geo/inside/manifest.json').then(r=>{if(!r.ok)throw new Error('Не удалось загрузить данные карты');return r.json();}).catch(e=>{manifestPromise=null;throw e;});
 return manifestPromise;
}
export function useAtlasManifest() {
 const [data,setData]=useState<AtlasManifest|null>(null);
 useEffect(()=>{let live=true;atlasManifest().then(d=>{if(live)setData(d);}).catch(()=>{});return()=>{live=false;};},[]);
 return data;
}
const cache=new Map<string,Promise<ReturnType<typeof chunkFeatures>>>();
export function atlasChunk(key:string) {
 let data=cache.get(key);if(!data){
  data=fetch(`/geo/inside/${key}.json`).then(r=>{if(!r.ok)throw new Error('Не удалось загрузить здания');return r.json() as Promise<CompactChunk>;}).then(chunkFeatures).catch(e=>{cache.delete(key);throw e;});
  cache.set(key,data);
  if(cache.size>40)cache.delete(cache.keys().next().value!);
 }
 return data;
}
