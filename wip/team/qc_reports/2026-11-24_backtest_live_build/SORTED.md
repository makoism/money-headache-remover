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
