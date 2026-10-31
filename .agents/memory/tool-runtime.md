---
name: Tool runtime capture limits
description: A notebook capture failure can happen after external mutations succeeded.
---

Keep large fetched documentation and repository snapshots out of long-lived notebook variables. Drop raw payloads after extracting needed facts.

**Why:** A long session exceeded the notebook's 32 MiB capture limit after a GitHub push had already succeeded and its remote commit had been verified. The tool reported failure and reset notebook state, but the external mutation remained applied.

**How to apply:** After a capture/reset error, trust explicit successful mutation/verification output and check remote state before retrying. Never blindly repeat a push, purchase or other side effect because the enclosing notebook reported failure. Use small delta updates rather than retaining multiple full snapshots.
