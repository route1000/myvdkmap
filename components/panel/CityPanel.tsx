"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CityExplorer } from "@/components/map/CityExplorer";
import { Pause, Play, ArrowDown, ArrowUpRight, ArrowRight, Construction, Heart, MapPin, ReceiptRussianRuble, TriangleAlert } from "lucide-react";
import { CityNavLink } from "@/components/map/CityNavLink";
import { useMap, useMapScene } from "@/components/map/MapContext";
import { SearchBox, SEARCH_INPUT_ID } from "@/components/search/SearchBox";
import { useCabinet, useHouseSummaries } from "@/components/cabinet/shared";
import { districtHref, houseHref } from "@/lib/nav";
import { norm } from "@/lib/utils";

const services = [
  { href: "/report", title: "Сообщить о проблеме", hint: "Подготовить обращение", Icon: TriangleAlert },
  { href: "/bill", title: "Разобрать квитанцию", hint: "Понять начисления", Icon: ReceiptRussianRuble },
  { href: "/changes", title: "Посмотреть работы", hint: "Узнать, что меняется рядом", Icon: Construction },
];

export function CityPanel() {
  useMapScene({ level: "city" });
  const { districts, complexes } = useMap();
  const reduceMotion = useReducedMotion();
  const [motionEnabled, setMotionEnabled] = useState(true);
  const moving = motionEnabled && !reduceMotion;
  const { houses } = useCabinet();
  const summaries = useHouseSummaries(houses.slice(0, 1));
  const home = summaries?.[0];
  const [filter, setFilter] = useState("");
  const shown = districts.filter(d => norm(d.name).includes(norm(filter)));

  function focusSearch() {
    const input = document.getElementById(SEARCH_INPUT_ID);
    input?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    input?.focus({ preventScroll: true });
  }

  return (
    <div className={`dashboard-content motion-home ${moving ? "motion-on" : "motion-off"}`}>
      <section className="dashboard-hero" aria-labelledby="home-title">
        <div className="hero-meta">
          <span>ВЛАДИВОСТОК / ГОРОДСКОЙ ПОМОЩНИК</span>
          <button className="motion-toggle" type="button" aria-pressed={moving} disabled={!!reduceMotion} onClick={() => setMotionEnabled(v => !v)} aria-label={reduceMotion ? "Движение отключено настройками устройства" : moving ? "Остановить анимации" : "Включить анимации"}>{moving ? <Pause size={12} /> : <Play size={12} />}{reduceMotion ? "БЕЗ ДВИЖЕНИЯ" : moving ? "ДВИЖЕНИЕ ВКЛ." : "ДВИЖЕНИЕ ВЫКЛ."}</button>
        </div>
        <div className="hero-stage">
        <div className="hero-copy">
          <span className="hero-edition">ТВОЙ АДРЕС — ТОЧКА ОТСЧЁТА</span>
          <h1 id="home-title">ГОРОД.<br /><span>БЛИЖЕ<span className="hero-dot">.</span></span></h1>
          <p>Находи своё. Меняй то, что рядом.<br />Чувствуй город, в котором живёшь.</p>
          <div className="home-search">
            <label htmlFor={SEARCH_INPUT_ID}>Начните с вашего адреса</label>
            <SearchBox />
          </div>
          <div className="hero-links">
            <CityNavLink href="/#map">Открыть карту <ArrowUpRight size={18} /></CityNavLink>
            <a href="#districts">Выбрать район <ArrowDown size={16} /></a>
          </div>
          <div className="hero-proof"><span><strong>{districts.length}</strong> районов</span><span><strong>{complexes.length}</strong> жилых комплексов</span><span className="hero-proof-note">Одна точка входа</span></div>
        </div>
        <CityExplorer moving={moving} />
        </div>
      </section>
      <div className="city-marquee" aria-hidden="true"><div>{[0,1].map(i => <span key={i}>ТВОЙ ДОМ <b>↗</b> ТВОЙ РАЙОН <b>✳</b> ТВОЙ ВЛАДИВОСТОК <b>↗</b> </span>)}</div></div>

      <motion.section initial={false} whileInView={moving ? { opacity: [.4, 1], y: [20, 0] } : undefined} viewport={{ once: true, amount: .15 }} transition={{ duration: .55 }} className="service-grid" aria-label="Быстрые действия">
        {services.map(({ href, title, hint, Icon }, i) => (
          <Link key={href} href={href} className="service-card" style={{ "--reveal-delay": `${100 + i * 70}ms` } as React.CSSProperties}>
            <span className="service-top"><Icon size={25} /><span>0{i + 1} / ДЕЙСТВУЙ</span></span>
            <h2>{title}</h2>
            <span className="service-bottom"><span>{hint}</span><ArrowUpRight size={20} /></span>
          </Link>
        ))}
      </motion.section>

      <section className="saved-home" aria-label="Мой дом">
        <Heart size={21} />
        <div><span className="mini-label">МОЙ ДОМ</span><p>{home ? home.address : "Ваш адрес — всегда под рукой."}</p></div>
        {home ? <Link href={houseHref(home.id)}>Открыть <ArrowRight size={18} /></Link> : <button type="button" onClick={focusSearch}>Найти дом <ArrowRight size={18} /></button>}
      </section>

      <motion.section initial={false} whileInView={moving ? { opacity: [.4, 1], y: [20, 0] } : undefined} viewport={{ once: true, amount: .15 }} transition={{ duration: .55 }} className="dashboard-districts" id="districts" aria-labelledby="districts-title">
        <div className="dashboard-section-title">
          <h2 id="districts-title">НАЙДИ СВОЙ<br /><span>ВЛАДИВОСТОК ↗</span></h2>
          <label className="district-search"><MapPin size={16} /><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Найти район" aria-label="Найти район" />{filter && <button type="button" aria-label="Сбросить фильтр районов" onClick={() => setFilter("")}>×</button>}</label>
        </div>
        <div className="district-card-grid">
          {shown.map(d => (
            <Link className="district-card" key={d.id} href={districtHref(d.id)}>
              <span className="district-number">0{districts.indexOf(d) + 1}</span>
              <h3>{d.name}</h3>
              <span className="district-detail">{d.openIssues} открытых проблем</span>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
        {!shown.length && <div className="dashboard-empty"><p>Такого района не нашли. Попробуйте другое название.</p><button type="button" onClick={() => setFilter("")}>Показать все районы <ArrowRight size={16} /></button></div>}
      </motion.section>

      <footer className="dashboard-footer"><span>МОЙ ДОМ / ВЛАДИВОСТОК</span><p>Демонстрационная версия.<br />Обращения и данные УК — примеры.</p></footer>
    </div>
  );
}
