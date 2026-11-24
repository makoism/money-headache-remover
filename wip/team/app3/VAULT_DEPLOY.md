# Vault server: the five changes, and how they go live

Mako approved all five (FOR_MAKO.md, top). Built on lane/vault; the push for main is the branch `main-vault`.
Nothing is deployed until MAIN pushes `main-vault` to main. Cloudflare then runs `npx wrangler deploy` by itself.

## What changes (only for app3's copies; the old app keeps today's rules)

The server tells the two kinds of copy apart without decrypting anything. The old app (38.28 on main, 38.31 in wip) sends
AES-GCM ciphertext in base64, which never reads as JSON. app3 sends its pack envelope `{ fmt, v, enc, iv, data }` as JSON
in base64 (cloud3.js `wrap`), and it sits under a different id for the same code (E3).

1. **No base, no write.** Once an app3 copy exists, a write that names no `base` gets 409 conflict with the stored rev.
   `force` does not get round it for an app3 copy (app3 never sends it). cloud3 then takes the latest, joins, sends again.
2. **Format and shape.** An app3 write whose fmt is not `gz1`, that is not encrypted (`enc` not `aes-gcm`), or whose `v`
   is not a number gets 422 `unknown_format`; `v` above 3 gets 422 `newer_shape`. Over an app3 copy, a blob that is not
   an envelope is 422 too. The newest shape taken is 3, raised by a `VAULT_MAX_V` variable with no code change.
3. **The last 10 dated versions.** Every write keeps the copy it replaces in a new table `vault_versions`, with the date it
   was written; only the last 10 per copy stay. `GET ?versions=1` lists them (`{ rev, updated, versions: [{ rev, updated,
   size }] }`, newest first); `GET ?rev=N` reads one (`{ blob, iv, rev, updated }`, 404 when not kept). This is for every
   copy, old app included, and changes nothing the old app reads. On the first write to a copy already on the server,
   its stored previous version (`prev_blob`) joins the list too, with no date. Deleting a copy deletes its versions.
   Also: a write now stores only while the row is still the one it checked, so two writes at the same moment can no
   longer both pass; the second gets 409 (before, it could overwrite, or a second first write gave a 500).
4. **Deleted marker.** Deleting an app3 copy leaves a row in a new table `vault_gone`. After that, GET gets 410
   `deleted` (`{ deleted: <time> }`), and any write gets 410 too, so a device still holding the old copy can never send it
   back. A fresh turn-on makes a new code, so a new id, and is never blocked. A write with `fresh: true` on the same id
   lifts the marker (app3 does not send it today). The old app's deletes leave no marker.
5. **Daily writes per copy: 1,500** (was 400). The cap lives in `functions/api/vault/[id].js` as the default of the
   `VAULT_WRITES_PER_DAY` variable. **If that variable is set in the Cloudflare dashboard, it still wins** (keep_vars is on):
   see "Before the push".

## The schema change: no migration step

Cloudflare runs only `wrangler deploy`, never a D1 migration. So the server sets itself up on first use, as it already did
(`functions/_lib.js` `SCHEMA`, run once per database per worker):

```sql
CREATE TABLE IF NOT EXISTS vault_versions (id TEXT NOT NULL, rev INTEGER NOT NULL, blob TEXT NOT NULL, iv TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, updated_at INTEGER);
CREATE INDEX IF NOT EXISTS vault_versions_id ON vault_versions (id, rev);
CREATE TABLE IF NOT EXISTS vault_gone (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, rev INTEGER NOT NULL, deleted_at INTEGER NOT NULL);
```

Only new tables and an index, each "if not exists". The `vault` and `usage` tables are not touched: no column added,
changed or dropped, no row changed. Safe to run any number of times on the live database. Tested on a database built in
today's exact shape with a copy and its previous version already in it (tests E10 to E15).

## Tests (node 22, no wrangler, no network)

