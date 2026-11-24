# Back-test findings, sorted (24 Nov 2026, read-only helper)

Read MAKO_SAYS.md first. Reports: assistant.md (A), novice.md (N), north-star.md (S), all on the live build (main 6740469, app3 build 5bf4d32). Each finding was checked against the code on wip-38.31 at 8d94d82 and the open lanes: origin/lane/ai-core b59f994 (local lane/ai-core the same), origin/lane/ai-panel 7a975fb, lane/setupfix a4e0dad (local worktree agent-ae677ae9ec4601481), lane/install 120effb (merged; its worktree holds uncommitted manifest work), lane/controls-base 5cf51b2 (already in wip-38.31), origin/lane/restore 089d0be, origin/lane/s2b 87965d5.

Groups: **FIXED** (commit named), **QUEUED** (queue named), **NO QUEUE**. "Not a fault" means the figure is right by the rules; the row says what still confuses. C1 to C13 are the coordinator's thirteen checks.

Note: the live build is older than wip-38.31. Many findings are already fixed on wip-38.31 by commits after 5bf4d32 (slice 6, LISTFIX, the code word).

Two rows of M_COVERAGE.md are wrong and should be corrected there: M47 says MET, but Home's short line is red (C3). M18 says MET, but "?" exists only on three Home cards and one Plan row (C6).

