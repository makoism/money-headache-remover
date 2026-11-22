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
