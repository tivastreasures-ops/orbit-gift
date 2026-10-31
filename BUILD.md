# Orbit & Wonder — Build record

## Source and scope

Source: `attached_assets/orbit-and-wonder-spec_1793409177410.md`, dated October 30, 2026. Followed: overview and five-screen MVP; features/data model; server adapter and code rule check; Out of This World visual amendment; wish-list cards; sharePurpose amendment; Monday completion/delivery contract; final privacy/palette tweaks; Hinterwelle checks; wait-for-art handoff; COPY DECK; repo/documentation handoff.

Excluded as specified: accounts, database persistence/sync, product purchase links, gift calendar, wrapping/message generator, shared profile imports, PNG parsing, automatic return imports, 3D/orbit controls.

## Decisions and build sequence

1. Created a standalone React/Vite/TypeScript web application at `/`, keeping the shared Express API at `/api`.
2. Defined the taste lookup and gift-generation OpenAPI contracts, then generated React Query hooks and server Zod validators.
3. Started frontend implementation from the attached specification. All profile/save/edit/delete operations remain browser-side; server calls are transient lookup/generation.
4. Configured Replit AI Integrations for OpenAI. The backend uses actual LLM responses when Qloo is empty or unavailable. No Qloo key is embedded or assumed.
5. Implemented a server-only interchangeable taste adapter with `searchEntity`, `getRelated`, and `describe`; explicit mock adapter is for development, not a hidden runtime substitute.
6. Implemented structured candidates plus a deterministic refusal/ownership/rejection/duplicate/budget check. Common aliases include pink shades, dresses/gowns, Microsoft/Windows product families, leather, wool, candles. Failed ideas are never displayed. Fewer than six accepted candidates returns an empty result rather than a misleading partial set.
7. Implemented the five screens: recipient details, loves and match correction, hard no's and ownership, six results and refinement, Keepers with multi-recipient lists and copy/remove.
8. Implemented sharePurpose on the device, purpose-specific recommended templates and opening lines, four card layouts, isolated export editing, and public-name/budget privacy.
9. Implemented recipient-facing blank I'm Stumped completion URL, live canvas rendering, portrait/square reflow, blank/completed PNG exports, native share plus download fallback, dynamic branding/footer.
10. Added MIT license, README, this build record, ignore rules, and public repository delivery.

## Copy-deck rule

No original interface prose is approved. Supplied COPY DECK strings are verbatim; template labels/titles also come from supplied spec wording. Dynamic user entries, canonical entity names, gift attributes, budgets, and URLs are data, not newly authored static interface copy. Missing wording must appear as `[COPY NEEDED: purpose]`.

### Missing copy inventory

The following 21 purposes remain explicitly marked `[COPY NEEDED: …]`. Some appear only as accessible labels or on the blank export:

1. `settings button label`
2. `settings panel title`
3. `close settings button label`
4. `app name setting label`
5. `tagline setting label`
6. `back button label`
7. `recipient not found message`
8. `remove chip button label`
9. `minimum budget field label`
10. `maximum budget field label`
11. `link to edit this person's loves/no's and find more gifts`
12. `toggle for typing returned I'm Stumped answers into this profile`
13. `button: add returned answers to profile`
14. `back to edit loves and no's link`
15. `retry button label`
16. `label: fill from a saved profile or start blank`
17. `option: start blank`
18. `button: send fillable completion link`
19. `toast: fillable link copied`
20. `label on blank PNG saying it is for print/manual completion`
21. `404 page message`

Template titles and field labels use the exact text supplied in the template/art sections of the spec. No unsupplied wording was invented for these gaps.

## Artwork status

**All card artwork remains temporary blank slots.** Eight final files (four main and four neutral) must be uploaded and explicitly approved by the Director before integration. No AI art was generated; no substitute final illustration was commissioned. Live text placement is provisional until the backgrounds arrive.

Final art must have blank live-text/footer areas and original constellation signature. Palette refusals apply to the entire exported card. Neutral selection must preserve Hinterwelle's no-pink constraint; if a neutral palette colour itself is refused, do not assume that neutral is automatically eligible.

## Privacy and reliability

- No accounts, application database, image uploads, server-side recipient storage, or tracking.
- Local profile/keeper reads and writes must be try/catch guarded.
- Completion links contain template only, never giver profile data; completion editor does not persist its answers.
- API credentials are server-only. Logging excludes request bodies and sensitive headers.
- AI processing sends the supplied preferences to the server/provider transiently. Approved privacy copy describes storage, not a guarantee of offline computation.
- Plain-code metadata matching cannot independently establish the truth of model-supplied colour/material attributes; conservative filtering and real-world acceptance checks remain necessary.
- Secret creation tooling supports secure user input, not agent-created empty secrets. `QLOO_API_KEY` is intentionally absent until an empty secret can be created through Tools → Secrets; runtime treats absent and empty identically.

## Open items

- Director uploads/approves eight backgrounds; final overlay/signature and both-size artwork checks follow.
- Director supplies missing UI strings listed below.
- Create empty `QLOO_API_KEY` in Replit Secrets; fill later when desired.
- Real Android Chrome share-sheet testing, separate-device completion, and the full three-round Hinterwelle acceptance exercise remain release checks; no physical-device result is claimed.
- Qloo live adapter needs credentialed smoke testing after a key is supplied.
- No published production URL exists yet; request URLs work on their current accessible origin.

## Session log — 2026-10-30

- Read and applied the Director's complete attached spec and exact-copy/art/privacy constraints.
- Created application and API contract; enabled LLM fallback; built deterministic filtering and server adapters without a database.
- Built frontend/share export flow with intentionally blank art and prepared public MIT-licensed source delivery.
- Verification and repository receipt are appended below when available.

### Verification

- Workspace-wide TypeScript check passed for shared libraries, Express, web app, sandbox, and scripts.
- Both application workflows start and serve cleanly. Mobile-size (402×874) preview inspected without browser errors.
- Real server request using the six Hinterwelle loves, no pink/dresses/Microsoft/Windows, and broad record ownership returned six eligible ideas with `fallback: true`, positive metadata, and all checked rules. This is a backend smoke check, not a claim that the three-round phone acceptance test passed.
- Completion editor and share/export paths were inspected for blank-state isolation and template-only links. Physical Android and cross-device tests have not been run.
- Completed hard-no enforcement for neutral blank-card palettes as well: neutral is not exempt, and unresolvable palette conflicts fail instead of exporting a forbidden colour.
- Added standalone blank-card download to recipient completion and long-token wrapping for printed URLs/entries.
- Removed starter error-boundary wording so even failures use supplied copy or explicit missing-copy markers.
- `node scripts/src/check-secrets.mjs` scans the complete source snapshot before upload without reading environment secret values or printing matched credentials.

### Repository delivery

Public repository: https://github.com/tivastreasures-ops/orbit-gift

Source is uploaded through the authorized Replit GitHub connection as a new snapshot, not by exposing credentials or copying private Git history. The final commit hash is reported in the handoff; the hash is not embedded in the commit itself.
