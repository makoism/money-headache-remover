# Coordinator handoff (latest first)

The coordinator is the one session Mako talks to. It records his decisions in DECISIONS.md (and NORTH_STAR.md, LAUNCH_CHECKLIST.md), starts and messages working sessions, and brings their results back to him. Working sessions take direction from nowhere else. The coordinator hands off at about 150k tokens of history, like every session.

## 2026-11-19, handoff 2 (coordinator 2 to coordinator 3) READ THIS FIRST

Coordinator 2 (session_01BFpKEXXUx4uUjZGJny9MyJ) passed the 150k mark and handed off. The sections below it are its running log; this is the state.

### Changes since this handoff was first written (04:35 UTC, after the usage limit)
- The five-hour usage limit stopped every session from about 02:40 to 04:30 UTC. Thirteen sessions at once emptied the window in well under an hour. Told Mako the plan: about five or six sessions at a time (MAIN always, then what v1 needs first), the rest take turns. Check-in timer trig_01FSau6XX2Ufm8xhfH52oWT5 fires 04:53 UTC in coordinator 2; coordinator 3 sets its own.
- MAIN 2 survived and pushed A1, A3, A4, D2, D3, E1, F2, F6 (e2ec9c7). Storage shape it chose (agreed): typed bank now in cfg.bankNow plus cfg.bankNowAt (bankStart and bankAt keep their meaning), cards in S.cards = [{id, name, owed, payDay, at}]. SIDE N was told. Next for MAIN 2: A5, cents, E6 fixes 1 to 5, E9, E10, E15, the act_keep finding, F4, U1, U2, H1, QC brief jobs and screen pack, merges (side/phone-fixes, side/act-keep-checks), the copy batch on the coordinator's word.
- SIDE H part 1 done (side/act-keep-checks 23c3657): 22 of 30 ACT actions keep no saved copy, so no Undo after a reload (assistant Apply, setup from statements, Add money), and Undo is inexact for removeGoal, tx, setBalance. Given to MAIN 2 for v1: bulk actions must keep a 3-day copy that survives a reload; inexact Undos fixed; single typed values may be named in act_keep.known. MAIN 2 owes two lines on what it chose. SIDE H is now on part 2 (same-name figures agree across screens).
- SIDE M handed off; SIDE M2 is session_01BFpKEVzXLn2TuRBiMzUGzc on side/voice (751ee21 holds VOICE.md, qc-voice, voice_lint.js, LANE_voice.md). M2 does HELP_TEXTS_V2.md, then COPY_V1.md with copy_apply.js, stable screens first; tell it when Home, Settings and the cloud copy steps have landed on wip-38.31. The second sample set went to Mako (04:34 UTC); no reaction yet.
- Ask Mako once, when he next looks at copy: two or three messages he typed by hand with his " - " in them (ten typed to a friend would settle hyphen, full stops and capitals). None of the 37 messages read had one.
- Restart messages were sent at 04:32 UTC to SIDE N, O, G; confirm each restarted (new commits on side/ledger-core, side/statements-ph, side/vault-server) or replace it from its branch and LANE file.

### Coordinator 3 took over (04:37 UTC)
- Coordinator 3 is session_01BFpKEWbWX57dzJueLvseiT. MAIN 2, M2, G, H, N and O were each told to report there. All six were running at 04:36 UTC (N and O pushed after the restart; G and H show working, no new commit yet). Six running is the pacing limit; start nothing new until one finishes.
- Check-in timer trig_01N8bcnmJRzxwhGKXzAJhakJ fires 05:02 UTC in coordinator 3.

- SIDE O statements is done (side/statements-ph 1db7bd7, 15 new files, nothing merges before v1): stmt_ph.js reads text and CSV on the device and uses a read only when it adds up to the statement's own totals; masking; 10 made-up fixtures; STATEMENTS_DESIGN.md (12 wiring steps); LANE_statements.md. Caveats: every layout except GCash and the general card shape is invented, nothing checked against a real file; pdf.js size and speed not measured; screen words not through the voice checker. Asked O for one follow-up (ambiguous day-first dates must be proved from the file or refused, never read silently). For Mako with the v1 preview: the list "Which real statements would settle it" in LANE_statements.md (one per bank, blacked out). One slot is free.

