# The Burrow: full handoff for a new session (written 2026-11-18)

INSTRUCTION TO THE SESSION READING THIS: save this file as HANDOFF.md in the repo root (makoism/money-headache-remover), commit it on branch wip-38.30, and push. Then work through "What to do next". Mako has said: do not ask about small things, keep going, do not wait on him, send each tested version as it goes live, and be honest in reports. Never use em dashes anywhere (code comments, app text, reports).

## 1. What this is
The Burrow is a money app Mako builds for his team (Philippines-based video editors on about 35,000 to 60,000 pesos a month), friends and family, and himself (Japan, yen). The person it is for has never saved money. It was previously called M.H.R.2000 / The Money Headache Remover 2000; the old name still appears in the repo name, in some file names and in older notes.
- Live: https://the-burrow.mako-162.workers.dev, version 38.28.
- 38.30 is built and NOT deployed.
- Repo: makoism/money-headache-remover (PUBLIC, so no secrets in it). Branch wip-38.30 holds the 38.30 source and build under wip/ (latest commit c811345). main is untouched.
- Hosting: a Cloudflare Worker deployed from the repo, on Mako's Cloudflare account. The Anthropic API key and INVITE_CODES live only as Cloudflare runtime secrets/variables. Never write them anywhere.
- Where the working source was: /home/claude/work/team (parts) building to /home/claude/work/money-map-team.html via ./build.sh. If that path is gone, restore from wip/ on the branch (wip/team and wip/money-map-team.html).
- The deploy recipe is in Mako's Claude memory file areas/mhr2000-app.md and the QC process is in the Claude project document claude/burrow-qc-roles.md. This session may not be able to read either. If it cannot, check the repo for SETUP.md and ARCHITECTURE.md, and ask Mako to paste the deploy recipe.

KNOWN GAP TO CHECK FIRST: NORTH_STAR.md (modified), QC_AGENT.md and QC_NUMBERS.md (new) were uncommitted files in a local clone at the last check, so they may not be on GitHub. If they are missing from the repo, recreate them from sections 4 and 7 below and commit them.

## 2. The north star (Mako, 2026-11-17)
A person sees at a glance where all their money is, where it is stocking up, what flows in and out, and what is safe to spend. They feel safe because nothing is unknown. Every instruction and feature is checked against this. Pixel art and styling never change it.

Visual first (a hard rule): if something can be shown visually instead of as numbers or words, and that makes it clearer, the visual is preferred even when it costs more to build. A kid should understand the screen. Gold coins visibly split into each burrow on pay day with small cute animations; piles of coins show amounts; a filling burrow shows progress. A simple version is fine but it must be visual. Numbers sit under a picture, never instead of one. Point out when something could be a picture.

Mako's brief in order: (1) stability and accuracy above everything, nobody may lose data; (2) minimal wording like a manual, never "too AI", never a fake friend; (3) clean, rounded look, green nature theme, pixel art, lots of space; (4) quiet nature sounds; (5) real numbers from statements, not typing; (6) an assistant that knows the whole picture and carries out changes with Apply and Undo; (7) code that is quick and safe to change; (8) the app feels like a trusted friend who has your money handled.

## 3. Words (final)
Chest, This month, Burrows, Free to spend, Pay day, Take out, Check your bank, Proof line, Bills and basics, Investing (never spent, only grows). Retired: jar, bucket, Necessities, Financial Freedom, "play money", "income", "allocation", "unassigned" (say "not placed yet"). Debt reads paid off / still owed; everything else reads full / saved. Buttons name the action ("Log spend", "Add a payment"). Sentence case, plain verbs.

WORDS CONFLICT TO RESOLVE IN STEP B: the older QC glossary (QC_ROLES.md) says "Chest: money for this month (Bills and basics, Free to spend)". The final bird's-eye design says the Chest is only where new money waits on pay day, and "This month" is the separate part for bills and basics plus Free to spend. The design is the newer decision. Reconcile the app, QC_ROLES.md and the glossary file to the design when step B ships. Also Mako (2026-11-17): the Free to spend picture must look like a real treasure chest.

## 4. The bird's-eye design
### Verdict on the app before step A
A very good planner (24-month forecast, statements reader, accuracy), not yet a map of where the money is. Problems: it is forecast-first; the bank is one pot and goal balances are planned; Education, Give, Free to spend and Investing are monthly amounts that leave and never become a visible balance; nothing adds up to a total you can check against the bank; Home was about twelve stacked cards of numbers; words collided (Treasure chest vs Burrows vs jars); pay day was not an event; spending never felt like coins leaving a place.

