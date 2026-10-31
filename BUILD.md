# Orbit & Wonder — Build record

## Director / Professor / Librarian upgrade — 2026-10-31

This section supersedes older current-state notes below. Order followed: recommendation reliability, disambiguation/copy, cards, then personalized skies. No card PNG pixels were changed, no new art generated, and no accounts, payments, tracking or shopping integrations added.

### 1. Recommendation failure: causes and fixes

- **Provider request root cause:** Claude Sonnet 5.5 rejects forced `tool_choice: tool`/`any` with HTTP 400, despite a valid key and successful helper calls. Checked Anthropic's current forcing-tool-use table. Generation/critic now use strict tool schemas with `auto` and disabled parallel tools. Direct Anthropic only, existing `ANTHROPIC_API_KEY`; model/helper default `claude-sonnet-5-5`. No credentials were viewed, logged or committed.
- **Wire-contract root cause:** legitimate `sourceLoves: []` whole-sky fallback was allowed by runtime logic but rejected by the generated response validator's `minItems: 1`. OpenAPI now permits zero sources and generated server/client validators agree. No source connections are invented.
- **Timeout/error handling:** overall server search budget 110 seconds; individual Claude calls 70 seconds; browser request 130 seconds. One automatic transient/network/timeout retry only. Server logs real sanitized error stage/type/status, not upstream bodies, keys or input payloads. Reviewed ideas survive a failed refill/critic.
- **Answer preservation:** recipient/context/budget/loves/no's/owned fields, unsubmitted editor drafts and pending bodies are saved locally before submission. Retry/reload uses the saved body and the same idempotency key; failed server jobs are evicted, in-flight work and successful responses can be reattached. New intentional searches get new keys. Successful cached jobs expire after ten minutes; pending/cache counts are bounded. Disconnects release the HTTP concurrency slot exactly once, without cancelling shared work.
- **Error copy:** “The stars didn't line up that time. Your answers are saved. Try again?” with Retry. Existing partial/no-list-won copy remains. Objective hard-no expansion checks, whole-word owned checks, budgets, duplicates and plain-merch exclusions remain strict in code. Semantic quality/kind/source meaning stays with the critic. No provider fallback.

### 2–3. Disambiguation and exact copy

- Plain colors, color/colour prefixes/suffixes, case variations and trailing punctuation bypass ambiguity questions and Wikipedia. Genuine ambiguity uses human-language options plus Something else; generic “entity” labels are removed.
- Home headline: “Find the gift that's in their orbit.”
- Home subline: “Tell us what they love. Tell us what they'd never be caught dead with. We'll map the rest.”
- Share page: “Everyone has their own constellation. Learn theirs.”
- App typography stays Josefin Sans / DM Sans. New typed card answers use Google Caveat only.

### 4–5. Card fields, stationery and swap-readiness

- Removed card budgets from editor/data/slots/rendering, including both Secret Santa budget slots. This does not remove the separate gift-search budget.
- All I Want: no Because fields/slots; four single-line wishes, shrink/ellipsis, UI-only warning for extra prefilled wishes. This or That: seven per column.
- Blank exports draw light ruled answer lines. Empty filled answers show faint prompts. Stumped's send-back sentence is blank-only; the slot default is actual approved text, not an embedded instruction bracket.
- Footer is Made with Orbit & Wonder plus a short verified public link only. Deployment inspection found **no published domain**. Current app therefore prints brand alone; development/localhost URLs are rejected even in explicit renderer overrides. Optional actual QR support is implemented but disabled until a valid public link exists. Request-card links occur once, replacing rather than duplicating footer URLs.
- Eight-thumbnail horizontal POP/Neutral paper shelf. One geometry entry per layout, shared by both versions; existing filenames remain the import seam. `paintedTitles` suppresses code-drawn title/labels for future painted art.
- Every layout reserves a personal-sky corner and link/QR strip. Dev-only `/dev/cards` shows short/long samples and slot/reservation outlines; production does not register this route. Original art stays untouched until the Librarian uploads replacements.
- Font/box fit remains maxFont → minFont → maxLines → ellipsis with clipping. Portrait remains 1080×1350; square contains the full portrait at 864×1080, centered, on starry 1080×1080, never cropped.

### 6. Personal worlds and live constellations

- Six category-selected placeholders: ringed giant, ocean, ember, ice/crystal, garden moon, nebula. Manual world choice persists per person. Optional world `art` URLs accept approved transparent PNGs from App Storage later, in both SVG and PNG export.
- Name + ordered loves seed the pattern. Device chip IDs do not affect positions, ensuring the same person/profile sky in Results, Keepers and card miniatures. Selected saved-profile cards use the complete profile, not only the three visible Santa entries; blank-start/Stumped cards derive stars from typed answers.
- Named love stars are tappable and accessible; More like this brightens source stars, rejected sources dim/cross out, and private no-list asteroids stay on the outer belt. Lines follow the ring, not through the planet. Live edits update code-drawn skies; reduced motion is static.
- Results retain a clearly visible personal constellation. Results/share use warm cream/gold paper framing. Neutral card miniatures use warm monochrome, never introducing pink; future world PNGs are desaturated on neutral cards.

### Verification and live outcome

- TypeScript workspace check: **PASS**.
- Frontend production build: **PASS** (`PORT=22717 BASE_PATH=/`); API production build: **PASS**.
- Offline regression: **45 tests PASS**, including emitted-tool-schema samples, one correction with exact validation paths, tool transport, strict objective exclusions, job concurrency/retry/cache, empty-source wire response, color bypass, stable person/card stars, and clear reserved sky corners.
- Browser card QA: **48 PNG cases verified, zero failures** (three profiles × four layouts × two versions × two sizes). An initial Stumped check caught an instruction fragment in the request default; fixed and reran its 12 affected cases, preserving the 36 unchanged passing cases. Also checked blank-only copy, real optional QR rendering, dev-link rejection, timeout retry classification, native download and exact square containment.
- Phone home screenshot: correct copy/layout, no browser errors. Critical-flow browser pass at 402×874 and 1440×1000: intercepted all generation requests (zero paid calls), verified two 503s trigger exactly one same-body/key automatic retry, exact useful error, reload preserves answers/error, manual Retry restores three synthetic ideas/two kinds, and loves/no's/owned/context remain. Save/reject and More like payloads worked; Ocean override persisted, Results/Share had no page overflow, all eight papers and seven/four-row mappings worked, and blank PNG/calibration/brand-only footer worked. Synthetic output is not counted as live Claude output.
- The initial browser observation of manual Retry used a new key; final code deliberately reuses the pending key for inflight/cached reattachment. Shared-job/failure-eviction behavior is covered offline.
- That pass caught completion-form fields disappearing during a dev-server reconnect. Fixed the underlying in-memory-only draft: completion now uses **isolated sessionStorage** (never giver-profile/localStorage data), preserving all four answers on reload while a fresh tab stays blank. Share editor fields/template/paper/source/size/world also persist locally. Targeted `pnpm --filter @workspace/scripts exec tsx src/card-draft-qa.ts` **PASS**, with all generation requests blocked. Affected TypeScript and frontend production build rerun **PASS**.
- Minor verification caveats: fixture source overlap combined rejected/brightened star state, so isolated brightening was not independently measured; desktop home Keepers highlight is cosmetic. No second browser tester or additional paid profile run was started.
- One gated live evaluation only: Hinterwelle passed first with no format failures, then each remaining profile ran once. **No profile was rerun.** Full ideas/rejection reasons appear in the generated evaluation section below.

