"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LocateFixed } from "lucide-react";
import type * as Leaflet from "leaflet";
import {
  complexHref,
  districtHref,
  houseHref,
  issueHref,
  workHref,
} from "@/lib/nav";
import { plural } from "@/lib/health";
import { vlDay } from "@/lib/utils";
import { useMap } from "./MapContext";
import { atlasManifest, atlasChunk } from "./atlas-data";
import { visibleChunks, metricColor, type BuildingProperties } from "@/lib/map-data";
import { insideDistrict } from "./shapes";

const CENTER: Leaflet.LatLngExpression = [43.156, 131.955];

/** Keyless map: same district geometry, layers, scene and report picking as 2GIS. */
export default function OpenMap() {
  const state = useMap();
  const router = useRouter();
  const latest = useRef(state); latest.current = state;
  const { resolvedTheme } = useTheme();
  const node = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{
    L: typeof Leaflet;
    map: Leaflet.Map;
  } | null>(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    let live = true;
    let created: Leaflet.Map | undefined;
    import("leaflet").then((L) => {
      if (!live || !node.current) return;
      const map = L.map(node.current, {
        zoomControl: false,
        minZoom: 9,
        maxZoom: 19,
      }).setView(CENTER, 12);
      created = map;
      L.control
        .zoom({
          position: "bottomright",
          zoomInTitle: "Приблизить",
          zoomOutTitle: "Отдалить",
        })
        .addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        if (document.documentElement.dataset.mapPick === undefined) return;
        window.dispatchEvent(
          new CustomEvent("map:click", {
            detail: { lat: e.latlng.lat, lng: e.latlng.lng },
          }),
        );
      });
      setApi({ L, map });
      window.dispatchEvent(new Event("map:ready"));
    });
    return () => {
      live = false;
      created?.remove();
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    api.map.getContainer().classList.toggle("openmap-dark", resolvedTheme === "dark");
    let live=true;let base:Leaflet.GeoJSON|undefined;
    fetch('/geo/inside/base.geojson').then(r=>{if(!r.ok)throw new Error('Base map failed');return r.json();}).then(data=>{
      if(!live)return;const dark=resolvedTheme==='dark';base=api.L.geoJSON(data,{interactive:false,style:f=>({pane:'tilePane',fillOpacity:1,color:f?.properties.kind==='bridge'?(dark?'#85868d':'#b5b7bf'):(dark?'#65666e':'#ffffff'),weight:f?.properties.kind==='road'?.8:1.6,stroke:['road','bridge'].includes(f?.properties.kind),fillColor:f?.properties.kind==='water'?(dark?'#15161a':'#e3e5e9'):(dark?'#25262b':'#f1f2f4')})}).addTo(api.map);
    }).catch(()=>setTileError(true));
    return()=>{live=false;base?.remove();};

  }, [api, resolvedTheme]);

  useEffect(() => {
    if (!api) return;
    const {L,map}=api;const group=L.layerGroup().addTo(map);const renderer=L.canvas({padding:.25}).addTo(map);
    let live=true,turn=0;
    async function draw() {
      const at=++turn;
      try {
        const meta=await atlasManifest();if(!live||at!==turn)return;
        const b=map.getBounds();const queue=visibleChunks(meta.chunks,{west:b.getWest(),south:b.getSouth(),east:b.getEast(),north:b.getNorth()}).slice(0,24);
        group.clearLayers();
        await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{
          for(;;){const c=queue.shift();if(!c)return;const data=await atlasChunk(c.key);if(!live||at!==turn)return;
            L.geoJSON(data,{style:f=>({renderer,color:resolvedTheme==='dark'?'#29292f':'#a6a6b0',weight:.35,fillOpacity:.95,fillColor:metricColor(Number(f?.properties?.[state.metric]??-1),state.metric,resolvedTheme==='dark')}),
              onEachFeature:(f,layer)=>{const p=f.properties as BuildingProperties;const label=document.createElement('span');label.textContent=p.address||'Здание';layer.bindTooltip(label);layer.on('click',()=>{if(document.documentElement.dataset.mapPick===undefined)latest.current.setSelected(p);});}}).addTo(group);
          }
        }));
      } catch { /* The base map and navigation remain available; the data source is retried on a later move. */ }
    }
    draw();map.on('moveend',draw);return()=>{live=false;turn++;map.off('moveend',draw);group.remove();renderer.remove();};
  },[api,state.metric,resolvedTheme]);

  const { districts, shapes, scene, layers, complexes, issues, works, insets, health } =
    state;
  useEffect(() => {
    if (!api) return;
    const { L, map } = api;
    const group = L.layerGroup().addTo(map);
    const picking = () =>
      document.documentElement.dataset.mapPick !== undefined;
    const navigate = (href: string) => {
      if (!picking()) router.push(href);
    };
    const marker = (
      at: { lat: number; lng: number },
      label: string,
      href: string,
      color: string,
      text: string,
    ) => {
      const el = document.createElement("span");
      el.className = "openmap-pin";
      el.style.background = color;
      el.textContent = text;
      const pin = L.marker([at.lat, at.lng], {
        icon: L.divIcon({
          html: el,
          className: "",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: label,
        alt: label,
        keyboard: true,
        bubblingMouseEvents: true,
      }).addTo(group);
      pin.getElement()?.setAttribute("aria-label", label);
      pin.bindTooltip(label, { direction: "top", offset: [0, -12] });
      pin.on("click", () => navigate(href));
    };
    for (const d of districts) {
      const shape = shapes[d.id];
      if (!shape) continue;
      if (shape.feature) {
        const chosen = scene.districtId === d.id;
        const geo = L.geoJSON(shape.feature, {
          style: {
            color: resolvedTheme === "dark" ? "#666672" : "#aaaab4",
            weight: chosen ? 2.5 : 1.5,
            fillColor: "transparent",
            fillOpacity: 0,
          },
        }).addTo(group);
        geo.on("mouseover", () =>
          geo.setStyle({ fillOpacity: 0, weight: 2.5 }),
        );
        geo.on("mouseout", () =>
          geo.setStyle({
            fillOpacity: 0,
            weight: chosen ? 2.5 : 1.5,
          }),
        );
        geo.on("click", () => navigate(districtHref(d.id)));
      }
      if (scene.level !== "city" && scene.districtId === d.id) {
        const el = document.createElement("div");
        el.className = "openmap-label";
        el.style.borderLeft = `3px solid ${d.color}`;
        el.textContent = `${d.name} район`;
        const sub = document.createElement("small");
        sub.textContent = `${d.openIssues} ${plural(d.openIssues, ["открытая проблема", "открытые проблемы", "открытых проблем"])}`;
        el.append(sub);
        L.marker([shape.label[1], shape.label[0]], {
          icon: L.divIcon({
            html: el,
            className: "",
            iconSize: [155, 47],
            iconAnchor: [77, 23],
          }),
          title: `${d.name} район`,
        })
          .on("click", () => navigate(districtHref(d.id)))
          .addTo(group);
      }
    }
    const focus = scene.districtId ? shapes[scene.districtId] : undefined;
    if (focus) {
      if (layers.complexes)
        complexes
          .filter((c) => c.districtId === scene.districtId)
          .forEach((c) =>
            marker(
              c,
              c.name,
              complexHref(c.districtId, c.id),
              "var(--turquoise)",
              "⌂",
            ),
          );
      if (layers.issues)
        issues
          .filter((i) => insideDistrict(focus, i))
          .forEach((i) =>
            marker(i, i.title, issueHref(i.id), "var(--coral)", "!"),
          );
      if (layers.works)
        works.forEach((w) => {
          if (
            w.lat !== null &&
            w.lng !== null &&
            (!w.endDate || vlDay(w.endDate) >= vlDay(Date.now())) &&
            insideDistrict(focus, { lat: w.lat, lng: w.lng })
          )
            marker(
              { lat: w.lat, lng: w.lng },
              w.title,
              workHref(w.id),
              "var(--work)",
              "↗",
            );
        });
    }
    if (layers.health) for (const h of health) {
      const circle = L.circleMarker([h.lat, h.lng], { radius: h.id === scene.buildingId ? 10 : 5, weight: 1, color: "#171717", fillColor: h.level === "good" ? "#8eb99b" : h.level === "warn" ? "#b78e7d" : "#ed5e51", fillOpacity: 0.9 }).addTo(group);
      const label = document.createElement("span"); label.textContent = `${h.address}: ${h.score}/100`;
      circle.bindTooltip(label).on("click", () => navigate(houseHref(h.id)));
    }
    scene.buildings?.forEach((b) =>
      marker(
        b,
        "Открыть паспорт дома",
        houseHref(b.id),
        b.id === scene.buildingId ? "var(--foreground)" : "var(--turquoise)",
        "⌂",
      ),
    );
    return () => {
      group.remove();
    };
  }, [api, districts, shapes, scene, layers, complexes, issues, works, router, health]);

  useEffect(() => {
    if (!api) return;
    const { map } = api;
    const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const options = {
      paddingTopLeft: [insets.left + 25, insets.top + 25] as Leaflet.PointTuple,
      paddingBottomRight: [
        insets.right + 25,
        insets.bottom + 25,
      ] as Leaflet.PointTuple,
      animate,
      duration: 0.6,
    };
    if (scene.level === "city")
      map.fitBounds(
        [
          [43.075, 131.84],
          [43.245, 132.08],
        ],
        options,
      );
    else if (scene.level === "district") {
      const frame = scene.districtId && shapes[scene.districtId]?.frame;
      if (frame)
        map.fitBounds(
          [
            [frame.southWest[1], frame.southWest[0]],
            [frame.northEast[1], frame.northEast[0]],
          ],
          options,
        );
    } else {
      const target =
        scene.focus ??
        complexes.find((c) => c.id === scene.complexId) ??
        scene.buildings?.find((b) => b.id === scene.buildingId);
      if (target) {
        const zoom = scene.level === "house" ? 18 : 16;
        const p = map
          .project([target.lat, target.lng], zoom)
          .subtract([
            (insets.left - insets.right) / 2,
            (insets.top - insets.bottom) / 2,
          ]);
        map.setView(map.unproject(p, zoom), zoom, { animate, duration: 0.6 });
      }
    }
  }, [api, scene, shapes, insets, complexes]);

  return (
    <>
      <div
        ref={node}
        className="absolute inset-0 z-0"
        aria-label="Интерактивная карта Владивостока"
      />
      <button
        className="map-home"
        title="Показать весь город"
        aria-label="Показать весь город"
        onClick={() => {
          api?.map.fitBounds([[43.075, 131.84], [43.245, 132.08]], {
            paddingTopLeft: [insets.left + 25, insets.top + 25],
            paddingBottomRight: [insets.right + 25, insets.bottom + 25],
            animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
          });
          router.push("/#map");
        }}
      >
        <LocateFixed size={20} />
      </button>
      {tileError && (
        <p className="map-status" role="status">
          Не удалось загрузить часть карты. Районы и объекты доступны; проверьте
          подключение к интернету.
        </p>
      )}
    </>
  );
}
