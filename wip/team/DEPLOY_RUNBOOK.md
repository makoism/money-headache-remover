# The Burrow: deploy runbook

For a fresh deploy session. It needs no other context. Read the whole page once, then follow the part you were sent to do.

Written 2026-11-19 by the deploy-prep side lane (revised the same day). That lane deployed nothing. Version numbers below say 38.31 as the example; put the real one in its place.

## The rules that never change

- You deploy only when the coordinating session tells you Mako said go, for that deploy. A go for v1 is not a go for the vault and relay merge. A go for an earlier build does not count.
- There are two separate deploys, always in this order, never together:
  1. **Part A: v1**, the page (branch `wip-38.31`, version 38.31 or later).
  2. **Part B: the vault and relay server** (branch `side/vault-server`), later, after v1 is live and checked.
- Never force-push, never reset `main`, never push to `main` by any route other than the merge in the steps below.
- No pull request is needed for a deploy. The merge commit on `main` is the deploy.
- Nobody runs wrangler by hand. Cloudflare runs `npx wrangler deploy` by itself on every push to `main`. So "deploy" means one push to `main`.
- The sessions cannot open the live site. Mako checks it (Part E). Say so plainly in every report, and never write "checked live".
- No secrets in chat, in the repo or in a report. Not the Anthropic key, not the invite phrase.

## What a deploy is

- Cloudflare serves `public/` and runs `worker/index.js` with `functions/`. `wrangler.toml` carries the version that `/api/health` reports. Only those places change what people get.
- `build_site.sh` (repo root) makes `public/` from `wip/team` and `pwa/`, copies `wip/team` into `src/`, and sets the version in `wrangler.toml`. It needs nothing outside the repo and never touches `tests/`.
- `deploy_dry_run.sh` (repo root) builds into a scratch folder and checks everything without changing or pushing anything. Its last line is `DRY RUN OK` or `DRY RUN FAILED`. It is made for Part A. It is not made for Part B (see B3).
- People's numbers live in their own browser, per address. A deploy does not touch them. The new page reads them when it opens.
- Cloud copies live in the Cloudflare database `money-vault` (D1). Part A does not change it. Part B only adds to it.

Addresses:
- Live: https://the-burrow.mako-162.workers.dev
- Health: https://the-burrow.mako-162.workers.dev/api/health
- Mirror: https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w
- Old (frozen, see Part D): https://money-headache-remover.mako-162.workers.dev

## Where the files are (read this first)

On 2026-11-19 `build_site.sh` (the new version), `deploy_dry_run.sh` and this runbook exist only on the branch `side/deploy-prep`. They are not on `wip-38.31` or on `main`. Step A1 brings them in. `side/deploy-prep` was checked on 2026-11-19: merging it into `wip-38.31` is clean (it only adds or changes `build_site.sh`, `deploy_dry_run.sh`, `wip/team/DEPLOY_RUNBOOK.md`, `wip/team/LANE_deploy.md`).

---

# Part A. Deploy v1 (the page)

## A0. Before anything (all must be true)

1. The coordinating session says Mako's go for this exact version is recorded.
2. `./check.sh full` printed ALL GOOD on the commit being deployed (RESUME.md section 6).
3. Both gates (qc-north-star, qc-numbers) passed on that same build.
4. Mako has seen STEP8_COMPARE.md.
5. Mako has saved a backup file from the live app, on each device that holds real numbers (see A0b). The coordinating session confirms it in writing. Without it, stop. Reason: if the deploy is rolled back, the old page (38.28) would open numbers saved by the new page, and that direction has not been tested. The backup file is the way back.
6. Nothing else is changing the release branch. Only the deploy session writes to it and to `main` now.
7. The release notes are ready in plain words (RESUME.md section 4).
8. The coordinating session knows whether this release changes `worker/` or `functions/`. On 2026-11-19 v1 changes neither. If it does, say so before the go (rollback then needs more care).

If any of these is not true, stop and tell the coordinating session.

## A0b. Mako's backup file (written for him, the coordinating session passes it on)

On each phone or computer that holds real numbers, in the live app (the old version, before the update):
1. Open the app. Go to Basics, then Backup.
2. Tap **Save file**. Android puts it in the Downloads folder. The name looks like `mhr2000-` then the date.
3. If the phone refuses the file, tap **Copy text** and paste the text into a note to yourself instead.
4. Also write down on paper or in a note two numbers you can see on Home, so you can compare after the update.
5. Tell the chat "backup saved".

