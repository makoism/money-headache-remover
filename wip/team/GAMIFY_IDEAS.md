# Rewards and keepsakes for the 3D world: ideas (draft 2 for Mako, 2026-11-20)

Status: ideas only, nothing built or queued. The 3D world itself waits for Mako (WORLD_3D.md). Draft 1 went to seven reviewers (north star, beginner, money accuracy, data safety, art director, voice, efficiency); this draft takes in their notes. Their reports were in /tmp/qc/<role>/IDEAS_REPORT.md (not kept in the repo).

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

(The money accuracy reviewer's exact definition of weeks covered goes here.)

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
