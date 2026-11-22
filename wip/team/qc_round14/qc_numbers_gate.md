(QC round 14 numbers gate, on the build staged from c45f8d0. Copied from the reviewer's reply.)

PASS

Number-logic QC, round 14. Build judged: /tmp/qc_build/build.html (Version 38.31). I opened it with /tmp/v39/real.js at 390x844, dpr 2, and checked one situation again at 320x700. All four hard gates pass, all six situations recompute correctly, and I found no BLOCKER. There are two SHOULD-FIX items.

**Report file:** /tmp/qc/numbers/REPORT.md was not written. The Write tool refused it with "Subagents should return findings as text, not write report files". This reply is the full report.

verify.txt, last ten lines:
```
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK
```

**Scope notes:**
- **What I read:** only NORTH_STAR.md and QC_NUMBERS.md.
  - I did not read RESUME.md. My role forbids it, although CLAUDE.md asks for it.
  - I did not read wip/team/MAKO_RUN.md either, so I cannot tell whether either finding is already in the owner's notes.
- **How plans were set up:** I put a saved state into localStorage before the page loaded. Everything after that went through the UI: receipts, edits, month-end answers, deletes, Reset month and currency changes.
- **Clock:** for the past-month situations I set the clock to 5 Dec 2026.
- **Browser closures:** four times the test browser closed or its page detached during a run. Other jobs were using Chrome at the time. I repeated each of those steps on its own and it passed, so none of them is reported as a finding.

## Four hard gates (run from wip/team, in order)
1. `N=3000 node /tmp/v25/oracle.js`: the first line ends `comparisons 15040847 | mismatches 0`. **PASS**
2. `node tests/qc/proof_fuzz.js 1500 21`: `plans 1500 | months proved 24000 | failures 0`, then `PROOF PASS`. **PASS**
3. `node tests/qc/display_math.js`: `screen maths: 0 open (amounts 0, percents 0)`. tests/qc/display_math.max is `0`. **PASS**
4. `node tests/qc/home_dom.js 40 13`, run with no other browser of mine open: `plans on screen 40 | screen checks 1484 | mismatches 0`. **PASS**

## Six situations

Base plan unless stated: yen, pay 300,000, bank at start 500,000, minimum 30,000. Bills 110,000, Free to spend 20,000, goals 20,000, Education 20,000, Investing 20,000, Giving 10,000.

**1. Spent past plan in Free to spend, a bill and Other.**
- **Receipts logged:**
  - Free to spend: 25,000 (plan 20,000).
  - Food and groceries: 40,000 (plan 31,000).
  - Other: 5,000, titled "Vet bill".
- **My recompute:**
  - Over plan: 5,000 + 9,000 + 5,000 = 19,000.
  - Not placed: 100,000 - 19,000 = 81,000.
  - Bank at month end: 581,000. Total: 791,000.
- **What the screens show:**
  - Home: "Bank ¥581,000 + burrows ¥210,000 = ¥791,000 at the end of Nov.", "¥79,000 left to pay, ¥9,000 over", "¥5,000 over".
  - Plan > Month: "¥81,000 of pay not placed yet" and "Used for spending past plan ¥19,000 6%". The split is 37+7+7+7+6+3+27+6 = 100. "Bank at month end: ¥581,000. ¥600,000 planned, less ¥19,000 spent over plan".
  - All months: "Nov 2026 ¥81,000 ¥581,000". Every later month agrees, including the months where a goal fills (May 2027 ¥100,300, Feb 2028 ¥104,100, Aug 2028 ¥116,900).
  - Receipts: "¥70,000 spent, 3 receipts", with 9,000 over, 5,000 over and 5,000 over.
  - At 320 wide, every amount and percent on all five screens matches the 390 screens.
- **Result:** agrees.

**2. Money borrowed from the emergency fund, and the plan uses it.**
- **Setup:** pay 190,000, bank 25,000. Tapped "Borrow ¥15,000 from emergency fund".
- **Plan > Month:**
  - Heading: "¥190,000 pay and ¥15,000 borrowed, by place".
  - Places: 58+11+11+10+10+5 = 105.
  - "Borrowed, pays for part of this plan ¥10,000 5%", and the text says "The other 5% is the borrowed ¥10,000".
  - So places + not placed (0) = 100 + Borrowed 5. This is the rule the brief asks for.
  - "Borrowed, stays in the bank ¥5,000". 10,000 + 5,000 = 15,000 borrowed in all.
  - Money in ¥205,000, money out ¥200,000, Left ¥5,000.
- **Home:** "Bank ¥30,000 + burrows ¥195,000 = ¥225,000". Emergency fund ¥133,900 (148,900 - 15,000).
- **Burrows:** "Full Oct 2028" (133,900 plus 8,900 a month for 23 months).
- **All months:** "Nov 2026 ¥10,000 past pay ¥30,000".
- **Second case** (pay 150,000, bank 40,000, borrowed 40,000):
  - Home: "Bank ¥30,000 + burrows ¥170,000 = ¥200,000". Emergency fund ¥108,900, 33% full.
  - Plan > Month: "Still over after borrowing ... ¥10,000".
- **Result:** agrees.

**3. Education and Giving spent past their piles.**
- **Receipts logged:** Education 35,000 (pile 20,000), Giving 12,000 (pile 10,000).
- **My recompute:** over by 17,000, bank 583,000, burrows 180,000, total 763,000.
- **What the screens show:**
  - Home: "Bank ¥583,000 + burrows ¥180,000 = ¥763,000". Education and Giving both show ¥0.
  - Home status: "Education is ¥15,000 over. Giving is ¥2,000 over."
  - Plan split: 37+7+7+7+7+3+27+5 = 100.
  - All months: "¥83,000 ¥583,000".
- **Result:** agrees.

**4. A past month whose unspent Free to spend was answered (clock 5 Dec 2026).**
- **Setup:** Nov Free to spend was 20,000 with 8,000 logged, so 12,000 was not spent. Yearly cost started at 15,000, so it had 4,200 of room at the end of Nov.
- **Before answering:** "Bank ¥704,200 + burrows ¥290,800 = ¥995,000 ... ¥12,000 of Free to spend is left out". Agrees.
- **"Keep in the bank" answer:**
  - Recompute: Nov ends at 614,100, Dec at 716,200.
  - Home: "Bank ¥716,200 + burrows ¥290,800 = ¥1,007,000".
  - Nov month and Receipts both say the ¥12,000 "came back to the bank".
- **"Toward a goal" answer (Yearly cost, room 4,200, less than the 12,000):**
  - Only 4,200 moves to the goal. The other 7,800 goes to the bank.
  - Home: "Bank ¥712,800 + burrows ¥294,200 = ¥1,007,000". This is the same total as the keep answer, so no money was lost or made up.
  - The card says: "Nov's goal was full at ¥20,000, so the other ¥7,800 stays in the bank."
  - All months: "Yearly cost full ¥102,100 ¥609,900".
- **Then logged more Nov receipts, 4,000 at a time, and read the answer card after each one:**
  - Goal answer:
    - 12,000 spent: card "¥3,800 stays in the bank", bank 605,900 at the end of Nov and 708,800 at the end of Dec.
    - 16,000 spent: card "¥4,000 put toward Yearly cost", bank 602,100 and 704,800.
    - 20,000 spent: the card goes away, Dec bank 704,200.
    - 24,000 spent: Nov shows "¥4,000 over", bank 598,100 and 700,200.
  - Keep answer: Nov bank goes 610,100, 606,100, 602,100, 598,100.
  - Every step recomputes correctly.
- **Longer emergency goal ("Keep saving"):**
  - Emergency fund shows ¥338,900, "51% full", "of ¥660,000".
  - Burrows says "Not full within 2 years".
  - The total stays at ¥1,165,000.
  - After the 12,000 went to Yearly cost: Home says "¥2,200 to go. Full Jan 2027.", and the main-goal chip says "1 month to go".
- **Result:** agrees.

**5. A currency with cents ($).**
- **Setup:** pay 3,000.50, bank 5,000.25, Food plan 310.45.
- **Receipts logged:** 0.01 and 19.99 to Free to spend, 0.01 to Food, 19.99 to Other.
- **My recompute:** Left 996.05, not placed 976.06, bank 5,976.31, burrows 2,104, total 8,080.31.
- **What the screens show:**
  - Home: "Bank $5,976.31 + burrows $2,104 = $8,080.31", "$1,100.44 left to pay", "$180 safe to spend".
  - Plan split: 37+7+7+7+6+3+32+1 = 100.
  - All months: "$976.06 $5,976.31".
- **Result:** the amounts agree. See SHOULD-FIX 1 and 2 for how they are written.

**6. No pay entered, bills logged anyway.**
- **Setup:** Settings > "Set all to zero" (confirmed). Then logged rent 40,000, food 5,000 and Free to spend 3,000.
- **What the screens show:**
  - Home: "You logged spending in Nov with no pay entered, so your bank would end at −¥48,000."
  - Plan > Month: "Bank at month end: −¥48,000. ¥0 planned, less ¥48,000 spent over plan".
  - All months: −¥48,000 every month.
  - Receipts: "¥40,000 over", "¥5,000 over", "¥3,000 over".
- No NaN, no −0, no empty amount.
- **Result:** agrees.

**Other scenarios tried, with no wrong number:**
- **Bad or unusual amounts in the receipt box:**
  - Refused: 0 ("Type an amount"), -500 and −700 (minus sign refused).
  - Logged: 1 logs ¥1, 1,234 logs 1,234, and 12.3456 logs ¥12 in yen.
  - "12a", "abc" and "1e3" are refused with a message about the letter.
  - 999,999,999 asks to confirm first. Logged anyway, the bank shows −¥999,379,999, which is correct. Deleting it brings the total back to ¥810,000.
- **Duplicate receipt:** the app warns "You already logged this receipt (¥5,000, 22 Nov 2026). Tap again".
- **Dates:**
  - 29 Feb 2028, 31 Jan 2027, 30 Nov and 1 Dec all land in the right month.
  - 15 Oct 2026 and 3 Nov 2028 are refused with "Pick a date from Nov 2026 to Oct 2028".
- **Editing a receipt:** changed one to an extra zero (50,000), then back, then moved it to Dec. Every figure followed and came back.
- **Changing a plan amount after receipts:** bank went from 616,000 to 615,000 with 1,000 over, which is right.
- **Reset month:** the plan goes back and receipts stay. Bank 544,000.
- **Spending past plan by less, then more, than the pay with no place:**
  - Less: the tooltip on the Left piece of the bar says "¥70,000 not placed yet (23% of pay)", bank ¥570,000.
  - More: "All pay is used: ¥100,000 that had no place went to spending past plan", bank ¥450,000.
- **Goal edge cases:**
  - Target 0: shows "No goal amount yet".
  - Over target: shows "¥15,000 over the goal".
  - Due date already passed: no error.
- **Pay edge cases:**
  - Pay lower than bills: bank ¥390,000.
  - Pay ¥1: total ¥510,001, which adds up.
  - Pay 999,999,999: shares show "under 1%" and 100%.
- **Negative starting bank:** ¥60,000 at month end, correct.
- **Currency ¥ to $ with real numbers:** the app says "The amounts didn't change, only the symbol did." The totals are the same, and still the same after a reload.
- **Two tabs:** all three receipts were kept (1111, 4444, 2222). Nothing was lost.
- **Screen pack** (/tmp/qc_build/screens, 63 .txt files):
  - No NaN, undefined, Infinity or −0.
  - Every Home equation adds up.
  - Every pay split sums to what the screen says.

**Not tried:**
- Restore from a backup file, and Undo after a Restore.
- "Re-split pay": I did not find that button on Home, Plan or behind "More".

## Findings

**SHOULD-FIX 1: two equal amounts get different percents in the same pay split.**
- Plan > Month at 390, situation 1: "Education ¥20,000 7%" next to "Investing ¥20,000 6%". Goal burrows and Free to spend are also ¥20,000, both 7%.
- Situation 2 (pay 190,000): "Goal burrows ¥20,000 11%", "Free to spend ¥20,000 11%", "Education ¥20,000 10%", "Investing ¥20,000 10%".
- Situation 5: "$200" shows as 7% three times and "Investing $200 6%".
- **Why it matters:** the totals are right (100 and 105), but a reader sees two equal amounts with different shares.
- **What it should do:** equal amounts should get equal percents, or the screen should say the percents are rounded.

**SHOULD-FIX 2: decimals are written differently when the cents cancel out.**
- Receipts at 390, situation 5, inside one card:
  - The sentence says "$40 spent, 4 receipts. Free to spend: $200 planned, $20 spent, $180 safe to spend."
  - The table right under it says "Free to spend $200.00 $20.00 $180.00" and "Other $0.00 $19.99 $19.99 over".
- The same happens across screens:
  - Plan > Month says "Receipts: $20 spent, $180 safe to spend."
  - In the screen pack, 390-dollar-plan-2-spending.txt shows "$204.00 safe to spend" while Home shows "$204".
- **Why it matters:** the money rules ask for consistent decimals, and the brief says "The same amount is written the same way everywhere on the screen".
- **Why it is not a BLOCKER:** no value actually differs.
- **Your call:** a strict reading of that line in the brief would make this a FAIL. I rated it SHOULD-FIX because $180 and $180.00 never contradict each other.

No BLOCKER found: no wrong or contradicting amount, no crash, no NaN, no lost money data. The page's own "These numbers do not add up" sentence did not appear in any situation.

VERDICT: PASS

Everything is in /tmp/qc/numbers/:
- **Scripts:** s1.js to s18.js, with the helpers in lib.js.
- **Text dumps of each situation:** s1-*.txt, s2c-*.txt, s3-*.txt, s4keep-*.txt, s4goal-*.txt, s5-*.txt, s6f-*.txt.
- **Screenshot for situation 6 (Home):** /tmp/qc/numbers/s6f-home.png.
