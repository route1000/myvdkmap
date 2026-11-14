import { expect, test } from "@playwright/test";

// Keep browser checks independent of the map vendor, API key and external network.
test.beforeEach(async ({ page }) => {
  await page.route("https://mapgl.2gis.com/**", (route) => route.abort());
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
});

test("fallback map keeps districts navigable when the vendor is unavailable", async ({
  page,
}) => {
  await page.goto("/#map");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".openmap-label")).toHaveCount(5);
  await page.getByLabel("Найти район", { exact: true }).fill("Ленин");
  await expect(page.locator(".directory-list a")).toHaveCount(1);
  await page.locator(".directory-list a").click();
  await expect(
    page.getByRole("heading", { name: "Ленинский район" }),
  ).toBeVisible();
});

test("keyboard search navigates to a house and reload preserves its address", async ({
  page,
}) => {
  await page.goto("/#home");
  const search = page.getByRole("combobox");
  await search.fill("Нейбута 2А");
  await expect(page.getByRole("option").first()).toBeVisible();
  await expect(search).toHaveAttribute("aria-busy", "false");
  await search.press("ArrowDown");
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    "map-search-option-1",
  );
  await search.press("Enter");
  await expect(page).toHaveURL(/\/house\//);
  const url = page.url();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Нейбута",
  );
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Нейбута",
  );
});

test("old search results cannot be selected while the new request is pending", async ({
  page,
}) => {
  await page.route("**/api/search?*", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q");
    if (query === "Медленный")
      await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto("/#home");
  const search = page.getByRole("combobox");
  await search.fill("Нейбута");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.fill("Медленный");
  await search.press("Enter");
  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(
    page.getByText("Ничего не нашлось.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Очистить", exact: true }).click();
  await expect(search).toHaveAttribute("aria-busy", "false");
});

test("demo bill can be analysed and saved in the cabinet", async ({ page }) => {
  await page.goto("/bill");
  await page.getByRole("button", { name: "Пример квитанции" }).click();
  const save = page.getByRole("button", { name: /Сохранить в кабинет/ });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(
    page.getByText("Квитанция сохранена в кабинете", { exact: true }),
  ).toBeVisible();
});

for (const width of [375, 768]) {
  test(`workspace fits ${width}px and its panel is usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#map");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const panel = page.getByRole("region", { name: "Панель", exact: true });
    await expect(panel).toBeVisible();
    if (width < 768) {
      await page
        .getByRole("button", { name: "Развернуть панель" })
        .press("Enter");
      await expect(
        page.getByRole("heading", { name: "Город.Изнутри." }),
      ).toBeVisible();
    }
  });
}

test("a report from a house produces an appeal without submitting it", async ({ page }) => {
  await page.goto("/report?building=fregat-2-1");
  await page.getByRole("button", { name: "Пример фото" }).click();
  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page.getByRole("textbox", { name: "Описание проблемы" }).fill("Большая яма на дороге у въезда во двор, машины бьют колёса");
  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Где это?" })).toBeVisible();
  await page.getByRole("button", { name: /Этот дом: ул. Нейбута/ }).click();
  await page.getByRole("button", { name: "Получить результат" }).click();
  await expect(page.getByRole("heading", { name: "Текст обращения" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Сохранить на карте" })).toBeEnabled();
});

test("direct section links reload correctly and cross-site API writes stay blocked", async ({ page, request }) => {
  for (const path of ["/bill", "/changes", "/me"]) {
    await page.goto(path);
    await expect(page).toHaveURL(path);
    await page.reload();
    await expect(page).toHaveURL(path);
  }
  const response = await request.post("/api/issues", {
    headers: { "sec-fetch-site": "cross-site" },
    data: {},
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: "Запрос с другого сайта отклонён" });
});


test("dashboard opens map mode and returns to the home screen", async ({page}) => {
  await page.goto("/#home");
  await expect(page.getByRole("heading", {level:1})).toContainText("ГОРОД.");
  await page.getByRole("link", {name: "Открыть карту", exact:true}).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.getByRole("heading", {level:1})).toContainText("Город.");
  await page.getByRole("link", {name: "На главную", exact:true}).click();
  await expect(page.getByRole("heading", {level:1})).toContainText("ГОРОД.");
});

test("district discovery handles empty filters and can recover", async ({page}) => {
  await page.goto("/#home");
  await page.getByRole("textbox", {name:"Найти район", exact:true}).fill("неизвестный");
  await expect(page.getByText("Такого района не нашли.", {exact:false})).toBeVisible();
  await page.getByRole("button", {name:"Показать все районы", exact:true}).click();
  await expect(page.locator(".district-card")).toHaveCount(5);
});


test("interactive city explorer selects a district and links to its page", async ({page}) => {
  await page.goto("/#home");
  await page.getByRole("group", {name:"Выбор района"}).getByRole("button", {name:"Советский",exact:true}).click();
  const selected = page.locator(".explorer-detail");
  await expect(selected.getByRole("link")).toContainText("Советский");
  await selected.getByRole("link").click();
  await expect(page).toHaveURL(/\/d\/sovetsky/);
});

test("motion can be paused without hiding the content", async ({page}) => {
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/#home");
  await page.getByRole("button", {name:"Остановить анимации",exact:true}).click();
  await expect(page.getByRole("button", {name:"Включить анимации",exact:true})).toHaveAttribute("aria-pressed","false");
  await expect(page.getByRole("heading", {level:1})).toBeVisible();
});
