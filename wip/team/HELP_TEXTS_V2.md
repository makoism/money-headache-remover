# The Burrow: help texts, second version (the words behind every "?")

Written by the voice lane (SIDE M2), 2026-11-19. The 28 ideas of HELP_TEXTS.md (branch side/help-texts), same ideas, rewritten to VOICE.md. Words only, nothing here is wired into the app yet.

**What changed from the first version**
- The "Why it matters" and "What to do" boxes are gone. Each entry is one piece of text that says what the thing is, why you'd care and what to do, in that order (VOICE.md B11). What the "?" shows is everything under the title, the example included.
- Entries are different lengths on purpose (A10). Five have no example because the text already says it.
- Comfort lines, closing lines and "it's not X, it's Y" are out (A1, A2, A3). Sentences are joined (B13). His hyphen is used at most once per entry and never next to an amount.
- Every number, date and glossary word from the first version is unchanged. Pesos stay, since the examples are made up.
- The app says "Emergency fund" on its screens today, so entry 9 does too. The first version said "Rainy Day".
- "the burrow" is lowercase when it means the app, the way the app's own screens write it.

**Notes for the build**
- Entries 14, 22 and 23 describe things that come with the ledger and the Wallet and Track switch. Show them only when that part exists.
- Entry 20 was checked on 2026-11-19 against the cloud copy steps after they landed (ui42.js, body.html, ui45.js). Its button names are the ones on the screens: Keep a copy in the cloud, Next: get my code, Copy code, I saved it, Enter your recovery code, Load my numbers, I have a code, Find my copy, Load, Show code. If a button is renamed, entry 20 changes with it.
- Entry 25 names a button "Start fresh from today" that is not in the app yet. Entry 18 names "Decide later", which is.
- Entry 13 is titled "What you owe". The Home line is "You owe". Pick one when this is wired in.

---

## 1. What's in your bank right now

Everything else in here is worked out from this one number, so if it's a guess then everything after it is a guess too. Open your bank app and type exactly what it shows - you can do it again any time you want to check the burrow still matches your bank.

Example: your bank app says ₱18,400, so you type ₱18,400

## 2. Now and planned

Some numbers are money you actually have and some are money you've decided what to do with, and mixing those two up is where the "wait, where did it go" feeling comes from. Now is what's really there today. Planned is what you've told your money to do, so a planned number hasn't happened yet.

Example: now says ₱18,400 in the bank and planned says ₱6,000 of your pay is for rent. The rent money is still sitting in the bank but it already has a job.

## 3. Total

Everything you have in one number, wherever it's sitting. It's the one to look at when you just want to know if you're okay, but it doesn't tell you what you can spend - that's Free to spend. If Total looks wrong, check your bank number first.

Example: Total ₱36,000 could be ₱18,000 in the bank, ₱15,000 in burrows and ₱3,000 in your wallet

## 4. Free to spend

Your bills are covered and your saving is already put away, so whatever is in here is yours to spend on whatever you want. When it's gone it's gone until next pay day. If it's running low you either slow down for the rest of the month or move a bit over from somewhere else.

Example: say Free to spend is ₱4,000 and you go to dinner with friends for ₱350, now it's ₱3,650

## 5. Bills left

What you still have to pay this month. Don't spend this, it's already the landlord's. When you pay a bill you log it and the number goes down.

Example: Bills left is ₱9,500 because electricity ₱2,000, internet ₱1,500 and rent ₱6,000 are still coming, and once you pay the internet it's ₱8,000

## 6. Saved

Money you've put aside for later, so your goals, your Emergency fund and anything else that builds up over months. It only works if you don't dip into it for normal days, so leave it alone and let it grow a bit every pay day. When you do need some, take it on purpose and say what it's for.

Example: Saved is ₱45,000 across your burrows and you add ₱3,000 this month, so next month it says ₱48,000

## 7. A burrow

A burrow is a place where money piles up over months for one thing you care about, like a trip or a home. Money with a name on it is harder to spend by accident. Make one for anything you want to build up to, give it a name and put a bit in every pay day.

Example: a burrow called Trip to Siargao gets ₱1,500 every pay day and you can watch it fill up

## 8. A goal

The amount a burrow is trying to reach. Without one you're just saving with no end to it, and with one you can see how far you've got left. Give a burrow a goal amount, and a date if you have one, and the burrow works out how much to put in each month.

