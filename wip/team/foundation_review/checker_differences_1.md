# Checker lane B: where the independent checker and the reference model differ

Written 23 Nov 2026 (JST) by engine lane B. Every amount is made up (seeded random lives).

## What was compared

- `oracle_v2.js` was written only from SCHEMA_V3.md, DECISIONS_ROUND2.md (later sections win), SCHEMA.md 10.3 and the scenario README's rules as the decisions changed them. The reference model, the rule references and the engine were not read while it was written. It refuses (never guesses) anything outside its scope: loans, pay-later, interest, other currencies, imports, posted dates on bank lines, period-end answers, period starts without pay, notYet, closed accounts.
- `self_test.js` runs it on the hand-worked scenario asks it covers: 142 pass, 0 fail (410 asks refused as out of scope).
- `life_gen.js` makes seeded lives with ordinary ids: a main bank, maybe an e-wallet, cash and a savings account backing a goal; zero to two cards (close day 5 to 'last', paid 1 or 2 months after the close); pay every month, every two weeks or weekly, maybe a second job; 2 to 5 monthly bills; spends, refunds, money in, transfers, set-asides, check-ins with a gap, early, late and missing pay, late and skipped bills, card payments in full, in part or late; a plan (budget lines and Free to spend) in half the lives. Each life is asked on about 18 days.
- `fuzz_vs_ref.js` compares bank today and safe to spend per account, the headline, days to next pay, due before next pay, each card's next payment and the total.

## Result on 2,000 seeds (35,424 asks)

| | Seeds that agree on every ask | Seeds with a difference |
|---|---|---|
| Checker as written (`node wip/team/checker/fuzz_vs_ref.js`) | 1,340 | 660 |
| Checker copying the reference on the 8 points below (`--as-ref units,placeFloor,currentMonthly,plannedToday,plannedLate,creditWaits,openingLanding,carryOneStep`) | 2,000 | 0 |

So every difference found belongs to one of eight classes. Bank today, total and days to next pay agree on every ask. Counts per class are seeds still differing with all other points copied (`--as-ref` with that one left out).

| # | Class | Seeds | Asks | Verdict |
|---|---|---|---|---|
| 1 | Current period of weekly or two-weekly pay gets the whole monthly amount | 460 | 7,666 | reference wrong |
| 2 | A place goes below nothing | 121 | 706 | reference wrong |
| 3 | No planned spending for a period whose pay is due today | 241 | 302 | rule unclear, checker follows the letter |
| 4 | No planned spending for a period whose late pay is still counted today | 122 | 147 | rule unclear, same as 3 |
| 5 | Units: plain 52 / n form instead of the units rule | 346 | 3,319 | allowed by L q8, but larger than rounding |
| 6 | A card credit that waits for its payment day | 10 | 30+ | rule unclear (H3 or I3); reference inconsistent with itself |
| 7 | An unpaid card remainder counted twice along a carry chain | 5 | 14 | reference wrong |
| 8 | A pay inside the opening that lands after the setup day | 1 | 3 | rule unclear |

The "mine" figures below are the checker as written (default switches) unless a line says otherwise. Run any one with `node wip/team/checker/fuzz_vs_ref.js --seed <n> -v`.

---

### 1. The current period of weekly or two-weekly pay gets the whole monthly amount (reference wrong)
**Rule:** SCHEMA_V3 section 8, Units: "`month` with pay that is not monthly gets amount x 12 / the real number of pays in that year"; I4 shares the period's amount by days left. Every period, the current one included, gets its own share.
**What the reference does:** for the period running now (and the opening one, shared by days left) it uses the monthly amount itself; for later periods in the walk it converts (52 / n). So it reserves a month of budget lines out of one week's or two weeks' pay, and the headline can show a month of Free to spend for one week.
- **Seed 31, 29 Apr 2027, safe to spend of the main bank:** reference 398,076, checker 468,076. Weekly pay on Thursday, set up Thu 29 Apr, the period runs 29 Apr to 5 May (7 of 7 days left). Hand: 684,000 (bank) - 10,846 (Food 47,000 x 12 / 52 pays in 2027, leftover yen to the earliest pays) - 10,154 (Transport 44,000 x 12 / 52) - 82,000 (rent 30 Apr) - 50,000 (card 4 May) and the walk on to its lowest on 1 Jun = **468,076**. The reference takes 47,000 and 44,000 off today.
- **Seed 42, 14 May 2027, headline:** reference 90,000, checker 20,377. Free to spend 90,000 a month, pay every Friday; 2027 has 53 Fridays. Hand: 90,000 x 12 / 53 = 20,377.4; the 19 leftover yen go to the first 19 pays, and 14 May is the 20th, so **20,377**, nothing spent yet.
- Seen also: the gain question of a check (X4, "more than the period's Free to spend") is judged by the reference on the converted amount (seed 198, 10 Sep 2027: a 107,000 gain held as large against about 32,000 a week), while its headline uses the unconverted one. One figure, two readings inside the reference.

