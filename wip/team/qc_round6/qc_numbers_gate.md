# Number-logic QC, round 6, final gate 2

VERDICT: PASS (no BLOCKER found; 6 SHOULD-FIX and 4 notes below)

Build judged: /tmp/qc_build/build.html, opened with ?sfxtest via /tmp/v39/real.js. Phone 390x844, deviceScaleFactor 2, touch. The app's clock was moved with a Date override to reach past months.

## verify.txt (last ten lines of /tmp/qc_build/verify.txt)
```
MISSING plan #9 $ 2027-01-03
MISSING plan #10 CHF 2027-06-10
MISSING plan #11 ¥ 2027-01-22
MISSING plan #12 ¥ 2027-01-22
MISSING plan #13 ¥ 2027-01-28
golden screens: 14 plans, 20 screens differ
FAIL the screens changed
(screens differ: every difference must be one you meant)

VERIFY OK
```
It ends `VERIFY OK`, but the same file also prints `FAIL the screens changed` (golden screens: 14 plans, 20 screens differ). Judging that is not my gate, but the caller should confirm every one of the 20 differences was meant.

## The four hard gates (run from wip/team, in order)
1. `N=3000 node /tmp/v25/oracle.js`: first line ends `comparisons 15078185 | mismatches 0`. PASS
2. `node tests/qc/proof_fuzz.js 1500 21`: `plans 1500 | months proved 24000 | failures 0` / `PROOF PASS`. PASS
3. `node tests/qc/display_math.js`: `screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read`. Limit in display_math.max is `0`. PASS
4. `node tests/qc/home_dom.js 40 13` (no other browser of mine running): `plans on screen 40 | screen checks 1491 | mismatches 0`. PASS

## The six situations (390x844; every figure recomputed by hand from what I typed)
Base unless stated: ¥, pay 300,000, bank 100,000, rent 80,000, food 40,000, emergency already saved 50,000 (3-month target 360,000). The setup split: Free to spend 39,000, Education 39,000, Investing 39,000, Giving 21,000, emergency 42,000.

1. Past plan in Free to spend, a bill and Other (Nov). Logged Free to spend 50,000, Food 45,000, Other 7,000 ("Vet bill").
   Home: "Bank ¥77,000 + burrows ¥191,000 = ¥268,000 at the end of Nov." and "Food and groceries is ¥5,000 over. Free to spend is ¥11,000 over. Other is ¥7,000 over." Plan > Month: "Bank at month end: ¥77,000. ¥100,000 planned, less ¥23,000 spent over plan since your plan started." Receipts: "¥102,000 spent, 3 receipts", rows over ¥5,000 / ¥11,000 / ¥7,000. All months: Dec to May "¥84,000", then later rows carry the cut. Recomputed: 100,000 - 11,000 - 5,000 - 7,000 = 77,000; burrows 92,000+39,000+39,000+21,000 = 191,000. Split 40+14+13+13+13+7 = 100. Agree.
2. Borrowed from the emergency fund, plan uses it. Bank 30,000, rent 200,000, food 60,000, saved 200,000, Nov Free to spend set to 90,000, tapped "Borrow ¥80,800 from emergency fund".
   Plan > Month: Bills 87%, Goal burrows 3%, Free to spend 30%, Education 3%, Investing 3%, Giving 1%, "Borrowed, pays for part of this plan ¥80,800 27%", and "Your pay is 100%. The other 27% is the borrowed ¥80,800". Places 127 = 100 + 0 not placed + 27 borrowed. Home: "Bank ¥30,000 + burrows ¥150,000 = ¥180,000", emergency "¥128,500, 16% full" (200,000 + 9,300 - 80,800; 128,500/780,000 = 16.5%). Check: 230,000 start + 300,000 pay - 350,000 spent = 180,000. Agree. Also tried bank 100,000 (borrow ¥10,800): "Bank ¥30,000 + burrows ¥220,000 = ¥250,000", "¥70,000 past pay" on All months. Agree.
3. Education and Giving past their pile. Logged Education 50,000 and Giving 25,000 in Nov.
   Receipts: "Education ¥39,000 ¥50,000 over ¥11,000", "Giving ¥21,000 ¥25,000 over ¥4,000". Home: "Bank ¥85,000 + burrows ¥131,000 = ¥216,000", Education and Giving piles ¥0. In Dec: Education ¥39,000, Investing ¥78,000, Giving ¥21,000, emergency ¥134,000, "Bank ¥85,000 + burrows ¥272,000 = ¥357,000"; Receipts: "The balance went down ¥15,000, from ¥100,000 to ¥85,000." Agree.
