VERDICT: FAIL

Round notes: `app3/tests/fake_ai_page.js` and `app3/tests/README.md` are missing in this build, so the assistant was tested with the stand-in from the top of `tests/e3_ask.js` (a made-up AI, not the real one). check3.txt ends with ALL GOOD.

CHECK:
```
[x] The real-page walk (walk 4 run A) as a gate: Mako's made-up shape from setup on 24 Nov to 15 Feb through the page ...  (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum ...  (tests/e3_setup.js: PASS)

(full level, 3 at a time, 410 s in all)
ALL GOOD
```

OWNER'S WORDS (lines that touch layout and touch)
- M1 NOT BUILT (IN SCOPE FILE). At every size the assistant is the text link "Ask", 32 by 44, in the top corner. It opens as its own full screen, so it never covers anything.
- M14 NOT MET. After "Log spend" and after "Save change" the Undo is off the screen (blocker 2).
- M18 COULD NOT TELL for coverage (scope file). The "?" buttons that exist are 28 by 28.
- M33 MET for size only: 412x915 measured in full. Installed to the home screen not tested.
- M60 NOT MET for commas: none of 16 money boxes adds them. Arrows: MET, the browser's own arrow, centred in height at phone and desktop.

COUNT
- Screens: 86 screens, sheets, steps and messages at each of 390x844, 412x915, 320x640 and 1300x900, each in dark and light = 688. Plus the same 86 at 390, 412 and 320 with the height cut to 420 (dark) = 258. None failed to open. The 86: 13 on a new device (welcome, empty Receipts, empty Plan, Settings, 2 "Set up first" messages, I have a code, Lock it with a code, other device door, setup blank, setup with every row, 2 setup messages); 6 made-up book; 41 on a stress book typed in by hand (60-letter names with 28-letter words, 999,999,999.99, 6 accounts, 2 cards, 12 bills, 8 goals, 300 receipts): Home, 3 Help, Check your bank, Add statements (2), Add a card, Receipts and its 4 kinds, change, search, earlier, Plan and its 11 sheets, Settings (2), Reminders, Ask (4), 8 messages; 13 on a book with 60-letter names in ordinary words; 13 on a book with short names and 999,999,999.99.
- Tappable things: 4,304 measured per size and scheme (34,432 in all). Under 44: 185 per size, the same at every size: "Ask" 32x44 (86, every screen); "?" 28x28 (23); "Use any AI instead" 32 high (4); "Show the page as on" date 146x38 (6); "Landed on" date 28x52 (2); tick boxes 13 to 22 wide (64, each inside a label 44 or more high, so the row itself can be tapped).
- Findings by size: sideways scroll on 22 of 86 at 390 and 412, 24 at 320, 0 at desktop. Text cut in a control on 34 at 390, 31 at 412, 34 at 320, 19 at desktop. Contrast under 4.5 on 35 in dark (hints only), 7 in light.
- Page errors: 0 at every size. One console error ("Failed to load resource") only when "Keep a copy in the cloud" is tapped on the page opened as a file; none on a served page.

BLOCKERS
1. Check your bank, every size, ordinary names. Set pay day to today, answer "No, not yet", tap "Check your bank". Under the "Pay" row the "Landed on" box is 28 wide and shows no date; the label breaks into "Landed / on". The day cannot be read. It should be wide enough to show the date.
2. Receipts, every size. Type an amount, scroll to "Log spend", tap it. "Logged ¥1,200 on Free to spend / Undo" appears at the top of the page, 54 to 330 px above the screen, and is gone in about 8 seconds. Same for "Changed / Undo" after "Save change". Nothing on screen says it saved. Desktop too (26 px above). It should show where the person is.
3. Plan, 320 wide, ordinary figures. A line "Food" of ¥1,000,000: "¥500,000 left of ¥500,000" runs off the card and the page scrolls sideways (335). Receipts does the same (351) after a ¥12,345,678 spend. At 390 and 412 this is fine.
4. Big figures (999,999,999.99, short names), 390, 412 and 320. Plan: "$499,999,999.99 left of $499,999,999.99" runs off the screen (page 504 wide). Receipts 456. Ask, "Proposed change": the Now and After figures run off the card (426). 320 also Home (365).
5. Names with a long unbroken word (28 letters), all phone sizes. Home 519 wide, Plan 623, Receipts 543, Reminders 433 ("Outlook" pushed off), Check your bank 445 (the amount box leaves the card). Names in ordinary words up to 60 letters wrap and are fine.
6. Drop-downs are a fixed narrow box and cut their own words. At 390: "On a day eac", "the working d", "Free to spen", "In my bank, s", "From the nex". At 320 even "Main bank" and "Each month" are cut. At 412 "Free to spend" just fits, the setup ones do not. A 60-letter account name shows as "Bank0 Electr" on phones and about 25 letters on desktop.

CONFUSING
- No commas while typing or after leaving, 16 of 16 boxes: setup (bank, pay, everyday, keep at least, account, card, bill, second income), Receipts "Amount", Check your bank, Plan add line, goal, bill, card, loan (2). Typed 1234567 reads "1234567". Check your bank also pre-fills "240000".
- Keyboard on desktop. Order and the focus ring (3px green) are good. Enter saves from Receipts "Amount", Settings "Code word" and Ask only. It does nothing in Receipts "Note", Plan sheets, Check your bank, setup. Escape closes Check your bank, Ask, Settings, Reminders, Add statements. It does nothing on Plan sheets, the receipt change form, setup.
- Name boxes show about 30 letters of a 60-letter name on Plan change sheets (the rest scrolls inside the box).

POLISH
- Dark: hint text in boxes ("Optional", "A note, a line, an amount", "Main bank", "XXXX-XXXX...", the currency sign) is 3.83:1.
- Light: "Your bank is not saved yet. Press Save under it first" 4.32:1; "Made-up numbers shaped like a real month" 4.42:1.
- Cards are 86% solid over the green backdrop; all other text passed against the worst backdrop colour.
- Tick boxes shrink to 13 wide beside a wrapped label (Reminders, Ask) and stay 22 beside a short one.
- 300 receipts are one list 39,000 px long. The bottom row can be reached and tapped; it is a long scroll.
- Keyboard up (height 420): the tabs bar keeps 61. The box and its save button are both reachable by scrolling, nothing covers them; "Log spend" sits five fields below "Amount".

FOR MAKO'S EYE
- "Ask" as a small text link beside "Settings" and "Reminders".

NOT CHECKED
- A real phone, a real keyboard, the installed app, iPhone (WebKit is blocked here).
- Restore from a file, the "which to keep" sheet for two devices, cloud copy past the code screen.
- Statement reading past "Read with the AI".
- Light scheme with the height cut to 420.
- Ask with the real AI.
