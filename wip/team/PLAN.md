# The Burrow: the plan (written 2026-11-18, on branch wip-38.31)

> **Read this first (2026-11-19).** Some words and ideas below were changed later by Mako; DECISIONS.md wins wherever they differ:
> - **"Chest"** now means only the Free to spend treasure chest picture. The place where new pay waits on pay day has no name yet (it gets one in step B2). Read "the Chest" below as "the waiting place".
> - **The proof:** Total = waiting place + This month + Burrows. Free to spend is inside This month and never counted twice (tests/qc/proof_formula.js).
> - **Burrows:** any place money piles up (goals, Education, Giving, Investing); "goal" is the amount a burrow aims for.
> - **Worlds:** one small 3D world for everything (WORLD_3D.md), not one world per burrow; it is part of the art step, the very last layer, done with Mako.
> - **"Check your bank"** belongs to the ledger step (B1), with several accounts. The weekly check-in (step C) uses it.
> - **Launch:** everything still to do is in LAUNCH_CHECKLIST.md, with its gate.


Written after reading every .md file at the repo root and in wip/team, the commit history of wip-38.30 and wip-38.31, all of `model.js`, `check.sh`, the head of every file in `tests/qc`, and what Mako pasted into this chat (the handoff with the bird's-eye design, DECISIONS.md, and the old chat's QC panel). File names are given for every important claim. "Inferred" marks anything I worked out rather than read.

**Launch checklist (Mako, 2026-11-19):** every finding is in LAUNCH_CHECKLIST.md with its gate (v1 for Mako alone, team test, wider launch). A step is not done until its checklist points are.

**Version one (Mako, 2026-11-18, standing):** v1 is the picture, the four numbers and one next action, with everything else hidden until needed. Mako tests it with his own numbers. No new art, music or video work until v1 is working. Added as step 7b below.

**Process change (Mako, 2026-11-18, DECISIONS.md "Process change"):** v1 = 38.31 shipped, then Mako uses it with his real numbers while step B is built. verify.sh after every commit; the two gates on release candidates only; the panel when screens or wording changed, and once before v1; agents get screenshots and extracted screen text. Steps 1 and 2 are time-boxed: keep tests that protect numbers, data safety and the real-numbers scenario, retire the rest with a written reason, never to hide a failure. Step B splits into B1 (ledger, check your bank; ships alone first) and B2 (Chest, pay day ritual). No new art, music or video until v1 is in use, so step D waits. A fresh session per step, with a short handoff in RESUME.md.

**Updated after Mako's "go" (2026-11-18):** his six decisions and plan fixes are recorded in DECISIONS.md ("Decisions of 2026-11-18") and applied below. Conflicts 1, 2, 7, 8 and 9 in section F are closed by them.

---

## A. The purpose

### In my own words
The Burrow is a money app for people who have never saved. Mako builds it for himself (in Japan, in yen), then for his team (video editors in the Philippines on about 35,000 to 60,000 pesos a month), then friends and family. About ten people, all free (DECISIONS.md, HANDOFF.md section 1).

Its one job is to remove the fog. A person opens it and sees where every coin is, which piles are growing, what came in and went out, and what they can safely spend. They feel safe because nothing is unknown (NORTH_STAR.md).

**Success is not money or downloads.** It succeeds only if Mako's team and friends keep using it (DECISIONS.md, "What it is and who it is for"). So it has to be a place people want to come back to. It also has to be true, because one wrong number breaks the trust that makes them come back.

### The bird's-eye view: what a person sees, feels and does

The design (HANDOFF.md section 4) is one cutaway picture of a hill. Every coin is in exactly one of three states. Depth means how locked the money is.

```
                 ~ ~  the forest, the sky, the time of day  ~ ~
   ______________________________________________________________
  |  CHEST (waiting)   new pay lands here; empty except pay day   |   near the top:
  |      (o)(o)(o)  -> runs down the tunnels into the rooms       |   spent soon
  |---------------------------------------------------------------|
  |  THIS MONTH                                                   |
  |   [Bills and basics]  coins leave on their dates              |
  |   [Free to spend]     a real treasure chest                   |
  |---------------------------------------------------------------|
  |  BURROWS (resting, stays until the person decides)            |
  |   [Emergency fund] [Trip] [Home] [Education] [Giving]         |   deep:
  |   [Investing: never spent, only grows]                        |   safe or growing
  |_______________________________________________________________|

   EXAMPLE, made-up numbers:
   Total 250,000   Free to spend 18,000   Bills left 40,000   Saved 120,000
   Chest + This month + Burrows = Total   (Free to spend is inside This month; never counted twice)
   Matches your bank, checked 2 days ago.
```