4. Month-end answers (now 5 Dec).
   a) Keep in the bank: Nov Free to spend 9,000 spent. "Count ¥30,000 in the bank" moved Dec start to ¥130,000 ("Bank ¥130,000 + burrows ¥332,000 = ¥462,000"). Then 10,000 more in Nov: card "¥20,000 counted in the bank", bank ¥120,000. Then 25,000 more: card gone, "Over the plan: Free to spend by ¥5,000", bank ¥95,000. Agree.
   b) Toward a goal with less room: saved 300,000 (Nov end 342,000, room 18,000), "Stop here", then "Put it toward Emergency fund": "¥18,000 put toward Emergency fund / Emergency fund is full. The other ¥12,000 stays in the bank." Nov ends ¥112,000, Dec ends ¥154,000 (42,000 not placed), "¥60,000 went to goals". After 10,000 more: "The other ¥2,000 stays in the bank", bank ¥102,000. After 25,000 more: fund back to ¥342,000 at Nov end, Dec "Bank ¥119,000 + burrows ¥558,000 = ¥677,000". Agree. With "Keep saving" (longer goal ¥720,000): month-end card "¥318,000 to go", Plan > Burrows "¥402,000 of ¥720,000", Home "¥402,000, 55% full", band "8 months to go". The "to go" figures agree (see SHOULD-FIX 2).
5. Cents ($, pay 3,000.55, bank 1,000, rent 1,200, food 400.25). Receipts 0.01 and 19.99.
   Receipts: "$20 spent, 2 receipts. Free to spend: $325.30 planned, $20 spent, $305.30 left". Rows "$0.01" and "$19.99". Split 53+11+11+10+10+5 = 100. Odd inputs: "12.345" stored and shown as $12.34; "1,234.50" read as $1,234.50; "12a" logged $12; "-5" and "0" refused with "Type an amount". After all: "Bank $46.46 + burrows $1,575 = $1,621.46", "$1,000 planned, less $953.54 spent over plan". Agree. No NaN, undefined, Infinity or -0 on any screen in any run.
6. No pay, bills logged anyway (bank 50,000, rent 80,000, food 40,000). Logged Rent 80,000, Food 5,000, Free to spend 1,000.
   Home: "Your plan spends ¥120,000 in Nov and no pay is entered, so your bank would end at −¥71,000." Plan > Month: "Bank at month end: −¥71,000. −¥70,000 planned, less ¥1,000 spent over plan". Receipts: "¥86,000 spent, 3 receipts. Free to spend: ¥0 planned, ¥1,000 spent, ¥1,000 over." Dec: "−¥191,000". Agree (see SHOULD-FIX 6).

Pay with no place, spent past by less and by more (Dec, emergency fund full, 24,000 not placed):
- 49,000 spent against 39,000: "¥14,000 of pay not placed yet", legend "stays in the bank ¥14,000" and "Used for spending past plan ¥10,000"; Left piece tip "Left ¥24,000 / ¥14,000 not placed yet (5% of pay) / ¥10,000 used for spending past plan"; bank ¥114,000. Agree.
- 79,000 spent: "All pay is used: ¥24,000 that had no place went to spending past plan."; tip "Left ¥24,000 / ¥24,000 used for spending past plan"; bank ¥84,000 (124,000 - 40,000). Agree.

Other checks that agreed: the same receipt twice ("You already logged this receipt ... Tap again"), a typo one zero too many ("¥500,000 is more than all of your pay ... Tap again"), a future date and a date before the plan ("Pick a date from Nov 2026 to Oct 2028"), Edit 500,000 to 50,000 and Delete (every figure went back), editing a plan amount after receipts, Reset month, reload, two tabs (both showed "¥3,333 spent, 2 receipts", no receipt lost), pay 999,999,999 (parts add to the pay exactly), pay 1, pay lower than bills (€), zero everywhere, a goal over its target ("¥250,000 of ¥200,000", "100% full"), target 0 (wizard will not go on), due date passed ("Paid / Due 21 May 2027", Jul "Bank −¥132,000 + burrows ¥1,251,000 = ¥1,119,000").

## Findings, ranked (no BLOCKER)

