import assert from "node:assert/strict";
import { test } from "node:test";
import { createClaudeSession, type ClaudeSession } from "./llm";
import { generationContract, criticContract, requestTool, ToolFormatError } from "./tool-contracts";

// Generate a reply from the ACTUAL emitted tool schema, not a parallel fixture
// interface. Every required nested object, enum and array comes from the schema.
function sample(schema: any): any {
  if (Array.isArray(schema.type)) return sample({ ...schema, type: schema.type.includes("null") ? "null" : schema.type[0] });
  if (schema.anyOf) return sample(schema.anyOf.find((s: any) => s.type === "null") ?? schema.anyOf[0]);
  if (schema.enum) return schema.enum[0];
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, sample(v)]));
  if (schema.type === "array") return [sample(schema.items)];
  if (schema.type === "string") return "contract fixture";
  if (schema.type === "number" || schema.type === "integer") return 42;
  if (schema.type === "boolean") return true;
  if (schema.type === "null") return null;
  throw new Error(`Unhandled schema type ${JSON.stringify(schema)}`);
}
for (const contract of [generationContract, criticContract]) {
  test(`${contract.tool.name}: sample constructed from tool JSON Schema passes its exact Zod source`, () => {
    const reply = sample(contract.tool.input_schema);
    assert.deepEqual(contract.schema.parse(reply), reply);
    const check = (s: any) => {
      if (s.type === "object") {
        assert.equal(s.additionalProperties, false);
        assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
        Object.values(s.properties).forEach(check);
      }
      if (s.items) check(s.items);
      if (s.anyOf) s.anyOf.forEach(check);
      for (const key of ["minimum", "maximum", "minLength", "maxLength", "maxItems"]) assert.equal(s[key], undefined);
    };
    check(contract.tool.input_schema);
    assert.equal(contract.tool.strict, true);
  });
}
test("sourceDetails is explicitly an array of {love, detail}, and old text/strings shapes fail", () => {
  const shape = generationContract.tool.input_schema.properties.ideas.items.properties.sourceDetails;
  assert.equal(shape.type, "array");
  assert.equal(shape.items.properties.love.type, "string");
  assert.equal(shape.items.properties.detail.type, "string");
  for (const wrong of ["one connection", ["one connection"]]) {
    const reply = sample(generationContract.tool.input_schema);
    reply.ideas[0].sourceDetails = wrong;
    assert.equal(generationContract.schema.safeParse(reply).success, false);
  }
});
function fixtureSession(replies: unknown[]) {
  const inputs: any[] = [];
  const session: ClaudeSession = {
    model: "offline", helperModel: "offline", formatFailures: [],
    calls: { generation: 0, critic: 0, expansion: 0, refusals: 0, lookup: 0 },
    async json(stage, _prompt, input, contract) {
      assert.ok(contract);
      session.calls[stage]++;
      inputs.push(input);
      return replies.shift();
    },
  };
  return { session, inputs };
}
test("bad generation reply gets exact validation errors once, then corrected concepts are validated", async () => {
  const good = sample(generationContract.tool.input_schema), bad = structuredClone(good);
  bad.ideas[0].sourceDetails = "old broken format";
  const { session, inputs } = fixtureSession([bad, good]);
  assert.deepEqual(await requestTool(session, "generation", "test", { tastes: [] }, generationContract), good);
  assert.equal(session.calls.generation, 2);
  assert.equal(session.formatFailures?.length, 1);
  assert.match(inputs[1].formatCorrection.errors[0], /ideas.0.sourceDetails/);
  assert.deepEqual(inputs[1].formatCorrection.previousReply, bad);
});
test("critic correction has the same one-repair cap; format errors are not quality rejections", async () => {
  const { session, inputs } = fixtureSession([{ verdicts: "wrong" }, { verdicts: "still wrong" }]);
  await assert.rejects(requestTool(session, "critic", "test", {}, criticContract), ToolFormatError);
  assert.equal(inputs.length, 2);
  assert.equal(session.calls.critic, 2);
  assert.equal(session.formatFailures?.length, 2);
  assert.match(inputs[1].formatCorrection.errors[0], /verdicts/);
});
test("Sonnet-compatible transport uses auto plus one strict tool, never forced choice or prose JSON", async () => {
  const old = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  try {
    const good = sample(generationContract.tool.input_schema);
    const session = createClaudeSession(async (_url, init) => {
      const body = JSON.parse(init!.body as string);
      assert.deepEqual(body.tools, [generationContract.tool]);
      assert.deepEqual(body.tool_choice, { type: "auto", disable_parallel_tool_use: true });
      return new Response(JSON.stringify({ stop_reason: "tool_use", content: [{ type: "tool_use", name: generationContract.tool.name, input: good }] }));
    });
    assert.deepEqual(await requestTool(session, "generation", "test", {}, generationContract), good);
    assert.equal(session.calls.generation, 1);
    assert.equal(session.formatFailures?.length, 0);
    await assert.rejects(session.json("generation", "test", {}), /Tool contract required/);
  } finally {
    if (old === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = old;
  }
});
