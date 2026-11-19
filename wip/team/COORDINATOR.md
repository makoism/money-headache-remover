# Coordinator handoff (latest first)

The coordinator is the one session Mako talks to. It records his decisions in DECISIONS.md (and NORTH_STAR.md, LAUNCH_CHECKLIST.md), starts and messages working sessions, and brings their results back to him. Working sessions take direction from nowhere else. The coordinator hands off at about 150k tokens of history, like every session.

## 2026-11-19, handoff 5 (coordinator 5 to coordinator 6) READ THIS FIRST

Coordinator 5 (session_01BFpKEX9xQF894VPk3euyZi) was at 176k tokens at 13:00 UTC after 2.5 hours and handed off. The fixed load is large: every turn costs. Do not read NORTH_STAR, DECISIONS and the checklist in full unless Mako gives a decision; this entry and "Open with Mako" in handoff 3 are enough to run. NEVER call list_events on a main session (one page is 20k tokens); use git log and get_session only. Answer check-ins in two lines.

### Usage
Weekly warning on the meter (resets about Sun 22 Nov 00:00 UTC). Tell Mako once in one line. MAIN plus at most one lane; no lane without a clear need before v1.

### Running
- MAIN 7, session_01BFpKEYdf3wtxeW7meT1A14, wip-38.31, the only session on app files. At 12:45 UTC (tip 11c1e7e): tests follow the copy batch (23 pass, words only), golden re-recorded, VERIFY OK. Then: the ONE check.sh full (was running), candidate, ONE QC run (both gates, qc-voice, beginner walk with jobs, E15 novice move, the "Lito" walk), private preview link, 412x915 screenshots in wip/team/preview/, STEP8_COMPARE.md summary, and whether the welcome "Enter your recovery code" link shows on the preview. Main sessions pass 150k in about an hour: when it hands off, start MAIN 8 from RESUME section 0 top entry with a prompt like MAIN 7's (only session on app files, report to the coordinator, push every 15 minutes, helpers for size, never push to main). If a main session is silent for 30 minutes, tell it to push what it has and stop, then replace it.
- Stopped, do not message: MAIN 3 to 6 (MAIN 6 is session_01BFpKEXnaZGxZyFuv3TFwST), all side lanes.

### Done under coordinator 5
- MAIN 5: H1 fixes (Home "Bank at month end", setup card step and Split the rest, Help on a solid shelf on phones, word fixes as copy rows).
- MAIN 6: J-009 (export copies the table when no download), the copy batch applied (ad3b8fc, 458 rows), screen pack run (57 panels), the Cloud copy box on a return visit (checklist E16, done). Help in setup is not small: after v1 (checklist H8).
- MAIN 7: Setup done line missing space fixed; ACT.drawNow (repaint only) named in act_keep.known. tests/regression/team_cur.js stays unrun: stale, not in check.sh, replaced by currency_ui.js.

### Mako
He has not written in the coordinator chat since handoff 3. He wrote in MAIN 6's chat at about 11:56 UTC (how far along; "full steam ahead"); no new decision. When he writes: greet him in two lines with where things stand. "Open with Mako" in handoff 3 stands. For his copy pass, labels he has not seen: "Monthly bills", "Bank at month end". For the preview note: tests/page_import.js and page_assistant.js not run here (no wrangler); Help is not reachable in setup, inside a burrow or in the world view.

### Timers
None of coordinator 5's remain. Set your own.

## 2026-11-19, handoff 4 (coordinator 4 to coordinator 5) READ THIS FIRST

Coordinator 4 (session_01BFpKEXvqtaKqkyg3aNk3hU) was at 189k tokens at 10:25 UTC and handed off. A coordinator starts with a large fixed load, so the 150k mark comes after about 20 short turns: read notifications, act, answer in a few lines, never paste reports.

### Usage
The five-hour limit stopped every session from about 05:45 to 09:30 UTC. At 10:25 UTC the meter shows a WEEKLY warning (seven day window, resets about Sun 22 Nov 00:00 UTC by the session record). Tell Mako once in one line; keep to MAIN plus at most one lane; no lane without a clear need before v1.

