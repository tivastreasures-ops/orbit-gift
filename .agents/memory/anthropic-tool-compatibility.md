---
name: Anthropic tool compatibility
description: Strict schema decoding and forced tool selection are different model capabilities.
---

Claude Sonnet 5.5 rejects forced `tool_choice: tool` and `any`; Anthropic documents `auto` with strict tools as the supported alternative.

**Why:** A structured-contract live attempt stopped at HTTP 400 despite a working key and successful helpers. The model compatibility table explicitly documents that restriction. Schema validation tests alone did not catch an unsupported request mode.

**How to apply:** Check the exact configured model against Anthropic's current forcing-tool-use table before choosing request settings. Treat strict schema decoding and forced tool selection as separate capabilities. Model/provider HTTP rejection is not a model-reply format failure or a gift-quality rejection. Keep these failure categories distinct in reports.

Source checked 2026-10-31: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use#forcing-tool-use
