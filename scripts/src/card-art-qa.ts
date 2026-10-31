/// <reference lib="dom" />
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// This is an operator/test runner, not an app route. Review rendering explicitly
// forces both approved versions; the ordinary UI never bypasses hard no's.
const root = new URL("../../", import.meta.url);
const out = new URL("generated-artifacts/card-art/", root);
await mkdir(out, { recursive: true });
type Profile = { name: string; input: { loves: string[]; refusals: string[]; owned: string; budgetMin: number; budgetMax: number } };
const { TEST_PROFILES } = await import(new URL("artifacts/api-server/src/lib/test-profiles.ts", root).href);
const profiles = (TEST_PROFILES as Profile[]).filter(p => p.name === "Hinterwelle" || p.name === "Wolfboy");
const long = "Donaudampfschifffahrtsgesellschaftskapitän — hand-bound archival editions, tiny independent makers and carefully researched annotated collections";
profiles.push({
  name: "Long text stress",
  input: {
    loves: Array.from({ length: 7 }, (_, i) => `${i + 1}. ${long} ${long}`),
    refusals: Array.from({ length: 7 }, (_, i) => `${i + 1}. ${long} ${long}`),
    owned: `${long}\n${long}\n${long}`, budgetMin: 50, budgetMax: 150,
  },
});
const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80";
const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, ignoreHTTPSErrors: true });
const report: unknown[] = [];
try {
  await page.goto(`${origin}/share`, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });
  for (const profile of profiles) {
    for (const template of ["santa", "wish", "stumped", "tot"]) {
      for (const version of ["main", "neutral"]) {
        const result = await page.evaluate(async ({ profile, template, version, origin, long }) => {
          // Vite dev import runs the ACTUAL browser renderer, not a reimplementation.
          const moduleUrl = "/src/lib/cards.ts";
          const m = await import(/* @vite-ignore */ moduleUrl);
          const f = m.emptyFields();
          f.santa = { loves: profile.input.loves.slice(0, 3), nos: profile.input.refusals.slice(0, 3), budget: `$${profile.input.budgetMin}–$${profile.input.budgetMax}` };
          f.wish = { wishes: profile.input.loves.slice(0, 4).map((wish: string, i: number) => ({ wish, because: profile.input.loves[(i + 1) % profile.input.loves.length] })) };
          f.tot = { yes: [...profile.input.loves], no: [...profile.input.refusals] };
          f.stumped = { love: profile.input.loves.join("\n"), no: profile.input.refusals.join("\n"), own: profile.input.owned, hint: profile.input.loves.at(-1) || "" };
          const opts = {
            template, purpose: template === "stumped" ? "ask" : "list", mode: "filled", size: "portrait",
            fields: f, omit: new Set<string>(), name: profile.name, showBudget: true,
            refusals: profile.input.refusals, appName: "Orbit & Wonder", appUrl: origin,
            completionUrl: `${origin}/complete?template=stumped`,
          };
          const portrait = await m.renderReviewCard(opts, version);
          const square = await m.renderReviewCard({ ...opts, size: "square" }, version);
          const expected = document.createElement("canvas");
          expected.width = 864; expected.height = 1080;
          expected.getContext("2d")!.drawImage(portrait.canvas, 0, 0, 864, 1080);
          const a = expected.getContext("2d")!.getImageData(0, 0, 864, 1080).data;
          const b = square.canvas.getContext("2d")!.getImageData(108, 0, 864, 1080).data;
          const containedExactly = a.length === b.length && a.every((value, i) => value === b[i]);
          const hint = m.slotValues({ ...opts, template: "santa", purpose: "hint" });
          const blank = m.slotValues({ ...opts, template: "stumped", mode: "blank" });
          const request = m.slotValues({ ...opts, template: "stumped", mode: "request" });
          const values = m.slotValues(opts);
          const failures: string[] = [];
          if (!containedExactly) failures.push("Square does not contain the whole portrait exactly");
          if (portrait.canvas.width !== 1080 || portrait.canvas.height !== 1350 || square.canvas.width !== 1080 || square.canvas.height !== 1080) failures.push("Wrong export dimensions");
          if (portrait.diagnostics.some((d: any) => !d.inside) || square.diagnostics.some((d: any) => !d.inside)) failures.push("Measured glyph ink outside a slot");
          if ("budget" in hint || "budget-label" in hint) failures.push("Budget leaked into Drop a hint");
          if (blank.link !== "Print it, write on it, send a photo back.") failures.push("Blank-PNG line mismatch");
          if (request.link !== `Fill it in at ${origin}/complete?template=stumped`) failures.push("Completion link mismatch");
          if (template === "tot" && profile.name === "Wolfboy" && values["yes-7"] !== "turquoise") failures.push("Seventh love missing");
          if (template === "stumped" && values.request !== "I want to get you something you'll actually love. Tell me what you love, what you absolutely don't want, and what you already own. Then send your answers back to me!") failures.push("Request copy mismatch");
          if (profile.name === "Long text stress" && !portrait.diagnostics.some((d: any) => d.ellipsis)) failures.push("Stress case did not exercise ellipsis");
          // Refused colour selection is tested independently of forced QA versions.
          for (const colour of ["pink", "red", "green", "orange", "teal", "burgundy"]) {
            try { const p = m.choosePalette(template, [colour]); if (colour === "pink" && !p.neutral) failures.push("Pink did not select neutral"); } catch { /* no safe neutral: fail-closed is valid */ }
          }
          return {
            failures, containedExactly,
            portrait: portrait.canvas.toDataURL("image/png"), square: square.canvas.toDataURL("image/png"),
            diagnostics: portrait.diagnostics,
          };
        }, { profile, template, version, origin, long });
        const slug = profile.name === "Long text stress" ? "long-text" : profile.name.toLowerCase();
        for (const size of ["portrait", "square"] as const) {
          const filename = `${slug}-${template}-${version}-${size}.png`;
          await writeFile(new URL(filename, out), Buffer.from(result[size].split(",")[1], "base64"));
          report.push({ profile: profile.name, template, version, size, filename, failures: result.failures, containedExactly: result.containedExactly, diagnostics: result.diagnostics });
        }
        console.log(`${slug}/${template}/${version}: ${result.failures.length ? result.failures.join("; ") : "PASS portrait+square"}`);
      }
    }
  }
  // Exercise a real native PNG-download event using the app's unchanged helper.
  const downloadEvent = page.waitForEvent("download");
  await page.evaluate(async () => {
    const moduleUrl = "/src/lib/cards.ts"; const m = await import(/* @vite-ignore */ moduleUrl);
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
    m.downloadFile(await m.canvasToFile(canvas, "download-contract.png"));
  });
  const download = await downloadEvent;
  if (download.suggestedFilename() !== "download-contract.png") throw new Error("Native download filename mismatch");
  await writeFile(new URL("qa-report.json", out), JSON.stringify({ cases: report.length, nativeDownload: true, results: report }, null, 2));
  const failed = report.filter((r: any) => r.failures.length);
  console.log(`${report.length} exported PNG cases; ${failed.length} failures. Output: ${fileURLToPath(out)}`);
  if (failed.length) process.exitCode = 1;
} finally { await browser.close(); }
