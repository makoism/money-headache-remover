# What the QC scripts found (lane/qcscripts, 24 Nov 2026; walked again on lane/ai-join 25 Nov)

Real faults in the app that the scripts of QC_ROLES.md "Scripts beat reviewers" found. None is fixed here: the scripts
may not touch the app. Each one is a failing check kept in the KNOWN table at the top of its test, so the check stays
red in its own lines ("KNOWN FAIL") and the test's last line counts them. When a fault is fixed, its check passes, the
test fails until the line is taken out of KNOWN, and the line here goes too.

For the coordinator: each line says the file, and what a person sees.

## tests/e3_boxwalk.js (every box and sheet)

Both faults found here (a cleared day box in the made-up numbers, a cleared Reminders time) are fixed: the box goes back to the value in use.

Seen on the walk, not counted as faults (for Mako's eye, a wording choice):
- Plan, a card or a loan opened to change: clear "Day of the month it is paid" and press Save. The form says "Nothing
  changed" and keeps the old day. It is a message and nothing is lost, but it does not say the day is needed.

## tests/e3_always.js (the assistant one tap away, page errors, network calls)

Walked on lane/ai-join (the assistant panel and the setup chat). Fixed there and taken out: a tap on Ask before or
during setup now opens the assistant (the welcome is the chat), and after setup the assistant's box is a bar at the
foot of every screen, so it no longer scrolls away there.

Fixed since: before setup the header line with Ask stays at the top of every screen (app3.css, one rule), so the way in
no longer scrolls away on any of the 36 places. This test has no KNOWN fault left: every place is a hard fail.

Not faults: no page error on any of the 36 places, and no network call at all with the cloud copy off, also when Ask
is opened from every place. Served from a server, the page asks its own server once whether the AI is on
(GET /api/health, nothing sent); that is allowed and counted apart.

## tests/m_lines.test.js (every line of MAKO_SAYS.md is named by its own id)

Not a fault in the app: a gap in the process, for the coordinator, who owns MAKO_SAYS.md and the briefs.

Rule since 25 Nov (coordinator): a line counts only when its own id is written in a test, a reviewer brief, a scope
file or wip/team/M_COVERAGE.md; section G (how the team works with him) is covered by wip/team/RUNBOOK.md section 8.
A section handed whole to a reviewer covers nothing by itself, so a line added later fails until someone names it.

- 3 lines have no cover yet, written so in wip/team/M_COVERAGE.md: M49 M59 M68. Each is a KNOWN line in the test.
  The other 16 of the 19 found on 25 Nov are named in M_COVERAGE.md with the test that checks each (MAIN 17, 25 Nov).

## tests/wording_lint.test.js (the words a person sees, against VOICE.md)

- src/cloud3_page.js, a toast when two devices changed the same thing: "Your devices changed the same thing. Open
  Settings to choose which to keep." Two sentences with full stops (VOICE: a toast is one line, no full stop).
- src/settings3_sw.js, a toast when a new version is ready: "A new version of the app is ready. It opens the next time
  you come back to the app." The same.
- src/settings3.js, Settings, under the currency: "It stays the same once money is written down." A one line note that
  ends with a full stop.
- src/stmt3_ai.js, under the code word box: "Kept on this device only, and sent only to this page's own server." The
  same.
- src/settings3.js, Settings, the Backup file note: "Restoring one replaces the money on this device; what is here now
  is kept first ..." A semicolon (VOICE Part C: never a semicolon).

Not faults: no em dash anywhere, none of the 38 words VOICE.md forbids, no exclamation mark, ellipsis, "e.g." or en
dash, and no number of 7 digits or more. What is written only for the AI (the assistant's instructions and tool
descriptions, a statement's prompt) is not read: "Use any AI" shows the instructions to the person, and qc-voice
reads those.
