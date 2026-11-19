# Coordinator handoff (latest first)

The coordinator is the one session Mako talks to. It records his decisions in DECISIONS.md (and NORTH_STAR.md, LAUNCH_CHECKLIST.md), starts and messages working sessions, and brings their results back to him. Working sessions take direction from nowhere else. The coordinator hands off at about 150k tokens of history, like every session.

## 2026-11-19, coordinator 2 (session_01BFpKEXXUx4uUjZGJny9MyJ): six more lanes (pace decision)

Mako's pace decision (DECISIONS.md "Pace: use the full allowance") came in by relay. The efficiency agent reviewed the lane set. Started, each on its own branch, each told to report here:
- SIDE F, session_01BFpKEXjBATB2WYTLpkuMoN, side/security-review: SECURITY_REVIEW.md, read only (AI relay, cloud copy). Its vault fixes go to SIDE G, client fixes to main.
- SIDE G, session_01BFpKEV1EjMmi3kqEvVfG9f, side/vault-server: functions/api/vault/[id].js, functions/_lib.js, tests/page_vault.js, LANE_vault.md. Dated versions, soft delete, server-side "newer". Merged only after v1 is deployed and Mako says go (a push to main deploys the server).
- SIDE H, session_01BFpKEYXsoMWMPZT6wAnhGo, side/act-keep-checks: tests/qc/act_keep.js, LANE_act_keep.md. Part 2 (same-name figures agree across screens) waits: tell it when A1 has landed.
- SIDE I, session_01BFpKEZ7X7m9xsVmbWMFUZD, side/deploy-prep: build_site.sh, a dry-run script, DEPLOY_RUNBOOK.md. Deploys nothing.
- SIDE J, session_01BFpKEYZQZpQ22MNxiJLAcX, side/e6-window-test: tests/qc/e6_window.js, LANE_e6.md. The fix itself is main's first job after v1.
- SIDE K, session_01BFpKEZfHa8YdLHcGF1waB8, side/help-texts (faster model): HELP_TEXTS.md, the written "?" words (H2). Not wired in.
- SIDE L, session_01BFpKEVHFdyreLUouSjKDqY, side/ph-accounts: PH_ACCOUNTS.md (web research), presets_ph.json, PERSONAS_PH.md. Started after Mako's shape answers.
- Done: SIDE K (HELP_TEXTS.md, 28 entries; uses "Rainy Day" where the app says "Emergency fund", pick one when wiring). SIDE F (SECURITY_REVIEW.md; VAULT and RELAY fixes given to SIDE G, which now also owns functions/api/ai.js; service worker fix to PHONE; B3 and the rev guard to MAIN 2 for v1; checklist E9 to E13). SIDE E's design is done (LEDGER_DESIGN.md), it continues with ledger tests; MAIN 2 told to store cards as {name, owed, payDay} and the bank as cfg.bankStart plus cfg.bankAt.
- For Mako (told 2026-11-19): security B4, dashboard checks only he can do (INVITE_CODES set as a long phrase, auto-reload off in the Anthropic console, a monthly spend limit, /api/health says vault true).

