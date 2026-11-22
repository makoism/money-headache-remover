# QC round 11, North star gate: FAIL

Saved by MAIN 14 from the agent's reply. Build 675841b, 412x915 (also 385x730, 360x740, 1280x800), made-up numbers (pay $3,000, rent $1,000, food $400, bank $1,200 then $4,200, "Blue card" $250 paid on the 5th). All five jobs done (setup, Check your bank, card, log and fix a spend, move to another phone by recovery code: B matched A word for word).

## Blockers
- B1 (fixed e39abb2): Setup done chip "Not safe to spend yet" but "Right now $365 of it is safe to spend"; Home "$365 left, not safe to spend yet".
- B2: Home status card green "You are okay ... $320 is free to spend" while "Coming up: Dec ends below zero, Jan ends below zero, Feb ends below zero" (bank $4,200, one-time Car repair $2,500 in Dec, Borrow $365 from emergency fund tapped for Dec; All months Dec 2026 to Jan 2028 Short, month-end -$935 to Oct 2027). Fix: no "You are okay" when any of the next three months ends below zero; warning title "Dec ends below zero", say whether to hold back the $320, next step.
- B3 (MAKO_RUN 1.1): Settings "Money today (bank plus cash) $1,200" with "Update it whenever you check your bank"; tour step "Your balance right now". Typing today's $4,200 there counts pay twice (Total $2,435 to $5,435, Dec warning softens). Fix: one balance input with one meaning; either read-only in Settings pointing to Check your bank, or rename to "Balance at the start of Nov, before pay" with a line saying not to type today's balance; tour wording to match.

## Smaller
- S1: Home "Bank at month end is planned from $1,200 ... Your bank now is $4,200, $3,950 after the cards are paid, so the two can differ." Needs one plain sentence: $1,200 is from before pay; the $250 leaves on 5 Dec.
- S2: in the safe state the status card goes away; keep a one-line reason.
- S3: Setup Split the rest: "Goal burrows 12% ... $365" next to "Education 12% ... $360".
- S4: Plan Dec 2026 (Short, ends -$935): big "$365 Free to spend" under the chest; small "$0 safe to spend".
- S5: Plan Dec after borrowing: Emergency fund $365 goes in while $365 is borrowed out, nothing explains it.
- S6: All months Dec 2026 "$2,500 past pay" vs Dec screen "Still over after borrowing $2,135". From Feb 2028 "Not placed yet $365" with no hint.
- S7: 385x730 "Badge: First burrow." toast covers the Bills and basics row on Setup done.
- S8: #mpPay and #rcCopy have no visible text or aria-label.
- S9: phone B header "Saved in this browser" while Settings says Cloud copy On.

## Checked fine
No page errors; nothing cut off at 360, 412, 1280; vines cover no words; total line adds up.
