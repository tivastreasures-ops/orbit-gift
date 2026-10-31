import assert from "node:assert/strict";
import { test } from "node:test";
import { createClaudeSession, type ClaudeSession, type ClaudeStage } from "./llm";
import { generate } from "./gifts";
import { ProfileExpander } from "./profile-expansion";
import { RefusalExpander } from "./refusals";
import { TasteCache } from "./taste-cache";
import { KINDS, type QualityCandidate } from "./quality";
import { passesRules } from "./rules";
import { TEST_PROFILES } from "./test-profiles";
import { resolveLove, searchWikipedia } from "./wikipedia";
import { generationContract, criticContract, ToolFormatError } from "./tool-contracts";

// Contract-only synthetic transport. These are NEVER used by app routes or
// reported as real Claude sample runs / semantic-quality evidence.
const resolver: typeof resolveLove = async love => ({ love, selected: null, candidates: [] });
function fixtures(loves: string[], budgetMin: number, budgetMax: number): QualityCandidate[] {
  const [a, b] = loves;
  return KINDS.flatMap((kind, i) => [0, 1].map(variant => {
    const suffix = {
      object: "carved wooden puzzle", experience: "guided workshop experience",
      consumable: "cocoa shortbread tasting box", maker: "handmade ceramic bowl",
      collectible: "Collector Archive Edition 7 figure", wildcard: "creative discovery kit",
    }[kind];
    return {
      title: `${a} ${b} ${suffix} ${variant}`, category: suffix, colours: ["black", "cream"],
      brand: "", materials: kind === "consumable" ? ["cocoa", "flour"] : ["wood", "ceramic"],
      priceMin: budgetMin, priceMax: Math.min(budgetMin + 10, budgetMax), whereToLook: "specialist shops",
      kind, sourceLoves: [a, b], sourceDetails: [{ love: a, detail: a }, { love: b, detail: b }],
      contextType: "none", contextValue: "", contextDetail: "", maker: "",
      namedItem: kind === "collectible" ? "Collector Archive Edition 7" : "", handmade: kind === "maker",
    };
  }));
}
function fakeSession(hook?: (stage: ClaudeStage, data: any, response: any) => any): ClaudeSession {
  const calls = { expansion: 0, refusals: 0, generation: 0, critic: 0, lookup: 0 };
  return {
    model: "test-only", helperModel: "test-only", calls,
    async json(stage, _prompt, input) {
      calls[stage]++;
      const data = (input as any).originalInput ?? input as any;
      let response: any;
      if (stage === "expansion") response = { loves: data.resolved.map((r: any) => ({
        love: r.love, specifics: ["test-specific detail"], eras: [], subgenres: [], adjacent: [], aesthetics: [], signatureObjects: [], places: [],
      })) };
      if (stage === "refusals") response = { refusals: data.refusals.map((r: string) => ({ refusal: r, terms: [r, r.includes("pink") ? "carnation" : r] })) };
      if (stage === "generation") response = { ideas: fixtures(data.expandedProfile.loves.map((l: any) => l.love), data.budgetMin, data.budgetMax) };
      if (stage === "critic") response = { verdicts: data.candidates.map((c: any) => ({
        id: c.id, kind: c.gift.kind, isSpecific: true, sourcesUsed: c.gift.sourceLoves,
        pass: true, duplicateOf: null, reason: "Specific and meaningfully combines the supplied tastes",
      })) };
      return hook ? hook(stage, data, response) : response;
    },
  };
}
test("unrecoverable generation/critic format failures are explicit errors, never empty quality rounds", async () => {
  for (const brokenStage of ["generation", "critic"]) {
    const claude = fakeSession((stage, _input, response) => stage === brokenStage
      ? brokenStage === "generation" ? { ideas: "wrong format" } : { verdicts: "wrong format" }
      : response);
    const trace: any[] = [];
    await assert.rejects(generate(TEST_PROFILES[0].input!, {
      claude, profiles: new ProfileExpander(resolver),
      refusals: new RefusalExpander(), trace: e => trace.push(e),
    }), ToolFormatError);
    assert.equal(claude.formatFailures?.length, 2);
    assert.equal(claude.calls[brokenStage as "generation" | "critic"], 2);
    assert.ok(trace.some(e => e.violations.some((v: any) => v.stage === "format")));
  }
});
test("critic identity mistakes receive a format-only correction, not invented verdicts", async () => {
  let criticReplies = 0;
  const claude = fakeSession((stage, _input, response) => {
    if (stage === "critic" && ++criticReplies === 1) response.verdicts[0].id = "unknown-candidate";
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, {
    claude, profiles: new ProfileExpander(resolver),
    refusals: new RefusalExpander(),
  });
  assert.equal(result.ideas.length, 12);
  assert.equal(claude.calls.critic, 2);
  assert.match(claude.formatFailures![0].issues[0], /candidate id/);
});
for (const profile of TEST_PROFILES) {
  test(`fixed profile contract: ${profile.name}`, async () => {
    assert.ok(profile.input, "A required fixed-profile fixture is missing");
    const result = await generate(profile.input!, { claude: fakeSession(), profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
    assert.equal(result.ideas.length, 12, "every passing idea is retained, including same-kind alternatives");
    assert.deepEqual([...new Set(result.ideas.map(g => g.kind))], [...KINDS]);
    assert.equal(result.diagnostics?.claudeCalls, 4);
    assert.ok(result.ideas.every(g => g.sourceLoves.every(l => profile.input!.loves.includes(l))));
  });
}
test("warm profile/refusal caches reduce four calls to two; love edit invalidates only profile", async () => {
  const profiles = new ProfileExpander(resolver), refusals = new RefusalExpander();
  const input = TEST_PROFILES[0].input!;
  await generate(input, { claude: fakeSession(), profiles, refusals });
  const warm = await generate(input, { claude: fakeSession(), profiles, refusals });
  assert.equal(warm.diagnostics?.claudeCalls, 2);
  assert.equal(warm.diagnostics?.profileCacheHit, true);
  const edited = await generate({ ...input, loves: [...input.loves, "pottery"] }, { claude: fakeSession(), profiles, refusals });
  assert.equal(edited.diagnostics?.expansionCalls, 1);
  assert.equal(edited.diagnostics?.refusalCalls, 0);
});
test("refusal edits expand only the newly added refusal", async () => {
  const refusals = new RefusalExpander(), session = fakeSession();
  await refusals.get(["pink"], session);
  const seen: string[][] = [];
  const next = fakeSession((stage, data, response) => { if (stage === "refusals") seen.push(data.refusals); return response; });
  await refusals.get(["pink", "Microsoft"], next);
  assert.deepEqual(seen, [["Microsoft"]]);
  assert.equal(next.calls.refusals, 1);
});
test("Wolfboy's pop music and Crunch Fitness refusals preserve their meaning, not unrelated homonyms", () => {
  const gift = fixtures(["wolfman", "Universal Monsters"], 50, 150)[0];
  const refusals = TEST_PROFILES.find(p => p.name === "Wolfboy")!.input!.refusals;
  assert.equal(passesRules({ ...gift, title: "Funko Pop! Universal Monsters Wolfman figure" }, refusals, "", []), true);
  assert.equal(passesRules({ ...gift, title: "pop music compilation CD" }, refusals, "", []), false);
  assert.equal(passesRules({ ...gift, title: "Crunch Fitness membership" }, refusals, "", []), false);
});
test("expanded hard-no hits are removed; retries get precise failures and fill the missing kind", async () => {
  const session = fakeSession((stage, data, response) => {
    if (stage === "generation") {
      if (session.calls.generation === 1) response.ideas.filter((g: any) => g.kind === "object").forEach((g: any) => g.colours = ["carnation"]);
      else {
        assert.ok(data.contractViolations.some((v: any) => v.issues.some((i: string) => i.includes("carnation"))));
        response.ideas = response.ideas.filter((g: any) => data.neededKinds.includes(g.kind)).map((g: any) => ({ ...g, title: `${g.title} alternative` }));
      }
    }
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 12);
  assert.equal(result.diagnostics?.generationCalls, 2);
  assert.ok(result.filteredCount >= 2);
  assert.ok(result.ideas.every(g => !g.colours.includes("carnation")));
});
test("critic rejects unsuitable ideas without exceeding two generation/critic rounds", async () => {
  const session = fakeSession((stage, data, response) => {
    if (stage === "generation") response.ideas.forEach((g: any) => g.title += ` round ${session.calls.generation}`);
    if (stage === "critic") response.verdicts.forEach((s: any) => { s.pass = false; s.reason = "keyword stuffing; duplicate concept"; });
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 0);
  assert.equal(result.diagnostics?.claudeCalls, 6);
  assert.equal(session.calls.generation, 2);
  assert.equal(session.calls.critic, 2);
});
test("owned items, rejection reasons, accumulated seeds and history reach generator AND critic; raw chips do not", async () => {
  const input = { ...TEST_PROFILES[0].input!, owned: "unique old item", rejected: [{ title: "old suggestion", reason: "Too obvious" }], moreLike: "ceramic puzzle", moreLikeSeeds: ["ceramic puzzle", "tea set"], previousTitles: ["past gift"] };
  const seen: string[] = [];
  await generate(input, {
    profiles: new ProfileExpander(resolver), refusals: new RefusalExpander(),
    claude: fakeSession((stage, data, response) => {
      if (stage === "generation" || stage === "critic") {
        seen.push(stage);
        assert.equal(data.owned, input.owned);
        assert.deepEqual(data.rejected, input.rejected);
        assert.deepEqual(data.moreLikeSeeds, input.moreLikeSeeds);
        assert.equal(data.moreLike, input.moreLike);
        assert.deepEqual(data.previousTitles, input.previousTitles);
        assert.equal(data.loves, undefined);
        assert.ok(data.expandedProfile.loves.length);
      }
      return response;
    }),
  });
  assert.deepEqual(seen, ["generation", "critic"]);
});
test("expansion failure retries once then uses real plain chips without caching failure", async () => {
  const cache = new TasteCache<number>();
  await assert.rejects(cache.get("x", async () => { throw new Error("failure"); }));
  assert.equal((await cache.get("x", async () => 7)).value, 7);
  const session = fakeSession((stage, _data, response) => {
    if (stage === "expansion") throw new Error("helper unavailable");
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 12);
  assert.equal(session.calls.expansion, 2);
  assert.equal(session.calls.generation, 1);
});
test("profile expansion refuses fabricated sources", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "expansion") response.loves[0].love = "invented source";
    return response;
  });
  const result = await new ProfileExpander(resolver).get(TEST_PROFILES[0].input!, session);
  assert.equal(result.degraded, true);
  assert.deepEqual(result.value.loves.map(l => l.love), TEST_PROFILES[0].input!.loves);
  assert.equal(session.calls.expansion, 2);
});
test("partial passes survive missing kinds and a capped refill", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "generation") response.ideas = session.calls.generation === 1 ? response.ideas.slice(0, 3) : [];
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 3);
  assert.equal(new Set(result.ideas.map(g => g.kind)).size, 2);
  assert.equal(session.calls.generation, 2);
  assert.equal(session.calls.critic, 1);
});
test("critic assigns kind and sources without title-keyword gates", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "generation") response.ideas = [{ ...response.ideas[0], title: "Partner stargazing date at a dark-sky reserve with a star atlas" }];
    if (stage === "critic") response.verdicts.forEach((v: any) => { v.kind = "experience"; });
    return response;
  });
  const result = await generate(TEST_PROFILES[3].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 1);
  assert.equal(result.ideas[0].kind, "experience");
});
test("a refill upstream failure does not erase already reviewed ideas", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "generation") {
      if (session.calls.generation === 2) throw new Error("upstream unavailable");
      response.ideas = response.ideas.slice(0, 1);
    }
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 1);
  assert.equal(session.calls.generation, 2);
});
test("a bad compact expansion is validated and retried exactly once", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "expansion" && session.calls.expansion === 1) response.loves[0].specifics = Array(5).fill("too many");
    return response;
  });
  const result = await new ProfileExpander(resolver).get(TEST_PROFILES[1].input!, session);
  assert.equal(result.degraded, false);
  assert.equal(result.value.loves.length, 7);
  assert.equal(session.calls.expansion, 2);
});
test("a failed critic exposes no unreviewed gifts and never exceeds its per-round cap", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "generation") response.ideas.forEach((g: any) => { g.title += ` round ${session.calls.generation}`; });
    if (stage === "critic") throw new Error("bad critic JSON");
    return response;
  });
  const result = await generate(TEST_PROFILES[0].input!, { claude: session, profiles: new ProfileExpander(resolver), refusals: new RefusalExpander() });
  assert.equal(result.ideas.length, 0);
  assert.equal(session.calls.generation, 2);
  assert.equal(session.calls.critic, 2);
});
test("refusal helper failure retains strict original and known-alias exclusions", async () => {
  const session = fakeSession((stage, _data, response) => {
    if (stage === "refusals") throw new Error("bad refusal JSON");
    return response;
  });
  const terms = await new RefusalExpander().get(["pink", "Microsoft"], session);
  assert.equal(passesRules(fixtures(["a", "b"], 20, 40)[0], ["pink"], "", [], terms.terms), true);
  assert.equal(passesRules({ ...fixtures(["a", "b"], 20, 40)[0], colours: ["blush"] }, ["pink"], "", [], terms.terms), false);
  assert.equal(passesRules({ ...fixtures(["a", "b"], 20, 40)[0], brand: "Xbox" }, ["Microsoft"], "", [], terms.terms), false);
});
test("Wikipedia keeps search rank and distinguishes band names from rivers", async () => {
  const transport: typeof fetch = async () => new Response(JSON.stringify({ query: { pages: [
    { pageid: 2, index: 2, title: "Fixture River", extract: "Fixture River is a river in a fictional location." },
    { pageid: 1, index: 1, title: "Fixture River (band)", extract: "Fixture River is an American indie rock band." },
  ] } }));
  const results = await searchWikipedia("unique fixture Wikipedia ranking", transport);
  assert.equal(results[0].kind, "band");
  assert.equal(results[0].id, "wiki:1");
  assert.equal(results[1].kind, "river");
});
test("direct Anthropic transport never uses a proxy or falls back after 401", async () => {
  const priorKey = process.env.ANTHROPIC_API_KEY;
  const priorModel = process.env.ANTHROPIC_MODEL;
  const priorHelper = process.env.ANTHROPIC_HELPER_MODEL;
  try {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_MODEL = "test-main";
    process.env.ANTHROPIC_HELPER_MODEL = "test-helper";
    let requests = 0;
    const session = createClaudeSession(async (url, init) => {
      requests++;
      assert.equal(url, "https://api.anthropic.com/v1/messages");
      assert.equal(new Headers(init?.headers).get("x-api-key"), "test-key");
      assert.equal(JSON.parse(String(init?.body)).model, "test-helper");
      return new Response("private upstream error", { status: 401 });
    });
    await assert.rejects(session.json("critic", "test", {}, criticContract), /Anthropic request failed \(401;/);
    assert.equal(requests, 1);
    assert.equal(session.calls.critic, 1);
    delete process.env.ANTHROPIC_API_KEY;
    await assert.rejects(session.json("generation", "test", {}, generationContract), /key missing/);
    assert.equal(requests, 1);
  } finally {
    for (const [key, value] of Object.entries({ ANTHROPIC_API_KEY: priorKey, ANTHROPIC_MODEL: priorModel, ANTHROPIC_HELPER_MODEL: priorHelper })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