### The idea: one cutaway of the burrow
A coin is always in exactly one of three states:
- Waiting: just arrived, no job yet. The Chest. Empty except on pay day. Loose coins in it mean something is unplaced.
- This month: set aside for bills and basics and Free to spend, leaving on their dates.
- Resting: in a burrow (Free to spend in Track mode, Emergency fund, each goal, Education, Giving, Investing), stays until the person decides.

Home is a cutaway of the hill. Depth means how locked the money is: near the surface is spent soon, deep is safe or growing. Coin piles in each chamber match the real amounts. Under it, four numbers only: Total, Free to spend, Bills left to pay, Saved. The line under them is the proof: Chest + This month + Burrows = Total, with "Matches your bank, checked 2 days ago". (Corrected 2026-11-18, Mako: Free to spend is inside This month, so it is never added again. The exact rule for Wallet and Track mode is in tests/qc/proof_formula.js.)

Free to spend is the Free to spend burrow balance (Track mode), or "in your wallet" (Wallet mode, not tracked). Default is Wallet mode (everyone has cash in a wallet); Track is a switch.

### The rules (the logic)
1. Every coin is in exactly one place. Total = Chest + This month + Burrows, always.
2. Money moving into a burrow counts as saved, not spent. Money leaving for a shop counts as spent.
3. Taking money out of a burrow (a course, a donation) lowers that burrow only. It never touches this month's budget.
4. Only two things drain on their own: bills on their dates (from the plan, corrected by receipts) and spending the person logs. Everything else moves only when the person says.
5. Honest about age: "checked N days ago"; coins dim after 14 days without a check. No fake precision.
6. No red shame: amber for attention, wording like a manual.
7. Unspent Free to spend: the person chooses where it goes and must always know what they are deciding; until moved it is counted in the bank.

### Decisions by Mako (2026-11-18)
- Unspent Free to spend at month end is a QUESTION, never assumed: Count it in the bank / Put it toward a goal / Decide later. Dropped: "add it to next month's free to spend" (it made next month look overspent; they can raise Free to spend in Plan instead).
- Pile sizes (goal burrows show progress toward the goal; Education, Giving, Investing show amount): good as they are.
- Open: months with fewer than four receipts are asked anyway and the card says "log anything you spent first". Mako has not answered whether that is right.

### The rhythms
- Pay day (monthly or twice a month): enter what landed (prefilled with usual pay). Gold coins drop into the Chest, then run down tunnels and visibly split into each chamber with amounts counting up, from the "usual split". Tap an amount to change it (the unassigned-pool sliders exist). Place it. Chest shows 0 and "Every coin has a home". Saved as a pay day receipt, for example "P30,000: bills 16,500, free to spend 3,000, ...".
- Week (60 seconds): "What did you spend?" Coins visibly leave the right chamber. Free to spend updates. Optional statement upload fills it in.
- Take out: open a burrow, Take out, amount and what for. Coins leave. One line says what it did and did not touch.
- Check your bank (monthly or after a statement upload): enter the real balance or upload; the difference shows as "P1,200 unexplained: add a receipt or adjust". This is the trust loop.
- Setup ends by placing the money they already have, so within three minutes they see their own burrow filled, not a forecast table.

### Home order and tabs
Home: (1) the cutaway with the four numbers and the proof line; (2) one Next action (pay day, week, check your bank, a goal missing an amount); (3) a This month flow strip: In, Out, Moved to burrows; (4) below the fold: goals with dates and reasons, cards and loans, streak. Tabs: Home, Pay day, Spend, Burrows, Plan (look ahead), Settings behind the gear.

### What stays, what changes
Stays: the forecast (becomes Look ahead and the pay day suggestion), plan lines and goals, statements reader and review, receipts and scan, assistant and actions with undo, debts, repeating spending, extra money (becomes an extra pay day), limits, look back, backups and vault, the scene and per-burrow worlds (become the zoom-in), the check suites.
Changes: the six jars become places with balances; Home goes from about twelve cards to one picture; the Treasure chest card becomes Free to spend; the Receipts tab becomes Spend; goals become burrow details with Take out; the Next card gains pay day and check your bank; setup ends on placing money.
New: a ledger of events (S.ledger: pay in, move, spend, take out, check) with balances derived from it; opening balances; the pay day screen; the week check-in; the check-your-bank loop; stale-age honesty; the cutaway art and coin flows; a flow strip; conservation tests (total always equals the sum; undo restores exactly; migration from every stored version).
Removed or merged: the Financial Freedom card, the hero goal card (moves into burrow detail), duplicate numbers, "jar" wording; streak and badges demoted.