| # | Finding | Group | Where, checked in code |
|---|---|---|---|
| **C1** | Setup: Back, close or reload half way loses everything typed | FIXED for saved sections; NO QUEUE for the rest | lane/setupfix 88d541b: each section's Save keeps a draft on the device (setup3.js:438 keepDraft3), and opening setup puts it back (setup3.js:199-200, restoreDraft3 468). Back keeps the draft (setup3.js:230-231). Still lost: a section marked "Not saved yet" is dropped by Back or a reload, with no question (closeSetup3, setup3.js:231). The chat draft on ai-panel is kept in IndexedDB (AI_FIRST_PLAN 1) |
| **C2** | Sum line under safe to spend unreadable; a Free to spend lunch lowered safe to spend | Words FIXED on wip-38.31. Lunch: not a fault. "One name, two meanings": NO QUEUE | Words: 5979073 (LISTFIX B3, home3.js:158 "held back: Free to spend has only ¥X left this period") and 920b55e (LISTFIX B2, home3.js:91, says why the figure is small right after setup). Why the lunch lowered it: safe to spend = the smaller of (what the accounts can spare) and (Free to spend left) (engine/lookahead.js:1263). Budget lines' money left is taken off inside the walk (lookahead.js:1121), but Free to spend is not, so Free to spend caps the headline instead (G2, BJ5). A lunch on Free to spend raises `spent` (lookahead.js:981), so Free to spend left falls by 1,200 (lookahead.js:992), and so does the capped headline. That is right by DECISIONS_ROUND2 G2 ("the headline is already capped by it") and BJ5. The 63,000: 83,000 can spare minus a cap of 20,000. The cap is the setup period's share of 40,000 for the days left (I4, BP2). What is still unclear is that "Safe to spend" means "Free to spend left" whenever the cap applies. That is only noted in app3/FOR_MAKO.md, not in a queue |
| **C3** | Pay one day late: "Not safe to spend, short by" in pink-red; sum line twice | NO QUEUE | The short line uses `a3-warn a3-bad` (home3.js:166), and `.a3-bad` is `--bad` #b8352e, pink-red #ef8f8f in dark (app3.css:34, style.css:13,40). M47 says amber. e3_warnwords tests the words only, not the colour. Twice: the account's own sum (home3.js:155, data-fig "why") and the short sum (home3.js:167, data-fig "shortwhy") are both printed. With no plan lines the two are the same. The status level for short is 'bad' (screens/status.js:28). By the rules, a late pay not counting is right (BH1) |
| **C4** | Chat log after reopening says "Removing Gym." and the left-out note is gone | NO QUEUE | wip-38.31 ask3.js:115 saves only the question and the AI's words, and ask3.js:63 redraws only those. The "Left out" line (ask3.js:138) is not saved. Not fixed on ai-panel either. chat3_core.js:557 returns "Nothing changed: ..." to the AI only and saves no turn. A part-dropped card keeps `dropped` (chat3_core.js:565), but chat3.js:102-106 never shows it. The AI's own words ("Removing Gym.") are saved as a turn (chat3_core.js:605) |
| **C5** | Error words: 401, 429 daily cap, 503, AI off | 401 FIXED; 429 partly in lane, QUEUED; 503 NO QUEUE; AI off partly in lane, QUEUED | 401: 3dce00e (lane/invite: 8ab8fa6, 95136ff, 234ee29). stmt3_ai.js:52-54 shows the code word box on invite_required, and Settings changes the word (settings3.js:90-106). 429: stmt3_ai.js:56 still throws the caller's words and drops the server's own message. On wip-38.31 Ask says "try again in a minute" (ask3.js:80). ai-panel 7a975fb says "the daily limit is reached, or too many messages at once. Try again later" (chat3.js:71). AI_FIRST_PLAN 7 asks for "Daily limit reached". 503 (no key, no credit, key refused, functions/api/ai.js:30,75,78): stmt3_ai.js:57 throws "the AI did not answer (503)" on every branch, and the server's message is thrown away. AI off: ai-panel shows "The assistant is off right now" in the panel (chat3.js:15, 136; AI_FIRST_PLAN 4). Settings says nothing about the AI being off (settings3.js has only the code word) |
| **C6** | No "?" or Help outside three Home cards (M18) | NO QUEUE | helpHead3 is used only at home3.js:141 (status), 174 (safe to spend) and 181 (period). There is one more "?" at plan3.js:61 ("Why only part?"). None in setup, Receipts, Settings or the other Plan sheets, and no lane adds one (s2b adds one, the runway line, home3_runway.js:13). AI_FIRST_PLAN only touches M18 through `explain` |
| **C7** | The assistant is not told the screen, pay amount, later bills or Keep at least | Pay and bills FIXED in lane; screen and Keep at least NO QUEUE | lane/ai-core 57df561: chat3_core.js:167-179 `figures` sends every pay and bill with ref, amount and rhythm. The same is on ai-panel. Screen: ctxOf sends book, today, anon and invite only (chat3_core.js:375 on both lanes). Keep at least: ASK3C.summary (ask3_core.js:35-87) says only "below your minimum" inside a short. The minimum figure is never sent, and figures() does not add it. Also not sent: the cap step of the sum (safeToSpend.whyParts). The summary sends only each account's sum (ask3_core.js:63) |
| **C8** | Two answers for next pay on 10 Dec: "until next pay on 12 Jan 2027" above "Next pay 10 Dec, today" | Not a fault in the figures. Wording NO QUEUE | Engine on the made-up book for 2026-12-10: daysToNextPay is 10 Dec (days 0), safeToSpend.until is 2027-01-12. On its day a pay counts as in (G4, BJ1), so safe to spend runs to the pay after it (lookahead.js:1296, 1301; home3.js:87-88). 10 Jan 2027 is a Sunday and 11 Jan is a holiday (Coming of Age Day). The made-up pay has `shift: 'after'` (fixtures/mako_madeup_book.json), so it lands 12 Jan. The period card names the pay landing today (home3.js:115). Both are right, but "next pay" means two pays on one screen (M51). Side note: Mako's real pay moves to the working day before (8 Jan), while the made-up book moves it after |
| **C9** | After a restore, Receipts shows the replaced spends and another safe to spend until you leave | NO QUEUE | replaceBook3 redraws Home only (settings3.js:20; lane/restore settings3.js:23). Receipts and Plan keep their old DOM. Cloud pulls already redraw both (start3.js:50, cloud3_page.js:80) |
| **C10** | A late card shows three times on Home; "after your cards are paid on 12 Dec" for a card due 11 Dec | Day: not a fault. Three times: NO QUEUE | The cards box (home3.js:197 "was due ..., not ticked off yet"), "Card and loan payments overdue" (home3.js:214) and "May still go through" (home3.js:217) each list it. "12 Dec" is today: an overdue card payment is taken today (lookahead.js:1329-1330, BK1). The words do not say "today" |
| **C11** | "Due before next pay: nothing" while the sum takes off a late bill | Not a fault in the figures. Wording NO QUEUE | The due list counts only `o.land >= today` (lookahead.js:1298). The walk takes a late bill off today, labelled ", late" (lookahead.js:1133). Home then prints "Nothing is due before next pay" (home3.js:187) |
| **C12** | "Keep at least" cannot be changed after setup | QUEUED | CONTROLS_PLAN section 1 (line 42), table row (line 72), slice 3 (line 172): `setKeep`, a Settings door, assistant `set_keep`. Waits for slices 1 and 2 (act3 field writes) |
| **C13** | "Bank today" shows one figure under "checked 1 Dec" of another (M51) | Not a fault in the figures. Wording NO QUEUE | bankParts3 (home3.js:15-19) writes "¥300,000 checked 1 Dec, ¥2,500 out logged since" under the big figure ¥297,500. The parts add up, but it is not written as a sum, so it reads as two figures for "the bank" |
| A1 | M1: Ask is a 32x44 text link; the first screen is a form | FIXED in lane | ai-panel 128f39e, d86eb4f: bar on every screen, welcome as the first screen (AI_FIRST_PLAN slices 1, 2) |
| A2 | M2: setup is a form; Ask says "Set up first" | FIXED in lane | ai-panel f687ff6, c23321f (setup chat, fill with Undo), ai-core 57df561 |
| A3 | M3: only 4 kinds of change | Partly FIXED in lane; rest QUEUED | ai-core 57df561: 17 steps (chat3_core.js:152). The rest: CONTROLS_PLAN section 2 and slices 3 to 14 |
| A4 | M4, M5, M9: no upload in Ask | QUEUED | AI_FIRST_PLAN slice 3 (ai-panel shows the "comes next" notice, chat3.js:18) |
| A5 | M6: every change needs Apply first | FIXED in lane | ai-core 57df561, 8b04744: change at once with Undo; only deletes and changes over safe to spend ask first (BW) |
| A6 | M17: no Ask before or during setup | FIXED in lane | ai-panel 128f39e, d86eb4f |
| A7 | M39: no before or after tax question | FIXED in lane | setupfix cd1dc64; ai-core guide question 8 and afterTax (chat3_core.js:126, 145) |
| A8 | M68: new anon id each page open; no household cap | FIXED | Household cap by code word: main 6740469, in wip-38.31 by 120effb (functions/api/ai.js:36-47). The id is kept on the device: ai-panel chat3.js:49-56 |
| A9 | Job 4: the cap sum is not in what Ask sends; Ask never told the screen | NO QUEUE | See C7 |
| A10 | Job 5: rent change, add a bank, remove Gym | FIXED in lane | ai-core change_bill, add_account, end_bill (57df561, 401353a) |
| A11 | Job 5: card statement upload | QUEUED | AI_FIRST_PLAN slice 3 |
| A12 | Job 6 and blocker 5: refusals do not say where on the screens; the AI is never told what it cannot do | NO QUEUE | The ai-core SYSTEM text (chat3_core.js:147) lists what to do, never what it cannot do or which screen does it. An unknown step returns "a change I can't make (x)" (chat3_core.js:490) |
| A13 | Job 8: not at first open; never knows the screen | First open FIXED in lane; screen NO QUEUE | ai-panel d86eb4f; see C7 |
| A14 | Grid: accounts, cards, loans, pay, bills by asking | Partly FIXED in lane; rest QUEUED | ai-core add_account, add_card, add_pay, add_bill, change_bill, end_bill. Rename, close and remove of accounts and cards, add and close loan, end pay: CONTROLS_PLAN slices 4 to 8 |
| A15 | Grid: budget lines add and remove; goals add, take back, remove; spends change and remove; Free to spend remove | Partly FIXED in lane; rest QUEUED | ai-core add_line, end_line, add_goal, remove (spends). take_out, remove_goal, change_goal: CONTROLS_PLAN slice 9. change_spend: CONTROLS_PLAN table (MISSING, no slice named). Free to spend to 0: set_free exists |
| A16 | Grid: checks, statements, the minimum by asking | QUEUED | CONTROLS_PLAN slices 10, 11, 3 |
| A17 | Grid: reminders, backup and cloud copy by asking | NO QUEUE | No step or plan names them |
| A18 | Key missing: nothing on Home or Settings; "open it from its own address" is wrong advice | Partly FIXED in lane, QUEUED | See C5. The old words stay in ask3.js:14 until AI_FIRST_PLAN slice 2 folds Ask into the panel |
| A19 | INVITE_CODES set: no code word box, 401 | FIXED | 3dce00e |
| A20 | 503: server message thrown away | NO QUEUE | See C5 |
| A21 | 429 daily cap worded "try again in a minute" | Partly FIXED in lane, QUEUED | See C5 |
| A22 | MODEL_* wrong: "(400)"; DB missing: caps silently off; ANTHROPIC_BASE_URL, SITE_VERSION: no sign | NO QUEUE | stmt3_ai.js:57 (status only). Health does not report the DB or caps |
| A23 | Blocker 3: chat log lies after reopening | NO QUEUE | See C4 |
| A24 | Confusing: "Left out ... (remove_bill)" in code words | NO QUEUE | Still "a change I can't make (remove_bill)" (chat3_core.js:490); ai-panel shows nothing at all (C4) |
| A25 | Confusing: "money for a goal I could not read" when no goal exists | NO QUEUE | chat3_core.js:479, same words on both lanes |
| A26 | Confusing: Ask's top line reads like a manual | FIXED in lane, QUEUED | ai-panel privacy words (chat3.js:14). ask3.js:11 goes in AI_FIRST_PLAN slice 2 |
| A27 | 5,000 set aside for Trip left safe to spend 18,000 | Not a fault | Headline capped by Free to spend left (lookahead.js:1263, G2); the set-aside lowered "can spare", which was still above the cap |
| A28 | Polish: Ask button 32 px wide | QUEUED | RESUME section 0 queue: no tap target under 44 at 320, 390, 1300 (ai-panel's bar replaces it) |
| A29 | Polish: Undo on an applied card gone after reopening | FIXED in lane | ai-panel chat3.js:102-103: a done card keeps its Undo from the saved turn |
| A30 | For Mako: confirm first or change then Undo | QUEUED | MAKO_SAYS not settled 1; ai-core builds change then Undo (M6) |
| N1 | M1, M2, M17 | FIXED in lane | As A1, A2, A6 |
| N2 | M9: setup asks everything by hand | QUEUED | AI_FIRST_PLAN slice 3 |
| N3 | M13: no remove of a bill or card in setup | FIXED in lane | setupfix 64eb561 |
| N4 | M13: after setup no add or remove bank, close card, remove goal | QUEUED | CONTROLS_PLAN slices 4, 5, 6, 9 |
| N5 | M14 and blocker 2: Back drops everything in setup | FIXED in lane (saved sections) | See C1 |
| N6 | M15 and blocker 1: empty bill amount blocks Save with no message; no Remove | FIXED in lane | setupfix 313ce7d (message by the box, focused), 64eb561 (Remove with Undo) |
| N7 | M16: one Save only | FIXED in lane | setupfix 88d541b |
| N8 | M18: "?" only on three Home cards; no Help anywhere | NO QUEUE | See C6 |
| N9 | M22: no "Money came in" door | Partly FIXED; QUEUED | 0764817 (wip-38.31): Receipts has Money in. The "Money came in" and "Money went out" words: RESUME section 0 (named for lane/install, nothing committed there yet) |
| N10 | M39: "How much lands", no tax question | FIXED in lane | setupfix cd1dc64 |
| N11 | M47: short line pink-red | NO QUEUE | See C3 |
| N12 | M52: Home is cards of numbers, no picture | NO QUEUE | No plan builds a picture for Home (S20 too) |
| N13 | M53: a wall of questions | FIXED in lane | ai-panel setup chat, one question at a time |
| N14 | M56: "Everyday spending" still the heading | Partly FIXED in lane; word for Mako | setupfix 55295af explains it with an example. The heading stays (setup3.js:140 on setupfix). A new word is MAKO_SAYS not settled 6, with the coordinator |
| N15 | M7, M12: cannot explain safe to spend | FIXED on wip-38.31 (words) | See C2 |
| N16 | Blocker 3: card close or remove, no bank add | QUEUED | CONTROLS_PLAN slices 4, 5, 6 (ai-core add_account for the assistant) |
| N17 | Blocker 4: no way to remove a goal | QUEUED | CONTROLS_PLAN slice 9 |
| N18 | Blocker 5: Ask unreachable on this copy; no Help screen to fall back on | AI FIXED in lane; Help NO QUEUE | ai-panel e3055d6, 350fed3: "Use any AI" works with no relay. Help: see C6 |
| N19 | First screen never says what the app is for | FIXED in lane | ai-panel welcome (chat3.js:18): "From that the app works out what's safe to spend until your next pay" |
| N20 | Sum line "more than Free to spend left" | FIXED | 5979073 |
| N21 | Lunch on Free to spend lowered safe to spend | Not a fault; NO QUEUE for the "one name" confusion | See C2 |
| N22 | Pay one day late: "Not safe to spend" scary; sum printed twice | NO QUEUE | See C3 |
| N23 | "If everything on the cards now is taken" | FIXED | f1f8d49 (LISTFIX B4) |
| N24 | Plan bill, empty Amount, Save: "Nothing changed" | QUEUED | RESUME section 0: a walker for every box and sheet (empty, wrong value, message, way out). Source: plan3_write.js:159 |
| N25 | 14 words nobody explained; nothing says where in real life to find each number | Chat FIXED in lane; screens NO QUEUE | ai-core guide questions 5, 8, 10 say where (chat3_core.js:123-128) and `explain`. Setup screens and Plan: as C6 |
| N26 | Three weeks away: "Pay not in yet" leads; "Check your bank: 3 things" lower | NO QUEUE | Status order in screens/status.js |
| N27 | Polish: "?" 28x28; select cut off at 144 | QUEUED | RESUME section 0: tap targets 44, no cut-off text |
| N28 | Polish: "about 80k" asks for what the bank shows, not numbers only | FIXED in lane | setupfix 313ce7d shows inputs.js's "That isn't an amount. Type digits only" by the box (setup3.js:204-206) |
| N29 | For Mako: it felt like forms | FIXED in lane | AI_FIRST_PLAN slice 1 (ai-panel) |
| S1 | M1, M2, M17, blocker 8 | FIXED in lane | As A1, A2, A6 |
| S2 | M9: no uploads in setup | QUEUED | AI_FIRST_PLAN slice 3 |
| S3 | M10: seven stacked text cards, no picture | NO QUEUE | MAKO_SAYS not settled 5 (which four numbers) |
| S4 | M13 and blocker 2: no bank add, rename or remove | QUEUED | CONTROLS_PLAN slices 4, 5 |
| S5 | M13 and blocker 3: no card remove (setup or Plan) | Setup FIXED in lane; Plan QUEUED | setupfix 64eb561; CONTROLS_PLAN slice 6 |
| S6 | M13: no remove of a second income in setup | FIXED in lane | setupfix 64eb561 |
| S7 | M13, M42 and blocker 4: Keep at least only in setup | QUEUED | See C12 |
| S8 | M14, M15, M16, M61 and blocker 1: empty bill traps, Back loses all | FIXED in lane | setupfix 64eb561, 313ce7d, 88d541b (rest as C1) |
| S9 | M18: no "?" in setup | NO QUEUE | See C6 |
| S10 | M22: no "Money came in" | Partly FIXED; QUEUED | As N9 |
| S11 | M23: one bank only, no e-wallet, cash or pay-later | Mostly FIXED; pay-later QUEUED | 1278c6b (wip-38.31): setup adds a second bank, cash, an e-wallet (setup3.js:28, 45). Pay-later: STAGE2_PLAN 2.3 |
| S12 | M39 | FIXED in lane | setupfix cd1dc64 |
| S13 | M47 and blocker 5: below zero is red; sum twice | NO QUEUE | See C3 |
| S14 | M51: "This is Free to spend" with three names | FIXED in lane | setupfix 55295af rewrites the hint (setup3.js:142 on setupfix) |
| S15 | M51: "Bank today" figure under another figure | Not a fault; wording NO QUEUE | See C13 |
| S16 | M52, M53, M56 | As N12, N13, N14 | |
| S17 | Blocker 6: two figures for next pay | Not a fault; wording NO QUEUE | See C8 |
| S18 | Blocker 7: two figures after a restore | NO QUEUE | See C9 |
| S19 | Confusing: a late card three times; "12 Dec" for a card due 11 Dec | NO QUEUE | See C10 |
| S20 | Confusing: "Due before next pay: nothing" with a late bill in the sum | NO QUEUE | See C11 |
| S21 | Confusing: "its own address" | FIXED in lane, QUEUED | As A18 |
| S22 | Polish: "?" 28x28 | QUEUED | As N27 |
| S23 | Polish: Settings after joining the cloud still says "The currency is chosen in setup." | NO QUEUE | settings3.js:32 is drawn once when the sheet opens; joining does not redraw it |
| S24 | Polish: a 404 on the made-up server | NO QUEUE | Not traced. Likely an icon. lane/install has an uncommitted icon3-192.png |
| S25 | Polish: backup lock checkbox has no label in the tap list | QUEUED | The label wraps the box (settings3.js:40). The size is in the RESUME 44 tap queue |
| S26 | For Mako: ended bills stay listed; header text links | QUEUED | For Mako's run (FOR_MAKO). The header Ask goes with ai-panel's bar |
| S27 | Picture first: safe to spend as a picture | NO QUEUE | As N12 |

## Smallest fix for each "no queue" item

- **C1** (Back with a section "Not saved yet"): ask "Keep what you typed?" on Back, or save the open section as the draft on Back and on pagehide. setup3.js on lane/setupfix (closeSetup3, keepDraft3).
- **C2** ("Safe to spend" means "Free to spend left" when capped): when `cappedByFreeToSpend`, the heading says "Safe to spend (your Free to spend left)" and the toast after a Free to spend spend says it comes off both. home3.js (around 174) and the spend toast in receipts3.js. Words for Mako's copy pass.
- **C3**: use `a3-warn` (amber) for data-fig "short" instead of `a3-bad`, and leave out the account's "why" sum when the short sum is shown for the same account. home3.js:155 and 166. Add a colour check to e3_warnwords.js. Map short to an amber level in screens/status.js:28.
- **C4**: save each card's `dropped` as a note turn ("Not done: I can't remove bills yet. Plan, Pay and bills"), and show `dropped` on the change card. chat3_core.js:557, 565 to 574, and chat3.js:102-106 (ai-panel). On wip-38.31 the same in ask3.js:115.
- **C5** (503 and 400): `post` throws the server's `error.message` when the body has one, for every non-ok status, 429 included. stmt3_ai.js:56-57. Settings gets one line from /api/health ("The assistant is off on this page") in settings3.js.
- **C6**: put HELP3 marks on each setup section heading and each Plan, Receipts and Settings card heading, with texts in screens/help.js. setup3.js, plan3.js, receipts3.js, settings3.js, screens/help.js.
- **C7**: pass the open tab in ctxOf (`screen: 'home' | 'plan' | ...`) and print "The person is looking at: Plan" in stateText. Add "Keep at least: ¥X (or none)" and the cap sum line (safeToSpend.whyParts through SM.sumLine) to the summary. chat3_core.js:337-345, 375 and ask3_core.js:63, with chat3.js deps.
- **C8**: when the next pay is today, the safe to spend heading reads "until the pay after today's, on 12 Jan 2027". home3.js:88.
- **C9**: replaceBook3 also redraws Receipts and Plan, as start3.js:50 does. settings3.js:20 (lane/restore settings3.js:23).
- **C10**: show an overdue card only in the overdue card, keep the cards box line to "see above", and leave it out of "May still go through". Name the after-cards day "today" when it is an overdue payment taken today. home3.js:197, 214, 217 and afterCards3 (home3.js:62).
- **C11**: list late and not-seen bills inside "Due before next pay" as "late" rows, or word the empty case "Nothing more is due before next pay". home3.js:187.
- **C13**: write the parts as a sum: "¥300,000 checked 1 Dec − ¥2,500 logged since = ¥297,500". home3.js:15-19.
- **A12, A24, A25**: one SYSTEM paragraph listing the steps it cannot do yet, with each screen door (from CONTROLS_PLAN's table), plus plain refusal words ("You have no goal called Trip yet. Add one on Plan, Goals"). chat3_core.js:147, 479, 490.
- **A17**: add the reminders, backup and cloud copy as `todo` rows in CONTROLS_PLAN's controls3 table, so the assistant says where they are. CONTROLS_PLAN.md (plan only).
- **A20, A22**: as C5 (stmt3_ai.js:57). Also /api/health reports `caps: false` when DB is missing. functions/api/health.js.
- **N12, S3, S27** (picture first): a plan item for one Home picture (money in, out, left), held for Mako with the art (M58) and not settled 5. A new plan line in RESUME section 0.
- **N25** (where to find each number on the screens): a hint under each setup box ("the big number in your bank app"). setup3.js.
- **N26**: put "Check your bank" above "Pay not in yet" when the last check is over 14 days old. screens/status.js (state order).
- **S23**: redraw the Settings sheet after a cloud join. settings3.js:32 (paint after join in cloud3_page.js).
- **S24**: find the 404 (the icon likely) in the made-up server log. If it is the icon, lane/install's uncommitted icon fixes it.

## Controls report (controls.md: 25 kinds, 192 cells), sorted

Read MAKO_SAYS.md first. Added 24 Nov by a read-only helper. Report: controls.md (K), on the live build (main 6740469, app3 build 5bf4d32). Each finding was checked against wip-38.31 at 4e9e40d and the lanes: origin/lane/ai-core 55fdf26, origin/lane/ai-panel 7dd019d, lane/setupfix 0d289db (local worktree agent-ae677ae9ec4601481), lane/controls-base d034090 (CONTROLS_PLAN corrections BZ), origin/lane/restore 089d0be. Three lanes have no commit ahead of wip-38.31 yet: lane/install 89d5c44 (manifest and the one-pay test only; its Receipts doors are uncommitted in worktree agent-a90fe3b2e758fbd01), lane/homefix eaf8516 and lane/blockers 4e9e40d (both empty so far, so nothing of theirs could be checked).

Same three groups. "Plan" means foundation_review/CONTROLS_PLAN.md on wip-38.31. File and line are under wip/team/app3/src on wip-38.31 unless a lane is named.

### The grid, every NO and BROKEN cell

| # | Kind and cells | Group | Where, checked in code |
|---|---|---|---|
| K1 | Bank account: add later, rename, remove, assistant | QUEUED (assistant add FIXED in lane) | Plan slices 4 (add, rename), 5 (close, remove), 13 (main bank). Assistant add: ai-core 1ea0af3, 401353a (`add_account`). No screen door on any branch |
| K2 | Cash, e-wallet: add in setup | FIXED | 1278c6b (wip-38.31): setup adds a second bank, cash or an e-wallet (setup3.js:130, 167). The other cells are the account row: as K1 |
| K3 | Card: remove; remove row in setup; assistant | Setup row FIXED in lane; rest QUEUED | setupfix 64eb561 (row Remove with Undo). Close and remove: Plan slice 6. Assistant: ai-core `add_card`, `card_figure` (0b8a49c); `change_card`, close: slice 6 |
| K4 | Card and pay: the weekend rule cannot be changed (also "Setup answers", blocker 8) | NO QUEUE | changeOwed writes name, pay day, close day only (plan3_write.js:343-352); changeBill has no shift. The Plan does not name it |
| K5 | Loan: add in setup | NO QUEUE | Setup has no loan row (setup3.js). The Plan's loan row starts at Plan > Add a loan |
| K6 | Loan: "Still owed" cannot be changed | NO QUEUE | plOwedForm3 has Name, day, Usual payment only (plan3.js:335-342); changeOwed has no owed (plan3_write.js:343-352). The Plan lists `changeOwed` as EXISTS and adds nothing |
| K7 | Loan: remove BROKEN (blocker 5) | NO QUEUE (slice 6 may reach it) | See confirm 2. Plan slice 6 folds closeLoan into closeAccount and gives "Pay it off now" for a card. It does not say the same for a loan |
| K8 | Loan: assistant | QUEUED | Plan slice 6: `add_loan`, `close_loan`, `change_loan` |
| K9 | Pay: remove; assistant | QUEUED (assistant change FIXED in lane) | Plan slice 7 (`endPay`, `end_pay`). ai-core `change_bill`, `add_pay`, `landed` |
| K10 | Second income: add later; remove; blank setup row traps; assistant | Setup row FIXED in lane; assistant add FIXED in lane; rest QUEUED | setupfix 64eb561, 313ce7d. ai-core 1ea0af3, bde36f9 (`add_pay`). Screen door and end: Plan slice 7 |
| K11 | Bill: blank setup row blocks save; assistant | FIXED in lane | setupfix 64eb561, 313ce7d. ai-core 57df561, 55fdf26 (`add_bill`, `change_bill`, `end_bill`) |
| K12 | Bill, budget line, spend, refund, an assistant change: remove does not ask first (M6, blocker 6) | NO QUEUE for the screens; FIXED in lane for the assistant | See confirm 4. ai-core 57df561, 8b04744: the assistant asks first for deletes. The Plan names the confirm only for the assistant's close and remove (slice 5) |
| K13 | Budget line: add in setup; goal: add in setup | NO QUEUE for the screens; FIXED in lane for the chat | Setup screens have no line or goal row. The setup chat can add them after the fill (ai-core `add_line`, `add_goal`). The Plan has no setup door for either |
| K14 | Budget line: assistant add and end | FIXED in lane | ai-core 57df561 (`add_line`, `end_line`) |
| K15 | Goal: remove; assistant | QUEUED (assistant add FIXED in lane) | Plan slice 9 (`removeGoal`, `remove_goal`, `change_goal`, `take_out`). ai-core `add_goal` |
| K16 | Spend, refund: assistant change and remove | Remove and refund FIXED in lane; change NO QUEUE | ai-core `remove` (S refs), `refund`. `change_spend` is MISSING in the Plan's table with no slice (as A15) |
| K17 | Money in (not pay): every cell NO (M22) | FIXED; words QUEUED | See confirm 9. 0764817 (wip-38.31). Assistant: ai-core `money_in` |
| K18 | Move between own accounts: BROKEN; assistant | Partly FIXED; rest QUEUED and NO QUEUE | See confirm 1. With two accounts it works (setup: 1278c6b). Adding one later: Plan slice 4. The empty To list itself: NO QUEUE. Assistant: ai-core `move_money` |
| K19 | Check of the bank: assistant | FIXED in lane | ai-core 0b8a49c (`bank_figure`, `card_figure`, `landed`). Changing or removing a past check: Plan slice 10 |
| K20 | Lowest the bank should go: add later, change, remove, assistant (M42) | QUEUED | Plan slice 3 (`setKeep`, `set_keep`). Same as C12 |
| K21 | Currency: change; assistant | QUEUED | Plan slice 12 (Start again; no relabel, on purpose). No assistant step, on purpose |
| K22 | Country: NOT BUILT | Setup FIXED; change QUEUED | 1278c6b (setup3.js:43). Plan slice 12 (`setCountry`) |
| K23 | Reminder: no Undo; not kept across a reload (BROKEN, blocker 7) | NO QUEUE | See confirm 3. The Plan has no reminder row |
| K24 | Reminder, backup file, cloud copy: assistant | QUEUED | RESUME section 0, queue after the candidate: A17 |
| K25 | Setup answers: change (bank name, keep at least, currency); no start over; assistant | QUEUED; assistant FIXED in lane | Plan slices 4, 3, 12. Setup by chat: ai-panel f687ff6, c23321f. Weekend rules: K4 |

### Blockers, confusing, polish and the owner's lines

| # | Finding | Group | Where, checked in code |
|---|---|---|---|
| K26 | Blocker 1: blank row trap in setup; "Type how much Pay is" for a second income | FIXED in lane; name FIXED | setupfix 64eb561, 313ce7d. Name: 1278c6b (setup3.js:186 says "Second income") |
| K27 | Blocker 2: setup Back loses everything | FIXED in lane (saved sections) | setupfix 88d541b. Rest as C1 |
| K28 | Blockers 3, 4, 8, 9 | As K1, K3, K9, K10, K15, K20, K25 | Blocker 9: ai-core has 20 steps now (chat3_core.js:154 on 55fdf26) |
| K29 | Blocker 10 and M47: a bank below zero cannot be typed | NO QUEUE that is written down | checkin3.js:57 and setup3.js:153, 159 read through typed3, and screens/inputs.js:26 refuses a minus. Not in the Plan, not in RESUME. If lane/blockers has it, nothing is committed there yet |
| K30 | "Type amount as an amount", too big | QUEUED | plan3.js:182. RESUME section 0: the walker for every box and sheet (as N24) |
| K31 | "Left out ... (remove_bill)" | QUEUED | RESUME section 0, queue after the candidate: A12, A24, A25 |
| K32 | Setup accepts a zero bill that Plan refuses | NO QUEUE | See confirm 6 |
| K33 | Home: "more than Free to spend left" | FIXED | 5979073 |
| K34 | Android back from any sheet leaves the app | NO QUEUE that is written down | No sheet writes a history entry: the only history call is replaceState (e3.js:46). None on ai-panel either |
| K35 | Sheets other than setup lose their typing on Back | NO QUEUE | plForm3's Back closes the form (plan3.js:211, 215) |
| K36 | "Save a backup file" has no "saved" words | Not found in code | settings3.js:125 writes "Saved <name>. Keep it somewhere safe" (e2c8186, already in the live build). It may sit out of view below the button |
| K37 | The Undo bar stays over later sheets | NO QUEUE | See confirm 8 |
| K38 | Console 404 on /api/vault before the first cloud copy | NO QUEUE | cloud3.js:63 fetches the vault id before one exists. Maybe the same 404 as S24 |
| K39 | For Mako: ended bills stay listed | QUEUED | For Mako's run (as S26) |
| K40 | M1, M2, M79 | FIXED in lane | As A1, A2, A3 |
| K41 | M14: setup has no Undo | FIXED in lane (sections); last step QUEUED | setupfix 88d541b. "See my money" through E3.fill: Plan slice 12 |
| K42 | M23: one bank only, no cash or e-wallet | Mostly FIXED; pay-later QUEUED | 1278c6b. STAGE2_PLAN 2.3 (as S11) |
| K43 | M24: no choice of where unspent money goes | QUEUED | RESUME section 0, "Coordinator agreed (12:20 JST)": M24 and M46, after controls slice 1 |
| K44 | Not checked by the reviewer: imported statement, desktop and 320 width, "Change the next one only", Home "Add a card" | NO QUEUE as a QC gap | Remove an import: Plan slice 11 |

### Rows CONTROLS_PLAN.md does not cover

Each NO and BROKEN row was checked against the Plan (wip-38.31, and the BZ corrections on lane/controls-base d034090, which add nothing to this list).

1. **K4** the weekend rule of a card or a pay cannot be changed after it is made.
2. **K5** no loan in setup.
3. **K6** a loan's "Still owed" cannot be changed.
4. **K7** a loan cannot be closed. The Plan calls closeLoan EXISTS. Slice 6 names "Pay it off now" for cards only.
5. **K12** the screens' End this bill, End this line and Receipts Remove do not ask first. The Plan gives the confirm to the assistant only.
6. **K13** no budget line or goal in the setup screens.
7. **K16** `change_spend`: in the Plan's table as MISSING, in no slice.
8. **K18** "Moved" is offered with one account and an empty To list. Slice 4 lets a second account be added, but nothing hides the door or points to it.
9. **K23** reminders: no row in the Plan at all (not kept, no Undo). K24 covers only the assistant side, in RESUME, not in the Plan.
10. **K29** a bank below zero cannot be typed.
11. **K32** a zero bill in setup.
12. **K34, K35, K37** Android back, typing lost on Back, the Undo bar over later sheets. These are sheet faults, outside the Plan's scope.

### Confirmed on wip-38.31 (4e9e40d), with file and line

1. **"Moved" with one account: CONFIRMED.** receipts3.js:120 builds the To list as every own account except the From one, so with one account it is empty (receipts3.js:122). Save then fails with "Pick the account the money went to" (act3.js:58, 177-180). Run in node on the made-up book: the same words. Nothing on wip-38.31 adds an account after setup.
2. **A loan can never be closed: CONFIRMED in part.** closeLoan refuses while anything is owed: "still owes money. Tick its last payment at Check your bank first" (plan3_write.js:310). Check your bank has boxes for banks and cards only, none for a loan (checkin3.js:20, 28). "Still owed" is not in the loan's form or in changeOwed (plan3.js:335-342, plan3_write.js:343-352). One part of the report is not right: a loan payment does show in the Check your bank list once its day has come (engine/lookahead.js:752, 1376; run in node: a loan of 50,000 added 25 Nov shows its 10,000 on 21 Dec). So a loan closes only after every payment has been ticked, month by month. A loan paid off early, or typed wrong, can never be closed or corrected.
3. **Reminders not kept, no Undo: CONFIRMED, and written that way on purpose.** remind3_page.js:5 says "nothing is saved: the choices start fresh each time". The choices live in a variable (remind3_page.js:8) and each change only redraws (remind3_page.js:47-51). No ACT3 step, so no Undo bar.
4. **End this bill, End this line, Receipts Remove act at once: CONFIRMED.** plan3.js:281 and plan3.js:242 are plain buttons, and the one click handler runs the step straight away (plan3.js:188-192). Receipts: rcRemove3 calls ACT3.remove with no question (receipts3.js:242-245). Each shows an Undo bar after. Nothing says what is lost.
6. **Setup accepts a zero bill: CONFIRMED.** Setup reads the bill amount with `need`, which takes 0 (setup3.js:153, 216), and build_book only checks it is a whole number (engine/build_book.js:46, 152). A pay of 0 is refused there (setup3.js:194), a bill is not. Plan refuses: "Type the amount above zero" (plan3_write.js:28, 100). lane/setupfix has the same gap (setup3.js:240, 303 there).
8. **The Undo bar stays over later sheets: CONFIRMED.** The bar is the message band #a3Msg (shell.html:7). An Undo message lives 8 seconds (screens/messages.js:20). No sheet hides or clears it when it opens: Settings (settings3.js:59), Reminders (remind3_page.js:45), Ask (ask3.js:35) and the Plan forms (plan3.js:159) leave #a3Msg alone, and no code calls the queue's dismiss.
9. **"Money came in" that is not pay (M22): BUILT on wip-38.31, under another name.** Receipts has a fourth choice "Money in" (receipts3.js:133, heading "Log money that came in, like a client payment or a gift" at 134), written by ACT3.moneyIn (act3.js:171), from 0764817. The words are still "Spend" and "Money in", not "Money went out" and "Money came in". lane/install has no commit for this. Its worktree (agent-a90fe3b2e758fbd01) holds uncommitted work that makes two main doors "Money went out" and "Money came in" with Refund and Moved smaller under them (receipts3.js:133-135 there, app3.css, a new tests/e3_doors.js). It keeps the same four modes, so confirm 1 (the empty To list) is not changed by it.

Items 5 and 7 were skipped: they are with lane/blockers.

### Smallest fix for each new "no queue" item

- **K4**: add the weekend rule to the card form and the pay form (changeOwed, changeBill take `shift`). plan3.js:335, plan3_write.js:343. Add the row to the Plan's table.
- **K5, K13**: a Plan decision, not code yet: either setup rows for a loan, a line and a goal, or the Plan's table says "after setup only" for them.
- **K6, K7**: a "Still owed today" box in the loan's form, written as a check on the loan (as a card figure is), and "Pay it off now" for a loan in slice 6. plan3.js:335, plan3_write.js:305, 343.
- **K12**: one question before End and Remove on the screens, saying what is lost, through plForm3's existing ask slot (#plAsk, plan3.js:173) and Receipts' ask (#rcAsk). Not settled 1 in MAKO_SAYS decides how far.
- **K16**: put `change_spend` in a slice (8 fits).
- **K18**: with one own account, hide "Moved" or show "Add another account first" with the door from slice 4. receipts3.js:119-123.
- **K23**: keep the choices on the device (not in the book) and put them back on open, or say on the sheet "these choices are not kept". remind3_page.js:8. Add a reminder row to the Plan's table.
- **K29**: let the bank figure take a minus at Check your bank and setup. checkin3.js:57, setup3.js:159, screens/inputs.js:26. Needs qc-numbers.
- **K32**: refuse a bill of 0 in setup with Plan's words. setup3.js:216 (and 303 on setupfix).
- **K34**: each sheet pushes one history entry and closes on back. start3.js and each sheet's open.
- **K35**: keep a Plan form's typing until Save or a second Back. plan3.js:211.
- **K37**: clear the Undo message when a sheet or another form opens. A `clear('act3')` on the queue (screens/messages.js) called from each sheet's open.
- **K38**: do not fetch the vault before a cloud copy exists. cloud3.js:63.