| Profile | Ideas shown | Kinds | Claude calls | Format failures | Outcome |
| --- | ---: | --- | ---: | ---: | --- |
| Hinterwelle | 8 | All six | 4 | 0 | Pass |
| Wolfboy | 7 | object, experience, maker, collectible | 6 | 0 | Safe partial; second critic hit overall timeout |
| Mira | 11 | All six | 4 | 0 | Pass |
| Sol | 10 | All six | 5 | 2 helper failures, recovered | Pass with helper recovery |

Sol's first refusal reply exceeded the terms cap and first taste-expansion reply was invalid JSON. Helpers recovered/degraded safely and generation/critic tool replies had **zero** format failures. The conservative live CLI exits nonzero for any recorded helper-format failure; this is disclosed, not reported as a clean all-green run. Total Claude calls: **19**, including Wolfboy's aborted refill critic. Expansion/refusal/generation/critic counts are in the live report.

Follow-through: README updated; source secret-pattern scan and whitespace check pass. Both managed services restarted and served the app/PNG requests. GCS deprecation and PassThrough listener-count warnings were observed despite successful PNG delivery; an optional investigation was proposed, without claiming a proven leak or hiding the warnings. A reusable mocked browser recovery regression was also proposed. Public GitHub snapshot push and local checkpoint identifiers are reported in the completion message. New PNG art and a published URL remain external inputs, not invented placeholders or dev-link substitutions.

## Source and scope

Source: `attached_assets/orbit-and-wonder-spec_1793409177410.md`, dated October 30, 2026. Followed: overview and five-screen MVP; features/data model; server adapter and code rule check; Out of This World visual amendment; wish-list cards; sharePurpose amendment; Monday completion/delivery contract; final privacy/palette tweaks; Hinterwelle checks; wait-for-art handoff; COPY DECK; repo/documentation handoff.

Excluded as specified: accounts, database persistence/sync, product purchase links, gift calendar, wrapping/message generator, shared profile imports, PNG parsing, automatic return imports, 3D/orbit controls.

## Decisions and build sequence

1. Created a standalone React/Vite/TypeScript web application at `/`, keeping the shared Express API at `/api`.
2. Defined the taste lookup and gift-generation OpenAPI contracts, then generated React Query hooks and server Zod validators.
3. Started frontend implementation from the attached specification. All profile/save/edit/delete operations remain browser-side; server calls are transient lookup/generation.
4. All current AI calls use the direct Anthropic Messages API. The original OpenAI/Replit AI Integration implementation has been removed. No Qloo key is needed now.
5. Implemented a server-only interchangeable taste adapter with `searchEntity`, `getRelated`, and `describe`; explicit mock adapter is for development, not a hidden runtime substitute.
6. Implemented structured candidates plus a deterministic refusal/ownership/rejection/duplicate/budget check. Common aliases include pink shades, dresses/gowns, Microsoft/Windows product families, leather, wool, candles. Failed ideas are never displayed. Fewer than six accepted candidates returns an empty result rather than a misleading partial set.
7. Implemented the five screens: recipient details, loves and match correction, hard no's and ownership, six results and refinement, Keepers with multi-recipient lists and copy/remove.
8. Implemented sharePurpose on the device, purpose-specific recommended templates and opening lines, four card layouts, isolated export editing, and public-name/budget privacy.
9. Implemented recipient-facing blank I'm Stumped completion URL, live canvas rendering, portrait/square reflow, blank/completed PNG exports, native share plus download fallback, dynamic branding/footer.
10. Added MIT license, README, this build record, ignore rules, and public repository delivery.

## Copy-deck rule

No original interface prose is approved. Supplied COPY DECK strings are verbatim; template labels/titles also come from supplied spec wording. Dynamic user entries, canonical entity names, gift attributes, budgets, and URLs are data, not newly authored static interface copy. Missing wording must appear as `[COPY NEEDED: purpose]`.

### Director-approved supplemental copy

All 21 previous gaps are resolved by the Director's exact strings. The Director also supplied the saved-profile option format. No currently used interface or export string remains unresolved. Future unsupplied wording still renders `[COPY NEEDED: purpose]`.

| Purpose | Approved wording |
| --- | --- |
| Settings button | Settings |
| Settings panel title | Fine-tune the sky |
| Settings close | Done |
| App-name label | App name |
| Tagline label | Tagline |
| Back button | Back |
| Recipient not found | Can't find that person. This browser may have forgotten them. |
| Remove chip, screen readers | Remove [ITEM] |
| Minimum budget label | From $ |
| Maximum budget label | Up to $ |
| Keepers edit link | Edit their loves and no's |
| Returned-answers toggle | They sent answers back |
| Add returned answers button | Add their answers |
| Results back link | Change their loves and no's |
| Results retry | Try again |
| Sharing start label | Start from |
| Saved-profile option | [NAME]'s profile |
| Start-blank option | A blank card |
| Send fillable link button | Send the fill-in link |
| Link copied toast | Link copied. Go send it. |
| Blank PNG label | Print it, write on it, send a photo back. |
| 404 page | This corner of the sky is empty. Head home. |

`[ITEM]` and `[NAME]` are replaced only with the actual chip text and saved profile name. The budget labels are visible as well as accessible. PNG labels use the same approved copy as the interface. Template titles and field labels retain the original COPY DECK.

### Director typography and constellation revision — 2026-10-30