## 5. Roadmap
### Step A: words, the cutaway and four numbers from today's data, honestly labelled "planned" (DONE in 38.30, not deployed)
Education, Give and Investing shown as burrows with running totals; a coin pile in every room matching its amount; a small coin-drop animation when the page opens.

### Step B: ledger, real balances, Chest, Pay day ritual (NEXT after 38.30 ships)
- Add S.ledger of events (pay in, move, spend, take out, check). Balances are derived from the ledger, never stored separately.
- Migration with nothing lost for anyone: goal starts and the bank start become opening balances; everything else starts as Chest money to place. It must work from every stored version since 38.2x; write the migration test before the code.
- The real Chest (waiting room) and the Pay day screen with the visible coin split (see the rhythms above). Saved as a pay day receipt.
- The proof line becomes a true identity: Chest + This month + Burrows = Total (Free to spend is inside This month; tests/qc/proof_formula.js), with the "checked N days ago" age.
- Reconcile the Chest wording (section 3).
- Conservation tests: total always equals the sum of the places; undo restores exactly; every migration path.

### Step C: week check-in, Take out, Check your bank, stale honesty
- Week check-in: "What did you spend?", coins leave the right chamber.
- Take out from a burrow, touching that burrow only.
- Check your bank with the unexplained-difference line, including after statement upload.
- Stale honesty: coins dim after 14 days without a check.

