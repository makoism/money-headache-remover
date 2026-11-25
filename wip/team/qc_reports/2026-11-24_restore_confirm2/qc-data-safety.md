# qc-data-safety, round 2026-11-24_restore_confirm2

`wip/team/app3/tests/fake_ai_page.js` is missing from this build, so the assistant was tested with the stub from the top of `e3_ask.js` (a made-up `window.claude`).

VERDICT: FAIL

CHECK: (the last lines of check3.txt)
[x] The real-page walk (walk 4 run A) as a gate ... (tests/e3_walk.js: PASS)
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)
(full level, 3 at a time, 417 s in all)
ALL GOOD

OWNER'S WORDS
- M61 Nobody loses data: NOT MET. A stale second tab silently overwrites a change. Undo does not survive a reload.
- M62 No real figures in the repo: COULD NOT TELL. I did not scan the repo.
- M63 AI key only in the site's secret: MET for the page. No key appears in any request. I could not check the server.
- M64 Nothing deploys without his yes: COULD NOT TELL.
- M65 The old app stays unchanged: MET. Its `money-map-template-v2` storage is untouched by app3, which uses its own `burrow3` keys.
- M66 Cloud server rules: COULD NOT TELL on the real server. On the made-up one, deletes are marked (the other device says "The cloud copy was deleted on another device") and earlier versions are listed.
- M67 Money that happened joins across devices: MET. Spends made apart on two devices all ended up on both.
- M68 AI daily cap: COULD NOT TELL.
- M69 Safety first: NOT MET (see the blockers).
- Outside my section, seen broken: M13 NOT MET (a card, a goal, a bank account and pay cannot be removed). M14 NOT MET (Undo is gone after any reload). M20 only partly MET (the two choices look identical).

COUNT
- Jobs: 11 tried. Done: 1, 2, 3, 4, 5, 6, 7, 9, 10, 11. Partly stuck: 8, because the remove controls are missing.
- Kinds of change checked across a reload at once and again after 10 s: 15 of 15 kept every figure. They were: spend from bank, spend on card, money came in, refund, edit spend, remove spend, bill amount, add bill, add goal, add loan, add line, add card, check bank, pay amount, end bill. On top of that: setup section save after the browser was closed, restore, Put it back, and an assistant Apply.
- Removes: 12 looked for. 6 exist: remove spend, End this bill, End this line, Close this loan, Turn off cloud, Delete the cloud copy. 2 of the 6 ask first (the two cloud ones). 0 of 6 can be undone after a reload. Missing: remove a card, a goal, a bank account, pay; start again; delete all data.

BLOCKERS
1. **A second tab silently overwrites a change** (phone 390x844).
   - Steps: open the app twice. In tab 2 open Plan > Rent (the sheet shows ¥91,000). In tab 1 change Rent to 95000 and Save ("Bill changed").
   - In tab 2 the sheet still shows 91000. Change only the name and Save.
   - Result: Rent is ¥91,000 on both tabs. The 95,000 is gone with no question and no Undo. Repeated twice.
   - What it should do: say the sheet's figures changed elsewhere and ask.
2. **Removes do not ask** (job 8, M6 "asks first only for deletes").
   - Receipts > tap a spend > Remove deletes it at once ("Removed ¥5,000, Free to spend / Undo").
   - Plan > Rent > End this bill ends it at once ("Rent ends").
   - Plan > line > End this line ends it at once.
3. **Undo is gone after a reload**, for every change: spends, removes, ends, an assistant Apply, a conflict choice.
   - After any reload there is no Undo on Home, Receipts, Plan, Settings or Reminders.
   - Example: after a reload, the ended Rent's sheet offers only Save and Back. There is no way to un-end it.
4. **Missing removes** (M13). These sheets have no remove or close:
   - Plan > Card A: only "Save" and "Back".
   - Plan > goal: only "Set aside", "Save changes", "Take out" and "Back".
   - Plan > Pay: no end.
   - The bank account is not tappable on Home, and Settings has no way to remove an account.
   - There is no "Start again" anywhere.
5. **Home never says the cloud copy is behind** (job 5).
   - With the server refusing (503), and then gone, Home, Receipts and Plan say nothing, before and after a reload.
   - Only Settings says "The cloud did not take the copy. It tries again by itself. Changes made since 10:42 are on this device only for now.", with Send now.
   - For at least 21 s after a refused change, Settings still read "On. Last in step with the cloud at 10:39." (repeated).
6. **The conflict choice cannot be told apart** (job 4).
   - Settings shows "Rent was changed on two devices. Which one should stay?" and then two identical rows: '"Rent", changed 10:34 / Keep this one'.
   - Neither row gives the amount (91,000 against 92,000) or which device it came from. The person picks blind.
   - After a reload, "Kept. The other version can still come back." has no visible way back.
7. **Typing in sheets is dropped without a word** (job 1). None of these says "not saved":
   - Plan > Add a bill: typed "Gym" and 7000, tapped Back. Gone.
   - Rent sheet: typed 99999, tapped the Home tab. Gone.
   - Receipts: typed 777, switched tabs. The box is empty again.
   - Check your bank: typed 300000, tapped Back. Gone.
   - Setup does this right ("Not saved yet").

CONFUSING
- The list of kept copies shows identical rows ("Before a backup was restored, 25 Nov 10:46 / Put it back", three times) with no figures. Only some rows say "Kept until you drop it", so do the others expire? Show the bank figure and the number of spends for each row.
- The Put it back question says "Nothing was added since it was kept" even when putting back will bring a spend back.
- The restore question says "The backup holds 5 records". Say what it holds instead.
- Reminders says "Nothing is sent anywhere", but its Google and Outlook buttons put the bill name in a Google or Microsoft web address (for example `text=Rent%20is%20due%20on%2028%20Dec`). Say that tapping them shares the bill's name.
- The assistant offered "Log a spend of ¥999,999,999" (made up by the AI, far above the bank) behind one plain Apply, with no "this is more than your bank" line. The AI's text "Done, everything is gone." stays on screen even though nothing was removed.
- A copy from a newer app says "Update the app to load it." but not how to update.
- On a lost code, only the turn-on screen says "Nobody else can get it back for you." No screen says what to do if the phone and the code are both gone (only a backup file saves you).

POLISH
- "Changes made since 10:42" has no date, which is unclear after a day or more.
- The page calls `/api/health` on first open even with the cloud copy and the assistant off. It is the page's own address and sends nothing private.
- A first cloud check logs "console: Failed to load resource: ... 404".

FOR MAKO'S EYE
- Whether removes should ask first or only offer Undo (Not settled item 1). This brief requires asking.

PASSED (short)
- Every figure matched after a reload and after 10 s.
- Two live tabs show each other's saved changes.
- A move to a new phone with the code matched every figure.
- Restore asks first and matches the backup. Put it back works after a reload. Restoring twice keeps the first copy reachable.
- A backup from a device with its clock set to 2027 and to 2019 restored correctly.
- Newer and damaged files are refused in plain words and the device data is unchanged.
- The assistant cannot remove anything ("a change Ask can't make (remove_bill)"), and its Undo restores everything.
- With the cloud copy and assistant off, only the page's own address is called. With them on, still only the page's own address. The token is in a header, the code and invite word never appear in a web address, and the vault body holds no plain figures.

NOT CHECKED
- Closing a paid-off loan, Drop it on a kept copy, Take out on a goal: no time left.
- A real older saved copy: none was available. I made "older" files by relabelling a current one (v2, v1, some parts left out).
- The old app with real numbers typed in: I only opened it to its welcome screen.
- The per-day write limit, the real server, and the real AI.
