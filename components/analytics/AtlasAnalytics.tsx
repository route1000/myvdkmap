"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMap } from "@/components/map/MapContext";
import { useAtlasManifest } from "@/components/map/atlas-data";
import { METRIC_LABELS } from "@/lib/map-data";
import { districtHref } from "@/lib/nav";
import { AnalyticsPanel } from "./AnalyticsPanel";
export function AtlasAnalytics() {
 const {metric,districts,scene}=useMap(),meta=useAtlasManifest();const [demo,setDemo]=useState(false);
 if(!meta)return <p className="atlas-detail-loading" role="status">Загружаем показатели…</p>;
 const outage=metric==='outages';const bins=(outage?meta.outages.histograms?.score:meta.infra.histograms[metric])??[];
 const max=Math.max(1,...bins);const selectedDistrict=districts.find(d=>d.id===scene.districtId);
 return <div className="atlas-detail"><span className="atlas-eyebrow">ГОРОД В ЦИФРАХ</span><h2>{METRIC_LABELS[metric]}</h2><p>Распределение домов по всему Владивостоку.</p>{selectedDistrict&&<p className="atlas-detail-note">На карте выбран {selectedDistrict.name} район. Гистограмма ниже показывает весь город.</p>}
  {bins.length?<><div className="atlas-detail-histogram" role="img" aria-label="Распределение домов по показателю">{bins.map((n,i)=><span key={i} title={`${n.toLocaleString('ru-RU')} домов`} style={{height:`${2+n/max*138}px`,background:outage?`color-mix(in srgb,#1e9aa0 ${100-i/bins.length*100}%,#d32f2f)`:`color-mix(in srgb,#e4e1ea ${100-i/bins.length*100}%,#7967df)`}}/>)}</div><div className="atlas-detail-axis"><span>{outage?'Надёжнее':'Меньше рядом'}</span><span>{outage?'Чаще отключали':'Больше рядом'}</span></div></>:<div className="atlas-detail-note">Выберите индекс в меню над картой.</div>}
  <div className="atlas-detail-kpis"><span><b>{(outage?meta.outages.counts.houses:meta.infra.counts.houses).toLocaleString('ru-RU')}</b>домов в индексе</span><span><b>{meta.buildings.toLocaleString('ru-RU')}</b>контуров зданий</span></div>
  {metric==='infra'&&<><h3>Районы</h3><p>Средняя доступность инфраструктуры, 0–100.</p><ol className="atlas-detail-ranking">{[...meta.infra.districts].sort((a,b)=>b.score-a.score).map((d,i)=>{const local=districts.find(x=>`${x.name} район`===d.name);return <li key={d.name}>{local?<Link href={districtHref(local.id)}><span>0{i+1}</span><span>{d.name.replace(' район','')}<small>{d.houses.toLocaleString('ru-RU')} домов</small></span><b>{d.score}</b><ArrowUpRight size={13}/></Link>:null}</li>;})}</ol></>}
  <details className="atlas-detail-sources"><summary>Источники и методика</summary><p>Индексы и контуры загружены с сайта «Изнанка». Геометрия: © участники OpenStreetMap. Неизвестные значения показаны серым, без присвоения выдуманного балла.</p><p>Инфраструктура: {meta.infra.generated_at.slice(0,10)}. Отключения: {meta.outages.period.from} — {meta.outages.period.to}. Данные сохранены в проекте и не требуют доступности сайта-источника при просмотре.</p><a href={meta.source} target="_blank" rel="noreferrer">Открыть источник ↗</a></details>
  <details className="atlas-demo-details" onToggle={e=>setDemo(e.currentTarget.open)}><summary>Обращения и квитанции · демоданные</summary>{demo&&<AnalyticsPanel/>}</details>
 </div>;
}
