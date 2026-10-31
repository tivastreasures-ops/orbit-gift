import assert from "node:assert/strict";
import { test } from "node:test";
import type { GiftInput } from "@workspace/api-zod";
import { candidateSchema, KINDS, passesQuality, type QualityCandidate } from "./quality";
import { normal, passesRules } from "./rules";

const input: GiftInput = {
  recipientId: "quality-test", loves: ["Earl Grey", "German food"],
  refusals: ["the colour pink", "dresses", "anything Microsoft or Windows"],
  occasion: "Birthday", relationship: "Friend", budgetMin: 10, budgetMax: 100,
};
const valid: QualityCandidate = {
  title: "Bavarian Earl Grey shortbread baking kit",
  category: "food", colours: ["cream", "black"], brand: "", materials: ["tea", "flour"],
  priceMin: 20, priceMax: 35, whereToLook: "independent bakery",
  kind: "consumable", sourceLoves: ["Earl Grey", "German food"],
  sourceDetails: [{ love: "Earl Grey", detail: "Earl Grey" }, { love: "German food", detail: "Bavarian" }],
  contextType: "none", contextValue: "", contextDetail: "", maker: "", namedItem: "", handmade: false,
};
test("specific idea combining two real loves passes with every hard no", () => {
  assert.ok(passesQuality(valid, input));
  assert.ok(passesRules(valid, input.refusals, "", []));
});
test("six distinct kinds are the complete round contract", () => {
  assert.deepEqual([...KINDS], ["object", "experience", "consumable", "maker", "collectible", "wildcard"]);
  assert.equal(new Set(KINDS).size, 6);
});
test("one love requires real occasion or relationship, plus title evidence", () => {
  const g = { ...valid, title: "Earl Grey birthday tea tasting", kind: "experience" as const, sourceLoves: ["Earl Grey"], sourceDetails: [valid.sourceDetails[0]] };
  assert.equal(passesQuality(g, input), false);
  assert.ok(passesQuality({ ...g, contextType: "occasion", contextValue: "Birthday", contextDetail: "birthday" }, input));
  assert.equal(passesQuality({ ...g, contextType: "occasion", contextValue: "Anniversary", contextDetail: "birthday" }, input), false);
  assert.ok(passesQuality({ ...g, title: "Earl Grey friendship tea tasting", contextType: "relationship", contextValue: "Friend", contextDetail: "friendship" }, input));
});
test("unknown, repeated, and unevidenced sources are rejected", () => {
  assert.equal(passesQuality({ ...valid, sourceLoves: ["Earl Grey", "Star Wars"] }, input), false);
  assert.equal(passesQuality({ ...valid, sourceLoves: ["Earl Grey", "Earl Grey"] }, input), false);
  assert.equal(passesQuality({ ...valid, sourceDetails: [valid.sourceDetails[0], valid.sourceDetails[0]] }, input), false);
  assert.equal(passesQuality({ ...valid, sourceDetails: [valid.sourceDetails[0], { love: "German food", detail: "not in title" }] }, input), false);
});
test("plain merch, including falsely renamed generic items, is rejected", () => {
  for (const title of ["superhero graphic hoodie", "wall art canvas", "turquoise hoodie", "t-shirt wall art hoodie"]) {
    const g = { ...valid, title: `Earl Grey Bavarian ${title}`, kind: "object" as const, namedItem: title };
    assert.equal(passesQuality(g, input), false, title);
  }
  for (const title of ["t-shirt", "mug", "poster", "phone case", "tote"]) {
    assert.equal(passesQuality({ ...valid, title: `Earl Grey Bavarian ${title}`, kind: "object", namedItem: "" }, input), false, title);
  }
});
test("named-maker merch allowed but still blocked by any hard no", () => {
  const g = { ...valid, title: "Fortnum & Mason Earl Grey Bavarian tea mug", kind: "object" as const, maker: "Fortnum & Mason" };
  assert.ok(passesQuality(g, input));
  assert.ok(passesRules(g, input.refusals, "", []));
  assert.equal(passesRules({ ...g, colours: ["blush"] }, input.refusals, "", []), false);
  assert.equal(passesRules({ ...g, brand: "Microsoft" }, input.refusals, "", []), false);
});
test("a loved colour can be a detail, never the whole gift", () => {
  const colourInput = { ...input, loves: ["turquoise"], occasion: "Birthday" };
  const g = { ...valid, title: "turquoise birthday gift", kind: "object" as const, sourceLoves: ["turquoise"], sourceDetails: [{ love: "turquoise", detail: "turquoise" }], contextType: "occasion" as const, contextValue: "Birthday", contextDetail: "birthday" };
  // Context words alone are not a substantive product.
  assert.equal(passesQuality(g, colourInput), false);
  assert.equal(passesQuality({ ...g, title: "turquoise gift", contextDetail: "turquoise" }, colourInput), false);
  assert.ok(passesQuality({ ...g, title: "turquoise birthday ceramic tea strainer" }, colourInput));
});
test("maker/collectible/consumable/experience kinds need supporting evidence", () => {
  assert.equal(passesQuality({ ...valid, kind: "maker" }, input), false);
  assert.ok(passesQuality({ ...valid, kind: "maker", handmade: true }, input));
  assert.equal(passesQuality({ ...valid, kind: "collectible" }, input), false);
  assert.equal(passesQuality({ ...valid, kind: "experience" }, input), false);
  assert.equal(passesQuality({ ...valid, title: "Bavarian Earl Grey tea infuser", kind: "consumable" }, input), false);
});
test("owned, rejected and refused metadata still exclude otherwise good ideas", () => {
  assert.equal(passesRules(valid, input.refusals, valid.title, []), false);
  assert.equal(passesRules(valid, input.refusals, "", [{ title: valid.title, reason: "Not their vibe" }]), false);
  assert.equal(passesRules({ ...valid, category: "dresses" }, input.refusals, "", []), false);
});
test("Unicode love names remain distinct; schema rejects missing evidence", () => {
  assert.notEqual(normal("茶道"), normal("陶芸"));
  assert.ok(candidateSchema.safeParse(valid).success);
  assert.equal(candidateSchema.safeParse({ ...valid, sourceDetails: [] }).success, false);
});
