# M coverage: is each "Mako says" line met? (24 Nov 2026, planning lane "controls")

One row per line in MAKO_SAYS.md sections A to D and F (M1 to M51, M61 to M69). Checked against the code, not memory: wip-38.31 at 259d69a, plus the open lanes lane/setupfix 0905731 (local only), lane/invite b9cc248, lane/ai-core ddbb3cb (local; origin is fb0023e), origin/lane/ai-panel 7a975fb, lane/restore 089d0be (local; origin is 5665c29), lane/s2b 87965d5. Main holds two server changes that are not in wip-38.31: the vault (4ab1f49) and the relay cap (6740469).

Key:
- **MET**: on wip-38.31, with the test or file named.
- **MET IN LANE**: on an open lane, not merged.
- **PARTLY**: some of it is there; the rest is said.
- **NOT MET**: not there.

For anything not met, the row says where it is queued: AI_FIRST_PLAN, STAGE2_PLAN, CONTROLS_PLAN, RESUME, or **NO QUEUE**. Tests are under wip/team/app3/tests unless a path is given. "check3" means app3/check3.sh.

## A. How he wants to use the app

| Line | State | Evidence, or where it is queued |
|---|---|---|
| M1 AI first, always on screen | MET IN LANE | ai-panel: src/chat3.js (bar and column on every screen), e3_chat. On wip-38.31 Ask is a small door (ask3.js). AI_FIRST_PLAN slice 2 puts the panel on every tab |
| M2 Setup is a chat | PARTLY, IN LANE | ai-panel e3_chatwalk: the setup chat fills the book (draft, fill, Undo). The file upload notice is in place (e3_chat), but reading uploads is AI_FIRST_PLAN slice 3 |
| M3 Full control of the numbers | PARTLY, IN LANE | ai-core chat3_core `change` has 17 named steps (chat3_core.test). Missing steps are listed in CONTROLS_PLAN section 1 and slices 3 to 14 |
| M4 Day to day by talking | PARTLY, IN LANE | ai-core: log_spend, refund, money_in, move_money by chat. Receipts by photo is AI_FIRST_PLAN slice 5. Day-to-day tools on every tab are slice 2 |
| M5 Screens for seeing and checking | MET | Home, Plan, Receipts (e3_home, e3_plan, e3_receipts). The screens still carry every form, which is fine under "Not settled 2" |
| M6 Change, show, one-tap Undo; confirm only for deletes and big changes | MET IN LANE | ai-core chat3_core: change cards with Undo, `del` and over-safe-to-spend ask first (chat3_core.test, 8b04744 F2); ai-panel e3_chat. Screens: act3 Undo bar (e3_act_unit) |
| M7 See where all the money is and what is safe to spend | MET | Home (e3_home, e3_bankparts, e3_names); engine proof (engine/ledger.js `proof`) |
| M8 Built for him first; replaces his spreadsheet | PARTLY | His shape walked end to end (e3_walk, engine/test/mako_walk.test.js). Whether it replaces his spreadsheet is judged at his run |
| M9 Upload everything; setup asks only what statements cannot answer | NOT MET | Statements can be imported after setup (e3_stmt), but not used in setup. Queued: AI_FIRST_PLAN slice 3 (payslip and statements in the setup chat) |
| M10 V1: the picture, the four numbers, one next action, the rest hidden | PARTLY | Home shows one status and one next step (e3_home, screens/status.js). "Which four numbers" is "Not settled 5" with the coordinator |
| M11 Logs weekly; play money not tracked in detail | MET | Weekly check-in reminders (e3_remind); the gap found at a check-in counts as spending (e3_checkgap) |
| M12 Clarity or he stops using it | PARTLY | Served by M7, M36 and M51 (e3_names, e3_home); judged at his run |

## B. What a person must always be able to do

