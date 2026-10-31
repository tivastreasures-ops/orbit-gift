import { test } from "node:test";
import assert from "node:assert/strict";
import { RecommendationJobs, JobConflict, JobCapacity } from "./recommendation-jobs";
import { GenerateGiftsResponse } from "@workspace/api-zod";
import { clearColour } from "./colours";
import { searchWikipedia } from "./wikipedia";

test("network retries share one job and cache success, never duplicate paid work", async () => {
  const jobs = new RecommendationJobs<number>();
  let calls = 0;
  const work = async () => { calls++; return 7; };
  const [a, b] = await Promise.all([jobs.run("same", { tastes: ["tea"] }, work), jobs.run("same", { tastes: ["tea"] }, work)]);
  assert.equal(a, 7); assert.equal(b, 7); assert.equal(calls, 1);
  assert.equal(await jobs.run("same", { tastes: ["tea"] }, work), 7);
  assert.equal(calls, 1);
  assert.throws(() => jobs.run("same", { tastes: ["music"] }, work), JobConflict);
});
test("failed job can retry once; successes expire and capacity stays bounded", async () => {
  let now = 0;
  const jobs = new RecommendationJobs<number>(() => now, 10, 1);
  await assert.rejects(jobs.run("key", {}, async () => { throw new Error("temporary"); }));
  assert.equal(await jobs.run("key", {}, async () => 1), 1);
  now = 11;
  assert.equal(await jobs.run("key", {}, async () => 2), 2);
  let release!: (n: number) => void;
  const pending = jobs.run("pending", {}, () => new Promise<number>(resolve => { release = resolve; }));
  assert.throws(() => jobs.run("other", {}, async () => 3), JobCapacity);
  await Promise.resolve(); release(4); await pending;
});
test("wire response accepts the whole-sky empty-source fallback used by UI", () => {
  const idea = { id: "test", recipientId: "test", title: "Real idea", priceRange: "$20–$30",
    whereToLook: "specialist shops", because: "", sourceLoves: [], kind: "object", passedRules: [],
    status: "shown", category: "book", colours: ["black"], brand: "", materials: ["paper"] };
  assert.equal(GenerateGiftsResponse.safeParse({ ideas: [idea], fallback: true, filteredCount: 0 }).success, true);
});
test("plain and explicitly named colors bypass cultural disambiguation without network calls", async () => {
  for (const input of ["pink", "color pink", "pink color", "The colour pink", "turquoise", "colour burgundy"]) {
    assert.ok(clearColour(input));
    const matches = await searchWikipedia(input, async () => { throw new Error("must not fetch"); });
    assert.equal(matches[0].kind, "color");
  }
  assert.equal(clearColour("P!nk"), null);
  assert.equal(clearColour("Pink Floyd"), null);
});