## A1. Get the release branch, clean, with the deploy scripts

```
git fetch origin main wip-38.31 side/deploy-prep
git checkout wip-38.31 && git pull --ff-only origin wip-38.31
git status --short            # must print nothing
git log -1 --format='%h %s'   # must be the commit the checks and gates ran on
git rev-parse origin/main     # WRITE THIS DOWN: it is the last deploy, the rollback point (LAST)
```

On 2026-11-19 the last deploy was `e15e25d` (38.28).

Bring in the scripts and this runbook (they change no app file):

```
git merge --no-ff origin/side/deploy-prep -m "Add deploy scripts and runbook (no app file changes)"
git diff --name-only HEAD~1 HEAD     # must list only: build_site.sh, deploy_dry_run.sh, wip/team/DEPLOY_RUNBOOK.md, wip/team/LANE_deploy.md
chmod +x build_site.sh deploy_dry_run.sh   # only if git shows them as not executable
```

If the merge has conflicts or lists other files, stop and tell the coordinating session. Do not push yet.

## A2. Dry run

```
./deploy_dry_run.sh
```

It must end `DRY RUN OK`. Read section 2 of its output:
- "The files Cloudflare serves or runs" should list `public/index.html`, `public/sw.js` and `wrangler.toml`, plus any `worker/` or `functions/` file that was changed on purpose in this release. A file there that nobody meant to change is a stop.
- "main is behind this branch in a straight line" must say PASS. If it fails, someone pushed to `main`: merge `main` into the release branch, rerun the checks, start again.

The picture `page.png` in the scratch folder is the built page at phone size. Look at it.

If it ends `DRY RUN FAILED`, fix the cause on the release branch, rerun the checks that the fix touches, and run it again. Never deploy past a failed line.

## A3. Build into the repo and commit on the release branch

```
./build_site.sh
git status --short
```

Only `public/`, `src/` and `wrangler.toml` may show. If anything under `tests/` or `wip/` shows, stop: that is not from this script.

If `build_site.sh` prints STOP, it wrote nothing. The two usual messages:
- "version stamp mismatch": the page does not carry the version in `wip/team/VERSION`. Fix VERSION or the page, rerun the checks.
- "not the same as wip/money-map-team.html": the sources changed after the page was built and tested. Run `wip/team/build.sh`, rerun the checks, commit, then build again.

```
git add public src wrangler.toml
git commit -m "38.31 build: public, src and wrangler.toml from wip/team"
git push -u origin wip-38.31
./deploy_dry_run.sh           # once more, on the committed build. Must end DRY RUN OK
```

In this second run "The build commit would change 0 files" is the proof that the repo holds exactly what was built.

## A4. Put it on main (this is the deploy)

One merge commit per deploy, so `git log --first-parent main` reads one line per version and rollback is one revert.

```
git checkout main && git pull --ff-only origin main
git merge --no-ff wip-38.31 -m "38.31: <one line on what changed for people>"
git diff --stat HEAD wip-38.31      # must print nothing: main now holds exactly the tested tree
git push origin main
git rev-parse HEAD                  # WRITE THIS DOWN: the deploy commit (DEPLOY)
```

Earlier deploy commits read like "38.28: new copies start in yen; a saved copy with no currency stays pesos". Keep that style. Add the usual attribution lines at the end of the message.

If the push is refused, do not force it. Fetch, look at what is on `main`, and go back to A2.

Then go back to the release branch: `git checkout wip-38.31`.

## A5. Watch the Cloudflare run

- Look at the check runs on the deploy commit with the GitHub tools. Cloudflare's build shows there if the repo link reports it.
- If nothing shows after a few minutes, ask Mako to look: Cloudflare dashboard, Workers & Pages, the-burrow, Deployments. The newest one should be the deploy commit and say it succeeded.
- A failed run leaves the old version live. Nothing is broken for people. Read the build log, fix, and start again from A2.

## A6. Update the Claude artifact mirror (DECISIONS decision 10)

The mirror is the plain page, `wip/money-map-team.html`, with the fonts and the welcome video beside it (12 files). Only the page changes in a deploy.

1. Read it first with the Artifact tool: action `read`, url `https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w`. Note the version it serves now. If the read fails or the artifact is gone, the mirror is retired: tell the coordinating session and skip the rest of this step.
2. Publish the page to the same address: Artifact tool, `url` as above, `file_path` `wip/money-map-team.html`. Pass no `files`, no `capabilities` and no `icon`, so the fonts, the video and the settings it already has are kept. Do not send the two video files again; they are too big for one publish and are already there.
3. Check it: action `read` again must show `Version 38.31`, and action `list` with `scope: "files"` must still show 12 files (fonts, `hello.mp4`, `hello-av1.mp4`, `hello.jpg`, `index.html`).
4. If the publish is refused because the live version is newer than the one read, read again and publish again. Never use `force`.

