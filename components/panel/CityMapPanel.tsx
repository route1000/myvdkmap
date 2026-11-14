"use client";
import { useState } from "react";
import Link from "next/link";
import { CityNavLink } from "@/components/map/CityNavLink";
import { ArrowLeft, ArrowUpRight, Building2, MapPin } from "lucide-react";
import { useMap, useMapScene } from "@/components/map/MapContext";
import { districtHref } from "@/lib/nav";
import { norm } from "@/lib/utils";
export function CityMapPanel() {
  useMapScene({level: "city"});
  const {districts} = useMap();
  const [filter, setFilter] = useState("");
  const shown = districts.filter(d => norm(d.name).includes(norm(filter)));
  return <div className="map-directory"><CityNavLink href="/#home" className="directory-back"><ArrowLeft size={15}/> На главную</CityNavLink><span className="hero-kicker">ИССЛЕДУЙТЕ ВЛАДИВОСТОК</span><h1>Город.<br />Изнутри.</h1><p>Выберите район или найдите адрес, чтобы узнать больше о доме.</p><label className="district-search"><MapPin size={16}/><input aria-label="Найти район" placeholder="Найти район" value={filter} onChange={e=>setFilter(e.target.value)}/></label><div className="directory-list">{shown.map(d=><Link key={d.id} href={districtHref(d.id)}><Building2 size={23}/><span><strong>{d.name}</strong><small>{d.openIssues} открытых проблем</small></span><ArrowUpRight size={17}/></Link>)}</div>{!shown.length && <p>Район не найден.</p>}<small className="directory-note">Обращения представлены на демонстрационных данных.</small></div>;
}
