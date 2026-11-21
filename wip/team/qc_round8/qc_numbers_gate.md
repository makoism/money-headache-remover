VERDICT: PASS (no BLOCKER found; 5 SHOULD-FIX)

verify.txt (last ten lines, /tmp/qc_build/verify.txt):
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831za.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

## Four hard gates (run from wip/team, in order)
1. N=3000 node /tmp/v25/oracle.js: "random plans 3000 (...) | comparisons 15040847 | mismatches 0". PASS
2. node tests/qc/proof_fuzz.js 1500 21: "plans 1500 | months proved 24000 | failures 0 / PROOF PASS". PASS
3. node tests/qc/display_math.js: "screen maths: 0 open (amounts 0, percents 0)", display_math.max = 0. PASS
4. node tests/qc/home_dom.js 40 13 (no other browser of mine running): "plans on screen 40 | screen checks 1484 | mismatches 0". PASS

## Six situations (build /tmp/qc_build/build.html?sfxtest, 400x860, dpr 2; U+2060 stripped)
1. Past plan in Free to spend, a bill and Other (sample, Nov 2026): receipts Free 25,000 (plan 20,000), Food 41,000 (plan 31,000), Other 3,000 (no plan). Over = 5,000+10,000+3,000 = 18,000.
   Home "Bank at month end ¥67,500", "Bank ¥67,500 + burrows ¥210,000 = ¥277,500 at the end of Nov." (85,500-18,000; 295,500-18,000). Bills "¥79,000 left to pay, ¥10,000 over" (110,000-31,000). Plan "Bank at month end: ¥67,500. ¥85,500 planned, less ¥18,000 spent over plan". All months Nov and Dec "¥67,500" (carried). Receipts "¥69,000 spent, 3 receipts", rows over ¥10,000 / ¥5,000 / ¥3,000. Agree.
2. Borrow used by the plan: bank 17,000 (= minimum), one-time cost 30,000, tap "Borrow ¥30,000 from emergency fund". Plan bar 70+10+10+10+10+5 = 115, "Borrowed, pays for part of this plan ¥30,000 15%", text "Your pay is 100%. The other 15% is the borrowed ¥30,000". 115 = 100 + 15. Money in ¥230,000 = Money out ¥230,000, Left ¥0. Home emergency 148,900-30,000 = "¥118,900", "Bank ¥17,000 + burrows ¥180,000 = ¥197,000". Also checked: borrow that stays in the bank (min 150,000 -> "Borrow ¥64,500", bank ¥150,000, Emergency ¥84,400 = 140,000+8,900-64,500) and part-borrow with cost 150,000 ("Still over after borrowing ¥68,500", bank 85,500+200,000+81,500-350,000 = ¥17,000). Agree.
3. Education 30,000 (pile 20,000) and Giving 15,000 (pile 10,000): Home Education "¥0", Giving "¥0", bank "¥70,500" (85,500-15,000), "Bank ¥70,500 + burrows ¥180,000 = ¥250,500". Dec start ¥70,500. Investing 50,000 (plan 20,000) with others: Investing "¥50,000", bank ¥44,500, "less ¥41,000 spent over plan", total ¥254,500. Agree.
4. Own plan (pay 300,000, bills 150,000, bank 100,000, Bike 10,000 at ¥1,200/month), clock 20 Jan 2027. Nov Free 30,000 spent 5,000; Dec Free 20,000 spent 4,000. Home before: "¥41,000 of Free to spend is left out until you answer". Dec "Keep ¥16,000 in the bank": Dec bank 347,600 -> ¥363,600. Nov "Put it toward Bike" (room 8,800): card "¥8,800 put toward Bike ... the other ¥16,200 stays in the bank", Nov bank ¥235,000, Dec ¥381,000, Jan ¥531,000, Bike ¥10,000. Then logging until the answers were used up: Dec +10,000 -> Dec ¥371,000; +10,000 more -> Dec ¥361,000 "Over the plan: Free to spend by ¥4,000"; Nov +20,000 -> card "¥5,000 put toward Bike / ¥1,400 to go. Full Mar 2027.", Bike ¥8,600 at end of Jan, Home main goal and Burrows agree; Nov +6,000 -> top-up gone, card removed, Bike ¥3,600, Nov ¥217,800. Every figure recomputed by hand. Longer emergency goal (target 20,000, long-term 60,000, "Keep saving"): Home "39% by the end of Dec" = 23,400/60,000, Burrows "¥23,400 of ¥60,000", tile "11 months", All months "Nov 2027 Emergency fund full". Agree.
5. Cents (EUR): pay 2,999.99, rent 999.99, food 333.33, Free 100.01, Education 50.05, Giving 10.10, bank 1,234.56, receipts 0.01 and 19.99 Free, 333.34 food, 60.07 Education. Left €861.51, over €10.03 (0.01+10.02), not placed €851.48, bank €2,086.04, "Bank €2,086.04 + burrows €1,535.10 = €3,621.14". Percents 55+5+3+2+6+29 = 100 plus two "under 1%". Also $ run: "$80.50 left", bank $2,399.75. Agree.
6. No pay, bills logged (Set all to zero, rent 50,000, food 3,000, Free 1,500): Home "your bank would end at −¥54,500"; bank 20,000 typed -> "−¥34,500"; All months Nov/Dec "−¥34,500". No NaN/undefined/−¥0 on any screen. Agree.