### Step D: art pass
Cutaway rooms, coin animation polish, the squirrel carrying a coin on pay day (must be Elthen's squirrel sprite). ART_GUIDE.md is the law: flat palette ramps, no gradients or blur, no black outlines on living things, big pixels, one light model, run ./artcheck.sh, everything painted into the scene, never near words, decoration must flow with what it is added to and not appear on every card.

### Never build
Bank auto-sync, thirty categories, net-worth charts, red alarms, points.

### Open design choices (defaults chosen, Mako can flip)
Free to spend mode default is Wallet. Cutaway was picked over chest-with-bags. Depth means how locked.

### Help videos (after steps A to C are stable)
Six scripts exist in the project document claude/burrow-glossary-and-video-scripts.md (Why this app, The Chest and pay day, Burrows, Free to spend, The weekly check-in, Check your bank), each under a minute, Mako on camera, mindset only, no screen shown, same words as the app, captions and transcript with each. Until recorded, the Help panel shows the transcript as plain text so Help is never a dead button. Re-read the scripts after B and C ship, because they assume pay day, the week check-in and check your bank exist.

## 6. State of 38.30 (not deployed)
Added since 38.28: overspend is real money (comes out of the bank and carries on); a Home pay picture and Pay day overlay; a striped "Past your pay" piece when the plan is bigger than pay; the month-end leftover QUESTION. The answer is stored as a marker S.ui.sweep (amt, id or to, t) and applied in model.js (m.counted, m.topup{id,amt,used}, m.credit, g[id].up). The saved plan and planned amounts are never rewritten; Undo deletes the marker; Undo shows again for 3 days after a reload (only when no question is open); the card text is live.

Fixed on 2026-11-18: a reload after "Put it toward a goal" wiped the saved plan (the normalizer for the marker threw); tests/qc/leftover_reload.js now guards it and is in check.sh. The answer to one month no longer blocks the next month's question. Plan > Goals and the Receipts "went to goals" line include the top-up. Cents show on the Receipts balance line and the All months table. The Plan line for a finished month says where unspent money went. Undo of "Reset month" now restores only that month's edits.

Last local results: artcheck pass, test_team pass, click sweep 807 clicks and 0 problems, fuzz 0 fails, check.sh ALL GOOD, tests/qc/leftover_choice / thin / stale / cents / reload pass.

### Open items from the round 18 gates (both gates FAILED that round; the build has changed since)
North-star:
- B2: guided "Enter pay / check bills" from the Home Next card only sets the current month (Plan edits are month-only by design, with "Keep for later months"), so December falls back to the sample pay while the card says "Pay and bills are yours". An attempt to make the first pay or bills entry the usual amount (onSet in ui0.js) broke four expectations in /tmp/team_inter2.js and was reverted. Do it narrowly (only from the Home guided card) or ask Mako: should the first entry always be the usual amount for every month?
- S1: no month-end question while setup is unfinished, and its money is not named in the proof line.
- S2: after "Decide later" the proof line points to a card that is not there.
- S3: Plan shows nothing about where a top-up went (partly done via the goal row).
- S4: the first screen is mostly numbers (roadmap, visual first).
- S5: a "Yearly cost: 25%." popup on every load contradicts 29% and covers pictures.
- S6: "not planned yet" vs "not placed yet": pick one word ("not placed yet").
- Nice to have: the dropdown sits next to the Count button; a gap on the Log spend card; the goal list is inconsistent.
Number-logic:
- Typed $ plan amounts with cents round to whole dollars silently (decide).
- The answer card after receipts use up the leftover shows "0 counted".
- An overspent month shows "pay not placed" beside Left (overspend logic).
- Add a test for the Reset month Undo fix: Undo restores only that month's edits and receipts logged after the reset stay.
History: rounds 15 to 17 each found real money bugs in earlier "rewrite the plan" designs; the marker design above replaced them.

## 7. QC process (run on every release and every step)
Two final-gate agents run at the same time on the same finished build, each a fresh agent that has not seen the work being made. Both must pass before anything ships. On a fail, fix or bring it to Mako, then run fresh agents again.
1. North-star agent: given only NORTH_STAR.md, QC_AGENT.md and the build. Checks the north star, visual first, fresh eyes, wording, nothing lies or breaks, data safety, art.
2. Number-logic agent: given only QC_NUMBERS.md. Its only job is that every number is correct in every situation: typos, wrong or duplicate receipts, overspending, negative bank, blanks, no input, dates, currency and cents, undo and reload. It drives the real app, recomputes numbers itself and compares every screen.
Mako also approved (2026-11-18) running the full seven-role panel (QC_ROLES.md) on 38.30 in parallel with the two gates once the gates pass: Novice (a 25 year old who knows nothing about budgeting), Money accuracy, Data safety, Layout and touch (390x844, 1300x900 and 320 wide, tap targets 44px or more, contrast), Art director (ART_GUIDE.md and artcheck.sh), Wording editor, Regression runner. Report format for every reviewer: BLOCKERS, CONFUSING (exact text and place, with a replacement), POLISH, under 600 words, screenshots in /tmp/qc/<role>/. Add every piece of Mako feedback to the matching reviewer's "Learned from Mako" list the same day.

Automated checks (scripts, not agents): ./artcheck.sh must end "ART CHECK PASS"; ./check.sh must end "GUARD ALL PASS" and "ALL GOOD" (fast tier); ./check.sh full before every deploy (includes the number checks; run the site build and a server on 8788 first); node tests/qc/fuzz_model.js 4000 and node tests/qc/home_dom.js 120 <seed> after any change to model.js, ui6.js or burrows.js; tests/qc/good1.js (a healthy plan must say "You are okay") and tests/qc/mako_scenario.js (real yen numbers: Nov left -41,918, bank 1,010, free to spend 26,010) before any Home change. Tests must set S.ui.toured or the tour hides the screen. When a test fails, first decide whether the app changed on purpose (update the test) or broke (fix the app). Never rebuild while a check runs. Test with a real plan as well as the sample (sample-only tests missed crashes in the healthy state).

Number rules learned so far: one percent rule (floored) everywhere; free to spend is capped so it never shows next to Short; spending past a plan comes out of the bank and stays out in later months; one bank figure on Home, Plan > Month, All months, the status line, the chip and toasts; a bank under the minimum or below zero gets a plain warning and lowers what is safe to spend; sample and real data never mix.

## 8. What to do next, in order
1. Restore the working copy from branch wip-38.30; run ./build.sh and the local checks; confirm NORTH_STAR.md, QC_AGENT.md and QC_NUMBERS.md are in the repo (see the known gap in section 1).
2. Add the Reset month Undo test.
3. Restage the build (rm -rf /tmp/qc_build/shots /tmp/qc_build/nums; cp the build to /tmp/qc_build/build.html; cmp) and run the two fresh gate agents plus the seven-role panel.
4. Fix real findings (the number-logic items first), rerun fresh agents.
5. If only roadmap or polish items remain on the north-star gate, tell Mako plainly what they are and deploy anyway. He said not to wait on him.
6. ./check.sh full, deploy per the recipe, verify both check-runs, publish the artifact, send Mako the live link and an honest report, then update this file.
7. Then step B, C, D in that order, each with a fresh gate run before it ships.

## 9. Standing rules from Mako
- Accuracy and stability first. Nobody loses data. Check with his real numbers, not only sample data.
- Process for every big task: set a resume timer first with a self-contained state message, tell Mako in one line, cancel or replace it when done. If a usage limit stops the work, resume at the reset without waiting for him.
- Never use em dashes. Minimal, plain wording. Never "too AI".
- Don't ask about small questions; send each tested version as it goes live.
- Two gate agents must both pass before anything ships.
