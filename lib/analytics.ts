import { computeHealth } from "./health";
import { ISSUE_CATEGORY_LABELS, ISSUE_STATUS_LABELS } from "./types";

export interface AnalyticsHouse {
  id: string; address: string; lat: number; lng: number; yearBuilt: number | null; isDemo: boolean;
  microdistrict: { districtId: string };
  issues: { category: string; status: string; severity: number; createdAt: Date | string }[];
  bills: { period: string; total: number }[];
}
export function periodStart(month: string, next = false) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + (next ? 1 : 0), 1) - 10 * 3_600_000);
}
export function aggregateAnalytics(houses: AnalyticsHouse[], now = new Date(), extraIssues: AnalyticsHouse["issues"] = []) {
  const issues = [...houses.flatMap(h => h.issues), ...extraIssues];
  // An empty incident register alone does not establish that an OSM house is healthy.
  const known = houses.filter(h => h.yearBuilt !== null || h.issues.length > 0);
  const health = known.map(h => ({ id: h.id, address: h.address, lat: h.lat, lng: h.lng,
    districtId: h.microdistrict.districtId, ...computeHealth(h, now), isDemo: h.isDemo }));
  const categories = Object.entries(ISSUE_CATEGORY_LABELS).map(([key, label]) => ({ key, label, count: issues.filter(i => i.category === key).length }));
  const statuses = Object.entries(ISSUE_STATUS_LABELS).map(([key, label]) => ({ key, label, count: issues.filter(i => i.status === key).length }));
  const distribution = [
    { key: "bad", label: "Нужно внимание", color: "#ed5e51" },
    { key: "warn", label: "Есть проблемы", color: "#b78e7d" },
    { key: "good", label: "Всё хорошо", color: "#8eb99b" },
  ].map(bin => ({ ...bin, count: health.filter(h => h.level === bin.key).length }));
  const periods = new Map<string, { total: number; houses: Set<string> }>();
  for (const h of houses) for (const bill of h.bills) {
    const p = periods.get(bill.period) ?? { total: 0, houses: new Set<string>() };
    p.total += bill.total; p.houses.add(h.id); periods.set(bill.period, p);
  }
  const bills = [...periods].sort(([a], [b]) => a.localeCompare(b)).map(([period, p]) => ({ period,
    total: Math.round(p.total * 100) / 100, houses: p.houses.size,
    average: Math.round(p.total / p.houses.size * 100) / 100 }));
  return { totalHouses: houses.length, assessedHouses: known.length, unknownHouses: houses.length - known.length,
    openIssues: issues.filter(i => i.status !== "resolved").length,
    averageHealth: health.length ? Math.round(health.reduce((n, h) => n + h.score, 0) / health.length) : null,
    categories, statuses, distribution, bills, health,
    provenance: { computedAt: now.toISOString(),
      demoHouses: houses.filter(h => h.isDemo).length,
      note: "Оценка по обращениям и возрасту дома, не техническое обследование. Начисления — демонстрационные." } };
}
export type AnalyticsDTO = ReturnType<typeof aggregateAnalytics> & {
  ranking: { id: string; name: string; score: number | null; coverage: number; houses: number; openIssues: number }[];
};
