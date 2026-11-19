# Vault lane (side G): the server half of the cloud copy

Branch `side/vault-server`, made from `wip-38.31`. Written 2026-11-19. Server only. Nothing here is live until this branch is merged to main, and that happens only after v1 is deployed and Mako says go.

## What changed, in one paragraph
The server now keeps older copies of each cloud copy, a delete can be undone for 30 days, and "which copy is newer" is decided by the server's own counter and clock, not by a phone's clock. The 38.28 and 38.31 pages keep working with no change. The database only gained things: one new table and two new columns with defaults.

## Files
- `functions/api/vault/[id].js`: the vault (rewritten, same address and same answers for old pages).
- `functions/_lib.js`: the new table and columns, the address tag, clearing old counters.
- `tests/vault_server.test.js`: the server in plain node, 53 checks.
- `tests/vault_clients.test.js`: the real cloud code of the 38.28 and 38.31 pages run as two devices against the server, 28 checks.
- `tests/vault_d1_shim.js`: a stand-in database for those two tests (node's own SQLite). `tests/vault_fixtures/`: the two frozen page files.
- `tests/page_vault.js`: 3 checks added after "Turn off" (kept for a while, listed, undo).

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
- **RELAY fixes (S6, S10, S11, S12, L5)**: `COORDINATOR.md` on wip-38.31 says side G now owns `functions/api/ai.js`, but my brief says not to touch it. I did not touch it. Tell me directly and I will take them.

## Things to know before the merge
- **A push to main deploys this.** The first vault request after the deploy adds the table and the two columns. No step for Mako.
- **Rollback.** The old server can read the upgraded table. Two effects if the server is rolled back after people used it: a copy deleted in the meantime shows up as live again to the old server, and the counter stops moving until the new server is back. No data is lost either way.
- **Privacy wording.** A delete now keeps the encrypted copy for 30 days. The page text "Cloud copy deleted" should say so (point 4 above). The server still cannot read any copy.
- **Database size.** Each code can now hold up to 13 copies. A normal plan is a few kilobytes, so this is small. The D1 limit of 2 MB per row is from Cloudflare's docs and was not tested against the live database; the local runtime does not enforce it.
- **A plan that keeps growing** (receipts are never trimmed, E14) will one day reach 1,800,000 characters. The cure is on the page: compress before encrypting (CompressionStream), which gives about ten times the room. Worth doing with the ledger.
- `tests/page_vault.js` and `tests/dev.sh` use fixed paths (`/home/claude/work/tools`, `/tmp/v22/lib.js`, `/tmp/v28`). In a fresh container: install `wrangler` and `puppeteer-core` under `/home/claude/work/tools`, copy `tests/regression/v22/lib.js` to `/tmp/v22/`, make `/tmp/v28`.
