import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { publicArtFile } from "./card-art-storage";

// Operator-only import, never mounted as an anonymous upload endpoint.
const assets = new URL("../../../../attached_assets/", import.meta.url);
const files = await readdir(assets);
const manifest: Record<string, { object: string; sha256: string; width: number; height: number; bytes: number }> = {};
for (const template of ["secret-santa", "all-i-want", "im-stumped", "this-or-that"]) {
  for (const version of ["main", "neutral"]) {
    const name = `${template}-${version}`;
    const source = files.find(f => f.startsWith(`${name}_1793417`) && f.endsWith(".png"));
    if (!source) throw new Error(`Missing approved image: ${name}`);
    const bytes = await readFile(new URL(source, assets));
    if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Not a PNG");
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (width !== 1122 || height !== 1402) throw new Error(`Unexpected source size: ${name}`);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const object = `orbit-gift/card-art/${sha256}/${name}.png`;
    const target = publicArtFile(object);
    await target.save(bytes, {
      resumable: false,
      metadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable", metadata: { sha256 } },
    });
    const [copy] = await target.download();
    if (createHash("sha256").update(copy).digest("hex") !== sha256) throw new Error(`Storage byte verification failed: ${name}`);
    manifest[`${name}.png`] = { object, sha256, width, height, bytes: bytes.length };
    console.log(`${name}.png: ${width}x${height}, ${bytes.length} bytes, sha256 ${sha256}`);
  }
}
await writeFile(new URL("./card-art-manifest.json", import.meta.url), JSON.stringify(manifest, null, 2) + "\n");
console.log("Eight exact approved images uploaded and byte-verified. No image processing performed.");
