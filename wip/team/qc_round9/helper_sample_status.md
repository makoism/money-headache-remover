# Helper note: Home status with sample numbers after logging past the plan

Open note from number gate round 8, finding 3 (RESUME "Open, small"). Checked on wip-38.31 at 167e225. No app change made.

## What Home shows

Sample numbers on, clock 20 Nov 2026, receipts Free to spend 25,000, Food 41,000, Other 3,000 (made-up numbers, the same as qc23_over_names):

- Message after logging: "Logged. Free to spend is ¥5,000 over, Bills and basics are ¥10,000 over, Other is ¥3,000 over for this month." Every place is named with its amount.
- Home status (renderStatus, #hStatus): chip "Sample numbers", line "These numbers are made up: do the step below to put yours in". Nothing is named.
- Home cards: "Bills and basics ¥79,000 left to pay, ¥10,000 over" and "Free to spend ¥5,000 over". Bank at month end ¥67,500 (85,500 less 18,000). Other's ¥3,000 is not named anywhere on Home once the message has gone; it is only inside the bank figure.

With own numbers the same status line names every place past the plan with its amount (Bills and basics lines, Free to spend, Other, Investing, Education, Giving, from the month's overBits). qc23_over_names passes on this build.

## Why the app was not changed

The sample branch in renderStatus is a deliberate stand-in, not a missed case. In sample mode the status box gives no verdict on the month at all, only the sample notice and the next step. Every verdict part of the box is switched off with sampleOn():

- the "Over plan" / "You are okay" words and the over list are in the `m.status === 'good'` branch, which sample mode never reaches (it is tested first);
- "bank below zero today" (nowNeg) is off in sample mode;
- "Covered this month by ... from your emergency fund" (borrowCover, QC round 8 north-star gate 1) is off in sample mode;
- "Coming up" / "The next 3 months look fine" is off in sample mode;
- "How is this worked out?" is off in sample mode.

Adding the over names only would put one verdict sentence into a box that is built to say only "these are made up". It is a wording and layout choice, so it goes to Mako's run.

## For Mako's run

With sample numbers on, should Home's status box name the places past the plan (for example "Other is ¥3,000 over") under "Sample numbers", or keep the sample notice only? Today a sample-mode person who logs into Other sees it named only in the message after logging, which goes away.
