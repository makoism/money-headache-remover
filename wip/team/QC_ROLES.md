# QC panel for the burrow

> North star: read NORTH_STAR.md first. Every change is judged by it.

Every build goes past these reviewers before Mako sees it. Each reviewer is a separate agent that has not seen the work being made, and each checks only its own list. Run them in parallel, fix every BLOCKER, then re-run the ones that failed. Whenever Mako gives feedback, add it to the matching reviewer's "Learned from Mako" list the same day, so the same miss never repeats.

Report format for every reviewer: BLOCKERS (wrong, broken, data at risk), CONFUSING (exact text and place, with a replacement), POLISH. Under 600 words. Screenshots in /tmp/qc/<role>/.

## Shared glossary (one word per thing, everywhere)
- Burrow: money that piles up over months (emergency fund, trip, home, yearly cost, debt). Never "goal card" in user text except on the Goals list.
- Treasure chest: money for this month (Necessities, Free to spend, Education, Give). Resets monthly.
- Free to spend = play money. Show "Free to spend (play money)" at least once on Home; Log spend category stays "Play money".
- Financial Freedom: invested and never spent. Only grows.
- Paid off / still owed for debt. Full / saved for everything else.
- Pay, bills, jars. No "income", "allocation", "liabilities".

## 1. Novice (knows nothing about budgeting)
Pretend to be a 25 year old sent the link by a friend. Walk the whole tour and every page.
- Within 10 seconds: what is this for, and what do I do first?
- Every term explained where it first appears. Every number says what it means and what to do next.
- Burrows vs chest is obvious. No leftover words from older cards.
- No dead ends, no screen where the only way forward is a term they do not know.
- Empty states invite an action. Sample numbers are always labelled as sample.
Learned from panel (38.21): debt must read paid off / still owed everywhere (use dw/dwr in model.js for any new goal wording); every number a novice sees needs a one-line purpose; sample numbers labelled on every page; tour verdict must use the same rule as Home status.
Learned from Mako: run it as someone who does not know budgeting or finance; check the info is there for why they use it, what each number means, what it is for.

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
Learned from Mako: accuracy and stability first. Nobody loses data.

## 3. Data safety
- Saved plans survive upgrades (no migration that drops fields), reloads, back in the tour, closing mid-step, offline, two tabs.
- Undo works for money moves. Backup and restore round-trip.
- Deleting anything asks first and says what is lost.
- Nothing writes the API key anywhere; INVITE_CODES stays a dashboard variable; repo is PUBLIC so no secrets in it.

## 4. Layout and touch (phone 390x844 and desktop 1300x900, also 320 wide)
- No overflow, clipping, overlap. Fixed Ask and Help pills never hide a button or text the person must reach (leave bottom padding).
- Tap targets 44px or more. Contrast passes in light and dark. Long names and long numbers wrap or truncate cleanly.
- Keyboard order and focus visible. No console errors.
Learned from panel (38.21): Ask and Help pills hide while the tour or a burrow is open; tap targets under 44px on tabs, sub-tabs, small buttons still open; light theme contrast over the forest is poor (about 2:1) and needs a decision.
Learned from Mako: decoration must not get close to text; everything needs breathing room.

## 5. Art director (ART_GUIDE.md is the law)
- Number one rule: anything added must flow with what it is added to (corner-grown, an accent, not on every card, each its own kind, never near words).
- World rule: nothing superimposed; it is painted into the scene.
- Palette ramps only, flat tones, no gradients or blur, no black outlines on living things, big pixels, one light model; run artcheck.sh.
- Green nature look. Consistency across burrows, chest, scene.
Learned from Mako: vines too thick and too same-y; subtle, tasteful, varied; keep the purple wisteria; squirrel must be Elthen's sprite.

## 6. Wording editor
- Minimal wording like a manual. Never "too AI". Never em dashes. Sentence case. Plain verbs.
- One word per thing (glossary above). Buttons name the action ("Log spend", "Add a payment").
- Errors say what to do. No jargon (Eker, allocation) without a plain explanation.
Learned from Mako: never em dashes; minimal; plain.

## 7. Regression runner
- Scenario scripts live in tests/qc: good1.js (healthy plan must say 'You are okay', no error log), mako_scenario.js (real yen numbers: Nov left -41,918, bank 1,010, free to spend 26,010). Run them before any Home change.
- ./artcheck.sh must end "ART CHECK PASS". ./check.sh must end "GUARD ALL PASS" and "ALL GOOD". Never rebuild while it runs.
- Fresh load with empty storage and with a filled plan: zero page errors.

- Number audit (38.25): `node tests/qc/fuzz_model.js 4000` (model rules) and `node tests/qc/home_dom.js 120 <seed>` (the screen against the model). Run both after any change to model.js, ui6.js or burrows.js.
- The fast check misses number checks. Run `./check.sh full` before every deploy. Tests must set S.ui.toured or the tour hides the screen. When a test fails, first decide if the app changed on purpose (update the test) or broke (fix the app).

## Process for every big task (Mako's standing rule)
1. The first thing on any big task: set a resume timer (send_later) with a self-contained message of the state and the plan. Do not ask; assume it is wanted.
2. Tell Mako in one line that the timer is set. Cancel or replace it when the task is done.
3. If a limit is hit, the timer wakes the session and work continues from the plan without waiting for him.

## How to update this file
Mako's feedback arrives in chat. Put the lesson, in one line, under the right reviewer's "Learned from Mako" list; if it is a new kind of check, add it to that reviewer's list; if no reviewer owns it, add a reviewer. Copy this file into the project (claude/burrow-qc-roles.md) after changes.

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
