import { mkdir, readFile, writeFile } from "node:fs/promises";
import { generate } from "./gifts";
import { assertClaudeConfigured, createClaudeSession } from "./llm";
import { KINDS } from "./quality";
import { TEST_PROFILES } from "./test-profiles";

// Exactly one search per fixed profile. No automatic evaluation reruns.
const only = process.argv[2];
const rows: string[] = [], samples: string[] = [];
const dir = new URL(`../../../../generated-artifacts/claude-live/${Date.now()}/`, import.meta.url);
await mkdir(dir, { recursive: true });
let failed = false;
let gateOpen = false;
for (const [index, profile] of TEST_PROFILES.filter(p => !only || p.name === only).entries()) {
  if (!only && index > 0 && !gateOpen) {
    rows.push(`| ${profile.name} | SKIPPED: Hinterwelle gate failed | — | — | 0 | 0 |`);
    continue;
  }
  const claude = createClaudeSession();
  const slug = profile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const writes: Promise<void>[] = [];
  let findings: { title: string; issues: string[]; stage: string }[] = [];
  const json = claude.json.bind(claude);
  claude.json = async (stage, prompt, input, contract) => {
    console.log(`${profile.name}: ${stage} started`);
    const data = await json(stage, prompt, input, contract);
    // Model JSON only. No headers, secrets or environment dumps.
    await writeFile(new URL(`${slug}-${stage}-${claude.calls[stage]}.json`, dir), JSON.stringify(data, null, 2));
    return data;
  };
  let configured = false;
  try {
    assertClaudeConfigured(); configured = true;
    if (!profile.input) throw new Error("Fixed profile missing");
    const result = await generate(profile.input, { claude, trace: event => {
      findings = event.violations;
      console.log(`${profile.name}: round ${event.round}, kinds ${event.acceptedKinds.join(", ") || "none"}`);
      writes.push(writeFile(new URL(`${slug}-round-${event.round}.json`, dir), JSON.stringify(event, null, 2)));
    } });
    const kinds = [...new Set(result.ideas.map(g => g.kind))];
    const status = !result.ideas.length ? "ZERO" : KINDS.every(k => kinds.includes(k)) ? "PASS" : "PARTIAL";
    const formatFailures = claude.formatFailures?.length ?? 0;
    if (!result.ideas.length || formatFailures) failed = true;
    if (index === 0) gateOpen = result.ideas.length > 0 && formatFailures === 0;
    rows.push(`| ${profile.name} | ${formatFailures ? `${status} (format repaired)` : status} | ${result.ideas.length} | ${kinds.join(", ") || "—"} | ${result.diagnostics?.claudeCalls ?? 0} | ${formatFailures} |`);
    samples.push(`\n**${profile.name} — ideas shown**\n${result.ideas.map(g => `- ${g.kind}: ${g.title.replace(/\n/g, " ")} — ${g.priceRange}; sources: ${g.sourceLoves.join(" + ") || "whole-sky fallback"}`).join("\n") || "- None."}`);
  } catch (error) {
    failed = true;
    const count = Object.values(claude.calls).reduce((a, b) => a + b, 0);
    const reason = error instanceof Error ? error.message.replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 700) : "Unknown pipeline error";
    rows.push(`| ${profile.name} | ${configured ? `ERROR: ${reason}` : "BLOCKED: ANTHROPIC_API_KEY missing"} | 0 | — | ${count} | ${claude.formatFailures?.length ?? 0} |`);
  }
  const rejections = findings.filter(v => v.title);
  samples.push(`\n**${profile.name} — rejected ideas and reasons**\n${rejections.map(v => `- [${v.stage}] ${v.title.replace(/\n/g, " ")}: ${v.issues.join("; ").replace(/\n/g, " ")}`).join("\n") || "- None."}`);
  samples.push(`\n**${profile.name} — format failures**\n${claude.formatFailures?.map(f => `- ${f.stage}, attempt ${f.attempt}: ${f.issues.join("; ")}`).join("\n") || "- None."}`);
  samples.push(`\n**${profile.name} — Claude calls by stage**\n- ${JSON.stringify(claude.calls)}`);
  await Promise.all(writes);
}
const report = `<!-- CLAUDE_PROFILE_EVAL -->
### Fixed-profile live evaluation — ${new Date().toISOString()}

Hinterwelle alone first. The other three run once each ONLY if it shows ideas and has zero format failures.
At most two semantic generation rounds and one semantic critic pass per round; each malformed tool reply gets at most one format-only correction. Corrections count as Claude calls.
Model: \`${process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"}\`; helper: \`${process.env.ANTHROPIC_HELPER_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5"}\`.

| Profile | Result | Ideas shown | Kinds covered | Claude calls | Format failures |
| --- | --- | ---: | --- | ---: | ---: |
${rows.join("\n")}
${samples.join("\n")}

PARTIAL means safe reviewed ideas are shown without full six-kind coverage. ZERO/ERROR or any format failure closes the Hinterwelle gate, even if a correction recovered it. No profile is re-run by this evaluator. Model JSON and trace files are ignored generated output, not committed. No simulated output is counted as a live run.
<!-- /CLAUDE_PROFILE_EVAL -->`;
if (!only) {
  const file = new URL("../../../../BUILD.md", import.meta.url);
  const old = await readFile(file, "utf8");
  await writeFile(file, old.includes("<!-- CLAUDE_PROFILE_EVAL -->")
    ? old.replace(/<!-- CLAUDE_PROFILE_EVAL -->[\s\S]*?<!-- \/CLAUDE_PROFILE_EVAL -->/, report)
    : `${old}\n\n${report}\n`);
}
console.log(report);
if (failed) process.exitCode = 1;