### 2. A place goes below nothing (reference wrong)
**Rule:** H7, SCHEMA_V3 section 4: "A place never holds less than nothing: paying past it takes the rest from the account's other money."
**What the reference does:** lets the place's sum go negative inside, so later set-asides only fill the hole and the place shows 0.
- **Seed 131, 10 Apr 2027, safe to spend of the main bank:** reference 187,504, checker 165,504. Trip, kept in the bank: 21,000 at the opening; a 22,000 spend from it on 9 Feb (21,000 from the trip, 1,000 from the bank's other money); 41,000 on 11 Feb (all from other money); 15,000 set aside on 29 Mar; 7,000 on 7 Apr. Hand: the trip holds 0 + 15,000 + 7,000 = 22,000; 197,504 (bank) - 22,000 (trip) - 10,000 (minimum) = **165,504**. The reference holds the trip at -42,000 inside, shows it as 0, and takes nothing off.

### 3. No planned spending for a period whose pay is due today (rule unclear; checker follows the letter)
**Rule:** SCHEMA.md 10.3 step 2: "at each future period's start subtract that period's budget lines and Free to spend share"; B3 orders income, then bills, then planned spending on one day; G4 counts a pay due today as coming in until the day ends.
**What the reference does:** counts the pay due today but takes off nothing for the period it starts. The pay's period is still a future one (the current period does not move until the pay is seen), so by the letter its lines and Free to spend share come off today, after the pay.
- **Seed 81, 31 Jan 2028, safe to spend of the main bank:** reference 284,943, checker 167,943. Pay of 356,000 due Mon 31 Jan, not in yet; monthly pay, Free to spend 117,000 a month, no budget lines. Hand: 322,443 (bank) + 356,000 (pay today) - 92,000 (rent 27 Jan, late) - 117,000 (Free to spend for the period from 31 Jan, after the pay) + 36,000 (side job 10 Feb) - 92,000 (rent 27 Feb) - 15,000 (phone 28 Feb) - 210,500 (card 28 Feb) - 20,000 (minimum) = **167,943**; the reference's own sum is the same without the 117,000.
- **Seed 2, 3 Dec 2027** (other points copied): reference 9,660.10, checker 9,055.49: the difference is the new period's Food 55.38 and Free to spend 549.23 (monthly x 12 / 52).
- Why it matters: with the reference's reading, safe to spend on pay day shows the whole pay as free until the pay is ticked, then drops by the period's lines when the period starts (B1 takes this period's lines off). **For Mako's run / a decision:** should the period a pay starts be planned for on the pay's day, before it is seen?

### 4. No planned spending for a period whose late pay is still counted today (rule unclear; same question as 3)
**Rule:** H8 (a late pay inside its window still counts, on today) with SCHEMA.md 10.3 step 2.
- **Seed 2, 4 Dec 2027** (other points copied): pay due Fri 3 Dec, late and inside its window. Reference 9,660.10, checker 9,055.49 (the same 604.61 of that period's Food and Free to spend).

### 5. Units: the plain form instead of the units rule (allowed by L q8, but larger than rounding)
**Rule:** SCHEMA_V3 section 8: 26 or 27 (52 or 53) pays a year, leftover minor units to the earliest pays; L q8: "The reference model keeps a plain form (52 / n pays a year, each period rounded on its own); the engine uses the units rules."
**What the reference does:** monthly x 12 / (52 / n), rounded to the nearest unit (found by the fuzz; the rounding is not written).
- **Seed 18, 23 Apr 2027** (other points copied): reference 404,784, checker 405,211. Not a 1 yen matter: in a year with 53 Fridays (2027) or 27 pays every two weeks, the plain form gives each period a fifty-second where the rule gives a fifty-third, so every period over-reserves about 2%. The engine must follow the units rule, so **any engine test whose expected figure comes from the reference with pay that is not monthly will be wrong in those years**.

### 6. A card credit that waits for its payment day (rule unclear; the reference is inconsistent with itself)
**Rules:** H3: "A statement at or below zero is a credit carried to the next one." I3: "a statement still waiting for its payment day ... is never folded into the next one." I3 is written about statements that are owed; neither says what a credit on a card paid two months after its close does.
- **Seed 90, 12 Aug 2027, card 3 (close 10th, paid the 7th two months later):** the 10 Jul statement is a credit of -14,900 (a refund). Reference: the 10 Aug statement asks 119,100; checker: **104,200** (119,100 - 14,900, H3). Before the August close the reference's own open amount does take the credit off (31 Jul: 66,100 = 81,000 - 14,900), then the closed statement drops it, so its figure jumps by 14,900 at the close with nothing new on the card. Under H3 the checker's figure is the same before and after the close.
- Seeds 413 and 704 are the same (a credit whose payment day falls after the next close). **For a decision:** is a credit carried at the next close, or held until its own payment day?

### 7. An unpaid card remainder counted twice along a carry chain (reference wrong)
**Rule:** I3: "When two statements are unpaid at once, each item asks only for what the older one does not already hold, so nothing is counted twice."
**What the reference does:** subtracts the older item only from the statement it was carried into directly. When that statement was then paid in part and its rest carried on, the later statement is asked in full and the old remainder is counted twice.
- **Seed 1692, 24 Sep 2027, safe to spend of the main bank:** reference 223,541, checker 231,829. The 10 Jul statement was left at 8,288 unpaid (item still open); it was carried into August (162,988), which was paid 140,400 on 2 Sep (the rest, 22,588, holding the 8,288, carried into September, 97,388). Hand: the July item asks 8,288 (late, today) and the September item 97,388 - 8,288 = 89,100; total 97,388, not 105,676. **231,829** = the reference's 223,541 + 8,288.
- Seeds 442, 578, 1395, 1982 are the same.

### 8. A pay inside the opening that lands after the setup day (rule unclear)
**Rules:** SCHEMA_V3 section 3: "Every other item due or landing on or before the opening is inside it" (unless the person says not yet, X3); section 9: a period runs "from the day that pay lands"; F8: pay that lands early starts the period the day it lands.
- **Seed 1846, Sat 20 Feb 2027, headline:** pay due Sat 20 Feb, moved later to Mon 22 Feb, set up on the 20th without "not yet". The pay is inside the opening figure, so the money is taken as in. Reference: the January period keeps running (Free to spend 1,380 x 2 / 33 days = 83.63), and on 22 Feb still the January period (19.63), with no new period until March. Checker: the period started by the setup day, **1,380** (1,316 on 22 Feb after 64 spent). The reference's reading leaves a month with two days' share. **For a decision:** which day does a pay inside the opening start its period when its calendar landing is after setup?

---

## Mistakes in the checker that the fuzz found (the reference was right; fixed)
1. A same-day event told the next day comes after a check (H1); the checker had used file order only.
2. Two card statements unpaid at once each ask their own part (I3); the checker folded the older into the newer.
3. An occurrence due after the walk's end but landing inside it (moved earlier) is counted; the checker listed occurrences by due date.
4. Pay every two weeks or weekly: the reference's plain form rounds to the nearest unit (only the `--as-ref units` switch copies it).

Generator fixes (unrealistic data, not rule findings): posted dates are known only once posted; a statement closing on the setup day is typed and paid; a card paid from the e-wallet is topped up from the bank first; Free to spend near real spending so the headline is not always 0.

## Rules the written decisions leave unclear
1. Planned spending for the period of a pay due today, or of a late pay still counted today (classes 3 and 4).
2. A card credit statement waiting for its payment day (class 6: H3 or I3).
3. The period start for a pay inside the opening whose landing is after setup (class 8).
4. "The period's Free to spend" in the large-gain test (O, X4) for pay that is not monthly: the opening split, the converted share, or the monthly amount. The reference uses the converted share there and the monthly amount in the headline.
5. A typed spend with no line in a life with a plan: Free to spend, or nothing? No decision says; the generator always gives a line.
6. Which posting window a card payment item has (the card's 7 days or the paying bank's 1 day) for "late, expected" and "not seen yet".
7. "The second next pay that starts a period" (G1 horizon) while the next pay is late: is the late pay the first one?
8. Card due (the next payment) while an older statement item is late and unpaid: the late one or the next to come? (Both models give the late one.)
9. The plain form's rounding (L q8) is not written; the fuzz shows the reference rounds to the nearest unit.
10. Whether the open part shown for a card includes the remainder of a statement paid in part that will be carried at the next close (both models include it).

## How to run
```
node wip/team/checker/self_test.js                       # the checker on the hand-worked asks
node wip/team/checker/fuzz_vs_ref.js --seeds 2000        # every difference, by figure
node wip/team/checker/fuzz_vs_ref.js --seed 1692 -v      # one life, each difference
node wip/team/checker/fuzz_vs_ref.js --seeds 2000 --as-ref units,placeFloor,currentMonthly,plannedToday,plannedLate,creditWaits,openingLanding,carryOneStep
```
