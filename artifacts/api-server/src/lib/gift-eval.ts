import { readFile, writeFile } from "node:fs/promises";
import { generate } from "./gifts";
import { assertClaudeConfigured, createClaudeSession } from "./llm";
import { KINDS } from "./quality";
import { TEST_PROFILES } from "./test-profiles";

// Real calls only. Missing credentials/profiles are BLOCKED, never a mock pass.
const rows: string[] = [], samples: string[] = [];
let failed = false;
for (const profile of TEST_PROFILES) {
  if (!profile.input) {
    rows.push(`| ${profile.name} | BLOCKED: Director profile details pending | 0 | — |`);
    failed = true;
    continue;
  }
  const claude = createClaudeSession();
  let configured = false;
  try {
    assertClaudeConfigured();
    configured = true;
    const result = await generate(profile.input, { claude });
    const kinds = [...new Set(result.ideas.map(g => g.kind))];
    const passed = result.ideas.length === 6 && KINDS.every(k => kinds.includes(k));
    if (!passed) failed = true;
    rows.push(`| ${profile.name} | ${passed ? "PASS" : "FAIL: incomplete six-kind round"} | ${result.diagnostics?.claudeCalls ?? 0} | ${kinds.join(", ")} |`);
    if (passed) samples.push(`\n**${profile.name} real Claude sample**\n${result.ideas.map(g => `- ${g.kind}: ${g.title.replace(/\n/g, " ")} — ${g.priceRange}; sources: ${g.sourceLoves.join(" + ")}`).join("\n")}`);
  } catch {
    failed = true;
    const count = Object.values(claude.calls).reduce((a, b) => a + b, 0);
    rows.push(`| ${profile.name} | ${configured ? "FAIL: upstream/pipeline error; no provider fallback" : "BLOCKED: ANTHROPIC_API_KEY missing"} | ${count} | — |`);
  }
}
const report = `<!-- CLAUDE_PROFILE_EVAL -->\n### Fixed-profile live evaluation — ${new Date().toISOString()}\n\nModel: \`${process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"}\`; helper: \`${process.env.ANTHROPIC_HELPER_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"}\`.\n\n| Profile | Live result | Claude calls | Accepted kinds |\n| --- | --- | ---: | --- |\n${rows.join("\n")}\n${samples.join("\n")}\n\nNo simulated output is counted as a live run. Deterministic transport fixtures are a separate contract test, not a semantic-quality evaluation.\n<!-- /CLAUDE_PROFILE_EVAL -->`;
const file = new URL("../../../../BUILD.md", import.meta.url);
const old = await readFile(file, "utf8");
await writeFile(file, old.includes("<!-- CLAUDE_PROFILE_EVAL -->")
  ? old.replace(/<!-- CLAUDE_PROFILE_EVAL -->[\s\S]*?<!-- \/CLAUDE_PROFILE_EVAL -->/, report)
  : `${old}\n\n${report}\n`);
console.log(report);
if (failed) process.exitCode = 1;
