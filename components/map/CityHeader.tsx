"use client";
import Link from "next/link";
import { useState } from "react";
import { Layers, Menu, UserRound, Map, ArrowUpRight } from "lucide-react";
import { CityNavLink } from "./CityNavLink";
import { SearchBox } from "@/components/search/SearchBox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import { LayersPopover } from "./LayersPopover";
import { MetricMenu } from "./AtlasHUD";
import { useMap } from "./MapContext";
export function CityHeader({mapMode=false}:{mapMode?:boolean}) {
 const {setAnalyticsOpen}=useMap(); const [menu,setMenu]=useState(false);
 return <header className={`atlas-header ${mapMode?'':'is-overview'}`}>
  <div className="atlas-header-left"><CityNavLink className="atlas-brand" href="/" aria-label="Мой дом — карта"><span className="atlas-brand-mark">м.</span><span>мой дом<small>ВЛАДИВОСТОК</small></span></CityNavLink>{mapMode&&<SearchBox className="atlas-header-search"/>}</div>
  <nav className="atlas-header-right" aria-label="Главное меню">{mapMode?<><MetricMenu/><LayersPopover side="bottom" align="end"><button className="atlas-tool atlas-square" aria-label="Слои карты"><Layers size={17}/></button></LayersPopover></>:<CityNavLink href="/#map" className="atlas-tool"><Map size={16}/> Карта <ArrowUpRight size={14}/></CityNavLink>}
   <Popover open={menu} onOpenChange={setMenu}><PopoverTrigger asChild><button className="atlas-tool atlas-square" aria-label="Открыть сервисы"><Menu size={18}/></button></PopoverTrigger><PopoverContent align="end" className="atlas-menu w-60" onClick={()=>setMenu(false)}><p>Мой дом · Владивосток</p><CityNavLink href="/#home">О проекте</CityNavLink><CityNavLink href="/#map">Карта города</CityNavLink><button onClick={()=>setAnalyticsOpen(true)}>Аналитика</button><Link href="/report">Сообщить о проблеме</Link><Link href="/bill">Разобрать квитанцию</Link><Link href="/changes">Работы и отключения</Link><Link href="/me">Мои дома и кабинет</Link></PopoverContent></Popover>
   <ThemeToggle className="atlas-tool atlas-square"/><Link href="/me" aria-label="Личный кабинет" className="atlas-tool atlas-square"><UserRound size={18}/></Link>
  </nav>
 </header>;
}
