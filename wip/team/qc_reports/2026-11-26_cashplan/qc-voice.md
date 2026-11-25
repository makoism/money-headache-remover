# Voice check: CASH_WORDS.md (cash plan drafts, 26 Nov)

78 lines checked, 54 pass, 24 fail. 5 fail on AI, 21 on Mako, 9 on next step. (5.5 skipped, it's only {wallet} {amount}.)

Whole file: no A10 problem, the entries are uneven the way they should be. Four lines open with "OK" (1.6, 3.3, 5.3, 5.8) and that's starting to sound like a tic, so keep it on the ones that answer a tap and drop it from the rest.

Things that run across the file:
- "play money" is on the retired list in my brief, but Mako uses it himself in M88 to M95 (26 Nov), which is newer. I haven't failed any line for it. It's under For Mako below.
- The same number has four names: Free to spend (VOICE glossary), safe to spend (MAKO_SAYS M90), "what it says you can spend" (3.3) and "Play money left" (8.7).
- Money with no job yet also has more than one name: "no burrow yet" (2.7), "extra" (5.2), "extra money to decide" (5.3), "extra cash" (5.7) and "cash with no burrow" (8.3). The glossary word is "not placed yet" and it's never used.
- 2.2, 2.3 and 2.7 use plain figures like 40,000 with no currency sign. Yen is the default so they read fine, but the real card has to show the sign.
- 7.2 has "It looks like lunch" written in. If that's meant to be the guess for this receipt it needs a {reason} slot. I can't tell from the words.

## 1. Setup
LINE: Before we put numbers in, here's what works best. Once a month you take your money out as cash and split it into envelopes, one for each burrow. Holding real cash feels very different from looking at numbers, and it keeps your head clear
AI: yes, A8 warm-up ("here's what works best" only announces the next sentence), A6 lesson as a closer ("and it keeps your head clear")
MAKO: no, B9 stock picture ("keeps your head clear"), B13 three sentences that belong together
NEXT: yes
REWRITE: Before we put numbers in, what works best is taking your money out as cash once a month and splitting it into envelopes, one for each burrow, because holding real cash feels really different from just looking at numbers

PASS  Only do it if you have a safe place at home for the envelopes
PASS  If that's not for you, the next best thing is splitting your bank into a few accounts and having your pay go into each one by percentage
PASS  Or keep it all in your bank and use the app to see where it's meant to go. That works too, it's just less clear day to day

LINE: The smallest step: keep just your play money as cash in your wallet, and the rest in the bank
AI: yes, A13 colon used as a drum roll
MAKO: no, Part C no colon to set up a reveal
NEXT: yes
REWRITE: The smallest step is keeping just your play money as cash in your wallet and the rest in the bank

PASS  How do you want to do it?
PASS  Cash envelopes for everything
PASS  Just play money in my wallet
PASS  Split my bank
PASS  Keep it all in my bank
PASS  Not sure yet

LINE: A burrow is a pot of money with one job, like groceries, rent or a trip. Play money is the one for anything you like
AI: yes, A4 three examples where two would do
MAKO: no, Part D2 says no "pot", B13 two sentences that belong together
NEXT: yes
REWRITE: A burrow is a place for money with one job, like groceries or a trip, and play money is the one for anything you like
NOTE: I took out "rent" because 3.0 lists rent next to bills and burrows, so rent was going by two names. "place" is Mako's own picture (B9). "burrow" and "play money" are left as they are.

PASS  OK, we'll keep it in your bank for now. You can switch any time in Settings or just tell me

## 2. Set amounts or percentages
PASS  Each burrow can get a set amount or a percentage of your pay
PASS  A set amount is the same every month, like 40,000 for play money
PASS  A percentage moves with your pay, like 15% of each pay. If your pay is 240,000 that's 36,000
PASS  Which do you want to start with? You can change any burrow later
PASS  Set amounts
PASS  Percentages

LINE: That's {n}% so far, your bills take {b}%. {left}% left to give out
AI: no
MAKO: no, B13 chopped into two with a comma splice
NEXT: no, you can't tell if {n} already counts the bills, so the three numbers don't obviously add up
REWRITE: Your burrows have {n}% so far and your bills take {b}%, so {left}% is left to give out
NOTE: From the words alone I can't tell whether {n} includes {b}. The rewrite assumes it doesn't, so check with the lane.

LINE: That's {n}%, over 100. Take {over}% off somewhere
AI: no
MAKO: no, B13 chopped, B14 "over 100" drops the %
NEXT: no, "somewhere" doesn't say where to take it from
REWRITE: That's {n}%, more than 100%, so take {over}% off one of your burrows
NOTE: Clear wins. I can't tell if bills can be lowered here too. If they can, use "off a burrow or a bill". 8.5 is the same message in other words (see there).

PASS  {left}% of your pay has no burrow yet, that's about {amount} each pay. You'll get to split it into your burrows on pay day, or keep it in the bank

## 3. Play money
LINE: How much do you want for play money each {month|pay}? That's money for anything you like. Cash in your wallet is best, then you always know what's left
AI: yes, A11 the middle sentence says 1.0 again
MAKO: no, B13 three short sentences in a row
NEXT: yes
REWRITE: How much do you want for play money each {month|pay}? Cash in your wallet is best because then you always know what's left

PASS  Skip for now

LINE: After rent, bills and your other burrows about {left} of your pay is left. You could start with {suggest}
AI: no
MAKO: no, B13 two thoughts that belong in one sentence
NEXT: yes
REWRITE: After rent, bills and your other burrows about {left} of your pay is left, so you could start with {suggest}
NOTE: I kept "about". If {left} is the exact figure, drop it (D1).

PASS  Use {suggest}
PASS  Another amount

LINE: OK. Until you set it, the app takes everything on your cards off what it says you can spend
AI: no
MAKO: no, B7 the main number gets a roundabout instead of its name, B5 "the app takes ... off what it says" is the long way round
NEXT: no, it doesn't say which number on Home goes down
REWRITE: OK, until you set it everything on your cards comes off Free to spend
NOTE: Clear wins. I used the VOICE glossary name. Whether it's Free to spend or safe to spend is for Mako (see below).

## 4. Which burrows go in cash
PASS  Which burrows do you want as cash? Play money in your wallet is the one we'd start with
PASS  Just play money

LINE: You can keep a separate wallet for each one too, a play wallet and a grocery wallet
AI: no
MAKO: no, B14 drops "like", so it reads as if those two are the only wallets you can have
NEXT: yes
REWRITE: You can keep a separate wallet for each one too, like a play wallet and a grocery wallet

## 5. Pay day
LINE: Your pay is in. {burrow} had {amount} left from last {month|pay}. Keep it there, put it in another burrow, or decide later?
AI: no
MAKO: no, B13 three short sentences in a row
NEXT: yes
REWRITE: Your pay is in and {burrow} had {amount} left from last {month|pay}. Keep it there, put it in another burrow or decide later?

PASS  Keep it in the envelope
PASS  Put it in a burrow
PASS  Decide later
PASS  You got {amount} extra this {month|pay}. Split it into your burrows, keep it in the bank, or decide later?
PASS  Split it
PASS  Keep it in the bank

LINE: Later
AI: no
MAKO: no, B7 it's the same choice as [Decide later] on 5.1 and 8.6, and this question even says "decide later"
NEXT: yes
REWRITE: none, it's a button word (D11). See For Mako.

LINE: Keep it in the bank: done, I won't ask again. Later: it waits on Home until you pick
AI: yes, A5 run of clipped fragments
MAKO: no, Part C label-colon form, B14 shorthand that reads like a form
NEXT: no, "I won't ask again" could mean this money or every pay day from now on
REWRITE: If you keep it in the bank I won't ask about this money again, and if you tap Later it waits on Home until you decide
NOTE: The rewrite reads "again" as this money only. Check that's what the screen does, since M89 wants the notice to keep coming.

LINE: OK, it stays on Home as extra money to decide
AI: no
MAKO: no, B14 "extra money to decide" leaves words out
NEXT: yes
REWRITE: OK, it stays on Home as extra money until you decide
NOTE: If "extra money to decide" is the label on Home, it's a glossary question and goes to Mako.

PASS  Time to take out cash: {total} from {bank}
PASS  Done
PASS  Back

LINE: Not today
AI: no
MAKO: yes
NEXT: no, it sits on the same card as [Finish later] and nothing says how the two differ
REWRITE: none, it's a button word (D11). See For Mako.

LINE: Finish later
AI: no
MAKO: yes
NEXT: no, same as above, and no line says what happens after you tap it (5.8 only covers Not today)
REWRITE: none, it's a button word (D11). See For Mako.

LINE: Time to move your pay: {amount} to {account}, one line each. Your bank can probably do this for you on pay day as an automatic transfer
AI: no
MAKO: no, B4 the bank does it and the person does nothing, "one line each" reads like a note to the builder
NEXT: no, it doesn't say that the person sets it up, where, or what happens after
REWRITE: Time to move your pay: {amount} to {account}. You can probably set this up in your bank as an automatic transfer on pay day, then it happens by itself
NOTE: Kept "probably" because the app really doesn't know (D5). Each row still shows {amount} to {account}.

PASS  Still to take out: {burrow} {amount}.
PASS  Take it out now
PASS  Leave it in the bank this time
PASS  Was there a fee?
PASS  How much did you take out?

LINE: You took out {extra} more. Put it in which envelope, or keep it as extra cash?
AI: no
MAKO: no, B14 "Put it in which envelope" is a form's word order, not how people talk
NEXT: yes
REWRITE: You took out {extra} more than the list. Which envelope should it go in, or do you want to keep it as extra cash?

PASS  OK, I'll remind you next time you open the app

## 6. Day to day
PASS  Roughly how much cash is left in your {wallet}?
PASS  Play money is {left} now, so about {spent} went since {day}
PASS  Which one, {wallet 1} or {wallet 2}?

## 7. A spend it can't place
PASS  What was the {amount} for?
PASS  Something else
PASS  Was the {amount} at {shop} play money? It looks like lunch
PASS  Was that from your {envelope} or on a card?

## 8. Added after qc-novice
LINE: It went up by {amount}. Where did it come from?
AI: no
MAKO: no, B13 two short sentences in a row
NEXT: yes
REWRITE: Your {wallet} went up by {amount}, where did it come from?
NOTE: D3, it names which wallet. "It" doesn't say which one if the card stands alone.

PASS  Someone paid me back
PASS  A gift or other money
PASS  I put back cash I didn't spend

LINE: Did you take out cash for your envelopes? That was {total}
AI: no
MAKO: no, B13 the amount gets tacked on after the question
NEXT: yes
REWRITE: Did you take out the {total} in cash for your envelopes?

LINE: How much cash is in it now?
AI: no
MAKO: yes
NEXT: no, it asks for an amount but the buttons answer a different question (where the cash goes)
REWRITE: How much cash is in it now, and where should it go?
NOTE: I can't see if there's an amount box with the buttons. If there isn't, the question doesn't fit.

PASS  Move it to another envelope
PASS  Put it back in the bank

LINE: Keep it as cash with no burrow
AI: no
MAKO: no, B7 the same money is "extra cash" in 5.7
NEXT: yes
REWRITE: none, it's a button word (D11). See For Mako.

PASS  How much is in it right now?

LINE: That's {n}%, {over}% over. Take it off one of them
AI: no
MAKO: no, B7 it's the same message as 2.6 in other words, B13 chopped
NEXT: no, "one of them" doesn't say what to take it off
REWRITE: That's {n}%, {over}% too much, so take it off one of your burrows
NOTE: Keep one wording for 2.6 and 8.5. The same doubt about bills applies as on 2.6.

LINE: Your pay was smaller this time. Bills and burrows need {short} more than came in.
AI: no
MAKO: no, B13 two sentences that belong together
NEXT: yes
REWRITE: Your pay was smaller this time, so your bills and burrows need {short} more than came in

PASS  Lower play money this time
PASS  Take it from the bank
PASS  Decide later

LINE: Play money left {left} (wallet about {cash}, {card} went on the card)
AI: no
MAKO: no, Part C no brackets for side notes
NEXT: yes
REWRITE: Play money left {left}
(next line) about {cash} in your wallet and {card} went on the card
NOTE: I kept "about" and "the card". If {card} adds up both cards, it should say "your cards" (D3). It's a label, so it's split over two lines and kept no longer than the original.

## For Mako: glossary words (not rewritten)
- "play money" is on the retired list but it's Mako's own word from 26 Nov (M88 to M95). Is it back in the glossary?
- The headline number has four names: Free to spend (VOICE), safe to spend (M90), "what it says you can spend" (3.3) and "Play money left" (8.7). Pick one.
- Money with no job: the glossary says "not placed yet" but the drafts say "no burrow yet", "extra", "extra money to decide", "extra cash" and "cash with no burrow". Mako's own word in M89 is "extra".
- [Later] (5.2) and [Decide later] (5.1, 8.6) are the same choice. Pick one.
- [Not today] and [Finish later] sit on one card and nobody can tell them apart.
- [Another amount] has no verb in it.
- envelope, wallet and burrow: 1.1 has one envelope per burrow, 4.2 one wallet per burrow, and 6.1 and 7.3 use {wallet} and {envelope}. Say once whether a wallet counts as an envelope.

## Five worst
1. 1.0 "A burrow is a pot of money with one job" is the first thing the person hears, and it explains the app's main word with "pot", a word Part D bans.
2. 1.1 "and it keeps your head clear" is a feel-good closer on the very first paragraph, which is the kind of line Mako called slop.
3. 5.2b "Keep it in the bank: done, I won't ask again. Later: it waits on Home until you pick" reads like form shorthand, and "again" leaves it open whether the app stops asking for good.
4. 3.3 "off what it says you can spend" is a roundabout for the main number, and the person can't tell which figure went down.
5. [Not today] next to [Finish later] gives two buttons on one card with no way to tell them apart.
