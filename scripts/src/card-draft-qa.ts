import assert from "node:assert/strict";
import { chromium } from "playwright";

// No paid calls. Public completion drafts must remain separate from giver data.
const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80";
const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
await context.route("**/api/gifts/generate", route => route.fulfill({ status: 503, json: { error: "offline test" } }));
try {
  const page = await context.newPage();
  await page.goto(`${origin}/complete`, { waitUntil: "networkidle" });
  const answers = { love: "Paper stars and tea", no: "Candles", own: "A star atlas", hint: "A small keepsake" };
  for (const [key, value] of Object.entries(answers)) await page.getByTestId(`input-complete-${key}`).fill(value);
  await page.reload({ waitUntil: "networkidle" });
  for (const [key, value] of Object.entries(answers)) assert.equal(await page.getByTestId(`input-complete-${key}`).inputValue(), value);
  assert.equal(await page.evaluate(() => localStorage.getItem("ow.complete-draft")), null);
  const freshTab = await context.newPage();
  await freshTab.goto(`${origin}/complete`, { waitUntil: "networkidle" });
  assert.equal(await freshTab.getByTestId("input-complete-love").inputValue(), "");
  await freshTab.close();

  await page.goto(`${origin}/share`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const storeUrl = "/src/lib/store.ts", cardsUrl = "/src/lib/cards.ts";
    const store = await import(/* @vite-ignore */ storeUrl);
    const cards = await import(/* @vite-ignore */ cardsUrl);
    store.writeKey(store.SHARE_PURPOSE_KEY, "list");
    store.writeKey("ow.draft.share-template", "wish");
    store.writeKey("ow.draft.share-fields", cards.emptyFields());
  });
  await page.reload({ waitUntil: "networkidle" });
  const wish = page.locator('input[maxlength="120"]').first();
  await wish.fill("A letterpress constellation journal");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('input[maxlength="120"]').first().inputValue(), "A letterpress constellation journal");
  console.log("PASS: all four completion answers survive reload, stay tab-isolated, and share-card draft survives reload. No Claude calls.");
} finally {
  await browser.close();
}
