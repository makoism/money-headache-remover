PASS

Version 3 takes in all three faults from round two (DECISIONS_ROUND2 CS1 to CS4). No engine rewrite, no saved-data change, no server change is needed. I ran the engine on the new rule (the base stays put when the book is not replaced) and it holds for changes, removals, clashes and a page that dies between the two saves. Five lines below must go into the plan as it is built. All five are in the page, not the base. One small engine note is logged.

I read the code and ran four node scripts. No check3, no browser.

## OWNER'S WORDS

- **M67** (money always joins up): **met.** First change sent at once, a burst 5 seconds after its last change, a plain send on leaving when the copy is big.
- **M61** (nobody loses data): **met** by F1 and CS3. Ran it: the other device's change and removal survive when the join is done again from the old book and old base.
- **M20** (which to keep): **met.** A real clash asks once and keeps both versions, also when the join is done twice (ran both orders).
- **M4, M11** (several entries in a minute, weekly): **met** by F2 and its test.
- **M1, M17** (assistant always there): **met.** The chat does not hold a take back. See B2 for what sits under it.
- **M36** (how fresh): **met**, with one gap (B4).
- **M45** (no coin twice): **met by the engine.** Ran it: a typed spend and the same statement line, both live on one device, give the same figures as the typed spend alone (lookahead.js:160-172). Round one's feared double count does not happen when amount and day fit.
- **M66** (server limits): write limit **met**. "Keep dated versions" is **silent** (WATCH 1).
- **M13, M14, M19, M33:** met. He logs and looks. He never sends.
- **M21** (iPhone): silent, and said so in the scope notes.
- **M64:** met. No deploy in this slice.

## GRID

The plan adds no kind of record. I counted how each kind crosses devices.
- 7 kinds (events, schedules, accounts, plan lines and places, check-ins, settings, kept versions) by 8 moments (added, changed, removed, undone on the other device, each in step and each when the book here could not be replaced).
- 56 cells: **55 covered, 0 not applicable, 1 part covered.**
- The part covered one: a statement line whose pairing moved a bill's link, when the join is done again. The money is right, but a question nobody caused is asked (engine note).
- The cloud copy itself: one empty cell for the builder, joining on a device that cannot save (B1).

## FOUNDATIONAL

None.

## TO TAKE IN WHILE BUILDING (plan lines and tests, the page only)

### B1. A sync whose result cannot go into the book must not write every minute
- **Who and when:** someone types their code on a device that already has its own numbers (cloud3_page.js:183-192). The device cannot save (store full or read only, e3.js:83, 106-108), or a holding layer is open.
- **What the engine does:** with no base it writes the whole-copy question to the cloud every time (sync.js:344-347). I ran four timed syncs: four cloud writes, nothing changed.
- **Why Version 3 matters here:** CS3 rightly leaves the base empty, so the 60 second timer writes once a minute. That eats the 1,500 daily writes the healthy device shares, rolls all 10 server versions in 10 minutes, and makes the other device download the whole copy every minute.
- **What the plan needs:**
  - When the book could not be saved, timed syncs stop until the person acts or opens the app again, and Home says so once.
  - While a take is held, no joining sync runs. Only the revision is asked. A send goes only when the cloud has not moved (a plain write of this book, so book and base stay together). If the cloud moved, the send waits for the close too.
  - Test: the fake vault counts writes. A device with its own numbers joins while the save is refused: at most one write in three minutes.
- **Cost:** 1 hour now.

### B2. A layer covered by the assistant still holds a take
- back3.js reports a layer only while it is not hidden (back3.js:15). Opening the assistant hides the statement review, Check your bank, setup and the tabs under it (ask3.js:35). Settings and Reminders do the same (settings3.js:63, remind3_page.js:45).
- So with the chat over a half-done review or Plan form, back3 says nothing is open and the take lands under it. No number goes wrong (M45). What was typed or ticked can.
- The plan needs: "open or covered" asked of back3.js, still the one detector. Test: a Plan form half typed, the chat opened over it, the other device logs a spend, the chat closed: the typing is there and Home shows the spend after the form closes.
- **Cost:** 30 minutes now.

### B3. "A change is waiting" must come from what is saved, not from memory
- The flag is in memory only (cloud3_page.js:13, 98). It is lost on a reload, never set in a second tab (e3.js:61) and skipped while a take is being applied (cloud3_page.js:97).
- With the revision-only check, a device whose flag is wrong reads as in step and sends nothing.
- The plan needs: the opening sync is always a full one, and "waiting" is worked out from the book against the base (or the book's saved revision kept beside the base).
- Test, for the line already promised to the owner: log with no signal, kill the page, open it with signal: it is sent with no tap.
- **Cost:** 1 hour now.

### B4. "Last checked" moves only when the book shows what was checked
- A take that is held and thrown away must not move the time in Settings, or Home shows old numbers under a fresh time (M36). Minutes.

### B5. Outside pieces to confirm and show the owner (point 7)
- The guard at 1,200 assumes the live limit is 1,500. VAULT_DEPLOY.md:101 says the Cloudflare dashboard may still hold 400, and the dashboard wins. Confirm the live value before this ships.
- The guard counts on one device and the server counts per copy. The server's "too many saves today" answer must stop sends with the guard's words, not "the cloud is busy".

## ENGINE NOTE (small, not blocking, no saved-data change)

- A statement line added here. The same spend typed on the other device, marked as paying a bill. The join pairs them and moves the bill link onto the line (sync.js:283-308). If that join reached the cloud but not this book (the page died after a leaving send), the next join sees the line two ways and asks "which to keep" (sync.js:186-214). I ran it: 1 question, 1 kept version, both devices agree, no money lost.
- It is in today's build. B1 removes the paths Version 3 would add. What is left is rare.
- Fix when sync.js is next opened: two versions of one statement line that differ only in a link the join moved are the same line. Add a fuzz rule: a join done again from the old book gives the same copy and no new question. About 1 hour.

## WATCH

1. **Server versions now span minutes.** The server keeps the last 10 writes (functions/api/vault/[id].js:10). At one send per receipt, a weekly session of 15 receipts replaces all 10. Before, they spanned weeks. No screen reads them yet, so nothing breaks today. Tell the owner with the request figures. Keeping one a day is a later server change with his yes.
2. **The AI first chat.** If a statement review or a "confirm first" step later lives inside the chat, CS4's "the assistant does not hold" needs a rule: anything that writes from a plan drawn earlier plans again on the book at the moment of writing. stmt3.js:207-208 still adds from the plan as drawn.
3. Still standing from round two: many people behind one address, the whole copy sent each time, iPhone untested.

## Checked and sound

- Join done again from the old book and old base (ran): no clash, a clash each way, a plain statement pairing. Same copy, no second write, no new question.
- Book saved, base not yet saved (page died between the two): safe, nothing written, nothing asked. So the order "book first, then base" is enough. One store transaction is not needed.
- The server changes the plan leans on are live on main (RESUME.md:97), `?versions=1` included.
- No repeating timer in the page writes to the book (no setInterval in src), so the 10 second send rule cannot loop by itself.

Files:
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/foundation_review/SYNC_PULL_PLAN.md
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/app3/src/cloud3_page.js, back3.js, ask3.js, e3.js beside it
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/engine/sync.js, lookahead.js beside it
- /home/user/money-headache-remover/.claude/worktrees/next/functions/api/vault/[id].js
- Scripts (the worktree path is the one argument): v3_redo.js, first_join.js, twice.js, twice_ctl.js in /tmp/claude-0/-home-user-money-headache-remover/df4d19d8-6228-577e-a7be-cf8fc631c93b/scratchpad/