- Removed Fraunces and Outfit from all interface styles and PNG canvas text/font loading.
- Google Fonts: Josefin Sans 300 for large headings, 400 for the wordmark, 600 with wide letter spacing for small caps. DM Sans 400/500 for body, buttons, chips, and gift cards, including saved gift titles. Phone headline/body sizing stays readable.
- The decorative logo is an SVG wrapped gift box with a bow, nine glowing stars (two bright gold, seven soft white), and thin gold connecting lines.
- The home hero retains the purple planet as the person. Eight varied gold/white stars span the orbit, linked with 1px, 50%-opacity gold lines. Lines draw once via stroke-dashoffset; stars then twinkle. Unique SVG filter/gradient IDs prevent clashes.
- Screen 2 uses one orbit star per actual love chip, adding a new star immediately. Golden-angle placement spreads the stars around the whole orbit without moving existing stars on append; removal can redistribute the remaining constellation.
- Results use the same planet/love constellation with six sequentially igniting gift stars. Source matching is now superseded by the exact-only policy below; deleted or unknown source loves never create a connection.
- Gift paths and stars are decorative (`aria-hidden`), never navigation. Gift cards and headings remain fully readable without animation. Both OS reduced motion and the in-app switch show static, fully drawn SVGs.
- No Three.js, generated artwork, or final card backgrounds were added. The eight blank card-art slots are unchanged.
- Verification: targeted web TypeScript check passed; production Vite build passed with `PORT=22717 BASE_PATH=/`. Phone screenshots are captured after fonts and the one-time draw animation settle. Generated screenshots are ignored by Git and deployment.
- Focused real-browser review at 402×874: home and results have no horizontal overflow; live generation returned six readable gift cards with six gift stars and six connecting lines. Computed heading/wordmark/small-caps/gift-title fonts matched the requested families and weights. OS reduced-motion emulation left all six gift stars visible and their lines fully drawn. Settings opened and closed with Done; no missing-copy marker appeared.
- Approved-copy audit resolved all 24 literal supplemental-copy call sites and checked both dynamic `[ITEM]`/`[NAME]` substitutions. Real Android sharing and the full cross-device acceptance checklist remain separate, unverified release checks.

## Director universe and gift-quality revision — 2026-10-30

### Universe, labels and interaction

- Keepers retains recipient tabs, saved cards, copy/remove controls, returned-answer form and profile sidebar. A recipient-specific universe now sits above the cards: central planet, love stars, and one small outer-belt asteroid per hard no.
- The shared interactive SVG is used on Results, Keepers and Screen 2. Gold love stars support a saved keeper; all other loves are soft lavender. Selecting a gift temporarily highlights only that gift's genuine source stars and paths.
- Love stars show short labels, with full approved name/idea-count details on tap, hover, focus or keyboard activation. Hard-no asteroids reveal their actual text on tap/focus. Touch hit areas are larger than the drawn points; hover/focus preview and committed tap state are separate so a first tap does not accidentally close its own label.
- Love connections follow angle-ordered ring arcs rather than chords. Gift paths travel radially outward then around the outer ring; unit checks cover every segment against a 50-unit central exclusion radius (planet radius 46).
- Every Results and saved gift card has a one-source/two-source chip beneath the title. Card-body taps and keyboard-operable source chips select the same sources, without hijacking Keep/Not this/More like this/Remove controls.
- New server responses include canonical `sourceLoves` and `kind`. Legacy browser data may lack them. Source matching is exact after Unicode normalization/case/spacing only: explicit source names first, then an exact legacy `because`, then an exact two-part legacy ` + ` value. Any missing/deleted source causes the whole-sky fallback and no line; partial, fuzzy and substring guesses are prohibited.
- Saving/deleting or changing recipient recalculates universe counts and gold stars. A profile with no loves still retains its planet/no-list belt and shows the approved empty-universe sentence.
- Removed the old grey filtered-count blobs entirely (the Director permitted removal). The no-list belt is distinct, labelled and based only on actual refusal chips. Quality-rejected candidates are not falsely captioned as hard-no failures.
- The hint appears once per browser session. Interaction state remains in the device; no new server storage, analytics, account or sharing path was added. OS/in-app reduced motion leaves all paths/stars drawn and cards readable.
- The share-card renderer and all eight art slots are unchanged in this round. No image generation, background integration or card-art approval occurred.

### Exact additional Director copy

`[NAME]'s universe`; `[N] loves · [N] hard no's · [N] keepers`; `Behind a keeper`; `Still exploring`; `The no list`; `The no list: [REFUSALS]`; `[NAME]'s constellation`; `[LOVE] · [N] ideas`; `Tap a star to see what it's about.`; `From: [LOVE]`; `From: [LOVE] + [LOVE]`; `From: the whole sky`; `[N] ideas didn't survive the no list.`; `No stars yet. Add something they love.`

Giver-only profile/returned-answer headings: `Things they love`, `Hard no's`, `Already has`. Recipient-facing completion and all on-card COPY DECK text remain unchanged. The rejected-asteroids caption is approved and stored, but unused because the blobs were removed.

### Idea generation and deterministic quality checks

- Exactly one accepted idea per kind: object, experience, consumable/treat, handmade/small-maker, collectible, wildcard. Retries target only missing kinds; after three rounds return six or none, never pad a round with generic substitutes or repeat kinds.
- Each candidate identifies one or two exact supplied loves. Two sources must be different; a one-source candidate must include the supplied occasion or relationship, not an invented context. Internal source/context evidence must appear concretely in the idea's title. These internal explanations are not displayed as interface prose.
- Generic t-shirt/hoodie/mug/poster/wall-art/phone-case/tote suggestions fail without a named maker or specific named item actually in the title. Named-item metadata cannot merely repeat a generic category. Colour/context labels alone are not an idea.
- Maker, experience, consumable and collectible kinds need positive supporting metadata. All candidates still pass the existing hard-no/ownership/rejection/duplicate and budget checks; no rule is weakened to fill a quota.
- Rejected contract violations are fed back into the next generation round, without exposing candidate/user data in HTTP logs.
- Historical model decision (superseded by the direct-Claude revision below): stronger generation replaced the initial small model because it repeatedly failed the multi-interest/context contract. The same quality gates remain intact in the Claude pipeline.
- The prompt prohibits fictitious official collaborations, invented editions, availability and exact-price claims. Paired real items, handmade concepts and one-love-plus-real-context ideas are preferred over fabricated crossover products. Positive metadata checks cannot independently verify catalogue existence, factual model claims or semantic relevance; these are gift ideas, not verified purchasable listings.

### Verification

- Workspace-wide TypeScript check and production Vite build passed.
- Fifteen focused unit tests cover generic-merch/colour/context/source gates, retained hard-no/owned/rejected checks, Unicode source identity, exact legacy matching, deleted-source fallback, stable appended-star positions, and all line segments avoiding the central planet.
- A real LLM generation returned six accepted ideas spanning all six kinds with canonical source metadata; earlier incomplete rounds correctly returned no ideas rather than bypassing the quality gates.
- Phone browser review and requested Results/Keepers screenshots are recorded in the handoff. This is not a physical Android sharing or full three-round acceptance claim.
- The focused 402×874 Results→Keepers browser pass confirmed star/asteroid tap details, source-chip selection without triggering card controls, saving, universe counts/gold source stars, profile retention and keeper persistence after reload. Transient source selection intentionally resets on reload. Neither page had horizontal overflow. Qloo's backup notice denotes the real LLM-only adapter, not mock gift data.

## Share-card artwork status before approval (historical)

