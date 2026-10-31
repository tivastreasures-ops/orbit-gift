import { Router, type IRouter } from "express";
import { SearchTasteBody, SearchTasteResponse, GenerateGiftsBody, GenerateGiftsResponse } from "@workspace/api-zod";
import { withTaste } from "../lib/taste-adapter";
import { generate } from "../lib/gifts";
import { createClaudeSession } from "../lib/llm";
import { JobCapacity, JobConflict, RecommendationJobs } from "../lib/recommendation-jobs";
import { randomUUID } from "node:crypto";
import { colourMatch } from "../lib/colours";

const router: IRouter = Router();
const jobs = new RecommendationJobs<ReturnType<typeof GenerateGiftsResponse.parse>>();
const retryCopy = "The stars didn't line up that time. Your answers are saved. Try again?";
// Bounded concurrency prevents accidental parallel API bills. Derived expansion
// caches are bounded/ephemeral; no persistent recipient storage.
let active = 0;
router.use(["/taste/search", "/gifts/generate"], (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (active >= 8) { res.status(429).json({ error: retryCopy }); return; }
  active++;
  let released = false;
  const release = () => { if (!released) { released = true; active--; } };
  res.once("finish", release);
  res.once("close", release);
  next();
});
router.post("/taste/search", async (req, res): Promise<void> => {
  const parsed = SearchTasteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "That wasn't supposed to happen. Try again." }); return; }
  try {
    const colour = colourMatch(parsed.data.text);
    if (colour) { res.json(SearchTasteResponse.parse({ matches: [colour], fallback: true })); return; }
    const result = await withTaste(a => a.searchEntity(parsed.data.text, parsed.data.kind));
    res.json(SearchTasteResponse.parse({ matches: result.value, fallback: result.fallback }));
  } catch (error) {
    req.log.warn({ err: error }, "Taste lookup failed");
    res.status(503).json({ error: "Lost the signal. Check your connection and try again." });
  }
});
router.post("/gifts/generate", async (req, res): Promise<void> => {
  const parsed = GenerateGiftsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues.map(i => ({ path: i.path, code: i.code })) }, "Invalid recommendation input");
    res.status(400).json({ error: retryCopy }); return;
  }
  const key = req.get("Idempotency-Key") ?? randomUUID();
  if (!/^[a-zA-Z0-9-]{16,128}$/.test(key)) { res.status(400).json({ error: retryCopy }); return; }
  try {
    const result = await jobs.run(key, parsed.data, async () => {
      // A disconnected client can reattach using its key, rather than starting
      // another paid search. The detached job itself has a strict total deadline.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error("Recommendation deadline exceeded (110 seconds)")), 110000);
      timer.unref();
      try {
        return GenerateGiftsResponse.parse(await generate(parsed.data, { claude: createClaudeSession(fetch, controller.signal) }));
      } finally { clearTimeout(timer); }
    });
    if (!res.destroyed) res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Gift generation failed; device answers remain saved");
    if (!res.destroyed) res.status(error instanceof JobConflict ? 409 : error instanceof JobCapacity ? 429 : 503)
      .json({ error: retryCopy });
  }
});
export default router;