| Line | State | Evidence, or where it is queued |
|---|---|---|
| M13 Add, change, remove every kind, after setup too | NOT MET | Gaps listed in CONTROLS_PLAN section 1. Queued: CONTROLS_PLAN slices 1 to 14. Setup rows: lane/setupfix 64eb561 |
| M14 Undo everywhere | PARTLY | act3 Undo for every act3 step (e3_act_unit, e3_act_book). Setup sections: setupfix (e3_setupfix). Chat fill: ai-panel (e3_fillundo). Missing pieces: Undo after a reload (CONTROLS_PLAN F-A), the screen setup's last step, and import categories (F-C). Queued: CONTROLS_PLAN slices 2, 11 and 12 |
| M15 Remove a bill; an empty amount never traps | MET IN LANE | setupfix 64eb561 and 313ce7d (e3_setupfix). After setup: End this bill (e3_plan) |
| M16 Each setup section saves on its own, with "saved" | MET IN LANE | setupfix 88d541b (e3_setupfix, tests/setup_sections.js) |
| M17 Ask anything, any time | MET IN LANE | ai-core `explain` tool and guide (chat3_core.test); ai-panel e3_chat |
| M18 A question mark wherever needed | MET | screens/help.js; e3_ns ("the help marks") |
| M19 Save and get it back on another device, every step explained | MET (steps in lane) | Backup file (e3_backup), cloud copy (e3_cloud, cloud3.test.js). Every restore listed and explained: lane/restore (e3_restore, restore3.test.js). The step words go to Mako's copy pass (FOR_MAKO) |
| M20 Both devices changed one item: asks which to keep, the other kept for Undo | MET | cloud3_page.js "choose which to keep" (e3_cloud); engine/test/sync.test.js |
| M21 iPhone or Android, same build | PARTLY | One web page for both. check3 runs Chromium only, with no Safari (WebKit) run. **NO QUEUE** for a WebKit check |
| M22 One simple door: "Money came in", "Money went out" | PARTLY | Receipts has Spend, Refund, Money in and Moved (e3_moneyin); Home says "Log a spend". The two words are not used. **NO QUEUE** (with AI first, the chat may be this door; a question for the coordinator) |
| M23 Several banks and accounts, with cards, e-wallets, cash, pay-later | PARTLY | Setup: several banks, cash, e-wallet, cards (e3_setup6, e3_life_b). After setup: CONTROLS_PLAN. Pay-later is in the engine only, with no setup or Plan door. Queued: STAGE2_PLAN 2.3 |
| M24 Choose where unspent planned money goes, or "Decide later" | NOT MET | The engine reads period-end answers (`periodEnd`, `pe:`, lookahead.js), but no screen and no assistant step writes one. WIRING_PLAN slice 2 named it (A7) and it was never built. **NO QUEUE** |
| M25 Everything in the normal app, never only in 3D | MET | There is no 3D yet; every action is on the screens |

## C. His own money shape

| Line | State | Evidence, or where it is queued |
|---|---|---|
| M26 One main bank | MET | home.main (engine/build_book.js); e3_walk |
| M27 Two cards, paid in full on the 10th and 11th | MET | e3_walk (Card A on day 10, Card B on day 11), engine/test/mako_madeup.js |
| M28 Two incomes on the 10th, entered as one number | PARTLY | One pay with one amount works (e3_setup). The walk and mako_madeup enter two incomes on the 10th; no test enters them as one number. **NO QUEUE** for that test (small: add to e3_walk or answers3.test) |
| M29 Pay arrives after tax | MET IN LANE | setupfix cd1dc64 (e3_setupfix); ai-core answers3 `afterTax` (answers3.test) |
| M30 Spending on cards, so the bank alone is not the truth | MET | Bank after the cards (e3_bankparts, e3_cardline, e3_home) |
| M31 His month follows his pay day | MET | e3_period, e3_payday, engine/test/periods.test.js |
| M32 He does not know his close days | MET | "Not sure" in setup and Plan (e3_setup, e3_plan) |
| M33 Android, Chrome, installed to the home screen | NOT MET | app3 has no web app manifest (none in app3/, index.html or publish3.sh), so Chrome cannot install it as an app; it works offline in the browser (offline.js, e3_sw). **NO QUEUE** |
| M34 Yen is the default | MET | setup3.js `s3Cur` has Yen selected; e3_setup |
| M35 No old data, he types his own | MET | Starts empty (e3_first); the move is not wired (R2 BE) |

## D. What the numbers must mean

