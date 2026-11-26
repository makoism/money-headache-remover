VERDICT: FAIL

CHECK: check3.txt ends "...e3_layout.js: PASS) / (full level, 3 at a time, 788 s in all) / ALL GOOD". fake_ai_page.js present; assistant tested with the made-up AI only (doors, cards, Undo), never a real one.

OWNER'S WORDS
- M13 NOT MET. Most after-setup gaps are in scope.txt. Also missing and NOT in scope: adding a loan, goal or budget line in setup; adding a second income after setup on the screens; ending the main pay; a yearly bill after setup; changing which account a bill, card, loan or pay uses.
- M14 MET straight after every add, change and remove on the screens and by the assistant. Not met for reminders (in scope).
- M15 MET. Remove a bill: Plan, tap bill, "End this bill", then "End Gym? ...", "Yes, end it", Undo. An empty amount never traps anyone.
- M16 MET in setup ("Your bills: saved", Undo). Not met on Check your bank (see blocker 3).
- M17 MET for asking. Doing things by asking is partial (see the grid).
- M23 NOT MET after setup: cash and e-wallet can only be added by the assistant. Pay-later NOT BUILT (IN SCOPE FILE).
- M24 NOT BUILT (IN SCOPE FILE).

COUNT: 25 kinds with 8 cells each (200 cells), plus 2 NOT BUILT rows. First mark per cell: YES 113, NO 35 (27 in scope.txt, 8 not), BROKEN 4 (3 in scope.txt), N/A 39, not checked 9. 9 YES cells also contain a NO for one field. Boxes tried: 33, 6 to 8 values each. Sheets tried: 21; every one has Back, Cancel, Close or Done.

GRID (Y yes, N no, B broken, * in scope.txt, NA not applicable, NC not checked; columns 1 to 8 as in the brief)

| Kind | 1 setup add | 2 later add | 3 change | 4 remove | 5 remove row in setup | 6 Undo | 7 reload | 8 assistant |
|---|---|---|---|---|---|---|---|---|
| Bank account | Y "Add another account" | N* | Y amount (Check your bank), N* name | N* | Y "Remove this account" | Y | Y | Y add, amount; N* rename, remove |
| Cash | Y | N* | Y amount, N* name | N* | Y | Y | Y | Y add; N* remove |
| E-wallet | Y | N* | Y amount, N* name/type | N* | Y | Y | Y | Y add; N* remove |
| Card | Y | Y "Add a card" (paying account fixed: N) | Y name, days, owed; N paying account, weekend rule | N* | Y "Remove this card" | Y | Y | Y add, owed; N* rest |
| Loan | N | Y | Y name, payment, day; N owed | B | NA (not in setup) | Y | Y | N* |
| Main pay | Y | NA one pay | Y; N "lands in" | N | NA | Y | Y | N* change |
| Second income | Y | N on screens, Y by assistant | Y | N* | Y "Remove this income" | Y | Y | N* change, remove |
| Bill | Y | Y monthly; N yearly | Y name, amount, day; N how often, paid from | Y asks | Y | Y | Y | Y all, asks to end |
| Budget line | N | Y | Y | Y "End this line" asks | NA | Y | Y | Y |
| Free to spend | Y | NA one | Y | Y by 0, no ask | NA | Y | Y | Y |
| Goal | N | Y | Y | N* | NA | Y | Y | Y add; N* change, remove |
| Spend | NA | Y | Y | Y asks | NA | Y | Y | Y add, remove; N* change |
| Refund | NA | Y | Y | Y | NA | Y | Y | same |
| Money in | NA | Y | Y | Y | NA | Y | Y | same |
| Move | NA | Y | Y | Y | NA | Y | Y | same |
| Bank check | Y | Y | N* | N* | NA | Y | Y | Y add; N* rest |
| Imported statement | NC | NC | N | N | NA | NC | NC | N* |
| Keep at least | Y | NA | N* | N* | Y blank | Y | Y | N* |
| Currency | Y | NA | N* | NA | NA | NA | Y | N* |
| Country | Y | NA | N* (not shown after setup) | NA | NA | NA | Y | N* |
| Reminder | NA | N | B* | B* | NA | N* | B* | N* |
| Backup file | NA | Y | NA | NA (own file) | NA | NC | NC | N* |
| Cloud copy | NA | Y | NA | Y "Turn off", asks | NA | NC | NC | N* |
| Setup answers | Y | N* (no Start again) | Y per kind | N* | Y | Y | Y | NA |
| Assistant change | NA | Y | NA | Y Undo | NA | Y | NC | Y |
| Pay-later | NOT BUILT (IN SCOPE FILE) | | | | | | | |
| Cash envelopes, play wallet | NOT BUILT (IN SCOPE FILE, M92-M97) | | | | | | | |

BLOCKERS (not in scope.txt)
1. A loan with a wrong "still owed" cannot be fixed or removed. The loan sheet has no owed box. Check your bank does not list loans. "Close this loan" says "Car loan still owes money. Tick its last payment at Check your bank first". Steps: Plan, Add a loan, owed 500000 (meant 50000), Add, tap it.
2. Setup on the screens has no loan, goal or budget line. A person types them on Plan afterwards and setup never says so.
3. Check your bank blocks every figure when one box is empty. Steps (390 wide): Home, Check your bank, type Alpha and Beta, leave Wallet cash empty, Save. It says "Type what Wallet cash shows today, as an amount" and nothing saves. Cards may be left blank; banks and cash may not.
4. After setup, a bill can only be monthly ("Once a year" is in setup only), and its "Paid from" cannot be changed. Add a card and Add a loan say "paid in full from your main bank": a card paid from a second bank cannot be added or changed after setup.
5. A second income cannot be added on the screens after setup. Plan has no "Add an income". The main pay has no end, and its "lands in" account cannot be changed.
6. Assistant: a remove for P2 (Side gig) or G1 (Trip) returns "Nothing changed: a remove for a ref I do not know". The tool's own description says remove takes S, B, P, L or G refs.
KNOWN (IN SCOPE FILE), one thing more than its line says: reminder changes (untick, a new time, "A week before") are gone after a reload, and the screen never says they will not be kept.

CONFUSING
- Pay sheet: changing only "Free to spend each pay from the change" and pressing Save says "Nothing changed". Goal sheet: typing in "Set aside" and pressing "Save changes" says "Nothing changed". Say "Use Set aside for this".
- Box words: "Type amount as an amount", "Type each pay period as an amount", "Type set aside now as an amount". A minus or a 17-digit number gets these words, not "no minus" or "too big", in every Plan sheet. Setup's main bank (17 digits): "Type what Alpha Bank shows today". Setup's other boxes say "too big" and "without the minus".
- Free to spend: an empty box gets "Type an amount above zero", yet 0 saves at once with no question.
- Home shows "Bank today: Wallet cash" for cash.

POLISH
- A served page logs "Failed to load resource: 404" (d.errs).
- An empty name for a second account saves with "Saved".

FOR MAKO'S EYE: none.

NOT CHECKED: an imported statement end to end (needs a statement through the made-up AI); a goal's "Take out" with Undo, and "In an account of its own"; backup Save, Restore and Put it back; cloud Undo and after a reload; Undo of an assistant change after a reload; closing a loan that is paid off; about 12 boxes (notes, search, dates on Receipts, code words, backup lock, setup names other than one); the desktop 1300 size for the screens (I used the assistant on desktop only); the setup chat door; the AI code word kind.