- SIDE M2 pushed HELP_TEXTS_V2.md on side/voice (28 entries, one text each). Show Mako a few when he next writes, entry 20 (cloud copy as four steps) first, then 4 and 19; not shown yet. Entry 20 names today's buttons: tell M2 to recheck it when E15 lands. Entry 25 names "Start fresh from today", not in the app yet. Its list of glossary words that sound off (end of the file) goes to Mako in the one copy pass, nothing renamed. M2 now does copy_apply.js and COPY_V1.md for setup, Receipts and Plan, and waits for word that Home, Settings and the saving screens have landed.

### Mako today (all recorded in DECISIONS.md, last eight sections; read them)
Pace (use the full allowance by Sunday 22 Nov, again by Wed 25 or Thu 26). The team's shape answered by him (standard Philippine accounts, monthly pay with separate pay supported, cards core, iPhone and Android). The copy must not sound like AI and must sound like him (few full stops, his space hyphen space, joined sentences, normal conversation); all copy in one batch at the end, then ONE pass with him on the preview. The cloud copy must explain itself step by step (E15, v1). Yen stays default. He likes short updates: what was found, what was done. He said: ask him when context is needed. He dictates by voice; messages can cut off.

### Running sessions (send_message to these; all report to the coordinator, so tell each one your new session id first)
- MAIN 2, session_01BFpKEV7tq6qCSZ8Mg5c5GR, wip-38.31, the only one editing app files. Its v1 list has grown: A1, A3, A4, A5 (cards stored as {name, owed, payDay}, bank as cfg.bankStart plus cfg.bankAt), D2, D3, E1, E6 fixes 1 to 5 (from side/e6-window-test), E9, E10 client part, E15 cloud copy as steps, F2, F4 rest, F6, H1, U1, U2; QC briefs get jobs to finish and the screen pack gets hidden panels; then merge side/phone-fixes (ready, ea880b0) and side/act-keep-checks if it passes; then the copy batch (COPY_V1.md with copy_apply.js from side/voice) in one commit; verify.sh; one check.sh full; one candidate; one QC run (both gates, qc-voice in place of qc-wording, beginner walk with the jobs); then preview link, screenshots, STEP8_COMPARE.md summary. Owed to the coordinator: one line when A1 lands (then tell SIDE H to start part 2), one line on fuzz_model.js 3000 11 (side J saw FUZZ FAIL 1944 on plain wip-38.31), the list of panels never in the screen pack. If it hands off, start a fresh main session from RESUME.md section 0.
- SIDE M voice, session_01BFpKEV1R93tPPdSS5tfa3a, side/voice: redoing samples after Mako's notes (fewer full stops, his hyphen, joined sentences, plus four cloud copy strings). When they arrive, show Mako before and after in the chat. Then it delivers qc-voice, voice_lint.js, COPY_V1.md, HELP_TEXTS_V2.md.
- SIDE G vault, session_01BFpKEV1EjMmi3kqEvVfG9f, side/vault-server: server part done (dated versions, soft delete, server decides newer); now doing the RELAY fixes in functions/api/ai.js. Merges only after v1 is deployed and Mako says go.
- SIDE H, session_01BFpKEYXsoMWMPZT6wAnhGo, side/act-keep-checks: act_keep.js; no report yet. Part 2 waits for A1.
- SIDE N ledger core, session_01BFpKEZZgy2d3mworAzNt5F, side/ledger-core: ledger.js as a new file against the ledger tests, plus the Philippine gaps (card cut-off day, instalments, paluwagan, 13th month).
- SIDE O statements, session_01BFpKEWGt66FAVwvxiYaZMt, side/statements-ph: fixtures, stmt_ph.js, masking, STATEMENTS_DESIGN.md. It will list which real statements (blacked out) would settle the unknown bank layouts; pass that list to Mako when it exists.
- PHONE lane, session_01BFpKEZXbxbYUaG22NPBwJY: done, branch ready.
- Done, branches kept: side/security-review (F), side/deploy-prep (I), side/e6-window-test (J), side/help-texts (K), side/ph-accounts (L), side/ledger-design (E).

