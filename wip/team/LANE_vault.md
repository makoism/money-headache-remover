# Vault lane (side G): the server half of the cloud copy

Branch `side/vault-server`, made from `wip-38.31`. Written 2026-11-19. Server only (the vault, and from part 2 the AI relay). Nothing here is live until this branch is merged to main, and that happens only after v1 is deployed and Mako says go.

## What changed, in one paragraph
The server now keeps older copies of each cloud copy, a delete can be undone for 30 days, and "which copy is newer" is decided by the server's own counter and clock, not by a phone's clock. The 38.28 and 38.31 pages keep working with no change. The database only gained things: one new table and two new columns with defaults.

## Files
- `functions/api/vault/[id].js`: the vault (rewritten, same address and same answers for old pages).
- `functions/_lib.js`: the new table and columns, the address tag, clearing old counters.
- `tests/vault_server.test.js`: the server in plain node, 53 checks.
- `tests/vault_clients.test.js`: the real cloud code of the 38.28 and 38.31 pages run as two devices against the server, 28 checks.
- `tests/vault_d1_shim.js`: a stand-in database for those two tests (node's own SQLite). `tests/vault_fixtures/`: the two frozen page files.
- `tests/page_vault.js`: 3 checks added after "Turn off" (kept for a while, listed, undo).
- `functions/api/ai.js`: the relay (part 2, see "The relay" below). `tests/relay_security.test.js`, `tests/relay_clients.test.js`, `tests/relay_harness.js`, `tests/relay_fixtures/`.

## The database (add only)
- New table `vault_versions (id, ver, blob, iv, rev, saved_at, day, size, kind)`, key `(id, ver)`.
- New columns on `vault`: `ver INTEGER NOT NULL DEFAULT 0` and `deleted_at INTEGER` (empty means not deleted).
- Both are added on the first request after the deploy, by `ensureSchema`. No migration step. Nothing is dropped or renamed. Rows written by the 38.28 server read as version 0 and work as they are.
- Checked on the real local Cloudflare runtime: a database made by the 38.28 server, then opened by the new server, keeps its copy and its previous copy.

## What the server keeps for each code
- The latest copy.
- Daily copies: the last copy of each of the last 7 days that had a save (days by UTC, by the server's clock). A person who comes back after a month still has 7.
- Kept copies: the last 5 copies that were replaced by "Keep mine" (a forced save over a copy the device had not seen) or by a save after a delete. Ordinary saves never push these out.
- After a delete: all of the above for 30 days, then it is removed for good.
- Settings on the Worker, all optional: `VAULT_DAILY_COPIES` (7), `VAULT_KEPT_COPIES` (5), `VAULT_KEEP_DAYS` (30).

## The calls (all on `/api/vault/<id>`, header `x-vault-token`, as today)

| Call | Answer |
|---|---|
| `GET` | `{ blob, iv, rev, updated, created, size, ver, now, hasPrev }`. New: `ver` (the counter) and `now` (server time). A deleted copy answers 404 with `deleted: { at, until }`. |
| `GET ?versions=1` | `{ ver, rev, updated, size, now, keepDays, deleted?, versions: [{ ver, rev, saved, day, size, kind }] }`, newest first, no content. `saved` is the server time that copy was stored, `kind` is `daily` or `kept`. Works on a deleted copy too. |
| `GET ?ver=N` | `{ blob, iv, rev, updated, size, ver, kind }` for one copy. 404 if there is no such version. |
| `PUT { blob, iv, rev, base?, force?, invite? }` | `{ rev, updated, created, ver, now }`. 409 `{ error, rev, updated, ver, now }` when the server holds a copy this device has not seen. 413 `too_large` over 1,800,000 characters. 429 for too many saves or too many new copies in a day. |
| `POST { action: 'undelete' }` | `{ restored, ver, rev, updated, now }`. 404 once the 30 days have passed. |
| `DELETE` | `{ deleted, until, keepDays, now }`. Nothing is removed until `until`. |

How "newer" is decided:
- With `base` (a number, the `ver` the device got from its last GET or PUT): the save is accepted only if `base` equals the server's `ver`. The device clock plays no part. A phone with a wrong clock can neither win by mistake nor be locked out.
- Without `base` (38.28 and 38.31 pages): the old rule, `rev` must be higher than the stored one.
- `force: true` always saves, and the copy it replaced becomes a kept version.
- `updated` and `saved` are always the server's time. A `rev` more than one day ahead of the server's time is stored as one day ahead, so a phone with a wrong clock cannot block other devices for ever.
- The same save sent twice (the answer got lost) is answered the same both times and written once.

## For the main session: what the page should call and show (ui42.js)
Nothing has to change for v1. After v1, in this order of value:

1. **Remember `ver`.** Keep `vault.ver` next to `vault.rev` in `mhr-vault`. Set it from every GET and every good PUT (`r.j.ver`). Send it as `base` on every PUT. If the device has no `ver` yet (it just updated from an older page), send no `base` once; the answer gives it one. Decide "newer" in `vaultCheck` with `srv.ver !== vault.ver`, not with `rev`.
2. **On a 409, show both dates before the choice.** The 409 carries `updated` (server time of the cloud copy) and `now`. Show "Cloud copy: saved <updated>. This device: last sent <time>." with "Load it" and "Keep mine". After "Keep mine" say: "Kept yours. The other copy is saved under Earlier copies."
3. **"Earlier copies" in Settings, Cloud backup.** Call `GET ?versions=1`. Show one line per copy: the date and time from `saved` (in the person's own time zone), and "replaced by Keep mine" when `kind` is `kept`. One tap on a line: take a local snapshot first (the v1 snapshot), then `GET ?ver=N`, decrypt, load it the way `vaultApply` does, then save it with `force: true` so it becomes the latest. Wording idea: "Earlier copies. The cloud keeps the last copy of each of the last 7 days you used the app."
4. **Turn off becomes two choices** (security review B2): "Stop on this device" (no DELETE, only forget the code here) and "Delete the cloud copy everywhere". After a delete say: "Deleted. It can be brought back with your recovery code until <date from until>." Do not say "deleted for good" before that date.
5. **Undo a delete.** When a GET with a typed code answers 404 with `deleted`, say: "This cloud copy was deleted on <at>. Bring it back?" and on yes call `POST { action: 'undelete' }`, then GET again and load. The same on `vaultCheck` when the device still has its code.
6. **Other answers to show** (this is also security B3, already with MAIN for v1): 413 as "Your plan is too large for the cloud copy", 429 as "The cloud copy is paused for today, it will try again", anything else as "The cloud copy is behind: last sent <time>."
7. **A device that still has the code after another device deleted**: today its next change quietly starts the cloud copy again (old behaviour, kept so old pages work, and the deleted copy stays as a kept version). The new page should ask instead: "The cloud copy was deleted from another device. Start it again from this device?"

## Tests, and what failed before the fix
Run from the repo root. No wrangler and no browser needed for the first two:
```
node tests/vault_server.test.js     # 53 pass
node tests/vault_clients.test.js    # 28 pass
./tests/dev.sh && node tests/relay.test.js && node tests/page_vault.js && node tests/page_relay.js   # 46, 28, 11 pass
```
Against the 38.31 server, before any change, the same tests gave:
- `vault_server.test.js` (first 39 checks): 10 pass, 29 fail. Every versions, counter and soft delete check failed.
- the 11 security checks added later: all 11 failed before their fix.
- `vault_clients.test.js`: 20 pass, 8 fail. The 20 are the old pages' own story (turn on, save, second device, newer copy, Keep mine, Turn off) and pass before and after, which is the proof that old pages are not broken. The 8 are "what an old page overwrote or deleted is still on the server".
- `page_vault.js` drives the shipped 38.28 page in a real browser against the new server: all 25 old checks pass, plus the 3 new ones.

## Security review (SECURITY_REVIEW.md on side/security-review): what was taken
- **B1** previous copy lasts 3 seconds: done (dated versions, kept copies).
- **B2** one request deletes everything: done (soft delete, 30 days, undo).
- **S2** anyone can fill the database: new cloud copies are limited to 20 a day per address and 200 a day for the whole site (`VAULT_NEW_PER_IP_DAY`, `VAULT_NEW_PER_DAY`). The reviewer proposed 3 and 50. I chose higher because a team on one office network shares one address, and a refused first save is silent on today's pages. Lower them in the dashboard if wanted. The invite word for a first save is built but off (`VAULT_NEW_NEEDS_INVITE=1` turns it on; the page must then send `invite` in the PUT body). It is off because 38.28 and 38.31 pages send no invite, and turning it on would stop them from starting a cloud copy.
- **S3** device clock: done with `base` and `ver`. For old pages a `rev` far ahead is held to one day, not refused, because refusing would silently stop that phone's cloud copy.
- **S4** row size: the limit is now 1,800,000 characters with a clear 413. When the old and new copy together would not fit one row, the in-row previous copy is left empty (the versions table has it).
- **S8** addresses in the counters: `clientIp` now returns a short tag made from the address, never the address. This also covers the relay's counter with no change to `ai.js`. Counter rows older than 7 days are cleared.
- **L2** body size: the vault refuses a body announced as too large before reading it.

Not taken, and why:
- **L1** (answer only our own origin): the downloaded-file copy and the Claude mirror questions are open (S9), so this waits.

Switching on the invite word for a first cloud save: do it only when every page in use sends it. Steps: (1) the page adds `invite: inviteCode()` to the body of its vault PUT (ui42.js `vaultPush`, the same word the relay already gets); (2) that page is deployed and people have reloaded, so no 38.28 or 38.31 page is still open; (3) Mako sets `VAULT_NEW_NEEDS_INVITE = 1` on the Worker. Only the first save of a new code needs the word. Until then the daily limits on new copies are the guard.

## The relay (functions/api/ai.js), added in part 2
The coordinator gave this lane `functions/api/ai.js` on 2026-11-19. The page sends the same requests as before and gets the same answers; nothing changes for 38.28 and 38.31 pages in normal use.

What changed:
- **S6** The per-minute counter now runs before the invite check, so refused calls count. Wrong invite words are counted per address: after 10 in a day (`INVITE_WRONG_PER_DAY`) that address gets 429 until the next day, right word or not. A call with no word at all is refused with 401 as before and is not counted as a guess. Side effect to know: ten wrong tries on one office network lock the AI for that office for the day.
- **S5 and S11** The limits no longer fail open. With no invite word set, a call is served only if the counters work; with no database, or a failing one, the answer is 503 `relay_unconfigured`. With an invite word set, an invited caller is still served. New: a daily cap per address, 300 calls by default (`IP_DAILY_CALLS`, the reviewer's figure, right for about 10 users and safer for the prepaid credit), which holds even when the browser id changes. A whole team on one office address shares these 300; raise the setting in the dashboard if that is too tight.
- **S10** Every call is counted before Claude is asked (one call and a rough size) and corrected to the real numbers after the answer. A stream dropped half way stays counted. A call Claude refused is taken back, as before.
- **S12** Messages, content blocks and tools are rebuilt from the checked fields only; extra fields a caller adds are left behind. `max_tokens` is capped at 24000, the most the page asks for (it was 32768). The `system` size limit is unchanged (80000 characters): I did not measure what the page really sends.
- **L2** A body announced as larger than 36 MB is refused with 413 `prompt_too_large` before it is read.
- **L5** `ANTHROPIC_BASE_URL` is honoured only together with `RELAY_TEST=1`. If it is set without the flag the relay refuses every call and sends the key nowhere. Both stay unset on the live Worker. The two test settings files (`tests/wrangler.dev.toml`, `tests/wrangler.invite.toml`) now carry the flag.
- `_lib.js`: the "tables are ready" memo is now kept per database, not once per process (needed for tests, harmless live).

Relay tests (a fake Anthropic only; the harness stops any request that is not to this machine):
```
node tests/relay_security.test.js   # 26 pass. Before the fix: 12 pass, 14 fail.
node tests/relay_clients.test.js    # 27 pass, before and after: the real relay code of the 38.28 and 38.31 pages
```
`relay_clients` covers, for each page: a plain question, a streamed answer, a JSON answer, a tool round trip, a statement as text, a statement as PDF, a photo, the busy and too-large errors, and the invite word.
On the local Cloudflare runtime with the shipped 38.28 page in a browser: `relay.test.js` 46 pass, `page_relay.js` 11, `page_vault.js` 28, `page_cam.js` 11. Two things not from this lane: `page_assistant.js` has 1 fail ("Home shows goals first"), the same with and without the relay change; `page_import.js` could not run here because its spreadsheet fixture (`/tmp/v28/wallet.xlsx`) is not in the repo and the note it points to (`tests/README`) does not exist. Someone who has that file should run it once before the merge.

For the deploy session (files this lane may not touch):
- **L3** `worker/index.js` lines 21, 23, 25: the 405, 500 and 404 answers carry no CORS headers, so a page on another origin sees "No connection" in place of the real error. Fix: build them with `fail()` from `functions/_lib.js`.
- `wrangler.toml`: nothing needed. Do not add `ANTHROPIC_BASE_URL` or `RELAY_TEST` there.
- Before the deploy, check in the dashboard that the live Worker has no `ANTHROPIC_BASE_URL` variable. If it had one, the relay would now refuse every call.
- After the deploy, `/api/health` must say `vault: true`. If the database binding were ever missing and no invite word were set, the relay now answers 503 for everyone.

For the main session, relay side:
- 429 now has three more causes with their own messages (network daily limit, too many wrong code words, as well as the old ones). The page already shows the server's message for `rate_limited`; check it reads well.
- A wrong saved invite word: after a 401 the page should ask for the word again and not resend the wrong one on every call, or ten calls lock the network for the day.

## Wiring point for the ledger step (from coordinator 3, 2026-11-19)
The ledger (after v1) will use a new storage key, because shipped 38.31 pages cannot know its version. Rule: anything on the page that uploads to the vault must pass the same guard as local saves (`ledgerMayWrite`), so an older page never overwrites a ledger copy. In ui42.js that means `vaultPush` (also with `force`, so "Keep mine" too) and the load of an earlier copy followed by a forced save.

What the server gives today: an older page that overwrites a ledger copy does not destroy it. With `base`, or with the old `rev` rule, the save is refused with 409 unless the person taps "Keep mine"; if they do, the ledger copy stays as a kept version and can be loaded back.

Not built, a possible server half if wanted at the ledger step: the page sends a format number with each save (for example `fmt: 2`), the server stores it, and refuses with 409 any save that carries a lower one or none, `force` included. Old pages would then be unable to overwrite a ledger copy at all. It needs one more added column with a default, and a decision on what the old page shows, since its "Load it" would then try to load a ledger copy it cannot read.

## Before this merges
1. `tests/page_import.js` must run and pass against this branch. It could not run in this lane: its fixture `/tmp/v28/wallet.xlsx` is not in the repo. The fixture question is with the main session.
2. The one failing check in `tests/page_assistant.js` ("Home shows goals first") is with the main session. It fails the same with and without this branch.
3. L3: `worker/index.js` lines 21, 23, 25 should answer through `fail()` from `functions/_lib.js`, so errors carry CORS headers (deploy session).
4. The live Worker must have no `ANTHROPIC_BASE_URL` variable. With one set, the relay refuses every call.
5. After the deploy `/api/health` must say `vault: true`. With no database and no invite word the relay now answers 503.
6. Ledger step: every vault upload on the page passes `ledgerMayWrite` (see "Wiring point for the ledger step").
7. v1 is deployed and Mako has said go.

## Things to know before the merge
- **A push to main deploys this.** The first vault request after the deploy adds the table and the two columns. No step for Mako.
- **Rollback.** The old server can read the upgraded table. Two effects if the server is rolled back after people used it: a copy deleted in the meantime shows up as live again to the old server, and the counter stops moving until the new server is back. No data is lost either way.
- **Privacy wording.** A delete now keeps the encrypted copy for 30 days. The page text "Cloud copy deleted" should say so (point 4 above). The server still cannot read any copy.
- **Database size.** Each code can now hold up to 13 copies. A normal plan is a few kilobytes, so this is small. The D1 limit of 2 MB per row is from Cloudflare's docs and was not tested against the live database; the local runtime does not enforce it.
- **A plan that keeps growing** (receipts are never trimmed, E14) will one day reach 1,800,000 characters. The cure is on the page: compress before encrypting (CompressionStream), which gives about ten times the room. Worth doing with the ledger.
- `tests/page_vault.js` and `tests/dev.sh` use fixed paths (`/home/claude/work/tools`, `/tmp/v22/lib.js`, `/tmp/v28`). In a fresh container: install `wrangler` and `puppeteer-core` under `/home/claude/work/tools`, copy `tests/regression/v22/lib.js` to `/tmp/v22/`, make `/tmp/v28`.