The mirror has no service worker and no install files. That is as before. Note: until Part D is done, the mirror's "Open it and move my numbers" button still points at the OLD address.

## A7. The old address (do this after v1 is live and checked)

Part D lists every place the old address appears and what to change. Hand it to the coordinating session as a step after v1. It is not part of this deploy.

## A8. Report to the coordinating session

Send: the deploy commit, the Cloudflare result (or "Mako needs to look"), the mirror result, the live link, the screenshot from the dry run, the release notes, and Part E for Mako. Say that the live page itself has not been seen by any session.

## A9. Rollback of v1: back to the last deploy

Use it when the live page loses or misstates numbers, will not open, or Mako says so. Rolling back is safe for the site.

Fast way (Mako, about a minute): Cloudflare dashboard, Workers & Pages, the-burrow, Deployments. Find the deployment before the new one, open its menu, choose Rollback. The old version is live again right away. This does not change `main`. Do the git way too, or the next push to `main` puts the new version back.

Git way (the deploy session), with `DEPLOY` the commit from A4 and `LAST` the commit written down in A1:

```
git fetch origin main && git checkout main && git pull --ff-only origin main
git revert -m 1 --no-edit DEPLOY
git diff --stat LAST HEAD -- public worker functions wrangler.toml    # must print nothing
git commit --amend -m "Roll back 38.31 to 38.28: <why, one line>"
git push origin main
```

The empty diff is the proof that Cloudflare will serve exactly the last deploy again. Never force-push `main` and never reset it. Then watch the Cloudflare run as in A5.

If other commits landed on `main` after the deploy, revert only the deploy commit, and check the same diff for the files that matter.

To deploy the release again later, a plain merge will not bring the changes back after a revert. Revert the revert first (`git revert <the rollback commit>`), then carry on from A2.

The mirror after a rollback: build the old page in a scratch folder (`git worktree add <scratch> LAST`, run `src/build.sh` there, it writes `money-map-team.html` beside `src/`), publish that file the same way as A6, remove the worktree. `git show LAST:src/VERSION | head -1` gives the version to expect.

After a rollback, Mako checks (Part E, "after a rollback"). If numbers look wrong on a device: Basics, Backup, load the backup file saved before the update (A0b).

---

# Part B. Deploy the vault and relay server (side/vault-server)

Do this only after Part A is live and Mako's checks passed, and only after the coordinating session says Mako said go for this merge.

What it is: the server now keeps older copies of each cloud copy, a delete can be undone for 30 days, "which copy is newer" is decided by the server, and the AI relay is hardened (invite guesses counted, daily cap per address, nothing fails open). Pages 38.28 and 38.31 keep working with no change. The database only gains things (one new table, two new columns with defaults), added by the server on the first request after the deploy. There is no migration step.

## B1. Before this merges (all must be true; this is the list from LANE_vault.md plus the review items)

1. v1 is deployed and Mako has said go for this merge (recorded by the coordinating session).
2. `tests/page_import.js` runs and passes against the merged tree. It could not run in the vault lane because its fixture `/tmp/v28/wallet.xlsx` is not in the repo. The main session owns that question; get a written pass or a written skip-with-reason from the coordinating session.
3. The one failing check in `tests/page_assistant.js` ("Home shows goals first") has been judged by the main session (it fails the same with and without this branch). Get that in writing.
4. **L3 is fixed** in `worker/index.js` (the three error answers at lines 21, 23, 25 carry no CORS headers, so a page on another origin sees "No connection" instead of the real error). This is the deploy session's job. See B2 step 4 for the exact change.
5. **The live Worker has NO `ANTHROPIC_BASE_URL` variable, and no `RELAY_TEST` variable.** With `ANTHROPIC_BASE_URL` set and no `RELAY_TEST`, the relay refuses every call. Mako checks this in the dashboard ("Only Mako can do these", step 5). Also check the repo: `grep -n "ANTHROPIC_BASE_URL\|RELAY_TEST" wrangler.toml` must print nothing. Do not add either to `wrangler.toml`.
6. **`INVITE_CODES` is set on the live Worker, to a long phrase** (security review B4 and S6). The merge makes wrong guesses count: 10 wrong words in a day lock that network address out of the AI until the next day. A short word is guessable; a long phrase is not. Mako does this ("Only Mako can do these", step 2).
7. **Auto-reload is off** in the Anthropic console and a **monthly spend limit** is set (B4). Mako does this (steps 3 and 4).
8. **`/api/health` says `"vault":true`** before the merge, and must say it after. Without the database binding and without an invite phrase, the relay now answers 503 to everyone (it no longer fails open).
9. If the ledger page code is on `main` by then: every vault upload on the page passes `ledgerMayWrite` (LANE_vault.md "Wiring point for the ledger step"). If the ledger is not in this release, the coordinating session says "not in this merge" in writing.
10. The settings below are known and none needs changing now. All are optional; with nothing set, the defaults apply.

