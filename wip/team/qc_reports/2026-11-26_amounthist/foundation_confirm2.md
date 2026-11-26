FAIL

qc-foundation, second confirming run on lane amounthist at c066a597. Both findings of foundation_confirm.md are gone, run on made-up yen. One new engine fault in the both-directions rule: it can hide real spending. Engine only, no saved-data change, small now. It fails the run because it needs an engine change later and touches M7, M12, M44 and the team's "never guess money silently" rule under M6/M61.

OWNER'S WORDS (lines this change touches)
- M14 Undo everywhere: met. The door is unchanged since 917d4442 (act3.js:171, 348-351).
- M23 several accounts, and M98(b) taking cash out is a move: met. A removed own move gives 60,000 safe to spend and 0 spent with the two banks in either order (lookahead.js:529, guarded per account now).
- M27 and M40 two cards paid on the 10th and 11th: met. A removed or corrected card payment cancels on the bank and the card side, in both card orders (lookahead.js:682, 693, 1160).
- M36 the picture adds up: met. The bank today stayed right in every run.
- M44 one stable dataset, past periods never rewritten: met for the ruled cases (a fix before the next check: the closed period keeps 1,000; the 950,000 typo: the closed period keeps 6,000). Broken by the finding below when a held gain is answered later.
- M45 no coin counted twice: met in every run below.
- M61 and M69 nobody loses data: met. Every removal keeps `was`; nothing is deleted.
- M67 joins across devices: met, sync.js is unchanged.
- M7, M12 and M90 safe to spend: broken by the finding below while a large gain waits for its answer.
- M1 to M4 (the assistant): met. Same door as the screens.

GRID (money records and check figures, through the one door, from the screens and the assistant, on any later day)
- Money record: add, change, remove, and Undo of each: 6 covered.
- Check figure: add, change, Undo of add, Undo of change: 4 covered. Removing a single check: not applicable. Undo of the whole check-in: covered.
- Answer to a large-gain question ("yes, that is right"): add is covered. Change it back or Undo it: not checked in this run.
- Count: 11 covered, 1 not applicable, 0 empty.

FOUNDATIONAL

1. A real large gain left unanswered hides every later unlogged drop on that account, across pay periods and with no limit. Answering it later then rewrites a closed period.
- Who: anyone who gets money the app did not know about and does not answer the "is this right?" question. Examples: a gift, a bonus, a refund that went straight to the bank, or Liza's sister's remittance landing in her e-wallet. The same holds for the three-weeks-away person who never sees the question.
- Run (bd.js): set up 1 Dec, bank 100,000, pay 250,000 on the 10th, Free to spend 30,000. 5 Dec: the bank shows 200,000 (a real 100,000 gift, not logged). The gain is held and the question is asked. 8 Dec: the bank shows 150,000 (50,000 really spent, not logged). 14 Dec: pay ticked, the bank shows 370,000 (another 30,000 spent).
- What it shows: on 8 Dec, 0 spent and 9,000 safe to spend. In truth 50,000 left the bank. On 14 Dec the new period shows 0 spent and 30,000 safe to spend. In truth 30,000 was spent. If the gift is answered "right" on 20 Dec, the closed period 10 Nov to 9 Dec goes from 0 to -50,000 and this period from 0 to 30,000, so safe to spend falls from 30,000 to 0 in one moment.
- Cause, lookahead.js:983-992. `held` builds up from every held gain on the account and is used up by any later drop, on any check, in any period, for as long as the question stays open. The engine is guessing "it was a typo" without saying so. The ruled case (a typo undone by the next check) is right. The rule just reaches further than that case.
- Why it is in the base: safe to spend is worked out here. No screen can show the spending, because the engine never counts it. It only marks `undid` on the filler.
- What the base needs: let only the check right after the held one undo the drop, the typo signature the ruling describes. Every later drop counts as spending as before. Also mark safe to spend as "waiting on your answer" while any `undid` amount stands, so no screen shows it as sure. Add a test with a real gift, two unlogged drops across a pay day, and the answer given after the pay day. The coordinator should confirm this reading of the ruling.
- Cost: about an hour now, engine only, nothing saved changes. Later: confident wrong headlines in live books, and a correction that lands as a sudden fall in a closed period.

WATCH
- Reasoned from the code, not run. largeGain judges the gap after taking off `explained` (lookahead.js:970-975), but `held` adds the raw filler amount (lookahead.js:985). When a held gain also has an explained part (a removed move-in held by that check), `held` is too large by that part, so more of a later drop is undone. Use the same figure in both places.
- Still open from the last run. Undo of an older check-in after a newer one: act3.js:348-349 looks only at the step's own records, so a later check holding its ticks does not stop it. The journal Undo after a reload has no `before` (act3.js:342, 354). fixesOf reads the day from told.slice(0,10) and needs the device offset, never 'Z'.
- Statement import and several currencies: the card side now holds two-sided records (lookahead.js:693), and lineless skips other currencies. A convert removed after checks on both sides still needs a test before a second currency is built.
- A check-in's gap placed on a goal: the card side holds with place null, so it goes on Free to spend (lookahead.js:693), and the bank side goes on its check-in's line. Each side cancels its own gap's line, so totals hold. Receipts rows for that case have not been walked.

What I checked and found sound
- Last run's finding 1, own move: tr.js gives 60,000 safe and 0 spent in all four cases (removed or not, either bank order).
- Last run's finding 1, card side: c2.js uses Mako's shape with two cards. A removed or corrected card payment keeps 60,000 safe, 0 spent and the bank at 550,000, in both card orders. The door's moveMoney cannot send a `transfer` to a card (act3.js:63-71 allows own accounts only), so card payments are always `repay`.
- Last run's finding 2: fix.js. Fixed on 8 Dec, before the 13 Dec check: the closed period keeps 1,000, the new period 0, safe 60,000. Both parts of a fix stay on the corrected check's line (lookahead.js:541-548; the builder's Kenji test).
- Both directions, the ruled typo (ty.js): typed 950,000, checked at 94,000: 6,000 spent, 3,000 safe. Correcting the 5 Dec figure to 99,000 instead gives the same 6,000 and 3,000. After pay the closed period keeps 6,000.
- Order: the hold guard is per account and the gap loop is per bank by check order, so record and account order do not change the result.
- Nothing needs a saved-data migration. No server setting is involved.

Scratch scripts (not committed): /tmp/claude-0/-home-user-money-headache-remover/232925eb-a47e-564e-94fb-38f48731cae3/scratchpad/bd.js, c2.js, ty.js, tr.js, fix.js