The four numbers and the proof line sit under the picture, never instead of it (NORTH_STAR.md, "Visual first").

**From first open to weekly use** (HANDOFF.md section 4, "The rhythms"):

```
 FIRST OPEN (about 3 minutes)
   Mako's video  ->  statements, or the prompt for any AI  ->  only the questions statements cannot answer
   ->  place the money you already have  ->  "this is your burrow, filled"   (not a forecast table)
   (order set by Mako, 2026-11-18)

 PAY DAY (monthly or twice a month)
   enter what landed  ->  gold coins drop into the Chest  ->  they split into each room, counting up
   ->  Chest shows 0: "Every coin has a home"

 EVERY WEEK (60 seconds)
   "What did you spend?"  ->  coins leave the right room  ->  Free to spend updates

 WHEN NEEDED
   Take out: open a burrow, take money out for what it was for. Only that burrow changes.
   Check your bank: type the real balance. A difference shows as "1,200 unexplained: add a receipt or adjust".

 MONTH END
   unspent Free to spend is a question, never assumed:
   Count it in the bank / Put it toward a goal / Decide later
```

How it should feel: calm, cozy, safe. Rain outside, a lit door inside (ART_GUIDE.md section 1). No red shame: amber for attention, words like a manual (HANDOFF.md section 4, rule 6).

**Important:** much of this picture is the destination, not today. Today there is no Chest, no ledger and no "check your bank". See section C.

---

## B. Mako's rules

Grouped. Each rule names its source. "Inferred" marks the ones I worked out.

### 1. Purpose and judgment
- The north star decides everything: see at a glance where all the money is, where it stocks up, what flows in and out, what is safe to spend. Check every instruction and feature against it, and push back when something does not serve it (NORTH_STAR.md; DECISIONS.md).
- The picture must tie to reality and say how fresh it is (NORTH_STAR.md, "How to use it").
- Lens for every feature: what is the priority from the user's side, and does this serve it? If not, it can go (DECISIONS.md, 2026-11-12).
- Success means people keep using it. Mako wants pushback on anything that does not serve that (DECISIONS.md).
- Never build: bank auto-sync, thirty categories, net-worth charts, red alarms, points (HANDOFF.md section 5).

### 2. Accuracy and data
- Priority 1: accuracy and stability like a spreadsheet. Nobody loses data (DECISIONS.md "Priorities"; RESUME.md section 7; QC_ROLES.md).
- Every number comes from one dataset. What a person types is stored. Everything else is worked out fresh, and nothing worked out is saved (RESUME.md section 3; DECISIONS.md "The numbers").
- Screens never do money maths. The count of places that do may only go down; the goal is 0 (RESUME.md section 3; `tests/qc/display_math.max`).
- An independent second calculation (the oracle) must agree with the app: `mismatches 0` (RESUME.md section 3).
- The proof: where the money sits must equal where it came from, to the cent. If not, Home says so (RESUME.md section 3; `model.js` `proofOf`).
- Work from the actual data: transaction dates in statements, never file names or what someone says about the files (DECISIONS.md, 2026-11-12).
- Unspent planned money never silently drops out. It is a question (DECISIONS.md; HANDOFF.md "Decisions by Mako").
- One percent rule (rounded down) everywhere. Free to spend never shows next to "Short". Spending past a plan comes out of the bank and stays out. One bank figure everywhere. Sample and real data never mix (HANDOFF.md section 7, "Number rules learned so far").
- Test with real numbers, not only the sample (QC_ROLES.md, Money accuracy; HANDOFF.md section 9).
- Saved data only gains fields. The storage key and the shape of the saved copy are a contract (ARCHITECTURE.md, "Contracts").

### 3. Seeing and wording
- Visual first, a hard rule: if a picture is clearer, it wins even when it costs more. A kid should understand the screen. Numbers sit under a picture. Point out when something could be a picture (NORTH_STAR.md; DECISIONS.md).
- Minimal wording, like a manual. Never "too AI", never a fake friend. Personal in formatting, not in wording (DECISIONS.md; HANDOFF.md section 2).
- No em dashes anywhere: app, code comments, reports (DECISIONS.md; HANDOFF.md; QC_ROLES.md Wording editor).
- The final words: Chest, This month, Burrows, Free to spend, Pay day, Take out, Check your bank, Proof line, Bills and basics, Investing. Retired: jar, bucket, Necessities, Financial Freedom, "play money", "income", "allocation", "unassigned" (say "not placed yet"). Debt reads paid off / still owed (HANDOFF.md section 3).

