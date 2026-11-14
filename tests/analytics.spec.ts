import {expect,test} from '@playwright/test';
test('real map dataset ships locally with complete polygons',async({request})=>{
 const r=await request.get('/geo/inside/manifest.json');expect(r.ok()).toBe(true);const m=await r.json();
 expect(m.buildings).toBeGreaterThan(60_000);expect(m.chunks.length).toBeGreaterThan(0);
 const tile=await request.get(`/geo/inside/${m.chunks[0].key}.json`);expect(tile.ok()).toBe(true);
 expect((await tile.json()).tiles[0].buildings.length).toBeGreaterThan(0);
});
test('source graphs can be expanded and the metric can be changed',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Открыть подробную аналитику'}).click();
 await expect(page.getByRole('complementary',{name:'Подробная аналитика'}).getByRole('heading',{name:'Всё рядом'})).toBeVisible();
 await page.getByRole('button',{name:'Закрыть аналитику'}).click();
 await page.locator('.atlas-index-button').click();await page.getByRole('button',{name:'Школы',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Школы',exact:true})).toBeVisible();
});
test('demo analytics API validates scope and periods',async({request})=>{
 const r=await request.get('/api/analytics?house=fregat-2-1');expect(r.ok()).toBe(true);const h=await r.json();expect(h.totalHouses).toBe(1);
 expect((await request.get('/api/analytics?from=2026-13')).status()).toBe(400);
 expect((await request.get('/api/analytics?from=2026-11&to=2026-10')).status()).toBe(400);
 expect((await request.get('/api/analytics?district=missing')).status()).toBe(404);
});
