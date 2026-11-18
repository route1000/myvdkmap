"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, X, ArrowUpRight, BarChart3 } from "lucide-react";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import { useMap } from "./MapContext";
import { useAtlasManifest } from "./atlas-data";
import { METRIC_LABELS,INFRA_METRICS,type AtlasMetric } from "@/lib/map-data";
import { districtHref,houseHref } from "@/lib/nav";

export function MetricMenu() {
 const {metric,setMetric}=useMap(); const [open,setOpen]=useState(false);
 return <div className="atlas-mode-group"><button className="atlas-tool atlas-map-mode" aria-pressed={metric==='none'} onClick={()=>setMetric('none')}>Карта</button><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button className="atlas-tool atlas-index-button"><i/> <span>{metric==='none'?'Индекс':METRIC_LABELS[metric]}</span><ChevronDown size={12}/></button></PopoverTrigger>
  <PopoverContent align="end" className="atlas-menu w-64"><p>Что показывает цвет</p><div className="atlas-metric-list">{[...INFRA_METRICS,"outages","none"].map(key=><button key={key} aria-pressed={metric===key} onClick={()=>{setMetric(key as AtlasMetric);setOpen(false);}}><span>{METRIC_LABELS[key as AtlasMetric]}</span>{metric===key&&<span>✓</span>}</button>)}</div></PopoverContent></Popover></div>;
}
export function AtlasHUD() {
 const {metric,selected,setSelected,districts,setAnalyticsOpen}=useMap();const meta=useAtlasManifest();const root=usePathname()==="/";
 const histogram=metric!=="none"&&metric!=="outages"?meta?.infra.histograms[metric]:null;
 const high=Math.max(1,...(histogram??[]));const value=selected?Number(selected[metric]??-1):-1;
 return <>
  {root&&<div className="atlas-district-selector"><Popover><PopoverTrigger asChild><button className="atlas-tool">Районы <ChevronDown size={12}/></button></PopoverTrigger><PopoverContent align="start" className="atlas-menu w-72"><p>Инфраструктура · средний балл</p>{districts.map(d=>{const score=meta?.infra.districts.find(x=>x.name===`${d.name} район`)?.score;return <Link className="atlas-district-row" href={districtHref(d.id)} key={d.id}><span>{d.name}</span><b>{score??'—'}</b><ArrowUpRight size={12}/></Link>;})}</PopoverContent></Popover></div>}
  {root&&!selected&&metric!=="none"&&<section className="atlas-index-card" aria-label="Индекс на карте"><span className="atlas-eyebrow">ВЛАДИВОСТОК / ИНДЕКС</span><h1>{METRIC_LABELS[metric]}</h1><p>{metric==='outages'?'Надёжность коммунальных сетей':'Что доступно рядом с домом'}</p>
   {histogram&&<div className="atlas-histogram" role="img" aria-label="Распределение домов по баллам по всему городу">{histogram.map((n,i)=><span key={i} style={{height:`${6+Math.sqrt(n/high)*48}px`,opacity:.3+i/histogram.length*.7}} title={`${Math.round(i/histogram.length*100)}–${Math.round((i+1)/histogram.length*100)} баллов: ${n} домов`}/>)}</div>}
   <div className="atlas-index-caption"><span>{meta?(metric==='outages'?meta.outages.counts.houses:meta.infra.counts.houses).toLocaleString('ru-RU'):'…'} домов</span><button onClick={()=>setAnalyticsOpen(true)} aria-label="Открыть подробную аналитику"><BarChart3 size={14}/> Подробнее</button></div>
  </section>}
  {selected&&<aside className="atlas-building-card" aria-label="Выбранное здание"><button className="atlas-close" aria-label="Закрыть здание" onClick={()=>setSelected(null)}><X size={16}/></button><span className="atlas-eyebrow">ДОМ НА КАРТЕ</span><h2>{selected.address||'Здание без адреса'}</h2><div className="atlas-building-score"><strong>{value>=0&&metric!=='none'?Math.round(value):'—'}</strong><span>{METRIC_LABELS[metric]}<small>{value>=0?'из 100 баллов':'Нет данных для оценки'}</small></span></div><div className="atlas-building-facts"><span>Инфраструктура <b>{Number(selected.infra)>=0?`${selected.infra}/100`:'Нет данных'}</b></span><span>Надёжность сетей <b>{Number(selected.outages)>=0?`${selected.outages}/100`:'Нет данных'}</b></span></div>{selected.address&&<Link href={houseHref(`osm-${selected.osm}`)} className="atlas-passport">Паспорт дома <ArrowUpRight size={16}/></Link>}<p className="atlas-source-note">Высота здания может быть оценочной.</p></aside>}
  <div className={`atlas-legend ${metric==='outages'?'is-outages':''}`} aria-label="Легенда индекса"><span>{metric==='none'?'Здания':METRIC_LABELS[metric]}</span>{metric!=='none'&&<><div className="atlas-color-scale"/><div className="atlas-scale-labels"><span>0 · меньше</span><span>100 · больше</span></div></>}<small><i/>Нет данных</small></div>
  <div className="atlas-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="https://inside-map.mrnikitus.ru/" target="_blank" rel="noreferrer">Изнанка</a></div>
 </>;
}
