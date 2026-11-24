# RELAY_DEPLOY: the AI relay change on main-relay (BU3)

Run the checks: `node tests/relay_server/relay_server.test.mjs` (no wrangler, no network, no real API; D1 stand-in from
`tests/vault_server/d1_stub.mjs`, a fake upstream in place of api.anthropic.com).

## What changes (functions/api/ai.js only; no table change, no new setting)

1. **Whose count the per-day call cap (USER_DAILY_CALLS) goes on.** Before: the page's `anon`, which app3 draws fresh on every
   page open, so the cap never held. Now, in order:
   - INVITE_CODES is set: the code word the call carries, kept in D1 only as an HMAC-SHA-256 keyed with
     ANTHROPIC_API_KEY (key `u:i:...`), so the word cannot be found from the table. The owner's whole household shares
     one count: **400 calls a day by default** when USER_DAILY_CALLS is not set.
   - else a new optional `device` field, 16 to 64 hex characters, kept by the page (key `u:d:...`), 150 a day by default.
   - else the client IP (key `u:ip:...`), 150 a day by default.
   A USER_DAILY_CALLS the owner sets applies to all three.
   `anon` is still accepted (and still refused when malformed) but is optional and counts for nothing. A malformed
   `device` is refused 400. The day's token cap for everyone (DAILY_TOKEN_CAP) and the per-minute cap per IP are unchanged.
   The 429 message now names the code word, the device or the connection.
2. **Prompt caching.** The system prompt goes up as one text block with `cache_control: {type: 'ephemeral'}` (same words as
   before), and the last tool carries the second mark. A mark the page put on any other tool is dropped. Model, max_tokens,
   messages, tool_choice, effort and streaming are unchanged. A prompt shorter than the model's minimum is simply not cached.
   A `cache_control` the page puts in a message block is refused 400, so the marks never go past the limit of 4 (neither
   app sends one).
3. **Token counting.** With caching, Anthropic's `input_tokens` is only the uncached rest, so the caps and the `usage.input`
   the page gets now count input + cache write + cache read: the same whole-prompt number as before.

The old app (src/ui41.js, 38.28) and app3 (ask3.js, stmt3_ai.js on wip-38.31) send exactly what they sent before and get the
same answers (tests A and B). They send no `device`, so until a page sends one, an open page (no INVITE_CODES) is counted per IP.

## What to check after the deploy

- `GET /api/health` still says `ai: true`.
- One question in the old app and one in app3 answer as before (and one statement read).
- In D1, `SELECT k, calls, tokens FROM usage WHERE day = date('now')`: new rows are `u:i:...`, `u:d:...` or `u:ip:...`,
  never a bare `u:<anon>`, and `all` keeps growing.
- In the Anthropic console usage, cache reads appear after the second question in one conversation (cache read tokens
  above zero). If they stay at zero, nothing is broken, only no saving.

## Rollback (one line)

In the Cloudflare dashboard: Workers, the-burrow, Deployments, roll back to the one before. Or in git, revert the merge
commit that brought main-relay into main (`git revert --no-edit -m 1 <merge commit> && git push origin main`); if it came
in without a merge, revert the relay commits by the hashes they have on main.

- **Pages must keep sending `anon` while a rollback is still possible.** Checked: the relay on main before this change
  refuses a request with no `anon` (or a malformed one) with 400 `invalid_request`, "anon id missing." The new relay
  accepts it with or without. A page that drops `anon` would stop working the moment the relay is rolled back.
- **A rollback leaves `u:i:...`, `u:d:...` and `u:ip:...` rows in the D1 `usage` table.** They are harmless: the old relay
  never reads them (it reads `u:<anon>` and `all`), no table or column changed, and each row is for one day only.
  The `u:<anon>` rows the old relay wrote before the change are just as harmless to the new one.
