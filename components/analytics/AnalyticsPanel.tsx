"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { ArrowUpRight, BarChart3, RefreshCw } from "lucide-react";
import { useMap } from "@/components/map/MapContext";
import type { AnalyticsDTO } from "@/lib/analytics";
import { districtHref } from "@/lib/nav";

export function AnalyticsPanel() {
  const { scene, layers, setLayers, setHealth } = useMap();
  const [data, setData] = useState<AnalyticsDTO | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => { const refresh = () => setRetry(n => n + 1); window.addEventListener("issues:changed", refresh); return () => window.removeEventListener("issues:changed", refresh); }, []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => {
    const ctrl = new AbortController(); let live = true;
    setLoading(true); setError(""); setData(null); setHealth([]);
    const q = new URLSearchParams();
    if (scene.districtId) q.set("district", scene.districtId);
    if (scene.buildingId) q.set("house", scene.buildingId);
    if (from) q.set("from", from); if (to) q.set("to", to);
    fetch(`/api/analytics?${q}`, { signal: ctrl.signal }).then(async r => {
      const body = await r.json(); if (!r.ok) throw new Error(body.error ?? "Не удалось загрузить аналитику");
      if (live) { setData(body); setHealth(body.health); }
    }).catch(e => { if (live && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; ctrl.abort(); };
  }, [scene.districtId, scene.buildingId, from, to, retry, setHealth]);
  const tooltip = { contentStyle: { background: "var(--popover)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 10 }, labelStyle: { color: "var(--foreground)" } };
  return <section className="analytics-panel" aria-label="Аналитика карты" aria-busy={loading}>
    <div className="analytics-heading"><span><BarChart3 size={16}/> Город в цифрах</span><span className="demo-pill">ДЕМО</span></div>
    <p className="analytics-subtitle">{scene.buildingId ? "Выбранный дом" : scene.districtId ? "Выбранный район" : "Весь Владивосток"} · карта и показатели связаны</p>
    <div className="analytics-period"><label>С месяца<input aria-label="Начало периода" type="month" value={from} onChange={e => setFrom(e.target.value)}/></label><label>По месяц<input aria-label="Конец периода" type="month" value={to} onChange={e => setTo(e.target.value)}/></label></div>
    <label className="health-toggle"><input type="checkbox" checked={layers.health} onChange={e => setLayers(l => ({...l, health:e.target.checked}))}/> Состояние домов на карте</label>
    {loading ? <p role="status" className="analytics-status">Загружаем показатели…</p> : error ? <div role="alert"><p>{error}</p><button className="analytics-retry" onClick={() => setRetry(n => n + 1)}><RefreshCw size={14}/> Повторить</button></div> : data && <>
      <div className="analytics-kpis"><div><strong>{data.openIssues}</strong><span>открытых обращений</span></div><div><strong>{data.averageHealth ?? "—"}<small>/100</small></strong><span>средняя оценка домов</span></div></div>
      <p className="analytics-coverage">Оценено {data.assessedHouses} из {data.totalHouses} домов. Без данных: {data.unknownHouses}.</p>
      <h3>Состояние домов</h3>
      {data.assessedHouses ? <div className="analytics-chart"><ResponsiveContainer width="100%" height={130}><BarChart data={data.distribution} margin={{left:-28,right:4,top:8,bottom:0}}><XAxis dataKey="label" tick={{fontSize:9,fill:"var(--muted-foreground)"}} interval={0}/><YAxis allowDecimals={false} tick={{fontSize:10,fill:"var(--muted-foreground)"}}/><Tooltip {...tooltip}/><Bar dataKey="count" name="Домов" radius={[4,4,0,0]}>{data.distribution.map(b => <Cell key={b.key} fill={b.color}/>)}</Bar></BarChart></ResponsiveContainer></div> : <p className="analytics-empty">Нет данных для оценки домов.</p>}
      <div className="health-legend"><span><i style={{background:"#ed5e51"}}/>0–49</span><span><i style={{background:"#b78e7d"}}/>50–79</span><span><i style={{background:"#8eb99b"}}/>80–100</span></div>
      <h3>Обращения по категориям</h3>
      {data.categories.some(c => c.count) ? <div className="category-bars">{data.categories.filter(c => c.count).sort((a,b) => b.count-a.count).map(c => <div key={c.key}><span>{c.label}</span><div><i style={{width:`${c.count/Math.max(...data.categories.map(x=>x.count))*100}%`}}/></div><b>{c.count}</b></div>)}</div> : <p className="analytics-empty">Обращений за этот период нет.</p>}
      <div className="status-chips">{data.statuses.map(s => <span key={s.key}>{s.label} <b>{s.count}</b></span>)}</div>
      <h3>Квитанции по месяцам</h3>
      <p className="analytics-subtitle">Среднее начисление на дом, ₽ · демоданные</p>
      {data.bills.length ? <div className="analytics-chart"><ResponsiveContainer width="100%" height={150}><LineChart data={data.bills} margin={{left:-10,right:8,top:12,bottom:0}}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="period" tick={{fontSize:9,fill:"var(--muted-foreground)"}}/><YAxis tick={{fontSize:10,fill:"var(--muted-foreground)"}} width={48}/><Tooltip {...tooltip}/><Line dataKey="average" name="Среднее, ₽" stroke="#8eb99b" strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div> : <p className="analytics-empty">Квитанций за выбранный период нет.</p>}
      {!scene.buildingId && <><h3>Рейтинг районов</h3><p className="analytics-subtitle">По средней оценке домов с данными</p><ol className="district-ranking">{data.ranking.map((r,i) => <li key={r.id}><Link href={districtHref(r.id)}><span className="ranking-number">0{i+1}</span><span>{r.name}<small>Оценено {r.coverage} из {r.houses}</small></span><b>{r.score ?? "—"}</b><ArrowUpRight size={13}/></Link></li>)}</ol></>}
      <details className="analytics-source"><summary>Источники и методика</summary><p>{data.provenance.source}</p><p>{data.provenance.note}</p><p>Расчёт: {new Date(data.provenance.computedAt).toLocaleDateString("ru-RU", { timeZone:"Asia/Vladivostok" })}. Период ограничивает обращения и квитанции; возраст дома учитывается на дату расчёта.</p></details>
    </>}
  </section>;
}