| Line | State | Evidence, or where it is queued |
|---|---|---|
| M36 Adds up to the accounts and says how fresh | MET | Home "checked today / N days ago" (home3.js; e3_home, e3_checkin); engine `proof` |
| M37 The bank figure is the bank today | MET | e3_walk, e3_checkin, e3_reload |
| M38 Periods pay to pay; Home shows the dates | MET | e3_period, e3_payday |
| M39 Pay is what lands; asks before or after tax | MET IN LANE | setupfix (e3_setupfix); ai-core chat3_core guide: afterTax needed (chat3_core.test) |
| M40 Cards: on it now, when paid, the bank after | MET | e3_cardline, e3_cardfig, e3_bankparts |
| M41 Close day asked plainly, with "not sure" | MET | e3_setup, e3_plan |
| M42 Minimum asked once, box empty, never set for him | MET | setup3.js `s3Min` optional and blank (e3_setup). Changing it later is CONTROLS_PLAN slice 3 |
| M43 Goal money in the bank or its own account | MET | plan3_write addGoal `mode` (plan3_write.test, e3_plan) |
| M44 One dataset from real transaction dates | MET | engine/test/run_all.js, reload_order.test.js |
| M45 No coin counted twice | MET | e3_stmt_once, engine/test/match.test.js, count_once.test.js |
| M46 Unspent planned money never drops out silently | NOT MET | The same gap as M24: no period-end question is asked. **NO QUEUE** |
| M47 Below zero: plain amber line, never red | MET | e3_warnwords; app3.css `.a3-warn` and `.a3-late` use `--warn` |
| M48 Cents where the currency has them; yen whole | MET | screens/money.js (screens/test/run_all.sh); BL4 one cents rule per screen (money3.js `screen3`); e3_amounts |
| M49 Percents add to 100; a goal never full early | MET | app3 shows no percents; goals show the exact amount of the target (home3.js goals, e3_homeplan) |
| M50 The first pay or bill entry becomes the usual amount | MET | Schedules keep `steps` from setup; a change is a new step (plan3_write.test, e3_paychange) |
| M51 One meaning per word | MET | e3_names, screens/names.js |

## F. Data safety and privacy

| Line | State | Evidence, or where it is queued |
|---|---|---|
| M61 Nobody loses data | MET | Nothing deleted, only `gone` marks (act3, e3_act_book); kept copies before a replace (e3_backup); store tests (store/test/run.js). Restores that stick with the cloud: lane/restore (e3_restore) |
| M62 No real figures in the repo | PARTLY | A rule in CLAUDE.md; tests use made-up shapes (engine/test/mako_madeup.js). No check scans for it. **NO QUEUE** for an automated check |
| M63 The AI key lives only in the site's secret | MET | functions/api/ai.js reads `env.ANTHROPIC_API_KEY`; tests/relay.test.js. The page never holds a key (ask3, chat3 go through the relay) |
| M64 Nothing deploys or goes to main without his yes | MET (process) | CLAUDE.md and NF10; publish3.sh only writes public/<path>/ (e3_publish) |
| M65 Private unlisted address; old app unchanged | MET | e3_publish; live on main as ba79e69 |
| M66 Cloud server: refuse unsafe writes, versions, delete marks, daily limit | MET | tests/vault_server/vault_server.test.mjs and fake_parity.test.mjs in check3; live on main (4ab1f49) |
| M67 Money that happened always joins up across devices | MET | cloud3.test.js, engine/test/sync.test.js, e3_cloud |
| M68 Relay daily call cap per household | MET ON MAIN | main 6740469 (invite word as an HMAC, 400 a day). wip-38.31's functions/api/ai.js still has the older per-browser cap; merge main into wip-38.31 before anything else under functions/ changes |
| M69 Safety and data integrity first | MET | The same evidence as M61, M66 and M67 |

## Lines in no queue

M21 (a WebKit run), M22 (the two doors' words), M24 and M46 (the period-end question: where unspent planned money goes), M28 (a test that enters both incomes as one number), M33 (installable to the home screen: no manifest), M62 (an automated check for real figures).

The biggest is **M24 with M46**: a decided rule (A7, Mako decision 3) with engine support and no door, last named in WIRING_PLAN slice 2. **M33** is his own phone setup (Android, Chrome, installed).
