# Orbit & Wonder · Stardust Theory

**Gifts for the people who are impossible to shop for.**

Tell us what they love. Tell us what they'd never be caught dead with. We'll find what fits.

## What it does

A mobile-first gift finder with several device-local recipient profiles, matched love/refusal chips, six rule-checked ideas per round, feedback, saved lists, and four downloadable/shareable wish-list card templates. No accounts, database, tracking, product purchasing, or automatic PNG import.

Names, headings, labels, and card footers are live text. Approved share-card artwork has **not** been supplied: all eight background slots are intentionally blank. Do not replace them with generated or stock artwork.

## Stack

React, Vite, TypeScript, React Query, Node/Express, OpenAPI/Orval/Zod, browser localStorage, browser canvas. OpenAI access uses Replit AI Integrations. Qloo is a server-side optional taste adapter. A database package ships with the starter but is not used by this application.

## Run on Replit

1. Install dependencies with `pnpm install`.
2. Run the managed workflows `artifacts/api-server: API Server` and `artifacts/orbit-gift: web`. Their routing and environment are managed by Replit.
3. Replit AI Integrations supplies `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` to the backend. No separate OpenAI key is required on Replit. AI usage is billed to Replit credits.
4. Create **QLOO_API_KEY** in Tools → Secrets with an empty value. Add your Qloo key there only when ready. If the Secrets UI does not accept an empty value, leave it absent: missing and empty are treated identically.
5. Open Preview. Profiles and keepers live in this browser only.

The agent environment exposes a secure secret-entry form but no supported callback for silently creating an empty secret. Therefore creation of the empty Qloo secret remains an explicit setup item, not a claim that it has been created.

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

Outside Replit, configure an OpenAI-compatible URL and key in the backend's `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` environment variables. Never put these in `VITE_*` variables or commit them.

## Taste adapter and fallback

One server-side interface exposes `searchEntity`, `getRelated`, and `describe`. An explicit mock adapter exists for development; the running app uses Qloo when configured, otherwise the LLM adapter. Qloo errors fall back to the LLM and the browser displays the approved backup notice. No canned gift catalogue silently replaces AI failures.

The LLM proposes structured candidate ideas. Plain TypeScript checks positive title/category/colour/brand/material fields, refusal aliases, ownership, rejection history, prior titles, and budget before any idea returns. The model is not the final eligibility judge. There must be six accepted candidates or the UI receives no results. Approximate prices and where-to-look suggestions are not verified product listings.

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
