import { expect,test } from "@playwright/test";
test.beforeEach(async({page})=>{
 await page.route('https://basemaps.cartocdn.com/**',r=>r.abort());
 await page.route('https://s3.amazonaws.com/elevation-tiles-prod/**',r=>r.abort());
});
test('map opens with compact controls and no analytics drawer',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('region',{name:'Индекс на карте'})).toBeVisible();
 await expect(page.getByRole('complementary',{name:'Подробная аналитика'})).toHaveCount(0);
 await page.getByRole('button',{name:'Открыть подробную аналитику'}).click();
 await expect(page.getByRole('complementary',{name:'Подробная аналитика'})).toBeVisible();
 await page.getByRole('button',{name:'Закрыть аналитику'}).click();
 await expect(page.getByRole('complementary',{name:'Подробная аналитика'})).toHaveCount(0);
});
test('keyboard address search opens a passport and survives reload',async({page})=>{
 await page.goto('/');const search=page.getByRole('combobox');await search.fill('Нейбута 2А');
 await expect(page.getByRole('option').first()).toBeVisible();await expect(search).toHaveAttribute('aria-busy','false');
 await search.press('ArrowDown');await search.press('Enter');await expect(page).toHaveURL(/\/house\//);
 const url=page.url();await expect(page.getByRole('heading',{name:/Нейбута/}).first()).toBeVisible();
 await page.reload();await expect(page).toHaveURL(url);await expect(page.getByRole('heading',{name:/Нейбута/}).first()).toBeVisible();
});
test('old search results cannot be selected during a new request',async({page})=>{
 await page.route('**/api/search?*',async r=>{if(new URL(r.request().url()).searchParams.get('q')==='Медленный')await new Promise(done=>setTimeout(done,900));await r.continue();});
 await page.goto('/');const input=page.getByRole('combobox');await input.fill('Нейбута');await expect(page.getByRole('option').first()).toBeVisible();
 await input.fill('Медленный');await input.press('Enter');await expect(page).toHaveURL('/');await expect(page.getByRole('option')).toHaveCount(0);
});
test('overview gives a direct route to the map',async({page})=>{
 await page.goto('/#home');await expect(page.getByRole('heading',{name:/Ближе к дому/})).toBeVisible();
 await page.getByRole('link',{name:'Открыть карту',exact:true}).click();await expect(page).toHaveURL(/#map$/);
 await expect(page.getByRole('region',{name:'Индекс на карте'})).toBeVisible();
});
for(const width of [375,768,1440])test(`controls fit ${width}px and services remain reachable`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Открыть сервисы'}).click();await page.getByRole('link',{name:'Разобрать квитанцию',exact:true}).click();
 await expect(page).toHaveURL('/bill');await expect(page.getByRole('button',{name:'Пример квитанции'})).toBeVisible();
});
test('demo receipt can be analysed and saved',async({page})=>{
 await page.goto('/bill');await page.getByRole('button',{name:'Пример квитанции'}).click();
 const save=page.getByRole('button',{name:/Сохранить в кабинет/});await expect(save).toBeEnabled();await save.click();
 await expect(page.getByText('Квитанция сохранена в кабинете',{exact:true})).toBeVisible();
});
test('report wizard prepares an appeal without sending it externally',async({page})=>{
 await page.goto('/report?building=fregat-2-1');await page.getByRole('button',{name:'Пример фото'}).click();await page.getByRole('button',{name:'Дальше',exact:true}).click();
 await page.getByRole('textbox',{name:'Описание проблемы'}).fill('Большая яма на дороге у въезда во двор');await page.getByRole('button',{name:'Дальше',exact:true}).click();
 await page.getByRole('button',{name:/Этот дом: ул. Нейбута/}).click();await page.getByRole('button',{name:'Получить результат'}).click();
 await expect(page.getByRole('heading',{name:'Текст обращения'})).toBeVisible();
});
test('section links reload and cross-site writes remain blocked',async({page,request})=>{
 for(const path of ['/bill','/changes','/me']){await page.goto(path);await page.reload();await expect(page).toHaveURL(path);}
 const r=await request.post('/api/issues',{headers:{'sec-fetch-site':'cross-site'},data:{}});expect(r.status()).toBe(403);
});