**All card artwork remains temporary blank slots.** Eight final files (four main and four neutral) must be uploaded and explicitly approved by the Director before integration. No AI art was generated; no substitute final illustration was commissioned. Live text placement is provisional until the backgrounds arrive.

**Superseded:** the Director subsequently supplied and approved the eight final PNGs and slot map. The final integration record below is current.

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


## Director direct-Claude and taste-pipeline revision

### Provider and configuration

- Removed the OpenAI SDK dependency, its lockfile entry, GPT model literals, proxy base URL and all `AI_INTEGRATIONS_*` runtime code paths. Every remaining AI operation uses `https://api.anthropic.com/v1/messages` directly. Wikipedia search is not an AI call.
- Runtime credential: server-only Replit Secret `ANTHROPIC_API_KEY`. Metadata inspection found no available secret with that name. No key has been read, logged, embedded, committed or replaced with a dummy.
- Replit cannot store a truly empty secret; the Director must enter/link the key securely. A name in a setup guide is not a created secret. The secure request names the correct key without exposing its value.
- Non-secret `ANTHROPIC_MODEL` is set to `claude-sonnet-5-5`. Anthropic's [current model overview](https://platform.claude.com/docs/en/about-claude/models/overview), consulted during this change, lists Claude Sonnet 5.5 with that API ID. `ANTHROPIC_HELPER_MODEL` is intentionally unset: it defaults to the main model and can later be changed to a cheaper supported Claude model.
- No OpenAI connector was listed by the connected-integration check. Previously provisioned platform AI secret entries may still exist; they are unused, not falsely reported deleted. The available integration tools do not expose a disconnect action; if an old connection is shown in the project, remove it using Connectors → Manage. Do not remove unrelated account secrets.
- Missing Anthropic credentials, HTTP failure, timeout, truncated/invalid model JSON or invalid helper contracts fail closed into the existing approved error/empty copy. No provider fallback or canned runtime gift data exists. No Qloo key was requested; its adapter remains optional/later.

### Pipeline and safety

1. Free Wikipedia MediaWiki API supplies up to four ranked, real article matches in the existing “Did you mean” UI. Confirmed chip-to-entity pairs now reach generation explicitly; an unconfirmed exact article title may resolve automatically, while ambiguous alternatives are not guessed. Refusal chips no longer run cultural-entity searches.
2. A helper call turns resolved loves into structured specifics, eras, subgenres, adjacent artists/makers, aesthetics, signature objects and places, retaining exact source-love identity. Generation and critic receive this expanded profile, not a top-level raw-chip list.
3. A helper call expands only previously uncached refusals into related terms. Code unions these with original refusals and fixed aliases, including pink shades and Microsoft's product family/Office. Existing terms are not regenerated when one refusal is added.
4. Main Claude proposes about twelve candidates (normally two per missing kind). Code validates structured fields, budget, previous titles, ownership, original/expanded hard no's, substantive idea detail, context and source evidence before critique.
5. A separate helper critic scores specificity, genuine love/context combination, plausible budget, novelty/duplicates and kind fit. Code enforces thresholds (3/5 specificity/combination/novelty, 4/5 budget/kind), rejects critic failures and selects the highest-scored eligible candidate per kind.
6. Up to three generation/critic pairs repair missing kinds with precise deterministic/critic failures, matched forbidden terms and excluded titles. Only a full six-kind set is returned; exhausting repairs never pads an unsafe or partial set. This is the safety interpretation of “six always pass,” not an impossible guarantee during provider failure.
7. Rejection titles/reasons, owned items, accumulated device-local More like this seeds and prior titles reach both generation and critique. Hard no's always override positive seeds.

Taste expansions use bounded six-hour in-memory caches keyed by profile identity, loves/confirmed matches and helper model. Refusals have separate per-normalized-term/helper-model caches; failed promises are evicted. Wikipedia results cache for 24 hours. Restart clears all caches; no database or durable server recipient storage was added. Browser recipients/keepers remain unchanged, and completion-page storage isolation also covers the new seed key.

### Call budget and regression commands

- Typical cold search with uncached refusals: **4 Claude calls** = expansion + refusal expansion + generation + critic.
- Fully warm search: **2 Claude calls** = generation + critic. A cold profile without refusals normally uses 3.
- Each repair adds up to 2 calls; three pairs cap a cold search at **8** and a warm search at **6**. No eligible candidates means the empty critic call is skipped. Explicit API failures are not silently retried.
- Wikipedia typeahead: **0 Claude calls**. Actual successful search counts, stages, cache status and model names appear in the API's `diagnostics`; no credential or prompt is included.
- `pnpm test:gifts` runs deterministic contract/profile tests. It also runs before every API build. Fixtures are deliberately simulated test transports, never runtime substitutions or semantic/model-quality evidence.
- `pnpm test:gifts:live` performs real fixed-profile calls, writes the marked table below and fails on missing keys, missing fixtures or incomplete rounds. Run both commands after subsequent changes; never present a blocked live run as a pass.
- Fixed profiles: original Hinterwelle loves/no's (synthetic test budget $15–$90, Friend/Birthday, ownership of every Joy Division record); Director-confirmed Wolfboy (Partner/Birthday, $50–$150; wolfman, Frankenstein's Monster, Universal Monsters, DC Universe, Marvel Universe, Avengers, turquoise; no anime, salads, pop music, pink or Crunch Fitness; nothing listed as owned); fictional Mira (easy: birdwatching/lemon baking/ceramics/botanical gardens); fictional Sol (sparse: sourdough baking/astronomy). Full fixture constraints are in source.

### Verification and boundaries

- Workspace TypeScript checks and production Vite build passed; both workflows start cleanly. The latest deterministic count is recorded in the handoff after adding Wolfboy.
- Real HTTP checks: Wikipedia taste lookup returned Okkervil River as `band` and Okkervil as `river` with HTTP 200. A keyless gift request returned HTTP 503 and the existing “Lost the signal. Check your connection and try again.” copy, with no alternate-provider generation.
- Deterministic tests cover three defined fixed profiles, best-of-two selection per kind, four-to-two call cache reuse, profile invalidation, only-new-refusal expansion, forbidden-candidate replacement with exact repair feedback, critic failure/duplicate gating, feedback forwarding, failed-cache eviction, invented-source rejection, direct Anthropic-only transport and missing-key/no-fallback behavior.
- Wikipedia's real anonymous API returned both Okkervil River (band) and Okkervil (river). A regression test now preserves search ranking and classifies the definition rather than mistakenly matching “River” inside the band's proper name.
- Wolfboy's multiword hard no's preserve their meaning: pop music is not Funko Pop, and Crunch Fitness is not all fitness. Original full phrases and recognized hard-no aliases remain mandatory; helper expansion is instructed not to add those unrelated homonyms.
- Live Claude samples for Hinterwelle/Wolfboy cannot be supplied until a key is available. The table below records the actual blocked status and zero calls.
- All eight share-card art slots and the share-card renderer remain untouched. No new interface copy was invented.