### Running sessions (tell each your session id first)
- MAIN 5, session_01BFpKEWWxvkJabWSHhA7nC3, wip-38.31, the only one on app files; 117k tokens at 10:25 UTC, so it will hand off before the QC run (it was told: hand off if near 120k before QC). Landed: QC briefs with jobs (cddf27a), 12 of 13 error rows (a1c44b0), H1 findings 1, 8 (db6c42b: the planned bank on Home is named "Bank at month end") and 2, 3 (c009424). Still to do, in order: the rest of H1, J-009 small code change with a test, Help reachable in setup if small (inside a burrow and the world view go after v1), finish and run tests/qc/screen_pack_panels.js (left half done by MAIN 4 at 3f7d83b), apply the copy batch in ONE commit (454 rows check clean), golden re-record, verify.sh, ONE check.sh full, candidate, ONE QC run (both gates, qc-voice, beginner walk with jobs, E15 novice move between two browsers, the "Lito" walk from side/persona-walks 77b2d02), then the private preview link, 412x915 screenshots under wip/team/preview/, STEP8_COMPARE.md summary. When it hands off, start MAIN 6 from RESUME.md section 0 top entry with a prompt like MAIN 5's: only session on app files, report to the coordinator, tests first, resume timer, protect its size with helper agents and short reports, never push to main. A fresh main session for the QC run alone is fine.
- Stopped, do not message: MAIN 3, MAIN 4 (session_01BFpKEWy6YG3aHjgq823AHA, told to stop at 255k), SIDE N3, N4, S.

### Done since handoff 3 (branches kept, nothing merges before v1)
- side/ledger-core d096d72 (N3 then N4): all ten gaps W1 to W5 and G1 to G5 closed, the moved-opening undo fixed, docs updated; LEDGER CORE ALL PASS by report. The one ledger branch for after v1. Open, none blocks wiring: undo the adjust when a late statement arrives; history before the first typed balance; a kind shift; ledger_ref migrate3831 takes the plain shape only.
- side/persona-walks 77b2d02 (S, faster model): PERSONA_WALKS.md, 7 walks, 63 v1 tasks, 40 team tasks; PERSONAS_PH.md corrected.
- On wip-38.31 from MAIN 3 and 4: side/phone-fixes merged, act_keep and exact Undo, A11, F4, wallet.xlsx in setup_env.sh, the welcome screen has the cloud copy steps, copy tables in the branch with the privacy rows rewritten.
- Coordinator's calls: act_keep stays as built (16 single typed values named in act_keep.known). tests/page_import.js and page_assistant.js cannot run in these containers (no wrangler, install refused, not in check.sh): recorded as not run, say so in the QC note for Mako.

### Mako
He has not written in this chat since handoff 3. When he writes: greet him in two lines with where things stand. Everything in "Open with Mako" of handoff 3 below still stands. Add for his copy pass: "Monthly bills" (new Plan row name) and "Bank at month end" (new name for the planned bank on Home) are labels he has not seen. Add for the preview note: the two page tests not run here; Help is not reachable inside a burrow.

### Coordinator 5 took over (10:26 UTC)
- Coordinator 5 is session_01BFpKEX9xQF894VPk3euyZi. Check-in timer trig_013sGA6xUrWiqVV14v3WBqDs (10:56 UTC).
- MAIN 5 handed off at b28c788 (10:41 UTC): H1 fixes landed (Home, setup, Help on a solid shelf on phones, word fixes as copy rows; copy_apply --check 458 rows clean). MAIN 6 is session_01BFpKEXnaZGxZyFuv3TFwST, the only session on app files: 5 copy rows in COPY_V1C.md, J-009, Help in setup, screen_pack_panels.js, the copy batch, check.sh full, candidate, ONE QC run, preview. Owed by it: whether the welcome "Enter your recovery code" link shows on the preview.

- MAIN 6 stopped at 1d53316 (12:17 UTC, 177k tokens in 55 minutes): copy rows, J-009 (export copies the table when no download), the copy batch applied (ad3b8fc, 458 rows), screen pack run (57 panels), cloud copy box on a return visit fixed (checklist E16). Help in setup is not small: after v1 (checklist H8). Tests that quote old wording are half followed up (list in RESUME section 0).
- MAIN 7 is session_01BFpKEYdf3wtxeW7meT1A14, the only session on app files: tests follow the copy, re-record, verify.sh, ONE check.sh full, candidate, ONE QC run, preview. Told to push every 15 minutes and use helpers for size.
- Mako wrote in MAIN 6's chat at about 11:56 UTC (how far along; "full steam ahead"). No new decision. Do not list a main session's result events: one page is very large.

