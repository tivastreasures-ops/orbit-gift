/// <reference lib="dom" />
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Isolated UI fixtures only: intercept generation so this costs ZERO Claude calls.
const dir = new URL("../../generated-artifacts/results-state/", import.meta.url);
await mkdir(dir, { recursive: true });
const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80";
const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, ignoreHTTPSErrors: true });
  await page.route("**/api/gifts/generate", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ ideas: [], fallback: true, filteredCount: 0 }),
  }));
  await page.addInitScript(() => {
    const recipientId = "ui-qa-sol";
    const titles = [
      "Partner stargazing date at a dark-sky reserve with a star atlas",
      "Carl Sagan Cosmos hardcover",
      "Birthday rye and whole wheat flour sampler for sourdough loaves",
    ];
    const gifts = titles.map((title, i) => ({
      id: `ui-idea-${i}`, recipientId, title, kind: ["experience", "collectible", "consumable"][i],
      priceRange: "$20–$40", whereToLook: "specialist shops",
      because: "astronomy", sourceLoves: ["astronomy"], passedRules: ["alcohol"],
      category: "gift", colours: ["cream"], brand: "", materials: ["paper"], status: "shown",
    }));
    localStorage.setItem("ow.recipients", JSON.stringify([{ id: recipientId, name: "Sol", relationship: "Partner", occasion: "Birthday", budgetMin: 20, budgetMax: 80, owned: "basic starter jar" }]));
    localStorage.setItem("ow.chips", JSON.stringify([
      { id: "ui-love-1", recipientId, text: "astronomy", type: "love", status: "plain", kind: "" },
      { id: "ui-love-2", recipientId, text: "sourdough baking", type: "love", status: "plain", kind: "" },
    ]));
    localStorage.setItem("ow.gifts", JSON.stringify(gifts));
    localStorage.setItem("ow.rounds", JSON.stringify({ [recipientId]: gifts.map(g => g.id) }));
    localStorage.setItem("ow.settings", JSON.stringify({ appName: "Orbit & Wonder", tagline: "Stardust Theory", reduceMotion: true }));
  });
  await page.goto(`${origin}/recipient/ui-qa-sol/results`, { waitUntil: "networkidle" });
  const headline = await page.getByTestId("text-results-heading").textContent();
  if (headline !== "Only 3 made it past the no list.") throw new Error(`Partial copy mismatch: ${headline}`);
  for (const title of ["Partner stargazing date at a dark-sky reserve with a star atlas", "Carl Sagan Cosmos hardcover"]) {
    if (!await page.getByText(title, { exact: true }).isVisible()) throw new Error("Passing partial gift missing");
  }
  await page.screenshot({ path: fileURLToPath(new URL("partial-phone.png", dir)), fullPage: true });
  // Clear only this test context, then let the intercepted response exercise
  // the actual empty response handler and exact approved zero-state copy.
  await page.evaluate(() => { localStorage.setItem("ow.rounds", "{}"); localStorage.setItem("ow.gifts", "[]"); });
  // Init script would reseed on reload, so use a clean second page for zero.
  const zero = await browser.newPage({ viewport: { width: 402, height: 874 }, ignoreHTTPSErrors: true });
  await zero.route("**/api/gifts/generate", route => route.fulfill({ status: 200, contentType: "application/json", body: '{"ideas":[],"fallback":true,"filteredCount":0}' }));
  await zero.addInitScript(() => {
    localStorage.setItem("ow.recipients", JSON.stringify([{ id: "ui-zero", name: "Sol", relationship: "Partner", occasion: "Birthday", budgetMin: 20, budgetMax: 80, owned: "" }]));
    localStorage.setItem("ow.chips", "[]"); localStorage.setItem("ow.gifts", "[]"); localStorage.setItem("ow.rounds", "{}");
  });
  await zero.goto(`${origin}/recipient/ui-zero/results`, { waitUntil: "networkidle" });
  await zero.getByTestId("status-no-results").waitFor();
  if (!await zero.getByText("The no list won this round. Loosen one rule or add another love, then try again.", { exact: true }).isVisible()) throw new Error("Zero-state copy mismatch");
  await zero.screenshot({ path: fileURLToPath(new URL("zero-phone.png", dir)), fullPage: true });
  console.log("PASS: phone partial/zero states and exact copy; no live Claude requests.");
} finally { await browser.close(); }
