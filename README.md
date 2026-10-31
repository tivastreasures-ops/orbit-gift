# Orbit & Wonder · Stardust Theory

**Gifts for the people who are impossible to shop for.**

Tell us what they love. Tell us what they'd never be caught dead with. We'll find what fits.

## What it does

A mobile-first gift finder with several device-local recipient profiles, matched love/refusal chips, six rule-checked ideas per round, feedback, saved lists, and four downloadable/shareable wish-list card templates. No accounts, database, tracking, product purchasing, or automatic PNG import.

Names, headings, labels, and card footers are live text. Approved share-card artwork has **not** been supplied: all eight background slots are intentionally blank. Do not replace them with generated or stock artwork.

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

Visit the proxy origin, not Vite directly. The completion URL and footer use the current app origin; publish the app before sending links to someone who cannot access your preview.

Outside Replit, provide server-only `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL`/`ANTHROPIC_HELPER_MODEL`. Calls go only to `https://api.anthropic.com/v1/messages`. Never put credentials in `VITE_*` variables or commit them.

## Taste adapter and fallback

One server-side interface exposes `searchEntity`, `getRelated`, and `describe`. An explicit mock adapter exists for development; the running app uses Qloo when configured, otherwise the LLM adapter. Qloo errors fall back to the LLM and the browser displays the approved backup notice. No canned gift catalogue silently replaces AI failures.

The LLM proposes structured candidate ideas. Plain TypeScript checks positive title/category/colour/brand/material fields, refusal aliases, ownership, rejection history, prior titles, and budget before any idea returns. The model is not the final eligibility judge. There must be six accepted candidates or the UI receives no results. Approximate prices and where-to-look suggestions are not verified product listings.

The Director's quality contract also rejects generic merch without a named item/maker and colour-only suggestions. Each idea combines two supplied loves or one love plus the actual occasion/relationship, with validated source metadata. A full round contains one object, experience, consumable, handmade/small-maker piece, collectible, and wildcard. Claude expands the Wikipedia-resolved taste profile and hard no's, generates about 12 candidates, then independently critiques specificity, combinations, budget, novelty and kind. Code drops forbidden/invalid candidates, selects the best eligible candidate per kind, and tells retries exactly what failed. Catalogue existence and semantic relevance still depend on model facts, not an independently verified inventory.

Derived expansions live only in bounded server-memory caches for six hours; edits/model changes invalidate their keys, refusal edits expand only new terms, and a restart clears them. Profiles, keepers and accumulated More like this seeds remain device-local. With refusals, a cold successful round normally uses four Claude calls (taste expansion, refusal expansion, generation, critic); a fully cached round uses two. Up to three generation/critic pairs means at most eight cold or six warm calls. Wikipedia typeahead uses zero Claude calls. Actual per-search counts are returned in `diagnostics`.

Run `pnpm test:gifts` after every change (also runs before API builds). These deterministic transport fixtures test the contract, not model quality. Run `pnpm test:gifts:live` with a valid key for real fixed-profile evaluation; it updates the marked `BUILD.md` table and exits nonzero for missing credentials, missing profile details or incomplete rounds. It never substitutes mocked gifts. Wolfboy awaits the Director's actual profile; the easy/sparse fictional fixtures are Mira and Sol.

Results and Keepers show an interactive, device-local planet/love constellation with a labelled no-list asteroid belt. Source chips highlight only exact known source stars; unknown/legacy-unresolvable sources use the approved whole-sky fallback. Keepers' gold stars support saved gifts, and its lavender stars remain unexplored.

Natural-language refusal matching is conservative token/alias matching, not a complete semantic ontology. New synonyms and complex ownership statements need explicit regression cases before release.

## Share cards and privacy

Secret Santa, All I Want for Christmas, I'm Stumped, and This or That support portrait 1080×1350 and square 1080×1080 exports. The canvas reflows the layout for each size; square is not a truncated portrait.

Public hints omit budget and begin with a blank display-name choice, not a saved full profile name. Preview omissions do not modify saved preferences. Art selection respects palette refusals; all current art slots remain blank pending approval.

Only I'm Stumped has a fillable link. That URL contains a template identifier, never a profile or preferences. It opens a blank editor without an account, server storage, or sync. Completed PNGs are returned through the phone share sheet or download; the giver enters the returned answers manually.

Preference inputs are sent to the server and AI provider for transient taste lookup/gift generation; they are not stored by this server. The approved UI privacy line refers to application persistence, not an offline-only inference guarantee. Do not claim no network processing.

## Checks

```sh
pnpm run typecheck
node scripts/src/check-secrets.mjs
```

Acceptance checklist (physical Android Chrome and cross-device checks must be completed before release):

- Hinterwelle: loves Okkervil River, Joy Division, The Black Angels, Badtz-Maru, German food, Earl Grey; refuses pink, dresses, Microsoft/Windows.
- Correct or fix all six matches.
- Six ideas each include price, where-to-look, because, checked-against.
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