### Timers
Coordinator 4's check-in trig_01EYU5mUN12uruSbrdXpeN5r (10:55 UTC) fires into coordinator 4, which only forwards. Set your own.

## 2026-11-19, handoff 3 (coordinator 3 to coordinator 4)

Coordinator 3 (session_01BFpKEWbWX57dzJueLvseiT) passed the 150k mark at 05:31 UTC and handed off. Its running log is the section "handoff 2" below ("Coordinator 3 took over" and the bullets after it); this is the state.

### Coordinator 4 took over (05:32 UTC)
- Coordinator 4 is session_01BFpKEXvqtaKqkyg3aNk3hU. MAIN 3 and SIDE N3 were told to report there; both alive (wip-38.31 ca5f036 with A11 and the act_keep fix; side/ledger-core e5299e2 with G2 and G4 fixed at 05:31 UTC).
- Timers: check-in trig_01DH6Q6dBjNTKBWc4Ma8hnCQ at 05:58 UTC; after the usage reset trig_013WY5YLe49jxxpfy3acwMVo at 09:36 UTC.

- The usage limit stopped everything from about 05:45 to 09:30 UTC (the coordinator too). After the reset both sessions were told to hand off (270k and 280k tokens).
- MAIN 3 handed off at 6838e91 (side/phone-fixes merged, act_keep and A11 in; RESUME.md section 0 has the remaining order and the screen pack list). MAIN 4 is session_01BFpKEWy6YG3aHjgq823AHA, the only session on app files: F4, U1, U2, H1, QC briefs, screen pack, wallet.xlsx, copy batch (copy_apply.js --check first), check.sh full, candidate, QC run, preview. Coordinator's call: act_keep stays as built (16 single typed values named in act_keep.known; one copy slot must not let a small edit push out a big change's copy).
- SIDE N3 stopped at side/ledger-core 0992eee: W1 to W5, G1, G2, G4 fixed; all pass by its report. SIDE N4, session_01BFpKEYfRxzbAN7La7p1sYa, does G3, G5, the ledgerUndo opening event point and the doc updates.
- For Mako's copy pass: "Monthly bills" (the new Plan row name from A11) is a label he has not seen.

- SIDE N4 is done (side/ledger-core d096d72): G3, G5 and the moved-opening undo fixed, tests first; docs updated; LEDGER CORE ALL PASS with no GAP line by its report. It edited five lines of money_door.js (doorApply), accepted. side/ledger-core is the one ledger branch for after v1. Still open, none blocks wiring: undo the adjust when a late statement arrives; history before the first typed balance; a kind shift; ledger_ref migrate3831 takes the plain shape only.
- MAIN 4: F4 landed (7424a46). Running now: MAIN 4 only. Free slots: persona walk scripts (faster model) next.

- SIDE S is done (side/persona-walks 77b2d02, faster model, docs only): PERSONA_WALKS.md, 7 walks, 63 v1 tasks and 40 team tasks, a brief at the top; PERSONAS_PH.md corrected (paying a card lowers Total). Its note that the v1 screens were missing was wrong (checked: src/ui6.js, ui7.js). The Mako-shaped walk ("Lito") runs in the v1 QC round.
- MAIN 4 handed off at 7895733 after 20 minutes (size): F4, wallet.xlsx, welcome screen steps, H1 walk done (11 groups in RESUME; worst: two bank numbers on Home after Check your bank), copy tables in the branch and checked (454 rows apply), privacy rows rewritten. tests/page_import.js and page_assistant.js cannot run here (no wrangler; install refused; not in check.sh). MAIN 5 is session_01BFpKEWWxvkJabWSHhA7nC3: H1 fixes, 13 error rows, QC briefs, the copy batch, check.sh full, candidate, QC run, preview. It was told to protect its size (helpers, short reports, hand off before QC if near 120k). MAIN 4 may still land one screen_pack.js commit.
- Running now: MAIN 5 only.

### Usage
At 05:31 UTC the five-hour window showed a warning (near its limit); it resets at 09:30 UTC. Keep the count low: MAIN 3 always, at most one or two lanes. Every session keeps a resume timer. If the limit stops everything, check after 09:30 UTC that MAIN 3 restarted (new commits on wip-38.31) and message or replace it.

