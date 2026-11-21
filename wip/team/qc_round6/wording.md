# QC round 6, Wording editor: PASS (no blockers)

Saved by MAIN 12 from the agent's reply (judged from the screen pack only; it could not read RESUME, so some items below are on the For Mako list already). No em dashes, no banned words.
**MAIN 12 note (one right answer, not done yet):** the curly "partner’s" is the HTML entity `&rsquo;` in ui45s.js line 40; qc12_straight_apos missed it. Extend that test to `&rsquo;`, `&lsquo;`, `’`, then fix.

## Confusing
1. Ask panel 412 (panel 24): "Status On plan" next to "Left over ¥65,000"; Plan says "Not placed yet". (For Mako: glossary)
2. Home 412 (panel 13): "Your bank now is ¥412,000, ¥393,600 after the cards are paid, so the two can differ." when the plan start and bank now are the same; show only when they differ, or "Your plan started Nov from ¥412,000. Your bank shows ¥393,600 after the cards are paid."
3. Burrows: "On track" vs "Filling" with the same full month, no reason. (For Mako)
4. Month-end question: "Put it toward the goal" names no goal; "Count ¥20,000 in the bank" unclear; suggest "Put it toward Trip" and "It's still in my bank". (For Mako)
5. Tour "Your money" 412 (panel 29): "If you're not sure leave it blank and add it later on Plan" but the balance is on Home and in Settings, not Plan. One right answer: "Not sure? Leave it blank and add it later on Home."
6. Plan month: "Raise a goal or another place to use it, or leave it where it is." Suggest "To use it, raise a goal or another place. Or leave it in the bank."
7. Plan sticky line: "¥80,000 of your pay not placed yet in Nov · Not placed yet" repeats; drop the status when it repeats the sentence.
8. One action, three names: "Save file", "Save a copy" (panel 15), "Save a file instead" (panel 17). Use "Save file".
9. Settings: "Set all to zero" vs "Clear my plan" with no difference said. (For Mako, data safety C3)

## Polish
- Comma splices: welcome "Come back here when you're done or skip it, it's under Help too."; footer "The sample numbers are made up, replace them with yours."; Settings "Fun for you and your family, spend it on whatever you want." and "You never spend this, it grows over time."; panel 36 "The ? button ... is Help, it has the video and this setup."; panel 48 "Count it in the bank or put it toward a goal, you can undo either one."
- Missing full stops: Burrows "Cards and loans with interest, and their payments are part of Bills and basics"; "Lines with no receipts aren't listed, except Free to spend"; "Like a gym fee or a weekly top-up: it gets logged for you on its day"; "...shown as a mark on the Free to spend bar in Plan"; "This shows next to the goal so you keep seeing why"; "Or do it later in Settings, find Cloud copy and tap Keep a copy in the cloud".
- Two forms of the weekly Free to spend line on Plan.
- Mixed forms: "over $62.75" vs "$62.75 over"; "Nov 6" vs "12 Nov 2026"; "like -400" (Settings) vs "like −200" (tour).
- Walls of text: "On your phone" (panel 01), recovery code paragraph, Saved data.
- Clashes: Receipts "Photos can't be read here." vs Saved data "a receipt photo sends that file to Claude"; tour "All 50% of your pay here is given out."; Free to spend step says "yours to spend" twice.
Visual first: Home's four tiles repeat figures the chests and bar already show. (For Mako)
