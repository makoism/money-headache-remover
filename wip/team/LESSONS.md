# Lessons (read before planning or building anything)

Each lesson is a real moment in this project, written down so it is never repeated. Read them like history: what happened, why nobody saw it, what it cost, and the signs that would have warned us.

---

## Lesson 1: The calendar month (found 23 Nov 2026)

### What happened
The Burrow's money engine was built on calendar months: every month ran from the 1st to the last day, starting from one balance pinned to "the bank on the 1st, before pay". Pay, bills and card payments were monthly totals with no dates, and the plan was counted as if it had happened.

Nobody lives like that. People are paid on the 10th, the 25th, twice a month, every two weeks (some months get three pays), weekly, or whenever work comes in. The only bank figure anyone can see is what their bank app shows today. So the app showed two bank figures, counted pay twice for anyone who set up after pay day, judged "safe to spend" only at month end, planned about 8% too much pay for people paid every two weeks, took card spending out of the bank in the wrong month, grew goals in months with no pay, and would have frozen on October 2028.

### How it was found
Mako asked when version one would be ready. Two questions were brought to him ("Check your bank vs the plan's start figure", "a loan counted twice"). He said: zoom out, why can this problem happen at all? Then: "Planning each month from your bank on the first doesn't make any sense. Each person has a different payday and pay cycle. This is the thing I said to think about before we started: the user experience, how people would use it and what they would run into."

### It was not unknown. It was buried.
- **17 Nov.** The north star: "The picture must tie to reality: what the app shows adds up to what is really in the person's accounts."
- **19 Nov.** Mako wrote down his own money (DECISIONS.md): pay on the 10th, two cards paid in full on the 10th and 11th, and "the month should follow his pay day, not the calendar".
- **19 Nov.** Two side sessions designed the fix: PAYDAY_DESIGN.md (the month runs from one pay to the next) and LEDGER_DESIGN.md (dated events, accounts, a check of the bank). Both stayed on side branches.
- **19 to 20 Nov.** The launch checklist filed the pay day as a "team" item, not a v1 item, and as a "feature gap, waits for Mako". A rule that "experience calls wait for his full run" then parked it beside layout and wording questions.
- **QC rounds 4 to 14.** The north-star reviewer failed the build on "two bank figures" in almost every round. Each time it went into MAKO_RUN as a question for Mako. Nine rounds of fixes polished wording, layout and percents on top of the calendar engine.
- **23 Nov.** Found. Five independent reviews then showed the whole money engine needed rebuilding: about 200 to 280 hours, and version one moved from 25 Nov to early December.

### Why nobody saw it
1. **A fact was treated as a taste question.** "The month follows his pay day" is a correctness fact about Mako's money. It was filed with "which word do you prefer" questions and parked.
2. **The work queue came from findings on the current build.** QC checked the build against its own rules and against itself. Nobody checked it against the real lives it is for, so every round made a wrong base more polished.
3. **The same finding came back round after round and was never traced to its cause.** Each time it was a "question for Mako", never "why does this keep happening?".
4. **The fix lived where the builder did not look.** The designs were on side branches, outside the main session's reading list.
5. **Progress was measured on the wrong thing.** "About 84% ready" counted passing checks on a base that could not be right.
6. **Questions to the owner were symptoms, not causes.** When Mako was asked, he was asked about the symptom, with options, instead of being told what was wrong underneath.

### What it cost
About two weeks of the build schedule, a full engine rebuild, and Mako's trust that the team thinks before it builds.

### What changed so it does not happen again
- **qc-foundation** (.claude/agents/qc-foundation.md): walks real lives (paid on any day, every two weeks, weekly, freelance, a couple, cash, set up mid-month) through the engine and the saved data. It runs on every plan before building starts and on every QC round. It ignores wording and layout.
- **Every fact Mako states about his own money becomes a failing test the same day.** No build is a version one candidate while one is red.
- **Before building: read the foundation review, DECISIONS "Mako's own money", and every design for the area on side branches** (RESUME section 2).
- **A finding that comes back twice is traced to its cause before it goes anywhere else.**
- **Owner questions are asked at the level of the cause, with a recommendation.** Never bring Mako a symptom with a menu.

### Warning signs to watch for (if you see one, stop and zoom out)
- The same reviewer finding in two rounds in a row.
- A question parked for the owner that is really about whether a number is true.
- Two figures on one screen for one thing.
- A design or decision that exists somewhere but not in the main build.
- A percentage of "done" going up while one gate keeps failing.
- A plan built from "what the current build gets wrong" rather than "what the person needs".

---

## Lesson 2: Fixing the case, not the cause (found 23 Nov 2026, the same day)