- `node tests/vault_server/vault_server.test.mjs`: 70 checks. The real handlers through `worker/index.js`, on a D1 stand-in
  over node's own SQLite (`tests/vault_server/d1_stub.mjs`). Part A sends exactly what the old app sends and checks every
  answer it reads; B and E10 to E15 are today's live database; C to G are the five changes.
- `node tests/vault_server/fake_parity.test.mjs`: 44 checks. The same calls to the server and to app3's fake vault
  (`wip/team/app3/tests/fake_vault.js`, updated to the new rules), answers compared. On `main-vault` (no wip/) it skips.
- Both are steps in `wip/team/app3/check3.sh`.

What the old app sends, all tested in part A and unchanged in answer:

| Call | 38.28 (src/ui42.js, live) | 38.31 (wip/team/ui42.js) |
| --- | --- | --- |
| GET /api/vault/<id> | reads 404, 403, or blob, iv, rev, updated | same |
| PUT | `{ blob, iv, rev }`, `{ blob, iv, rev, force: true }`; reads 200, 409 rev/updated, 403 | also `base` when it has one |
| DELETE | Turn off and delete; reads nothing | same |

No old page calls `?prev=1`; it still answers as before.

## Before the push (MAIN)

1. In the Cloudflare dashboard (Workers & Pages > the-burrow > Settings > Variables and Secrets), look for
   `VAULT_WRITES_PER_DAY`. If it is there with 400, change it to 1500 or delete it (deleting uses the code's 1,500).
   If it is not there, nothing to do. SETUP.md's table still says 400; fix it in a later docs commit.
2. Push `main-vault` to main (fast-forward). Files it carries: see the report / `git diff --stat origin/main main-vault`.
   No file in `public/`, nothing the old app or the app3 path serves, and `wrangler.toml` is unchanged.

## After the deploy: what to check (about 5 minutes)

1. `https://the-burrow.mako-162.workers.dev/api/health`: `"vault":true`, version 38.28 as before.
2. The old app on Mako's phone, if its cloud backup is on: Settings shows it on, and after a change "Last sent" moves.
   Turning it off is not needed.
3. Optional, with a made-up id and token (64 hex characters each, used nowhere else). Old-app style first:
   ```sh
   B=https://the-burrow.mako-162.workers.dev/api/vault; ID=$(openssl rand -hex 32); T=$(openssl rand -hex 32)
   curl -s $B/$ID -H "x-vault-token: $T"                         # 404 not_found
   curl -s -X PUT $B/$ID -H "x-vault-token: $T" -H 'content-type: application/json' -d '{"blob":"QUJDRA==","iv":"AAAAAAAAAAAAAAAA","rev":1}'   # 200 created true
   curl -s $B/$ID?versions=1 -H "x-vault-token: $T"              # 200 versions [] (the new table is there)
   curl -s -X DELETE $B/$ID -H "x-vault-token: $T"               # deleted true, then GET gives 404 again
   ```
   An app3-style refusal (stores nothing): PUT with `"blob":"<base64 of {\"fmt\":\"gz1\",\"v\":4,\"enc\":\"aes-gcm\",\"iv\":\"x\",\"data\":\"x\"}>"` gives 422 `newer_shape`.
4. app3 on the private path, with the cloud copy on: Send now still says sent.

## Roll back

One line: `git revert --no-edit <the main-vault commit> && git push origin main` (Cloudflare redeploys the old code), or
in the dashboard: Workers & Pages > the-burrow > Deployments > the one before > Rollback.
The two new tables stay and the old code ignores them, so no data is lost and nothing needs undoing in D1. While rolled
back, the five protections are off again (a device could again send back a deleted app3 copy); the old app is unaffected
either way.

## What Mako approves

- The five changes: approved (Coordinator 10, cdc79fe).
- The push to main that deploys them, and the dashboard variable in "Before the push" step 1 if it is set to 400.

## For Mako's run (words, not blocking)

- app3 shows a deleted cloud copy (410) as a general server problem. A line like "This cloud copy was deleted on another
  device. Turn it on again to start a new one" would be clearer. app3 has no screen yet for the 10 kept versions; the
  server keeps them now so one can be added later without losing history.
