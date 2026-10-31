import { Router, type IRouter } from "express";
import { GetCardArtParams } from "@workspace/api-zod";
import manifest from "../lib/card-art-manifest.json";
import { publicArtFile } from "../lib/card-art-storage";

const router: IRouter = Router();
router.get("/card-art/:filename", async (req, res): Promise<void> => {
  const parsed = GetCardArtParams.safeParse(req.params);
  if (!parsed.success) { res.status(404).end(); return; }
  const entry = manifest[parsed.data.filename as keyof typeof manifest];
  if (!entry) { res.status(404).end(); return; }
  const etag = `"${entry.sha256}"`;
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "public, max-age=3600");
  if (req.headers["if-none-match"] === etag) { res.status(304).end(); return; }
  try {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", entry.bytes);
    const stream = publicArtFile(entry.object).createReadStream();
    stream.on("error", () => {
      req.log.warn("Approved card art could not be served");
      if (!res.headersSent) { res.removeHeader("Content-Length"); res.status(503).end(); } else res.destroy();
    });
    stream.pipe(res);
  } catch {
    req.log.warn("Approved card art is unavailable");
    res.removeHeader("Content-Length");
    res.status(503).end();
  }
});
export default router;
