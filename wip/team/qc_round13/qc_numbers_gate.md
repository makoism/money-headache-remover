FAIL (QC round 13 numbers gate. The reviewer could not write a file, so its reply is summarised here. Its scripts and screenshots are in /tmp/qc/numbers/.)

Hard gates all PASS: oracle 15,040,847 comparisons with 0 mismatches; proof_fuzz 1500 plans with 0 failures; display_math 0 open; home_dom 40 13 with 0 mismatches.
The six situations all agree: past plan, borrowed, Education and Giving over their piles, past months kept or put toward a goal, dollar cents and bad inputs, no pay.

B1 BLOCKER. Free to spend shows two "planned" figures on one screen. Setup: bank 50,000, pay 199,000 (plan 200,000), minimum 47,500, Free to spend receipt 3,000 on 7 Jan 2027, today 20 Jan 2027.
- Plan band: "Free to spend: ¥17,000 planned, ¥16,500 safe to spend, Jan". Card: "Planned ¥20,000 in Jan, ¥16,500 safe to spend."
- Receipts band: "¥17,000 planned". Summary: "¥20,000 planned, ¥3,000 spent".
- Home tile: "¥17,000 / planned, ¥16,500 safe to spend". The four-numbers card says "left".
- 17,000 is what is left of the plan, so it must read "left", never "planned". Screenshot /tmp/qc/numbers/s8_plan_199000_390.png.

SF1. Equal amounts get different percents in one split ("¥20,000 7%" twice and "¥20,000 6%"). Rounding to 100.
SF2. Plan > Month Details "Left ¥100,000" is a planned figure shown next to actual ones, with no label; only the bar tooltip explains it.
SF3. A goal with less room than the amount, while another month is still open: the 11,000 that went back to the bank is only shown on Receipts > Dec, and nothing on Home says so.
SF4. One amount written two ways on Receipts ("$104" in the band, "$104.00" in the summary). All months mixes "$21,209" into a column of cent values.
SF5. Switching from $ to ¥ in Settings keeps the cents, so yen shows decimals in some places; the 0.75 is counted nowhere after Keep it in the bank.
