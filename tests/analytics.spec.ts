import { expect, test } from "@playwright/test";
test("root opens a map and exposes linked analytics", async ({page}) => {
  await page.route("https://tile.openstreetmap.org/**",r=>r.abort());
  await page.goto("/");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  const panel=page.getByRole("region",{name:"Аналитика карты"});
  await expect(panel).toHaveAttribute("aria-busy","false");
  await expect(panel.getByText("Обращения по категориям")).toBeVisible();
  await panel.getByLabel("Состояние домов на карте").check();
  await expect(page.locator(".leaflet-overlay-pane circle").first()).toBeAttached();
});
test("analytics filters and empty periods preserve clear counts",async({request})=>{
  const city=await request.get("/api/analytics");expect(city.ok()).toBe(true);
  const c=await city.json();expect(c.totalHouses).toBeGreaterThan(0);
  expect(c.assessedHouses+c.unknownHouses).toBe(c.totalHouses);
  const r=await request.get("/api/analytics?house=fregat-2-1");const h=await r.json();expect(h.totalHouses).toBe(1);
  const empty=await request.get("/api/analytics?from=2000-01&to=2000-02");const e=await empty.json();expect(e.openIssues).toBe(0);expect(e.bills).toEqual([]);
  expect((await request.get("/api/analytics?from=2026-13")).status()).toBe(400);
  expect((await request.get("/api/analytics?from=2026-11&to=2026-10")).status()).toBe(400);
  expect((await request.get("/api/analytics?district=missing")).status()).toBe(404);
});
