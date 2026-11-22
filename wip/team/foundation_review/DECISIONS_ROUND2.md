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
