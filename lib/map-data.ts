import type { FeatureCollection, Polygon } from "geojson";
export const INFRA_METRICS = ["infra","stop","shop","kg","school","med","park","sea","climb","pharmacy","mall","fuel"] as const;
export type AtlasMetric = typeof INFRA_METRICS[number] | "outages" | "none";
export const METRIC_LABELS: Record<AtlasMetric,string> = {none:"Без индекса",infra:"Всё рядом",stop:"Остановки",shop:"Магазины",kg:"Детсады",school:"Школы",med:"Медицина",park:"Парки",sea:"Море",climb:"Подъём",pharmacy:"Аптеки",mall:"Торговые центры",fuel:"АЗС",outages:"Надёжность сетей"};
export interface AtlasChunk {key:string;west:number;south:number;east:number;north:number;buildings:number;}
export interface AtlasManifest {
  source:string; attribution:string; generatedAt:string; buildings:number;addressed:number; zoom:number;extent:number;chunks:AtlasChunk[];
  bbox:{west:number;south:number;east:number;north:number};
  infra:{generated_at:string;counts:{houses:number};histograms:Record<string,number[]>;districts:{name:string;houses:number;score:number;multi?:{houses:number;score:number}}[]};
  outages:{generated_at:string;period:{from:string;to:string};counts:{houses:number;outages:number};histograms?:Record<string,number[]>};
}
export type CompactBuilding = [number,number,number[],(number|null)[]|null,number|null,string|null];
export interface CompactChunk {tiles:{x:number;y:number;buildings:CompactBuilding[]}[];}
export interface BuildingProperties {osm:number;height:number;address:string;[key:string]:string|number;}
export function tilePoint(x:number,y:number,dx:number,dy:number,z=15,extent=4096):[number,number] {
  const n=2**z; return [(x+dx/extent)/n*360-180,Math.atan(Math.sinh(Math.PI*(1-2*(y+dy/extent)/n)))*180/Math.PI];
}
export function chunkFeatures(data:CompactChunk):FeatureCollection<Polygon,BuildingProperties> {
 return {type:"FeatureCollection",features:data.tiles.flatMap(t=>t.buildings.flatMap(b=>{
  if(b[2].length<6 || b[2].length%2) return [];
  const ring=[];for(let i=0;i<b[2].length;i+=2)ring.push(tilePoint(t.x,t.y,b[2][i],b[2][i+1]));
  if(ring[0][0]!==ring[ring.length-1][0] || ring[0][1]!==ring[ring.length-1][1])ring.push([...ring[0]] as [number,number]);
  const properties:BuildingProperties={osm:b[0],height:b[1],address:b[5]??"",outages:b[4]??-1};
  INFRA_METRICS.forEach((key,i)=>properties[key]=b[3]?.[i]??-1);
  return [{type:"Feature" as const,id:b[0],geometry:{type:"Polygon" as const,coordinates:[ring]},properties}];
 }))};
}
export function visibleChunks(chunks:AtlasChunk[],b:{west:number;south:number;east:number;north:number}) {
 const x=(b.west+b.east)/2,y=(b.south+b.north)/2;
 return chunks.filter(c=>c.east>=b.west&&c.west<=b.east&&c.north>=b.south&&c.south<=b.north)
  .sort((a,b)=>Math.hypot((a.west+a.east)/2-x,(a.south+a.north)/2-y)-Math.hypot((b.west+b.east)/2-x,(b.south+b.north)/2-y));
}
export function metricColor(value:number,metric:AtlasMetric,dark:boolean) {
 if(metric==="none"||value<0) return dark?"#55565d":"#c8c8ce";
 const t=Math.max(0,Math.min(100,value))/100;
 const colors=metric==="outages"?["#d32f2f","#1e9aa0"]:dark?["#4e4b5c","#9e92ff"]:["#e4e1ea","#4a3ad6"];
 const rgb=colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
 return "#"+rgb[0].map((v,i)=>Math.round(v+(rgb[1][i]-v)*t).toString(16).padStart(2,"0")).join("");
}
