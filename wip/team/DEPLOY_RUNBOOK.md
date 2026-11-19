# The Burrow: deploy runbook

For the session that deploys after Mako says go. Follow the steps in order. Do not skip one, and do not start before step 0 is true.

Written 2026-11-19 by the deploy-prep side lane. It deployed nothing. The examples use 38.31; put the real version in its place.

## What a deploy is

- Cloudflare runs `npx wrangler deploy` by itself on every push to `main`. Nobody runs wrangler by hand. So "deploy" means: one push to `main`.
- Cloudflare serves `public/` and runs `worker/index.js` with `functions/`. `wrangler.toml` carries the version that `/api/health` reports. Only those four places change what people get.
- `build_site.sh` makes `public/` from `wip/team` and `pwa/`, copies `wip/team` into `src/`, and sets the version in `wrangler.toml`. It needs nothing outside the repo and never touches `tests/`.
- `deploy_dry_run.sh` builds into a scratch folder and checks everything without changing or pushing anything. Its last line is `DRY RUN OK` or `DRY RUN FAILED`.
- The sessions cannot open the live site. Mako checks the live page (step 8). Say so plainly in every report; never write "checked live".
- People's numbers live in their own browser, per address. A deploy does not touch them. The new page reads them when it opens.

Addresses:
- Live: https://the-burrow.mako-162.workers.dev
- Health: https://the-burrow.mako-162.workers.dev/api/health
- Mirror: https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w

## Step 0. Before anything (all must be true)

1. Mako's go for this version is recorded by the coordinating session. A go for an earlier build does not count.
2. `./check.sh full` printed ALL GOOD on the exact commit being deployed (RESUME.md section 6).
3. Both gates (qc-north-star, qc-numbers) passed on that same build.
4. Mako has seen STEP8_COMPARE.md.
5. Nothing else is changing the release branch. Only the deploy session writes to it and to `main` now.
6. The release notes are ready in plain words (RESUME.md section 4).

If any of these is not true, stop and tell the coordinating session.

## Step 1. Get the release branch, clean

```
git fetch origin main wip-38.31
git checkout wip-38.31 && git pull --ff-only origin wip-38.31
git status --short            # must print nothing
git log -1 --format='%h %s'   # must be the commit the checks and gates ran on
git rev-parse origin/main     # WRITE THIS DOWN: it is the last deploy, the rollback point
```

On 2026-11-19 the last deploy was `e15e25d` (38.28).

## Step 2. Dry run

```
./deploy_dry_run.sh
```

It must end `DRY RUN OK`. Read section 2 of its output:
- "The files Cloudflare serves or runs" should list `public/index.html`, `public/sw.js` and `wrangler.toml`, plus any `worker/` or `functions/` file that was changed on purpose in this release. A file there that nobody meant to change is a stop.
- "main is behind this branch in a straight line" must say PASS. If it fails, someone pushed to `main`: merge `main` into the release branch, rerun the checks, start again.

The picture `page.png` in the scratch folder is the built page at phone size. Look at it.

If it ends `DRY RUN FAILED`, fix the cause on the release branch, rerun the checks that the fix touches, and run it again. Never deploy past a failed line.

## Step 3. Build into the repo and commit on the release branch

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

## Step 4. Put it on main (this is the deploy)

One merge commit per deploy, so `git log --first-parent main` reads one line per version and rollback is one revert.

```
git checkout main && git pull --ff-only origin main
git merge --no-ff wip-38.31 -m "38.31: <one line on what changed for people>"
git diff --stat HEAD wip-38.31      # must print nothing: main now holds exactly the tested tree
git push origin main
git rev-parse HEAD                  # WRITE THIS DOWN: the deploy commit
```

Earlier deploy commits read like "38.28: new copies start in yen; a saved copy with no currency stays pesos". Keep that style. Add the usual attribution lines at the end of the message.

If the push is refused, do not force it. Fetch, look at what is on `main`, and go back to step 2.

Then go back to the release branch: `git checkout wip-38.31`.

## Step 5. Watch the Cloudflare run

- Look at the check runs on the deploy commit with the GitHub tools. Cloudflare's build shows there if the repo link reports it.
- If nothing shows after a few minutes, ask Mako to look: Cloudflare dashboard, Workers & Pages, the-burrow, Deployments. The newest one should be the deploy commit and say it succeeded.
- A failed run leaves the old version live. Nothing is broken for people. Read the build log, fix, and start again from step 2.

## Step 6. Update the Claude artifact mirror (DECISIONS decision 10)

The mirror is the plain page, `wip/money-map-team.html`, with the fonts and the welcome video beside it (12 files). Only the page changes in a deploy.

1. Read it first with the Artifact tool: action `read`, url `https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w`. Note the version it serves now (38.28 on 2026-11-19). If the read fails or the artifact is gone, the mirror is retired: tell the coordinating session and skip the rest of this step.
2. Publish the page to the same address: Artifact tool, `url` as above, `file_path` `wip/money-map-team.html`. Pass no `files`, no `capabilities` and no `icon`, so the fonts, the video and the settings it already has are kept. Do not send the two video files again; they are too big for one publish and are already there.
3. Check it: action `read` again must show `Version 38.31`, and action `list` with `scope: "files"` must still show 12 files (fonts, `hello.mp4`, `hello-av1.mp4`, `hello.jpg`, `index.html`).
4. If the publish is refused because the live version is newer than the one read, read again and publish again. Never use `force`.

