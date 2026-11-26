# qc-novice, build lane/ai-join at 0f729b02 (wip/team/app3/index.html), phone 390x844

VERDICT: FAIL (one blocker; part 6 STUCK twice, both in scope.txt)

CHECK: check3.txt ends "(full level, 3 at a time, 863 s in all) / ALL GOOD"

OWNER'S WORDS (section E)
- M52 NOT BUILT (IN SCOPE FILE, M10 M52): there is no picture. Every screen is words and sums.
- M53 MET in the chat: one question at a time. NOT MET on "Set up on the screens": one long page with six sections and about 15 boxes.
- M54 COULD NOT TELL: the chat sounds plain. Home reads like a receipt, for example "¥61,510 (what your accounts can spare) − ¥32,177 (held back: Free to spend has only ¥29,333 left this period)".
- M55 MET (chat).
- M56 NOT MET: the setup section is still headed "Everyday spending" (Not settled 6). The line under it explains it well.
- M57 NOT BUILT (art comes later). M58 MET. M59 not judged. M60 NOT BUILT (marked later): no commas appear as I type.
- M88 M89 M90 M92 to M97 M99 NOT BUILT (IN SCOPE FILE).
- M91 NOT MET: taking money out of a goal offers no choice of where it goes (spend it, keep it in the bank, later). Logging my pay as money in asks nothing.
Outside section E: M45 broken, see B1.

COUNT: 8 parts. 6 DONE (1, 2, 3, 4, 5, 8). Part 6 STUCK (close a card, stop a goal). Part 7 DONE for the assistant, STUCK for Help on 4 of 5 screens. Places I would have given up: 3. Words nobody explained: 14.
1 DONE. Before tapping: "it sets up my money by chat and tells me what's safe to spend until pay". The first question ("Which country do you bank in") is clear. With the assistant off, the first thing I see is "The assistant is off right now".
2 DONE on the screens: bank 63,000, pay 210,000 on the 25th, one card, Rent, Netflix, 40,000 everyday. "That isn't an amount. Type digits only" is clear. Chat setup walked with the scripted made-up AI (MAKO_SETUP, doors only). "80000 yen" and "80k" are refused when a person would expect them to work.
3 DONE. Removing a bill works. An empty Netflix amount shows "Type the amount of Netflix" with Remove next to it. Back keeps "Your answers so far". Closing halfway and reopening kept even my unsaved bill rows.
4 DONE, barely, see C1.
5 DONE. Lunch 12,000 fixed to 1,200 by tapping it. Pay day, late rent and a bank mismatch all work. Trip goal set aside 20,000, then took out 15,000.
6 New job, a second bank and cancelling a bill DONE ("End this bill", with a confirm). Close a card STUCK: the card sheet has only Name, days, Paid from, Save, Back. Stop a goal STUCK: the goal sheet has Set aside, Save changes, Take out, Back. Both are in scope.txt (M13).
7 The ask box answered from Home, Receipts, Plan, the goal sheet, Settings and Reminders (made-up echo AI: proves the doors work, not the answers). "?" is only on Home (3 of them). Receipts, Plan, Settings and Reminders have none, and there is no Help anywhere (M18, in scope).
8 DONE, mostly numbers. The top says "Check your bank / Your bank figure is from 25 Dec" and "Pay due 15 Jan has not been seen yet". Nothing says "while you were away: pay, rent".

BLOCKERS
B1. Pay counted twice (M45, M22, M36). Steps: after setup, open on a day after pay. Receipts, "Money came in", 245000, note "my pay", "Log money in". Home still says "Pay due 15 Jan has not been seen yet". Check your bank still ticks "Office job 15 Jan" and says "Expected now ¥541,000". Save with the bank box blank ("Leave it blank if you have not looked"). Home: "Bank today: Yucho ¥541,000 ... + ¥490,000 (in, logged since)". The real bank holds 296,000. Money came in is the plain door a new person picks for pay. It should ask "Is this your Office job pay?" and tick it instead.

CONFUSING
C1. Home has four names for money: Safe to spend, Free to spend, "can spare" and "held back". I could not say why ¥32,177 is "held back". Replace with one line, for example "You set ¥40,000 for everyday things. ¥29,333 of it is left for the days until pay".
C2. On the first pay day after a bank check, the new period opened with ¥14,690 of ¥40,000. The 25,310 gap found at the check went to the new period (the rule is settled). Nothing on Home says so. Say "¥25,310 you didn't log came off this period".
C3. I took 15,000 out of Seoul trip because I needed it. Safe to spend stayed ¥14,690. The only word was "Taken out of Seoul trip". Say where it went and offer "add it to this period's spending".
C4. Changing the pay from 15 Jan: the Plan row says "Office job, day 25 each month, next 15 Jan". Opening it again shows the old ¥210,000 and day 25, with no word that a change is waiting.
C5. A late bill is listed twice on Home: Rent under "Late, not ticked off yet" and "Not seen yet" (on 30 Dec), and under "May still go through" (on 28 Jan). Same family as the KNOWN M51 fault, but this build was meant to show one late list.
C6. Add an account: "Not taken from Yucho since its figure of 25 Dec 2026 / Moved from Yucho after its figure of 25 Dec 2026". I would have given up here. Ask "Did you move this money from Yucho after 25 Dec?" Yes / No.
C7. The new account reads "¥0 (checked 2 Jan)". I never checked it, and I said the money moved on 3 Jan.
C8. With the assistant on, my first message clears the welcome and the country question from the chat.

Words not explained (my guess in brackets): Free to spend (same as safe?), held back (frozen?), can spare, statement closes / 締め日 (no idea), pay period (month?), figure (a number?), tick off (?), Not seen yet, May still go through, e-wallet (PayPay?), budget line / Add a line (?), Add statements (upload my bank app?), Changes from, Moved.

Places I would have given up: C1 on first Home, C6, B1.

Forms or chat: the chat felt like "I say what I have and it sorts it out". The screens and every change after setup feel like forms: Check your bank, the pay sheet's "Changes from", Add an account.

POLISH
- A Plan bill row repeats its amount: "not seen yet, ¥68,000, next 27 Jan 2027, ¥68,000" then "¥68,000".
- Ticking a late bill can't say the day it really went (Rent paid on 30 Dec shows 28 Dec).
- The heading "This pay period 25 Dec 2026 to 28 Jan 2027" stretches to today when the pay is late.

FOR MAKO'S EYE
- After a mismatch the first Home is "Fine for now" in calm words. Good for no shame, but it could hide C2.

NOT CHECKED
- The real AI's answers (none reachable): changing my mind by chat ("actually 70k"), asking it to close a card.
- Desktop and 320 wide. Undo after reload (KNOWN). Two devices.
- Scripts and pictures: /tmp/qc/qc-novice/
