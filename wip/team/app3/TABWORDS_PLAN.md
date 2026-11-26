# TABWORDS: what a tab still on setup says when another tab gives this device its money (MAIN 24, 26 Nov 2026)

Read wip/team/MAKO_SAYS.md first. Serves M61 and M69 (nobody loses data, and knows what happened to what they typed), M53 (one thing at a time, said plainly), M14 by not hiding a change. From qc-data-safety confirming run 5 (round 2026-11-25_ai_first), CONFUSING 2 and 3, ruled by coordinator 18 for wip-38.31 right after the candidate.

## A person's moment
Two tabs on one phone. In tab 2 they started setup and typed a bank of 777,000. They switch to tab 1 and restore a backup file. Hours later they come back to tab 2. Today: tab 2 showed "Your money was set up in another tab ... What you typed here was not saved" for 3 seconds while it was in the background, so they find Home with their typing gone and no word; and the words were untrue (nothing was "set up", a backup was restored).

## What changes
1. The line is posted as a notice (the message queue's kind that stays until Close is tapped), with its own key, so a later toast never replaces it. Words unchanged for setup finished in another tab.
2. A restore of a backup file on a device with no money yet writes a device-only mark `madeBy: 'backup'` in the store's device record before the save (so a tab that takes the book in reads it with the book), cleared if the save fails, and cleared when setup itself makes a book. The tab that takes the book in says: "A backup was restored in another tab, so this tab shows it now. What you had entered here in setup was replaced" (the second sentence only when setup was open there).
3. Nothing else: the book, the shared copy, the cloud copy and backups are untouched (the device record is never in them, SCHEMA_V3 2.2). A cloud load or an earlier cloud version restored in another tab keeps today's words (a later item if a reviewer finds it).

## Tests (first, failing)
tests/e3_tabsetup.js: case 1, the line is still there 4 s later and Close takes it away; case 3 (restore in tab 1 with tab 2 on setup), the restore words and never "set up" or "not saved".

## Not in this plan
CONFUSING 1 and 4 of the same report go to LANE N (coordinator 18).
