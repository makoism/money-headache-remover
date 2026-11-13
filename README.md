# M.H.R.2000 (The Money Headache Remover 2000)

Live at https://money-headache-remover.mako-162.workers.dev (mirror on Claude: https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w).

A calm one-page budget app: real numbers from your statements (CSV, Excel, PDF or screenshots), play money you can spend with no guilt,
each goal with its date, and an assistant that knows your picture and can carry out what you agree on. Built for Mako's team, friends and family.

- `public/` is the whole app: one HTML page plus the installable-app files and the intro video. It is built from `team/` sources
  (kept in Claude's working folder) by `build_site.sh`; do not edit `public/index.html` by hand.
- `functions/api/ai.js` relays AI requests to Anthropic on the owner's key with daily caps and an optional code word. Images and PDF statements go through as content blocks; Excel files are turned into CSV text in the browser first (`team/ui4b.js`). A request may force one tool (`tool_choice`): the statement reader uses that to get every file back as a fixed-shape table of rows, which the page turns into the monthly numbers itself (`team/stmt.js`).
- Setup opens with Mako's video, then the statements: each file is one small read, four at a time, a bad file fails alone, and the review shows what was read with a category per merchant to correct (corrections are remembered). `tests/page_import.js` walks it with a CSV, a PDF, an Excel file and a broken file; `tests/stub_anthropic.js` answers like the real API.
- `functions/api/vault/[id].js` stores each person's encrypted cloud copy. The server never sees a readable number.
- `functions/api/health.js` says what this deployment offers.
- `worker/index.js` is the Worker entry: it serves `public/` and routes `/api/*` to the handlers above (Cloudflare runs `npx wrangler deploy` on every push).
- `SETUP.md` is the one-time setup. `ARCHITECTURE.md` explains the page's structure and the rules for changing it.
- `tests/` runs the server against a stand-in for Anthropic (`tests/dev.sh`, then `node tests/relay.test.js`, `node tests/page_relay.js`, `node tests/page_vault.js`, `node tests/page_import.js`, `node tests/page_assistant.js`, `node tests/page_move.js`; `tests/stop.sh` ends the stand-ins).

Privacy, in one paragraph: numbers live in the person's browser (two copies). Cloud backup is optional and encrypted on the device with a
recovery code only the person has. The AI sees only what the person sends (a question, a file, this month's numbers when ticked) and
nothing is stored on the server except usage counters. No analytics, no outside requests from the page.
