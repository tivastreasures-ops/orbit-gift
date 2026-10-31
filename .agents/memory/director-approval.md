---
name: Director approval rules
description: Standing content, artwork, and MVP boundaries from the Orbit & Wonder Director.
---

Use the supplied COPY DECK verbatim. Do not invent user-facing copy; mark missing wording `[COPY NEEDED: purpose]` and include it in the report.

**Why:** The user explicitly requires control over all user-facing wording.

**How to apply:** Check the attached Orbit & Wonder build spec and the Director-approved supplemental copy in BUILD.md before UI or export copy changes. The Director supplied replacements for all original copy gaps; do not reintroduce placeholders for those approved purposes.

The Director approved and supplied the eight final share-card backgrounds (four main, four neutral) and the exact text-slot JSON on 2026-10-30. Use that set unchanged; do not substitute, regenerate, crop square cards or revert to blank placeholders.

**Why:** The user explicitly approved this set and asked for integration; this supersedes the earlier hold on blank art slots.

**How to apply:** Keep approved PNG bytes unchanged. The Director's later layout changes supersede the original slot geometry: remove card budgets and Because notes, retain fitted/clipped text, and reserve a personal-sky corner and link/QR strip. Square exports contain the whole portrait on the starry background. New art still needs explicit Director approval; hard-no colours select neutral and cannot be recoloured away.

Do not restore a printed name or name-entry control without an approved name slot.

**Why:** The final approved slot map has no name box; inventing a position would violate the Director's exact geometry and could expose a saved private name.

**How to apply:** Keep the recipient's name in the app's profile/universe, but require a Director-supplied slot before adding it to these share-card images.

No accounts or database in this MVP; browser-local profiles/keepers, no automatic returned-PNG import.

**Why:** The Director specified a no-account, device-local gift workflow with manual return entry.

**How to apply:** Do not expand persistence or sharing beyond this contract without explicit direction.

All app AI calls must use the direct Anthropic API, not Replit AI Integrations or OpenAI. Missing keys or API failures must use existing error copy, never another provider.

**Why:** The Director explicitly rejects Replit AI Integrations/OpenAI for this product.

**How to apply:** Keep credentials server-only; check Anthropic's current documentation when changing the Sonnet default. A cheaper helper may still be Claude. Qloo remains optional/later, not a required key or substitute AI provider.

Share-card budgets are removed, not merely hidden; the gift-search budget remains separate. All I Want has four one-line wishes and no Because fields.

**Why:** The Director said budget “doesnt make sence if someone is filling it out for someone else.”

**How to apply:** Do not restore budget fields/slots in stationery. Excess wishes are dropped with a UI-only note, never printed on the card.

The Librarian supplies replacement POP/Neutral backgrounds and transparent base-world PNGs by hand. Until approved uploads arrive, keep existing card PNGs and code-drawn world placeholders.

**Why:** The Director prohibits generated or edited card art and wants live, person-specific constellations rather than regenerated images.

**How to apply:** Keep layout shared by POP/Neutral, support painted-title suppression, and preserve the same name/loves-seeded pattern across Results, Keepers and miniatures. Published links only on cards; when no published domain exists, show the brand alone and no QR.

Unfinished answers must survive failures/reloads, including the public fill-in form, but blank completion links must never prefill from giver profiles or another tab's response.

**Why:** The Director requires no lost answers while the no-account sharing design keeps giver data private and completion cards blank for new responders.

**How to apply:** Keep profile/share drafts device-local and public completion drafts tab-isolated; never put personal answers into a completion URL.