Rules from the efficiency review:
- No side lane touches wip/money-map-team.html, check.sh, tests/verify.sh, tests/qc/script_known.txt, tests/qc/lib_r12.js, tests/qc/golden/*, RESUME.md, DECISIONS.md, LAUNCH_CHECKLIST.md. Each lane's handoff is its own LANE_<name>.md. stmt.js is an app file (in the bundle).
- Into the v1 candidate: only side/phone-fixes and act_keep.js if it passes. MAIN 2 merges them in one batch, verify.sh once, before its single check.sh full. Everything else merges after v1.
- Mako answered the five shape questions himself (DECISIONS.md "The team's shape"): nothing waits on the teammates any more.
- Waiting, each with its trigger: same-name figure checks (A1 lands); statements and account presets (LEDGER_DESIGN.md plus the security report; D5 is at wider launch; stripping account numbers needs a design choice because PDFs and images go to the relay raw); persona walks (the teammates' answers and a team build); G2 measures (after v1 deploys). Ledger tests stay with SIDE E on its branch.

## 2026-11-19, handoff 1

### How Mako works (read DECISIONS.md "How Mako works with the team" in full)
- Visual, on his Android phone. Every update comes with screenshots in the chat and a link he can tap. Never questions without the app in front of him; send the app with short notes of what to try.
- Do not ask small questions; keep going; run non-stop. Plain words, no em dashes.
- Art is paused. Art and the 3D world come last, designs first, only with him.
- Nothing deploys (no push to main) until he has seen the refreshed STEP8_COMPARE.md and the v1 preview and said go.
- No real figures in the repo. His money shape (no amounts) is in DECISIONS.md "Mako's own money".

### Sessions (send_message to these ids; they were told to report to the new coordinator)
- MAIN 2, session_01BFpKEV7tq6qCSZ8Mg5c5GR, branch wip-38.31, the only session that edits app files. Building every v1 point of LAUNCH_CHECKLIST.md (A1, A3, A4, A5 simple, D2, D3, E1 snapshot, F2, F6, H1, U1, U2), then merge side/phone-fixes, `check.sh full`, one candidate, one QC run (both gates in full; panel only on screens changed since round 4 plus a beginner walk of Home and setup), then a private preview link, phone screenshots and the refreshed STEP8_COMPARE.md summary for Mako.
- PHONE lane, session_01BFpKEZXbxbYUaG22NPBwJY, branch side/phone-fixes: F1, F3, F4, F5 in squirrel.js, scene.js, forest.js, burrows.js, pwa/. When it reports done, tell MAIN 2 to merge it.
- SIDE E, session_01BFpKEZYVHb7ZSGt7morEh2, branch side/ledger-design: LEDGER_DESIGN.md plus a reference model proved on made-up event lists. Docs and tests only. Its summary and picture go to Mako with the v1 link, as notes, not questions.
- Finished, branches kept: side/script-checks and side/oracle-debts (merged), side/after-v1-tests (tests for the window, ledger, migration; merged into side E's branch), side/phone-check (PHONE_REPORT.md).
- Old sessions, no longer editing: session_01BFpKEWVrwMZsRp6aFJ67Fm, session_01BFpKEZaBEJL18hdR9Evh7n.

### What the coordinator does next
1. When MAIN 2 hands off (150k rule) before the candidate is done, start a fresh main session from RESUME.md section 0 with the same rules (see the prompts in this file's git history or write one like it: only one session edits app files on wip-38.31; side lanes own named files; non-stop; resume timer; report to the coordinator).
2. When the candidate passes both gates: give Mako the preview link, the screenshots, what to try, the bank comparison, and side E's ledger notes. Wait for his go, then start a fresh deploy session (PLAN.md step 10; `build_site.sh` expects a folder layout that does not exist in these containers, see PLAN.md "On deploy"; the sessions cannot open the live site, so Mako checks the live page and the version stamp on every device).
3. After v1: Mako uses it alone for at least a week; his notes become checklist points. Then the team points, shaped by his two teammates' answers to the shape questions (he will pass them on). Order on the main line: the E6 fix (months never dropped on load), then the ledger (B1) from LEDGER_DESIGN.md, the "Money came in / went out" door, pay days, the weekly check-in and "start fresh". Parallel lanes: vault (functions/api/vault, ui42.js), statements, setup (after the ledger's actions exist).
4. Run the efficiency agent (`.claude/agents/efficiency.md`) on every new plan and pass its findings to Mako. Keep cost rules: one candidate, one QC run; a finding failing two rounds goes to Mako in two lines.
5. Before the team test: a security review of the AI relay and the cloud copy.

### Open with Mako
- Two rule changes he agreed to on 2026-11-19 are recorded in DECISIONS.md (team test about the team; lighter QC).
- He was asked to pass five shape questions to his two teammates (where their money sits, how and when they are paid, cards or pay-later or debt, iPhone or Android, what would make them stop using it). Their answers set the team gate.
- Suggested, not yet decided by him: let the environment's network settings allow the-burrow.mako-162.workers.dev so sessions can check a deploy; a 1 to 2 day 3D speed test on a side branch (he said: 3D is decided when the art step comes).
