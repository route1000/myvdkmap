"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";
import { useMap } from "./MapContext";
import { DISTRICT_ART } from "./district-art";
import { districtHref } from "@/lib/nav";

export function CityExplorer({ moving }: { moving: boolean }) {
  const { districts } = useMap();
  const [activeId, setActiveId] = useState("leninsky");
  const active = districts.find(d => d.id === activeId) ?? districts[0];
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(pointerX, { stiffness: 95, damping: 24 });
  const rotateX = useSpring(pointerY, { stiffness: 95, damping: 24 });

  function followPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!moving || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - box.left) / box.width - .5) * 12);
    pointerY.set(-((event.clientY - box.top) / box.height - .5) * 10);
  }

  return (
    <div className="city-explorer" onPointerMove={followPointer} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
      <div className="explorer-top"><span><i /> ИССЛЕДУЙ ГОРОД</span><Compass size={21} /></div>
      <div className="explorer-scene">
        <div className="explorer-orbit orbit-one" aria-hidden="true" />
        <div className="explorer-orbit orbit-two" aria-hidden="true" />
        <div className="explorer-sweep" aria-hidden="true" />
        <motion.div className="explorer-model" style={{ rotateX: moving ? rotateX : 0, rotateY: moving ? rotateY : 0 }}>
          <svg viewBox="0 0 520 490" className="district-sculpture" aria-label="Интерактивная схема районов Владивостока">
            <g className="district-depth" transform="translate(0 13)" aria-hidden="true">
              {DISTRICT_ART.map(d => <path key={d.id} d={d.path} />)}
            </g>
            {DISTRICT_ART.map((shape, i) => {
              const district = districts.find(d => d.id === shape.id);
              return <path key={shape.id} d={shape.path} className={`sculpture-piece ${activeId === shape.id ? "is-selected" : ""}`} style={{ "--piece-index": i } as React.CSSProperties} role="button" tabIndex={0} aria-label={`Выбрать ${district?.name ?? shape.id} район`} aria-pressed={activeId === shape.id} onClick={() => setActiveId(shape.id)} onFocus={() => setActiveId(shape.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveId(shape.id); } }} />;
            })}
          </svg>
        </motion.div>
        <span className="explorer-watermark" aria-hidden="true">VDK</span>
        <span className="explorer-coordinate">43.1155° N<br />131.8855° E</span>
        <span className="explorer-scheme-label">СХЕМА РАЙОНОВ ↗</span>
      </div>
      <div className="explorer-picker" role="group" aria-label="Выбор района">
        {districts.map((d, i) => <button type="button" key={d.id} aria-pressed={activeId === d.id} aria-label={d.name} onClick={() => setActiveId(d.id)}><span>0{i + 1}</span><span>{d.name}</span></button>)}
      </div>
      {active && <div className="explorer-detail" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active.id} initial={moving ? { opacity: 0, y: 7 } : false} animate={{ opacity: 1, y: 0 }} exit={moving ? { opacity: 0, y: -7 } : undefined} transition={{ duration: .15 }} className="explorer-detail-content">
            <span><MapPin size={15} /> ВЫБРАННЫЙ РАЙОН</span>
            <Link href={districtHref(active.id)} className="explorer-district-link"><strong>{active.name}</strong><ArrowUpRight size={24} /></Link>
            <p>{active.population.toLocaleString("ru-RU")} жителей · {active.openIssues} проблем в демоданных</p>
          </motion.div>
        </AnimatePresence>
      </div>}
    </div>
  );
}
