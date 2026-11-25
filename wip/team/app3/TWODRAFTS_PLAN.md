# One set of setup answers before the book exists (fix B, ruled by Coordinator 14, 26 Nov)

Serves: M1, M2 (setup is a chat that fills the app), M13, M14 (change and Undo), M16 (each section saves on its own),
M36, M37 (the bank figure is the bank today), M61 (nobody loses data). Touches: the chat's draft (device only), the
setup screens' Save and Undo. It never writes the book or goes through the write door.

## The fault (qc-assistant run 4)
Tell the chat "Sora Bank 250,000". Open the setup screens, change the bank to 260,000, Save, Back. The chat's fill
writes 250,000 and the 260,000 is gone without a word. Cause: two stores of setup answers before the book exists
(the chat's draft, CHAT3.state.draft; the screens' own draft, E3.rec('setup')), joined one way only (chat to screens,
chat3Screens with ANSWERS3.toForm).

## The rule
The newest answer wins, both ways, section by section. The screens' sections map to the chat's draft fields:
bank = country, currency, banks (with today's pay answer); pay = pays; free = free; cards = cards (with the statement
answer); bills = bills (with the "already out" answers); min = min. Amounts stay in minor units (never through the
chat's typed-amount reader).

## Build
1. chat3_core.js (node tests):
   - K.fromScreens(state, sec, answers): the section's fields of the answers (ANSWERS3.fromForm of the screens' form,
     the one shared answers function) replace those in the chat's draft. A currency change drops the other amounts
     exactly as draft_set does (the same code, moved into one function). Records state.screens[sec] = what was
     written (a stamp). No write once the draft became a book (state.fill).
   - K.undoScreens(state, sec, before, wrote): the draft as it was before that Save if nothing changed since; if the
     chat changed something else since, only that section's fields go back, and only while they are still what the
     Save wrote; if the chat changed that section since, the chat's newer answer stays.
   - K.chatNewer(state, sec): the chat has an answer for the section that the screens never saved, or changed it
     after the screens' last Save (its fields differ from the stamp).
2. setup3.js: a section's Save writes it into the chat's draft (K.fromScreens) and saves the chat; its Undo puts
   the chat's draft back (K.undoScreens), also with setup closed.
3. chat3.js chat3Screens: after the screens put back their own draft, each section the chat holds newer
   (K.chatNewer) and the screens have not typed over since is filled from the chat (toForm, that section only). A
   section filled this way that was saved before shows "Not saved yet", so See my money asks for its Save.
4. The line at the top of the setup screens: "Filled in from the chat, not saved yet: ..." names only the sections
   the chat filled; a section typed by hand is under "Not saved yet: ...".

## Tests first (seen red)
- Page, real core: chat 250,000; screens 260,000, Save, Back; "Your answers so far" reads 260,000; the chat's fill
  makes Home show 260,000.
- Undo of that Save: the chat's draft reads 250,000 again (setup open and closed).
- The chat changes the bank to 270,000 after the screens' Save: the fill writes 270,000; opening the screens shows
  270,000, Not saved yet.
- The same in US dollars (cents): 2,500.00 to 2,600.50.
- Node: K.fromScreens, K.undoScreens, K.chatNewer, a currency change from the screens drops the chat's other amounts.

## After qc-foundation on this plan (FAIL, 7 points, 26 Nov)
Taken in: (1) a bank Save from the screens carries an account renamed in place (same position) into the chat's pays,
cards and bills; when the screens refill the bank section from the chat, the sections that point at accounts and that
the chat holds are refilled with it, so no row points at the wrong account by position. (5) null and missing are the
same answer in every comparison. (6) Undo after the fill changes nothing (the core refuses). (7) a round trip: the
chat's answers, every section saved on the screens, give the same book input as the screens alone.
Not built, with the reason: (2) a currency changed on the screens leaves the screens' own other boxes as typed: that is
the screens' own rule today, not a join fault; the chat's draft drops its amounts and the screens refill them blank on
the next open, so they are asked again. (3) the chat's draft has no afterTax or same field (draft_set checks them and
does not keep them) and a blank statement box already means "all of it" on the screens. (4) a bank or card Save on the
screens is a figure checked today (yesterday's figure leaves the box empty, AI_JOIN_FIXES F; a section saved on an
earlier day asks to be saved again, DAY_BOUND3). A removed account that a chat item still names is refused at the fill
in words ("not one of your accounts"), never silently moved: listed for later.
