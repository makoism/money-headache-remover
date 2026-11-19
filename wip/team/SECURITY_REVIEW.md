# Security review: the AI relay and the cloud copy

Side F, 2026-11-19. Read against branch wip-38.31. Report only: no app or server code was changed.

Ranked by real harm to about 10 people: lost data first, leaked personal data second, cost abuse third.

Owner of each fix: **VAULT** = the vault lane (functions/api/vault/[id].js, functions/_lib.js). **MAIN** = the main session (client files in wip/team, the service worker, the build). **RELAY** = functions/api/ai.js (no lane named in my brief; the coordinator assigns it). **MAKO** = a setting in the Cloudflare or Anthropic dashboard.

## What was checked and what was not

- Read in full: functions/_lib.js, functions/api/ai.js, functions/api/vault/[id].js, functions/api/health.js, worker/index.js, wrangler.toml, wip/team/ui41.js, ui42.js, ui45v.js, public/sw.js, pwa/make_pwa.py (the fetch handler).
- Read in part: ui46.js, ui4a.js, ui4b.js, ui43.js, stmt.js (the parts that send, receive or show AI text).
- Not checked: the live site. This session's network blocks both workers.dev addresses, so I could not see whether INVITE_CODES is set, which headers the live site sends, or which caps are configured. Points that depend on that say "check".
- Not checked line by line: every place the page builds HTML. A spot check of the statement and assistant screens found model text shown through `esc()` or `textContent`. That is a sample, not proof.
- The 2 MB row limit of Cloudflare D1 (S4) is from memory of Cloudflare's published limits. Confirm it before acting on it.

## What is already sound

- The recovery code is 20 characters from 31, about 99 bits (ui42.js:12). It cannot be guessed, with or without rate limits. The id and the write token are separate 256-bit values made from it (ui42.js:20-29), and the server stores only a hash of the token (vault/[id].js:44).
- The server holds ciphertext only (AES-GCM, a fresh IV per write, ui42.js:31). Nobody with database access can read a plan.
- Read, overwrite and delete all need the token (vault/[id].js:24). There is no way to list ids.
- All SQL uses bound values. The anon id and vault id are checked against strict patterns before use.
- No key, invite word or real recovery code is in the repo or its history (searched all branches for the key prefix). The Anthropic key is read only from `env.ANTHROPIC_API_KEY` (ai.js:64) and is never sent back to the page.
- The relay code writes no request content anywhere: no console.log, no table for prompts. Only counters are stored.
- The assistant cannot change the plan by itself. It proposes from a fixed list, the page checks each step, and nothing changes until the person taps Apply (ui4a.js:1-5). Statement prompts say file text is data, not instructions (ui45v.js:33, 40).

---

## BLOCKER (before the team test)

### B1. The "previous version" safety net lasts about 3 seconds, and nothing can load it
- Where: functions/api/vault/[id].js:52-53 (every write moves the current copy to `prev_*`), ui42.js:39 (a write follows every save after 3 s), ui42.js:149 and ui43.js:112 ("Keep mine" sends `force`). No client code asks for `prev=1` or reads `hasPrev`.
- What could happen: a person taps "Keep mine" on the wrong device, or a phone with a wrong clock or a stale plan overwrites the cloud; the good copy moves to `prev`, the next ordinary save a few seconds later replaces `prev` too, and the good copy is gone for ever.
- Smallest fix (VAULT): move the current copy to `prev_*` only when `prev` is missing or older than 24 hours (compare a `prev_at` time), so `prev` is always "yesterday's copy". Better, and still small: a second table `vault_history (id, day, blob, iv, rev)` with one row per day, last 7 kept. This is checklist E1.
- Smallest fix (MAIN): one button in Settings, "Load the earlier cloud copy", that calls GET with `?prev=1`, plus the local snapshot before any cloud load that E1 already asks for.

