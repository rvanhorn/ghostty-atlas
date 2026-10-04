import { chromium, firefox } from "@playwright/test";

const browserName = process.env.ATLAS_BROWSER || "firefox";
const browser = await { chromium, firefox }[browserName].launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const fixture = "/tests/browser/theme-strip.fixture.html";
const baseURL = process.env.ATLAS_TEST_URL || "http://127.0.0.1:5174";
const results = [];
for (const copies of [1, 10]) {
  // Warm the server's module transforms and browser cache before sampling.
  await page.goto(`${baseURL}${fixture}?copies=${copies}`);
  await page.waitForFunction(() => window.fixturePaint);
  for (let run = 0; run < 5; run++) {
    await page.goto(`${baseURL}${fixture}?copies=${copies}`);
    await page.waitForFunction(() => window.fixturePaint);
    const initial = await page.evaluate(() => ({
      renderMs: window.fixturePaint - window.fixtureStart,
      cards: document.querySelectorAll(".theme-card").length,
      nodes: document.querySelectorAll("*").length,
    }));
    const scroll = await page.evaluate(async () => {
      const viewport = document.querySelector(".theme-strip-viewport");
      const intervals = [];
      let previous = performance.now();
      for (let step = 1; step <= 30; step++) {
        viewport.scrollLeft =
          ((viewport.scrollWidth - viewport.clientWidth) * step) / 30;
        await new Promise(requestAnimationFrame);
        const now = performance.now();
        intervals.push(now - previous);
        previous = now;
      }
      return {
        scrollMeanFrameMs:
          intervals.reduce((a, b) => a + b, 0) / intervals.length,
        scrollMaxFrameMs: Math.max(...intervals),
      };
    });
    await page.evaluate(() => {
      window.fixturePaint = null;
      window.searchStart = performance.now();
    });
    await page
      .getByRole("textbox", { name: "Search", exact: true })
      .fill("Copy");
    await page.waitForFunction(() => window.fixturePaint);
    const searchMs = await page.evaluate(
      () => window.fixturePaint - window.searchStart,
    );
    results.push({ copies, run, ...initial, searchMs, ...scroll });
  }
}
console.log(
  JSON.stringify(
    {
      browserName,
      browser: browser.version(),
      platform: process.platform,
      architecture: process.arch,
      viewport: "1440x900",
      results,
    },
    null,
    2,
  ),
);
await browser.close();
