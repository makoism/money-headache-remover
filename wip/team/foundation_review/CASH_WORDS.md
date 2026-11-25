# Cash plan: the assistant's new words (drafts for qc-voice, then the coordinator for Mako)

LANE F, 26 Nov 2026. Each line is what the assistant says (or the card says with the assistant off). {braces} are filled from the person's own figures. Made-up figures only. Plan: foundation_review/CASH_PLAN.md.

## 1. Setup: how to run your money (M92), asked once
1.1 Before we put numbers in, here's what works best. Once a month you take your money out as cash and split it into envelopes, one for each burrow. Holding real cash feels very different from looking at numbers, and it keeps your head clear
1.2 Only do it if you have a safe place at home for the envelopes
1.3 If that's not for you, the next best thing is splitting your bank into a few accounts and having your pay go into each one by percentage
1.4 Or keep it all in your bank and use the app to see where it's meant to go. That works too, it's just less clear day to day
1.4b The smallest step: keep just your play money as cash in your wallet, and the rest in the bank
1.5 How do you want to do it?
Buttons: [Cash envelopes for everything] [Just play money in my wallet] [Split my bank] [Keep it all in my bank] [Not sure yet]
1.0 (said first) A burrow is a pot of money with one job, like groceries, rent or a trip. Play money is the one for anything you like
1.6 (Not sure yet) OK, we'll keep it in your bank for now. You can switch any time in Settings or just tell me

## 2. Set amounts or percentages (M88)
2.1 Each burrow can get a set amount or a percentage of your pay
2.2 A set amount is the same every month, like 40,000 for play money
2.3 A percentage moves with your pay, like 15% of each pay. If your pay is 240,000 that's 36,000
2.4 Which do you want to start with? You can change any burrow later
Buttons: [Set amounts] [Percentages]
2.5 (Percentages, a running total) That's {n}% so far, your bills take {b}%. {left}% left to give out
2.6 (Over 100) That's {n}%, over 100. Take {over}% off somewhere
2.7 (Under 100 at the end) {left}% of your pay has no burrow yet, that's about {amount} each pay. You'll get to split it into your burrows on pay day, or keep it in the bank

## 3. Play money, always asked (M90, M93)
3.1 How much do you want for play money each {month|pay}? That's money for anything you like. Cash in your wallet is best, then you always know what's left
3.2 Skip button: [Skip for now]
3.0 After rent, bills and your other burrows about {left} of your pay is left. You could start with {suggest}
Buttons: [Use {suggest}] [Another amount] [Skip for now]
3.3 (Skipped) OK. Until you set it, the app takes everything on your cards off what it says you can spend

## 4. Cash way only: which burrows go in cash (M93)
4.1 Which burrows do you want as cash? Play money in your wallet is the one we'd start with
Buttons: one per burrow, plus [Just play money]
4.2 You can keep a separate wallet for each one too, a play wallet and a grocery wallet

## 5. Pay day (M89, M96), one card, "1 of 3"
5.1 Your pay is in. {burrow} had {amount} left from last {month|pay}. Keep it there, put it in another burrow, or decide later?
Buttons (envelope): [Keep it in the envelope] [Put it in a burrow] [Decide later]
5.2 You got {amount} extra this {month|pay}. Split it into your burrows, keep it in the bank, or decide later?
Buttons: [Split it] [Keep it in the bank] [Later]
5.2b (under the buttons) Keep it in the bank: done, I won't ask again. Later: it waits on Home until you pick
5.3 (Later) OK, it stays on Home as extra money to decide
5.4 Time to take out cash: {total} from {bank}
5.5 {wallet} {amount}  (one line per envelope)
Each row has its own amount and a tick. Buttons: [Done] [Not today] [Finish later] [Back]
5.4b (split my bank way) Time to move your pay: {amount} to {account}, one line each. Your bank can probably do this for you on pay day as an automatic transfer
5.9 (rows not done) Still to take out: {burrow} {amount}. [Take it out now] [Leave it in the bank this time]
5.10 (ATM fee, optional) Was there a fee?
5.6 (Different amount) How much did you take out?
5.7 (More than the list) You took out {extra} more. Put it in which envelope, or keep it as extra cash?
5.8 (Not today) OK, I'll remind you next time you open the app

## 6. Day to day (M95)
6.1 (asked once a week if no update) Roughly how much cash is left in your {wallet}?
6.2 (after an answer) Play money is {left} now, so about {spent} went since {day}
6.3 (more than one cash place, unclear which) Which one, {wallet 1} or {wallet 2}?

## 7. A spend or receipt it can't place (M94)
7.1 What was the {amount} for?
Buttons: one per burrow, plus [Something else]
7.2 (only with a real guess, saying why) Was the {amount} at {shop} play money? It looks like lunch
7.3 (the person uses cash for a burrow and the spend could be either) Was that from your {envelope} or on a card?

## 8. Added after qc-novice plan review 1
8.1 (wallet went up) It went up by {amount}. Where did it come from?
Buttons: [Someone paid me back] [A gift or other money] [I put back cash I didn't spend]
8.2 (bank check, cash list open) Did you take out cash for your envelopes? That was {total}
8.3 (removing an envelope) How much cash is in it now?  Buttons: [Move it to another envelope] [Put it back in the bank] [Keep it as cash with no burrow]
8.4 (new wallet) How much is in it right now?
8.5 (over 100%) That's {n}%, {over}% over. Take it off one of them
8.6 (smaller pay) Your pay was smaller this time. Bills and burrows need {short} more than came in. [Lower play money this time] [Take it from the bank] [Decide later]
8.7 (Home, wallet and play money differ) Play money left {left} (wallet about {cash}, {card} went on the card)
