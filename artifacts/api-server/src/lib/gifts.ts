import { z } from "zod";
import { assertClaudeConfigured, createClaudeSession, type ClaudeSession } from "./llm";
import { normal, passesRules, hardNoHits } from "./rules";
import { candidateSchema, KINDS, qualityIssue, QUALITY_PROMPT, type QualityCandidate } from "./quality";
import { profileExpander, type ProfileExpander } from "./profile-expansion";
import { refusalExpander, type RefusalExpander } from "./refusals";
import { critique, type RankedCandidate } from "./critic";
import type { GiftInput } from "@workspace/api-zod";

interface Dependencies { claude?: ClaudeSession; profiles?: ProfileExpander; refusals?: RefusalExpander }
export async function generate(input: GiftInput, deps: Dependencies = {}) {
  if (!deps.claude) assertClaudeConfigured();
  const claude = deps.claude ?? createClaudeSession();
  if (!input.loves.length || input.budgetMin > input.budgetMax) {
    return { ideas: [], fallback: true, filteredCount: 0 };
  }
  const [profile, noList] = await Promise.all([
    (deps.profiles ?? profileExpander).get(input, claude),
    (deps.refusals ?? refusalExpander).get(input.refusals, claude),
  ]);
  const expandedSources = new Set(profile.value.loves.filter(l =>
    [l.specifics, l.eras, l.subgenres, l.adjacent, l.aesthetics, l.signatureObjects, l.places].some(a => a.length)
  ).map(l => normal(l.love)));
  const accepted = new Map<QualityCandidate["kind"], QualityCandidate>();
  const excluded = new Set((input.previousTitles ?? []).map(normal));
  let filteredCount = 0, rounds = 0;
  const violations: { title: string; issues: string[] }[] = [];
  const { loves: _loves, entityIds: _ids, matchedLoves: _matches, ...constraints } = input;
  const reject = (title: string, issues: string[]) => { filteredCount++; violations.push({ title, issues }); };
  for (let round = 0; round < 3 && accepted.size < KINDS.length; round++) {
    rounds++;
    const data = await claude.json("generation",
      `Propose about 12 concrete gift IDEAS, preferably two varied alternatives per needed kind, not real listings or endorsements. Use the EXPANDED PROFILE'S specifics, eras, subgenres, adjacent makers, aesthetics, objects and places as the substance, not raw chip-word merchandise. Source love fields are identity labels, not a substitute for expanded detail. Unresolved empty expansions cannot be used as sources.
All original and expanded refusals are mandatory. Owned items must not recur; broad ownership excludes that artist's entire owned category. Incorporate rejection reasons; More like this seeds are positive direction but never override exclusions or permit repeats.
${QUALITY_PROMPT}
Return {"ideas":[...]} fields: title,category,colours (positive actual colours, at least one),brand (empty if unspecified),materials (positive actual materials, at least one),priceMin,priceMax (USD ballpark within budget),whereToLook (shop/search venue type, never URL),kind,sourceLoves,sourceDetails,contextType,contextValue,contextDetail,maker,namedItem,handmade.
Never use negated metadata or invented collaborations/products. No marketing prose beyond gift attributes. Correct EACH supplied failure in contractViolations; never repeat excluded titles or already accepted kinds.`,
      {
        ...constraints, expandedProfile: profile.value, expandedRefusalTerms: noList.terms,
        excludeTitles: [...excluded], neededKinds: KINDS.filter(kind => !accepted.has(kind)),
        existing: [...accepted.values()], contractViolations: violations.slice(-30),
      });
    const raw = z.object({ ideas: z.array(z.unknown()).max(24) }).parse(data).ideas;
    const eligible: RankedCandidate[] = [];
    for (let index = 0; index < raw.length; index++) {
      const parsed = candidateSchema.safeParse(raw[index]);
      if (!parsed.success) {
        reject("", parsed.error.issues.map(issue => `invalid structured field ${issue.path.join(".")}: ${issue.message}`));
        continue;
      }
      const gift = parsed.data;
      if (accepted.has(gift.kind)) { reject(gift.title, [`${gift.kind} already accepted; supply a missing kind`]); continue; }
      if (excluded.has(normal(gift.title))) { reject(gift.title, ["duplicate/prior title"]); continue; }
      excluded.add(normal(gift.title));
      const issues: string[] = [];
      const quality = qualityIssue(gift, input);
      if (quality) issues.push(quality);
      if (gift.sourceLoves.some(l => !expandedSources.has(normal(l)))) issues.push("source has no resolved expanded taste; use a supported source");
      if (gift.priceMax < gift.priceMin || gift.priceMin < input.budgetMin || gift.priceMax > input.budgetMax) issues.push("outside supplied budget");
      const hits = hardNoHits(gift, input.refusals, noList.terms);
      if (hits.length) issues.push(`hard-no terms matched: ${hits.join(", ")}`);
      if (!passesRules(gift, input.refusals, input.owned ?? "", input.rejected ?? [], noList.terms) && !hits.length) {
        issues.push("matches an owned category/item or previously rejected title; inspect supplied owned and rejected fields");
      }
      if (issues.length) { reject(gift.title, issues); continue; }
      eligible.push({ id: `${round}:${index}`, gift });
    }
    if (!eligible.length) continue;
    const scores = await critique(claude, eligible, profile.value, input, [...accepted.values()], noList.terms);
    for (const score of scores.filter(s => !s.accepted)) reject(eligible.find(c => c.id === score.id)!.gift.title, score.issues);
    for (const score of scores.filter(s => s.accepted).sort((a, b) => b.score - a.score)) {
      const gift = eligible.find(c => c.id === score.id)!.gift;
      if (!accepted.has(gift.kind)) accepted.set(gift.kind, {
        ...gift, sourceLoves: gift.sourceLoves.map(source => input.loves.find(love => normal(love) === normal(source))!),
      });
    }
  }
  // Bounded retries never weaken safety to promise six. The approved empty/error
  // UI is safer than padding an incomplete round with forbidden gifts.
  const ideas = accepted.size === KINDS.length ? KINDS.map(kind => {
    const gift = accepted.get(kind)!;
    return {
      id: crypto.randomUUID(), recipientId: input.recipientId, title: gift.title,
      priceRange: `$${gift.priceMin}–$${gift.priceMax}`, whereToLook: gift.whereToLook,
      because: gift.sourceLoves.join(" + "), sourceLoves: gift.sourceLoves, kind: gift.kind,
      passedRules: [...input.refusals, ...(input.owned ? [input.owned] : [])],
      status: "shown" as const, category: gift.category, colours: gift.colours, brand: gift.brand, materials: gift.materials,
    };
  }) : [];
  return {
    ideas, fallback: true, filteredCount,
    diagnostics: {
      claudeCalls: Object.values(claude.calls).reduce((a, b) => a + b, 0),
      expansionCalls: claude.calls.expansion, refusalCalls: claude.calls.refusals,
      generationCalls: claude.calls.generation, criticCalls: claude.calls.critic,
      rounds, profileCacheHit: profile.hit, model: claude.model, helperModel: claude.helperModel,
    },
  };
}
