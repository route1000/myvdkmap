"use client";
import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { Map as GLMap, ExpressionSpecification, GeoJSONSource } from "maplibre-gl";
import { Minus, Plus, LocateFixed, Mountain, RotateCcw } from "lucide-react";
import { useMap } from "./MapContext";
import { atlasManifest,atlasChunk } from "./atlas-data";
import { METRIC_LABELS, visibleChunks,type AtlasManifest,type BuildingProperties } from "@/lib/map-data";
import { complexHref,issueHref,workHref,houseHref } from "@/lib/nav";
import OpenMap from "./OpenMap";

export default function AtlasMap() {
 const ctx=useMap(),router=useRouter(),{resolvedTheme}=useTheme();
 const current=useRef(ctx);current.current=ctx;
 const theme=useRef(resolvedTheme);theme.current=resolvedTheme;
 const node=useRef<HTMLDivElement>(null);const mapRef=useRef<GLMap|null>(null);
 const [drawn,setDrawn]=useState(false);
 const [ready,setReady]=useState(false),[fallback,setFallback]=useState(false),[threeD,setThreeD]=useState(true),[relief,setRelief]=useState(false);
 const [progress,setProgress]=useState({loaded:0,total:0}),[dataError,setDataError]=useState(false),[retry,setRetry]=useState(0);
 const loaded=useRef(new Set<string>());const generation=useRef(0);const manifest=useRef<AtlasManifest|null>(null);
 const [mapCenter,setMapCenter]=useState("43.1370° N  131.9100° E");
 function color():ExpressionSpecification {
  const {metric,selected}=current.current,dark=theme.current==="dark";
  const low=metric==="outages"?"#d32f2f":dark?"#4e4b5c":"#e4e1ea",high=metric==="outages"?"#1e9aa0":dark?"#9e92ff":"#4a3ad6";
  const unknown=dark?"#55565d":"#c8c8ce";
  return ["case",["==",["get","osm"],selected?.osm??-1],dark?"#ffffff":"#171719", metric==="none"?true:["<",["coalesce",["get",metric],-1],0],unknown,["interpolate",["linear"],["coalesce",["get",metric],0],0,low,100,high]];
 }
 function paint() {
  const map=mapRef.current;if(!map)return;
  for(const key of loaded.current)for(const suffix of ["flat","volume"])if(map.getLayer(`${key}-${suffix}`)){
   map.setPaintProperty(`${key}-${suffix}`,suffix==="flat"?"fill-color":"fill-extrusion-color",color());
  }
 }
 useEffect(()=>{
  if(!node.current)return;let live=true;
  import("maplibre-gl").then(GL=>{
   if(!live||!node.current)return;
   GL.setWorkerUrl(`/vendor/maplibre-gl.worker.mjs?v=${GL.getVersion()}`);
   const dark=theme.current==="dark";
   let map:GLMap;
   try {
    map=new GL.Map({container:node.current,center:[131.91,43.137],zoom:12.6,pitch:48,bearing:-24,minZoom:10,maxZoom:19,attributionControl:false,
     maxBounds:[[131.65,42.95],[132.4,43.42]],
     style:{version:8,sources:{base:{type:"geojson",data:{type:"FeatureCollection",features:[]}},
      terrain:{type:"raster-dem",tiles:["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],tileSize:256,encoding:"terrarium",maxzoom:12}},
      layers:[{id:"ground",type:"background",paint:{"background-color":dark?"#15161a":"#e3e5e9"}},
       {id:"land",type:"fill",source:"base",filter:["==",["get","kind"],"land"],paint:{"fill-color":dark?"#25262b":"#f1f2f4"}},
       {id:"water",type:"fill",source:"base",filter:["==",["get","kind"],"water"],paint:{"fill-color":dark?"#15161a":"#e3e5e9"}},
       {id:"roads",type:"line",source:"base",filter:["==",["get","kind"],"road"],paint:{"line-color":dark?"#65666e":"#ffffff","line-width":["interpolate",["linear"],["zoom"],10,.4,16,2.4],"line-opacity":.7}},
       {id:"bridges",type:"line",source:"base",filter:["==",["get","kind"],"bridge"],paint:{"line-color":dark?"#85868d":"#b5b7bf","line-width":["interpolate",["linear"],["zoom"],10,1,16,4]}}]},
     canvasContextAttributes:{antialias:true},fadeDuration:150});
   } catch {setFallback(true);window.dispatchEvent(new Event('map:ready'));return;}
   mapRef.current=map;
   const hover=new GL.Popup({closeButton:false,closeOnClick:false,offset:12});
   map.on('mouseout',()=>hover.remove());
   map.on('load',()=>{
    if(!live)return;fetch('/geo/inside/base.geojson').then(r=>{if(!r.ok)throw new Error('Base map failed');return r.json();}).then(data=>{if(live)(map.getSource('base') as GeoJSONSource).setData(data);}).catch(()=>setDataError(true));setReady(true);window.dispatchEvent(new Event('map:ready'));
    map.addSource('events',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    map.addLayer({id:'atlas-events',type:'circle',source:'events',paint:{'circle-radius':6,'circle-color':['get','color'],'circle-stroke-color':dark?'#171719':'#ffffff','circle-stroke-width':2}});
    map.on('click',e=>{
     hover.remove();
     if(document.documentElement.dataset.mapPick!==undefined){window.dispatchEvent(new CustomEvent('map:click',{detail:{lat:e.lngLat.lat,lng:e.lngLat.lng}}));return;}
     const layers=['atlas-events',...[...loaded.current].map(k=>`${k}-${map.getPitch()>10?'volume':'flat'}`)].filter(k=>!!map.getLayer(k));
     const hit=map.queryRenderedFeatures(e.point,{layers})[0];
     if(hit?.properties?.href){router.push(String(hit.properties.href));return;}
     if(hit?.properties?.osm){current.current.setSelected(hit.properties as BuildingProperties);return;}
     current.current.setSelected(null);
    });
    map.on('mousemove',e=>{
     const layers=['atlas-events',...[...loaded.current].map(k=>`${k}-${map.getPitch()>10?'volume':'flat'}`)].filter(k=>!!map.getLayer(k));
     const hit=map.queryRenderedFeatures(e.point,{layers})[0];
     const picking=document.documentElement.dataset.mapPick!==undefined;
     map.getCanvas().style.cursor=picking?'crosshair':hit?'pointer':'';
     if(hit&&!picking){const p=hit.properties,value=Number(p[current.current.metric]??-1);hover.setLngLat(e.lngLat).setText(`${p.address||p.label||'Здание'}${current.current.metric==='none'?'':value>=0?` · ${Math.round(value)}/100`:' · нет данных'}`).addTo(map);}else hover.remove();
    });
   });
   map.on('error',e=>{ if(/Worker failed to load|worker.*load|WebGL|context.*lost|GPU/i.test(e.error?.message??''))setFallback(true); });
   const rendered=()=>{if(loaded.current.size&&[...loaded.current].every(k=>!!map.getSource(k)&&map.isSourceLoaded(k)))setDrawn(true);};
   map.on('sourcedata',rendered);map.on('idle',rendered);
   map.on('moveend',()=>{const c=map.getCenter();setMapCenter(`${c.lat.toFixed(4)}° N  ${c.lng.toFixed(4)}° E`);});
  }).catch(()=>setFallback(true));
  return()=>{live=false;generation.current++;mapRef.current?.remove();mapRef.current=null;loaded.current.clear();};
 },[router]);
 useEffect(()=>{
  const map=mapRef.current;if(!ready||!map)return;let alive=true;
  async function update() {
   const turn=++generation.current;
   try {
    const meta=manifest.current??await atlasManifest();manifest.current=meta;
    if(!alive||turn!==generation.current)return;
    const bounds=map!.getBounds();const chunks=visibleChunks(meta.chunks,{west:bounds.getWest(),south:bounds.getSouth(),east:bounds.getEast(),north:bounds.getNorth()}).slice(0,32);
    const wanted=new Set(chunks.map(c=>c.key));
    // Bound GPU/memory use when travelling across the city.
    for(const key of [...loaded.current])if(!wanted.has(key)){
     for(const suffix of ['flat','volume'])if(map!.getLayer(`${key}-${suffix}`))map!.removeLayer(`${key}-${suffix}`);
     if(map!.getSource(key))map!.removeSource(key);loaded.current.delete(key);
    }
    setDrawn(false);
    setProgress({loaded:chunks.filter(c=>loaded.current.has(c.key)).length,total:chunks.length});setDataError(false);
    const queue=chunks.filter(c=>!loaded.current.has(c.key));
    await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{
     for(;;){const c=queue.shift();if(!c)return;const geo=await atlasChunk(c.key);if(!alive||turn!==generation.current)return;
      if(!map!.getSource(c.key)){
       map!.addSource(c.key,{type:'geojson',data:geo,tolerance:.15});
       map!.addLayer({id:`${c.key}-flat`,type:'fill',source:c.key,layout:{visibility:map!.getPitch()>10?'none':'visible'},paint:{'fill-color':color(),'fill-opacity':.92,'fill-outline-color':theme.current==='dark'?'#242529':'#b3b3b9'}},'atlas-events');
       map!.addLayer({id:`${c.key}-volume`,type:'fill-extrusion',source:c.key,layout:{visibility:map!.getPitch()>10?'visible':'none'},paint:{'fill-extrusion-color':color(),'fill-extrusion-height':['get','height'],'fill-extrusion-base':0,'fill-extrusion-opacity':.95,'fill-extrusion-vertical-gradient':true}},'atlas-events');
       loaded.current.add(c.key);setProgress({loaded:chunks.filter(c=>loaded.current.has(c.key)).length,total:chunks.length});
      }
     }
    }));
   } catch {if(alive&&turn===generation.current)setDataError(true);}
  }
  update();map.on('moveend',update);
  const pitch=()=>{const volume=map.getPitch()>10;for(const key of loaded.current){map.setLayoutProperty(`${key}-volume`,'visibility',volume?'visible':'none');map.setLayoutProperty(`${key}-flat`,'visibility',volume?'none':'visible');}};
  map.on('pitchend',pitch);return()=>{alive=false;generation.current++;map.off('moveend',update);map.off('pitchend',pitch);};
 },[ready,retry]);
 useEffect(()=>{paint();},[ctx.metric,ctx.selected,resolvedTheme,ready]);
 useEffect(()=>{
  const map=mapRef.current;if(!map||!ready)return;const dark=resolvedTheme==='dark';
  map.setPaintProperty('ground','background-color',dark?'#15161a':'#e3e5e9');
  map.setPaintProperty('land','fill-color',dark?'#25262b':'#f1f2f4');
  map.setPaintProperty('water','fill-color',dark?'#15161a':'#e3e5e9');
  map.setPaintProperty('roads','line-color',dark?'#65666e':'#ffffff');
  map.setPaintProperty('bridges','line-color',dark?'#85868d':'#b5b7bf');
 },[resolvedTheme,ready]);
 useEffect(()=>{
  const map=mapRef.current;if(!map||!ready)return;
  const {scene,shapes,insets}=ctx;const padding={top:90,right:32,bottom:Math.max(80,insets.bottom),left:Math.max(32,insets.left)};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target=scene.focus??ctx.complexes.find(c=>c.id===scene.complexId)??scene.buildings?.find(b=>b.id===scene.buildingId);
  if(target)map.flyTo({center:[target.lng,target.lat],zoom:scene.level==='house'?17:15.5,padding,duration:reduce?0:850});
  else if(scene.districtId){const f=shapes[scene.districtId]?.frame;if(f)map.fitBounds([f.southWest,f.northEast],{padding,duration:reduce?0:850,maxZoom:14.5});}
 },[ctx.scene,ctx.shapes,ctx.insets,ctx.complexes,ready]);
 useEffect(()=>{
  const map=mapRef.current;if(!map||!ready)return;
  const features=[...(ctx.layers.health?ctx.health.map(h=>({id:h.id,lat:h.lat,lng:h.lng,label:h.address,href:houseHref(h.id),color:h.level==="good"?"#93939f":h.level==="warn"?"#c7ac7c":"#d46f63"})):[]),...(ctx.layers.complexes?ctx.complexes.map(c=>({id:c.id,lat:c.lat,lng:c.lng,label:c.name,href:complexHref(c.districtId,c.id),color:'#84858d'})):[]),
   ...(ctx.layers.issues?ctx.issues.map(i=>({id:i.id,lat:i.lat,lng:i.lng,label:i.title,href:issueHref(i.id),color:'#d46f63'})):[]),
   ...(ctx.layers.works?ctx.works.filter(w=>w.lat!==null&&w.lng!==null).map(w=>({id:w.id,lat:w.lat!,lng:w.lng!,label:w.title,href:workHref(w.id),color:'#c7ac7c'})):[])];
  (map.getSource('events') as GeoJSONSource)?.setData({type:'FeatureCollection',features:features.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:p}))});
 },[ctx.layers,ctx.complexes,ctx.issues,ctx.works,ctx.health,ready]);
 useEffect(()=>{if(fallback){mapRef.current?.remove();mapRef.current=null;loaded.current.clear();}},[fallback]);
 if(fallback)return <OpenMap/>;
 return <><div ref={node} className="atlas-canvas" aria-label="Объёмная карта Владивостока с окраской зданий"/>
  <div className="atlas-camera" aria-label="Управление картой"><button aria-label="Приблизить" onClick={()=>mapRef.current?.zoomIn()}><Plus size={17}/></button><button aria-label="Отдалить" onClick={()=>mapRef.current?.zoomOut()}><Minus size={17}/></button><span/>
   <button aria-label={threeD?'Плоская карта':'Объёмная карта'} aria-pressed={threeD} onClick={()=>{setThreeD(!threeD);mapRef.current?.easeTo({pitch:threeD?0:48,bearing:threeD?0:-24,duration:500});}}> {threeD?'3D':'2D'} </button>
   <button aria-label="Рельеф" aria-pressed={relief} onClick={()=>{setRelief(!relief);mapRef.current?.setTerrain(relief?null:{source:'terrain',exaggeration:1.15});}}><Mountain size={17}/></button>
   <button aria-label="Север сверху" onClick={()=>mapRef.current?.easeTo({bearing:0,duration:500})}><RotateCcw size={16}/></button>
   <button aria-label="Весь город" onClick={()=>{ctx.setSelected(null);mapRef.current?.fitBounds([[131.84,43.057],[132.238,43.289]],{padding:{top:110,bottom:130,left:30,right:30},duration:700,maxZoom:13});router.push('/#map');}}><LocateFixed size={17}/></button></div>
  <div className="atlas-readout">{mapCenter}</div>
  <div className="atlas-loading" role="status">{dataError?<button onClick={()=>setRetry(v=>v+1)}>Не все здания загрузились · повторить</button>:progress.loaded<progress.total?`Здания · ${progress.loaded} / ${progress.total}`:progress.total?(drawn?`${METRIC_LABELS[ctx.metric]} · здания на карте`:"Отрисовываем здания…"):"Загружаем карту…"}</div>
 </>;
}