New settings on the Worker (all optional, set in the Cloudflare dashboard if ever wanted):

| Setting | Default | What it does |
|---|---|---|
| `IP_DAILY_CALLS` | 300 | AI calls a day from one network address, whatever browser id is sent. A whole team on one office address shares these 300. Raise it if that is too tight. |
| `INVITE_WRONG_PER_DAY` | 10 | Wrong invite words a day from one address. After that the address waits until tomorrow, even with the right word. |
| `VAULT_DAILY_COPIES` | 7 | Days that keep their last cloud copy. |
| `VAULT_KEPT_COPIES` | 5 | Copies kept after "Keep mine" or a save after a delete. |
| `VAULT_KEEP_DAYS` | 30 | How long a deleted cloud copy can be brought back. |
| `VAULT_NEW_PER_IP_DAY` | 20 | New cloud copies a day from one address. |
| `VAULT_NEW_PER_DAY` | 200 | New cloud copies a day for the whole site. |
| `VAULT_NEW_NEEDS_INVITE` | off | Do not switch on until every page in use sends the invite word with a first cloud save (38.28 and 38.31 pages do not). |
| `VAULT_WRITES_PER_DAY` | 400 | Saves a day for one cloud copy. |
| `VAULT_IP_PER_MINUTE` | 60 | Vault requests a minute from one address. |

Settings that already existed and stay as they are: `IP_PER_MINUTE` 30, `USER_DAILY_CALLS` 150, `DAILY_TOKEN_CAP` 3000000, `MODEL_QUICK`, `MODEL_DEFAULT`, `MODEL_COMPLEX`.

## B2. The exact steps

```
git fetch origin main side/vault-server
git checkout -B release-vault origin/main      # starts from main, which holds v1 by now
git status --short                             # must print nothing
git rev-parse origin/main                      # WRITE THIS DOWN: the rollback point (LAST2)
git merge --no-ff origin/side/vault-server -m "Vault and relay: older cloud copies, 30-day undo for a delete, server decides newer, relay limits that do not fail open"
```

Conflicts: stop and tell the coordinating session. The branch was made from `wip-38.31` and changes only `functions/`, `tests/` and `wip/team/LANE_vault.md`, so a conflict means something unexpected landed.

**Step 4, L3.** Make the three early error answers in `worker/index.js` carry the CORS headers. `json()` in `functions/_lib.js` adds them and takes extra headers as its third argument. In `worker/index.js`:

- add to the imports: `import { json } from '../functions/_lib.js';`
- 405: `return json({ error: { code: 'method_not_allowed', message: request.method + ' is not allowed here.' } }, 405, { allow: Object.keys(METHOD).filter(k => r.mod[METHOD[k]]).join(', ') });`
- 500: `return json({ error: { code: 'server_error', message: 'Something broke on the server.' } }, 500);`
- 404: `return json({ error: { code: 'not_found', message: 'No such API path.' } }, 404);`

Prove it before and after the change with this check (run from a scratch folder, not inside the repo; it prints status and the CORS header for a wrong method and an unknown path):

```
cat > "$SCRATCH/l3.mjs" <<'E'
const m = await import(process.argv[2] + '/worker/index.js');
const call = async (u, method) => { const r = await m.default.fetch(new Request('https://x.test' + u, { method }), {}, { waitUntil() {} }); return r.status + ' ' + r.headers.get('access-control-allow-origin'); };
console.log('405', await call('/api/health', 'PATCH'));
console.log('404', await call('/api/nope', 'GET'));
E
node "$SCRATCH/l3.mjs" "$PWD"
```

