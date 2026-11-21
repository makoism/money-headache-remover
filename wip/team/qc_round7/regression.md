# QC round 7, Regression runner: PASS (two conditions)

Saved by MAIN 12 from the agent's reply. scenario_yen SCENARIO ALL PASS (2 of 3; one detached-frame crash); fuzz_model 4000 FUZZ PASS; home_dom 120 seed 7731 0 mismatches (after 6 runs killed by another session's pkill of chrome); fresh loads at 390, 1300, 320 with no errors; a filled plan survives a reload.
Conditions: check.sh full and artcheck on this exact build (MAIN 12 runs them after the round 7 fixes; no art file changed in round 7 apart from vine placement in garden.js, which was restored in round 6).

## Confusing
1. verify.txt "FAIL the screens changed" then "VERIFY OK" reads as unclear. (Golden refresh done by MAIN 12's helper: 3831z, after fixing why plans were MISSING: an extra random draw in oracle.js shifted the plans.)
2. MISSING plan #1 to #13: explained (same fix).
3. A session ran `pkill -f chrome-linux64/chrome` during the panel: builders must not run that kill while a QC panel runs.

## Polish (visual first, For Mako)
1. The not-safe paragraph could be a locked or dimmed chest with "Wait for pay".
2. Home gives the same figures three ways (bar, four boxes, proof line).
