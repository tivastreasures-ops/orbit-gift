import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

// Scan the exact source snapshot, not env vars or credential stores.
// Output paths only: matching values are never printed.
const paths = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}/,
  /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{25,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /(?:QLOO_API_KEY|SESSION_SECRET|OPENAI_API_KEY|AI_INTEGRATIONS_OPENAI_API_KEY)\s*[:=]\s*["'][A-Za-z0-9_/-]{16,}["']/,
];
const bad = [];
let bytes = 0;
for (const p of paths) {
  if (!statSync(p).isFile()) continue;
  if (/(^|\/)\.env(?:\.|$)/.test(p) && !p.endsWith(".env.example")) { bad.push(p); continue; }
  if (/\.(pem|key|p12|pfx)$/.test(p)) { bad.push(p); continue; }
  const buffer = readFileSync(p);
  bytes += buffer.length;
  const text = buffer.toString("utf8");
  if (patterns.some(re => re.test(text))) bad.push(p);
}
if (bad.length) {
  process.stderr.write(`Potential secrets found in: ${bad.join(", ")}\n`);
  process.exit(1);
}
process.stdout.write(`Secret pattern scan passed: ${paths.length} source files, ${bytes} bytes. No known credential patterns or env/private-key files detected.\n`);