Before the change it prints `405 null` and `404 null`. After it must print `405 *` and `404 *`. (A server error answer, 500, is covered by the same code path; `functions/_lib.js` is the same file the other answers use.) Then:

```
git add worker/index.js && git commit -m "worker: early API errors answer through json() so they carry CORS headers (L3)"
```

**Step 5, tests on this exact tree.** Plain node, no browser, from the repo root:

```
node tests/vault_server.test.js      # 53 pass
node tests/vault_clients.test.js     # 28 pass
node tests/relay_security.test.js    # 26 pass
node tests/relay_clients.test.js     # 27 pass
```

All four must pass. The local-runtime tests (`./tests/dev.sh` then `node tests/relay.test.js` 46, `tests/page_vault.js` 28, `tests/page_relay.js` 11) use fixed paths (`/home/claude/work/tools`, `/tmp/v22/lib.js`, `/tmp/v28`) and need `wrangler` and `puppeteer-core` installed; the main session's environment has them. Ask the coordinating session for those results on this same commit, or run them where the paths exist.

**Step 6, the tree holds exactly what was meant.**

```
git diff --name-only origin/main HEAD | grep -vE '^(functions/|worker/index\.js$|tests/|wip/team/LANE_vault\.md$)'   # must print nothing
git diff --stat origin/main HEAD -- public src wrangler.toml                                                         # must print nothing
git diff --stat origin/main HEAD -- worker functions                                                                  # the files that go live: functions/_lib.js, functions/api/ai.js, functions/api/vault/[id].js, worker/index.js
```

The page does not change and the version does not change in this deploy. If `public/` or `wrangler.toml` shows, stop.

**Step 7, put it on main (this is the deploy).**

```
git checkout main && git pull --ff-only origin main
git merge --no-ff release-vault -m "Vault and relay server: <one line on what changed for people>"
git diff --stat HEAD release-vault      # must print nothing
git push origin main
git rev-parse HEAD                      # WRITE THIS DOWN: the deploy commit (DEPLOY2)
git push -u origin release-vault        # keeps the exact tree that went live
```

Add the usual attribution lines to the merge message. If the push is refused, do not force it; fetch, look, start again from B2.

Then watch the Cloudflare run as in A5.

## B3. Why the dry run script is not used here

`deploy_dry_run.sh` fails two checks by design when nothing about the page changes: "main already says version X. Bump wip/team/VERSION" and "sw.js cache name differs from the one on main". Part B changes no page and no version, so the script would say `DRY RUN FAILED` for the right reason. Use the direct checks in step 6 instead. Do not bump the version just to make the script pass.

## B4. Checks after (the sessions cannot open the live site; Mako does these, Part E)

- `/api/health` shows `"vault":true`, `"ai":true`, `"invite":true` and the same version as before the merge.
- On a phone with a cloud copy: Settings, Cloud backup still shows the copy and saving works. The first save after the deploy creates the new table and columns; nothing for Mako to do.
- The assistant answers one question.
- Numbers are all there.

Tell the coordinating session what Mako saw, per device.

## B5. Rollback of the vault and relay merge

With `DEPLOY2` the commit from B2 step 7 and `LAST2` the commit written down at the start of B2:

```
git fetch origin main && git checkout main && git pull --ff-only origin main
git revert -m 1 --no-edit DEPLOY2
git diff --stat LAST2 HEAD -- public worker functions wrangler.toml    # must print nothing
git commit --amend -m "Roll back the vault and relay server: <why, one line>"
git push origin main
```

Mako's fast way in the dashboard (Deployments, Rollback) works the same as in A9. Do the git way too.

What a rollback does, so nobody is surprised (from LANE_vault.md): the old server can read the upgraded table. If people used the new server in between, a copy deleted in the meantime shows up as live again to the old server, and the server's counter stops moving until the new server is back. No data is lost either way. The new table and columns stay in the database; that is harmless.

To deploy it again after a revert: revert the revert first, then redo B2.

## B6. Things to know

- A push to `main` deploys this. The first vault request after it adds the table and columns.
- A delete now keeps the encrypted copy for 30 days. The page text "Cloud copy deleted" should say so; that is a page change for a later version, not this deploy. The server cannot read any copy.
- Each cloud copy can now hold up to 13 copies. A normal plan is a few kilobytes. The Cloudflare 2 MB row limit was not tested against the live database.
- Ten wrong invite words from one network lock the AI for that whole network for the day. Tell Mako to type the phrase carefully, once per device.

---

# Part C. Only Mako can do these