### What happened
A sweep of every QC report from rounds 4 to 14 (foundation_review/sweep2_repeats.md) found eleven findings that came back in seven to eleven rounds each. Each time, the one case a reviewer saw was fixed, or the question was parked for Mako, and the next round found the same thing somewhere else:
- screens giving different verdicts on the same money ("On plan" next to "not safe yet"), about 11 rounds;
- one figure with several names and one name for several figures, about 10 rounds;
- the same amount written two ways ("$180" and "$180.00"), 7 rounds;
- messages piling up and covering buttons, about 10 rounds;
- sample numbers mixing with the person's own, about 10 rounds;
- typing into a box adding to the old value instead of replacing it, 4 rounds;
- checks that printed a failure and still said "ALL GOOD", 7 rounds.

### Why
Each has one missing piece underneath: no single status that every screen reads; no table tying each label to the figure it names; no single amount formatter; no single message queue; no record of which values the person typed; no shared behaviour for input boxes; a check script that retries and summarises. Without the piece, every screen wrote its own version, and every fix was local.
A second cause: most reviewer briefs forbid reading DECISIONS.md and MAKO_RUN.md, so every fresh reviewer raised the parked items again, and the parked list (about 50 entries) never reached Mako.

### What changed
- When a finding appears for the second time, the fix is the missing shared piece, never the case. The case gets a test; the piece gets built.
- The screen layer of the new foundation includes those pieces (one status, a name table, one formatter, one message queue, typed-or-sample on every value, one input behaviour) before the screens are wired to the new engine.
- Reviewer briefs say which decisions are settled, so a settled answer is not raised again as a finding.
- A check run that prints a mismatch or a failure is a failure. No summary line may say otherwise.

### Warning sign
A fix commit that names one screen for a finding that was seen on another screen before.

---

## Lesson 3: Count coverage, do not sample (found 23 Nov 2026, the same day)

### What happened
While rebuilding the base, five reviews in a row each invented their own situations and each found new gaps: same-day order, card statements, fees, loans, two devices. Every round felt thorough, and every round the next reviewer found more. The sixth review drew a grid instead: every kind of record against every situation that changes its effect (check day, opening, posting window, period start, other currency, two devices, undo, edited after settled, imported or typed, closed account). It found in minutes that the core loop for people who never log spending was wrong: the gap found at a check-in never counted as spending, so safe to spend stayed full while the money was gone. Hundreds of passing cases had never asked it.

### Why
Invented situations follow what the reviewer happens to think of. Passing tests say nothing about what nobody tested. Without a count, there is no way to know when to stop, and the most ordinary case can be the one nobody picked.

### What changed
- Reviews of the foundation build and keep a coverage grid (record kinds by situations), with each cell marked covered (the test named), not applicable, or uncovered. foundation_review/final_review_3.md has the first one.
- An uncovered cell that matters to a person gets a test, even when reasoning says it is fine.
- The foundation is ready when every applicable cell is covered and passing, not when a review finds nothing.

### Warning sign
"We tested a lot" with no number for what was not tested.

### Addendum to lesson 3 (confirm_review_4, 23 Nov)
The fourth confirming review found tests whose inputs had been changed so a rule would not trigger (mg-96 to mg-99, mg-109), instead of asking whether the rule was right. The rule then hid a real fault: anyone away from the app for more than a day had every later time stamped in the past. Warning sign: a test input adjusted to "avoid" a rule. When a rule gets in the way of a natural input, question the rule first.
Second addendum (confirm_review_5, 23 Nov): every test named schedules and places with short made-up ids ("pay", "trip"); the app never makes ids like that, and with real ids the phantom-pay guard never fired. Test inputs must look like real data. A permanent check now reruns everything with realistic ids.

---

## Lesson 4: The spec spiral (found 23 Nov 2026, evening)

### What happened
After lesson 1, the team set out to make sure nothing fundamental could set us back. In one day that grew into 762 hand-worked asks, 812 rule cases, 49 decision sections (A to AW), eight confirming reviews, a two-device fuzz and three copies of the same rules (a reference model, the engine, an independent checker), most of it for lives and features after version one (couples, two currencies, merging phone and desktop). Mako still had nothing he could try. He asked why it was taking so long.

### Why
1. **"Nothing fundamental may set us back" was read as "every behaviour must be specified now".** Only the saved shape has to hold everything (that is what avoids a data move). Engine behaviour for later stages can be built later on the same shape.
2. **Review rounds ran one after another through one session,** and each round was allowed to add scope. Every round found something, so there was never a point to stop.
3. **The same rules lived in three places,** so every decision cost three edits and a round of checks.
4. **Working software came last.** Nothing reached Mako to tell us what mattered.

### What changed
- Build in thin slices that reach Mako: his own shape end to end first, behind the switch, then widen.
- One engine. The reference model is frozen as the spec, and one independent checker compares against the engine.
- The saved shape holds every stage. Behaviour for stage 2 is labelled and left for later.
- A review may add a test only for the slice being built. Anything else goes on a list.

### Warning signs
- A day of work with nothing new that Mako can open.
- The same rule edited in more than two files.
- A review round whose findings are mostly about a later stage.