### 4. Look, art and sound
- Priorities 3 and 4 (updated 2026-11-18, the old lines are marked superseded): the look is green glass over a nature scene with a deep, lush feel, rounded, never square; sounds are nature themed, wind and water drops (DECISIONS.md).
- ART_GUIDE.md is the law. Rule 00: anything added must flow from what it is added to. World rule: nothing is laid over the art; it is painted in. One pixel size, palette only, no gradients or blur, no black outlines on living things. Run `artcheck.sh` (ART_GUIDE.md).
- The squirrel is Elthen's sprite only. Claude-drawn squirrels were rejected (DECISIONS.md; ART_GUIDE.md).
- Background: the 36.3 version with fairies and the three-layer waterfall, the whole app in darker green. Rejected: mushroom-menu world, cobblestone banner, rocks and water, the original 36.0 background (DECISIONS.md). (Inferred: the current scene is a later evolution of it, with a one-tier waterfall and pool since 38.23 to 38.27, per ARCHITECTURE.md. Mako approved those releases, so the later dates win.)
- The Free to spend picture must look like a real treasure chest (HANDOFF.md section 3; QC_ROLES.md, merged today).
- All music is baked in; anything that cannot play inside the app is removed (DECISIONS.md).
- The squirrel-and-coin moment plays only at significant moments, never spammy (DECISIONS.md).

### 5. Code
- Priority 5: efficient, snappy, lowest energy, quick to change (DECISIONS.md).
- Idle costs nothing; write the page only when something changed; animate only transform and opacity; no outside requests; tasks under 50 ms (ARCHITECTURE.md, "Rules for new code").

### 6. How the work is done
- Do not ask many small questions. Keep building. Never wait on him (DECISIONS.md; RESUME.md section 7; HANDOFF.md). He made one exception: this PLAN.md job, where I must wait for "go".
- Set a resume timer first on every big task, tell him in one line, and resume at the reset without waiting (DECISIONS.md; QC_ROLES.md "Process"; HANDOFF.md section 9).
- Send each tested version as it goes live, and the live link after every finished piece (DECISIONS.md; RESUME.md section 7).
- Be honest in reports (HANDOFF.md, top).
- Commit and push after every green `verify.sh`. Nothing a check needs may live only in /tmp. Browser tests run one at a time (RESUME.md section 2).
- Never rebuild while a check runs (QC_ROLES.md, Regression runner).
- When a test fails, decide: did the app change on purpose (update the test) or break (fix the app)? Never delete a test to get green (RESUME.md section 5; QC_ROLES.md).
- Every piece of Mako's feedback goes into the matching reviewer's "Learned from Mako" list the same day (QC_ROLES.md).
- The repo is public: no keys, no invite codes, ever (HANDOFF.md section 1; SETUP.md; QC_ROLES.md Data safety).
- Do not push to main except to deploy after section 6 of RESUME.md passes in full (your instruction in this chat).

### 7. Release gates
- Nothing ships until `./check.sh full` says ALL GOOD, both QC agents pass (fresh, in parallel, given only their brief and the build), and the seven-role panel has run (RESUME.md section 6).
- On any fail: fix or take it to Mako, then run new agents. Never reuse an agent that saw an earlier build (RESUME.md section 6).

---

## C. Where the app is today

### What exists and works (in 38.31, on this branch)
Checked in this session, not only read:
- The independent oracle agrees with the app on 1,500 random plans: `mismatches 0`. Today it also learned the overspend rule (commit e2da54d).
- `viewtest.js`, which reads the screens' numbers and the spreadsheet: 147,008 checks, 0 mismatches after the fixes today.
- Model fuzz, debts fuzz and the proof all pass. `verify.sh` ends `VERIFY OK` (this session).
- The reload test passes 30 of 30. The old failures were the test helper wiping the saved plan, not the app (commit b5aa77e). The same test against the 38.28 build: 30 of 30.

From the files (ARCHITECTURE.md sections 38.29 to 38.30; RESUME.md section 4):
- Step A of the design: Home starts with a picture. The pay split falls as coins, there is a strip showing where the money sits, four numbers, a proof line, and rooms for Bills and basics, Free to spend, Education, Giving and Investing, with coin piles sized to the amounts.
- Spending past the plan is real money: it comes out of the bank and stays out.
- The month-end question works (Count it in the bank / toward a goal / Decide later), stored as a marker so the plan is never rewritten.
- Months paid partly from the emergency fund add up, with a "Borrowed" row.
- Cards and loans, extra money, pay helper, limits, repeating spending, look back, statements reader, assistant with Undo, backups, encrypted cloud copy, burrow worlds (Rainy Day), squirrel, music.