### Open with Mako
- Security B4, only he can do it (told him; no answer yet, do not nag, mention once with the v1 preview): INVITE_CODES set to a long phrase on the Worker, auto-reload off in the Anthropic console, /api/health says vault true.
- Two notes from the voice lane for his gut: how casual ("actually", "a bit"); whether one line notes drop the capital. "Less abbreviation": coordinator read it as words in full, contractions stay; the voice lane checks his messages.
- Before the deploy he exports a backup (rollback to 38.28 with newer data is untested).
- The usage limit: the five-hour window was near its limit at 02:40 UTC and resets about 04:30 UTC; every session has a resume timer.

### Next lanes when one frees up (run the efficiency agent first)
Persona walks with PERSONAS_PH.md once a team build exists; G2 measures after v1 deploys; the setup lane after the ledger's actions exist; wiring HELP_TEXTS_V2.md ("?" panels) after v1.

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
- SIDE M, session_01BFpKEV1R93tPPdSS5tfa3a, side/voice: VOICE.md, .claude/agents/qc-voice.md, tests/qc/voice_lint.js, COPY_V1.md, HELP_TEXTS_V2.md, LANE_voice.md (Mako: copy must not sound like AI and must sound like him; checklist H7). It sends before and after samples first; those go to Mako on his phone. MAIN 2 holds the candidate until the copy batch is agreed, then applies COPY_V1.md in one commit before check.sh full.
- Done: SIDE E (design plus tests ledger_conservation.js and ledger_fuzz.js, side/ledger-design at 22d5b83; what main must change in shared files at the ledger step is in its report and LEDGER_DESIGN.md). SIDE I (side/deploy-prep 1a5d16b: build_site.sh, deploy_dry_run.sh, DEPLOY_RUNBOOK.md; DRY RUN OK; coordinator's calls: deploy by no-fast-forward merge so rollback is one revert; wip/team/RELAY still names the old address, fix with E13 after v1; opening data with 38.28 after a rollback is untested, so Mako exports a backup before the deploy).
- SIDE N, session_01BFpKEZZgy2d3mworAzNt5F, side/ledger-core from side/ledger-design: wip/team/ledger.js as a new file proved against the ledger tests, not wired in; main wires it after v1.
- Next lane to start: statements (when SIDE L reports the Philippine statement formats).
- Copy batch (efficiency review 2): the voice lane delivers COPY_V1.md as an exact table plus tests/qc/copy_apply.js; glossary terms are not renamed; MAIN 2 applies it in one commit after its last v1 point (tests old to new string, voice_lint in the script tier, golden re-recorded), then verify.sh once and the single check.sh full; qc-voice replaces qc-wording in the panel. Mako sees 10 to 15 before and after pairs first; if he has not reacted by the time MAIN 2 is ready, ask him once in two lines.
- Done: SIDE J (side/e6-window-test 5564814; found live data loss on import; MAIN 2 told to put fixes 1 to 5 into v1; checklist E6 and E14). SIDE L (side/ph-accounts 0f87594: PH_ACCOUNTS.md, presets_ph.json with 50 names, PERSONAS_PH.md; ledger gaps: card cut-off day, cards not paid in full, instalments, paluwagan, 13th month, sent to SIDE N).
- SIDE O, session_01BFpKEWGt66FAVwvxiYaZMt, side/statements-ph: made-up Philippine statement fixtures, stmt_ph.js as a new file, on-device masking, STATEMENTS_DESIGN.md. Not wired in.
- Mako, later the same day: copy in one batch at the end and then ONE pass with him on the preview, tweaked until right; the north star check for onboarding and copy details is combined with the voice checker; cloud copy must explain itself step by step (E15, v1); yen stays default. Voice samples were sent to him (three help texts, six strings); waiting for his reaction, with two notes for his gut: how casual ("actually", "a bit"), and whether one line notes drop the capital. The QC briefs get jobs to finish, not only screens (MAIN 2 was told), because the unclear cloud copy was never tested for.

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
