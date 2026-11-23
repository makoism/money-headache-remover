(qc-foundation confirming review 8, 23 Nov 2026. Copied from the reviewer's reply.)

FAIL

I ran both suites on wip-38.31 and they pass as stated: 736 of 736 cases and 725 of 725 asks, and the same in the realistic-ids run. The grid count also holds: 37 rows by 20 columns, 366 applicable, 3 stage 2, the rest not applicable.

Three new faults would need an engine or saved-id change later. There are also two soundness problems with AO. I did not repeat anything from confirm_review_1 to 7. My scripts are in /tmp/foundation_confirm8/ (each file below is in that folder).

## FOUNDATIONAL

**1. A closed account can still hold money other than zero. When that happens the look ahead throws, and three ordinary paths lead there.**
- **The rule:** `lookahead_ref.js:1222` refuses to work out any closed account whose figure is not zero. But `lookahead_ref.js:1216` reopens a closed account only when money comes in.
- **Path a (`a_closing_day_lunch.json`): a spend on the closing day.** The person pays 700 for lunch from the e-wallet at 09:00 and logs it on the phone at 21:00. At 10:00 the desktop types the e-wallet's 7,300 and closes it, which moves 7,300 out.
  - AO6 says an event on the closing day does not reopen the account.
  - AN4 says an event on the check's own day is judged by `told`, so the lunch comes after the closing check.
  - The merged copy has a closed e-wallet at -700, and the model throws: "closed with -700 in it [P6]".
  - A statement for that e-wallet imported later on one device gets the same result.
- **Path d (`d_spend_after_close_one_device.json`): a spend after closing, on one device.** An imported line dated after the closing day also throws (-1,200). At a merge, AN6 reopens the account for any event, but the look ahead on one device reopens only for money in. The two rules disagree.
- **Path e (`e_check_into_closed.json`): AO6's check figure typed into a closed account.** This throws today. That is expected while AO is being coded, but the reopen rule at line 1216 has to change for it anyway.
- **What hid it:** mg-272 to mg-277 leave out the final `check` that every closing writes (`accounts_ref.js:35`). With that check put in, mg-277's own story is sound (`b_day_before_with_check.json` passes).
- **What the base needs:**
  - The closing's check holds everything dated on or before the closing day.
  - One reopen rule shared by the look ahead and the merge: any event or check dated after the closing day.
- **Cost:** about an hour now. Later, an app that throws after an ordinary sync or import.

**2. AN2 checks only month and every-N-weeks rules, so the E x D cells are falsely covered for every other rule kind.**
- **The cause:** `merge_ref.js:518` judges only `every: 'month'` and `'weeks'`.
- **Path g (`g_yearly_two_devices.json`): a yearly bill.** The desktop ticks the yearly car insurance on 31 May. The phone, offline, moves it to 15 Jun from 1 May. After the merge, AN2 changes nothing, and the look ahead refuses the copy with [X8]. The app stops after an ordinary sync.
- **Same for other rules:** quarterly (`months`), `monthsList`, `once`, and a pay moved to `lastWorkday` (`f_after_merge_year.js`, third line: no move, no notice).
- **What hid it:** mg-268 to mg-271 and mg-287 all use monthly rules.
- **What the base needs:** AN2 should list occurrences with the look ahead's own occurrence code for every rule kind.
- **Cost:** under an hour now.

**3. The same statement imported on two devices before a sync counts every line twice (missing cell: S imported x D two devices).**
- **The cause:** import lines get ordinary ids. The repeat check (SCHEMA_V3 6.4, "the same line id or the same src") runs only at import time, on one device. The merge unions by id (`merge_ref.js:209-213`), and `possibleDoubles` offers only typed lines (`matching_ref.js:217`).
- **Who:** the phone reads the November card PDF offline on the train, and the desktop reads the same file that evening.
- **What happens:** every card line doubles. The card owed and the budget lines are doubled, and nothing tells the person.
- **What the base needs:** decide it now. Either give an import line an id built from what it is (account plus line id, like O2), which is a saved-id form and cannot be changed cheaply later, or add an after-merge rule that marks the repeat `gone`. Add the S x D cells to the grid.

## AO soundness (decided, being coded)

- **AO1 together with AN2 can count a pay that will never come, on the unsafe side** (`i_mg271_result.json`).
  - In mg-271 the person's new job pays on the 10th from 15 Dec. After the merge the change starts 26 Dec and the 25 Dec bonus of 450,000 is live again. The model now shows "9 days to 25 Dec" with 450,000 counted.
  - A settled pay or a `pe:` / `ps:` record really happened, so it should pin the change.
  - An `amounts` or `once` key did not happen. It should go the AJ5 way: moved to the new rule's occurrence, or left waiting in `pendingMove`.
  - AO1 should also mark `gone` any `pendingMove` entry that the moved-back change created.
- **AO5 across two devices brings back two stores for one minimum.**
  - The phone makes bank B the main bank: B's 20,000 moves into `home.main` and B's own `minBank` is cleared.
  - The desktop, offline, edits B's `minBank` to 25,000.
  - After the merge B is the main bank and still has its own `minBank`, which breaks AN3. The model reads the account's `minimum`.
  - This needs an after-merge fold: the newer value goes into `home.main`, the account's field is cleared, and a notice is shown.
- AO2, AO3, AO4, AO6 (apart from item 1) and AO7 are sound. Under AO3, mt-01 and mt-02 have to change to 95,000 and 125,000.

## Grid

- **Missing:** the S x D cells (item 3).
- **False covers:** ED on the bill and income schedule rows holds only for monthly rules (item 2).
- **Missing row:** `checkins` (SCHEMA_V3 7.1, a list record with `settled` and `fillers` ids, read for period-end freshness). It has no D, U, R or A cells. I expect it is sound by working, but it is uncounted.
- **Wording:** 7.1 stores `fillers: [<event id>]`, while 7.3 says the filler is never stored.

## Too-clean inputs

- The Z x D cases have no final closing check (item 1).
- The E x D cases use monthly rules only (item 2).
- No import is merged across two devices (item 3).

## Spot-check of 20 cells (all real covers for what they name)

- **ED:** mg-268, mg-269, mg-270, mg-271, mg-287.
- **ZD:** mg-272 to mg-277.
- **people:** mg-278 (D), mg-279 and mg-280 (U), mg-281 (R), mv-67 (M).
- **AN1:** mg-257, mg-259, mg-260, mg-263.
- **AN4:** cdb-01 to cdb-03.
- **AN5:** ed-60, ed-61.
- **AN7:** mg-283, mg-286, mv-126.

## Hand-checked, all correct by my own working

- cdb-01 (380,000), cdb-02 (10,000), cdb-03 (40,000).
- mt-01, mt-02 and mt-03 under AN5.
- mg-258 ("sun" wins).
- mg-263: 01:00Z beats 00:30Z, `lang` "ja", `rev` 16.
- mg-268: the 11 Dec entry is stamped 09:00.
- mg-271: the change moves to 26 Dec.
- ed-61: 550,000, with the waiting entry `gone`.
- mg-281: Mika `gone` 28 Nov.

## WATCH

- **The AN7 key form is half defined.** 38.31 keys go through `stmtNorm` (`src/stmt.js:13`: digits and punctuation removed, first three words), but AN7 only says "the shop text" trimmed and lowercased. If the v3 reader keys raw text, the moved lessons never match and every branch of one shop becomes its own key. Name the full key function in SCHEMA now. Changing it later means re-keying saved lessons.
- **Moved shop values are saved as `src: 'person'`, which cannot be undone.** 38.31 also saved the reader's "other" fallbacks (`src/ui45v.js:240`). They become permanent lessons the reader can never correct. A `src: 'moved'` value now would keep the choice open.
- **Stage 2 only:** none new.

## Files

- /tmp/foundation_confirm8/a_closing_day_lunch.json
- /tmp/foundation_confirm8/b_day_before_with_check.json
- /tmp/foundation_confirm8/c_mg277_no_check.json
- /tmp/foundation_confirm8/d_spend_after_close_one_device.json
- /tmp/foundation_confirm8/e_check_into_closed.json
- /tmp/foundation_confirm8/f_after_merge_year.js
- /tmp/foundation_confirm8/g_yearly_two_devices.json
- /tmp/foundation_confirm8/h_ends_two_devices.json (a schedule ended on one device while the other ticked an occurrence after its end: sound)
- /tmp/foundation_confirm8/i_mg271_result.json
- /home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/matching_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/rules/accounts_ref.js
- /home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js
