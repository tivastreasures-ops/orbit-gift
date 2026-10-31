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
- Gift generation now uses `gpt-5.4`; taste/entity lookup retains `gpt-5.4-mini`. The small model repeatedly failed the multi-interest/context contract even with explicit examples. The stronger model produced the complete six-kind set while the gates remained intact. This changes generation cost/latency, not the Qloo-empty LLM-fallback contract.
- The prompt prohibits fictitious official collaborations, invented editions, availability and exact-price claims. Paired real items, handmade concepts and one-love-plus-real-context ideas are preferred over fabricated crossover products. Positive metadata checks cannot independently verify catalogue existence, factual model claims or semantic relevance; these are gift ideas, not verified purchasable listings.

### Verification

- Workspace-wide TypeScript check and production Vite build passed.
- Fifteen focused unit tests cover generic-merch/colour/context/source gates, retained hard-no/owned/rejected checks, Unicode source identity, exact legacy matching, deleted-source fallback, stable appended-star positions, and all line segments avoiding the central planet.
- A real LLM generation returned six accepted ideas spanning all six kinds with canonical source metadata; earlier incomplete rounds correctly returned no ideas rather than bypassing the quality gates.
- Phone browser review and requested Results/Keepers screenshots are recorded in the handoff. This is not a physical Android sharing or full three-round acceptance claim.
- The focused 402×874 Results→Keepers browser pass confirmed star/asteroid tap details, source-chip selection without triggering card controls, saving, universe counts/gold source stars, profile retention and keeper persistence after reload. Transient source selection intentionally resets on reload. Neither page had horizontal overflow. Qloo's backup notice denotes the real LLM-only adapter, not mock gift data.

## Share-card artwork status

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