<!-- CLAUDE_PROFILE_EVAL -->
### Fixed-profile live evaluation — 2026-10-31T21:59:31.197Z

Hinterwelle alone first. The other three run once each ONLY if it shows ideas and has zero format failures.
At most two semantic generation rounds and one semantic critic pass per round; each malformed tool reply gets at most one format-only correction. Corrections count as Claude calls.
Model: `claude-sonnet-5-5`; helper: `claude-sonnet-5-5`.

| Profile | Result | Ideas shown | Kinds covered | Claude calls | Format failures |
| --- | --- | ---: | --- | ---: | ---: |
| Hinterwelle | PASS | 8 | object, experience, consumable, maker, collectible, wildcard | 4 | 0 |
| Wolfboy | PARTIAL | 7 | object, experience, maker, collectible | 6 | 0 |
| Mira (easy) | PASS | 11 | object, experience, consumable, maker, collectible, wildcard | 4 | 0 |
| Sol (sparse: two loves) | PASS (format repaired) | 10 | object, experience, consumable, maker, collectible, wildcard | 5 | 2 |

**Hinterwelle — ideas shown**
- object: Friesland porcelain teapot for proper Earl Grey brewing — $35–$80; sources: a good Earl Grey + German food
- object: Factory Records: The Complete Graphic Album book — $35–$60; sources: Joy Division
- experience: German baking or pretzel-making class for two — $40–$90; sources: German food
- consumable: Bavarian pretzel and sweet mustard snack box — $20–$50; sources: German food
- consumable: Harney & Sons Earl Grey Supreme loose-leaf tin — $15–$40; sources: a good Earl Grey
- maker: Hand-embroidered Badtz-Maru patch for a jacket — $15–$40; sources: Badtz-Maru + Joy Division
- collectible: Roky Erickson 'True Love Cast Out All Evil' vinyl, produced by Okkervil River's Will Sheff — $25–$60; sources: Okkervil River + The Black Angels
- wildcard: Record store credit with a handwritten list of adjacent-artist picks — $25–$75; sources: Okkervil River + Joy Division

**Hinterwelle — rejected ideas and reasons**
- [critic] Tickets to a local psych or indie-folk gig: A gig night out combines both bands' psych and indie-folk scenes and suits the friend relationship. It is loosely specified with no named show, but the budget is plausible and it is distinct.
- [critic] DIY fuzz pedal kit for a psych-rock fan: No named kit or maker is given, so it is generic. It also assumes the friend plays guitar or tinkers, which the profile doesn't support. The link to the love is only moderate.
- [critic] Vintage 1990s Sanrio Badtz-Maru item: 'Vintage 1990s Sanrio Badtz-Maru item' names no actual product. It is too vague to act on, and authenticity and pricing are uncertain.
- [critic] Liquid light show projector kit for a psychedelic listening night: A generic 'projector kit' names no real product or maker. Liquid-light kits are hard to source and quality is unclear, so it can't be verified as a truthful, actionable item.

**Hinterwelle — format failures**
- None.

**Hinterwelle — Claude calls by stage**
- {"expansion":1,"refusals":1,"generation":1,"critic":1,"lookup":0}

**Wolfboy — ideas shown**
- object: Universal Classic Monsters Complete Blu-ray Collection — $70–$140; sources: Universal Monsters + wolfman
- object: Aurora-reissue Wolf Man and Frankenstein monster model kits for a build night — $50–$90; sources: Frankenstein's Monster + wolfman
- experience: Classic horror double-feature night at a repertory cinema, with dinner — $50–$120; sources: Frankenstein's Monster + Universal Monsters
- maker: Custom hand-stamped silver and turquoise ring — $60–$150; sources: turquoise + wolfman
- maker: Hand-sculpted Wolf Man or Frankenstein's Monster bust by an independent artist — $60–$150; sources: Frankenstein's Monster + wolfman
- collectible: NECA Ultimate Wolf Man action figure — $50–$80; sources: wolfman + Universal Monsters
- collectible: Hasbro Marvel Legends Captain America shield replica — $90–$150; sources: Avengers + Marvel Universe

**Wolfboy — rejected ideas and reasons**
- [critic] Day at Universal Studios Hollywood, with a classic monsters theme: Tickets for two at Universal Studios Hollywood cost well over the $110-150 stated. The DC Universe link is just a side stop at a comic shop, so it is not a real combination.
- [critic] Mad-scientist cocktail kit with bitters, syrups and blue-green curaçao: No named kit or maker. Turquoise is only a drink colour, so this is a generic themed cocktail set.
- [critic] Classic monster movie-night snack crate with gourmet popcorn and dark chocolate: Generic snack crate with no named product or maker. Marvel is added as an afterthought and the link to the monsters is weak.
- [critic] Symbolic wolf adoption from a wolf conservation organisation: It treats the Wolf Man love as real wolves, which is a loose stretch. There is no named adoption program and only one love is used, so it feels generic.
- [critic] Tesla-style plasma globe for a Frankenstein lab corner: A generic unbranded plasma globe. Turquoise is only a glow colour, and the Frankenstein link is a loose lightning metaphor.

**Wolfboy — format failures**
- None.

**Wolfboy — Claude calls by stage**
- {"expansion":1,"refusals":1,"generation":2,"critic":2,"lookup":0}

**Mira (easy) — ideas shown**
- object: The Sibley Guide to Birds (2nd edition) for her birding life list — $25–$40; sources: birdwatching
- object: Emile Henry ceramic fluted tart dish for lemon tart — $40–$70; sources: lemon baking + ceramics
- experience: Early-morning guided bird walk through a botanical garden, with a picnic breakfast — $25–$75; sources: birdwatching + botanical gardens
- experience: Pottery wheel-throwing class for two — $50–$90; sources: ceramics
- consumable: Amalfi-style lemon treats box: lemon curd, lemon olive oil and lemon shortbread — $30–$60; sources: lemon baking
- consumable: Lemon verbena and herb tea sampler inspired by garden herb beds — $25–$45; sources: botanical gardens + lemon baking
- maker: Hand-thrown ceramic citrus juicer by an independent potter — $30–$70; sources: ceramics + lemon baking
- maker: Handmade ceramic bird feeder or bird bath from a small pottery studio — $35–$90; sources: birdwatching + ceramics
- collectible: Antique botanical plate from Curtis's Botanical Magazine — $35–$90; sources: botanical gardens
- wildcard: Potted Meyer lemon tree for her windowsill or patio — $35–$80; sources: lemon baking + botanical gardens
- wildcard: Cornell Lab of Ornithology gift membership — $30–$60; sources: birdwatching

