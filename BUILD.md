# Orbit & Wonder — Build record

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
### Fixed-profile live evaluation — 2026-10-31T07:35:27.677Z

One search per profile, at most two generation rounds and one critic per round.
Model: `claude-sonnet-5-5`; helper: `claude-sonnet-5-5`.

| Profile | Result | Ideas shown | Kinds covered | Claude calls |
| --- | --- | ---: | --- | ---: |
| Hinterwelle | ZERO | 0 | — | 4 |
| Wolfboy | ZERO | 0 | — | 4 |
| Mira (easy) | ZERO | 0 | — | 4 |
| Sol (sparse: two loves) | ZERO | 0 | — | 4 |

**Hinterwelle — ideas shown**
- None.

**Hinterwelle — rejected ideas and reasons**
- No critic verdicts: all 24 candidates were rejected by structured-field validation before the critic could run. See the blocker audit below.

**Wolfboy — ideas shown**
- None.

**Wolfboy — rejected ideas and reasons**
- No critic verdicts: all 24 candidates were rejected by structured-field validation before the critic could run. See the blocker audit below.

**Mira (easy) — ideas shown**
- None.

**Mira (easy) — rejected ideas and reasons**
- No critic verdicts: all 24 candidates were rejected by structured-field validation before the critic could run. See the blocker audit below.

**Sol (sparse: two loves) — ideas shown**
- None.

**Sol (sparse: two loves) — rejected ideas and reasons**
- No critic verdicts: all 24 candidates were rejected by structured-field validation before the critic could run. See the blocker audit below.

PARTIAL means safe reviewed ideas are shown without full six-kind coverage. ZERO/ERROR is reported, never retried by this evaluator. Model JSON and trace files are ignored generated output, not committed. No simulated output is counted as a live run.
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

### Single live-pass outcome — remaining blocker, stopped as directed

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
