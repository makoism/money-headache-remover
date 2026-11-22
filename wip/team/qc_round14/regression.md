(QC round 14 regression, on the build staged from c45f8d0. Copied from the reviewer's reply.)

FAIL

(The tool refused to write /tmp/qc/regression/REPORT.md because subagents must return findings as text. The full report is below. The scripts, logs and screenshots are in /tmp/qc/regression/.)

verify.sh, last ten lines (/tmp/qc_build/verify.txt):
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

What I ran myself on /tmp/qc_build/build.html (md5 114eb320..., same bytes as wip/money-map-team.html now), one at a time:
- tests/qc/scenario_yen.js: "SCENARIO ALL PASS". The tight and healthy months both say "no page errors and an empty error log".
- tests/qc/fuzz_model.js 4000: "checks 11097237 fails 0 / FUZZ PASS".
- tests/qc/home_dom.js 120 1414: the first run died with "TimeoutError: Timed out after waiting 30000ms" (load average 7.08). Run again on its own: "plans on screen 120 | screen checks 4436 | mismatches 0".
- Fresh load with empty storage, then Finish later, Receipts, Plan, Home, a typed bank, reload. At 390x844, 320x568 and 1280x900: page errors [] at all three, and the tour does not come back after the reload.
- I did not run artcheck.sh or check.sh. full_check.md reports "ART CHECK PASS", "GUARD ALL PASS", "ALL GOOD", "EXIT 0".

## BLOCKERS

1. The guard line is not true for this build. full2.txt says "PASS outside requests: none". A plain fresh load does send one. Setup: nothing saved, no cloud copy, Welcome screen at 390x844, with and without ?sfxtest. The page sends `GET https://money-headache-remover.mako-162.workers.dev/api/health` three times on the very first open and once on every reload after. Nothing more is sent over 60 s idle. Either the guard does not see this request or the request is new. The app contacts the owner's server before the person has turned on any cloud copy. The caller must decide whether this is intended. Either way the guard has to count it. Scripts: /tmp/qc/regression/idle.js, /tmp/qc/regression/net.js.

2. The full check prints number mismatches and still ends "ALL GOOD". Under "== number checks", viewtest prints three got/expected pairs where the emergency fund differs:
   - #146 € 2026-11: got `"pct":4 ... "target":22960`, expected `"pct":1 ... "target":57994`.
   - #156 £ 2026-11: got `"pct":24 ... "target":11147`, expected `"pct":15 ... "target":18220`.
   - #156 2028-03: got `"pct":100`, expected `"pct":61`.

   "== display" and "== monkey" also list screen-against-independent pairs. Some are only wording drift ("Not placed yet" against "Left"). Monkey S0 also has `dock: screen "" vs independent "¥0"`. No line says whether any of these count as failures. Until someone shows each one is a stale expectation, the emergency fund goal on screen may be wrong, and the gate passes over these lines without a word.

## CONFUSING

1. Home, 390x844 (also 320x568 and 1280x900), sample numbers, after "Finish later". I typed 1234 in the bank box and tapped Save. The toast said "Bank updated: ¥1,234 today. It shows here once you use your own numbers." After a reload, Home shows "What does your bank app show today?" with an empty "¥ 0" box. Neither Home nor Settings mentions 1,234. Storage still holds `"bankNow":1234`, so nothing is lost, but to the person the number looks gone. Replacement: after a reload, show a line under the box: "Saved: ¥1,234 today. It shows here once you use your own numbers." Screenshots: /tmp/qc/regression/filled-390-before-reload.png, /tmp/qc/regression/filled-390-home.png.

2. A data-safety test failed and a retry hid it. full2.txt line 108 says "FAIL reasons survive a reload:  |  |  | ". Then "(script failed once, exit 1; one quiet retry, these are timing-sensitive under load)", then "PURPOSE: 18 pass, 0 fail". Empty values after a reload is what lost data looks like, and full_check.md does not mention the failure. Put every retried failure in the summary, and run this test several times in a row before release.

3. The full check ran on commit 36b6a5d, but the build being judged is c45f8d0. "app code same as 36b6a5d" is the builder's claim, and my brief does not let me check it.

## POLISH

1. The screen pack's full-page shots draw the fixed bottom bar across the middle of the page. In 390-yen-overdrawn-1-home.png, a black band with the "?" button covers the This month picture and its "left to pay" labels. Hide the bar or take viewport-sized shots.
2. home_dom.js gives up after 30 s under load. Give it a longer wait so a busy machine is not mistaken for a broken build.

Visual first: Home, 390x844, yen-overdrawn plan. "Your bank starts the month below zero. Leave the ¥80,000 not placed yet in the bank until it is back above zero. ¥30,000 is left in Free to spend, not safe to spend yet: your plan starts from a bank below zero (−¥15,000). Wait for pay before spending it." Four sentences of words do a picture's job. The bar above it begins at "Bank at month end ¥65,000" and never shows the −¥15,000 start. Show a zero line on the bar with the bank starting below it, and keep one sentence.

Files in /tmp/qc/regression/:
- Logs: scenario_yen.txt, fuzz.txt, home_dom.txt, home_dom2.txt
- Screenshots: fresh-*.png, filled-*.png, bank-settings-390.png
- Scripts: fresh.js, fresh2.js, bank.js, idle.js, net.js
