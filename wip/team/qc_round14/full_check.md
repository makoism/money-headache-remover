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
