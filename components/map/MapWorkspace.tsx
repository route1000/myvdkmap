"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Layers } from "lucide-react";
import { LayersPopover } from "./LayersPopover";
import { MapView } from "./MapView";
import { useMap } from "./MapContext";
import { cn } from "@/lib/utils";

const OpenMap = dynamic(() => import("./OpenMap"), { ssr: false });

export function MapWorkspace({ className }: { className?: string }) {
  const [fallback, setFallback] = useState(!process.env.NEXT_PUBLIC_2GIS_KEY);
  const useFallback = useCallback(() => setFallback(true), []);
  const { districts, scene } = useMap();
  const district = districts.find((d) => d.id === scene.districtId);
  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)}>
      {fallback ? <OpenMap /> : <MapView onUnavailable={useFallback} />}
      <div className="map-topline">
        <span>
          <MapPin size={13} className="text-turquoise" />
          {district ? `${district.name} район` : "Владивосток, Приморский край"}
        </span>
        <LayersPopover side="bottom" align="end"><button type="button" className="map-layer-button"><Layers size={16}/> Слои карты</button></LayersPopover>
      </div>
      <div className="map-bottomline" aria-label="Условные обозначения">
        <span>
          <i className="legend-dot bg-turquoise" />
          Жилые комплексы
        </span>
        <span>
          <i className="legend-dot bg-coral" />
          Проблемы жителей
        </span>
        <span>
          <i className="legend-dot bg-work" />
          Городские работы
        </span>
      </div>
      <div className="map-provider-note">
        Мой дом · Владивосток ·{" "}
        {fallback ? "© OpenStreetMap" : "Картография © 2GIS"}
      </div>
    </div>
  );
}
