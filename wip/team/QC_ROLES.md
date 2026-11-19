# QC panel for the burrow

> North star: read NORTH_STAR.md first. Every change is judged by it.

Every build goes past these reviewers before Mako sees it. Each reviewer is a separate agent that has not seen the work being made, and each checks only its own list. Run them in parallel, fix every BLOCKER, then re-run the ones that failed. Whenever Mako gives feedback, add it to the matching reviewer's "Learned from Mako" list the same day, so the same miss never repeats.

Report format for every reviewer: BLOCKERS (wrong, broken, data at risk), CONFUSING (exact text and place, with a replacement), POLISH. Under 600 words. Screenshots in /tmp/qc/<role>/.

## The two final-gate agents (Mako, 2026-11-17, every release and every step from now on)
Two fresh agents run at the same time on the same finished build. Both must pass before anything ships; on a fail, fix or bring it to Mako, then run fresh agents again.
1. North-star QC agent (QC_AGENT.md in the repo): given only NORTH_STAR.md, the plain rules and the build. Checks the north star, visual first, fresh eyes, wording, nothing lies or breaks, data safety, art.
2. Number-logic agent (QC_NUMBERS.md in the repo): its only job is that every number is correct in every situation (typos, wrong or duplicate receipts, overspending, negative bank, blanks, no input, dates, currency, undo and reload). It drives the real app, recomputes the numbers itself and compares every screen.

