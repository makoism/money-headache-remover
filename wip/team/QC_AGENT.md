# The independent QC agent (final gate before every release)

Rule from Mako (2026-11-17): every release goes through a separate agent that knows only the app's purpose and rules, as the last check. It does not see how or why the change was made. A fail is fixed or brought to Mako, then the agent runs again.

## What the agent is given
1. NORTH_STAR.md (purpose, north star, visual-first, how to use it).
2. The build to inspect (a single html file) and the preview helper (a ready phone/desktop screenshot script).
3. Nothing else: no plan, no changelog, no test results.

## What it checks (each is a PASS or a FAIL with the rule it breaks)
- North star: in 10 seconds can a stranger see where all the money is, where it stocks up, what is safe to spend? Does the picture add up and say how fresh it is?
- Visual first: is any number or sentence doing a job a picture should do? Does it work as a picture a kid could read?
- Fresh eyes: a person who knows nothing about budgeting: do they know why this exists, what each number means, and what to do next?
- Wording: plain, like a manual, no jargon, no em dashes, the agreed words only (Burrow for any place money piles up, goal for the amount it aims for, Chest only as the Free to spend picture, This month, Bills and basics, Free to spend, Burrows, Investing, Giving, Pay day, Take out).
- Nothing lies or breaks: no clickable thing that does nothing, no overlap or cut-off text on phone and desktop, no visible error, no number that contradicts another number on the same screen.
- Safe with data: nothing in the visible flow could lose or overwrite a person's data without warning.
- Art: nothing drawn over words, one pixel size, palette colours only.

- Hand-holding (Mako, 2026-11-19, see "Why this exists" in NORTH_STAR.md): on every screen, would a person who never learned about money know what it means, why it matters to them and what to do next, without asking anyone? Is it one thing at a time? Where something is not obvious, does it explain itself on the spot, mindset first and then function? A screen that needs a teacher to understand is a FAIL.

## Jobs that must be finishable (the build fails the gate if any one cannot be finished through the screens alone)
Looking at screens is not enough. Do each job in a browser as a person who never learned about money: look, tap, type. No console, no reading code, no editing storage, no test hooks. Use made-up numbers on empty storage. If you get stuck, that is a FAIL: name the screen and quote the words on it where you gave up. List each job as DONE or STUCK above the verdict.
1. Setup to a true Home: from the first open, finish setup (pay, rent, food). Finished when Home shows your numbers, not sample ones, and you can state what is safe to spend and why.
2. Check your bank: on Home, type what the bank app shows today. Finished when Home shows that figure with its day, one name per figure, and nothing on Home contradicts it.
3. A card paid in full: on Home, add a card (name, what is on it, the day you pay it). Finished when you can state from the screen what the bank holds after the cards are paid.
4. Log and fix a spend: log one spend from Home in under 60 seconds, find it in Receipts, fix a typo in it with Edit. Finished when Receipts shows the corrected amount once and Free to spend moved by it.
5. Move numbers to another phone: phone A, Settings, Cloud copy, turn it on and read the recovery code off the screen. Phone B (a separate, empty browser profile), welcome screen: enter the code, find the copy, load. Finished when every figure and receipt on B matches A.

Job 5 needs a server; a `file://` page cannot do it. In your own script: `process.env.BUILD = '<build path>'; const C = require('<repo>/wip/team/tests/qc/cloud_lib.js'); const srv = await C.server();` (a made-up local server that serves the build; nothing leaves the machine), then `const A = await C.profile(srv.url, { tour: true })` and the same for B: each is its own browser with empty storage at 412x915, with the page at `.p`. With Playwright instead: one `browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })` per phone, never shared. You may read the head comment of `cloud_lib.js` and nothing else in `tests/`.

## Output
`VERDICT: PASS` or `VERDICT: FAIL`, then a list: rule broken, where (screen and size), what is wrong, a suggested fix. No praise, no summary of the build.

## How to run it
Spawn a fresh agent with only the above (never a fork). Run it on the exact file that will be deployed, after the check suites pass. On FAIL: fix or ask Mako, rebuild, run a new fresh agent.

## Two agents, always together (Mako, 2026-11-17)
Every release and every step runs this agent AND the number-logic agent (QC_NUMBERS.md) at the same time, each a fresh agent on the same finished build. Both must pass before anything ships. The number-logic agent checks that every number is right in every situation (typos, overspending, missing input); this agent checks the north star, wording, visuals and safety.

## Added in 38.31

- The page now proves its own total. On Home, under "Where your money sits", look for "They add up: what you started with, plus your pay, less what is planned and spent, comes to the same total." If instead you see "These numbers do not add up", that is a FAIL however good the rest looks.
- When emergency-fund money pays for part of a month, the Plan tab must say so in words a person with no finance background understands: a "Borrowed" row, and a sentence saying why the places add up to more than all of the pay. If the percents add up to more than 100 with no explanation, FAIL.
- You judge clarity and safety. The number-logic agent judges arithmetic. Do not pass a build because its numbers look plausible; say what a first-time person would understand from each number.
