# M.H.R.2000 (The Money Headache Remover 2000)

Live at https://money-headache-remover.mako-162.workers.dev (mirror on Claude: https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w).

A calm one-page budget app: real numbers from your statements, play money you can spend with no guilt, each goal with its date,
and an assistant that knows your picture. Built for Mako's team, friends and family.

- `public/` is the whole app: one HTML page plus the installable-app files and the intro video. It is built from `team/` sources
  (kept in Claude's working folder) by `build_site.sh`; do not edit `public/index.html` by hand.
- `functions/api/ai.js` relays AI requests to Anthropic on the owner's key with daily caps and an optional code word.
- `functions/api/vault/[id].js` stores each person's encrypted cloud copy. The server never sees a readable number.
- `functions/api/health.js` says what this deployment offers.
- `worker/index.js` is the Worker entry: it serves `public/` and routes `/api/*` to the handlers above (Cloudflare runs `npx wrangler deploy` on every push).
- `SETUP.md` is the one-time setup. `ARCHITECTURE.md` explains the page's structure and the rules for changing it.
- `tests/` runs the server against a stand-in for Anthropic (`tests/dev.sh`, then `node tests/relay.test.js`, `node tests/page_relay.js`, `node tests/page_vault.js`).

Privacy, in one paragraph: numbers live in the person's browser (two copies). Cloud backup is optional and encrypted on the device with a
recovery code only the person has. The AI sees only what the person sends (a question, a file, this month's numbers when ticked) and
nothing is stored on the server except usage counters. No analytics, no outside requests from the page.
