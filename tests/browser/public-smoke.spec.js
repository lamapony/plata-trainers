// @ts-check
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { makeWav } = require("../../scripts/lib/audio-providers/mock");

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

function browserAudioManifest(overrides) {
  const source = `data:audio/wav;base64,${makeWav(4).toString("base64")}`;
  return {
    schemaVersion: 1,
    lessonId: "lesson-b2-job-followup",
    locale: "da-DK",
    disclosure: "AI-generated Danish voice",
    clips: [
      {
        utteranceId: "silence-pressure-recruiter",
        text: "Vi regner med at give besked senest tirsdag.",
        spokenText: "Vi regner med at give besked senest tirsdag.",
        src: overrides && overrides.dialogueSrc || source,
        provider: "openai"
      },
      {
        utteranceId: "silence-pressure-model",
        text: "Skriv en kort opfølgning i dag og henvis roligt til den tidsplan, de nævnte.",
        spokenText: "Skriv en kort opfølgning i dag og henvis roligt til den tidsplan, de nævnte.",
        src: source,
        provider: "openai"
      }
    ]
  };
}

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

async function completeFlagshipProfessionalPath(page) {
  await page.goto(FLAGSHIP);
  await page.waitForLoadState("domcontentloaded");

  for (let index = 0; index < 4; index += 1) {
    await page.locator(".choice-card").first().click();
    await expect(page.locator("#feedback")).toHaveClass(/\bok\b/);
    await page.locator("#next").click();
  }

  await page.locator("#name").fill("tak for beskeden; jeg kan tale i morgen klokken 10");
  await page.locator("#complete").click();
  await expect(page.locator("#feedback")).toHaveClass(/\bok\b/);
  await page.locator("#next").click();

  await page.locator(".choice-card").first().click();
  await expect(page.locator("#feedback")).toHaveClass(/\bok\b/);
  await page.locator("#next").click();
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
    await expect(page.locator(".story-layout")).toBeVisible();
    await expect(page.locator(".story-sidebar")).toContainText("Follow up after a job interview");
    await expect(page.locator("#route")).toBeVisible();
    await expect(page.locator(".route-step")).toHaveCount(6);
    await expect(page.locator('.route-step[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator("#scene-count")).toHaveText("Scene 1 of 6");
    await expect(page.locator(".scene-body")).toBeVisible();
    await expect(page.locator(".exercise")).toBeVisible();
    await expect(page.locator(".language-key")).toContainText("Danish to use");
    await expect(page.locator(".language-key")).toContainText("English help");
    await expect(page.locator('.exercise-prompt h3[lang="en"]')).toBeVisible();
    await expect(page.locator(".choice-card")).toHaveCount(3);
    await expect(page.locator(".choice-language-da")).toHaveCount(3);
    await expect(page.locator(".choice-language-en")).toHaveCount(3);
    await expect(page.locator(".choice-card").first().locator('[lang="da"]')).toBeVisible();
    await expect(page.locator(".choice-card").first().locator('[lang="en"]')).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(40);
    await assertNoCriticalAxe(page, "flagship lesson");
    expect(runtimeProblems, "flagship runtime failures").toEqual([]);
  });

  test("a miss offers a clear, styled retry without internal product jargon", async ({ page }) => {
    await page.goto(FLAGSHIP);
    await page.getByRole("button", { name: /ring med det samme/i }).click();

    const panel = page.locator(".miss-repair-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Your correction");
    await expect(panel).toContainText("Retry this moment");
    await expect(panel).not.toContainText(/Match → Gym|mapped drill|signal in the scene/i);
    await expect(panel).toHaveCSS("border-left-style", "solid");
    await expect(panel.getByRole("link", { name: "Review Scene 1" })).toBeVisible();
    await expect(page.locator("#next")).toHaveText("Continue");
  });

  test("professional completion has one next action and an accurate calm-pressure summary", async ({ page }) => {
    await completeFlagshipProfessionalPath(page);

    await expect(page.locator("#scene")).toContainText("Lesson complete · professional");
    await expect(page.getByRole("link", { name: "Open dashboard", exact: true })).toHaveCount(1);
    await expect(page.locator(".next-step-actions a")).toHaveCount(1);
    const pressure = page.locator(".var-bar").filter({ hasText: "Pressure" });
    await expect(pressure).toContainText("calm — no pressure leaked into the message");
    await expect(pressure.locator(".var-value")).toHaveClass(/\bneutral\b/);
  });

  test("matching exercises separate Danish material from English meaning", async ({ page }) => {
    await page.goto("/lessons/lesson-01/");
    await page.locator(".route-step").nth(2).click();
    await expect(page.locator(".match-column-da .match-column-title")).toContainText("Danish");
    await expect(page.locator(".match-column-en .match-column-title")).toContainText("English meaning");
    await expect(page.locator('.match-column-da .sign-card[lang="da"]')).toHaveCount(2);
    await expect(page.locator('.match-column-en .meaning-card[lang="en"]')).toHaveCount(2);

    await page.locator(".route-step").nth(1).click();
    await expect(page.locator(".language-field-label .language-marker-da")).toBeVisible();
    await expect(page.locator('input#answer[lang="da"]')).toBeVisible();

    await page.locator(".route-step").nth(5).click();
    await expect(page.locator(".language-field-da .language-marker-da")).toBeVisible();
    await expect(page.locator('input#name[lang="da"]')).toBeVisible();

    await page.goto("/lessons/lesson-b2-radiator/");
    await page.locator(".route-step").nth(3).click();
    await expect(page.locator(".channel-language-da").first()).toBeVisible();
    await expect(page.locator(".channel-language-en").first()).toBeVisible();
    await expect(page.locator(".flagship-option .choice-language-da").first()).toBeVisible();
    await expect(page.locator(".flagship-option .choice-language-en").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("every lesson loads cleanly on a phone-sized screen", async ({ page }) => {
    const runtimeProblems = collectRuntimeProblems(page);
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of LESSONS) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("#route")).toBeVisible();
      await expect(page.locator('.route-step[aria-current="step"]')).toHaveCount(1);
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

test.describe("Danish lesson audio", () => {
  test("uses one lazy player, persists speed, reveals repair audio after an attempt, and stops on navigation", async ({ page }) => {
    let audioRequests = 0;
    await page.route("**/audio-fixture.wav", async (route) => {
      audioRequests += 1;
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.fulfill({ status: 200, contentType: "audio/wav", body: makeWav(4) });
    });
    await page.addInitScript((manifest) => {
      window.PLATA_AUDIO_MANIFESTS = { "lesson-b2-job-followup": manifest };
    }, browserAudioManifest({ dialogueSrc: "/audio-fixture.wav" }));
    await page.goto(FLAGSHIP);
    await expect(page.locator(".plata-audio-button")).toHaveCount(1);
    await expect(page.locator("audio#plata-audio-player")).toHaveCount(0);
    expect(audioRequests).toBe(0);
    await expect(page.locator(".plata-audio-speed")).toHaveValue("1");
    await expect(page.locator(".plata-audio-disclosure")).toHaveText("AI-generated Danish voice");
    await assertNoCriticalAxe(page, "flagship audio before playback");

    const dialogueButton = page.locator(".plata-audio-button").first();
    const audioButtonBox = await dialogueButton.boundingBox();
    expect(audioButtonBox && audioButtonBox.height).toBeGreaterThanOrEqual(44);
    await dialogueButton.focus();
    await page.keyboard.press("Enter");
    await expect(dialogueButton).toContainText("Loading…");
    await expect(dialogueButton).toHaveAttribute("aria-busy", "true");
    await expect(page.locator("audio#plata-audio-player")).toHaveCount(1);
    await expect.poll(() => audioRequests).toBeGreaterThan(0);
    await expect(dialogueButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialogueButton).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".dialogue-line")).toHaveClass(/is-playing/);
    await dialogueButton.click();
    await expect(dialogueButton).toContainText("Resume");
    await expect(dialogueButton).toHaveAttribute("aria-pressed", "false");
    await dialogueButton.click();
    await expect(dialogueButton).toHaveAttribute("aria-pressed", "true");
    await page.locator(".plata-audio-speed").selectOption("0.75");
    expect(await page.evaluate(() => localStorage.getItem("plata.audio.speed.v1"))).toBe("0.75");
    expect(await page.locator("audio#plata-audio-player").evaluate((audio) => audio.playbackRate)).toBe(0.75);
    await page.locator("audio#plata-audio-player").evaluate((audio) => {
      audio.currentTime = 1;
      audio.dispatchEvent(new Event("ended"));
    });
    await expect(dialogueButton).toContainText("Replay");
    await dialogueButton.click();
    await expect(dialogueButton).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.locator("audio#plata-audio-player").evaluate((audio) => audio.currentTime)).toBeLessThan(0.5);

    await page.getByRole("button", { name: /skriv en kort opfølgning i dag/i }).click();
    await expect(page.locator(".plata-model-answer")).toBeVisible();
    await expect(page.locator(".plata-model-answer")).toContainText("Listen once, then say it aloud.");
    await expect(page.locator(".plata-audio-button")).toHaveCount(2);
    await page.locator(".plata-model-answer .plata-audio-button").click();
    await expect(dialogueButton).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("audio#plata-audio-player")).toHaveCount(1);

    await page.locator(".route-step").nth(1).click();
    await expect(page.locator("audio#plata-audio-player")).not.toHaveAttribute("src", /.+/);
    await expect(page.locator(".plata-model-answer")).toHaveCount(0);
    await expect(page.locator(".plata-audio-speed")).toHaveCount(0);
    await page.locator(".route-step").first().click();
    await expect(page.locator(".plata-audio-speed")).toHaveValue("0.75");
    await page.reload();
    await expect(page.locator(".plata-audio-speed")).toHaveValue("0.75");
    await expect(page.locator("audio#plata-audio-player")).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
  });

  test("announces a calm fallback only after a user-triggered decode failure", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.addInitScript((manifest) => {
      window.PLATA_AUDIO_MANIFESTS = { "lesson-b2-job-followup": manifest };
    }, browserAudioManifest({ dialogueSrc: "data:audio/mpeg;base64,AAAA" }));
    await page.goto(FLAGSHIP);
    await expect(page.locator(".plata-audio-status")).toHaveText("");
    await page.locator(".plata-audio-button").click();
    await expect(page.locator(".plata-audio-status")).toContainText("Audio is unavailable", { timeout: 10_000 });
    await expect(page.locator(".dialogue-copy")).toContainText("Vi regner med at give besked");
    expect(pageErrors).toEqual([]);
  });

  test("keeps choice and matching audio controls outside interactive answer buttons", async ({ page }) => {
    const source = `data:audio/wav;base64,${makeWav(2).toString("base64")}`;
    await page.addInitScript(({ audioSource }) => {
      Object.defineProperty(window, "PLATA_LESSON_B2_JOB_FOLLOWUP", {
        configurable: true,
        set(value) {
          value.scenes[0].options[0].audio = { utteranceId: "fixture-choice-audio" };
          Object.defineProperty(window, "PLATA_LESSON_B2_JOB_FOLLOWUP", { configurable: true, writable: true, value });
        }
      });
      Object.defineProperty(window, "PLATA_LESSON_01", {
        configurable: true,
        set(value) {
          const matchScene = value.scenes.find(scene => scene.type === "match");
          matchScene.pairs[0].audio = { utteranceId: "fixture-match-audio" };
          Object.defineProperty(window, "PLATA_LESSON_01", { configurable: true, writable: true, value });
        }
      });
      window.PLATA_AUDIO_MANIFESTS = {
        "lesson-b2-job-followup": {
          disclosure: "Synthetic Danish voice",
          clips: [{ utteranceId: "fixture-choice-audio", src: audioSource }]
        },
        "lesson-01-arrival": {
          disclosure: "Synthetic Danish voice",
          clips: [{ utteranceId: "fixture-match-audio", src: audioSource }]
        }
      };
    }, { audioSource: source });

    await page.goto(FLAGSHIP);
    const choiceRow = page.locator(".choice-audio-row").first();
    await expect(choiceRow).toBeVisible();
    await expect(choiceRow.locator(":scope > .choice-card")).toHaveCount(1);
    await expect(choiceRow.locator(".choice-card .plata-audio-button")).toHaveCount(0);
    await expect(page.locator("#feedback")).toHaveText("");
    await choiceRow.locator(".plata-audio-sibling .plata-audio-button").click();
    await expect(page.locator("#feedback")).toHaveText("");

    await page.goto("/lessons/lesson-01/");
    await page.locator(".route-step").nth(2).click();
    const matchRow = page.locator(".match-audio-row").first();
    await expect(matchRow).toBeVisible();
    await expect(matchRow.locator(":scope > .sign-card")).toHaveCount(1);
    await expect(matchRow.locator(".sign-card .plata-audio-button")).toHaveCount(0);
    await matchRow.locator(".plata-audio-sibling .plata-audio-button").click();
    await expect(matchRow.locator(":scope > .sign-card")).not.toHaveClass(/selected/);
    await assertNoCriticalAxe(page, "choice and match audio siblings");
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
