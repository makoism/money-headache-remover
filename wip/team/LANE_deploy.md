# Deploy lane (side R): handoff

Branch `side/deploy-prep`. Written 2026-11-19. Docs only. Nothing deployed, nothing pushed to `main`, no app file and no script changed.

## What was done
`wip/team/DEPLOY_RUNBOOK.md` rewritten so a fresh deploy session can follow it with no other context:
- Part A: v1 (the page). Checks before, Mako's backup file first, exact steps (no-fast-forward merge so rollback is one revert), checks after, rollback.
- Part B: the vault and relay merge (`side/vault-server`), only after v1 is live and Mako says go. The "Before this merges" list from LANE_vault.md, the L3 change written out with a before/after check, the new settings with defaults (IP_DAILY_CALLS 300), `/api/health` vault true, no `ANTHROPIC_BASE_URL`, steps, tests, rollback.
- Part C: "Only Mako can do these", short numbered steps for the Cloudflare and Anthropic dashboards on an Android phone.
- Part D: every place the old address appears, and what to change after v1.
- Part E: what Mako checks on each device after each deploy.

## Found
1. The deploy scripts and the runbook exist only on this branch, not on `wip-38.31` or `main`. Step A1 merges `side/deploy-prep` into the release branch first (checked clean against `wip-38.31` 9916cde with `git merge-tree`).
2. `deploy_dry_run.sh` cannot pass for the vault and relay deploy (no page or version change): it fails "main already says version X" and "sw.js cache name differs". Not a bug, a limit; the runbook uses direct diff checks for Part B and says not to bump the version to satisfy it.
3. L3 is real and reproduced: on `side/vault-server`, a 405 and a 404 from `worker/index.js` give no `access-control-allow-origin`. The change in the runbook uses `json()` from `functions/_lib.js` (not `fail()`, because the 405 needs an `allow` header and `fail()` cannot set headers).
4. `INVITE_CODES` takes a comma separated list, so Mako's phrase must have no commas (said in Part C).
5. The mirror's "move my numbers" button and any downloaded file copy point at the OLD address (`RELAY_URL`). The old Worker is frozen at 38.10 per README, so it will not get the new relay limits. If it still holds the Anthropic key with no invite phrase, it is an open relay with the old code. Part C step 7 has Mako check it. Unknown: whether the old Worker shares the `money-vault` database.
6. README says the old address is frozen at 38.10; the old runbook said "stays up". Part E asks Mako which version it shows.
7. Step 5 and 6 of "Before this merges" are owned by the main session: `page_import.js` fixture and the `page_assistant.js` failure. The runbook asks for them in writing.

## Not done on purpose
No app file, script or `wrangler.toml` change. The old address change (Part D) is a list only.