**Mira (easy) — rejected ideas and reasons**
- [critic] Vintage mid-century studio pottery bud vase: Vintage mid-century studio pottery is a plausible collectible and the bud vase ties it to garden cuttings. It is less specific, with no named potter, but it is acceptable and distinct.

**Mira (easy) — format failures**
- None.

**Mira (easy) — Claude calls by stage**
- {"expansion":1,"refusals":1,"generation":1,"critic":1,"lookup":0}

**Sol (sparse: two loves) — ideas shown**
- object: Cast-iron Dutch oven for open-crumb loaves — $60–$80; sources: sourdough baking
- object: Tabletop planisphere and star-chart set for backyard stargazing — $20–$35; sources: astronomy
- experience: Planetarium show and observatory night for two — $30–$80; sources: astronomy
- experience: Small-group artisan bread-baking class for two — $50–$80; sources: sourdough baking
- consumable: Heritage and stoneground flour trio for country loaves — $25–$60; sources: sourdough baking
- maker: Custom hand-thrown ceramic banneton-style proofing bowl and lame set — $40–$80; sources: sourdough baking
- maker: Custom star map print of the night you met — $25–$60; sources: astronomy
- object: Vintage-style brass celestial globe or tabletop armillary sphere — $40–$80; sources: astronomy
- collectible: Tartine Bakery cookbook by Chad Robertson (signed or first edition if possible) — $25–$60; sources: sourdough baking
- wildcard: Pair of compact binoculars for stargazing and a moonlit loaf picnic — $40–$80; sources: astronomy + sourdough baking

**Sol (sparse: two loves) — rejected ideas and reasons**
- [critic] Night-sky honey and tea tasting box to enjoy while stargazing: No named product or maker. The "night-sky" label is generic theming, and honey and tea link only weakly to sourdough and astronomy.
- [critic] Name-a-star style adoption alternative: Sourdough starter named after a star, with a night-sky baking journal: The gift is a sourdough starter, which they already own as a basic starter jar. "Name-a-star style" is a contrived gimmick with no real product or maker.

**Sol (sparse: two loves) — format failures**
- refusals, attempt 1: refusals.0.terms: Array must contain at most 40 element(s)
- expansion, attempt 1: Response text is not valid JSON

**Sol (sparse: two loves) — Claude calls by stage**
- {"expansion":2,"refusals":1,"generation":1,"critic":1,"lookup":0}

PARTIAL means safe reviewed ideas are shown without full six-kind coverage. ZERO/ERROR or any format failure closes the Hinterwelle gate, even if a correction recovered it. No profile is re-run by this evaluator. Model JSON and trace files are ignored generated output, not committed. No simulated output is counted as a live run.
<!-- /CLAUDE_PROFILE_EVAL -->

## Director-approved final share-card art integration

### Exact source assets and storage

- Integrated exactly the supplied Secret Santa, All I Want, I'm Stumped and This or That main/neutral PNGs: eight files, each **1122×1402**. No substitute, generated image, crop, palette editing or illustration change was used.
- The large source PNGs are retained in **App Storage**, not added to Git or deployment bundles. The server manifest records each filename, SHA-256, dimensions, byte count and immutable object key. Every upload was downloaded again and its SHA-256 compared with the original bytes.
- Read-only `/api/card-art/{filename}` serves an allowlist of these eight public backgrounds, with ETags and cache headers. There is no public upload route or new accounts/database. Missing art fails with existing approved error copy rather than silently rendering blank.
- `src/lib/card-slots.json` is a byte-for-byte copy of the supplied `slots.json`; this map supersedes the old provisional geometry and static card headings.

### Text and layout

- Every title/heading/label uses **Josefin Sans** (300 for titles, 600 for headings/labels); entries/footer use **DM Sans 400**, in dark charcoal `#2C2A27`. Rendering waits for actual loaded fonts and fails instead of silently substituting.
- Coordinates scale from the 1122×1402 source to the 1080×1350 portrait. Each box starts at its maximum font, shrinks to its minimum, wraps to the permitted line/height limit, then ellipsizes. Grapheme-aware splitting handles unbroken strings; measured ink bearings are included. Each slot is also clipped as a final safety boundary.
- Secret Santa maps three loves, three rather-nots and budget to the lined boxes, with the approved small labels. Drop a hint suppresses both budget text and label.
- All I Want maps four wishes above the art lines and exact `Because... ` prefixes below. An already-typed prefix is not duplicated.
- This or That now has **seven editable/prefilled slots per column**. The title/subtitle occupy the centre gap between heading ovals; opening/footer use the bottom band.
- I'm Stumped uses the JSON's exact cloud title/request and four bubble labels/answers. The strip contains a template-only completion URL, or the approved blank-PNG sentence. URLs never contain the giver's profile or answers.
- The approved map contains no name slot. Removed the now-inactive share/completion name controls rather than inventing a text box or printing a saved private name. `RenderOpts.name` remains for source compatibility but is not drawn.
- Main-art colour refusals select the exact neutral image; both profiles' pink refusal selects neutral. Neutral is not assumed colourless: All I Want has pale blue/silver, and the neutral Stumped/This or That art contains mustard/yellow/gold. A conflicting neutral colour or square navy-background refusal fails closed; images are never recoloured.
- A **1080×1080 square contains the whole portrait**, scaled to 864×1080 at x=108 on the deterministic starry app background. No crop, no alternate layout and no missing bottom band.

### Verification and supplied review renders

- `pnpm test:card-art`: **48 exported PNG cases passed, zero measured text overflows** — four templates × Hinterwelle/Wolfboy/long-text stress × main/neutral × portrait/square.
- All 24 squares were compared pixel-for-pixel against the corresponding complete portrait scaled to 864×1080; all comparisons passed.
- Checks also confirmed dimensions, exact Stumped request/blank/link text, seventh Wolfboy love (`turquoise`), hint-budget suppression, ellipsis under stress, conservative pink-neutral selection and a real browser PNG download event.
- Visually inspected the rendered portraits, including seven-row This or That, Santa lined boxes, cloud request/bubbles and footers. No claim of physical Android native sharing is made.
- Eight requested portrait review files use Wolfboy's supplied profile: four forced-main review variants and four neutral variants. Forced main is **QA only** so both approved images can be reviewed; ordinary user export still selects neutral for this profile's pink refusal.
- The 48 PNGs and detailed placement report are generated output in ignored `generated-artifacts/card-art/`, not Git. The reproducible runner is committed as `pnpm test:card-art`.
- Workspace TypeScript checks and production Vite build passed. The fixed gift-profile suite includes the Director's complete Wolfboy parameters. Live Claude runs remain explicitly blocked by the missing `ANTHROPIC_API_KEY`; no other provider was called.

## Director's bounded-search and semantic-critic revision

This section supersedes the earlier all-six-or-none, keyword-quality and three-round policies. The earlier art/Claude migration notes are historical. The Anthropic key is now present and has successfully authenticated real calls; no key value was read, logged or committed.

