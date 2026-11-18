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
- Wording: plain, like a manual, no jargon, no em dashes, the agreed words only (Chest, This month, Bills and basics, Free to spend, Burrows, Investing, Giving, Pay day, Take out).
- Nothing lies or breaks: no clickable thing that does nothing, no overlap or cut-off text on phone and desktop, no visible error, no number that contradicts another number on the same screen.
- Safe with data: nothing in the visible flow could lose or overwrite a person's data without warning.
- Art: nothing drawn over words, one pixel size, palette colours only.

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
