# qc-foundation: lane/ai-merge at b7ecd7f (the assistant's core joined to its panel, setup by chat), 24 Nov 2026

FAIL

CHECK: check3_full.txt is ALL GOOD (80 tests). I ran the answers3, chat3_core and plan3_write tests (all pass) and six walk scripts on the engine and the pure files. No browser run. The engine is unchanged in this merge.

Why FAIL: the two base faults from the last two foundation rounds are still in this build, and the assistant, now the main way in, is what triggers them. Both are already fixed on origin/lane/controls-base and were never brought under this lane. Lesson 1's warning signs: the same finding three rounds running, and a fix that exists but not in the build. Five faults at the join also break owner lines.

## OWNER'S WORDS
- M1: MET.
- M2: MET for typed answers. Uploads NOT BUILT. BROKEN at finding 3.
- M3: BROKEN (grid).
- M4: MET for spends, "pay came in", "my bank shows X". Receipts NOT BUILT.
- M5: MET. M6: MET in one visit (chat3_core.js:599-611).
- M7: BROKEN (finding 3). M9: NOT BUILT.
- M13: BROKEN (grid; scoped to the controls lane in scope.txt).
- M14: BROKEN after a reload (foundational 2) and for Start over (finding 4).
- M15, M16, M17, M22: MET. M18, M24, M46: silent.
- M19, M61, M67: BROKEN in one case (finding 5). Otherwise M61 MET.
- M23: MET for adding. Pay-later NOT BUILT.
- M26 to M30, M32, M40, M41, M44, M45: MET. Mako's shape by chat gives 201,400 on 24 Nov, next pay 10 Dec.
- M39: MET in the chat (chat3_core.js:244).
- M31, M38: MET at setup, BROKEN on a job change (foundational 1).
- M34, M48: MET for Japan and the Philippines, BROKEN elsewhere (finding 6).
- M36, M37: MET in the chat (a later day asks again), BROKEN through "Set up on the screens" (finding 7).
- M42: BROKEN (finding 3).
- M63: MET. M68: MET while the code word is set.

## GRID (17 kinds; add, change, remove or end; on the screens and by the assistant)
102 cells: 57 covered, 2 not applicable, 43 empty.
- Assistant, 25 empty: change a spend, refund, money in or move (4); remove a move (1, `list` never shows moves); change or untick a ticked pay or bill (4); change or remove a bank or card figure (4); goal change, remove (2); card change, remove (2); account change, remove (2); loan add, change, close (3); minimum set, change, remove (3).
- Screens, 18 empty: change or untick a tick (4, Receipts hides them, receipts3.js:27); change or remove a figure (4); add a pay, end a pay (2); remove a goal (1); remove a card (1); account add, change, remove (3); minimum (3).
- On neither door: 15 of these.
- Covered but refused in a case: the assistant cannot change how often pay lands, or add a first fixed pay, while a line or Free to spend exists. The step asks "How much each pay from then for Free to spend?" and the tool has no field for the answer (chat3_core.js:489-499). A freelancer who gets a job is stuck.
- Undo: complete inside one visit. After a reload, only steps that add or remove.
All are builder gaps: the saved shape holds each.

## FOUNDATIONAL (both known, both fixed elsewhere, neither in this build)

**1. A job change freezes the pay periods.**
- Moment: 5 Jan, "my job ended, the new one pays 300,000 on the 25th". The assistant ends P1 (chat3_core.js:472) and adds a pay.
- What I saw (t3.js): the flag stays on the ended pay (plan3_write.js:144-145, 400). On 20 Mar the period reads 10 Dec to 20 Mar, with Food 40,000 and Free to spend 60,000 for 14 weeks. Ticking the new pay starts nothing.
- Fix: commit 58b9ebfd on lane/controls-base (dated startsPeriod in the saved data and the engine).

**2. Undo on an assistant card fails after a reload.**
- Moment: Mako on Android changes rent to 80,000 by chat, looks at his bank app and comes back to a reloaded page. The kept card still offers Undo.
- What I saw (t4.js): "Nothing changed", rent stays 80,000, the card still says Done. Same for ending a bill. A card with a spend and a bill change undoes neither. Undo of an added pay removes the pay and leaves no pay starting the periods (act3.js:269).
- Fix: commit bdab1a1f on lane/controls-base (the saved Undo journal).