### Running sessions (tell each your session id first)
- MAIN 3, session_01BFpKEZkCVKqMnkUeTtg2j5, wip-38.31, the only one editing app files. Landed: E6 fixes 1 to 5, E9, E10 client, E15 (one name: "cloud copy"). On now: A11 (two amounts for "Bills and basics" on Plan) and the act_keep fix (one place in ACT.tx keeps a 3-day copy; exact Undo for removeGoal, tx, setBalance; setBankNow, setCard, removeCard covered). Then F4, U1, U2, H1, QC brief jobs and screen pack panels (it owes the list of panels never in the pack), merges (side/phone-fixes ea880b0, side/act-keep-checks 68b59aa with check.sh lines for act_keep.js and label_agree.js), a made-up wallet.xlsx in setup_env.sh, the page_assistant.js "Home shows goals first" fail to judge. It HAS the word to apply the copy batch after its last v1 point and the merges (copy_apply.js COPY_V1.md COPY_V1B.md COPY_V1C.md from side/voice c0465fb, 455 rows), after settling four things: privacy lines exactly true (A-052, G-058, H-008, H-031), no iPhone Home Screen promise (H-039), the welcome screen gets the same find, show, load steps as Settings, eight errors say what to do. Then golden re-record, verify.sh, ONE check.sh full, one candidate, ONE QC run (both gates, qc-voice in place of qc-wording, beginner walk with jobs), then a private preview link, 412x915 screenshots and the STEP8_COMPARE.md summary to the coordinator. If it hands off (150k), start a fresh main session from RESUME.md section 0 with a prompt like MAIN 3's (see git history of this file's neighbours or write one: only session on app files, report to the coordinator, tests first, resume timer, never push to main).
- SIDE N3, session_01BFpKEVCMiQwhmZ4kzJtBF8, side/ledger-core: merged side/ledger-wiring and side/money-door in; fixing W1 to W5 (migrate3831; W1 to W5 done by 05:26 UTC) and G1 to G5 (money door gaps), failing tests first. When it reports, side/ledger-core is the one ledger branch for after v1.

### Done lanes, branches kept, nothing merges before v1
side/statements-ph (O: reader, fixtures, date-order proof; layouts invented, needs real statements), side/vault-server 9d0f1da (G: vault and relay; merges only after v1 is deployed and Mako says go; "Before this merges" list in LANE_vault.md), side/act-keep-checks 68b59aa (H), side/voice c0465fb (M3: three copy tables, HELP_TEXTS_V2.md, VOICE.md, qc-voice; M3 is at its size limit with a timer at 06:58 UTC; start a fresh voice session from LANE_voice.md only when Mako gives copy notes or main moves the strings), side/ledger-wiring 09ce61b (P), side/money-door 814620c (Q), side/deploy-prep 1f8af90 (R: DEPLOY_RUNBOOK.md parts A to E), side/phone-fixes ea880b0, side/e6-window-test, side/security-review, side/help-texts, side/ph-accounts, side/ledger-design.

### Mako in this chat (all recorded in DECISIONS.md, last two sections)
- The 3D world is desktop only; the phone app stays as it is.
- The coordinator picks the model for each session (strongest for app code, numbers, data safety, ledger, gates, copy; faster model for docs, research, runbooks, light reviews). He keeps his chat on the strongest model at medium.
- He was shown: help entry 20, six before and after copy pairs, the cloud copy steps as a person reads them. No reaction to any of them yet; do not chase.
- He asked for progress as a percentage with dates. Told him (estimates): whole plan about 35%; v1 about 80% built, preview 19 to 20 Nov; team test about 25%, ready two to three weeks after v1, test from the 10 Dec pay day; wider launch about 10%, January to February; art and 3D 0% on purpose, four to seven weeks once he starts it.