### B2. One request deletes the cloud copy and its previous version, with no way back
- Where: functions/api/vault/[id].js:57-60 (a hard DELETE of the row), ui42.js:144-146 ("Turn off" always deletes the cloud copy, two taps within 4 seconds), ui42.js:95-98.
- What could happen: someone turns cloud backup off on one phone, thinking it only affects that phone, and the copy their other device (or their lost phone's replacement) relied on is erased at once; anyone who ever saw the recovery code can do the same.
- Smallest fix (VAULT): DELETE sets a `deleted_at` time and keeps the row for 30 days; GET on such a row answers 404 with `deleted: true`; a PUT clears the mark; old marked rows are removed on a later write. This is checklist E7.
- Smallest fix (MAIN): "Turn off" offers two choices, "Stop on this device" (no DELETE) and "Delete the cloud copy everywhere".

### B3. A failed cloud save is silent
- Where: ui42.js:48-51. Only 200, 409 and 403 are handled. A 429, 500, 413, 400 or a network error leaves no note; Settings keeps showing "On. Last sent" with the old time.
- What could happen: saves stop reaching the cloud (database full, daily write cap hit, plan too large for a row, server error) and the person keeps believing they are backed up until the day the phone is lost.
- Smallest fix (MAIN): on any other status, set `vaultNote = { kind: 'failed', status }` and show "The cloud copy is behind: last sent <time>. Trying again." in Settings and in the Home backup nudge; clear it on the next success. Also warn when the last good send is more than a day older than the last local save.

### B4. Check that the relay is not open to the whole internet (5 minutes, dashboard only)
- Where: functions/_lib.js:57-59 (no INVITE_CODES means anyone may call), DECISIONS.md:67 and wip/team/RELAY (the live addresses are in a public repo), SETUP.md:22 and 36.
- What could happen: a stranger finds the address in the repo and uses the relay as a free Claude account, spending up to the daily cap every day until the prepaid credit is empty, at which point the AI stops for all 10 people.
- Smallest fix (MAKO): set INVITE_CODES on the live Worker (a long phrase, not a short word, see S6); confirm auto-reload is off in the Anthropic console so the prepaid amount is the hard ceiling; set a monthly spend limit on the key's workspace; confirm the D1 binding is live (`/api/health` says `vault: true`), because without it the relay has no limits at all (see S5).

---

## SHOULD (soon, not gating)

### Lost data

**S1. The service worker stores and replays vault answers.**
- Where: public/sw.js:9-10, pwa/make_pwa.py:55-58. Every same-origin GET that succeeds is put in the cache, including `/api/vault/<id>` and `/api/health`, and is served again when the network fails.
- What could happen: the person taps "Load it" for a newer cloud copy, the network drops, the worker hands back an older saved answer, and the page loads that old copy over the current numbers (ui42.js:85, 74-82).
- Smallest fix (MAIN): in the fetch handler, return early when `u.pathname.startsWith('/api/')`. Also have `vaultApply` refuse a copy whose `rev` is not greater than the one in use unless the person asked for an older one.

**S2. Anyone can fill the database, and then every save fails.**
- Where: functions/api/vault/[id].js:42-45 (a new id with any token creates a row, no invite needed, up to 3,000,000 characters each), line 21 (60 requests a minute per address), functions/_lib.js:57 (the invite gate is not used by the vault).
- What could happen: a script creates large junk rows until the D1 database reaches its size limit; from then on nobody's cloud copy updates and the usage counters fail too. With B3 unfixed, nobody notices.
- Smallest fix (VAULT): limit new vaults (a counter `vnew:<ip>` of 3 a day and `vnew:all` of 50 a day through `bump`), require the invite word in a header for the first PUT when INVITE_CODES is set, and lower MAX_BLOB to what a real plan needs (see S4).

**S3. "Newer" is decided by each device's clock.**
- Where: ui42.js:45 (`rev = S.rev || Date.now()`), ui42.js:65-68, vault/[id].js:49.
- What could happen: a device whose clock runs ahead always wins, quietly overwriting newer work from the other device; a `rev` far in the future (allowed up to 1e14, line 40) blocks every later normal save with "the server has a newer copy".
- Smallest fix (VAULT): refuse a `rev` more than a day ahead of the server's time, and return the server time in every answer. (MAIN): show both dates before "Keep mine" and "Load it". Already listed as E1.

**S4. A large plan may not fit in one database row.**
- Where: vault/[id].js:9 (MAX_BLOB 3,000,000) and line 52 (the row holds `blob` and `prev_blob` together).
- What could happen: D1 limits a row to about 2 MB (confirm), so a plan over about 1 MB of ciphertext saves the first time and then fails on every update with a server error, silently (B3).
- Smallest fix (VAULT): set MAX_BLOB to about 900,000 and answer 413 with a clear code; or keep the previous copy in its own row (the history table from B1). (MAIN): show the 413 as "too large for the cloud copy".

### Leaked personal data

**S5. Whole statements leave the device, and the page's privacy lines do not say so.**
- Where: ui41.js:48-55 and 63 (PDFs and screenshots go up whole), ui45v.js:82 (CSV and Excel text goes up as read), ui42.js:113 ("Your numbers are sent only when you use Ask and tick the box"), ui46.js:125 ("Nothing is kept").
- What could happen: a person uploads statements believing nothing personal leaves the phone; the files, with full name, address, account numbers and every payee, go through the relay to Anthropic, which keeps API inputs for a limited time under its own policy.
- Smallest fix (MAIN): for text files (CSV, Excel), mask every run of 8 or more digits to its last 4 before sending (ui45v.js:82, one regex; stmt.js:79 only needs the last 4 to tell accounts apart). For PDFs and screenshots masking on the device is not practical, so say it plainly on the upload screen: "These files are sent to Claude (Anthropic) to be read. The site keeps nothing. To keep an account number private, upload a CSV or crop the screenshot." Correct the two lines above to match. This is the honest version of checklist E7.

**S6. The invite word can be guessed without limit.**
- Where: functions/api/ai.js:34 (the invite check) runs before line 40 (the per-minute counter), so wrong guesses are never counted.
- What could happen: a short code word is found by trying a word list, and the relay is open again (B4).
- Smallest fix (RELAY): move the per-address counter above the invite check, and count wrong invites under their own key with a low limit (10 a day per address). (MAKO): use a phrase of three or more words.

**S7. The recovery code sits in plain text in the browser, and the page has no content policy.**
- Where: ui42.js:9 (`localStorage['mhr-vault']`), public/index.html (no Content-Security-Policy), no `_headers` file, worker/index.js:27 (assets served as they are).
- What could happen: any script that ever runs in the page (a slip in escaping some AI or file text, a bad browser extension) can read the code and with it read, overwrite or delete the cloud copy.
- Smallest fix (MAIN): add a `<meta http-equiv="Content-Security-Policy">` in the build with `default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'` (script and style need `'unsafe-inline'` while the page is one file; the `connect-src 'self'` part still stops stolen data from being sent elsewhere). Test it on the live address first, and note the downloaded-file copy needs the relay address added to `connect-src`.

**S8. The usage table keeps people's network addresses for ever.**
- Where: functions/api/ai.js:40 (`m:<ip>:<minute>`), vault/[id].js:20 (`v:<ip>:<minute>`), functions/_lib.js:37-41. Nothing deletes old rows.
- What could happen: the database slowly becomes a log of who used the app and when, by address, for as long as the site lives; it also grows without end.
- Smallest fix (VAULT, in _lib.js): store a short hash of the address instead of the address, and in `ensureSchema` or once a day run `DELETE FROM usage WHERE day < date('now','-7 day')`.

**S9. The downloaded-file copy talks to the old site.**
- Where: wip/team/RELAY (the old address) against DECISIONS.md:67 (the-burrow is the live one), ui41.js:15 and 191.
- What could happen: a copy opened as a file sends statements and cloud saves to the old Worker, so a person's cloud copy can live on a different site from the one their phone uses, and a restore on the new site finds nothing.
- Smallest fix (MAIN): put the live address in RELAY, or leave it empty until the move is finished. Check whether the two Workers share one D1 database; if not, plan the move of existing cloud copies before the old one is switched off.

### Cost abuse

**S10. A stopped stream is never counted.**
- Where: functions/api/ai.js:76 and 101-105. Usage is added only in `flush`, which does not run when the caller closes the connection early; nothing is counted before the call.
- What could happen: a script starts streaming requests and drops each one before the end; the daily token cap and the per-browser cap never move, and only the 30-a-minute address limit stands between it and the prepaid credit.
- Smallest fix (RELAY): before calling Claude, add one call and a rough input size (characters divided by 4, plus a fixed amount per image or PDF page) to both counters; after the answer, add only the difference. Pass the final count to `ctx.waitUntil` (worker/index.js:22 already provides it).

**S11. The limits fail open, and the per-browser limit is chosen by the caller.**
- Where: functions/api/ai.js:36-47 (no DB, or any counting error, means no limit at all), line 42 (`anon` comes from the request, so a new value gives a fresh 150 calls).
- What could happen: if the database is unbound, full (S2) or slow, the relay serves everyone without any cap; a caller who changes `anon` each time is limited only by address.
- Smallest fix (RELAY): when INVITE_CODES is not set and the counters cannot be read, answer 503 instead of passing the call through; add a daily cap per address (for example 300 calls) next to the per-minute one. Keep "counting never blocks" only for invited callers.

**S12. The relay is a general Claude endpoint, not only The Burrow's.**
- Where: functions/api/ai.js:52 (the caller's own `system` text is appended), 53 and 56 (messages and tools are forwarded as sent, including fields the validator did not look at), line 51 (up to 32,768 output tokens), line 21.
- What could happen: anyone allowed in can use it for any task at full size; the opening instruction in PREFIX is a request to the model, not a control.
- Smallest fix (RELAY): this is acceptable for 10 invited people once B4 is done. To tighten: rebuild each content block and tool from the checked fields only (drop unknown keys), cap `max_tokens` at 24,000 (the largest the page asks for, ui45v.js:84), and cap `system` at the size the page really sends.

---

## LATER

- **L1. CORS answers every origin** (functions/_lib.js:12-17, ai.js:110). Any website can make a visitor's browser call the relay. No cookies or stored secrets are involved, so nothing of the visitor's leaks; it only spreads cost abuse across addresses. Once the Claude mirror and file copies are settled, answer only the site's own origin and `null`. (VAULT for _lib.js, RELAY for ai.js.) The `x-app` header is sent but never checked; requiring it would force a preflight and stop simple cross-site form posts.
- **L2. Body size is checked after the whole body is read** (ai.js:31, vault/[id].js:37). A very large upload costs Worker memory and time before it is refused. Check `content-length` first: about 35 MB for the relay (Anthropic's own request limit is near there, and the validator currently allows about 97 MB in all: 10 images of 7 MB plus 27 MB of PDFs), about 1.5 MB for the vault. (RELAY, VAULT.)
- **L3. Errors from worker/index.js carry no CORS headers** (lines 21, 23, 25), so a file copy or other origin sees "No connection" instead of the real error. Not a security hole; it hides server faults. Use `fail()` from _lib.js.
- **L4. 403 against 404 tells whether a vault id exists** (vault/[id].js:24, 30). Ids are 256-bit, so this helps nobody. No change needed.
- **L5. `ANTHROPIC_BASE_URL`** (ai.js:61): if this variable were ever set to a wrong host, the key would be sent there. Leave it unset in production; consider honouring it only when a `TEST` flag is also set. (RELAY.)
- **L6. Upstream error text is passed to the page** (ai.js:71, 74), up to 300 characters. Today that text holds no secrets. Keep it, but never add the request or headers to it.
- **L7. `/api/health` says whether an invite is needed and the version** (health.js:4-10). Harmless.
- **L8. The numbers travel in the link's hash when moving from the Claude mirror** (ui41.js:191). The hash never reaches a server and is cleared on arrival (ui41.js:205), but the full link can sit in browser history or be pasted somewhere. Fine for now; a short note beside the button would do.
- **L9. Recovery code generation has a tiny bias** (ui42.js:12, 256 is not a multiple of 31). No practical effect at 99 bits.
- **L10. Prompt injection from statement text.** A statement or receipt line could carry words aimed at the model. The worst outcomes found: wrong rows or categories in the review (the person ticks what to keep), or the assistant proposing a change (the person must tap Apply, and Undo exists). Merchant names and notes from files do enter the assistant's picture later (ui4a.js:43-66). Keep the rule that nothing changes without a tap, and keep showing AI text through `esc()` or `textContent` only.
- **L11. What the public repo shows:** the live addresses and the Cloudflare account subdomain (DECISIONS.md:67, wip/team/RELAY), the D1 database id (wrangler.toml:24), the limits and defaults (ai.js:8-15), and the working papers. None is a secret, and the database id is useless without the Cloudflare login. It does mean an attacker knows where the relay is and what the caps are, which is why B4 matters. Protect the Cloudflare and Anthropic accounts with two-step sign-in.

---

## Who can do what to a cloud copy (summary)

| Action | Needs | One request can |
|---|---|---|
| Read | the recovery code | fetch the current copy, and the previous one with `?prev=1` (still encrypted; the code opens both) |
| Overwrite | the recovery code | replace the current copy; a second write replaces the previous one too (B1) |
| Delete | the recovery code | remove both copies at once, for good (B2) |
| Create junk rows | nothing | add up to 3,000,000 characters per request, 60 a minute per address (S2) |
| Guess a code | not feasible | about 99 bits; the per-address limit is not what protects it |

The person who holds the code holds everything, by design. The real risks are not strangers guessing it: they are the owner's own slips (B1, B2), silent failure (B3), a script running in the page (S7), and a full database (S2).

## What leaves the device, and when (summary)

| What | When | Goes to | Kept there |
|---|---|---|---|
| Statement PDFs, screenshots, CSV or Excel text, as they are | when the person uploads them in setup or Ask | the relay, then Anthropic | relay: nothing; Anthropic: under its API retention policy |
| The whole money picture (name, pay, bills, goals, account names) | each Ask message while the box is ticked | the relay, then Anthropic | same |
| The whole plan, encrypted | every save, when cloud backup is on | the D1 database | until deleted; nobody can read it without the code |
| Network address and a random browser id | every relay or vault call | the usage table | for ever today (S8) |
