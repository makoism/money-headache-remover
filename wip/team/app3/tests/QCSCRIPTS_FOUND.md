# What the QC scripts found (lane/qcscripts, 24 Nov 2026)

Real faults in the app that the scripts of QC_ROLES.md "Scripts beat reviewers" found. None is fixed here: the scripts
may not touch the app. Each one is a failing check kept in the KNOWN table at the top of its test, so the check stays
red in its own lines ("KNOWN FAIL") and the test's last line counts them. When a fault is fixed, its check passes, the
test fails until the line is taken out of KNOWN, and the line here goes too.

For the coordinator: each line says the file, and what a person sees.

## tests/e3_boxwalk.js (every box and sheet)

- src/start3.js, the made-up numbers band: clear the day in "Show the page as on". The box stays empty, the page keeps
  showing the day it showed before, and nothing says which day that is.
- src/remind3_page.js, Reminders: clear the time in "At". The box stays empty, the reminders are made for 09:00, and
  nothing says so.

Seen on the walk, not counted as faults (for Mako's eye, a wording choice):
- Plan, a card or a loan opened to change: clear "Day of the month it is paid" and press Save. The form says "Nothing
  changed" and keeps the old day. It is a message and nothing is lost, but it does not say the day is needed.

## tests/e3_always.js (the assistant one tap away, page errors, network calls)

- src/ask3.js, a new device: tap Ask on the first screen, in setup, or in Settings before setup. The page only says
  "Set up first". The assistant cannot be asked anything before or during setup (M1, M2, M17). Seven places, one cause.
  The setup chat is on lane/ai-panel, not on this base.
- src/shell.html and src/app3.css, every long screen: Ask is a small link in the header and the header scrolls away
  with the page. Scrolled to the end of 25 of the 35 places (setup, Home, Receipts, Plan and most of its forms, Check
  your bank, Settings, Reminders, Add statements), Ask is off the screen (M1 "always on screen").

Not faults: no page error on any of the 35 places, and no network call at all with the cloud copy off, also when Ask
is opened from every place.
