// @ts-check
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const FLAGSHIP = "/lessons/lesson-b2-job-followup/";
const LESSONS = [
  "/lessons/lesson-01/",
  "/lessons/lesson-a2-doctor/",
  "/lessons/lesson-b1-bolig/",
  "/lessons/lesson-b1-borgerservice/",
  FLAGSHIP,
  "/lessons/lesson-b2-ordstilling/",
  "/lessons/lesson-b2-radiator/"
];
const TODAY = "/dashboard.html";
const DEMO = "/dashboard.html?demo=learner";

function collectRuntimeProblems(page) {
  const problems = [];
  page.on("pageerror", error => problems.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("response", response => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
  });
  return problems;
}

async function assertNoCriticalAxe(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(serious, `${label} axe critical/serious:\n${JSON.stringify(serious, null, 2)}`).toEqual([]);
}

async function assertNoHorizontalOverflow(page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(scrollWidth, `horizontal overflow: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`).toBeLessThanOrEqual(clientWidth + 1);
}

test.describe("public pages smoke", () => {
  test("home shows flagship situation CTA", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto("./");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#home-primary-action")).toBeVisible();
    await expect(page.locator("#home-primary-action")).toHaveAttribute("href", /lesson-b2-job-followup/);
    await expect(page.getByText("One situation. One precise correction. Then try again.")).toBeVisible();
    await expect(page.locator(".product-loop")).toBeVisible();
    await expect(page.locator(".home-next-panel")).toBeVisible();
    const customLesson = page.locator("#create-your-lesson");
    await expect(customLesson).toBeVisible();
    await expect(customLesson).toContainText("No forms, JSON, or lesson-design vocabulary.");
    await expect(customLesson.getByRole("link", { name: "Read the simple guide" })).toHaveAttribute("href", "./factory.html");
    await expect(customLesson.getByRole("link", { name: "Give the repository to an agent" })).toHaveAttribute("href", /github\.com\/lamapony\/plata-trainers/);
    await expect(customLesson).toContainText("the website is where you practise");
    const library = page.locator(".library-disclosure").first();
    await expect(library).not.toHaveAttribute("open", "");
    await expect(page.locator("#narrative-gallery")).not.toBeVisible();
    await library.locator(":scope > summary").click();
    await expect(page.locator("#narrative-gallery")).toBeVisible();
    await assertNoCriticalAxe(page, "home");
    expect(runtimeProblems, "home runtime failures").toEqual([]);
  });

  test("flagship lesson loads and exposes scenes", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto(FLAGSHIP);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(40);
    await assertNoCriticalAxe(page, "flagship lesson");
    expect(runtimeProblems, "flagship runtime failures").toEqual([]);
  });

  test("every lesson loads cleanly on a phone-sized screen", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of LESSONS) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
    expect(runtimeProblems, "lesson library runtime failures").toEqual([]);
  });

  test("Today first-run dashboard renders primary route", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto(TODAY);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#today-program")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#due")).toBeHidden();
    await expect(page.locator("#overview > details")).not.toHaveAttribute("open", "");
    await assertNoCriticalAxe(page, "today first-run");
    expect(runtimeProblems, "Today runtime failures").toEqual([]);
  });

  test("demo learner route stays read-only and shows Today", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto(DEMO);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#today-program")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/demo/i);
    await assertNoCriticalAxe(page, "demo learner");
    expect(runtimeProblems, "demo runtime failures").toEqual([]);
  });

  test("reviewer pages state product boundaries and reveal deep-linked evidence", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.goto("./program.html");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("What Platå is — and what it is not.")).toBeVisible();
    await expect(page.getByText("Teach the whole language from the beginning.")).toBeVisible();
    await expect(page.locator(".program-pillars")).toHaveCSS("display", "grid");
    await expect(page.locator(".program-pillar").first()).toHaveCSS("border-top-style", "solid");
    await expect(page.locator(".technical-disclosure")).not.toHaveAttribute("open", "");

    await page.goto("./proof.html#proof-capability-title");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#proof-capability-title")).toBeVisible();
    await expect(page.locator("#proof-capability-title").locator("xpath=ancestor::details[1]")).toHaveAttribute("open", "");
    await assertNoCriticalAxe(page, "reviewer proof");
    expect(runtimeProblems, "reviewer runtime failures").toEqual([]);
  });

  test("360px viewports do not scroll horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["./", FLAGSHIP, TODAY, DEMO, "./program.html", "./proof.html", "./quality.html"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await assertNoHorizontalOverflow(page);
    }
  });
});

test.describe("repair path e2e", () => {
  test("closing-pushy miss opens register deadline repair", async ({ page }) => {
    await page.goto(`${FLAGSHIP}?mode=repair&signal=consequence-aware-tone#email-closing`);
    await page.waitForLoadState("domcontentloaded");

    const pushy = page.getByRole("button", {
      name: /jeg forventer derfor.*senest i morgen/i
    });
    await expect(pushy).toBeVisible();
    await pushy.click();

    const registerLink = page.locator('a[href*="register-drill"]').first();
    await expect(registerLink).toBeVisible({ timeout: 15_000 });
    const href = await registerLink.getAttribute("href");
    expect(href || "").toMatch(/register-drill/);
    expect(href || "").toMatch(/signal=/);

    await registerLink.click();
    await expect(page).toHaveURL(/register-drill/);
    await expect(page.locator("body")).toContainText(/register|deadline|tone|skriv/i);
  });
});

test.describe("chromium visual baselines", () => {
  // System font stack makes pixel baselines OS-specific. Enable locally with
  // PLATA_VISUAL=1 (and refresh via --update-snapshots). Not part of default CI gate.
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(process.env.PLATA_VISUAL !== "1", "set PLATA_VISUAL=1 to run Chromium visual baselines");
    test.skip(browserName !== "chromium", "visual snapshots are Chromium-only");
    test.skip(!testInfo.project.name.includes("desktop"), "desktop Chromium only");
  });

  test("landing screenshot", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveScreenshot("landing.png", { fullPage: false });
  });

  test("flagship lesson screenshot", async ({ page }) => {
    await page.goto(FLAGSHIP);
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("flagship-lesson.png", { fullPage: false });
  });

  test("first-run Today screenshot", async ({ page }) => {
    await page.goto(TODAY);
    await expect(page.locator("#today-program")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveScreenshot("today-firstrun.png", { fullPage: false });
  });

  test("demo receipt-ish Today screenshot", async ({ page }) => {
    await page.goto(DEMO);
    await expect(page.locator("#today-program")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveScreenshot("today-demo-receipt.png", { fullPage: false });
  });
});
