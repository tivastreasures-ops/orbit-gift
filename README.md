# Orbit & Wonder · Stardust Theory

**Gifts for the people who are impossible to shop for.**

Tell us what they love. Tell us what they'd never be caught dead with. We'll find what fits.

## What it does

A mobile-first gift finder with device-local recipient profiles, matched love/refusal chips, reviewed gift ideas, feedback, saved lists, and four downloadable/shareable card templates. Six kinds is a target, not a gate: all safe reviewed ideas remain visible. No accounts, database, tracking, product purchasing, or automatic PNG import.

Headings, labels, entries and card footers are live text. All eight Director-approved backgrounds are integrated unchanged from the supplied PNGs, with the supplied `slots.json` controlling text geometry. Do not substitute or regenerate the art.

## Stack

React, Vite, TypeScript, React Query, Node/Express, OpenAPI/Orval/Zod, browser localStorage, browser canvas. All AI calls use the direct Anthropic Messages API; no Replit AI proxy or OpenAI SDK is used. Wikipedia provides free taste disambiguation. Qloo remains an optional, later server-side taste adapter. A database package ships with the starter but is not used by this application.

## Run on Replit

1. Install dependencies with `pnpm install`.
2. Run the managed workflows `artifacts/api-server: API Server` and `artifacts/orbit-gift: web`. Their routing and environment are managed by Replit.
3. Add **ANTHROPIC_API_KEY** through Tools → Secrets (or the secure secret-entry form), never in source or chat. It is server-only. No key means the existing error copy, not another AI provider.
4. **ANTHROPIC_MODEL** defaults to `claude-sonnet-5-5`, the current Sonnet ID in [Anthropic's model documentation](https://platform.claude.com/docs/en/about-claude/models/overview). **ANTHROPIC_HELPER_MODEL** is optional and defaults to the same value. Set it later to a cheaper supported Claude model if desired. No Qloo key is needed now.
5. Open Preview. Profiles and keepers live in this browser only.

Replit does not accept a truly empty secret. If `ANTHROPIC_API_KEY` is absent, enter/link it securely; do not use a dummy value. Old platform-managed AI Integration entries, if still shown in Connectors/Secrets, are unused by this app. Remove the old connection through its Manage control; do not delete unrelated account secrets.

## Run locally

Use Node.js 24 and pnpm 10.

```sh
pnpm install
pnpm --filter @workspace/api-spec run codegen
# Terminal 1 (provide server-only AI configuration through your environment)
PORT=5000 pnpm --filter @workspace/api-server run dev
# Terminal 2
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/orbit-gift run dev
```

Serve both services behind a local reverse proxy: `/api` → port 5000 and `/` → port 5173. Vite deliberately has no API proxy because Replit supplies the shared routing. For example, with Caddy:

```caddyfile
localhost:8080 {
  handle /api/* {
    reverse_proxy localhost:5000
  }
  handle {
    reverse_proxy localhost:5173
  }
}
```

Visit the proxy origin, not Vite directly. Card footers never use the preview origin. Set `VITE_PUBLIC_CARD_URL` to the verified published HTTPS URL after publishing; until then they show only “Made with Orbit & Wonder”, and QR is disabled. Development/localhost URLs are rejected, including explicit renderer overrides.

Outside Replit, provide server-only `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL`/`ANTHROPIC_HELPER_MODEL`. Calls go only to `https://api.anthropic.com/v1/messages`. Never put credentials in `VITE_*` variables or commit them.

## Taste adapter and fallback

One server-side interface exposes `searchEntity`, `getRelated`, and `describe`. An explicit mock adapter exists for development; the running app uses Qloo when configured, otherwise the LLM adapter. Qloo errors fall back to the LLM and the browser displays the approved backup notice. No canned gift catalogue silently replaces AI failures.

The LLM proposes structured candidates. Plain TypeScript checks hard no's in positive title/category/colour/brand/material fields, refusal aliases, whole-word ownership, rejection history, prior titles and budget. No model can override those exclusions. All reviewed passing candidates are shown, including partial results; six-kind coverage is a target only. Approximate prices and where-to-look suggestions are not verified product listings.

The Director's quality contract also rejects generic merch without a named item/maker and colour-only suggestions. Each idea combines two supplied loves or one love plus the actual occasion/relationship, with validated source metadata. The target mix is object, experience, consumable, handmade/small-maker piece, collectible, and wildcard. Claude expands the Wikipedia-resolved taste profile and hard no's, generates about 12 candidates, then independently critiques specificity, combinations, budget, novelty and kind. Code drops objective violations, retains all critic-approved candidates, and tells refills exactly what failed. Catalogue existence and semantic relevance still depend on model facts, not an independently verified inventory.

Derived expansions live only in bounded server-memory caches for six hours; edits/model changes invalidate their keys, refusal edits expand only new terms, and a restart clears them. Profiles, keepers and accumulated More like this seeds remain device-local. With refusals, a cold first-round success normally uses four Claude calls (taste expansion, refusal expansion, generation, critic); a cached round uses two. There are at most **two semantic generation rounds and one semantic critic pass per round**: normally up to six cold/four warm calls. Each malformed generation/critic tool reply gets at most one format-only correction; those attempts count as calls (up to four extra across two rounds). Taste expansion retains its single retry. Wikipedia uses zero Claude calls. Actual per-search counts are returned in `diagnostics` and logged without profile data or credentials.

Kind, specificity and meaningful source/context combination are judged by the structured helper-model critic, not keyword rules. Code retains objective hard-no checks (including expanded terms), whole-word/phrase owned matching, budget range, duplicate titles and the plain-merch blocklist. All passing ideas are retained; six kinds is the target, not an all-or-nothing gate. Partial results use `Only [N] made it past the no list.` Zero uses the approved no-list-won copy. Expansion is compact, validates/retries once, and falls back to genuine plain chips without caching failures or inventing tastes. A failed critic never exposes unreviewed gifts.

Generation and critic tools are derived from their Zod validators, including the nested `sourceDetails` object array. Anthropic-supported structural constraints use strict tool decoding; unsupported bounds are mechanically put in schema descriptions and remain enforced locally. Offline tests construct replies directly from the emitted tool schema and validate them with the original Zod schema. Unrecoverable reply-format errors are explicit errors, never empty quality rounds.

Run `pnpm test:gifts` after every change (also runs before API builds). These deterministic fixtures test the contract, not model quality. `pnpm test:gifts:live` starts with Hinterwelle alone; Wolfboy, Mira and Sol run once each only if Hinterwelle shows ideas with zero format failures. It records shown ideas, kinds, calls, format failures and actual rejection reasons in `BUILD.md`, without rerunning any profile. A partial result satisfies the gate if nonempty and format-clean. Zero/error or even a recovered Hinterwelle format error closes it.

**Latest live check:** the request-mode blocker is fixed: Sonnet 5.5 uses strict tools with `tool_choice: auto`, not unsupported forced `tool`/`any`. One gated run showed Hinterwelle 8 ideas/4 calls, Wolfboy 7/6, Mira 11/4 and Sol 10/5. Wolfboy retained reviewed partial results after the refill critic timed out. Sol recovered from two helper-format errors; generation/critic tool contracts had no format failures. The conservative evaluator exits nonzero for those recovered helper errors. Full reasons and stage counts are in `BUILD.md`; no profile was rerun.

## Reliability and personalized skies

All search inputs, unsubmitted editor drafts and pending request bodies are device-local. A search has a 110-second server budget and 70-second per-Claude-call limit; the browser has a 130-second request limit and one automatic retry. Automatic retry, manual Retry and reload recovery reuse the same opaque idempotency key, attaching to in-flight/cached success rather than buying a duplicate search. Failed jobs are evicted; bounded successful jobs expire after ten minutes. Real sanitized server errors are logged, without upstream bodies or credentials.

The useful error is “The stars didn't line up that time. Your answers are saved. Try again?” Existing reviewed ideas stay visible during failed refills. Pure color words and explicit color phrases bypass ambiguity lookup; real ambiguity uses plain-language choices, never “entity”.

Each person's name and loves seed the same constellation in Results, Keepers and card miniatures, independent of device-local chip IDs. Loves remain tappable; feedback brightens or dims/crosses relevant stars, and no-list asteroids remain device-private. Six auto-chosen worlds support persistent manual overrides: ringed giant, ocean, ember, ice/crystal, garden moon and nebula. SVG/canvas placeholders are intentional until approved transparent PNGs arrive. Each world has an optional `art` URL in `src/lib/sky.ts`; approved App Storage PNGs replace only the central world, not the live constellation. Reduced motion stays static.

## Card artwork and export

The eight existing PNG bytes are untouched. The Librarian's next approved POP/Neutral files can replace the same filenames in App Storage; adjust only the shared per-layout geometry in `src/lib/card-slots.json`. Use `/dev/cards` during development for short/long slot-box calibration; this route is unavailable in production. `paintedTitles` suppresses code-drawn titles/section labels for future painted art.

Cards have **no budget fields or slots**; the recommendation budget remains separate. All I Want has four one-line wishes and no Because fields; additional prefilled wishes get a UI-only truncation note. This or That has seven answers per side. Entries use Google Caveat handwriting; headings/labels remain Josefin Sans, supporting text/footer DM Sans. Empty answers show faint prompts; blank exports draw light ruled lines. Stumped's send-answers-back sentence is blank-export-only.

Share editor drafts persist locally. The public completion form uses an isolated **tab/session draft**, not giver profiles or localStorage: reload/reconnect keeps unfinished answers, but a fresh tab starts blank. Run `pnpm --filter @workspace/scripts exec tsx src/card-draft-qa.ts` for this focused, no-paid-call reload/privacy check.

All text retains max-font → min-font → max-lines → ellipsis plus clipping. Each layout reserves a bottom-right personal sky and a footer/link/optional real QR strip. Neutral skies use warm monochrome so they cannot introduce pink. Square export still contains the whole 864×1080 portrait centered in 1080×1080 starry space, never cropped.

Results and Keepers show an interactive, device-local planet/love constellation with a labelled no-list asteroid belt. Source chips highlight only exact known source stars; unknown/legacy-unresolvable sources use the approved whole-sky fallback. Keepers' gold stars support saved gifts, and its lavender stars remain unexplored.

Natural-language refusal matching is conservative token/alias matching, not a complete semantic ontology. New synonyms and complex ownership statements need explicit regression cases before release.

## Share cards and privacy

Secret Santa, All I Want for Christmas, I'm Stumped, and This or That support portrait 1080×1350 and square 1080×1080 exports. A square contains the complete portrait at 864×1080, centred at x=108 on the app's starry background: no crop or reflow.

Public hints omit the budget and its label. No name is drawn because the approved slot map has no name box; unused name controls were removed rather than inventing a position. Preview omissions do not modify saved preferences. Art selection switches to neutral for refused main-art colours. If the neutral image or the mandated square background also conflicts, export fails using existing error copy rather than recolouring approved art.

The eight exact 1122×1402 source PNGs live in App Storage, not Git. Their hashes/objects are recorded in the server's card-art manifest and served through the read-only `/api/card-art/{filename}` allowlist. There is no anonymous upload endpoint, account system or recipient storage. The operator import script verifies PNG dimensions and a full SHA-256 download round-trip; it never processes the pixels.

Text follows the versioned source-pixel boxes and font/line limits: Josefin Sans for titles/headings/labels, Caveat for answers, DM Sans for supporting text/footer, with dark charcoal ink and per-box clipping. This or That has seven rows per column. Stumped uses the approved cloud request, suppressing the send-back sentence except on blank exports.

`pnpm test:card-art` runs the real browser renderer with Hinterwelle, Wolfboy and long text, both versions and sizes (48 PNG cases). Checks cover ink bounds, request/blank copy, seven-row/four-wish mapping, absent budget/Because slots, optional real QR, dev-link rejection, timeout-retry classification, native PNG download and exact square containment. A template argument allows targeted reruns without repeating unchanged cases. Outputs remain ignored under `generated-artifacts/card-art/`; normal export always applies refusal checks.

Only I'm Stumped has a fillable link. That URL contains a template identifier, never a profile or preferences. It opens a blank editor without an account, server storage, or sync. Completed PNGs are returned through the phone share sheet or download; the giver enters the returned answers manually.

Preference inputs are sent to the server and AI provider for taste lookup/gift generation, but are not written to a database or disk. Bounded in-memory expansion/job caches have the lifetimes described above. The approved UI privacy line refers to application persistence, not an offline-only inference guarantee. Do not claim no network processing.

## Checks

```sh
pnpm run typecheck
node scripts/src/check-secrets.mjs
```

Acceptance checklist (physical Android Chrome and cross-device checks must be completed before release):

- Hinterwelle: loves Okkervil River, Joy Division, The Black Angels, Badtz-Maru, German food, Earl Grey; refuses pink, dresses, Microsoft/Windows.
- Correct or fix all six matches.
- Every shown idea includes price, where-to-look, rationale and checked-against; partial results remain usable.
- No blocked gifts through three More like this rounds.
- Rejection reasons change subsequent generation.
- Keepers survive reload, copy cleanly, and can be removed.
- All localStorage operations handle blocked storage.
- Qloo absent/empty uses actual LLM-only generation.
- Inspect browser source/network: no API credentials.
- Four templates export readable portrait and square PNGs.
- Public posts omit budget/private profile names; removing an item changes PNG only.
- Palette refusals select neutral backgrounds; no pink in Hinterwelle exports.
- Send blank I'm Stumped link to another browser; fill, preview, download/share back.
- Blank card download is manual completion, not interactive fields.
- Native share and download fallback work on Android Chrome.
- Reduced motion remains usable.

See [BUILD.md](BUILD.md) for scope, copy gaps, placeholders, verification status, and session history. MIT licensed.