Example: a trip goal of ₱30,000 in 10 months is ₱3,000 a month, and if you push the date back the monthly amount gets smaller

## 9. Emergency fund

Something always comes up. A phone breaks, work goes quiet for a month. If the money for it is already sitting there you just pay for it and carry on, which is why this is the first burrow to fill, before the fun ones. Start small, even ₱500 a month, aim for about three months of your bills first and only touch it for real surprises.

Example: if your bills are ₱20,000 a month the first goal is ₱60,000, which is three months covered if something goes wrong

## 10. Education

Money for learning something, like a course or a book. It's a burrow, so it builds up and you take from it when you sign up for something you want to learn.

Example: ₱500 a month is ₱6,000 a year, which is enough for a good online course

## 11. Giving

Money you keep for gifts and for the people and causes you care about. With its own burrow a birthday isn't a surprise anymore, you put a bit in every month and give from what's built up. If there isn't much in there you give less this time.

Example: ₱800 a month goes into Giving and by December it's ₱6,400, so the family party and two gifts for ₱3,000 come out of that

## 12. Investing

Money you put away to grow and don't spend. It's for years from now and not for next month, which is why it sits apart from everything else. Add what you can on the same day each time and leave it. If you're not ready to invest yet just leave this one empty.

Example: ₱1,000 every pay day is ₱12,000 after a year

## 13. What you owe

Each card or loan goes in with what you owe on it right now. Once it's on the screen with everything else you can plan around it. Pay it down when you can and the number gets smaller.

Example: a card has ₱8,200 on it, you pay ₱2,000 and now you owe ₱6,200

## 14. Card spending is already spent

When you pay by card the money stays in your bank until the card bill gets paid, so your bank looks fuller than it really is. The burrow keeps card spending separate so you don't spend the same money twice. Type in what's on each card right now and when it gets paid, and you'll see what your bank will have after the cards are paid - that's the number that's really yours.

Example: bank ₱25,000 and cards ₱9,000 means you really have ₱16,000

## 15. Pay day

On pay day you decide what every peso is for before you spend any of it, because money you haven't decided on is the money that disappears. When your pay lands you enter it and the burrow helps you split it across bills, burrows and Free to spend. Anything not placed yet is still yours and you can place it whenever you're ready.

Example: pay of ₱30,000 goes ₱14,000 to bills, ₱6,000 to burrows and ₱10,000 to Free to spend, and nothing is left over

## 16. Logging a receipt

Logging what you spend is how you see where your money actually goes. Put in the amount and a rough category, rough is fine, or upload a statement and let the burrow read it for you.

Example: ₱280 on groceries takes ten seconds to log and Free to spend goes down by ₱280

## 17. Once a week is enough

You don't have to log everything the moment you spend it, you'd get sick of it and stop. Pick a day that's easy, like Sunday evening, log what you remember and check your bank number. It takes under a minute.

## 18. The month-end question

If there's money left at the end of the month that you planned to use and didn't, the burrow asks where you want it to go so it doesn't just drop out of sight. Pick a goal, your Emergency fund, or keep it as Free to spend. If you're not sure tap Decide later and it'll wait.

Example: you planned ₱4,000 of Free to spend and spent ₱3,100, so there's ₱900 left that can go to your trip burrow

## 19. Below zero

Sometimes your bank is going to end up under what you planned, or even below zero, because something this month cost more than the plan. The burrow shows you which month and how much, and then it's up to you - spend less, move money over or wait for the next pay.

Example: the bank would be ₱1,200 below zero on the 8th and pay comes on the 10th, so you either hold back ₱1,200 of spending or move it from Free to spend

## 20. The cloud copy and the recovery code

Your numbers live in this browser on this phone, so if you lose the phone or clear the browser they're gone unless there's a copy somewhere else. The cloud copy is that copy, and it's locked so only your recovery code opens it.

1. In Settings find Cloud copy and tap Keep a copy in the cloud
2. It tells you what the cloud copy is, then you tap Next: get my code
3. The burrow shows you your recovery code. Tap Copy code and paste it in your notes or password app, somewhere other than this phone, because nobody can get it back for you if you lose it. Then tap I saved it
4. From then on every change goes to the cloud copy by itself, you don't have to do anything. Settings shows when it was last sent
5. On a new phone or another browser you open the burrow, tap Enter your recovery code on the welcome screen, type the code in and tap Load my numbers, and your numbers come back
6. If the welcome screen is gone you go to Settings, find Cloud copy, tap I have a code, type the code in and tap Find my copy. It shows what it found, then you tap Load

