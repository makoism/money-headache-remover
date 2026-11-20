# Rewards for logging every week (draft 4, after two review rounds, 2026-11-20)

Status: ideas only, nothing built. Mako liked the approach and asked that anyone with zero context gets it at first glance. Draft 3 went to all seven reviewers with Mako's words; this is what came back, made simpler. Where the builder details further down disagree with this part, this part wins.

## The whole thing

1. **The gold in your burrow is your real money.** It is exactly the Saved amounts Home shows, nothing added, so it goes up when you save and down when money comes out. It is a picture, not a prize.
2. **Each week you log, a lantern on the path lights up.** Logging means tapping Log spend or Nothing to log. Why: when your numbers are up to date, nothing about your money is unknown.
3. **Every few lit lanterns, a neighbour moves into the empty house.** You can already see their shape in the dark window. They bring a gift for your home and stay for good.

That is all. One thing is counted: lit lanterns. Never money, so someone on a small pay gets every neighbour exactly as fast as someone on a big one.

## What a person sees (pictures first, words only when tapped)

- **First time:** "This is where your money lives, and the gold is your real money." Second line: "Log each week to light a lantern, and neighbours move in as you keep going."
- **The path:** posts from the burrow door. Lit ones are warm, the next one glows softly until you log this week, the rest are "not lit yet" (dim wood, never red, never "missed").
- **The empty house:** dark, a shape in the window, lantern dots under it (1 of 3 lit). Tap: "Log 3 weeks and a rabbit moves in. You've done 1."
- **A neighbour arrives:** their window lights up, the gift sits by the door. "A rabbit moved in because you've logged 3 weeks, and it brought a bench."
- **The first time gold goes down:** "Gold goes down when you spend. That is normal."

## The neighbours

| Neighbour | Moves in at | Brings |
|---|---|---|
| Rabbit | 3 lanterns | a bench |
| Owl | 6 lanterns | a window for your burrow |
| Hedgehog | 13 lanterns | a garden patch |
| More later | every 13 after that | to design with Mako |

Lanterns count in total, forever. A week you did not log is simply "not lit yet"; nothing goes out and nothing resets.

## Promises (never broken)

- Nothing to buy, no points, no shop, nothing for real money.
- Nothing you earned is ever taken away: loading a backup, the cloud copy, Zero all, its Undo or a second phone only ever add lanterns, never remove them.
- If you undo the log itself right away, that week's lantern goes back to not lit yet (it never really happened). A neighbour moves in only after that Undo chance has passed, so Undo never sends one away.
- Prizes never change a money number. The gold never shows a figure Home does not show, and nothing covers it.
- Sample numbers, imported statements and a changed clock light nothing.

## Cut, after review

The beaver ("a goal reached": it could be earned by typing a goal as already full, and it is faster on bigger pay), the owl for bank checks (a second counter with no picture), the "one free missed week" rule (it showed a lantern lit for a week nobody logged), the month tree, clothes for the squirrel, weeks covered (kept for later, defined below).

## Open for Mako

- "Burrow" now means two things (the whole home and each savings place). One word for the home, or keep both?
- One word for what a neighbour brings: "gift" is used here.
- The Nothing to log button: reviewers suggest "I spent nothing since <date>", so nobody lights a lantern with spending left out. That is a copy-pass row.

---

# Details for the builders (draft 2, after seven reviewers)

Status: ideas only, nothing built or queued. The 3D world itself waits for Mako (WORLD_3D.md). Draft 1 went to seven reviewers, all seven answered (north star, beginner, money accuracy, data safety, art director, voice, efficiency); this draft takes in their notes. Their reports were in /tmp/qc/<role>/IDEAS_REPORT.md (not kept in the repo).

## The idea in one line

The squirrel gathers every week you check in, and the world fills up with real money and with neighbours who move in because of your habits. Nothing in the world is bought, and nothing that piles up is pretend money.

## Two kinds of things in the world, never mixed

- **Pictures of your real money, always true.** Gold coins in each burrow, the Emergency fund pile, a dark debt burrow with one window lit as it is paid down, goal burrows filling. They go down when money comes out, because they are the truth, not a prize.
- **Keepsakes, earned by habits, never taken away.** Neighbours who move in, things for the squirrel and the burrows, leaves on the month tree. They arrive at habit milestones. There is no shop and no acorn count (reviewers: a second currency in a money app gets mixed up with savings, adds a number, and feels like a mobile game).

## What earns a keepsake: habits, never amounts

The north star is "nothing is unknown", so what counts is keeping the picture true and coming back, even when the news is bad.

- **Start with two habits** (the beginner reviewer: six is too many at first): the weekly check-in (log receipts or tap "Nothing to log") and Check your bank.
- **Later:** pay day with every coin given a place, and answering the month-end question.
- Every honest log counts the same, over plan or under. No special reward for overspending, and no reward for using the Emergency fund (a one-time note "The fund did its job" instead, so nobody drains it to earn something).
- Never for the amount of money you have: unfair across incomes, shaming in a hard month, and it tempts a bigger number than the truth.

