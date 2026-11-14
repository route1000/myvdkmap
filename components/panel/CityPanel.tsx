"use client";
import Link from "next/link";
import { ArrowUpRight,Map,ArrowRight } from "lucide-react";
import { CityNavLink } from "@/components/map/CityNavLink";
import { DISTRICT_ART } from "@/components/map/district-art";
import { useAtlasManifest } from "@/components/map/atlas-data";
import { useMap } from "@/components/map/MapContext";
import { districtHref } from "@/lib/nav";
export function CityPanel() {
 const meta=useAtlasManifest(),{districts}=useMap();
 return <div className="overview-page"><section className="overview-hero"><div className="overview-copy"><span className="atlas-eyebrow">МОЙ ДОМ / ВЛАДИВОСТОК</span><h1>Город.<br/><span>Ближе к дому.</span></h1><p>Посмотрите, что рядом с вашим адресом.<br/>Узнайте больше о доме и районе.<br/>Начните с карты.</p><CityNavLink href="/#map" className="overview-open"><Map size={17}/> Открыть карту <ArrowUpRight size={19}/></CityNavLink><div className="overview-numbers"><span><strong>{meta?.buildings.toLocaleString('ru-RU')??'65 084'}</strong>здания на карте</span><span><strong>12</strong>показателей рядом</span><span><strong>5</strong>районов города</span></div></div><div className="overview-map-art"><span className="overview-map-coords">43°07′ N<br/>131°54′ E</span><svg viewBox="0 0 420 450" role="img" aria-label="Районы Владивостока">{DISTRICT_ART.map((d,i)=><path key={d.id} d={d.path} fill={`var(--map-art-${i})`} stroke="var(--background)" strokeWidth="2"/>)}</svg><span className="overview-map-caption">Владивосток · Приморский край</span></div></section>
  <section className="overview-services" aria-label="Сервисы"><Link href="/report"><span>01 / ОБРАЩЕНИЯ</span><h2>Помочь своему<br/>дому.</h2><p>Сообщить о проблеме и подготовить обращение.</p><ArrowUpRight size={20}/></Link><Link href="/bill"><span>02 / КВИТАНЦИИ</span><h2>Понять свои<br/>начисления.</h2><p>Разобрать квитанцию и сравнить платежи.</p><ArrowUpRight size={20}/></Link><Link href="/changes"><span>03 / РАБОТЫ</span><h2>Знать, что<br/>меняется.</h2><p>Ремонты и отключения рядом с вами.</p><ArrowUpRight size={20}/></Link></section>
  <section className="overview-districts"><div><span className="atlas-eyebrow">ПЯТЬ РАЙОНОВ / ОДИН ГОРОД</span><h2>Найдите своё место.</h2></div><div>{districts.map(d=><Link key={d.id} href={districtHref(d.id)}><span>{d.name}</span><ArrowRight size={16}/></Link>)}</div></section><footer className="overview-footer"><span>мой дом. / Владивосток</span><p>Геоданные — OpenStreetMap. Индексы — Изнанка.<br/>Обращения и квитанции в примерах — демонстрационные.</p></footer></div>;
}
