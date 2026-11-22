# Full check before QC round 10 (MAIN 13, 2026-11-22 09:57 to 11:31 JST)

One quiet `./check.sh full` on 9219588 (round 9 wording fixes in, nothing else running). It ended "SOMETHING FAILED" on one script:
- `tests/qc/act_keep.js`: "New failures: removeLine" (check.sh keeps only the last two lines, so the reason was not saved). It passed on the round 8 full run (2857cfd), and none of the app changes since touch actions or the 3-day copy (they are screen words, a cloud-aware caption and a test hook). Run alone three times right after: "16 pass, 18 known findings, 0 new failures, ALL PASS" each time. Read as timing under load at the end of a 90-minute run, but it is a data safety script, so the QC regression and data safety agents should look at it.
- `/tmp/v28/safe.js` failed its first try ("main copy missing: setup does not reopen", a CRASH waiting for #hBk [data-bk-ok]) and passed 34 of 34 on the quiet retry, so the run counts it as passed. Run alone three times after: "SAFE: 34 pass, 0 fail" each time.
Everything else passed: guard on a quiet machine (Home idle CPU 1.03%), oracle, proof, every qc script, number checks, the app package.

Last lines of the run:
```
== guard (idle CPU, tab speed, no outside requests, no errors)
PASS idle CPU on home: 1.03% (limit 1.5%)
PASS idle CPU on receipts: 1.14% (limit 1.5%)
PASS idle CPU on goals: 1.08% (limit 1.5%)
PASS idle CPU on month: 1.26% (limit 1.5%)
PASS idle CPU on basics: 1.03% (limit 1.5%)
PASS tab switch to next paint, median 20.3 ms (limit 60)
PASS long tasks: [121,59] (limit 200 ms each)
PASS outside requests: none
PASS page errors: none
GUARD ALL PASS
New failures: removeLine
QC FAILED: tests/qc/act_keep.js (its known findings are in act_keep.known)
NUMDONE
SOMETHING FAILED, see above
```