### Reviewed stopped-run edits

- Kept the operator trace hook and local model-JSON diagnostics from `gifts.ts`/`gift-eval.ts`; they expose no headers or secrets and do not change objective checks.
- Kept the request for approximately twelve initial alternatives, replacing the contradictory old “exactly one candidate per kind” instruction.
- Removed keyword-based kind, specificity, source/context-evidence and colour-as-idea judgments from code. The helper critic returns structured `kind`, `isSpecific`, `sourcesUsed`, `pass`, `reason` and duplicate identity per candidate. It judges meaning, can reclassify the proposed kind, and supplies rejection reasons.
- Code still enforces all original/expanded hard-no terms against title/category/brand/colours/materials/venue, budget ranges, exact normalized duplicate/prior titles, owned items and the explicit generic-merch blocklist. No critic verdict can override these exclusions.
- Owned entries now match normalized whole words/phrases, including broad ownership word checks. `art` no longer matches `heart`, while an actual case-insensitive `STAR ATLAS` phrase is still blocked.

### Helper resilience, partial results and costs

- Taste expansion is compact: at most four strings per field per love, with explicit short-string guidance and 16,000 maximum output tokens. JSON and original source identities are validated. A bad reply gets exactly one retry with validation feedback.
- If both expansion attempts fail, real errors are logged and genuine plain chips are used, with no invented specifics and no successful cache entry. Wikipedia lookup failures also degrade safely. Refusal-helper failure preserves all literal refusals and deterministic known aliases; hard-no checking remains in code.
- Each search has at most **two generation rounds**, and at most **one critic call per round**. There are no hidden evaluator retries. Every unique passing idea is retained, including multiple good ideas of the same kind; six kinds is the target, not a result gate or a reason to truncate accepted alternatives.
- Partial results use exactly `Only [N] made it past the no list.` Zero uses exactly `The no list won this round. Loosen one rule or add another love, then try again.` A failed refill preserves earlier reviewed passes. A failed critic never exposes unreviewed ideas.
- Normal cold first-round success uses four Claude calls; a cached round uses two. One refill normally raises this to six/four respectively. The single permitted taste-expansion retry can add one call. All attempted calls and stage counts are logged per search without profile data or credentials.

### Verification

- All **31 deterministic regression checks** passed, including partial retention, the two-round cap, critic-assigned kinds, compact expansion retry/fallback, strict refusal aliases, whole-word owned matching and preserving passes after a refill error.
- Workspace TypeScript and production Vite build passed.
- Isolated phone-browser checks passed for the three-card partial state and the exact zero-state copy. These intercept generation and use **zero Claude calls**; they are not counted as live profile evidence.
- The four-profile live evaluator is run **once** after this coherent fix. Its current results, number shown, kinds, calls and rejection reasons are recorded in the marked live-evaluation section above. No profile is tuned/re-run afterward, even if it fails.
- All eight approved share-card assets, slots and rendering paths are unchanged by this revision.

### Historical previous pass — pre-tool protocol blocker

**Live verification did not pass.** All four profiles returned zero. Each search made exactly four Claude calls: one taste expansion, one refusal expansion and two generation calls; **zero critic calls**. Total: 16 calls. No profile was re-run after this result, and no further runtime fix/tuning was made.

The remaining blocker is a **generation-prompt/schema mismatch introduced in this revision**, not authentication or a semantic critic rejection. The generation prompt lists the `sourceDetails` field without defining its object-array shape. For each profile, the initial 12 candidates returned text; the refill's 12 returned arrays of strings. The parser requires objects with `love` and `detail`. Thus all **96 candidates** were rejected before objective gift checks/critic review. Additional mismatches included an empty `contextType`, occasional overlong source-detail arrays and one three-source candidate.

These are protocol rejections, **not evidence that the ideas failed the no list or lacked quality**. There are no genuine critic reasons to report; none were invented. The earlier successful Hinterwelle run remains evidence that the key works and its praised ideas were good. The current revision must not be described as live-verified or ready to publish.

Sol's refusal helper also exceeded its 40-term response limit. It logged that actual validation error, retained the original alcohol refusal/known aliases in code, and continued. Taste expansion itself completed once for every profile; none required its retry/fallback in this live pass.

#### Candidates rejected before critic review

All titles below share the source-detail format rejection described above. No claim is made that their product facts, budgets or hard-no suitability were reviewed successfully.

**Hinterwelle (24):**
- Matte black cast-iron teapot with infuser for loose-leaf Earl Grey
- Factory Records: The Complete Graphic Album (design book)
- Biergarten or beer hall dinner for two with pretzels and schnitzel
- Tickets to a local psych or indie-folk gig, with a drone-rock listening night
- German pantry box: pretzels, sweet and spicy mustards, spätzle and Lebkuchen
- Earl Grey tasting flight: classic bergamot, Keemun, Lady Grey and Lapsang blend, with Lebkuchen
- Hand-poured bergamot and black tea soy candle in a matte black vessel
- Hand-turned walnut Brotzeit board for pretzels, sausages and cheese
- Okkervil River – Black Sheep Boy on vinyl
- Official Sanrio Badtz-Maru blind-box mini figure or plush
- Liquid oil-wheel light show projector for psychedelic haze
- Spätzle press with a Swabian home-cooking cookbook
- Electro-Harmonix Nano Big Muff Pi fuzz pedal
- Badtz-Maru notebook and pen set for scribbling lyrics
- Night out at a local psych or indie-folk gig
- Hands-on German cooking class: spätzle, schnitzel and pretzels
- East Frisian tea ritual set: loose black tea and Kluntje rock sugar
- Earl Grey flight: Keemun Earl Grey, Lady Grey and smoky lapsang Earl Grey
- Hand-thrown matte black teacup and saucer for Earl Grey
- Hand-stamped leather bookmark with 'Black Sheep Boy' and a favourite lyric
- Okkervil River 'Black Sheep Boy' vinyl LP
- Vintage 1990s Badtz-Maru Sanrio collectible
- Oil-wheel style psychedelic light projector
- 'Touching from a Distance' by Deborah Curtis

