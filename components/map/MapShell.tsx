"use client";

// App shell (§5.1): rail / tab bar, the map beside the rail, the panel with search on map pages,
// flow pages (/report, /bill, /changes, /me) as an overlay over the map.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { useFontScale } from "@/components/cabinet/shared";
import { CityHeader } from "./CityHeader";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { CityMapPanel } from "@/components/panel/CityMapPanel";
import { PanelSheet } from "@/components/panel/PanelSheet";
import { useSession } from "@/lib/session";
import { useMap } from "./MapContext";
import { isMapPath, NAV_VT, pageShown, TabBar } from "./Rail";

const PHONE = "(max-width: 767.98px)";
const subscribePhone = (cb: () => void) => {
  const mq = matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

const FLOW_WIDTH = 680;
const subscribeMode = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => { window.removeEventListener("hashchange", cb); window.removeEventListener("popstate", cb); };
};

export function MapShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mapMode = useSyncExternalStore(subscribeMode, () => location.hash === "#map", () => false);
  const dashboard = pathname === "/" && !mapMode;
  // Server and hydration render the desktop layout; phones switch right after hydration (under the splash).
  const mobile = useSyncExternalStore(
    subscribePhone,
    () => matchMedia(PHONE).matches,
    () => false,
  );
  useFontScale();
  useSession(); // loads the session once, so a signed-in cabinet syncs on any page
  // The card stays and a new section fades in. Rail links cross-fade the card in a View Transition instead.
  const pageRef = useRef<HTMLDivElement>(null);
  const shown = useRef(pathname);
  useLayoutEffect(() => {
    if (shown.current === pathname) return;
    shown.current = pathname;
    pageShown();
    if (
      document.documentElement.hasAttribute(NAV_VT) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    pageRef.current?.animate(
      { opacity: [0, 1] },
      { duration: 200, easing: "ease-out" },
    );
  }, [pathname]);
  const page = <div ref={pageRef}>{children}</div>;
  return (
    <>
      <CityHeader mapMode={mapMode} />
      {!dashboard && <MapWorkspace className="bottom-12 md:top-[72px] md:bottom-0 md:left-0" />}
      {dashboard ? <main className="city-dashboard">{page}</main> : isMapPath(pathname) ? (
        <PanelSheet mobile={mobile}>{pathname === "/" ? <CityMapPanel /> : page}</PanelSheet>
      ) : (
        <FlowOverlay mobile={mobile}>{page}</FlowOverlay>
      )}
      <TabBar />
    </>
  );
}

/** Desktop: a wide card right of the rail, the map stays visible beside it. Phone: a full-screen sheet above the tab bar. */
function FlowOverlay({
  mobile,
  children,
}: {
  mobile: boolean;
  children: React.ReactNode;
}) {
  const { setInsets } = useMap();
  useEffect(() => {
    if (!mobile)
      setInsets({
        top: 0,
        right: 0,
        bottom: 40,
        left: Math.min(FLOW_WIDTH, innerWidth - 120) + 32,
      });
  }, [mobile, setInsets]);

  if (mobile)
    return (
      // While the report wizard takes a point (`data-map-pick` on <html>), the sheet steps aside to show the map.
      <section
        aria-label="Раздел"
        className="fixed inset-x-0 top-0 bottom-12 z-20 overflow-y-auto overscroll-contain bg-background animate-in fade-in slide-in-from-bottom-4 duration-200 [[data-map-pick]_&]:invisible"
      >
        {children}
      </section>
    );
  return (
    <div className="pointer-events-none fixed top-[72px] bottom-0 left-0 z-20 flex p-4">
      <section
        aria-label="Раздел"
        style={{ width: `min(${FLOW_WIDTH}px, calc(100vw - 120px))` }}
        className="pointer-events-auto min-h-0 overflow-y-auto overscroll-contain rounded-2xl bg-background shadow-lg ring-1 ring-border animate-in fade-in slide-in-from-left-2 duration-200"
      >
        {children}
      </section>
    </div>
  );
}
