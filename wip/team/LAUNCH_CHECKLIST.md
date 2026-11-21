# The Burrow: launch checklist

Mako, 2026-11-19: "I want to make sure all of these problems are addressed before we launch it... so it covers like 95% of the people and their situations."
Every point the reviews found is here, with the step that fixes it. Nothing is crossed off without a test or Mako's own check. Add new points the same day they are found.

## The three gates
- **v1, for Mako alone** (at least a week with his own numbers): every point marked **v1** is done.
- **Team test** (Mako plus two teammates, four weeks from a pay day): every point marked **team** is done, and the 95% sweep below has run.
- **Wider launch:** every point is done, or Mako has moved it to later in writing.

**Gate changes (Mako, 2026-11-19, DECISIONS.md "Team test about the team"):** the team gate is set by Mako's and his two teammates' real shapes. Moved to wider launch: Japan and France presets (part of A2), D5, the full flows of H3, and the full 95% sweep (before the team test, only the teammates' own shapes are walked). Section E stays at the team gate.

**The team's shape (Mako, 2026-11-19, DECISIONS.md "The team's shape"):** no waiting for teammates' answers. Team gate assumes: the standard Philippine places for money (usual banks, GCash, Maya, cash, pay-later apps; A2 presets from a web search); monthly pay by default, with two incomes or pay in two parts supported (C4, A6); everyone has a card, so cards are core (A4 and A5 full); iPhone and Android both tested (E2, section F); clarity on day one is what keeps people.

Sources: SECURITY_REVIEW.md (branch side/security-review, 2026-11-19), the five concept reviews of 2026-11-19 (north star, new user, money and data, product, efficiency), the phone check (side D), the script checks (side A), the after-v1 tests (side C).

## A. The picture is true
| # | Point | Fix | Gate |
|---|---|---|---|
| A1 | v1 shows planned figures that read like real money ("Total ₱35,700, planned" after typing ₱3,000) | "What is in your bank right now": Home asks for the balance the bank app shows, shows it first, and labels every number "now" or "planned" | v1 |
| A2 | (Decided by Mako: several banks.) Money sits in several places (several banks, e-wallets, cash, cards, pay-later apps) but the plan knows one "bank" | Accounts in the ledger: every event names a place (what it is for) and an account (where it sits); check each account on its own; account presets for the Philippines, Japan and France (names only, no bank connection) | team |
| A3 | Money paid toward a "Pay off a debt" goal counted as savings in Saved and Total (bug) | Debt goals stay out of Saved and Total | v1 |
| A4 | What is owed is not in the picture | v1: one line "You owe X" when cards, loans or debt goals exist. Ledger: an owed side; spending on a card raises what is owed; paying the card moves money from the bank to the card: what is owed and the bank both go down, Free to spend and "bank after the cards" stay the same (corrected 2026-11-19 from the ledger tests: Total does go down when the card is paid, it stays the same when the card is used) | v1 line, team full |
| A5 | Card spending paid next month is not modelled. Mako pays almost everything by card, paid on the 10th and 11th | v1: type what is on each card now (like the bank figure), shown as owed with its pay date, plus "bank after the cards are paid". Team: card spending in the ledger raises what is owed; paying the card moves bank to card | v1 simple, team full |
| A6 | Safe to spend ignores timing: bills due before the next pay, pay in two halves; Mako's pay day is the 10th, not the 1st | Safe to spend until next pay day, with bills on their dates | team |
| A7 | When was the balance entered | "Balance you entered on 18 Nov" (decision 1) | v1 |
| A8 | Double counting: a bill drains on its date and its receipt is logged; a statement repeats check-ins | one event per bill (the receipt replaces the drain); import review flags "already logged" | team |
| A9 | Currency: a switch relabels amounts; money in two currencies (USD via Wise or Payoneer) | team: lock the currency once real data exists; later (Mako decides): each account has its own currency | team lock, later rest |
| A10 | Percents add to 81% in a month where spending past plan used pay (side A) | that row gets its percent | v1 |
| A11 | On Plan, Month, "Bills and basics" shows two amounts: the list of places includes card and loan payments, Money out does not (side H, tests/qc/label_agree.js) | one figure, or two different names | v1: DONE, two names (the Money out row is "Monthly bills"; tests/qc/label_agree.js in check.sh full) |

## B. People come back
| # | Point | Fix | Gate |
|---|---|---|---|
| B1 | The weekly check-in is in step C | a 60-second weekly check-in: what did you spend, what does the bank say | team |
| B2 | No nudge | the weekly calendar reminder at the end of setup; Mako's "pay sent, open the Burrow" message to the team | team |
| B3 | A missed week or month makes catching up feel like homework | "Start fresh from today": type today's balances, past gaps are not failures | team |
| B4 | Pay day is not an event yet | the pay day ritual (step B2) | team |
| B5 | Nothing new after three months | the streak back where it is seen; goals reached celebrated; then the art step | later |

## C. Real life (one simple door for many situations)
One "Money came in" and one "Money went out", each with a short list of kinds and a line saying what each is for. The kind decides what it does to the numbers.
| # | Situation | Kind | Gate |
|---|---|---|---|
| C1 | Sending money to family (most of the team, monthly and surprise asks) | out: "Family support" (its own line in Bills and basics, not Giving) | team |
| C2 | Freelance pay that changes each month, or a zero month | pay day asks "how much landed?" and the month is planned from that | team |
| C3 | Late pay | pay day on the day it lands; bills before it shown as waiting | team |
| C4 | Pay in two halves (15th and 30th) | two pay days, each placing its half | team |
| C5 | Borrowed from family, pay-later apps (SPayLater, GGives, BillEase; Japan and France equivalents) | in: "Borrowed" creates an amount owed (A4) | team |
| C6 | Shared costs, paying for a friend and being paid back | in: "Paid back"; out: "Lent" | team |
| C7 | Refunds, gifts received, sold something | in: "Refund", "Gift", "Other money in" | team |

## D. Setup
| # | Point | Fix | Gate |
|---|---|---|---|
| D1 | Yen is first for a peso user | the team link opens in pesos (a link setting); currency asked plainly | team |
| D2 | Sample numbers before anything is typed ("¥130,000 of the sample pay not placed") | no sample money in sentences during setup | v1 |
| D3 | Emergency fund step: "take it out of that number so it is not counted twice" | plain wording | v1 |
| D4 | First open order: video, statements or AI prompt, then only what statements cannot answer, then place the money (decision 8) not in the short setup | setup order | team |
| D5 | Philippine statements (GCash, BDO, BPI, often password-protected PDFs) | test the statement reader with them; ask for the password on the device only | team |
| D6 | Step counter "of 5" becomes "of 6" | step name and dots only (decision 7) | v1 |

## E. Nobody loses data
| # | Point | Fix | Gate |
|---|---|---|---|
| E1 | Cloud copy: "newer" decided by the device clock, "Keep mine" overwrites, the server keeps one previous copy | v1: a local snapshot before any restore or cloud load (Mako uses phone and desktop). Team: the server keeps dated versions (for example 7 daily); warn when a copy is older than the one in use | v1 snapshot, team rest |
| E2 | iPhone Safari can delete a site's data after 7 days unused unless it is on the home screen | ask to add to home screen; backup reminder | team |
| E3 | A lost or changed phone, recovery code never set up | setup ends by offering the cloud copy, in two taps | team |
| E4 | Two people on one browser share one plan | a warning; profiles later | later |
| E5 | Moving to the ledger | start from today's balance in each account; the old plan's figures shown once beside it; a frozen copy kept; a version number older pages refuse to overwrite | team |
| E6 | Months, items and imported rows outside the window are dropped on load and on import. Live today: an import drops every row dated before Nov 2026 (side J, tests/qc/e6_window.js on side/e6-window-test, 47 losses) | the window is a view only; nothing is trimmed. LANE_e6.md fixes 1 to 5 (no number changes) in v1, because Mako imports his statements; fixes 6 and 7 (goal date, loan end) after v1 | v1 fixes 1 to 5 DONE (tests/qc/e6_window.js in check.sh), team rest |
| E7 | Statements with names and account numbers go through the AI relay; the recovery code can delete everything | strip account numbers on the device before sending; deleted copies kept for a while on the server | team |
| E8 | The 3D world could run against a newer data shape | version check before it opens; it only calls ACT | later |
| E15 | The cloud copy does not explain itself (Mako: "I don't know how that even works. Do I paste it in a new browser? There's not enough steps") | step by step, one at a time: what it is, what the code is for, what to do here, what to do on another phone or browser to get the numbers back; the same for the backup file, restore and every data-loss message; walked by a novice agent who must move a plan from one browser to another using only the screen | v1: DONE on the screens (tests/qc/cloud_move.js: a plan moved between browser profiles through the screens only); the novice agent walk runs in the v1 QC round |
| E16 | On a return visit (setup done, page reopened, cloud copy off) Settings showed no Cloud copy box at all: the page only asked the server what it offers on the welcome screen or when Ask was opened (found by the screen pack run, MAIN 6, 2026-11-19) | the page asks on opening (one health call, nothing about the person sent) | v1: DONE (wip/team/tests/qc/cloud_return.js) |
| E14 | Only the first 5,000 receipts are kept on load, so the newest would go (side J) | no cap that drops data; the ledger is never trimmed | team |
| E9 | A failed cloud save is silent; Settings still says On (security review B3) | say the cloud copy is behind and since when; clear on the next success | v1: DONE (tests/qc/cloud_fail.js) |
| E10 | The service worker stores and replays cloud copy answers; an old copy can load over current numbers (S1) | never cache /api/; refuse a copy that is not newer unless asked | v1: client part DONE (tests/qc/cloud_fail.js); /api/ caching comes with side/phone-fixes |
| E11 | One delete erases both server copies; "Turn off" always deletes; the previous copy is replaced on every save and cannot be loaded (B1, B2) | server: daily previous copies, soft delete 30 days (vault lane); client: "load an earlier copy", "stop on this device" | team |
| E12 | The relay could be open to strangers: invite word, spend ceiling, database binding (B4, S2, S6) | Mako checks the Cloudflare and Anthropic settings; the server counts wrong invites and limits new vaults | team (Mako's check: now) |
| E13 | Privacy lines say statements stay on the device, but whole statements go through the relay; no content policy; the downloaded-file copy talks to the old site (S7, S9, SECURITY_REVIEW.md) | honest privacy lines; content policy in the build; one live address | team |

## F. Phone (side D, measured)
| # | Point | Gate |
|---|---|---|
| F1 | Corner squirrel never plays on phones (squirrel.js:125); under Ask and Help on 38.28 | v1 |
| F2 | Page dots cover the squirrel at the burrow door on small screens | v1 |
| F3 | "A newer version is ready" pops after an update already applied | v1 |
| F4 | Tapping Add freezes 0.2 to 0.35 s on a slow phone | v1 |
| F5 | The Home forest keeps animating behind a burrow | v1 |
| F6 | Light theme contrast below 4.5:1 in six places; five controls under 44px (side A) | v1 |

## U. Usable without the art (Mako, 2026-11-19)
| # | Point | Fix | Gate |
|---|---|---|---|
| U1 | Every task in v1 can be done and understood through the UI alone | the novice walk of Home, setup, Receipts and Plan finds no place that depends on the art to make sense | v1 |
| U2 | Art never gets in the way: no picture, animation or decoration covers a control or number, slows the page, or distracts from reading the money | anything that does is toned down or hidden in v1 (a fix, not new art); checked at 390x844, 320 wide and desktop | v1 |

## G. Process
| # | Point | Gate |
|---|---|---|
| G1 | Papers disagree: one world or one per burrow; "Chest" for waiting pay in HANDOFF, PLAN and side C tests; "check your bank" in both B1 and C | v1 (docs) |
| G2 | Know whether it works: weekly opens without being chased, logging under 60 seconds, the gap between the app's bank figure and the real one, one decision changed, setup under 10 minutes, nothing lost | team |
| G3 | The 3D world: desktop only, the phone app stays as it is (Mako, 2026-11-19); the rest decided by Mako when the art step comes; usage data from the team test informs it | later |

## H. It holds your hand (Mako, 2026-11-19, NORTH_STAR.md "Why this exists")
| # | Point | Fix | Gate |
|---|---|---|---|
| H1 | Every screen obvious to someone who never learned about money | a fresh novice agent walks every screen and lists each place it would give up; each becomes a fix | v1 for Home and setup, team for the rest |
| H7 | The copy sounds like AI ("slop"); Mako would stop using the app over it | the voice checker agent (VOICE.md, qc-voice) checks all copy: not like AI, and like Mako, with little punctuation; rewrites applied screen by screen | v1 for the screens v1 shows, team for the rest |
| H8 | Help is not reachable in setup, inside a burrow or in the world view. In setup the tour makes Help inert on purpose and traps focus, and Ask could change numbers mid-setup, so it is not a small fix (MAIN 6, 2026-11-19) | a Help way in that is safe in each of the three; said plainly in the v1 preview note | team |
| H2 | Anything not obvious explains itself on the spot | a "?" beside it: the mindset first (why it matters, how to think about it), then the function (what to tap). Written words now | team |
| H3 | One thing at a time | setup, pay day, the weekly check-in and "check your bank" as one-question-per-screen flows (Typeform style) | team |
| H4 | "I upload my stuff and it does it all for me" | statements (or the any-AI prompt) are the front door of setup; typing is the fallback | team |
| H5 | Short videos by Mako on the mindset | Mako records them; the "?" panels show the written version until then; captions and transcript with each | later (Mako records) |
| H6 | The app is for life | the rolling month window, so the app never stops at a date (now E6, before the ledger) | team |

## Q. Found by the v1 QC run (MAIN 8, 2026-11-19, candidate 11c1e7e)
One round: qc-numbers PASS, E15 two-browser move DONE, bank comparison PASS, qc-north-star FAIL (4 blockers), qc-voice FAIL (copy). Fixed the same day in a209449: Backup and Restore steps, cloud date order, setup offer button names, iPhone note. Open:

| # | Point | State | When |
|---|---|---|---|
| Q1 | Home never shows the "They add up" line, only the bank plus burrows sum | waits for Mako's full run on the finished build (DECISIONS 2026-11-20 05:50) | v1 |
| Q2 | After Check your bank and a card, the top of Home and the lower "Bank at month end" and Plan "Bank stays at" show different bank figures with nothing tying them | done afd2464 (Plan names the start figure, Home note names start and now; wip/team/tests/qc/qc10_bank_story.js); Mako sees the after shot | v1 |
| Q3 | Plan after a borrow: rows read 117% plus Borrowed 17%, the sentence says "add up to 117%", two rows both named "Borrowed" (maths correct, reading is not) | done 1b151c0 (three named borrow rows, tests/qc/qc9_plan_borrow.js; $220 vs $200 is borrow needed vs part paying the plan, not a mismatch); Mako sees the after shot | v1 |
| Q4 | Home first screen at 412x915 is text and numbers, the picture starts below the fold | waits for Mako's full run on the finished build (DECISIONS 2026-11-20 05:50) | v1 |
| Q5 | Check your bank field opens pre-filled and typing appends (1,200 then 1150 gave 12,001,150) | done 0b51e66: the field opens empty, tests/qc/qc8_bank_field.js | v1 |
| Q6 | Pay day: no field anywhere, the month always runs 1st to last, so days left and weekly figures are wrong for someone paid on the 10th | open, feature gap; design with options in wip/team/PAYDAY_DESIGN.md on side/payday-design, waits for Mako | team |
| Q7 | After Load on a second phone the "Cloud copy loaded" message runs off the right edge, shows no Undo, stays across tabs; the typed code is cut off in its box | done a243bb4 (fits 412px, Undo shown, hides on tab change, full code shows; wip/team/tests/qc/qc10_cloud_loaded.js) | v1 |
| Q8 | Setup split moves only in whole percents (40,400 not 40,000); the first goal is fixed as Emergency fund | open | team |
| Q9 | The receipts list sits under a big Scan receipts explainer | open | team |
| Q10 | qc-numbers should-fix (7): Home status line follows the month picked on Plan and survives reload; "Keep saving" on a longer emergency goal changes months already over; a borrow stays after the plan stops needing it; month-end "Put it toward the goal" preselects the goal with least room and shows no amount; the rest in the QC report | SF2, SF1, SF3 done 8787fdf (tests/qc/qc9_home_status.js); SF4 done d3d86e5 (qc10_paste_confirm.js); SF5 done 38b5d81 (qc10_stretch_from.js); SF6 done edb78d1 (qc10_borrow_fit.js); check.sh full ALL GOOD on d3d86e5; rest open | v1 for the first, team for the rest |
| Q11 | Voice: the remaining lines of the 46 flagged, with rewrites, in wip/team/COPY_QC8_FOR_MAKO.md | waits for Mako's copy pass | v1 |
| Q12 | Process: QC subagents could not write report files for three roles, reports came back in chat only | done 7f3d333 (agents told to write to /tmp/qc/<role>/REPORT.md) | process |
| Q13 | QC10 fix round on edb78d1: qc-numbers 3 blockers, qc-north-star 6 findings (worst: Undo after a cloud load on an empty phone overwrote the cloud copy with sample numbers) | all 9 fixed test first, ba8690e to e82a9a0; details and what stays open in wip/team/QC10_FIX_ROUND.md; round 2 on 94e5be5 (both FAIL): numbers B1 dbde166, B2 22bf5f6, S3 6de01cf, S6 5fc2617, north-star 1 2a138e7, 3 b692827 + 44e35f9, 5 834b778; check.sh full on 834b778: one real fail (typed balance counted as empty phone) fixed 53bb8cb, two timing lines pass alone; round 3 on 53bb8cb (both FAIL) fixed b7c4719, 50ca3a8, 9a33833, 9a0d2fc, the rest listed for Mako's run in QC10_FIX_ROUND.md; queue 1 to 3 done de0de9c, fa1475a, welcome-screen load message (check.sh fast ALL GOOD on fa1475a); 4 to 6 done 11a6638, c6a8159, 134cdf2; 7 to 10 done 764f36b, 077a508, 3e9de7c, 51e40de; 11 e36afd1, 13 0c99aba; 12 (borrowed row percent) for Mako's run; 14 not reproduced, guard test added; 16: oracle recounts receipts, piles and month-end (1d9ba84, 0 mismatches, planted bugs caught), found a real bug: goal balances summed as floats never reach full, test d3395f0, fixed dd17a99 (whole cents); check.sh full on ef85163 clean apart from one test updated for the month name; QC round 4 on dd17a99: all 9 reports in (6d5b735), all FAIL on design, wording and layout items, hard number gates pass (wip/team/qc_round4/), MAIN 11 fixing queue A to L; A (cloud copy conflict: sends carry the last revision, server answers 409, the app asks) done 876f3e4; B a753cdd, C f4f2355, D 06d3164, E 2a66dda, F 5988b85, G 75969af, H a8bb3f8, I b14fab9 (All months at 320 wide fits with 2px spare), J 942b20a, K 24f4ea7, L 69a9e13 (plan starts at the setup month; oracle 0 mismatches); queue A to L done. Then data safety 1 (Settings cloud load kept on reload) e0a5e00, page dots clear of BACK HOME 750b727, wording 2 9333e75, wording 1 (Ask guide) 0be9a0a, novice B1 saved now vs planned daa3e7d, data safety 3 Remove goal 7a8e2ff, help texts name real buttons 51e582a, Check your bank toast f9cb956, month-end question wording 1410230, amounts never split at 320 10133e2, "under 1% of pay" 4e60386, setup balance box after Back 9da4c66, Settings Put them back 07b2862, cards note on Plan 80ecf89, Free to spend cap one word 61e9d24, minimum balance one name bbebdb6, recovery code note 30537f3, messages take turns above the Undo bar 61c0b5c, Plan wording c6a9448, guard test a79aefa, Bills tick step 4de7746, keyboard focus clear of the Help shelf 6c2e8ce, 44px controls fbcf83e, Add a burrow says when pay is all placed c241192; MAIN 11 handoff 0810d28; MAIN 12 test fixes 5bddf6b, 83a514b; check.sh full ALL GOOD on 83a514b (12:47 JST 21 Nov); Free to spend capitals fixed; next stage_build and QC round 5. Art director list waits for Mako. For Mako's run: "1 year" = 13 payments vs "12 months". For Mako's run: goal amounts lose cents (decision 1 names plan boxes only). safe.js slow-database test fails on this machine from 313589c too (timing, not a regression). For Mako's run: with pay 0 the app stays in sample mode next to real bills | v1 |
| Q14 | The cloud conflict fix (876f3e4) changed the server code functions/api/vault/[id].js; it only works live after a deploy | do with Mako at the go, deploy the server function together with the page | v1 |
| Q15 | QC round 5 (wip/team/qc_round5/): PASS money accuracy, layout; FAIL numbers (safe to spend shown while the bank is below zero all month), north star, data safety (Undo of a cloud load after reload mixes numbers), novice, wording, regression, art (waits for Mako) | dots over Add money efccb62, status box not safe yet done, numbers B1 (a month ending below zero holds Free to spend back) 4e4945b, data safety B1 (Undo of cloud load after reload gives exact own numbers back, nothing sent) e1fa1d0; novice B1 was the tester's tool, not the app, wording B1 bad backup paste gives a clear message 7fed85c, novice B2 Free to spend sheet fits 320 to 412 0139417, spent-past-plan labels say what they cover 34fc2d1, Home names the bill line over plan c5b2682, recovery code note ba85c6d, bills share of pay wording 0cb673c, Balance now hint a520af2, safe.js flaky test made to wait 01a69bf (14 of 15 alone), Undo bar first after logging a spend 530826a, four full stops 0368090, straight apostrophes b7ca132, Restore file words 6b8c4e3, newer-cloud-copy note says what each button keeps 1764126; RESUME MAIN 12 progress 3 c0735e0; check.sh full ALL GOOD on 1764126 (no retries, 18:28 JST 21 Nov); QC round 6: 7 of 9 in (wip/team/qc_round6/); round 6 fixes in: cloud send-back after a welcome-screen load cf2e8c1, Home vines back 23edb7c (a regression, not new art), overdrawn start without a date not safe, 8 wording fixes; more helper fixes (Undo across tabs, Explain this tab walks every card, goal past its amount, Keep saving and Emergency fund say why, goal names wrap, Plan sticky line); bank comparison rerun COMPARE PASS 030f5eb; full run on 0929d24 found 3 fails, all resolved (idle CPU was helper load, passes alone; card form keeps clear of the Undo bar f58dd57; Home test knows over the goal); full run on d1d1264 resolved (tables_narrow test helper 6b29534, click_sweep 797 clicks 0 problems alone, screen sum moved to the model ce8c8db); staged ce8c8db VERIFY OK; QC round 7 running from 00:40 JST 22 Nov; For Mako's run: Home auto-scroll at 320 (not merged); MAIN 12 handoff entry ready 88e32a9 | v1 |
| Q16 | QC round 7 on ce8c8db (wip/team/qc_round7/), 8 of 9 in: PASS numbers, wording, layout, data safety, regression (on condition of a full check and artcheck on the final build); FAIL art (wisteria placement, for Mako), novice (Help words, fixed), money accuracy (a hidden burrow with money, and a debt shown as full: helper on it) | merged: 8 wording items, novice fixes, golden refresh (the oracle drew one extra random number), bills advice uses the real share, a minus sign never wraps away from its amount, contrast, 44px; all round 7 fixes merged 477b137 (hidden burrow with money shows on Home, debt reads paid off, cloud words, Explain step 1); north star still FAIL only on Check your bank vs plan start (waits for Mako, DECISIONS 2026-11-20 05:50); one list of everything waiting for Mako's run: wip/team/MAKO_RUN.md (39ef428); full check clean (two test-side fixes), artcheck PASS, golden refreshed, staged 7521da3 VERIFY OK with 0 screens different (first time since 19 Nov); QC round 8 running from about 02:50 JST 22 Nov | v1 |
| Q17 | QC round 8 on 7521da3 (wip/team/qc_round8/): fixes by helpers, merged by MAIN 13 | borrowed month reads Tight month and Home boxes show the currency sign 465a32b, d29e0d1; data-safety words (restore steps, Still not sent., this device, Ask table labels) b7fe9e9..f98147d; polish (Log spend gap, pills at 320, 6:00 PM and short months, cap line) 85759de..03644a0; numbers-r8 merged (ended month not logged yet, over without a minus, after-logging names every place over, cents kept per line; oracle 0); team_inter2 was a stale test 0068eaa; all 4 helper branches in; one quiet check.sh full on the merged build from about 04:40 JST; then one quiet check.sh full, artcheck, golden, stage, QC round 9. New for Mako's run in MAKO_RUN.md 1.19 to 1.21 | v1 |

## The 95% sweep (before the team test)
Fresh agents walk the app as real people, each with made-up numbers: a Philippine freelance editor paid per project who sends money home and uses GCash and two banks; a Philippine salaried editor paid on the 15th and 30th with a pay-later habit; a salaried person in Japan with a card paid next month; a student in France with a Revolut account and shared rent; someone who misses a month; someone whose phone is replaced. Every "how do I do this?" becomes a point here.

## Notes for Mako (preferences with no objective best answer)
Shipped with v1 as a short list to look at while using it, not as questions in advance:
- How owed money looks in the picture.
- The account presets for each country.
- The kinds in "Money came in" and "Money went out".
- Whether Wallet or Track is the default for Free to spend.
- The 13 design questions from side C (window, ledger, migration), each with the default that will be used.