### Open with Mako
- Security, only he can do it: the seven phone steps in DEPLOY_RUNBOOK.md part C on side/deploy-prep (INVITE_CODES phrase with no commas, auto-reload off, monthly spend limit, no ANTHROPIC_BASE_URL, /api/health, and the OLD Worker money-headache-remover, which may still hold the key with no invite phrase). He was told the short version at 05:09 UTC and offered the steps ("send the steps"); else they go with the v1 preview. Labels are from memory, not seen live.
- With the v1 preview: the link, screenshots, what to try, STEP8_COMPARE.md summary, the ledger notes, the list of real statements to send (LANE_statements.md on side/statements-ph, one per bank, blacked out), export a backup before the deploy, "Every coin has a home" (kept; his call), the list of glossary words that sound off (in the copy tables), and once: two or three messages he typed by hand with his " - " in them.
- Then the ONE copy pass with him on the preview; copy-only rounds need no new gate run.

### Next lanes (run the efficiency agent first; keep one slot for MAIN 3's QC run)
Persona walk scripts written as tasks, faster model, run on the candidate (correct PERSONAS_PH.md: paying a card lowers Total); pdf.js size and speed note on side/statements-ph; the setup redesign on paper only after Mako has reacted to v1; G2 measures after v1 deploys; wiring HELP_TEXTS_V2.md after v1. After v1 on the main line: the ledger by LEDGER_WIRING.md (refresh fixtures from the shipped v1 first; confirm P's choices: one copy under key burrow-ledger-v1, lstore.js, ledger cloud copies under a second vault id, and G's server-side refusal of an older page's save).

## 2026-11-19, handoff 2 (coordinator 2 to coordinator 3), then coordinator 3's running log

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

- SIDE N ledger core is done (side/ledger-core 056f2af; ledger.js, tests, LANE_ledger_core.md; by its report all pass, differential against the reference to the cent). It was at 280k tokens, so it was told to stop. Efficiency review said: fix its design corrections now, same branch, one short lane. SIDE N2, session_01BFpKEXqhapVWSayuot43vo, side/ledger-core: reference and I7 fixed (failing tests committed first, counts not below 389,257 diff and 240,864 fuzz), cutDay, instalments and the new storage key recorded in LEDGER_DESIGN.md. The plan.debts check waits: it becomes a wiring script run on a saved copy from the v1 candidate. SIDE G was told about the storage key guard.
- Mako (04:39 UTC): the 3D world is desktop only (DECISIONS.md last section). He has been greeted in this chat. Offered him the cloud copy help text; not shown yet.
- Running now: MAIN 2, M2, G, H, N2.

- SIDE G vault and relay is done (side/vault-server 65b1cdc, not merged; merges only after v1 is deployed and Mako says go). Relay fixes S6, S5/S11, S10, S12, L2, L5 in functions/api/ai.js; by its report vault_server 53, vault_clients 28, relay_security 26, relay_clients 27 pass. Asked G: daily cap per address becomes a setting defaulting to 300; a "Before this merges" list in LANE_vault.md. MAIN 2 was given: the page_assistant.js fail "Home shows goals first" (also on plain wip-38.31) and the missing fixture /tmp/v28/wallet.xlsx for page_import.js. For the deploy session and DEPLOY_RUNBOOK.md (side/deploy-prep): L3 in worker/index.js, and the live Worker must have NO ANTHROPIC_BASE_URL set or the relay refuses every call after the vault merge. Add that to Mako's dashboard check (security B4) when it is next mentioned.
- Mako was shown the cloud copy help text (entry 20) in chat at 04:40 UTC; no reaction yet.
- Running now: MAIN 2, M2, H, N2 (G finishing one small change).

- MAIN 2 handed off at 3e6ebe0 (A1 with cfg.bankNow, A5 simple with S.cards, verify OK, check.sh ALL GOOD by its report). MAIN 3 is session_01BFpKEZkCVKqMnkUeTtg2j5, the only session editing app files on wip-38.31; its prompt carries the order of work, the act_keep finding, the QC brief jobs and the two vault points. MAIN 2 was told to stop. M2 was told Home has landed; Settings and the saving screens wait for E15 (MAIN 3 sends a line).
- SIDE G finished its last change (side/vault-server 9d0f1da, cap default 300, "Before this merges" list in LANE_vault.md). For the ledger step: G suggests the server itself refuses a save from an older page (a format number per save); take it, it fits "nobody loses data".
- Running now: MAIN 3, M2, H, N2.

- SIDE M2 handed off (side/voice 85aa9ea): COPY_V1.md has 275 rows (setup, Plan, Receipts, Home and More) with copy_apply.js; applies cleanly to 77a8f0a; voice_lint strong 34 to 16. 37 test files quote an old string (24 golden files, home_dom, leftover_choice, leftover_thin, mako_answers, number_gate3, v1_home, model_3828 fixture, regression copies): MAIN 3 needs that list with the copy batch. SIDE M3 is session_01BFpKEYTAHNqadfvthsoPNC on side/voice: fresh qc-voice check of the 275 rows, the smaller dialog files (COPY_V1B.md), then the saving and Settings strings on the coordinator's word after E15, and 12 before and after pairs for Mako's phone. "Every coin has a home" stays as it is until Mako says (flag it to him in the copy pass).
- MAIN 3 reported E6 fixes 1 to 5 landed (04:45 UTC). Look at the commit at the check-in.
- Running now: MAIN 3, M3, H, N2.

- SIDE N2 is done (side/ledger-core a4df93e): reference and I7 fixed, failing tests committed first (12d144b), fix 06a28bf; two more wrong cases found (card and owed money in another currency); ledger_core_all.sh could not fail before (piped through tail), now it can. Counts by its report: diff 691,210, fuzz 531,456, edge 476, conservation 113,531. LEDGER_DESIGN.md and LANE_ledger_core.md updated. For the ledger step's cloud wiring (LEDGER_DESIGN.md "Storage" and LANE_vault.md): new storage key, the ledger's cloud copy must not sit where a 38.31 page downloads it as its own, and every write or upload asks ledgerMayWrite on the copy it would replace. Left: plan.debts wiring check (needs the v1 candidate), open design points 8 and 9 in the handoff.
- Running now: MAIN 3, M3, H.

- SIDE M3 steps 1, 2, 5 done (side/voice): fresh qc-voice on COPY_V1.md (38 failed, 32 rewritten, 274 rows); COPY_V1B.md 91 rows for the smaller dialogs; both apply cleanly to 8369a5e (364 rows, 23 files; strong lint 34 to 3, the 3 wait for E15). Apply: node tests/qc/copy_apply.js COPY_V1.md COPY_V1B.md. For MAIN 3 with the copy batch: privacy lines A-052 and G-058 must be checked against what the app really does; rows G-027, G-054, G-074, G-075 at the top of COPY_V1B.md; three message pieces the code reads ("cut short", "PDF" or "pages", the colon after a file name) must not be hand edited; test files quoting old strings are listed by copy_apply.js. Six of the 12 before and after pairs were shown to Mako at 04:58 UTC. Its list of words that sound off (Education, Not placed yet, Cloud backup and cloud copy, Bills and basics, Short, and more) is in its report and the tables, for the one copy pass. M3 now waits for the word on E15.

- SIDE H is done (side/act-keep-checks 68b59aa, tests only): label_agree.js (65 comparisons pass; one finding: on Plan, Month, "Bills and basics" shows two amounts, with and without card and loan payments) and act_keep.js (8 pass, 25 fail until the ACT.tx fix; setBankNow, setCard, removeCard included). Both given to MAIN 3 for v1, with the check.sh lines. H told to stop.
- Running now: MAIN 3 (building), M3 (waiting for E15). Slots are free; nothing else is unblocked before the v1 candidate.

- Check-in 05:02 UTC: MAIN 3 working (E6 fixes 1 to 5 landed, 4175751), M3 idle waiting for the E15 word. Efficiency review of what to run in the free slots: start three, keep one slot free for MAIN 3's QC run, hold the setup design until Mako has reacted to v1, skip password PDFs (wider launch). Started:
  - SIDE P, session_01BFpKEXPU11hrSQ376QmQyP, side/ledger-wiring (from side/ledger-core): LEDGER_WIRING.md, failing wiring tests, migration fixtures from the real model.js (settles plan.debts names), LANE_ledger_wiring.md. Does not edit ledger.js.
  - SIDE Q, session_01BFpKEZU77DCnabQJ3t9zWm, side/money-door (from side/ledger-core): money_door.js (the kinds of "Money came in" and "Money went out" as logic), its test, MONEY_DOOR.md. Does not edit ledger.js; gaps are written down.
  - SIDE R, session_01BFpKEXux4kCEyeo4LkFhue (faster model), side/deploy-prep: DEPLOY_RUNBOOK.md brought up to date (two deploys, the vault "before this merges" list, a section "Only Mako can do these", the old address list).
  - Not started, next when a slot frees: persona walk scripts written as tasks, run on the candidate; pdf.js size and speed note on side/statements-ph.
- Next check-in timer trig_014KVDibgLeH912eBK5JHPXR, 05:30 UTC.
- Running now: MAIN 3, M3 (waiting), P, Q, R.

- MAIN 3: E15, E9, E10 client part landed (05:03 UTC); one name now, "cloud copy". M3 was given the word and the file list; it reports back with the cloud copy steps as a person reads them (show those to Mako).
- SIDE R is done (side/deploy-prep 1f8af90, docs only): DEPLOY_RUNBOOK.md parts A (v1), B (vault and relay), C ("Only Mako can do these", 7 steps for his phone), D (old address list), E (checks per device). Findings: the deploy scripts and runbook live only on side/deploy-prep (runbook step A1 merges it first); deploy_dry_run.sh cannot pass for the vault merge by design; L3 fix written out; INVITE_CODES is comma separated, so no commas in the phrase; the OLD Worker (money-headache-remover, frozen at 38.10) may still hold the Anthropic key with no invite phrase, which would be an open relay: in Mako's step 7. Dashboard labels are from memory, not seen live. Told Mako the short version at 05:09 UTC; the full steps go to him when he asks or with the v1 preview.
- Running now: MAIN 3, M3, P, Q.

- SIDE P is done (side/ledger-wiring 09ce61b, new files only): LEDGER_WIRING.md (steps 0 to 14), 8 saved 38.31 fixtures built with the real model.js (refresh: node wip/team/tests/next/wiring_make_fixtures.js <git ref>), wiring_migrate.js, wiring_store.js, wiring_page.js. plan.debts names settled: {id, name, kind, balance, apr, min, extra}. Four gaps in migrate3831 with failing cases (a debt goal moved as savings; the sample's invented emergency fund moved as if typed; a debt loses its id; the frozen copy gets a key added), plus: a moved ledger starts on the calendar month, so the pay day (Mako's 10th) must be asked; a card debt and a card in S.cards with one name are owed twice. Its choices to confirm before wiring step 5: one copy under new key burrow-ledger-v1, lstore.js, ledger cloud copies under a second vault id. NEXT: when SIDE Q reports its gaps, start ONE short session on side/ledger-core that fixes all ledger.js gaps from P and Q (failing tests first), before the ledger step.

- SIDE M3 step 3 done (side/voice c0465fb) and at its size limit: COPY_V1C.md, 91 rows for the cloud copy steps, recovery code, backup, restore, Home notices, Settings. All three tables: 455 rows, 26 files, lint strong 34 to 0. MAIN 3 was given the word to apply the batch after its last v1 point and the merges, with the four things it must settle first (privacy lines exactly true: A-052, G-058, H-008, H-031; H-039 iPhone Home Screen storage promise; welcome screen gets the same find, show, load steps as Settings; eight errors that do not say what to do). Mako was shown the cloud copy steps as a person reads them (05:14 UTC). Voice lane: start a fresh session (from LANE_voice.md on side/voice) only when Mako gives copy notes or the main branch moves the strings; M3 has a timer at 06:58 UTC.
- Running now: MAIN 3, Q.

- Mako (05:17 UTC): the coordinator picks the model for each session (DECISIONS.md last section).
- SIDE Q is done (side/money-door 814620c, new files only): money_door.js with 7 kinds in and 9 out, money_door_test.js (335,741 checks pass by its report), MONEY_DOOR.md (14 defaults taken, and the situations that fit no kind: a zero-pay month, check your bank, moving between places, the card instalment, a card not paid in full, a balance transfer, interest), LANE_money_door.md. It found the checklist A4 wording wrong (paying a card lowers Total; fixed in LAUNCH_CHECKLIST.md; PERSONAS_PH.md on side/ph-accounts says the same for Carlo and Mika and needs the same correction when persona walks are prepared) and five ledger gaps G1 to G5.
- SIDE N3, session_01BFpKEVCMiQwhmZ4kzJtBF8, side/ledger-core: merges side/ledger-wiring and side/money-door in, then fixes W1 to W5 (migrate3831) and G1 to G5, failing tests first, ledger and reference together. After it, side/ledger-core is the one ledger branch.
- Running now: MAIN 3, N3.

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