Written for Mako, on an Android phone, no coding. One step at a time. If a screen does not look like what is written here, the names may have moved a little: look for the same words, and if you cannot find them, take a screenshot and show it in the chat. Do not paste your phone phrase or any key into the chat.

Do steps 1 to 4 now (they close the gap the security review found). Do steps 5 and 6 before the vault and relay merge, and again after it. Step 7 is a good habit.

You need: a Cloudflare login and an Anthropic console login. Chrome on your phone is fine.

## Step 1. Check the settings you have now

1. Open Chrome. Go to `https://the-burrow.mako-162.workers.dev/api/health`.
2. You see one line of plain text, like this (the version number will differ):
   `{"ok":true,"ai":true,"vault":true,"invite":false,"version":"38.28"}`
3. What each word means:
   - `ai` true: the assistant has its key.
   - `vault` true: the cloud copy database is connected. If this says false, stop and tell the chat. Do not do the later steps until it says true.
   - `invite` false: anyone who finds the address can use your assistant. Step 2 fixes that.
4. Remember what you see. You will come back to this page.

## Step 2. Set the invite phrase on the Worker

This makes the assistant ask for a phrase before it answers. Only people you tell the phrase can use it.

1. First make up the phrase. Make it long: at least three words, like a small sentence. **No commas** (commas split it into two phrases). Write it somewhere only you can see, such as your password app. Do not put it in the chat.
2. In Chrome go to `https://dash.cloudflare.com` and sign in. If it feels cramped, tap the three dots at the top right of Chrome and tick **Desktop site**.
3. Tap the menu (three lines, top left). Tap **Workers & Pages**.
4. Tap **the-burrow**.
5. Tap **Settings**.
6. Scroll down to **Variables and Secrets**. Tap **Add**.
7. For Type choose **Text**. For the name type exactly: `INVITE_CODES`
8. For the value, type your phrase.
9. Tap **Deploy** (or **Save**, whichever shows). Wait until it says it is done.
10. You see `INVITE_CODES` in the list. The value may show as hidden dots; that is fine.

After this the assistant asks for the phrase once on each phone and computer. Type it carefully: ten wrong tries in one day lock your whole network out of the assistant until tomorrow. Give the phrase to the people who should have it, privately, never in a group chat the whole world can read.

## Step 3. Turn auto-reload off in the Anthropic console

This makes the prepaid amount a hard ceiling: when it is spent, the assistant stops, and nothing is charged beyond it.

1. In Chrome go to `https://console.anthropic.com` and sign in.
2. Tap the menu (three lines). Tap **Settings**, then **Billing**.
3. Find **Auto reload** (it may say "Auto-reload" or "Automatic top-up").
4. It must say **Off**. If it is on, tap it and turn it off, then confirm.
5. You should see it show Off after the page refreshes.

## Step 4. Set a monthly spend limit

1. Still in the Anthropic console, tap **Settings**, then **Limits** (it may sit under **Workspaces**).
2. Find the workspace where the app's key lives. If you do not know, tap **API keys**: each key lists its workspace beside it.
3. Find **Spend limit** or **Monthly limit** for that workspace. Set an amount you would be fine losing in one month. You do not need to tell the chat the amount.
4. Save. You should see the limit written next to the workspace.

## Step 5. Make sure there is no ANTHROPIC_BASE_URL

After the vault and relay merge, a setting called `ANTHROPIC_BASE_URL` would make the assistant refuse every question. It must not exist on your live Worker. (A setting called `RELAY_TEST` must not exist either.)

1. In Chrome, open `https://dash.cloudflare.com`. Menu, **Workers & Pages**, **the-burrow**, **Settings**, **Variables and Secrets**.
2. Read down the list. You should see names like `ANTHROPIC_API_KEY`, `INVITE_CODES` and `SITE_VERSION`. You should NOT see `ANTHROPIC_BASE_URL` or `RELAY_TEST`.
3. If you do see one of them, tap the bin or **Delete** next to it, confirm, then tap **Deploy** (or **Save**) if it asks.
4. Tell the chat "no base url" when the list is clean.

## Step 6. Open the health page and read it

1. In Chrome go to `https://the-burrow.mako-162.workers.dev/api/health`.
2. After steps 2 and 5 it must look like this (the version number will differ):
   `{"ok":true,"ai":true,"vault":true,"invite":true,"version":"38.31"}`
3. All three of `ai`, `vault` and `invite` must say **true**. Tell the chat what you see: the three words and the version.
4. If one says false: `ai` false means the key is missing; `vault` false means the database link is missing; `invite` false means step 2 did not take. Tell the chat which one. Do not carry on with the merge.