The mirror has no service worker and no install files. That is as before.

## Step 7. Report to the coordinating session

Send: the deploy commit, the Cloudflare result (or "Mako needs to look"), the mirror result, the live link, the screenshot from the dry run, the release notes, and the list in step 8 for Mako. Say that the live page itself has not been seen by any session.

## Step 8. What Mako checks on the live page

Before opening the new version for the first time on a device that holds real numbers: if the old version is still showing, open Basics, find Backup, tap "Copy my numbers" and paste them into a note. That copy is the way back if anything looks wrong.

### On every device

1. Open https://the-burrow.mako-162.workers.dev. Scroll to the very bottom. It must say **Version 38.31**.
2. If it still says the old version: a bar "A newer version is ready." with a **Reload** button should appear within a few seconds. Tap Reload. If no bar comes, close every tab of the site and open it again.
3. Your numbers are all there, the same as before the update: pay, bills, burrows, receipts.
4. Open https://the-burrow.mako-162.workers.dev/api/health. It must show `"version":"38.31"`, `"ai":true` and `"vault":true`.
5. Ask the assistant one question. It must answer. (If it says it cannot, the AI credits may need claiming again by a Team owner.)
6. Basics, Cloud backup: it still shows your copy and saving works.
7. Add one small receipt, then undo it. The numbers on Home move and move back.

### Android phone, Chrome, installed to the home screen (the one tested hardest)

1. Open the app from its home screen icon, not from Chrome. Do checks 1 to 3 above there. The installed app may open the old version once and then offer Reload; that is normal.
2. Turn on airplane mode, close the app, open it again. It opens, with your numbers and Version 38.31. Turn airplane mode off.
3. Add money on a burrow screen. The squirrel shows, and the screen does not lag (the 2026-11-19 phone report).
4. Nothing covers a button or a number, and scrolling Home is smooth.
5. Open the site in Chrome too (not the installed app). Same version, same numbers.

### Computer, Chrome or Edge

1. Checks 1 to 7 above.
2. The install icon shows at the right end of the address bar.
3. Make the window narrow and wide. Nothing overlaps.

### iPhone or iPad, Safari (when someone on the team uses one)

1. Checks 1 to 5 above.
2. If it is on the home screen: open it from there and check the version.

### The mirror

Open https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w. The bottom says Version 38.31 and the welcome video plays.

### The old address

https://money-headache-remover.mako-162.workers.dev stays up for people who have not moved their numbers. Open it once and note which version it shows. Tell the coordinating session if it changed and should not have, or did not and should have.

Anything wrong in this step: tell the coordinating session what you saw, on which device. If numbers are missing or wrong, do not keep using that device; go to rollback.

## Rollback: back to the last deploy

Use it when the live page loses or misstates numbers, will not open, or Mako says so. Rolling back is safe for the site; read the note on numbers at the end.

### Fast way (Mako, about a minute)

Cloudflare dashboard, Workers & Pages, the-burrow, Deployments. Find the deployment before the new one, open its menu, choose Rollback. The old version is live again right away.

This does not change `main`. Do the git way too, or the next push to `main` puts the new version back.

### Git way (the deploy session)

With `DEPLOY` the deploy commit from step 4 and `LAST` the commit written down in step 1:

```
git fetch origin main && git checkout main && git pull --ff-only origin main
git revert -m 1 --no-edit DEPLOY
git diff --stat LAST HEAD -- public worker functions wrangler.toml    # must print nothing
git commit --amend -m "Roll back 38.31 to 38.28: <why, one line>"
git push origin main
```

The empty diff is the proof that Cloudflare will serve exactly the last deploy again. Never force-push `main` and never reset it. Then watch the Cloudflare run as in step 5.

If other commits landed on `main` after the deploy, revert only the deploy commit, and check the same diff for the files that matter.

To deploy the release again later, a plain merge will not bring the changes back after a revert. Revert the revert first (`git revert <the rollback commit>`), then carry on from step 2.

### The mirror

Publish the old page to the mirror the same way as step 6, from the last deploy's sources:

```
git show LAST:src/VERSION | head -1        # the version to expect
```

The plain page of the last deploy is not kept as a file on `main`. Build it in a scratch folder: check out `LAST` into a scratch worktree (`git worktree add <scratch> LAST`), run `src/build.sh` there (it writes `money-map-team.html` beside `src/`), publish that file, then remove the worktree.

### After a rollback, Mako checks

1. The bottom of the live page says the old version (Reload bar, or close and reopen, as in step 8).
2. `/api/health` shows the old version.
3. Your numbers are there.

### Note on numbers after a rollback

Numbers saved by the new version are then opened by the old page. That direction has not been tested. If something looks wrong after a rollback: Basics, Backup, paste the copy taken before the update, tap "Load pasted numbers". This is why the copy in step 8 comes first.

## Things this runbook does not cover

- Changes to the database (`money-vault`) or to secrets and variables. Those are made in the Cloudflare dashboard by Mako and are not rolled back by git.
- A change to `worker/` or `functions/` that the old page cannot talk to. If a release has one, say so in the report before the go, because rollback then needs more care.
- `wip/team/RELAY` (the address a copy opened as a file uses for the assistant) still names the old address on 2026-11-19. Whether it should name the live address is a decision for the coordinating session, not a deploy step.
