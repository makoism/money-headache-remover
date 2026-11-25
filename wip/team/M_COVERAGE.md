# M coverage: who checks each "Mako says" line that no test, brief or scope file names by its id

Kept by the main build session (MAIN 17 from 25 Nov 2026). tests/m_lines.test.js reads this page: a line here that names an M id counts as its cover, and a line that says "no cover yet" names a gap and still fails there. No invented cover: a row names a test only when that test was seen in the build and checks the line. The older, longer page (every line of sections A to D and F against the code of 24 Nov) is foundation_review/M_COVERAGE.md; it is history, this page wins.

| Line | Cover in this build |
|---|---|
| M5 screens are for seeing and checking | app3/tests/e3_home.js, e3_plan.js, e3_receipts.js (each screen shows the engine's figures); qc-north-star marks it on every candidate |
| M8 built for himself first, replaces his spreadsheet | His own shape is walked end to end: app3/tests/e3_walk.js and engine/test/mako_walk.test.js. Whether it replaces his spreadsheet is his to say at his run |
| M25 everything in the normal app, never only in 3D | There is no 3D in the build, so nothing can be 3D only; qc-controls counts every action on the screens |
| M29 pay arrives with tax already taken off | app3/tests/chat3_core.test.js (the setup chat asks before or after tax and saves what lands) |
| M34 yen is the default currency | app3/tests/e3_setup.js (the currency box in setup) |
| M35 no old data, he types his own numbers | app3/tests/e3_first.js (a new device starts empty, on the assistant) |
| M39 pay is what lands in the bank, asked before or after tax | app3/tests/chat3_core.test.js (the same checks as M29) |
| M42 minimum balance asked once, box empty, never set for the person | app3/tests/e3_setup.js (the Keep at least box is empty and may stay empty) |
| M43 goal money stays in the bank or in its own account | app3/tests/plan3_write.test.js (a goal's place is one of the two) |
| M50 the first pay or bills entry is the usual amount until changed | app3/tests/plan3_write.test.js and e3_paychange.js (a change is a new dated step; the first stays until then) |
| M64 nothing deploys or goes to main without his yes | Process: RUNBOOK section 3 (the coordinator pushes after his yes); app3/tests/e3_publish.js checks the publish script writes only under the private path |
| M65 a private, unlisted address, the old app unchanged | app3/tests/e3_publish.js |
| M66 the cloud copy server refuses unsafe writes, keeps versions, marks deletes, limits daily writes | tests/vault_server/vault_server.test.mjs and fake_parity.test.mjs, both in check3 |

Gaps, said plainly:
- M49 (percents add to 100, a goal never shows full early): no cover yet. The app shows no percents today; no test says so, and none checks a goal near its target.
- M59 (the 3D world is desktop only): no cover yet. The 3D world is not built.
- M68 (the AI relay's daily call cap per household): no cover yet in check3. The cap is in the server file on main; no test in this build's check names it.