Also run with no wrong number: receipt 0 ("Type an amount"), −500 (refused, explained), 1, 999,999,999 (asks to confirm), 12.3456 in yen (stored 12), 0.4 yen (refused), "abc", "1,234" (1,234), blank; typo 50,000 edited to 5,000 and deleted (Home, Plan, All months identical to before); 30 Nov, 31 Dec, 29 Feb 2028, 31 Mar 2027 land in the right month; Oct 2026 and Nov 2028 refused ("Pick a date from Nov 2026 to Oct 2028"); reload (identical); two tabs (both receipts kept, the other tab caught up after a few seconds; repeated); Set all to zero + Undo (identical); Reset month (cost and borrow removed, receipt kept, ¥295,500 back); goal target 0, goal over target ("¥30,000 over the goal"); pay 50,000 and pay 1 lower than bills; pay 99,999,999,999 refused ("The most is 1,000,000,000"). All "Bank X + burrows Y = Z" lines in /tmp/qc_build/screens/*.txt add up.

## Findings (ranked)
1. SHOULD-FIX. Ended month called "safe to spend" (sample numbers on). Steps: fresh load, clock 20 Jan 2027, Finish later, log Free 2,000 + 3,000 + 2,000 and Food 1,000 in Nov 2026, Plan > Month > November 2026. Shows: "¥13,000 / Free to spend ... Receipts: ¥7,000 spent, ¥13,000 safe to spend." Clock 5 Mar 2028: Nov 2026 shows "¥1,100 spent, ¥18,900 safe to spend". The month is over and the plan counted that money as spent (Jan starts at ¥85,500). Right answer: the wording used once your own numbers are in, "¥13,000 not logged as spent yet", never "safe to spend" for a past month.
2. SHOULD-FIX. Over amount written with a minus and "over". Situation 1, 400 px: Home "Free to spend / −¥5,000 / over" and "−¥5,000 / over in Nov"; Plan hero "−¥5,000"; status line "Free to spend: ¥5,000 over"; Receipts "over ¥5,000". One amount, three ways, and "−¥5,000 over" reads as a double negative. Right answer: "¥5,000 over" everywhere.
3. SHOULD-FIX. Home cannot be added up when Other or a pile is past plan. Situation 1: Home names "¥10,000 over" (bills) and "−¥5,000 over" (Free), but the bank fell ¥18,000; the ¥3,000 in Other appears only on Plan ("less ¥18,000 spent over plan") and Receipts. Investing run: the toast says "Logged. Free to spend is over, Bills and basics are over, Education is over, Giving is over for this month." while Receipts shows "Investing ¥20,000 ¥50,000 over ¥30,000" and Plan counts it in "less ¥41,000 spent over plan".
4. SHOULD-FIX. Whole amounts lose their decimals next to amounts with cents. EUR run, Receipts: "Free to spend: €100.01 planned, €20 spent, €80.01 safe to spend."; Plan hero "Receipts: €20 spent, €80.01 safe to spend." Right answer: €20.00 when the currency has cents.
5. SHOULD-FIX. The same piece has two percent labels. Own plan, Nov, Plan > Month: Bike "¥1,500 1%" before any receipt, "¥1,500 under 1%" after an ¥80,000 Free receipt, "1%" again after ¥200,000 more. Each set adds up; the label of an unchanged amount should not change.

No BLOCKER: no wrong or contradicting total, no NaN, undefined, Infinity or −0, no page errors, no lost data.
Not exercised: goal due date passed, Restore samples, Re-split pay (no button found on Home or Settings in this state).
Note: the repo CLAUDE.md says to read RESUME.md first; my brief forbids it, so I did not.
Scripts and screenshots: /tmp/qc/numbers/

VERDICT: PASS