**Wolfboy (24):**
- Frankenstein's Laboratory Plasma Globe Lamp
- Marvel Champions: The Card Game Core Set
- Classic Monster Double-Feature Night Out
- Birthday Comic Shop Crawl with a Back-Issue Budget
- Full-Moon Midnight Monster-Movie Snack Crate
- Mad-Scientist Small-Batch Hot Sauce Trio
- Hand-Stamped Silver and Turquoise Wolf-Moon Pendant
- Custom Ink-and-Watercolor Portrait of You Two as Classic Monsters
- Retro-Style Wolf Man Collectible Figure
- Mid-Grade 1970s Avengers Back-Issue Comic
- Horrified Universal Monsters Board Game Bundle
- Full-Moon Stargazing Night Kit
- Wolf Man-style silver wolf-head walking cane
- Mad-scientist plasma globe lightning lamp with a turquoise glow
- Classic monster double-feature night at a repertory cinema, with dinner out
- Marvel vs DC comic shop crawl with a back-issue budget for each of you
- Gothic-horror loose-leaf tea sampler with moonlit and misty-moor blends
- Hero vs villain hot sauce flight, sorted by heat level, with a comic-book gift tin
- Handmade sterling silver and turquoise wolf-head pendant
- Handmade leather journal with stitched-scar spine and turquoise thread
- Retro 8-inch articulated Wolf Man figure in vintage monster-toy style
- Bronze Age Avengers back issue, bagged and boarded
- Marvel Champions: The Card Game co-op core set for game nights together
- Full-moon werewolf watch-night kit: binoculars, fog machine and The Wolf Man on blu-ray

**Mira (24):**
- All-weather field notebook set for her life list
- Microplane zester and fluted tart tin set
- Guided bird walk at a botanical garden
- Pottery wheel-throwing class for two
- Lemon verbena and citrus herbal tea sampler
- Bird Friendly shade-grown coffee sampler
- Hand-thrown stoneware bird feeder or bird bath
- Handmade stoneware lemon tart or pie dish
- Vintage ceramic bird plate or figurine
- Vintage Peterson Field Guide to the Birds, older edition
- Potted Meyer lemon tree in a glazed ceramic planter
- Native bird-friendly plant seed collection with plant labels
- Waterproof field notebook set for recording sightings
- Speckled stoneware citrus juicer with a pouring spout
- Garden membership or day pass with a guided early-morning bird walk
- Wheel-throwing studio session for two
- Meyer lemon gift box with lemon curd for baking
- Lemon verbena and lemon balm herbal tea set
- Handmade stoneware hanging bird feeder from an independent potter
- Hand-thrown fluted tart dish in a lemon-yellow glaze
- Vintage mid-century studio pottery bud vase
- Vintage edition of Peterson's A Field Guide to the Birds
- Cyanotype sun-print kit for pressing garden leaves and ferns
- Cedar nest box building kit for the backyard

**Sol (24):**
- Lodge Cast Iron Combo Cooker for Birthday Country Loaves
- Celestron Cometron 7x50 Binoculars for Shared Stargazing
- Planetarium Show Night Followed by a Home-Baked Loaf Supper
- Couples Sourdough Workshop at a Local Artisan Bakery
- Heritage Grain Flour Trio: Rye, Spelt and High-Extraction Wheat
- Stargazing Night Cocoa and Shortbread Star Kit
- Hand-Embroidered Linen Bread Bag with Constellation Stitching
- Custom Handmade Bread Lame with Engraved Wooden Handle
- Used Hardcover of Carl Sagan's Cosmos
- Vintage Wagner Ware Cast Iron Skillet for Focaccia
- Joby GorillaPod for Dough-Rise Time-Lapses and Night Sky Photos
- Smartphone Adapter for Binoculars or Telescope Astrophotography
- Lodge Cast Iron Combo Cooker for open-crumb country loaves
- Celestron Cometron 7x50 binoculars with a red flashlight
- Couples sourdough workshop at a local bakery
- Star party or dark-sky night with a local astronomy club
- Stone-milled heirloom flour sampler for country loaves and rye
- Stargazing picnic kit: star-shaped discard crackers, jam, cocoa and a red torch
- Hand-engraved constellation bread lame
- Embroidered linen bread bag with a night-sky motif
- Small authenticated Campo del Cielo meteorite fragment
- Used older edition of Norton's Star Atlas
- Moon-phase sourdough baking journal
- Smartphone adapter for binoculars or telescopes for Moon photography

## Director's structured-tool contract pass — 2026-10-31

### Implemented and verified offline

- Added one Zod generation envelope and one Zod critic envelope as the source of their tool definitions and local validation. Generation explicitly includes `sourceDetails: [{ love: string, detail: string }]`; critic has typed kind, specificity, source identities, pass/fail, reason and duplicate identity.
- Definitions are converted with `zod-to-json-schema`, without hand-maintained parallel JSON shapes. All objects reject unknown properties. Following Anthropic's documented schema-subset rules, unsupported bounds are mechanically added to descriptions; the original bounds are still enforced by Zod. No hard-no, owned-item or generic-merch checks were weakened.
- The transport submits one strict tool and reads its `tool_use.input`, not free-text JSON. A malformed reply gets exactly one format-only correction containing its previous reply and specific validation errors. Critic identity/cardinality errors follow that same correction path.
- Format failures have their own stage/attempt/issues records and search-log count, separate from objective and critic rejections. Unrecoverable generation/critic format failures throw an explicit error instead of turning a round into zero passing gifts. Previously reviewed partial results remain retained if a later refill fails.
- Added the offline contract suite to `pnpm test:gifts` and API prebuild. It constructs sample responses from the actual emitted tool schemas and validates them with the exact Zod source, checks the formerly broken text/string-array alternatives, exercises one-correction limits, and checks strict-tool transport. Pipeline tests cover explicit format errors and corrected critic identities.
- **39 regression tests passed**, full workspace TypeScript checks passed, and the API production build/restart passed before the first paid request. Test-only fixture errors in logs are deliberately injected failures, not live results.

### Gated live result — stopped, not live-verified

The current evaluation table above is this pass's result. Hinterwelle made **three attempted Claude requests**: one successful taste expansion, one successful refusal expansion and one generation request rejected with HTTP 400. There were zero critic calls, zero candidates shown and no critic rejection reasons. The other three profiles made **zero calls** because the gate stayed closed. No profile was retried and no implementation tuning was made after the failed live attempt.

**Reply-format failures: 0 received invalid replies; generation format validation was never reached. Request rejection: 1 (HTTP 400).** The zero reply-error count is not a successful format test.

Post-failure, read-only documentation review identified the compatibility issue: Anthropic explicitly lists **Claude Sonnet 5.5** among models where forced `tool_choice: tool` or `any` returns HTTP 400. The documented supported alternative is **`tool_choice: auto` with strict tools**. This revision still contains the incompatible forced choice; the Director's stop-on-Hinterwelle-failure rule was honored rather than changing it and rerunning. The upstream error body was not retained, so only the HTTP status was directly observed.

Documentation:
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use#forcing-tool-use
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs#json-schema-limitations

Model settings remain `ANTHROPIC_MODEL=claude-sonnet-5-5`, with the helper defaulting to the same model. Existing `ANTHROPIC_API_KEY` was used only by the direct API transport; no credential values were printed or committed. No provider fallback was added.

All eight approved share-card images, their slots, colour selection and export renderer remain untouched. This is a checkpoint of the structured-contract work and its **known live blocker**, not a claim that gift generation is fixed or ready to publish.
