import assert from "node:assert/strict";
import { test } from "node:test";
import { candidateSchema, objectiveIssue, KINDS, type QualityCandidate } from "./quality";
import { normal, passesRules } from "./rules";

const valid: QualityCandidate = {
  title: "Earl Grey German shortbread baking kit", category: "baking kit",
  colours: ["cream"], brand: "", materials: ["flour", "tea"], priceMin: 20, priceMax: 40,
  whereToLook: "specialist bakers", kind: "consumable",
  sourceLoves: ["Earl Grey", "German food"], sourceDetails: [],
  contextType: "none", contextValue: "", contextDetail: "",
  maker: "", namedItem: "", handmade: false,
};
test("six kinds remain a target, not a complete-round acceptance gate", () => {
  assert.equal(new Set(KINDS).size, 6);
  assert.ok(candidateSchema.safeParse(valid).success);
});
test("kind and specificity keyword gates do not reject Sol's legitimate ideas", () => {
  for (const title of [
    "Partner stargazing date at a dark-sky reserve with a star atlas",
    "Carl Sagan Cosmos hardcover",
    "Birthday rye and whole wheat flour sampler for sourdough loaves",
  ]) assert.equal(objectiveIssue({ ...valid, title, category: "gift" }), null);
});
test("generic merch blocklist remains objective and mandatory", () => {
  for (const title of ["plain tee", "hoodie", "mug", "poster", "wall art", "phone case", "tote"]) {
    assert.match(objectiveIssue({ ...valid, title, category: "gift" })!, /generic merch/);
  }
  assert.equal(objectiveIssue({ ...valid, title: "Fortnum & Mason tea mug", maker: "Fortnum & Mason" }), null);
  assert.equal(objectiveIssue({ ...valid, title: "Known Item tea mug", namedItem: "Known Item" }), null);
  assert.ok(objectiveIssue({ ...valid, title: "generic mug", namedItem: "mug" }));
});
test("hard no's still inspect every positive metadata field and expanded aliases", () => {
  for (const field of ["title", "category", "brand", "whereToLook"] as const) {
    assert.equal(passesRules({ ...valid, [field]: "pink" }, ["pink"], "", []), false);
  }
  assert.equal(passesRules({ ...valid, colours: ["blush"] }, ["pink"], "", []), false);
  assert.equal(passesRules({ ...valid, materials: ["suede"] }, ["leather"], "", []), false);
  assert.equal(passesRules({ ...valid, brand: "Xbox" }, ["Microsoft"], "", []), false);
  assert.equal(passesRules({ ...valid, colours: ["carnation"] }, ["pink"], "", [], ["carnation"]), false);
});
test("owned matches whole words/phrases, case-insensitively, never substrings", () => {
  assert.equal(passesRules({ ...valid, title: "Heart-shaped ceramic bowl" }, [], "art", []), true);
  assert.equal(passesRules({ ...valid, title: "Steamer basket" }, [], "tea", []), true);
  assert.equal(passesRules({ ...valid, title: "Fine ART anthology" }, [], "art", []), false);
  assert.equal(passesRules({ ...valid, title: "A signed STAR ATLAS hardcover" }, [], "star atlas", []), false);
  assert.equal(passesRules({ ...valid, title: "Heart station" }, [], "all art tins", []), true);
  assert.equal(passesRules({ ...valid, title: "Joy Division vinyl record" }, [], "all Joy Division records", []), false);
});
test("owned/rejected exclusions and Unicode identity normalization remain enforced", () => {
  assert.equal(passesRules(valid, [], valid.title.toUpperCase(), []), false);
  assert.equal(passesRules(valid, [], "", [{ title: valid.title, reason: "Already has it" }]), false);
  assert.notEqual(normal("茶道"), normal("陶芸"));
});
