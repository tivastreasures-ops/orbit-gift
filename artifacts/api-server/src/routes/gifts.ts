import { Router, type IRouter } from "express";
import { SearchTasteBody, SearchTasteResponse, GenerateGiftsBody, GenerateGiftsResponse } from "@workspace/api-zod";
import { withTaste } from "../lib/taste-adapter";
import { generate } from "../lib/gifts";

const router: IRouter = Router();
// Bounded concurrency prevents accidental parallel API bills. Derived expansion
// caches are bounded/ephemeral; no persistent recipient storage.
let active = 0;
router.use(["/taste/search", "/gifts/generate"], (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (active >= 8) { res.status(429).json({ error: "That wasn't supposed to happen. Try again." }); return; }
  active++;
  res.on("finish", () => { active--; });
  next();
});
router.post("/taste/search", async (req, res): Promise<void> => {
  const parsed = SearchTasteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "That wasn't supposed to happen. Try again." }); return; }
  try {
    const result = await withTaste(a => a.searchEntity(parsed.data.text, parsed.data.kind));
    res.json(SearchTasteResponse.parse({ matches: result.value, fallback: result.fallback }));
  } catch {
    req.log.warn("Taste lookup failed");
    res.status(503).json({ error: "Lost the signal. Check your connection and try again." });
  }
});
router.post("/gifts/generate", async (req, res): Promise<void> => {
  const parsed = GenerateGiftsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "That wasn't supposed to happen. Try again." }); return; }
  try {
    res.json(GenerateGiftsResponse.parse(await generate(parsed.data)));
  } catch {
    req.log.warn("Gift generation failed");
    res.status(503).json({ error: "Lost the signal. Check your connection and try again." });
  }
});
export default router;