If you need the code again it's in Settings under Cloud copy, tap Show code.

## 21. A backup file

A backup file is your own copy of everything and you keep it yourself. Save one every now and then, and always before you change something big. Keep it somewhere you'll find it again, like your email or a drive.

## 22. Wallet and Track

Two ways to handle Free to spend, so pick the one you'll actually keep up. Wallet means you set the amount and spend it any way you like, and just check in now and then. Track means you log each thing you buy and watch the number go down. You can switch later.

Example: with Wallet you have ₱4,000 for the month and that's it, with Track every coffee and ride gets logged

## 23. Borrowed, lent and paid back

If you borrow money you owe it and if you lend it someone owes you, so write it down and neither of you has to remember. Use Borrowed when money comes in that you'll give back, Lent when you pay for someone, and Paid back when it's returned either way.

Example: you cover a friend's ₱1,500 share of dinner and mark it Lent. When they send it back you mark it Paid back and you're even.

## 24. Sending money to family

If you send money home every month, give it its own line called Family support with the amount you usually send, so it's planned and doesn't come out of your bills. When someone asks for extra you log it there too and see what it did to the month.

Example: ₱5,000 home every month is planned. An extra ₱2,000 for school fees comes out of Free to spend and you can see that it did.

## 25. A missed week

If you skip a week or even a month nothing breaks, and you don't have to go back and log what you missed. Tap Start fresh from today, type what's in your bank right now and carry on from there.

Example: three weeks without logging, you type today's bank number ₱12,300 and the burrow is right again in under a minute

## 26. Sample numbers

These numbers are made up so you can see how the burrow works - none of this is your money yet. Put in your own pay, bills and bank number and after that everything on the screen is yours.

## 27. On plan, Tight, Short

The one line answer to "am I okay this month". On plan means yes. Tight means yes but with not much room. Short means the plan needs more than you have, and that's easier to fix now than later. If it says Tight or Short, open the month and see what could give a bit, like Free to spend - the burrow gives you one tap ways to fix it.

Example: Short by ₱1,000, so you take ₱1,000 off Free to spend and the month is On plan again

## 28. Not placed yet

This is pay you haven't put anywhere yet. It's still in the bank and still yours, but money with no place is the easiest to spend without noticing. Add it to a burrow, to Free to spend or to a bill, or leave it for now.

Example: ₱2,500 not placed yet, you put ₱1,500 in your trip burrow and ₱1,000 in Free to spend and it's all placed

---

## Where clear won over "like Mako"

- Entry 2: the first version said a planned number "is not in your account yet", and its own example has the rent money still in the bank. I wrote "hasn't happened yet", which is true for both. Worth a look by whoever owns the now and planned labels.
- Entry 9: "Something always comes up." stays a sentence of its own. Joined to the next one it read as a list.
- Entry 20 is numbered steps with full names of the buttons (B15). It is the longest entry and should be.
- Entry 27: the three status words each get a short sentence, because joined they were hard to tell apart.
- Examples that end a "?" have no full stop when they are one sentence (Part C, one line notes). Two sentence examples keep theirs.

## Glossary words that sound off to me (for Mako, nothing renamed)

- **"Not placed yet"** as a name. It reads fine in a sentence ("pay you haven't placed yet") and stiff as a label.
- **"Cloud backup"** is gone, the app says cloud copy everywhere now. What is left: "Find my copy" in Settings and "Load my numbers" on the welcome screen are two words for the same tap.
- **"Bills and basics"** next to **"Bills left"**. Close enough to mix up when read fast.
- **"Education"** is the one burrow name he wouldn't say out loud. "Learning" is closer to how he talks.
- **"Emergency fund" or "Rainy Day"**. The app has both, Emergency fund on the screens and "rainy" underneath. Emergency fund is the money word a beginner has heard before. Rainy Day sounds more like a place. His call.
- **"On plan, Tight, Short"**. Short can be read as "short on time" until you see the amount next to it.
- **"The month-end question"** is our name for it, not a word on a screen. It doesn't need a name in the app at all.