## Step 7. Two-step sign-in and the old Worker (good habits)

1. Cloudflare: tap your profile icon, **My Profile**, **Authentication**, and turn on two-factor sign-in. Do the same for the Anthropic console under your account settings.
2. The old Worker is called **money-headache-remover** (same Workers & Pages list). If you see it, tap it, then **Settings**, **Variables and Secrets**. If it has `ANTHROPIC_API_KEY` there and no `INVITE_CODES`, it is an open door to your credit. Add `INVITE_CODES` to it the same way as step 2, or delete the key from it if nobody uses that site any more. Tell the chat which you did.
3. While you are on the old Worker, tap **Settings**, then **Bindings**. Tell the chat whether you see a database called **money-vault** there. That tells the team whether cloud copies from the old site and the new site are in the same place.

When you are done, tell the chat in one line: invite set, auto-reload off, limit set, no base url, and the three words from the health page.

---

# Part D. The old address: every place it appears, and what to change

The old address is `https://money-headache-remover.mako-162.workers.dev`. The live one is `https://the-burrow.mako-162.workers.dev`. This is a step after v1, for the main session or whoever the coordinating session names. The deploy session lists and does not change app files.

Searched on 2026-11-19 with `grep -rn "money-headache-remover.mako-162.workers.dev"` across this branch and across `origin/wip-38.31`. The same eight files appear on both, plus this runbook on this branch.

## What it does today

- At a web address the page talks to its own origin (`relayBase()` in `ui41.js` uses `location.origin`), so the live site and the old site each use their own server. Only two things read `RELAY_URL`: a copy of the page opened as a downloaded file (it sends the assistant and cloud saves to the old site), and the Claude mirror's "Open it and move my numbers" button (`moveLink()` and `showMoveBanner()` in `ui41.js`, they send people to the old site).
- The result: a file copy's cloud copy can live on a different site from the one the phone uses, and a restore on the new site finds nothing (security review S9).

## The list