**What to do:** merge origin/lane/controls-base into this lane before it goes further. I tried the merge: engine, store and app3/src join cleanly; only check3.sh, the built sw3.js and DECISIONS_ROUND2.md conflict. Cost now: a merge and one full check. Later: every book made before then has undated flags and steps that can never be undone.

## Join findings (builder, no base change, each breaks an owner line)

**3. "Fill in my Burrow" is offered after the bank answer alone.** `need` never asks for country, pay, Free to spend or the minimum (answers3.js:153-185), so the draft card is ready at once (chat3.js:113). One tap gives a book with no pay, country "somewhere else" (no Japanese holidays, and nothing changes it later), no minimum question, and Safe to spend 286,000 (t6.js). Fix: the fill needs country, a pay or "no fixed pay", and Free to spend and the minimum each answered or skipped in words.

**4. Start over can never work.** After any other write the fill card shows Start over (chat3.js:118, 260). It calls E3.discard, which refuses once the hold is gone (e3.js:182). The person confirms "your money on this device goes" and reads "could not be undone on this device". Each lane's test fakes the other side, so no test crosses the join. Nothing is lost. Decide what Start over does once the cloud copy may have sent, then test it on the page.

**5. The cloud copy can be on and send nothing, with no words.** While the fill can still be undone, every send returns silently (cloud3_page.js:54), "Send now" too, until the first change through act3. Mako sets up by chat, turns the cloud copy on, writes the code down and opens his desktop: the cloud is empty (cloud3.js:83). If he loses the phone that week, the code restores nothing. Fix: turning the cloud copy on ends the hold, or Settings says it is waiting and why.

**6. Currency follows the country only.** A bank figure saved before the country is kept as yen units: 50,000, then "Philippines", shows as ₱500 on the draft card (t2.js; chat3_core.js:203, 226). "Somewhere else" gets yen and cents are refused, though the setup screen offers dollars and euros. Fix: a currency answer in the draft, and amounts asked again when it changes.

**7. "Set up on the screens" carries yesterday's figures as today's.** The chat asks again on a later day, but toForm drops the day (answers3.js:195) and fromForm stamps today (209), so nothing is asked (t5.js). Fix: leave a bank or card box empty when its figure is not from today.

## Server settings
- The relay on main takes this request as built. Key and code word: on since 11:30 JST (BW).
- Not shown: any run with the real AI. Every test uses the fake model, and the tool schemas name only `do` and `amount`, so the real model must find the other fields in the description. Run the scripted real-AI walk (BU4) and save it before Mako tries this.
- Not confirmed: the monthly spend limit in the Anthropic console.

## WATCH
- Two setup drafts on one device (the chat's, and setup3's in the device record). The screen's wins when both exist; the chat still fills from its own.
- No "Clear this chat" (plan section 1). After a restore, old cards for another book stay in the panel.
- Couples: new accounts, cards and pays have `owner: null`. Second currency: the draft has no per-account currency. Both stage 2; the shape holds them.

## Checked and sound
- One answers-to-book function: the chat draft and the same answers through the form give the same saved book, record for record (t5.js).
- "My pay came in" and "rent came out" tick the expected item once. A bank figure under the expected one comes off Free to spend. Card payments, a card spend and a card figure hold (t1.js).
- The fill is refused until each asked bill, card statement and "has today's pay landed" is answered for that very day.
- The discard keeps the device record and kept copies; another tab is refused, not written over. The fill's Undo is refused once any other record exists.
- Lives walked: the 10th (Mako), twice a month, every two weeks with pay on the setup day, weekly, freelance with a zero month, cash and an e-wallet, a yearly bill, a refund, three weeks away. Wrong numbers only where listed.

Scripts: /tmp/claude-0/-home-user-money-headache-remover/df4d19d8-6228-577e-a7be-cf8fc631c93b/scratchpad/fq/ (h.js, t1.js to t6.js)