### What is half built
- **Screen maths: 15 places left** (13 in the setup tour, one month-end move, one allowed). Also, the month-end card and the model round the same amount differently, whole units against cents (RESUME.md section 5, item 4).
- **Stale tests** (RESUME.md section 5, item 1). Done today: `viewtest.js`, and the old-builds fixture is rebuilt from git history. Still to do: `team_inter2.js`, `team_month.js`, `v34/purpose_test.js`, `v25/monkey.js`, `v25/display.js`. Missing entirely: `team_map.js` and the `legacy_yen.json` fixture. `team_cur.js` looks for page parts (`#h-a`, `#ra-nec`) that are not in the current page, so the test itself is probably out of date (inferred from a search of the built page).
- **Mako's real-numbers check cannot run.** `tests/qc/good1.js` needs `joyfull2.js` and `mako_scenario.js` needs `build.js`; neither file is in the repo. QC_ROLES.md says to run both before any Home change.
- **The oracle still does not recount** piles, month-end answers or receipts beyond the overspend rule. The proof covers them by conservation (RESUME.md section 5, item 9).
- **Open findings from the last gate round** (HANDOFF.md section 6). North star: B2, and S1 to S6. Numbers: typed cents rounded silently; a "0 counted" answer card; an overspent month showing "pay not placed" beside Left.
- **VERSION still says 38.30** (`wip/team/VERSION`). The golden baseline `3831a.json` predates the Home status fix, so two screens show as changed (verify run today).

### What is broken or unproven
- `./check.sh full` has never been green on 38.30 or 38.31 (RESUME.md section 6).
- Not rerun on 38.31: the full click sweep, `tests/guard.js`, `tests/safe.js`, the installable-app test (RESUME.md section 5, item 8).
- "Building your cushion" shows even when the bank ends below zero. The golden screen today shows exactly that: "Building your cushion ... It will end at -$1,177". That is close to telling someone they are fine when they are not, so I treat it as a north-star problem, not only wording (RESUME.md section 5, item 7).
- Possible, not yet checked: in `model.js`, `goalInfo` works out "to go" from the plain target, while `goalRows` uses the larger target once the person said yes to the longer emergency fund. If both reach a screen, two numbers could disagree.

### Not built yet (the destination)
The ledger and real balances, the real Chest, the Pay day ritual as a saved event (an overlay exists), the week check-in, Take out, Check your bank, the "checked N days ago" honesty, and the cutaway art pass. These are steps B, C and D (HANDOFF.md section 5).

The app also only knows the months Nov 2026 to Oct 2028 (`model.js`, `START` and `END`). After Oct 2028 there are no months. Inferred: this needs a rolling window before then.

### What the live site (38.28) has that 38.31 does not
- **It is live and in use.** 38.31 has never been deployed. Inferred: 38.28 went through the release checks of its time, but I cannot see its test results.
- The "Re-split pay" button. 38.30 hid it on purpose: the plan is edited directly (ARCHITECTURE.md 38.30).
- The Investing card on Home, under its old name Financial Freedom. 38.29 retired it on purpose: Investing is now a room (ARCHITECTURE.md 38.29).
- The old words (Necessities, Give, jar). They were changed on purpose (ARCHITECTURE.md 38.29).
- Inferred: everything 38.28 has that 38.31 lacks was removed by decision. I found no feature that was lost by accident, but I have not compared the two builds screen by screen. That comparison is a cheap check, and I will run it before deploying.

I could not open the live site from here: this container's network blocks `the-burrow.mako-162.workers.dev`. I used the 38.28 build from `main`.

---

## D. The plan

The order follows one rule: **first make the eyes trustworthy, then make the numbers right, then make it clear, then ship, then build the next step.** A failing check that nobody trusts hides real bugs. A wrong number breaks trust faster than an ugly screen. And nothing new should be built on an undeployed base.