## The headline number: weeks covered

"Your Emergency fund covers 3 weeks if pay stops." Works on any income and is what savings really buy.
- It is a money figure, so it lives in the money model with its own oracle test, never in screen code.
- It says "not known yet" until enough weeks are logged to know what a normal week costs, says how fresh it is, and shows zero as an empty pile with a next step, never a bare "0 weeks".
- Picture: the Emergency fund burrow with gold stacked in uneven rows, one row per week covered. You count by looking.
- Exact definition: see "Money accuracy" below.

## Streak that never punishes: the lantern road

- One lantern lit for each week you check in, on the road to the burrow, painted into the scene (never a strip or a counter on top).
- Skip one week a month and the lantern stays lit.
- A missed week leaves one lantern dim (never red) and never resets the count. What counts is weeks this season.
- In the 2D app this is the existing week streak changed so a miss never resets it; the road is a picture for the 3D world.

## Neighbours who move in (the strongest idea, per four reviewers)

Each arrives with a small moment (a light comes on in a window), then lives in the background, at most two or three in front.
- A first neighbour early, after 3 check-ins, so there is something to come back for soon.
- An owl after a month of Check your bank.
- A beaver when a goal is reached (the goal burrow's fill can drop later; the beaver stays).
- A hedgehog after 13 weeks checked in (a habit, not an amount).

## The month tree

A leaf for every month you close. Season colours only (green, gold, russet), never red or dead. A month not closed yet is a bare twig, and closing it later grows the leaf. Tapping a leaf opens that month. Nothing is ever taken off.

## Things for the squirrel and the burrows

Scarf, lantern, small backpack, rug, plants, door colour, bench, lamp post, weather vane: given at milestones, drawn on the sprite grid in the palette. Nothing given may cover a coin pile, the Emergency fund or the debt burrow.

## Data rules (data safety review)

- Everything lives inside the one saved copy (same key, backup file, restore and cloud copy), so money and world always come back together.
- A small add-only log of habit events ({id, kind, week, at}) is written in the same step as the action; keepsakes are worked out from it, never stored as a counter. Deleting or editing a receipt later never removes a keepsake.
- One event per kind per week, so two phones never double a week. Imported statements, samples and a changed clock earn nothing.
- Older builds must keep fields they do not know when they save, so an old phone can never wipe the log.
- "Zero all" clears money only. Leaf colours are worked out again from the model; only "month closed" is stored.
- Kept private. Nothing is shared.

## Money accuracy

**Weeks covered, exactly:** W = whole weeks of C / N, worked out once in model.js in whole cents (whole yen).
- C = the Emergency fund at the end of the month Home shows (after any borrowing) plus that month's bank at month end above the safety minimum; never below 0.
- N = a normal week: the month's planned Bills and basics plus minimum card and loan payments, times 12, divided by 52. Leaves out one-time costs, Free to spend, other goals, Investing, Education, Giving.
- Pay is not used, so "no pay" still works. No bills yet: no number and "Add your bills to see weeks covered", never 0, Infinity or NaN.
- It says it is planned, with the date the bank was last checked ("bank checked 18 Nov", or "bank not checked yet").

**Other money rules for rewards:**
- Check your bank counts for typing a figure dated today, once a week, the same for any value, never compared with the plan (so nobody is paid to copy the app's figure).
- The beaver comes only when a goal was at 100 percent in a month already over, once per goal, never in a month its target was lowered.
- One check-in per week counts, the same on plan or past it; editing or deleting a receipt never changes it, and a backdated receipt never lights a past lantern.
- A leaf keeps the colour its month had on the day it was closed, using Home's own words: over, tight, on plan.
- Pictures read the exact fields Home shows. A bank below zero is an empty pile next to Home's amber line, never a negative or hidden pile.
- Weeks run Monday to Sunday on the phone's clock and count from the setup day, so a new person reads "1 of 1", never "1 of 13".

## Order, cheapest first (efficiency review)

1. Now, free: once Mako uses v1, read his own backup after about 4 weeks to see whether he checks in weekly. No tracking that sends data out.
2. Docs only, about 2 hours: define weeks covered on paper next to the ledger design, proved on made-up examples.
3. After the ledger (B1), about 1 day: weeks covered in the money model with an oracle test. Mako judges it by using it.
4. Step C, about half a day plus tests: the existing week streak stops resetting on a miss (weeks this season, one free skip a month), with a test that old saved weeks load the same.
5. B2 or later, 1 to 2 days: milestone keepsakes worked out from the habit log, as a short 2D list.
6. 3D only, and only if 1 to 4 show people coming back: lantern road, neighbours, month tree, things for the squirrel. About 1 to 2 weeks on top of the 4 to 7.
Cut: the shop, acorns, sharing.

## Questions for Mako (for the art step, with designs in front of him)

1. Squirrel, or another creature?
2. Which neighbours, and which milestones?
3. Is weeks covered the number you would want to see?
