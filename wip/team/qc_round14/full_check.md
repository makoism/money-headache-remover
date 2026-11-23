# Full check for QC round 14 (build c45f8d0; app code same as 36b6a5d)

check.sh full on 36b6a5d, raw tail:
```
== installable app (service worker, offline, update offer)
PASS service worker is active
PASS Chrome finds nothing blocking install
PASS manifest parses with name and icons
PASS your name was saved before going offline
PASS page loads with no network
PASS your saved data is still there offline
PASS and the tour does not come back
PASS a newer version offers a reload (the page is not forced)
PASS after Reload the page is up and the offer is gone
PASS no page errors

ALL GOOD
EXIT 0
```

artcheck.sh: ART CHECK PASS
golden 3831zg recorded; stage_build VERIFY OK, 0 screens differ.

## Full check on 6ed02e3 (old base, run while about ten review agents loaded the machine), raw lines
```
29:FAIL main copy missing: setup does not reopen
30:FAIL main copy missing: numbers restored exactly
31:FAIL Home says the numbers were restored
32:FAIL the restored page greets by name
35:FAIL damaged main copy: restored from the second copy
53:GUARD ALL PASS
219:QC FAILED: tests/qc/qc11_pay0_places.js
375:QC FAILED: tests/qc/qc18_send_now_tried.js
658:FAIL a task over 50 ms after the tap (Add 0 ms, Undo 51 ms)
660:QC FAILED: tests/qc/phone_add.js
914:SOMETHING FAILED, see above
915:EXIT 1
```
Rerun alone right after: qc11_pay0_places ALL PASS, qc18_send_now_tried ALL PASS, phone_add PHONE ADD PASS (it had failed on Undo 51 ms against a 50 ms limit). safe.js lines failed once and passed on its retry. Counted as a FAIL of that run (LESSONS lesson 2); the old base is being replaced, so no further run is made on it.