| # | Step | Why here | North star | How it is checked | Must pass before it ships |
|---|---|---|---|---|---|
| 0 | The QC agent files in `.claude/agents/` (north-star, number-logic, the seven roles), each reading only its own brief and the build | The gates must exist before anything is judged | Strangers judge clarity and truth | Each file names only its brief; a test run on the current build | none (no app change) |
| 1 | Finish the stale tests: `team_inter2`, `team_month`, `purpose_test`, `monkey`, `display`, `team_cur` (and its fixture), and rebuild `team_map.js` from what 38.29 says it covered. For each failure, decide whether the test is old or the app is wrong, using the old test's wording as the record of intent | Every later step depends on the checks telling the truth | A check that cries wolf hides the wolf | Each script alone, one at a time, then twice more to rule out flakiness | `verify.sh` OK; commit and push |
| 2 | Bring back the real-numbers style check (`good1.js`, `mako_scenario.js`). The missing helpers are rebuilt from their callers, never invented, and use made-up yen numbers of the same shape as Mako's (DECISIONS.md decision 9); no real figures are added | Sample-only tests missed real crashes before (QC_ROLES.md, 38.22) | True picture with a realistic plan | The scenario prints its expected numbers | `verify.sh` OK |
| 3 | Confirm `reset_undo.js` passes (the commit says 11 checks), three runs | It guards an Undo that touches saved data | Nobody loses data | Three runs, alone | `verify.sh` OK |
| 4 | Number findings: the "0 counted" card, "pay not placed" beside Left when overspent, the goal "to go" question, and one value for unspent money (`sweepOffer` against `m.pendLeft`) | Wrong or contradicting numbers come before anything visual | Accuracy is priority 1 | A new test for each, written to fail first; oracle, proof, fuzz, `home_dom` | `verify.sh` OK |
| 5 | Mako's decisions 1, 2, 3 and 5 (DECISIONS.md, 2026-11-18): cents kept in plan boxes except yen, with a migration test that old whole-unit plans load unchanged and a release-note line; a plain amber below-zero line naming month, amount and the cause the model knows; the month-end question asked under four receipts with the "Only N receipts are logged" line; the first pay or bills entry becomes the usual amount, older month-only tests judged one by one and updated naming this decision | They change what people read about their own money | Honest picture | New tests first; golden screens show exactly the intended changes | `verify.sh` OK |
| 6 | Screen maths 15 to 0 (the setup tour, the month-end move), one at a time, following the pattern in RESUME.md section 3 | One source for every number | No number can drift from its source | `display_math.js` count drops; golden screens unchanged | `verify.sh` OK |
| 7 | North-star items S1 (no month-end question while setup is unfinished), S2 (proof line after "Decide later"), S3 (where a top-up went), S5 (the 25% / 29% popup), S6 ("not placed yet" only), B2 (now decision 5). S4 (first screen mostly numbers): read exactly what the gate flagged; if a simple visual fix is small, build it before release; if big, tell Mako in two lines and he decides whether it ships as an exception. No other gate failure is an exception | These are the last gate's own findings | Clarity and nothing that lies | The matching tests, then the gates | `verify.sh` OK |
| 7b | Version one Home: the picture, the four numbers (Total, Free to spend, Bills left, Saved) and one Next action. Every other Home card is hidden until it is needed (it becomes the Next action when it matters, or sits behind one "More" control); nothing is deleted, and other tabs keep working. No new art: only existing pictures are reused | Mako's definition of v1; also answers gate finding S4 (first screen mostly numbers) | One picture, four numbers, one thing to do | Golden screens show only the intended change; home_dom and the proof still pass; a new test that Home shows exactly one Next action and no other card until needed | `verify.sh` OK, then the gates on the release candidate |
| 8 | Load a real saved 38.28 plan into 38.31 and compare every bank figure: 38.30 changed the overspend rule, so existing users' bank numbers will change. Explain every difference with the rule behind it and show Mako before deploy. Then rerun what was never run on 38.31: guard, safe, the click sweep at three sizes and two themes, the installable app. Bump VERSION to 38.31, record a new golden baseline, then `./check.sh full` until ALL GOOD | RESUME.md section 6, gate 1 | Stability | `./check.sh full` ends ALL GOOD | All automated checks |
| 9 | The gates, in parallel, all fresh, on the exact file to be deployed: north-star agent, number-logic agent, seven-role panel. Fix, then run new agents. Repeat until both gates pass | RESUME.md section 6, gates 2 to 4 | Strangers judge clarity and truth | Their verdicts | Both gates PASS, panel BLOCKERS fixed |
| 10 | Deploy: build the site, commit to `main`, push, check that Cloudflare deployed, check the live page, then send Mako the link and an honest report. Update RESUME.md and HANDOFF.md | Only now | People get the true picture | Live version stamp, /api/health, a walk of the live page | Everything above |
| 11 | The rolling month window, right after 38.31 ships and before step B (Mako, 2026-11-18) | The ledger and its migration need the month list; the app stops at Oct 2028 | Nothing unknown about future months | Oracle and fuzz over a moved window | Same |
| 12 | Step B, split (process change): B1 = the ledger, real balances and "check your bank", shipped alone first; B2 = the Chest and the Pay day ritual. Adjusted from what Mako finds using v1 with his real numbers. Migration test first, from every stored version since 38.2x. The proof formula test (`tests/qc/proof_formula.js`, Wallet and Track) is written first. When Mako pastes the design documents, add what is missing here: Wallet as the default for Free to spend with Track as a switch; tabs Home, Pay day, Spend, Burrows, Plan, Settings behind the gear; the This month flow strip and the extra Next actions; the six jars as a usual split suggested on pay day; migration (goal starts and the bank start become opening balances, the rest starts as Chest money to place); setup ending by placing the money already there; the Help panel and six video scripts, re-read after steps B and C; the intro video reshoot | The design's next step, on a deployed base | "Where all of it is" becomes literally true | Conservation tests, migration from all 19 old builds, oracle extended | Steps 8 to 10 again |
| 13 | Step C: week check-in (it uses "check your bank" from B1), Take out, the "checked N days ago" honesty | Needs the ledger | Ties the picture to the real bank | Same | Same |
| 14 | Step D, the art step, the very last layer (ask Mako before starting; he works on it closely): the art pass, and the 3D world (WORLD_3D.md): one small stylized walkable world where every action of the app can be done (the cutaway, coin flows, Elthen's squirrel on pay day) | Art last, so it decorates true numbers | Visual first, once the numbers are real | `artcheck.sh`, art director, Mako | Same |

The Claude artifact mirror still works (checked 2026-11-18, serves 38.28), so each deploy also updates it. It is retired once it stops working (DECISIONS.md decision 10).

On deploy (step 10): `build_site.sh` expects the sources next to the repo (`../team`, `../pwa`) and copies `/tmp/v*` back into `tests/regression`. In this container that would fail, or overwrite the repo's fixed tests with stale /tmp copies. I will run it from a layout it expects, check the diff of `tests/regression` before committing, and never commit a test change I did not make on purpose.

---

## E. The quality system

### Automated checks (scripts)
| Check | What it proves | When |
|---|---|---|
| `tests/verify.sh` | build, syntax, main suite, oracle, fuzz, proof, screen-maths count, golden screens | after every edit to money code or a screen; commit after each green run |
| `./check.sh` (fast) | build, main suite, numbers gate, safe copy, guard (idle CPU, speed, no outside requests) | often |
| `./check.sh full` | everything above, plus every regression script, number checks, the click sweep and the installable app | before every deploy (RESUME.md section 6) |
| `./artcheck.sh` | palette, pixel size, no gradients, world rule | any art change |
| `tests/qc/fuzz_model.js 4000`, `home_dom.js 120 <seed>` | model rules; Home against the model | after any change to `model.js`, `ui6.js`, `burrows.js` (QC_ROLES.md) |
| `good1.js`, `mako_scenario.js` | healthy plan says "You are okay"; Mako's real yen numbers | before any Home change (currently cannot run; see C) |

### The two final gates (agents)
| Agent | Given | Checks | Output |
|---|---|---|---|
| North-star (QC_AGENT.md) | NORTH_STAR.md, QC_AGENT.md, the build file, the screenshot helper. Nothing else | 10-second clarity, visual first, fresh eyes, wording, nothing lies or breaks, data safety, art; the proof line; the Borrowed row | VERDICT PASS or FAIL with rule, place, fix |
| Number-logic (QC_NUMBERS.md) | NORTH_STAR.md, QC_NUMBERS.md, the build, the puppeteer helper | four hard gates first (oracle, proof, screen maths, Home against model), then six situations by hand, then the scenario list | the four results, six situations with numbers, PASS or FAIL |

### The seven-role panel (QC_ROLES.md)
Each role gets the shared glossary and only its own section, plus the build. Each report lists BLOCKERS, CONFUSING (exact text, place, replacement) and POLISH, in under 600 words, with screenshots in `/tmp/qc/<role>/`. No role reports before `verify.sh` printed VERIFY OK on that build.

| Role | Checks |
|---|---|
| Novice | a 25-year-old who knows nothing about money: what is this, what do I do first, every term and number explained |
| Money accuracy | recompute by hand; edge inputs; one percent rule; sample never mixed with real |
| Data safety | upgrades, reloads, two tabs, offline, Undo, backup round trip, no secrets |
| Layout and touch | 390x844, 1300x900, 320 wide; 44px targets; contrast; text on solid panels |
| Art director | ART_GUIDE.md, artcheck.sh, flow rule, world rule, Elthen's squirrel, real treasure chest |
| Wording editor | manual-like, no em dashes, the glossary, buttons name the action |
| Regression runner | the scripts above, fresh load with empty and filled storage |

**When:** the two gates on every release and every step. The panel runs in parallel with them on releases (RESUME.md section 6; HANDOFF.md section 7).

### What I can and cannot start from this session
- **Can:** start fresh agents with the Agent tool. Each gets only its brief and the build path, never my reasoning. They run in parallel, and a new set runs after every fix. RESUME.md says agents cannot be started "from an ordinary chat". This session is not one, so here they can.
- **A weakness to name:** these agents run in the same container as the repo. Nothing stops one from reading RESUME.md or the git log, so separation is enforced by their instructions, not by walls. I will tell each one which files it may read, and I will check its report for signs it read more.
- **Unsure:** project subagent files in `.claude/agents/` may only load in a new session. Until I have seen one load, I will start the gates as fresh general agents with the same brief, which has the same effect.
- **Cannot:** open the live site (blocked by this container's network policy), test on a real phone or iPhone Safari, or hear the sounds (ARCHITECTURE.md "Known limits" says the same). I also cannot see Mako's own browser data, his Claude memory file `areas/mhr2000-app.md` (the deploy recipe), or the project documents in claude.ai.

### Today's QC_ROLES.md merge (done, before this job; it will be committed alongside this file)
Merged from the old chat's version into `wip/team/QC_ROLES.md`:
1. A section "The two final-gate agents", which was missing.
2. The glossary updated to the newer words (Chest for this month, Free to spend everywhere with "play money" retired, Investing, "places", "unassigned" banned), with a note that the Chest meaning is still open for step B.
3. Money accuracy: the 38.30 panel lessons and the number-logic agent rule.
4. Data safety: Re-split pay keeps a copy and offers Undo, even after a reload.
5. Layout: text sits on solid panels, never straight on the scenery.
6. Art director: the Free to spend picture must look like a real treasure chest.
7. Wording editor: "unassigned" added to the jargon list.

Kept from the repo copy, because the old chat's version lacked them: the north-star pointer, the "Process for every big task" section, "How to update this file", "Lessons from 38.26", "Visual first", and "Added in 38.31". QC_AGENT.md and QC_NUMBERS.md needed nothing from the old chat. The repo copies are newer (they have the 38.31 hard gates). The agent files in `.claude/agents/` are not written yet; I stopped when you asked me to.

---

## F. Conflicts and gaps

### Where the files disagree
1. **Closed (decision 4).** **What "Chest" means.** QC_ROLES.md (old glossary) and the old chat say the Chest is this month's money. The bird's-eye design (HANDOFF.md section 3) says the Chest is only where new pay waits, and "This month" is separate. The design is newer. To be settled in step B; noted in QC_ROLES.md.
2. **Closed (decision 6: only S4 may be an exception, and Mako decides).** **Deploying with open items.** HANDOFF.md section 8 step 5 says to deploy anyway if only roadmap or polish items remain on the north-star gate. Your instruction in this chat says not until both agents pass. I follow the stricter one.
3. **Can agents be started?** RESUME.md says not from an ordinary chat. In this session they can (see E).
4. **How the goal top-up works.** ARCHITECTURE.md (38.30) says it goes through `ACT.sweep` and stores the lines it cut. The code (`ui6.js` `doSweep`) stores a marker instead, as HANDOFF.md says. ARCHITECTURE.md is out of date. Also, the dropped option "add it to next month" still lives in the code (`releasePlay` with `'next'` in `model.js` and `actions.js`), and the headers of `leftover_choice.js` and `leftover_thin.js` still describe it.
5. **The root copies are older.** README.md, ARCHITECTURE.md, NORTH_STAR.md and QC_ROLES.md at the repo root are older than the wip/team copies. README.md says the sources live in "Claude's working folder", which is no longer true.
6. **Deploy instructions disagree.** ARCHITECTURE.md "Checks and release" mixes an older Cloudflare Pages and artifact flow. SETUP.md and RESUME.md say pushing `main` deploys the Worker. `build_site.sh` expects a folder layout that does not exist here. HANDOFF.md says the exact recipe is in Mako's memory file, which I cannot read.
7. **Closed (decision 3).** **Months with few receipts.** ARCHITECTURE.md says the month-end card waits for four receipts or a statement. HANDOFF.md says months with fewer than four receipts are asked anyway, and Mako has not said whether that is right.
8. **Closed (decision 1).** **Typed cents.** Cents kept, yen whole.
9. **Closed (decision 2).** **"Building your cushion" below zero.** RESUME.md item 7 says decide with Mako. I think it fails the north star as it stands (see C).
10. **Commit trailer.** WORLD_PLAN.md names an older model and session in its trailer. I use the attribution this session was given.
11. **The check server port.** HANDOFF.md says to run a server on 8788 before `./check.sh full`; `check.sh` starts its own on 8765 for the installable-app test. Minor; the script is what runs.

### What is missing
- The bird's-eye design document `claude/burrow-bird-eye-design.md` that NORTH_STAR.md points to is not in the repo. Its content arrived in this chat inside HANDOFF.md section 4, and that is what I used.
- `claude/burrow-glossary-and-video-scripts.md` (the six video scripts) is not in the repo or this chat.
- The deploy recipe `areas/mhr2000-app.md` is not reachable.
- `tests/qc/build.js` and `tests/qc/joyfull2.js` (needed by Mako's scenario checks) are missing.
- `team_map.js` and the `legacy_yen.json` fixture are missing.
- A way to see the live site from this container. The fix is on your side: allow the host in the environment's network settings, or check the live page yourself after a deploy.
- The design documents for step B (Mako will paste them).

---

## G. What I will NOT do

| The easy mistake | How I avoid it |
|---|---|
| Polish art or add features while a number is wrong | Numbers first, always (step order in D). A visible wrong number stops all other work |
| Change a test to get green | First prove which side is wrong, as I did with `viewtest.js` (every gap matched a named rule before I touched it). Old test wording is the record of intent. Never delete a test |
| Make a "fixed" check depend on the app's own code | Independent checks are rebuilt from the plain rules (the oracle's overspend recount uses none of the app's code) |
| Call automated checks "QC passed" | Only the two fresh gates can pass QC. I report script results as script results |
| Reuse an agent, or give it my reasoning | A new agent for every run, given only its brief and the build path |
| Deploy on a fail, or on an unchecked build | RESUME.md section 6 in full, every time |
| Keep anything a check needs only in /tmp | Fixtures and helpers live in the repo; `setup_env.sh` rebuilds /tmp from them |
| Run browser tests in parallel | One at a time; timing tests fail under load (RESUME.md section 2) |
| Invent a missing file or number | Rebuild from callers and history, or ask. Mako's scenario numbers are never changed without him |
| Let a screen do sums | Every new amount gets a name in `model.js`; the scanner count only goes down |
| Rewrite a person's saved plan to record an answer | Answers are markers applied by the model, as 38.30 settled |
| Mix sample and real numbers | The sample is labelled everywhere and never blends with typed numbers |
| Use em dashes, jargon, or a fake-friend voice | Wording editor rules; I search every file I touch for em dashes before committing |
| Ask many small questions | I batch real decisions (like the three above) into one message and build the safe default meanwhile |
| Lose work when a session ends | Commit and push after every green check; a resume timer on every big task |
| Claim something is live without seeing it | If I cannot open the live page, I say so and ask you to check |
| Forget feedback | Every piece goes into the matching "Learned from Mako" list the same day |

---

## Mindset check

**1. You ask for a new burrow world with cool animations while a Home number disagrees with Plan. What first?**
I fix the number first and tell you in one line why the world waits. Priority 1 is accuracy and nobody loses trust (DECISIONS.md "Priorities"). A figure shown in two places must be the same everywhere (QC_NUMBERS.md). Art never comes before the picture is true (NORTH_STAR.md: styling must not change the goal). Then I build the world, and I will point out where the world could show the money visually.

**2. A test fails and the quickest way to green is changing the test. What do you do?**
I find out which side is wrong before touching either. If the app changed on purpose, I update the test and name the decision that changed it. If the app broke, I fix the app (QC_ROLES.md, Regression runner; RESUME.md section 5: "Do not delete a test to get green").

**3. All automated checks pass but the QC agents have not run. May it ship?**
No. Both fresh gates must pass, plus the panel (RESUME.md section 6; QC_AGENT.md; QC_NUMBERS.md; your instruction in this chat).

**4. You give feedback about one number. What else do you update?**
The fix in `model.js`, never in a screen. A test that would have caught it. The situation added to the six in QC_NUMBERS.md, so every later release checks it. A line in the matching reviewer's "Learned from Mako" list in QC_ROLES.md, the same day. If it is a standing rule, DECISIONS.md. Then RESUME.md (QC_ROLES.md "How to update this file"; QC_NUMBERS.md "Added in 38.31").

**5. A usage limit is coming. What do you do?**
Commit and push what is green. Make sure the resume timer is set with a self-contained message (one is set for 10:05pm JST today). Write the current state into RESUME.md, so a fresh session can continue without me. When the limit lifts, carry on without waiting for you (DECISIONS.md "How Mako wants the work done"; QC_ROLES.md "Process"; RESUME.md section 2).