| Where | Line (search for `RELAY_URL` or the address) | What it is | What to change |
|---|---|---|---|
| `wip/team/RELAY` | line 1 | the source: one line, the address the build writes into the page | **The one real change.** Put the live address in it, or leave the file empty until the move is finished (an empty file hides the mirror's move button and means a file copy cannot reach any server). The coordinating session decides which. |
| `src/RELAY` | line 1 | a plain copy of `wip/team/RELAY` made by `build_site.sh` | Do not edit. It changes when `build_site.sh` runs after `wip/team/RELAY` changes. |
| `public/index.html` | the `const RELAY_URL = ` line (about 13954 on `wip-38.31`) | the built page Cloudflare serves | Do not edit. It changes when the page is rebuilt (`wip/team/build.sh`, then `build_site.sh`). |
| `wip/money-map-team.html` | the `const RELAY_URL = ` line (about 14739 on `wip-38.31`) | the built plain page, also the mirror's page | Do not edit. Rebuilt by `wip/team/build.sh`. |
| `tests/regression/v35/page.js` | the `const RELAY_URL = ` line (about 4972) | a frozen copy of an old page used as a regression fixture | Leave it. Check that no test asserts the new address in it. |
| `SETUP.md` | line 31, "Live address: ..." | setup notes; the wrong address for the live site | Change to `https://the-burrow.mako-162.workers.dev`. |
| `README.md` | line 3 | already says the live address is the-burrow and names the old one as "moved from ... frozen at 38.10" | No change needed. It is history. |
| `wip/team/DECISIONS.md` | line 67 | the Hosting decision: live address, and "the old address stays up until people have moved their data across" | No change until the old Worker is switched off; then record that in DECISIONS. |
| `wip/team/DEPLOY_RUNBOOK.md` | Part D (this part) | this list | Update or delete this part when done. |

(The old address also appears in `LAUNCH_CHECKLIST.md` E13 and in SECURITY_REVIEW.md S9 and B4 as a described problem, in words, not as a setting.)

## Steps, after v1 is live

1. Ask Mako (Part C, step 7, item 3) whether the old Worker has the same database `money-vault`. If it does not, plan the move of existing cloud copies before the old Worker is switched off. Do not switch it off before people have moved their numbers.
2. Change `wip/team/RELAY` (main session, on the release line, one commit). Change `SETUP.md` line 31 in the same commit.
3. Rebuild the page: `wip/team/build.sh`, rerun the checks that the change touches, bump the version only if the coordinating session says so. The built page, `public/` and `src/RELAY` then change; they go live through Part A like any page change, so it is a deploy of its own and needs Mako's go.
4. Update the Claude mirror (A6) so its move button points at the new address.
5. When the content policy (security review S7) is added to the page, the downloaded-file copy needs the live address in `connect-src`, or it stops reaching the server.
6. After the deploy, run `grep -rn "money-headache-remover.mako-162.workers.dev"` again. Only `README.md`, `wip/team/DECISIONS.md`, the frozen `tests/regression/v35/page.js` and the "old address" notes may be left.
7. The old Worker is frozen at 38.10 (README). It does not get the new relay limits from Part B, because Part B is deployed to the-burrow only. That is why Part C step 7 item 2 matters.

---

# Part E. What Mako checks after a deploy

The sessions cannot open the live site, so this is what tells us it works. Do these on every device you use. Report per device: which device, what you saw.

## Before the update (Part A only)

Have the backup file (A0b) and your two written-down numbers.

## On every device, after Part A (v1)

1. Open `https://the-burrow.mako-162.workers.dev`. Scroll to the very bottom. It must say **Version 38.31** (or the version in the release notes).
2. If it still says the old version: a bar "A newer version is ready." with a **Reload** button should appear within a few seconds. Tap Reload. If no bar comes, close every tab of the site and open it again.
3. Your numbers are all there, the same as before: pay, bills, burrows, receipts. Compare with the two numbers you wrote down. (Some figures can change on purpose in v1; the release notes say which. A number that is simply gone, or looks wrong, is a stop: tell the chat and go to rollback.)
4. Open `https://the-burrow.mako-162.workers.dev/api/health`. It must show the new version, `"ai":true` and `"vault":true`.
5. Ask the assistant one question. It must answer. (If it says it cannot, the AI credits may need claiming again by a Team owner. If you set the invite phrase, it asks for the phrase first: type it.)
6. Basics, Cloud backup: it still shows your copy and saving works.
7. Add one small receipt, then undo it. The numbers on Home move and move back.

Android phone, installed to the home screen (the one tested hardest):
1. Open the app from its home screen icon, not from Chrome. Do checks 1 to 3 there. The installed app may open the old version once and then offer Reload; that is normal.
2. Turn on airplane mode, close the app, open it again. It opens, with your numbers and the new version. Turn airplane mode off.
3. Add money on a burrow screen. The squirrel shows and the screen does not lag.
4. Nothing covers a button or a number, and scrolling Home is smooth.
5. Open the site in Chrome too (not the installed app). Same version, same numbers.

Computer, Chrome or Edge: checks 1 to 7; the install icon shows at the right end of the address bar; make the window narrow and wide and nothing overlaps.

iPhone or iPad, Safari (when someone on the team uses one): checks 1 to 5; if it is on the home screen, open it from there and check the version.

The mirror: open `https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w`. The bottom says the new version and the welcome video plays.

The old address: open `https://money-headache-remover.mako-162.workers.dev` once and note which version it shows. The README says it is frozen at 38.10. Tell the chat if it shows something else.

## On every device, after Part B (vault and relay)

1. The health page (Part C step 6): `ai`, `vault` and `invite` all true, and the same version as before the merge.
2. The bottom of the page still says the same version (this deploy does not change it).
3. Basics, Cloud backup: your copy is still there. Make a small change (add a receipt), wait a moment, and see that the cloud copy says it saved.
4. Open the app on a second device with the same cloud code: the change shows up there.
5. Ask the assistant one question. It answers. If it asks for the phrase, type it.
6. Your numbers are all there.

Anything wrong: tell the chat what you saw, on which device. If numbers are missing or wrong, do not keep using that device. Load the backup file (Basics, Backup, **Load text** with the file's text) and tell the chat.

## After a rollback

1. The bottom of the live page says the old version (Reload bar, or close and reopen).
2. `/api/health` shows the old version.
3. Your numbers are there. If something looks wrong: Basics, Backup, load the backup file saved before the update.

---

# What this runbook does not cover

- Changes to the database (`money-vault`) beyond what Part B adds, and changes to secrets and variables. Those are made in the Cloudflare dashboard by Mako and are not rolled back by git.
- Switching the old Worker off, and moving cloud copies from it. That is a decision for the coordinating session once Part D step 1 is answered.
- The ledger step, and switching on `VAULT_NEW_NEEDS_INVITE`. Each is its own deploy with its own checks.
