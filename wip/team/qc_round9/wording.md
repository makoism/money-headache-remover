# QC round 9, Wording editor: FAIL (one blocker)

Saved by MAIN 13 from the agent's reply. Build 377733e, VERIFY OK, golden 0 differ vs 3831zb. No em dashes, no banned words on any screen.

## Blocker
1. Settings, Saved data: "Your numbers are saved in this browser on this device only... Neither one moves to other devices." while the Cloud copy panel says "Every change you make is sent to the cloud copy by itself." Also Settings, Reset and setup, "They're saved in this browser only and nobody else sees them", and setup Currency step, "Your numbers stay in this browser". False when the cloud copy is on. Replacement: "Your numbers are saved in this browser. If Cloud copy is on, a locked copy is also sent to the Burrow's server."

## Confusing
2. Plan, Month, Details: "Left $854.75" while the bars say "Not placed yet $792"; elsewhere one number is called both "Left ¥65,000" and "Not placed yet ¥65,000". One name, or explain the gap ("$792 not placed yet plus $62.75 spent over plan").
3. Home: "Your bank now is ¥412,000, ¥393,600 after the cards are paid, so the two can differ." reads wrong; suggest "This plan starts from ¥412,000. After the cards are paid your bank will be ¥393,600."
4. Home tiles "Bills left" and "Saved" next to "Bills and basics" and "burrows": use "Bills and basics left" and "Burrows".
5. Plan, Details: "Money in", "Money out", "Monthly bills" against the glossary (pay, Bills and basics); the rent hint says "put their share under Money in" but setup says "add it to Other pay each month".
6. Plan, Burrows: "On track" vs "Filling" unexplained; both cards say "Full Feb 2028".
7. Plan, Burrows tab is titled "Burrows" but lists only goals; Home "Burrows planned" also lists Education, Investing, Giving.
8. Receipts: "Photos can't be read here. Use an AI app below." vs Settings "sends that file to Claude" and Home "Scan receipt": say why and when.
9. Cloud copy step 4 and the end of setup: "On the welcome screen tap Enter your recovery code." The button #tourRestoreBtn is inside the hidden #tourRestore at 390 (checked twice). Show it, or name the route that works.
10. Restore steps: "then tap Load text twice" is the wrong name after picking a file and "twice" is unexplained; suggest "Tap Choose file and pick your backup. Then tap Load text, and tap it again to confirm."
11. Recovery code paragraph (88 words, three places) and the setup done screen are walls of text; a shorter version is suggested.
12. Yen overdrawn Home says below zero twice; cut the second part to "¥30,000 is left in Free to spend. Wait for pay before spending it."
13. Home: "Your pay in Nov, and where it goes" heading directly followed by "Where your money sits at the end of Nov" with no pay shown.

## Polish
14. Plan, Free to spend: two sentence shapes ("Planned: about ¥4,700 a week across the whole of Nov." and "Planned ¥300 in Nov, about $70 a week.").
15. Header strip: "Free to spend: ¥30,000 left, not safe to spend yet, Nov": trailing ", Nov".
16. "Add a burrow" next to "Add card or loan": "Add a card or loan".
17. Missing full stops: Home bank box hint; "Nothing logged for 10 days. If you spent something add a rough total" (also a comma after "something").
18. "Spend it on whatever you want" three times across the last setup steps.
19. Visual first: Home's four tiles and "Bank ¥477,000 + burrows ¥105,000 = ¥582,000" repeat the bar.

Files: /tmp/qc/wording/ (welcome-390.png, w.js).
