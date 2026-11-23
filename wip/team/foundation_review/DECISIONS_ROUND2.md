# Foundation decisions, round 2 (23 Nov 2026)

One list of what changes after schema_review_2.md and the four sweep 2 reports (sweep2_experience, sweep2_repeats, sweep2_platform, sweep2_requirements). SCHEMA.md is rewritten from this list into one consistent document (no appended overrides), and the money rules are written as a small runnable reference model with worked examples as tests, because two reviews in a row found prose rules read two ways (LESSONS lesson 2 sign). Items marked MAKO go to him as one cause-level question with a recommendation.

## A. The check-in is the product (sweep2_experience)
A1. A check-in is one moment (`grp`): the balances typed, the expected items it settles, and the filler. Each account's figure carries its "as of" date; safe to spend reports its oldest input.
A2. The check-in first lists every expected item due since the last one (pay, card payments, bills), ticked by default, amount editable. Ticking pay writes the income event that starts the period; ticking a card payment writes the repay.
A3. What is left is a **filler** for a stretch (from the last check-in to this one): its amount is always worked out (check figure minus logged events in the stretch), never a fixed adjust. Lines imported or typed later inside the stretch shrink it.
A4. A filler stretch that crosses a period start is split by days, or all to the older period when the person says "mostly before pay".
A5. A settled link survives a schedule edit: an occurrence is identified by its schedule and its sequence number (the Nth occurrence), and the edit screen shows what moves.
A6. Typed lines can be marked rough (`est`); an import line within the account's posting window and a set margin replaces it (`gone`, `goneBy` the import). Imports carry a source type (statement, screenshot, typed) and a statement replaces screenshot lines in the same stretch. Schedules carry an amount margin (`vary`) for matching.
A7. The period-end question (Mako decision 3: always asked) runs after a fresh check-in: if none in the last 3 days of the period, the question starts with the check-in. Nothing left in Free to spend or a budget line rolls on silently: it waits in its place, marked "to decide", until answered.
A8. Setup defaults the engine accepts as valid: country gives the holiday rule; payment account is the main bank; cards paid in full; close day "not sure"; bills monthly from the main bank; one "all my bills, roughly" line that can be split later; pay is one stream (Mako's two incomes may stay one number); Free to spend is what is left. Target: 12 to 15 setup screens. Pay is never blank: the next pay date is asked.

## B. Safe to spend, exact (schema_review_2 F1 to F9) — written as code in the reference model
B1. Take off what is left of this period's budget lines and of Free to spend's own set-aside before the walk (F1).
B2. Opening mid-period: the opening asks "spent since pay day?" for Free to spend and each budget line, or shares them by days left; it writes those as places (F2).
B3. Same-day order: income first, then bills, then planned spending (F3).
B4. No fixed pay: budget lines and Free to spend come off day by day across the horizon; the horizon reaches the second occurrence of every monthly bill; "lasts about N weeks" is an engine figure now (F4).
B5. Transfers and auto-spends are in the walk; loans and pay-later own their payment day like cards; `extra` payments move to the loan (F5).
B6. One bank opening split by place; goal and pile money are places inside it, never a second open (F6).
B7. An event between two accounts where one is before its opening: the other side goes to Waiting. `pre` is worked out each time, never stored (F7).
B8. `amounts` keyed by the unshifted date; budget lines get one-period overrides; custom lines may sit in any place; `per` per amount; a "main bank" flag; Undo copies leave the shared copy (F8).
B9. Only headroom above zero counts; the walk starts from the lower of the events total and a newer unaccepted check (F9).
B10. Education, Giving and Investing are places with `keptIn` like goals, protected in the headroom (requirements 1a). An **investment** account type with checks, its value allowed to move on its own (1b).
B11. Look ahead for warnings reaches 12 months ("Later on: Jul 2027 ends below zero"); the safe-to-spend walk uses its own shorter horizon (requirements conflict 6).

## C. The screen layer's shared pieces (sweep2_repeats, lesson 2)
Before any screen is wired to the new engine: one status object (state, reason, next step) every screen reads; one name table tying each label to its figure; one amount formatter; one message queue; a typed-or-sample mark on every value; one input behaviour (tap selects); no screen works out a money figure itself (a test checks every screen shows the engine's figure). Sample data lives apart from the person's data and is never moved as real (requirements 1c).

## D. Platform (sweep2_platform)
D1. IndexedDB is the main store, one record per event plus one for the rest, written per change; localStorage only for small device things.
D2. Undo is the `gone` marks; no full copy inside the saved copy; a copy kept for a big replace is its own record.
D3. Device-only state (look, tour, Undo copies, `clock.lastSeen`) is split from the shared copy.
D4. `at` is a hybrid clock; merge is union by id, newest `at` per record, `gone` wins. On a cloud conflict the page merges and sends again; it never asks "keep mine".
D5. Cloud copy and backups carry `fmt` and are gzipped before encryption; pushes on leaving and at most every 1 to 2 minutes; backups read without a text box; the move link retired.
D6. Every writer checks the version; an old page meeting newer data becomes read-only "Update the app"; the move leaves a marker on the old key; precache with reload; a 3 second network timeout.
D7. `navigator.storage.persist()` after setup, shown in Settings with the space used.
D8. All engine date maths on whole day numbers; "today" recomputed on return to the app; one day back allowed without asking; tests under two time zones; a 30,000-event speed budget test.

## E. Requirements (sweep2_requirements)
E1. The move is proved on every old build Mako's data can be in (38.28 live, and the 25.0 to 38.28 builds), not only 38.31; the bank comparison Mako sees before deploy is redone on the new engine.
E2. The currency cannot change once events exist, unless the change converts explicitly with a preview.
E3. The cloud copy of the new shape sits where old pages cannot load or overwrite it; the vault server fixes it needs (fmt refusal, dated versions, safe Turn off) move into stage 1a; rollback is planned for the new key.
E4. Mako's way in is statements first: the any-AI paste format and its checker write the new shape in stage 1a; Japanese bank and card files go through the AI route until a Japanese reader exists.
E5. Yearly costs refill after each payment: the set-aside starts again for the next occurrence.
E6. One home for every loan: a loan is an account that owns its payment; the old "Loan or debt payment" bill line is matched to it at the move (or dropped with the person's OK), never both.
E7. The privacy lines that are false (statements going through the relay) are corrected now.
E8. ACT (every action) and the assistant's checked actions are rewritten to the new shape in stage 1a; the 3D world will call ACT only.
E9. Check-ins and app opens are recorded per device (for "know whether it works" and the streak), outside the shared money data.
E10. Every fact Mako stated about his money gets its failing test now (his shape; close days unknown; two incomes on one day entered as one).

## MAKO (one cause-level question, with a recommendation)
M1. **The minimum balance.** It decides how much is safe to spend, and today nobody chose it. Recommended: setup asks once, "Keep at least ___ in your bank so you never feel close to zero", with no amount filled in; skipping means no minimum.

## Effect on size and date
Added to stage 1a by this round: the check-in and filler (A), the screen layer's shared pieces (C), the platform items (D, about 4 to 5 days), the any-AI import and the moves from every old build (E1, E4), the vault fixes (E3). Stage 1a was 150 to 190 hours; it is now about 230 to 290 hours. Version one for Mako moves from about 5 to 8 Dec to about **14 to 19 Dec (JST)**. This is an estimate and firms up once the rewritten shape and reference model pass review.

## F. The 24 open rule questions from the scenarios (scenarios/README.md), decided
F1 (Q1) Income first on the same day. F2 (Q2) The walk counts every income occurrence dated before each later item. F3 (Q3) A pay past its date and not seen is not counted; it shows "not seen yet". F4 (Q4) "Not seen yet" after the date plus the account's posting window (default 1 working day). F5 (Q5) A card refund posted after the close lowers the next statement. F6 (Q6) A close day does not move. F7 (Q7) The open statement shows "so far, still open"; it is in "due before next pay" only when its payment day is before the next pay. F8 (Q8) Pay that lands early starts the period on the day it lands. F9 (Q9) Each account is walked and warned on its own; Home shows one headline (the section B rule) with the warnings under it. F10 (Q10) Home also shows "bank after the cards are paid" (Mako, A5). F11 (Q11) Other currencies stay beside Total, never converted, until stage 2. F12 (Q12) A couple picks one stream that starts periods (default the first entered). F13 (Q13) With no fixed pay, "due before next pay" becomes "due in the next 30 days". F14 (Q14) Cards are not taken off as one lump today: the walk takes each statement off on its payment day (income first), and the still-open part on the payment day after its close; anything beyond the horizon comes off at the horizon's end. This is right for Mako (pay and card payment the same days) and for someone paid before the payment day. It replaces "everything on the card today" in 10.3. F15 (Q15) A check gap is offered as the filler (A3). F16 (Q16) A different real amount does not change the next estimate unless the person ticks "use this from now on". F17 (Q17) Bank-closed days are a separate table per country, used by the working-day rule. F18 (Q18) "Owed now" includes logged buys not yet posted. F19 (Q19) Pay-later is its own account with an instalment schedule; what is still to come is shown as owed. F20 (Q20) Setup asks "already gone out?" for bills dated from the last pay to today. F21 (Q21) "Due before next pay" lists every account, grouped by account. F22 (Q22) Planned goal set-asides are not counted in the walk; only money already set aside. F23 (Q23) An item dated today is "due today" until the day ends. F24 (Q24) After a gap the bank figure stays at the last check, with its age shown; nothing is projected as fact.
The scenario figures are updated to these readings where they used the other one (the `alt` figures).

## G. Answers to the reference model's four questions (SCHEMA_V3 section 14)
G1. Every account walks to the SCHEMA 10.3 horizon: the later of the second next pay that starts a period and today + 45 days (README rule 9 is replaced).
G2. "Free to spend's own set-aside" in B1 means money already set aside inside Free to spend for something named; its remaining amount is not taken off again (the headline is already capped by it).
G3. An item inside its posting window is `mayStillPost`: counted as expected, shown as "may still arrive" (wording in Mako's copy pass).
G4. A pay dated today counts as coming in until the day ends; not seen by then, it becomes "not seen yet" and stops counting (F3, F23).

## H. Decisions from schema_v3_review_1.md
H1. Every record gets `told`: when the app first heard of it, set once, never changed by edits or merges. A check includes the events dated before its day, and those dated on its day whose `told` is before the check's `told`. A bank event with `posted` is in a check by its posted date. Two check-ins on one day: the later one's stretch starts at the earlier one.
H2. Schedules change from a date: `rules: [ { from, rule } ]` like `steps`. An edit never rewrites occurrences before its date. An occurrence is named everywhere by its schedule and its unshifted due date (A5's sequence number is dropped).
H3. A card statement = what was carried over, less payments and refunds since the last close, plus the lines in the cycle. A statement at or below zero is a credit carried to the next one; nothing is due and no item is made.
H4. Close day "not sure": on each payment day everything owed (less payments since) is due. The model must handle it with and without a typed last statement; it is Mako's case and needs its own scenario.
H5. A repay or transfer between two currencies carries `a` (what left) and `a2` (what arrived). Until stage 2 the walk warns when a card's paying account is in another currency, and uses the typed `a` for the bank side.
H6. `gone` wins only against a copy of the record whose `at` is the same or older. A Redo (newer `at`) wins.
H7. Every rule the engine will have is in the reference model with worked asks before engine code: `year`, `monthsList`, `lastWorkday`, `once`; paying from a place; refill of yearly costs; loans and pay-later with `minRule`, `extraSteps` and a carried balance; autoSpend; the opening split by place; `posted`, `avail` and `est`. Matching, period end, merge and units may stay out of the model only if section 12 says so and each has its own test file before the engine lane starts.
H8. Late pay: a pay past its date but inside its posting window is "late, expected". It still counts, the period does not move on, and "days to next pay" says the pay is late. After the window it becomes "not seen yet" and stops counting.
H9. WATCH items: the same amount typed on two devices on the same day for the same place is offered as a possible double; a rough (`est`) spend matches an import within 10%; pay every two weeks uses the real count of pays in that year (26 or 27) for monthly amounts, spread so the year adds up; old copies with no currency are asked, never set to pesos; `bankStart` with no `bankAt` is dated to the copy's last saved day; `items[ym]` in the move month is due on the first day after the opening, not treated as paid; a weekly autoSpend's weekday (`on`) becomes its rule.
The reviewer's 14 situations (ref/review_v3_situations/) become scenario asks with hand-worked answers.

## I. Answers to the model's questions after H (SCHEMA_V3 section 14)
I1. `avail`: an "available" check already includes pending debits, so every event dated on or before its day is inside it; a "current" check follows the H1 posted-date rule. The default when not asked is "current". Needs its own asks.
I2. Interest: added on the carried balance at each card close and each loan or pay-later payment day, balance x yearly rate / 12, rounded half up to the minor unit. In the model now, with asks.
I3. A card paid two months after its close: "carried over" means only statements not paid by their own payment day. A statement still waiting for its payment day is never folded into the next one. Needs asks with such a card (common in Japan).
I4. Opening split "by days left": days from the setup day to the period's last day, both counted, over the period's days; amounts rounded down to the minor unit, the remainder to Free to spend.
I5. `told` for records moved from 38.31: the record's own time if it has one, else the copy's last saved time; on one day they keep the old list order.
I6. The helper's five readings are confirmed: while pay is late, "due before next pay" counts to the late pay; two unpaid statements never double count; a card paid from another currency is left out of the walk with a warning; a place pays a bill up to what it holds and the account pays the rest; an opening with no time covers its whole day.

## J. Answers after I (SCHEMA_V3 section 14, second list)
J1. A card with close day "not sure" that carries a balance gets its interest on each payment day.
J2. I5 is corrected to agree with 11.1: a moved receipt with no time is told at the start of its day, so a receipt on or before the moved bank figure's day is inside that figure. A moved bank figure with no own time is told at the copy's last save. On one day, moved receipts come before moved figures.
J3. I1 is refined by H1: an "available" check holds events dated before its day, and those on its day told before it. A spend told after the check is after it, whatever the check kind.
J4. When the split names Free to spend, the typed figure stands; rounding leftovers of other lines stay in Waiting.
J5. A card's opening may hold several unpaid statements, each with its amount, close date and payment day (a two-month card set up between closes).
The helper's seven readings (payment order to statements, late payments lowering the statement they were carried into, carried balance after payments with no interest on a credit, interest before the payment on loan days, the projected interest in the next open payment, a statement item asking what is left of it, the I4 leftover rule) are confirmed.

## K. Answers after J
K1. A "not sure" card's interest is on everything owed before that day's payment, as on a loan (the model's reading, confirmed).
K2. With a percent minimum, the day's interest is added first and the minimum is worked out on the balance including it. Needs an ask and a model change.
K3. A moved `cfg.bankNow` with no `bankNowAt` is dated to the copy's last saved day.
Confirmed readings: J2's order applies when a receipt and a figure are told at the same moment (moved-01 stays 296,000); a payment day typed with an opening statement still follows the card's weekend rule.

## L. The 40 open questions of the rule files (rules/*.json), decided
Matching: q1 no `vary` means exact; a different real amount is ticked by the person at the check-in. q2 an import may settle an expected item up to 5 working days early. q3 a typed line matches an import posted within its posting window either side of its date. q4 a card line matches by buy date or posted date; cards default to a 7 day posting window. q5 the import takes over the typed line's `settles`. q6 the typed line wins and is replaced by the import, which carries its settle. q7 the closest date wins, then the earliest `told`. q8 a statement removes the screenshot lines inside its own dates, matched or not; `goneBy` is the statement import's id. q9 equal-rank repeats with the same line id (date, amount, direction, count) or the same `src` are dropped. q10 within 10% means |a - b| <= 10% of the larger, compared exactly in minor units; the model follows this. q11 a budget line counts as the place. q12 "both are real" is kept as `notDouble: [id]` on the newer record. q13 "same day" is the spend's date.
Period end: q1 a check-in after the end counts, its stretch split by days (A4). q2 the question comes when the next period-starting pay is seen. q3 the period waits for pay; after the window the check-in asks "did your pay come?", and the person can start the new period. q4 an overspent line is shown with how much over and covered from what is left in Free to spend, then Waiting, as the person picks. q5 nothing left: one line, "nothing left this time", no question. q6 "keep it here" leaves it in the same place; the next period's amount adds on top. q7 "to decide" money is not in the new period's safe to spend. q8 two unanswered ends stay apart, each answered with its own last day. q9 fresh only when every spend-from account was typed. q10 answers adding up to more than is left are refused, with the amount left shown.
Merge: q1 each record carries `by` (the device part of its last writer); on an equal `at` the larger `by` wins. q2 entries inside `steps` and `rules` carry their own `at` and merge by `from`. q3 a record's `at` moves only when it changes; the copy's `rev` is the larger of both plus one (q5). q4 an edit newer than a removal brings the record back, and the next check-in shows "came back". q6 shared `ui` keys carry their `at` in `ui.at`. q7 the earlier `told` is kept. q8 an `at` more than a day ahead of the newest other `at` known is held at that point plus one millisecond and a warning is shown.
Units: q1 the full ISO 4217 minor-unit table ships with the page; unknown codes use 2. q2 a typed amount with too many decimals is rounded half up and the screen says so. q3 the pay count uses the unshifted due date's year; a period that crosses 31 Dec uses its start year. q4 leftover minor units go to the earliest pays of the year. q5 the first year counts by the rhythm (26 or 27, 52 or 53). q6 `per: week` is days x amount / 7 rounded down per period; weekly amounts are a rate and need not add to a year. q7 no fixed pay uses 365 or 366 days, each day rounded down with the remainder on the month's last day; `per: pay` means each money-in event. q8 confirmed: `paysAYear` in the model is the plain form; the engine uses the units rules. q9 a saved amount that is not whole is kept as it is and flagged on load.
Shape additions from L: `notDouble`, `by`, `at` on `steps` and `rules` entries, `ui.at`, the ISO table. K2 (interest before a percent minimum) still needs its ask.

## M. Answers after K and L (the ten left)
M1 (match-q14) the card's 7 day window is working days. M2 (match-q15) a screenshot read later, inside a statement's dates and matching no statement line, is removed too; `goneBy` is the statement import. M3 (mg-q9) a `steps` or `rules` entry is removed by its own `gone` with its own `at`. M4 (mg-q10) the clock cap applies both to a device's own writes and to a copy that arrives far ahead. M5 (mg-q11) entries and `ui` keys carry their own `by` beside their `at`. M6 (pe-q11) "fresh" counts the check-ins of the last 3 days together. M7 (pe-q12) a new period started without the pay starts on the day the person chose; the late pay stays expected until its window ends, then is "not seen yet". M8 (units-q10) a period that starts 31 Dec uses that year's per-pay amount. M9 (units-q11) with no fixed pay, `per: week` gives a seventh of the week's amount each day, rounded down, the remainder on the week's last day. M10 (units-q12) with no fixed pay, a month's share is rounded down per day with the remainder on the month's last day; nothing carries to the next month.
The four readings the helper asked about are confirmed: merge q8 (newest `at` seen plus 1 ms), matching q8 (every removed screenshot line records the statement), matching q12 (the later `told` gets `notDouble`), period end q4 (any split, never more than the overspend).

## N. Answers after M (the last five)
N1 (mg-q12) a record held once keeps its held `at`; the fast device takes the held value when the merged copy comes back, so a later edit on the other device is never lost to it. N2 (mg-q13) `told` is held the same way as `at`. N3 (units-q13) a period gets the amount of the pay that starts it. N4 (units-q14) a week ends on the seventh day counted from when the line started. N5 a period started without the pay is saved as an event `{ k: 'periodStart', date, by person }`.
The readings listed in SCHEMA_V3 section 14 are confirmed (M2 match-20, M3 removal wins on an equal `at`, M4 time zone and `by` kept, M6 "together", and the early-settle reading).

## O. Decisions from final_review_1.md
O1. An import that replaces a typed line keeps that line's `told`. An unmatched import line, or a self-logged spend written late, dated on a check's day or the setup day, counts as inside that figure. A printed running balance is kept as `src.bal` and, when present, decides the order instead.
O2. Records the app writes for a known moment get ids built from what they are: `set:<occurrence>` for a settlement, `auto:<schedule>@<date>` for a self-logged spend, `pe:<period last day>:<place>` for a period-end answer, `ps:<date>` for a period start. Two devices writing the same moment make one record; the merge keeps the newest `at`. The period-end refusal is checked again after a merge.
O3. The session part of an id is 10 random characters.
O4. Budget lines and the Free to spend share carry `acct` (default `home.mainBank`, a new field). Spent-so-far counts a line's spends on every account. Spends on a card are reserved from the card's paying account, once.
O5. Transfers and borrows out of a card (cash advance, a closed card's credit sent back) are card lines: what is owed moves and the payment follows. Cards carry `cashApr` (used in stage 2, stored now).
O6. The home currency is dated: `home.curs: [ { from, cur } ]`. `plan.shares` entries, `home.minBank` and `plan.limits` carry `cur`. A change of home currency starts a new entry; history stays in its own currency.
Watch items decided: accounts get `country` (holiday table per account); an account is closed, never deleted, with a final figure; a goal deleted with money in it writes a move to Waiting; a check-in gain larger than the period's Free to spend, or 20% of the account, is asked about, not placed; the pay count uses the rule in force on each due date; N3 means the pay's due-date year (units-50 becomes 11,556); N1 keeps a `held` mark on a held record; the move asks for the currency when a copy holds ₱ with preset `legacy` or no recorded currency choice; `frozen3831` is the raw stored text; a refund may carry `line` (given back only when the person picks it); an old statement imported after a period-end answer leaves the answer and shows the overspend as "found later" at the next check-in.
O-confirm (the N helper's five readings): N3 replaces M8 for a period starting 31 Dec, so units-50 is 11,556 (as O says); "by person" is the writing device's `by`, no person field; `held: { came, at }` and `ui.held` are the shape, and an edit keeps the mark; no new warning on a repeat arrival with nothing newly held; the first live `periodStart` after a period's first day ends it.

## P. Answers after O
P1. Money moved to Waiting from a deleted goal is marked "to place" and stays out of safe to spend until the person places it.
P2. A period-end answer is one record per place (`pe:<period last day>:<place>`) holding all its moves (`moves: [ { to, a } ]`).
P3. When a merge makes two answers add up to more than is left, the answer with the newer `at` gives way: its moves are undone and the next open says "An answer from your other device was used. Check it."
P4. When the pay rhythm changes mid-year, each rule gets its own months: monthly amounts cover the months each rule is in force, spread over that rule's pays.
P5. Spending found later never comes out of money kept for the next period; the person picks at the check-in where it comes from (Waiting or this period's Free to spend).
P6. An account is closed only when its final figure is zero or moved out by a transfer the closing asks for; its schedules end on the closing date.
The O helper's readings are confirmed.

## Q. Decisions from final_review_2.md
Q1. An import line that meets one side of a two-sided record (transfer, repay, borrow, convert) attaches to it: it sets that side's posted date and source (`posted2`, `src2` for the second side) and never replaces the record. A transfer out of an account matches that account's money-out line; into an account, its money-in line.
Q2. `a2` is kept whenever what arrived differs from what left, in any currency. The difference is a fee: a spend from the sending account, on the line `fees` (place Free to spend unless the person picks one). Transfer schedules may carry `fee`.
Q3. A card instalment buy is saved on its own pay-later account with `of: <card id>`; the card is due only the part posted each month. An account's plans are a list (`plans: [ ... ]`). A borrow or a spend on a loan or pay-later account raises what is owed there.
Q4. Money in another currency than its account (`in` with a schedule `cur` that differs) is not counted in the walk until stage 2, with a warning; `in` keeps the original amount in `a2`.
Q5. Removing a self-logged spend writes `skip:<occurrence>`, so the occurrence is "did not happen" and is not logged again on any device.
Q6. Across one import, the line nearest the expected day settles an item, then the nearest amount. A later import in the same check-in stretch with a nearer line moves the settle.
Q7. Built ids also for `rm:<place>` (a removed goal's move to Waiting) and `close:<account>` (the closing transfer or write-off).
Watch decided: a repay may have no paying account (paid by someone else); P2's answer record with `moves` replaces "move events" in SCHEMA_V3 6.2 and 7.4 and place balances read it; closing may write off a balance that cannot be moved, as a spend.
Stage 2 (no field now, unknown fields are kept): two holders of one card matched by sum; a travel spend's original amount `orig`.

## R. Answers after P
R1. Money "to place" may be placed in Free to spend, where it counts in safe to spend again, or kept in Waiting on purpose, where it does not.
R2. When a pay rule changes on a day other than the 1st, that month goes to the rule in force on its first day; the new rule's amounts start the next month (its pays still follow the new rule).
R3. A card or loan that still owes money, or a bank below zero, cannot be closed until it is at zero; the closing screen offers the payment that gets it there.
R4. Closing the account a card is paid from, or a goal is kept in, first asks for the new account and moves the link; it cannot close until one is picked.
R5. 38.31 has no closed accounts (one bank figure), so nothing closed is brought in at the move.
The P helper's readings are confirmed.

## S. Answers after Q and R
S1. A rough transfer side met by a statement line within 10% takes the line's amount; the other side keeps its typed amount, and the difference is a fee on the sender (Q2).
S2. A nearer line read later moves an existing settle, and the period start with it, unless the person ticked that settle at a check-in; a ticked settle stays.
S3. A closing that writes several records names them `close:<account>:1`, `:2`, in order.
S4. Card plan parts not yet posted are walked on their posting dates and appear in "Later on".
S5. A fee is its own spend record linked to its transfer (`of: <transfer id>`), with the place the person picked (Free to spend by default).
S6. Pay in another currency is left out of the "not seen yet" totals and listed apart, in its own currency, on the check-in list.
The Q and R helper's readings are confirmed.

## T. Decisions from final_review_3.md (coverage grid: 171 cells apply, 129 covered, 24 sound by working, 18 wrong)
T1. A period is named by the occurrence of the pay that starts it (for example `pay@2026-12-10`), never by a day that can move. Period-end answers are `pe:<that occurrence>:<place>`; a manual period start is `ps:<the occurrence it stands in for>` with the chosen day as a field (two phones make one record, the newer `at` wins); one-period overrides are keyed by the occurrence. Once a period's end is fixed (by a period start or by answers), the late pay settles its occurrence but starts no new period. A moved settle (Q6, S2) never moves a period that already has answers.
T2. The filler is spending: by default it comes out of Free to spend for the period or periods its stretch covers (split as A4); the person may pick another place at the check-in.
T3. Bills and self-logged spends paid by card go onto the card as future card lines and come off in the walk on the card's payment day.
T4. An overspent budget line counts as zero left in the walk; the overspend has already left the account.
T5. A line's spent-so-far counts only spends in its own currency; a spend in another currency on a home line is listed apart with a warning until stage 2.
T6. Period starts are in the reference model; the look ahead reads them.
T7. A move out of a place lowers that place; `adjust` moves its account and place as LEDGER_DESIGN says; each gets asks. Wallet mode and `hand` are stage 2 (the field stays, no screens in version one; Mako uses Track).
S5 fix: a transfer's `a` is what left, fee included; the fee record moves only the place, never the account.
Watch decided: closing the main bank asks for the new main bank and moves every link (`home.mainBank`, budget lines' and Free to spend's `acct`, the pay schedules' account); a transfer typed on two phones is offered as a possible double like a spend; investments never raise the gain question; a `plan.shares` change applies from the next period start; an event into a closed account reopens it with a notice; SCHEMA 3 is corrected (pre-opening spends do not count in spent-so-far, as the model does); `told` and `at` are compared as moments, not text.

## U. Answers after S
U1. When a rough side is met by a line showing that more arrived than left can be true for (a typed 10,000 to cash, the bank line 9,800), both sides take the line's amount unless the other side has its own line; nothing arrives that did not leave, and no fee is written.
U2. Settles made by an import show on the check-in list as "already matched", ticked, and the person can untick one (wording for Mako's copy pass).
The S helper's readings are confirmed.

## V. Answers after T and U (coverage now 165 of 165 applicable cells, COVERAGE.md)
V1. A goal whose money was moved to its own account is counted at that account; the account it left gets no warning for it.
V2. A loan or pay-later account paid from an account in another currency is handled like a card (H5): left out of the walk with a warning until stage 2.
V3. Under T1 two answers for one period share its occurrence name, so they are one record; the earliest last day stands. Confirmed.
Readings: pe-54, an unticked import settling nothing, only money in reopening a closed account, and T3 on a card with a carried balance (bills go onto the card's new spending) are confirmed. Two are corrected: closing the main bank moves the bills paid from it to the new main bank too (the person can end any of them); a plan change dated on a period's first day applies to that period.

## W. Answers after V
W1. Closing the main bank moves every schedule tied to it (pay, bills, transfers out and in, self-logged spends) to the new main bank, unless the person ends it.
W2. Card, loan or pay-later payments in another currency are listed apart in their own currency and left out of the totals of "due before next pay", "not seen yet" and the check-in list, as pay in another currency is (S6).
W3. In version one a goal's own account must be in the home currency; another currency for it is stage 2.
The reading that an account backing a goal is not spendable by default (SCHEMA_V3) is confirmed and goes into the reference model.

## X. Decisions from confirm_review_1.md (two missing rows, three missing columns, four false covers)
X1. Moved records get built ids `mv:<kind>:<38.31 id or key>`, so the move run on a phone and a desktop makes one copy of each record after the merge.
X2. A fee record's id is `fee:<transfer id>`.
X3. The opening saves `notYet: [occurrence ids]`: pay and bills due from the last pay to the setup day, including the setup day itself, that had not gone out or come in at setup (F20). Setup asks about each, with a pay due that day asked first.
X4. A check saves the gain question's state (`gain: 'asked' | 'right' | 'wrong'`); a large gain is held, not placed, until answered.
X5. Every share-out from a limited amount (placing money to place, covering an overspend found later, period-end answers) is checked again after a merge; when two share more than there is, the newer `at` gives way (P3 made general).
X6. A card with a known close day and no typed last statement: the first close after the opening holds the opening balance plus what came after; statements follow from there.
X7. Nothing is generated only up to a fixed horizon: close days, occurrences and statements are made as far as any question asks. A test runs ten years out.
X8. A schedule change can never start on or before its latest settled or named occurrence (settle, `once`, `amounts`, `pe:`, `ps:`); the edit offers the first date after it.
X9. "Start of day" and "end of day" are in the offset of the device that wrote the record; references follow.
Watch decided: every 38.31 field and every field of 38.28 and the 25.0 builds gets a move test (field lists taken from those builds' code); SCHEMA_V3 11.1's stale rows are fixed (`ui.sweep` becomes `pe:<occurrence>`, `once[ym]` goes to the first period starting in that month); the move asks where each goal's money is (in the bank or in another account); `amounts`, `redirect` and `pays` get asks; V2's loan item is skipped in the walk.

## Y. The move's 28 open questions (rules/move.json mv-q1 to mv-q28), decided
Y2 (the biggest). Pay amounts move: `steps.a` becomes the main pay stream's `steps` (each old month step from that month's first day), `b` a second stream that does not start periods, `side` a third that does not start periods; `once` for them becomes `amounts` on that month's occurrence. Without this a moved copy has no income.
Y1. A moved day with no time (`bankAt`, `bankNowAt`, `cards[].at`) is told at the end of that day (device offset, X9), or at the copy's last save when that is earlier; receipts at the start of their day. Y3. "From that month's first pay" is stored as the first day of that month; steps before the opening stay only in `frozen3831`. Y4. A matched E6 loan line becomes the loan's fixed `minRule`, its steps the loan's payment steps, its `redirect` the loan's redirect at its end; empty lines are dropped; a loan line with no matching debt becomes a loan account whose balance is asked. Y5. `loanLast` and `redirectLoan` go to that loan's `ends` and `redirect`; older goal figures are used only when the plan has no goal with that id. Y6. A line's `ends` month becomes its last day. Y7. Bill steps become the bill schedule's steps from each month's first day; bill `once` becomes that month's occurrence `amounts`. Y8. `ui.sweep` after the opening becomes `pe:<occurrence of the period starting in that month>`; 'bank' moves to Waiting, 'next' keeps, 'hide' writes nothing. Y9. Debts get their payment day asked at the move, close day "not sure", `inFull: false`; kind `personal` is a loan. Y10. A dated goal's monthly set-aside becomes its `plan.shares` goal amount from the move day. Y11. A pay-off goal's `pays` points to the debt with the same name, else a new loan account whose balance is asked. Y12. Two devices' moves merge like any records: the newer `at` wins per record. Y13. "The copy's last save" is the IndexedDB second copy's `t`, else the stored `rev` when it is a time, else the move's own time. Y14. A receipt note moves as `note` unchanged. Y15. Theme is a look key, tour and coach keys are tour keys; all stay on the device. Y16. With the sample still shown, receipts, cards and a typed bank figure move as real (the person typed them); sample plan values never move. Y17. Every goal with money gets the goal-money question; "another account" creates an account the person names, mode ownAccount. Y18. The typed bank figure is the main bank; imported accounts keep their names; `wallet` becomes `ewallet` unless it is named as cash. Y19. A copy with no bank figure asks for one at the first check-in; safe to spend shows nothing until then. Y20. A receipt on a bill key is a spend on place bills with that line; on `bill:loan` a repay on the matched loan; on `other` a spend on Free to spend with line `other`. Y21. H9's move month is the calendar month the move runs in. Y22. `bankStart` and `bankNow` on the same day: `bankNow` wins. Y23. Amounts with too many decimals are rounded half up and flagged (L units q2). Y24. `items[].note` becomes the one-off schedule's name. Y25. Lines that are 0 every month are not moved and are listed in the move summary. Y26. The bank account is named "Bank" unless the person typed a name. Y27. Device storage (cloud code key, theme) stays where it is and is read as it is. Y28. Records with no 38.31 id get `mv:<kind>:<field path>`.
Also: the merge accepts `mv:` ids; the move cases' expected outputs are re-worked by hand by the next reviewer, not taken from the reference that produced them.

## Z. Answers after W and X
Z1. A gain answered "wrong" removes that check (`gone`) and asks for the figure again.
Z2. A not-yet item whose posting window ended before setup still counts as expected (the person said it had not gone through) until it is seen or the person says it will not come.
Z3. Until the goal-money question at the move is answered, the goal's money is treated as kept in the bank (the safe side). "In the bank" when the bank holds less than the goal is shown as short, never refused.
Z4. A transfer schedule between the old and the new main bank ends at the closing.
Z5. `once[ym]` with no period starting in that month goes to the period holding that month's first day.
Z6. A pay-off goal's "saved so far" is never opened as savings (it was paid); it is kept as a note on the loan of how much was paid before the move.
The W and X helper's readings are confirmed; the `mv:` kind names follow MOVE_FIELDS.md (the move helper's), and the reviewer's scripts c3 and c6 are updated to the new field names.

## AA. Answers to the move's next 14 (mv-q29 to mv-q41 and Z2)
AA1. A receipt's `s` that names no account is added to its note as "paid from: <s>".
AA2. Y24 is corrected: an item's label becomes the one-off schedule's name, its note the schedule's note.
AA3. An older month-end answer `{ amt, id }` becomes that period's `pe:` record with a move of `amt` to goal `id`.
AA4. 38.31 pay was monthly. The move asks the rhythm; a month's one-month amount goes to the first pay occurrence in that month; a month-end answer goes to the period holding that month's last day; a monthly total is spread per pay by the units rule (monthly x 12 / pays in that year).
AA5. Amounts and answers waiting for a pay or bill day are kept in `pendingMove` on the copy and applied when the day is answered.
AA6. One-month amounts for the four shares and goals become `once` on that period's `plan.shares` entry (keyed by occurrence, like budget lines); the Emergency fund draw becomes a move out of the fund's place in that period; a debt's becomes that month's payment occurrence `amounts`.
AA7. A receipt on "Loan or debt payment" when the loan line was dropped or empty is a spend on place bills with line `loan` and a note.
AA8. A loan line's own end month and redirect win over `cfg.loanLast`.
AA9. A goal the person removed is never brought back by Y5.
AA10. "The copy's last save" is the later of the second copy's `t` and the stored copy's `rev` time.
AA11. A goal with no date and no monthly amount moves with the monthly figure 38.31 worked out, as its share.
AA12. Loans the move creates ask for the yearly rate and the minimum; "don't know" gives rate 0 and the old monthly payment as a fixed minimum.
AA13. "Another account" for a goal asks "bank or e-wallet" and makes that type.
AA14. A not-yet item (Z2) can be settled by a matching amount at any later date; the posting window does not apply to it until it is settled.
The move helper's readings are confirmed.

## AB. Mako's minimum answer, and decisions from confirm_review_2.md
M1 answered by Mako (23 Nov): setup asks once, "Keep at least ___ in your bank?", box empty; skipping means no minimum (DECISIONS.md, new foundation 5). The move keeps a 38.31 minimum only when the person typed it (`ui.minAuto` false); an automatic one is dropped.
AB1. A device that finds a moved copy in the cloud takes it and adds only the ids it lacks; it never overwrites. Moved records carry the copy's last save as `at` (AA10), so any later real edit wins. `frozen3831` is kept per device as the record `mv:frozen:<by>`.
AB2. Income schedules carry `per: 'month' | 'pay'`; moved pay is per month. A one-month amount replaces that month's total, spread over that month's pays or periods. A month-end answer for a period not yet ended at the move waits in `pendingMove` and the period's own question still comes.
AB3. For a card, pay-later or loan set up between its close and its payment day, setup asks "Is the last statement paid?" and saves the answer as a J5 statement; "don't know" counts everything owed as due on the next payment day.
AB4. A line that settles a `notYet` occurrence comes after the opening, whatever its date.
Rows: `pendingMove` entries carry `id`, `at` and `by` and merge like records; the Emergency fund draw's built id is `mv:draw:once.<ym>`. COVERAGE's stale `mv:` labels are fixed.
Watch decided: restoring an older backup while the cloud copy is on writes `gone` with a new `at` for every record newer than the backup and gives the backup's records a new `at`, so the merge keeps the restore; a moved month-end answer larger than its place holds is capped (L q10) and the rest waits "to decide".

## AC. Answers to mv-q42 to mv-q49
AC1. The field is `per: 'month' | 'pay'` on income schedules (AB2); moved pay is `per: 'month'`. AC2. A loan payment receipt waits in `pendingMove` until "which loan is this" is answered. AC3. A loan the move made holds rate 0 and the old monthly payment as a fixed minimum, marked as asked, until answered. AC4. The Emergency fund draw goes to Waiting, where that period's plan places it. AC5. A debt's one-month amount is that month's whole payment. AC6. The move appends "(moved: loan line removed)" to the receipt's own note. AC7. `once[ym].bill:loan` becomes that month's payment `amounts` on the matched loan, else on the bill schedule. AC8. A month-end answer naming a goal the plan no longer has moves to Waiting as "to place".
The AA helper's readings are confirmed.

## AD. Answers after AB and AC
AD1 (mv-q50). A minimum saved by a build before 20 Nov with no `ui.minAuto` is treated as automatic and dropped (Mako: no minimum without the person choosing it); setup asks anyway.
AD2 (mv-q51). A dropped loan line's one-month amount is dropped and listed in the move summary.
AD3 (mv-q52). A waiting month-end answer is offered as the default at that period's own question, capped (L q10); the person confirms or changes it.
AD4 (mv-q53). A moved bill answered with another rhythm is per month like pay, spread over its payments.
AD5 (mv-q54). A waiting entry is applied only when the record it would change has an older `at` than the entry; otherwise it is skipped. A device that applies an answer at its own move also writes the matching waiting entry as `gone`, so other devices skip it.
AD6 (ed-q1). "No, not paid" asks the amount, with everything owed filled in.
AD7 (ed-q2). "Don't know" on a loan or pay-later means that month's usual payment is due on the next payment day.
AD8 (mg-q12). A restore gives the shared `ui` keys a new `at` too.
The helper's readings (leftover yen to the earliest pays, `terms: 'asked'`, AC6's wording after a space) are confirmed.

## AE. Decisions from confirm_review_3.md (two findings)
AE1. Keyed overrides carry their own `at`, `by` and `gone` per key and merge key by key like `steps`: `amounts` on schedules and loans, `once` on budget lines and `plan.shares` entries, `extraSteps` on loans. A new grid row, "keyed overrides".
AE2. AD5's first sentence is withdrawn. A waiting entry is applied once, by the device that applies it, which writes the entry `gone`; the keys it writes carry the entry's `at` and are judged key by key (AE1).
AE3. Bill schedules may carry `per` too (AD4); a moved bill's one-month amount is spread over its payments like pay.
AE4. The move summary notes when a moved one-month amount is spread over a three-pay month.
AE5. A restore stamps with the D4 clock (`nextAt`), never the raw time, and covers built ids, `pendingMove`, `frozen`, held marks and keyed overrides. Restoring a 38.31-format backup after the move runs the move on it and stamps every record with the restore. A restore column is added to the grid.
AE6. AB3's question is asked as "Has your last card statement already left your bank?", with a line that automatic debits count as "not yet" until the day they come out. The meaning, not the field, is what changes; it is checked with real people before setup ships (MAKO_RUN).

## AF. Answers after AD
AF1 (mv-q55). A minimum whose origin cannot be told is neither kept nor dropped silently: the move asks, showing the old figure ("Keep at least X in your bank?").
AF2 (ed-q3). A loan or pay-later answered "no, not paid" asks the amount, filled with that month's usual payment.
AF3 (mg-q13). Shared `ui` keys carry `gone` per key like keyed overrides (AE1); a restore writes `gone` for keys not in the backup.
The AD helper's readings (AD1: a `rev` that is a count, or a last save before 20 Nov 2026; the dropped minimum is asked; AD2's summary is the move's `zero` list) are confirmed.

## AG. Answers after AE and AF
AG1 (mv-q56). Every write made now, including a waiting entry applied after a restore and an answer given again, uses the D4 clock (`nextAt`): strictly newer than anything the device has seen, the restore's `gone` marks included. A new write never ties with a restore.
AG2 (mv-q57). AE4's note applies to any month with more pays than usual (three for every two weeks, five for weekly).
The AE and AF helper's readings are confirmed.

## AH. Decisions from confirm_review_4.md
AH1. A device's own write uses its own clock: `at` = the later of now and the newest `at` it has seen plus 1 ms. A long gap since the last write is normal and never held. The device's own clock is questioned only by D8 (a date that jumps back, or more than 40 days ahead). An arriving copy is held only when its `at` is more than a day ahead of the receiving device's own now (M4, N1). `told` follows the device's own clock the same way. L merge q8's reading is withdrawn, and mg-33, mg-96 to mg-99 and mg-109 go back to natural inputs. A grid column: the device used again after 2, 21 and 45 days away.
AH2. Every occurrence-name reader accepts built and moved schedule ids (`mv:pay:steps.a@...`, `pe:mv:...`); X8 protects moved schedules. Cases on `mv:` schedule ids.
AH3. Every reader reads keyed overrides in the AE1 shape (`{ amount, at, by, gone }`) and skips `gone` keys, in the look ahead and in X8. Asks with a removed key on a check day, across a period start and with undo.
AH4. AG1 is withdrawn as worded. AE2 stands: an applied waiting entry's keys carry the entry's `at`. For mv-q56 only: a restore stamps the waiting entries it brings back 1 ms after the `gone` marks it writes, so applying them again beats the restore's removal. mg-117 must keep passing; an mv-q56 case is added.
AH5. Version one's merge finds keyed maps by shape (a map whose values all carry `at`), not by a list of field names, so maps added in later builds merge key by key on older devices too.
AH4-confirm: the AG helper's narrow reading (only an entry a restore brought back takes the D4 clock; every other entry keeps its own `at`, AE2) is the rule. mg-117 and mv-117 to mv-121 stand.

## AI. Answers after AH
AI1 (mg-q14). An arriving copy more than a day ahead of the receiving device's own now is held at that now plus 1 ms, never at the newest `at` seen; its `told` is held the same way. A device that has seen nothing holds against its own now.
AI2 (mg-q15). Entry lists inside a record are found by shape too (an array whose items all carry `from` and `at`), so lists added in later builds merge entry by entry on older devices.
Confirmed: under AH1 a clock less than a day fast is not held and can beat a later edit made without seeing it (mg-24 ends at 1,500); D8 still questions large jumps.

## AJ. Decisions from confirm_review_5.md
AJ1. Every reader of a built id accepts ordinary ids (`k7qzpa-m2xq7ab9zt-41`) for the schedule, place or account it names. A permanent check rewrites every short made-up id in scenarios/ and rules/ into the ordinary form and runs both suites on the result; both runners run it every time.
AJ2. AI2 is widened: an array whose items all carry `id` and `at` merges by id (pay-later `plans`), as well as arrays whose items carry `from` and `at`. The shape is judged on either copy, so a list empty on one side still merges entry by entry.
AJ3. `home` gets a grid row (curs, minBank, mainBank, country) across two devices, undo, restore and days away; `home.curs` merges by `from`.
AJ4. A case fixes AI1's result when the receiver has already seen a slightly fast copy.
AJ5. When X8 refuses a pay-day change because of a future one-off amount (a bonus), the edit offers to move or remove that amount instead of only refusing.
AJ-confirm (AI helper's readings): the held value is the receiver's now plus 1 ms (AJ4 fixes the case); two devices holding one far-ahead copy settle on the newer held `at` and the earliest `told` (needs a case); an empty array is an entry list when the other copy's items have the shape (AJ2), not only for steps, rules and extraSteps.

## AK. Answers after AJ
AK1. `home`'s fields merge one by one, each with its own `at` and `by`, like the shared `ui` keys.
AK2. AJ5's "move" takes a one-off amount to the new rule's first occurrence in the same month.
AK3. A budget line's or share's `once` key named by the pay gets the same move-or-remove offer.
The AJ helper's AJ5 reading (a live, unsettled key on or after the change's day; the offer only when nothing unmovable is in the way) is confirmed.

## AL. Decisions from confirm_review_6.md
AL1. One shape for every "record of separately edited fields": the value of each field is `{ v, at, by, gone }`, exactly like a keyed override (AE1). Shared `ui`, `home`, `plan.limits` and `imports.cats` all use it; the separate `ui.at`, `ui.by` and `ui.held` maps are replaced. One handler (the keyed-map handler) serves merge, holding, restore and "what the device has seen"; nothing checks for the name `ui`. AK1 is coded in this shape.
AL2. "What the device has seen" reads every `at` in the copy, at any depth, including field values.
AL3. `home.mainBank` and `home.minBank` merge as one field (`main: { v: { acct, min }, at, by }`), so a minimum never lands on another bank.
AL4. `imports.cats` values are `{ v: <category>, at, by, gone }` (AL1).
AL5. `plan.limits.ceiling` carries `per` (default month), like every amount over time.
AL6. AK2's gap: with no occurrence of the new rule in that month on or after the change, the amount goes to the new rule's next occurrence; when the target already has its own amount, the offer shows both and the person picks add or replace.
AL7. SCHEMA wording: ordinary ids are lowercase letters and digits; `people` records carry `told` and `by` like every list record.
Watch decided: tests add a device whose offset changes (travel, daylight saving) and a half-hour offset; dates stay in the writer's own calendar.
AL-note: AK's two open questions are answered by AL6 (no occurrence that month on or after the change: the next occurrence, so 10 Jan; two amounts landing on one day: the offer shows both and the person picks add or replace). AK1's parallel at/by maps are replaced by AL1's field values.

## AM. Answers after AL
AM1. When two moved amounts land on one occurrence and the person has not picked add or replace, the walk counts the safe side (the smaller for pay, the larger for a bill) until they pick.
AM2. When the main bank and its minimum are changed on two devices before a sync (AL3), the newer pair wins, and the other device's change is shown at the next open: "Your other device changed this. Check it."
AM3. A check holds events dated more than a day before its day; events dated on its day or the day before are judged by `told` (H1). This covers a spend dated the day before a check made in another time zone.
The AL helper's readings are confirmed.

## AN. Decisions from confirm_review_7.md (AN3 and AN5 replace AM3 and AM1)
AN1. Every map without an `at` of its own merges key by key, at any depth (the top level, `plan`, `imports`, `home`); plain values inside it settle the same way on both devices (the keyed rule), so merge(A, B) equals merge(B, A). Symmetric cases with a plain field, a `home` holding only `curs`, and an empty `cats`.
AN2. After a merge, a schedule change that now starts on or before a settled or named occurrence is moved to start the day after it (the edit's own offer), written with a new `at`, and shown to the person at the next open. The same for a moved key left orphaned by an edit on the other device.
AN3. The main bank's own `minBank` is always null; its minimum lives only in `home.main`. SCHEMA_V3 line 99 is fixed.
AN4. AM3 is replaced: an event is inside a check when the end of its date, in its writer's offset (taken from its `told`), is at or before the check's moment; otherwise it is judged by `told` (H1). ot-01 to ot-03 are corrected to 375,000, 20,000 and 35,000.
AN5. AM1 is replaced: a moved amount that lands on an occurrence that already has its own amount is not written until the person picks add or replace; it waits in `pendingMove`. No unpicked state is ever saved in `amounts`.
AN6. Grid: E x D (AN2), Z x D (an event written on one device into an account closed on the other reopens it at the merge, with a notice), and a `people` row (D, U, R, M). COVERAGE's stale count is fixed.
AN7. `imports.cats` keys are the shop text trimmed, with spaces collapsed and lowercased (38.31's keys are lowercased at the move), stored with a `k:` prefix so no key can be `__proto__`. Each value carries `src: 'person' | 'reader'`; a reader's guess never replaces a person's lesson, whatever the `at`. The map is never trimmed.
AN-note (on the AM helper's work): AM2 stays and is widened: any field value whose own device's change lost at a merge (country, mode, a curs entry, shared ui keys, plan.limits, main) gets the local notice. The AM1 two-amount key and the AM3 day-before rule that were coded are replaced by AN5 and AN4: the pick key shape is removed (nothing unpicked is saved), and ac-01 to ac-03, cdb-01 and ot-01 to ot-03 are re-worked by hand under AN4. The AM helper's questions 1, 2 and 4 are answered by AN5 and AN4.

## AO. Answers after AN
AO1. When AN2 moves a change after a merge, a key that moved with the original change is moved back too (the original key live again, the moved copy `gone`), so one bonus is counted, not two.
AO2. Confirmed: of two amounts moving onto an empty occurrence, the one from that occurrence's own month is its own; the other waits.
AO3. A waiting bill amount counts on the safe side (the larger) in the walk until the person picks; a waiting pay amount adds nothing until picked.
AO4. `once` keys follow AN5 the same way as `amounts`.
AO5. When an account becomes the main bank, its own `minBank` moves into `home.main` and is cleared; the old main bank gets no minimum unless the person sets one, and a notice says so.
AO6. An event dated on the closing day does not reopen an account; a check with a figure other than zero typed into a closed account reopens it with a notice.
AO7. Two 38.31 shop keys that become one keep the later and are listed in the move summary.
The AN helper's readings are confirmed.

## AP. Decisions from confirm_review_8.md
AP1. A closing's final check holds everything dated on or before the closing day, whatever its `told`. One reopen rule, shared by the look ahead and the merge: any event or check dated after the closing day reopens the account, with a notice.
AP2. AN2 lists occurrences with the look ahead's own occurrence code, for every rule kind (month, weeks, months, monthsList, year, lastWorkday, once).
AP3. An import line's id is built from what it is: `imp:<account>:<line id>`, the line id being the statement's own reference when it has one, else date, amount, direction and a count. The same statement read on two devices makes one record at the merge.
AP4. AO1 is refined: only settled occurrences and `pe:` / `ps:` records pin a change; `amounts` and `once` keys follow AJ5 (moved to the new rule's occurrence, or waiting in `pendingMove`), and any `pendingMove` entry the moved-back change created is marked `gone`.
AP5. After a merge, a main bank that still has its own `minBank` has the newer value folded into `home.main`, its own field cleared, and a notice shown.
AP6. A `checkins` row is added to the grid (D, U, R, A). SCHEMA 7.1 stores no filler ids (the filler is worked out, 7.3); a check-in stores its stretch and its settled ids.
AP7. The shop key function is named in SCHEMA: 38.31's `stmtNorm` (digits and punctuation removed, the first three words, lowercased), used by the reader and the move alike. Moved values are `src: 'moved'`: a person's lesson beats them and they beat a reader's guess.

## AQ. Version one sync, simplified (Mako, 23 Nov; efficiency_review_2.md)
AQ1. The cloud copy carries a revision; a write is accepted only when based on the latest revision (compare and swap on the vault server). A device that is behind takes the latest first.
AQ2. Events are append-only with built ids and join on their own (AP3's `imp:` ids, O2's built ids, `mv:` ids stay).
AQ3. When both devices changed the same plan or settings record (schedules, rules, keyed overrides, budgets, shares, goals, accounts, home, shared ui, limits, cats), the person picks; the version not picked is kept as a `kept:<record id>` record so Undo can bring it back.
AQ4. After every sync the one-device checks run (X8, closed accounts, minimums, shares over what is left); any failure becomes a question to the person, never a silent rule.
AQ5. Kept for stage 2, not deleted: the per-key `at`, `by`, `gone`, holds and the rich merge rules (D4 to AP5 where they are about merging). Their mg cases are labelled stage 2 and keep passing against merge_ref.js as the stage 2 spec; qc-regression signs the list. No test is deleted or weakened.
AQ6. A two-device fuzz script replaces hand review rounds for sync: random offline sequences on two devices with realistic ids, then a sync; it asserts merge(A,B) = merge(B,A), merging twice changes nothing, every edit is present or waiting as a question, nothing is doubled, and every one-device check passes after the sync.
AQ7. The grid columns are frozen after one confirming review of AQ plus the fuzz. The engine lanes start now in parallel, in new files.
Still applied from AP: AP1 (closing check and one reopen rule), AP2 (occurrence code for every rule kind, used by the AQ4 check), AP3, AP6, AP7. AP4 and AP5 become AQ4 questions.

## AR. Answers after AO
AR1 (ed-q-ao4). A waiting `once` amount counts on the safe side like a bill (the larger for spending lines) until the person picks.
AR2 (mg-q-ao1). Stage 2 (AQ5): it is about the rich merge.
AR3 (mg-q-ao6). The check-in does not offer closed accounts; a check dated after the closing day that reaches a closed account any other way reopens it in the look ahead too (AP1's one reopen rule).
The AO helper's readings are confirmed.

## AS. Engine lane A's readings (lane/engine-a), decided
AS1. The opening split is saved as `split: { places, lines, free }` on the `open` event. AS2. "Is the last statement paid?" is `paid: true | false | 'dont_know'` on the statement check. AS3. The opening check is the check with the `open` event's account, date and `grp`. AS4. An imported two-sided line names its statement's account in `src.acct`. AS5. An unticked settle (U2) is saved as `unticked: [ids]` on the check-in. AS6. The filler's place is saved on the check-in as `fillerPlace: { <account id>: <place> }` (the filler itself is worked out, 7.3). AS7. Money in on a card lowers what is owed; only `sub: 'refund'` gives money back to a budget line, and a refund never starts a period. AS8. A waiting share entry names its share in `share`. AS9. Budget lines carry `from` (the day the line started, default the day it was made); N4 counts weeks from it. AS10. `count` on a schedule counts from its first occurrence. AS11. `home.main.min` must be in the main bank's currency; a mismatch is asked about. AS12. Holiday and bank-closed tables come from official sources before shipping (Japan Cabinet Office list; Philippines proclamations each year, marked `partial` until loaded); a country without a table falls back to weekends only and says so on screen. AS13. The in-page speed test (30,000 events at 4x CPU) runs in the main session when the engine is wired.
Where the engine follows the decisions more closely than the reference (AP1 and AR3 reopening, `once` keys and waiting `once` amounts, `rm:` money as "to place", the units rules for amounts per period, P4 and R2 rule changes), the reference is brought up to the decisions and new asks are written for each, so engine and reference are checked on them.

## AT. Answers after the version one sync (sync_v1.json open questions)
AT1 (sy-q1). An event changed two different ways on two devices (a ticked pay with two amounts, a check-in) is asked like a record: both shown, the newer first, both kept.
AT2 (sy-q2). X8's offer for a rule that is not monthly or weekly starts the day after the old rule's next occurrence after the last settled one (insurance paid 31 May yearly, changed to 15 Jun: offered from 1 Jun 2027, so the first new payment is 15 Jun 2027 and nothing is paid twice in one cycle).
AT3. When one account's main-bank switch and its minimum change meet at a sync, it is one question showing both changes.
The look ahead's reopen rule follows AP1 (being brought in line by the reference catch-up helper). mg-282 and mv-125 to mv-127 move to AP7's shop keys and `src: 'moved'`; move_two, move_later and pe-36 to pe-43, pe-55 to pe-59 are reviewed by qc-regression for the stage 2 label.

## AU. The independent checker's eight classes (lane/checker-b, checker_differences_1.md), decided
AU1 (class 1, reference wrong). Weekly and two-weekly pay: the period running now is converted like every other (units rules, I4 for the days left); the large-gain test uses the current period's converted Free to spend.
AU2 (class 2). LEDGER_DESIGN L1 stands: a place may go below zero (shown amber), and money placed later adds to it from where it is. In the walk a place below zero counts as nothing set aside (it holds nothing). Both the reference and the checker follow this.
AU3 (class 3, reference wrong). A part-paid remainder carried on again is counted once (I3).
AU4 (class 4). When an income occurrence that starts a period is counted (due today, B3 income first), that period's budget lines and Free to spend share come off with it (SCHEMA 10.3 step 2).
AU5 (class 5). The same for a late pay still counted (H8).
AU6 (class 6). A credit statement carries to the next statement (H3); I3 is about amounts owed, not credits. The closed statement takes the credit off, as the open amount already does.
AU7 (class 7). A pay inside the opening is already in; its period starts by the setup day at the latest.
AU8 (class 8). The plain units form (52 / n) is retired; the reference uses the units rules (L, M, P4, R2) everywhere.
Other points: a spend with no budget line in a life with a plan counts against Free to spend; a card payment item uses the paying bank's posting window (1 working day); while the next pay is late it is still "the next pay" for G1; an older statement that is late and unpaid is due now, beside the next one; a card's open amount shows a part-paid remainder that will carry, marked as carrying.
The checker becomes a permanent gate: `node wip/team/checker/fuzz_vs_ref.js --seeds 2000` must show 0 differences, and the engine is run against the checker the same way.

## AV. Answers after the reference catch-up (AS asks)
AV1. A zero check after the closing day does not reopen (AO6); AP1's "check" means a check with a figure other than zero. cro-09 is flipped.
AV2. While AS11's currency question is open, no minimum is used and the warning shows.
AV3. A waiting `once` amount counts on the safe side for what it is: the larger for spending lines and bills, the smaller for Free to spend and any cap.
AV4. A refund (`sub: 'refund'`) never settles a pay, whatever its size.
AV5. A budget line with no `from` counts from its account's setup day.

## AW. Decisions from sync_review_1.md
AW1. After a sync, matching (6.4) runs again between import lines and typed or `set:` records that came from the other device, with the usual `gone` / `goneBy` writes. New fuzz invariant: no occurrence is settled by two live records, and each real purchase is one live record.
AW2. A device with its own data and no `sync.base` meeting a cloud copy asks which whole copy to keep; the other copy goes to the kept versions.
AW3. AT2 is corrected: a change to a rule that is not monthly or weekly starts the day after the old rule's next occurrence after the last settled one (insurance paid 31 May 2027 yearly: offered from 1 Jun 2028, so nothing is paid twice in a year). AT2's worked example was wrong; sy-23 to sy-25 follow this.
AW4. AT3 is coded: a main-bank switch and a minimum change meeting at a sync are one question.
AW5. A refused write retries from the copy it took as its base, saved with the joined copy before pushing (sy-62).
AW6. Questions the person cannot answer are not asked: a closing transfer is worked out again from the joined events; check-ins that differ only in their settled lists are joined; a record changed on two devices in different fields offers "keep both" (from the per-entry `at` and `by`) besides picking one; the shares question lets the person undo either placing.
AW7. The shared list of kept versions is named `keptVersions` and is in SCHEMA 2.1; the IndexedDB store keeps the name `kept`. While a money question waits, the walk counts the safe side across the kept versions (as AR1).
Watch: a restore that gives every record a new `at` asks about every item the other device changed since the last sync; acceptable in version one, noted for stage 2.


## AX. The way of working from here (23 Nov evening JST, after Mako asked why it is so slow; LESSONS lesson 4)
AX1. Thin slices. Slice 1 is Mako's own shape end to end behind the switch: setup asks what the bank shows today; Home shows bank today, safe to spend until the next pay and the period dates; Check your bank works; his saved 38.31 data moves across. It is tried on made-up numbers in his shape. Then come Plan and Receipts, then statements and the cloud copy, then the other lives.
AX2. The engine (wip/team/engine) is the only implementation. ref/lookahead_ref.js is frozen as the spec. The checker compares against the engine.
AX3. No new rule rounds until slice 1 runs. Stage 2 cases stay labelled and skipped. New findings go on a list unless slice 1 needs them.
AX4. Helpers own whole areas on their own branches and commit there. The main session merges and runs the gates, and no longer writes every decision in turn.

## AY. qc-foundation on WIRING_PLAN (23 Nov evening JST): FAIL, four small slice 1 fixes, all accepted
AY1 to AY4 are F1 to F4 in WIRING_PLAN.md "Corrections". There is no second review round (AX3). The checks named there are the gate.

## AZ. How we build from here (23 Nov night JST, from the deep research on building with agents)
AZ1. The new screens are their own small page, wip/team/app3/, built on the new engine. It reuses the style tokens, art and pixel files, and the old app stays frozen beside it as Mako's fallback. app3 reads old saved data only through engine/move.js and never writes it. This replaces WIRING_PLAN's switch, guard lines, retire list and changeover commit. engine_equiv stays as an engine-only test.
AZ2. Each lane merges itself, one at a time: rebase on wip-38.31, run app3/check3.sh and ./check.sh at the quick level, then push. A rejected push means rebase and check again. The main session sets the order of work, decides, and decides what reaches Mako. main and deploys stay with Mako.
AZ3. Reviews: one qc-foundation pass on a plan and one at the end of a slice, correctness only. Findings outside the slice go on a list.
AZ4. No new copies of the rules and no new scenario rounds. Add invariant checks instead (for example: bank today equals the last check plus what has settled since; safe to spend is never more than bank today minus what is due before pay), plus a daily walk of Mako's shape through the real page.
AZ5. Each slice keeps a FEATURES.json, and an agent flips "passes" only when its test is green.
AZ6. Mako gets something he can open as soon as slice 1 runs, then at each step after.
Sources: anthropic.com/engineering/effective-harnesses-for-long-running-agents, anthropic.com/engineering/building-c-compiler, code.claude.com/docs/en/best-practices, claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them, metr.org (2025 study, 2026 update), DORA 2025. Knight and Leveson 1986: separately written versions share failures.

## BA. The move port (23 Nov night JST)
BA1. A check may carry `stale: true`. It is set only by the move on a bank figure that had no typed day (38.28 has no bankAt). It is dated the copy's last save, and screens never show it as today: the bank today question is asked. SCHEMA_V3 takes the field. move.json keeps its frozen expectations, and the move test's adapter strips the field there.
BA2. move() returns `needs` (bankToday, cards, cardDays, billDay, cardLine), worked out from the records and never saved. app3 asks these questions after the move.
BA3. The engine gets its own merge in slice 4 (cloud copy). Until then move.js takes the merge as an argument.
BA4. While cro-09 is the only red mark (until AV1 is flipped), lanes may self-merge if they add no new failure.

## BB. Merge gates and the screens pieces (23 Nov night JST)
BB1. A lane that adds files only under engine/, store/, screens/ or app3/ is gated on its own tests and on the engine, scenario and rule runs. Those files cannot reach the old build. The old app's ./check.sh runs once on a quiet machine before anything reaches Mako, because tests/guard.js fails under load from parallel lanes (known since round 11).
BB2. "Bank after the cards are paid" must name a per-bank figure. Slice 1 is safe because Mako has one bank and no savings account in the app. Slice 6 (the other lives) adds the per-bank figure to the engine.
BB3. The names marked for Mako (screens/names.js) go into MAKO_RUN for his copy pass. They do not block slice 1, which uses the label already in use.

## BC. Answers to the checker helper (23 Nov night JST)
BC1. AU2 against H7: yes. A bill paid from a place takes only what the place holds. Only a spend that names the place takes it below zero.
BC2. A card payment item in "not seen yet", with its posting window: this belongs to slice 3 (statements). It goes on the list.
BC3. lastWorkday counts as monthly under AW3. The X8 edit offer follows AW3 too. Both are slice 2 (Plan edits), so they go on the list.
BC4. AW1: when an imported line is matched to a typed record and the import has no line of its own, it keeps the typed record's line, so a coffee typed on Food stays on Food. This is slice 3, and it is added to the import rules then.
BC5. AX2 means the reference is not kept up to date for new work. Finishing decisions already made (AU, AV, AW) in it was right, and from here it stays frozen.

## BD. Storage lane answers (23 Nov night JST)
BD1. keptVersions (AW7, SCHEMA 2.1 as updated in 4054a07) are saved one record each in the `kept` store under `kept:` ids. Whole copies kept before a big replace are saved there too, under `copy:` ids. sync_v1_ref's `copy.kept` is the frozen reference's name for the same list.
BD2. The store's meta.rev (one tab against another) and the cloud copy's compare-and-swap revision (device.sync.baseRev) are separate numbers.
BD3. No marker on the old 38.31 key, and no patch to the old app. app3 only reads the old key through move.js and never writes it (AZ1). When the old copy changes after the move, app3 offers to move again (WIRING_PLAN F3).
BD4. Every edit moves `at`. A change made without a new `at` is a fault, and the store's tests show it.
BD5. Joining another tab's settings, the service worker parts of D6, the timing of D5's pushes, and turning the code into a key are slice 4 (cloud copy and backup).
BD6. The store's timing tests passed 38 of 38 on a rerun. One flaked under load from parallel lanes, so they are not a merge gate while lanes are running.

## BE. No old data to move (Mako, 23 Nov night JST)
Mako: "there is no old data on the old app. We don't need to calculate with that. I will put my own numbers once we have the first working version."
BE1. Version one starts empty. setup3 is the only way in, and made-up numbers are offered to look at first. The move is not wired into app3. engine/move.js and its tests stay in the repo for anyone who does have old data later.
BE2. These drop out of version one: E1 (the move proved on every old build), WIRING_PLAN F2 and F3 (questions after a move, which copy wins), the comparison of the move before deploy, and the old app's backup as a way in.
BE3. Backup and restore of the new shape (store/pack) stay in slice 4.

## BF. Engine follow-ups (23 Nov night JST)
BF1. Goal per period: toGo spread over the period-starting pays still to come on or before the date. A pay due today that is not settled yet counts. A late pay that is still expected counts. Leftover minor units go on the earliest pay. With no fixed pay, perPeriod is null until slice 6.
BF2. Overdue card and loan payments are listed under `overdue`, with state late or notSeen. `next` is always today or later. Screens must show overdue items, so one never disappears.
BF3. Past periods group records by date and list only records told by the day asked (O1).

## BG. Where version one runs (Mako, 23 Nov night JST)
Mako chose a private web address over a file. Opened as a file, Chrome on Android may not keep the saved data.
BG1. Only app3 is published, under an unguessable path in public/ on the existing Cloudflare site. It goes up through a push to main that adds only those files, after the walk faults are fixed and the walk passes. The old app at the site's root is unchanged.
BG2. Before publishing, check two things. The old app's service worker (scope /) must never answer for the app3 path. app3's sw3.js must be scoped to its own path. Then /api/ai works for statements and Ask from the same address.
BG3. The cloud copy stays on one device until the server changes in app3/FOR_MAKO.md are approved.

## BH. A late pay and safe to spend (23 Nov night JST; replaces H8 for safe to spend only)
The real-page walk found this. On 11 Jan the main pay was late. H8 counted it as landing today, so safe to spend was the whole bank figure (328,000), with card A (32,000) leaving the next day. If the pay really is late, spending that leaves him short.
BH1. Money not yet seen never counts toward safe to spend. While a period-starting pay is late or not seen, safe to spend is the lowest point of the walk without that pay, up to the pay after it. Every bill and card payment due in that stretch is taken off.
BH2. The pay still shows as expected (late or not seen) on Home and on the check-in list, and the period dates follow res.period as before. Once it is ticked, it counts at once.
BH3. The safe-to-spend heading says plainly that the late pay is not counted yet. late-03's due list follows BH1 too. Scenario files are changed only where BH1 changes the answer, each change noted with BH1.

## BI. Second real-page walk (23 Nov night JST): FAIL, two blockers
BI1. An item ticked at a later check-in, after being left unticked at an earlier one, is dated after the earlier check, never on its due day before that check. The sheet offers "landed on" with the day after the earlier check as the default. This holds for pay, bills and card payments.
BI2. Imported lines matched to typed or ticked records are one record wherever money is listed or summed: Receipts, past periods, the look ahead. Every place counts through one shared function, never its own (lesson 2). A bank line moving money to the person's own account matches the move.
BI3. Setup asks whether each bill due since the last pay has gone out yet (X3, build_book takenOut).
BI4. Home shows the "may still go through" items that safe to spend takes off. A late or not seen pay is named by its shifted landing day.
BI5. A move into a goal's own account counts as set aside for that goal.
The second walk's scripts are kept in app3/walk/v2 and become a check3 step once they pass.