1. SHOULD-FIX. Home points to a question that is not on Home.
   Steps: ¥, pay 300,000, bank 100,000, rent 80,000, food 40,000, emergency already saved 300,000. Log Free to spend 9,000 on 21 Nov. Open on 5 Dec.
   Home (390) shows "Bank ¥124,000 + burrows ¥558,000 = ¥682,000 at the end of Dec. ¥30,000 of Free to spend is left out until you answer the question on Home." The only card is "Emergency fund is full / It reached ¥360,000. Keep saving toward your long-term goal of ¥720,000? / Keep saving / Stop here". The November question appears only after that card is answered. Seen on 4 reads, and again in a separate run after a reload. Screenshot: /tmp/qc/numbers/f_question_hidden.png.
   Right answer: show the November question while the line refers to it, or make the line say it comes after the full-goal question.
2. SHOULD-FIX. After "Keep saving", the month-end card reads as if money was held back from a goal that still has room.
   Steps: as in 1, tap "Keep saving", then "Put it toward Emergency fund". Card: "¥18,000 put toward Emergency fund / ¥318,000 to go. Full Aug 2027. The other ¥12,000 stays in the bank." The figures are right (November's target was still ¥360,000; Plan > Burrows for Nov shows "¥360,000 of ¥360,000 by the end of Nov"), but the card does not say why ¥12,000 did not go in while ¥318,000 is still to go.
   Right answer: say "November's goal was full at ¥360,000, so the other ¥12,000 stays in the bank."
3. SHOULD-FIX. "¥0 left" next to "Planned ¥39,000" with ¥0 spent.
   Steps: add goal "Trip" ¥300,000 by 6 months to the base plan, open Jul 2027. Band "Free to spend: ¥0 left, Jul", Plan > Month headline "¥0 / Free to spend / Planned ¥39,000 in Jul". Receipts on the same day: "Free to spend: ¥39,000 planned, ¥0 spent, ¥0 safe to spend." "left" and "safe to spend" are different ideas, and the band uses the wrong one.
   Right answer: "¥0 safe to spend" on the band and the headline, as Receipts says.
4. SHOULD-FIX. One sentence says bills are covered and, a few words later, that the bank does not cover them.
   Home, situation 2 (bank ¥30,000, bills ¥260,000): "Bills are covered and burrows are planned for. ¥90,000 is left in Free to spend, not safe to spend yet: your bank is less than your bills still to pay and Free to spend." The same pairing appears in situations 3, 4 and 5.
   Right answer: "Your plan covers the bills" (or similar), so it does not clash with the bank clause.
5. SHOULD-FIX. Receipts > Last month, situation 4b with "Stop here": "1 receipt, ¥9,000 logged. The balance went up ¥0, from ¥100,000 to ¥100,000."
   Right answer: "The balance stayed at ¥100,000."
6. SHOULD-FIX. User numbers labelled as sample numbers.
   Situation 6 (no pay; bank, rent, food and 3 receipts all typed by me): band on Receipts and Plan "Sample numbers. Free to spend: ¥1,000 over, Nov"; footer "The sample numbers are made up, replace them with yours."
   Right answer: no "Sample numbers" label once the person has entered their own figures. Say only that pay is missing.

## Notes (not number faults)
- Low SHOULD-FIX, rounding: "$325.30 ... about $80 a week" (325.30 / 30 days x 7 = $75.90). In a cents currency, "about $76" is the closer figure.
- Outside my scope: on Receipts (390x844), the "Logged ..." toast with Undo sits over the "Log spend" button for a few seconds (screenshot /tmp/qc/numbers/dbg.png), so a quick second tap lands on the toast.
- My brief says Home's equation is followed by "They add up: ...". That line is not in this build (only the failure text "... add up. They are off by ..." exists). I checked every equation by hand instead, and the failure text never appeared. The brief or the build should be brought into line.
- PAGEERR "Cannot read properties of undefined (reading 'bankEnd')" appeared only when my own script forced a month value that is not in the Receipts month list. A user cannot reach that, so it is not reported as a finding.
- My brief does not allow me to read RESUME.md, so I cannot say which of the items above are already "For Mako's run". The caller should match them.
- Not covered this round: Restore, Re-split pay, changing currency with data in place, "Zero all then add one thing".

VERDICT: PASS

Scripts and outputs: /tmp/qc/numbers/ (s1 to s16 .js/.txt, lib.js).
