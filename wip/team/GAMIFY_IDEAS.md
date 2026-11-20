# Rewards for keeping your money picture up to date (draft 3, the simple version, 2026-11-20)

Status: ideas only, nothing built. Mako liked the approach (20 Nov) and asked for it simpler, so anyone with zero context gets it at first glance: what the prizes are, how to get them, and why. Draft 3 is the simple version on top; the reviewed details from draft 2 are kept underneath for whoever builds it.

## The whole thing in three lines

1. **Your burrow shows your real money.** More saved, more gold in the burrow. It goes down when money comes out, because it is the truth.
2. **Lanterns show your weeks.** Each week you check in, one lantern on the path lights up.
3. **Neighbours move in when you keep the habit.** Each one brings a gift for your burrow, and they stay for good.

The prizes are for keeping your money picture up to date, never for how much money you have. Someone on a small pay gets every neighbour as fast as someone on a big one.

## How a person with zero context finds out (no reading needed)

- **Every prize shows how to get it, right where it will be.** An empty house next to the burrow has a little sign: "Someone moves in after 3 weekly check-ins. You have 1." Tap it to see who.
- **The next lantern is the only unlit one, and it glows softly** until you check in this week. Tap it: "Check in once a week to light it. Logging receipts or tapping Nothing to log both count."
- **The first time the world opens, one short line:** "This is your money as a place. The gold is your real money. The lanterns and neighbours are for checking in every week."
- **When a neighbour arrives,** a light comes on in their window and one line says why: "A rabbit moved in. You checked in 3 weeks."

## The only things that earn anything

- **Check in once a week** (log receipts, or tap Nothing to log). This lights the lantern.
- **Check your bank** (type what your bank says). Some neighbours want this one.
Nothing else, to start. More habits (pay day, closing the month) can come later.

## The neighbours (the prize list, in order)

| Neighbour | Moves in when | Brings |
|---|---|---|
| Rabbit | 3 weekly check-ins | a lantern for your door |
| Owl | your bank checked 4 weeks | a window for your burrow |
| Beaver | a goal reached | a bench |
| Hedgehog | 13 weekly check-ins | a garden patch |

## What never happens

- No shop, no points, nothing to buy, nothing for real money.
- Nothing is taken away for a missed week. A missed week leaves one lantern dim (never red), and one missed week a month keeps it lit.
- Prizes never change a money number, and nothing sits on top of the gold.

## Later, only if people want more

The month tree (a leaf for every month you close), more neighbours, and clothes for the squirrel. Weeks covered ("Your Emergency fund covers 3 weeks if pay stops") as the one number in the world, once it is defined in the money model.

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