## Shared glossary (one word per thing, everywhere)
- Burrow: any place money piles up over months: goals (emergency fund, trip, home, yearly cost), Education, Giving and Investing. Giving is a burrow: you save for gifts or charity and spend from the stock (Mako, 2026-11-19).
- Goal: the amount a burrow is aiming for ("Trip: 1,200 goal"). Home, Plan and setup use burrow and goal the same way (Mako, 2026-11-19).
- Chest: only the treasure chest picture of Free to spend. No screen uses "Chest" as the name of anything else; the place where new pay waits on pay day gets its own word when it is built later (Mako, 2026-11-19, replaces decision 4's naming).
- This month: Bills and basics plus Free to spend, the money set aside for this month.
- Free to spend: say "Free to spend" everywhere; the old "play money" wording is retired.
- Investing: invested and never spent. Only grows.
- Paid off / still owed for debt. Full / saved for everything else.
- Pay, bills, places. No "income", "allocation", "liabilities", "unassigned" (say "not placed yet").

## 1. Novice (knows nothing about budgeting)
Pretend to be a 25 year old sent the link by a friend. Walk the whole tour and every page.
- Within 10 seconds: what is this for, and what do I do first?
- Every term explained where it first appears. Every number says what it means and what to do next.
- Burrows (money that piles up) vs This month (money for now) is obvious. No leftover words from older cards.
- No dead ends, no screen where the only way forward is a term they do not know.
- Empty states invite an action. Sample numbers are always labelled as sample.
Learned from panel (38.21): debt must read paid off / still owed everywhere (use dw/dwr in model.js for any new goal wording); every number a novice sees needs a one-line purpose; sample numbers labelled on every page; tour verdict must use the same rule as Home status.
Learned from Mako: run it as someone who does not know budgeting or finance; check the info is there for why they use it, what each number means, what it is for.
Learned from Mako (2026-11-19): you are the person The Burrow is built to bridge: you never learned to save. On every screen: is it obvious what it means? If not, does it explain itself right there, the mindset first (why this matters, how to think about it), then the function (what to tap)? One thing at a time, like Typeform. The first impression must be "money management is this simple; I upload my stuff and it does it for me". Report every place you would have given up.

### Jobs to finish (Novice)
Passing every screen is not enough: a real job must be finishable. Do each job below in a browser, through the screens only: look, tap, type. No console, no reading code, no editing storage, no test hooks. You are a person who never learned about money. Start job 1 on empty storage and type your own made-up numbers (sample numbers do not count). Getting stuck anywhere is a finding: name the screen and quote the words on it where you gave up. The first lines of your report list each job as DONE or STUCK.
1. "Get me set up." From the first open to a finished setup: pay, rent, food. Finished when: Home shows your numbers, not sample ones, and you can say what you typed for each.
2. "What is safe to spend today?" Finished when: you can state one figure from Home and say in your own words why it is that much.
3. "Does this match my bank?" On Home, use Check your bank: type what the bank app shows today. Finished when: Home shows that figure with the day it was entered, every figure near it has one name only, and no other figure on Home contradicts it.
4. "I have a credit card I pay in full." On Home, add the card: its name, what is on it now, the day you pay it. Finished when: you can state from the screen what the bank holds after the cards are paid, and it is the bank minus the card.
5. "I just bought lunch." Log one spend in under 60 seconds from Home (time it). Find it again in Receipts. Then fix a typo in its amount with Edit. Finished when: Receipts shows the corrected amount once, and Free to spend moved by the corrected amount.
6. "Oops, I did not mean that." Make a mistake (a wrong spend, or a wrong amount in Plan) and take it back with Undo. Finished when: every figure is back to what it was before the mistake.
7. "I want to save for a trip." Add a burrow with a goal amount (Plan, Burrows). Finished when: it shows on Home, and you can say what it did to Free to spend and why.
8. "I am lost, help." From each tab, Settings, an open burrow and inside setup, find Help. Finished when: you reached Help from each, or you name each screen that has no way to Help.

## 2. Money accuracy
Recompute by hand against the plan; do not trust the screen.
- Pay, bills, jars, goal monthly amounts, chest numbers, burrow saved/percent, status sentence all agree with each other and with Plan and Month pages.
- Floor vs round: one rule, same percent everywhere.
- Edge inputs: pay 0, bills above pay, huge and tiny numbers, negative, debt target 0, saved above target, month rollover, leap days, last day of month, a goal due next month.
- Sample vs real data never mixed; nothing shows a made-up number once the person has entered theirs.
- Debt: paid off fills, owed shrinks, wording never says saved/full.
Learned from panel (38.21): one percent rule (floored) on Home, popup and goal bars; restore from text must offer Undo; known open: debt after its due date shows Short with 0 paid, saved above target keeps adding monthly.
Learned from panel (38.22): free to spend is capped so it can never show next to Short (held back = minimum balance minus month-end bank); sample-only tests miss crashes in the healthy state, so test a real plan too.
Learned from Mako: zoom out to the objective: the app must give a true picture of money and what can really be spent; check it with his real numbers, not only sample data.
Learned from panel (38.30): spending past a plan (Free to spend, Bills, a burrow below zero) comes out of the bank and stays out in every later month; one bank figure on Home, Plan > Month, All months, the status line, the chip and toasts; pay the plan has not placed is shown as its own piece, and a plan bigger than the pay says so; a bank under the minimum or below zero gets a plain warning on Home and lowers what is safe to spend.
Learned from Mako: accuracy and stability first. Nobody loses data.
Learned from Mako (2026-11-17): a separate number-logic agent checks every number in every situation (typo, wrong receipt, overspend, missing input) on every release and step.

## 3. Data safety
- Saved plans survive upgrades (no migration that drops fields), reloads, back in the tour, closing mid-step, offline, two tabs.
- Undo works for money moves. Backup and restore round-trip. Re-split pay keeps a copy and offers Undo, even after a reload.
- Deleting anything asks first and says what is lost.
- Nothing writes the API key anywhere; INVITE_CODES stays a dashboard variable; repo is PUBLIC so no secrets in it.

### Jobs to finish (Data safety)
Do each job in a browser, through the screens only: look, tap, type. No console, no reading code, no editing storage, no test hooks (the recovery code is read off the screen of phone A). You are a person who never learned about money, with made-up numbers. Getting stuck anywhere is a finding: name the screen and quote the words on it where you gave up. The first lines of your report list each job as DONE or STUCK.
1. "Move my numbers to another phone." Phone A: Settings, Cloud copy, turn it on and walk its four steps (what it is, the code, this device, another device). Phone B (empty): get the numbers back from the welcome screen (enter the recovery code, find the copy, load). Finished when: pay, bank, every bill, every burrow, Free to spend and the receipts on B match A, figure by figure.
2. "The other phone is gone from the welcome screen." Same as 1, but B has skipped setup: Settings, Cloud copy, the button for a code you already have (enter, found, loaded). Finished when: the same figures match.
3. "My second phone already has numbers." B has its own plan, changed after A's last send. Enter A's code on B. Finished when: B warned in plain words which copy is older or newer before loading, and after loading you can bring B's old numbers back with Undo, also after a reload (the copy kept for 3 days).
4. "Save a backup and get it back." Settings, Backup: save the file. Change some numbers. Settings, Restore: choose the file. Finished when: it asked before replacing, every figure matches the moment of the backup, and Undo brings the changed numbers back.
5. "I lost my recovery code." Finished when: you can state, from the screens only, how to see the code again on a device that still has the numbers, and what the app says happens if the code and the device are both gone. If the app never says, that is a finding.
6. "The send failed." Make a change while the server refuses (see below). Finished when: Home and Settings both say the cloud copy is behind and since when, also after a reload, a retry button is on screen, and after the server is back the line goes away.
7. "I reset by mistake." Settings, Reset and setup: set all to zero (and, in a second run, restore samples). Finished when: it asked first and said what is lost, and Undo brings back every figure, also after a reload.

Two phones and the made-up server. The cloud copy needs a server, so a `file://` page cannot do jobs 1, 2, 3 and 6. `tests/qc/cloud_lib.js` has a made-up local one (it serves the build and keeps copies in memory; nothing leaves the machine). In your own script in `/tmp/qc/data/`: `process.env.BUILD = '<build path>'; const C = require('<repo>/wip/team/tests/qc/cloud_lib.js'); const srv = await C.server();` then open `srv.url`. `srv.st.mode = 'drop'` (no signal) or `'500'` makes sends fail; `'ok'` brings it back. A second phone is a separate browser profile with its own empty storage: `await C.profile(srv.url, { tour: true })` (puppeteer, 412x915; without `tour` it skips setup for you), or with Playwright (`require('playwright')` works, chromium is installed): `const b = await chromium.launch(); const A = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }); const B = await b.newContext({...});` then `newPage()` on each. One context is one phone; never share a context between A and B. Also run, from `wip/team`, `BUILD=<build path> node tests/qc/cloud_move.js` and the same for `cloud_fail.js`, and paste their last line, but they do not replace walking the screens yourself.

## 4. Layout and touch (phone 390x844 and desktop 1300x900, also 320 wide)
- No overflow, clipping, overlap. Fixed Ask and Help pills never hide a button or text the person must reach (leave bottom padding).
- Tap targets 44px or more. Contrast passes in light and dark. Long names and long numbers wrap or truncate cleanly.
- Keyboard order and focus visible. No console errors. Text sits on solid panels, never straight on the scenery.
Learned from panel (38.21): Ask and Help pills hide while the tour or a burrow is open; tap targets under 44px on tabs, sub-tabs, small buttons still open; light theme contrast over the forest is poor (about 2:1) and needs a decision.
Learned from Mako: decoration must not get close to text; everything needs breathing room.

## 5. Art director (ART_GUIDE.md is the law)
- Number one rule: anything added must flow with what it is added to (corner-grown, an accent, not on every card, each its own kind, never near words).
- World rule: nothing superimposed; it is painted into the scene.
- Palette ramps only, flat tones, no gradients or blur, no black outlines on living things, big pixels, one light model; run artcheck.sh.
- Green nature look. Consistency across burrows, chest, scene.
Learned from Mako: vines too thick and too same-y; subtle, tasteful, varied; keep the purple wisteria; squirrel must be Elthen's sprite.
Learned from Mako (2026-11-17): the Free to spend picture must look like a real treasure chest.

## 6. Wording editor
- Minimal wording like a manual. Never "too AI". Never em dashes. Sentence case. Plain verbs.
- One word per thing (glossary above). Buttons name the action ("Log spend", "Add a payment").
- Errors say what to do. No jargon (Eker, allocation, unassigned) without a plain explanation.
Learned from Mako: never em dashes; minimal; plain.

## 7. Regression runner
(Mako, 2026-11-19, cost rule 8: no separate agent for this role any more. The caller pastes the output of `./check.sh full` for the build; it runs every script below. The art director likewise runs only when art files change, cost rule 7.)
- Scenario script: tests/qc/scenario_yen.js, a yen plan shaped like Mako's with made-up numbers (a month that plans more than the pay, a small bank, a bill past its plan; and a healthy variant that must say 'You are okay' with an empty error log). Every expected figure is worked out by hand in the file. Run it before any Home change. Mako checks his own real numbers himself (no real figures in the repo, decision 9).
- ./artcheck.sh must end "ART CHECK PASS". ./check.sh must end "GUARD ALL PASS" and "ALL GOOD". Never rebuild while it runs.
- Fresh load with empty storage and with a filled plan: zero page errors.

- Number audit (38.25): `node tests/qc/fuzz_model.js 4000` (model rules) and `node tests/qc/home_dom.js 120 <seed>` (the screen against the model). Run both after any change to model.js, ui6.js or burrows.js.
- The fast check misses number checks. Run `./check.sh full` before every deploy. Tests must set S.ui.toured or the tour hides the screen. When a test fails, first decide if the app changed on purpose (update the test) or broke (fix the app).

## Process for every big task (Mako's standing rule)
1. The first thing on any big task: set a resume timer (send_later) with a self-contained message of the state and the plan. Do not ask; assume it is wanted.
2. Tell Mako in one line that the timer is set. Cancel or replace it when the task is done.
3. If a limit is hit, the timer wakes the session and work continues from the plan without waiting for him.

## How to update this file
Mako's feedback arrives in chat. Put the lesson, in one line, under the right reviewer's "Learned from Mako" list; if it is a new kind of check, add it to that reviewer's list; if no reviewer owns it, add a reviewer. Copy this file into the project (claude/burrow-qc-roles.md) after changes. Each role is also a project subagent in .claude/agents/ (qc-*.md) that reads its section of this file, so a lesson added here reaches the agent with no other change.

## Lessons from 38.26
- Novice: a first-time user does not know what APR means or that setup never asked about a card. Ask about cards and loans after setup (Next card), take the rate per month or per year, and keep the old "Pay off a debt" goal only for balances with no interest.
- Regression: tests must set `sessionStorage.__keep` to keep saved state across a reload; `persist()` saves after 500 ms, so wait before reloading. Test helpers walk the long setup (`#tourFull`) unless told otherwise.
- Wording editor: Plan says "About X a week, planned." and Home says "X a week for the N days left." They answer different questions.


## Visual first (2026-11-17, from Mako)
Every reviewer asks: could this be shown as a picture, a pile of coins, a filling burrow, or a moving coin instead of a number or a sentence? If yes and it is not, that is a defect. Numbers sit under a picture, never instead of one. Function first; simple art is fine.

## Added in 38.31: what every role runs, every time

No role may report on a build until `bash tests/verify.sh` has printed `VERIFY OK` for that exact build. Paste its last ten lines at the top of your report. A report without them is not a QC report.

The numbers role also owns three files and keeps them true:

- `tests/qc/display_math.max` only ever goes down. The goal is 0.
- `tests/qc/display_math.allow` has a reason on every line. A line with no reason does not count.
- When Mako gives feedback about a number, add the situation to the six in `QC_NUMBERS.md` so it is checked on every release from then on.
