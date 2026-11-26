VERDICT: FAIL
CHECK: no check3.txt (plan round, nothing built)
OWNER'S WORDS:
- M1, M4 (talk to it day to day): MET in the plan for giving a figure; NOT MET for the later "rent came out" (a refused step with no way out, B1).
- M2 (says where to find figures): NOT MET. The new question never says where in the bank app to look.
- M6 (one Undo): MET (rule 7, one change card).
- M7, M12 (clarity, nothing unknown): NOT MET on the "I don't know" path (B2) and on the later tick (C2).
- M36, M37 (the picture is the bank today): MET for the main case.
- M47 (no shame): NOT MET on the unsure path ("50,000 overspent" for money they did not spend, B2).
- M52, M53 (visual, one thing at a time): NOT MET for several expected items (C3).
- M91 (later, I don't know): MET for the figure question (`unsure`); NOT MET for "before or after you looked?" (B1).
- M98 (walk it as a person): plan walks it as Mako, not as a novice; gaps below.

COUNT: 3 scenes walked, 9 plan steps read (rules 1 to 8 plus 2b to 2d, as the person sees them). Questions the person is asked: 3 (has X come out; before or after you looked; card payment gone through). Answerable by a novice without help: 1. With an "I don't know" answer: 1 of 3. Places I would give up: 2. Words not explained: 4 ("came out", "due", "before or after you looked", "overspent").

Scenes
1. Aya, 25, on the train, bank app open in one hand. Types "my bank shows 204,000". Wants: "ok, so how much can I spend this week?"
2. Same Aya, three days later, sees "RENT KK FUDOSAN -72,000" in her bank app and types "rent came out". Wants: a tick, done.
3. Ren, weekly pay from a cafe, back after three weeks, types "bank says 61,000". Wants: tell me where I am.

BLOCKERS
B1. Scene 2, rule 2c/7b. The assistant asks "Did it come out before or after you looked at your bank on 30 Nov?" Aya did not "look at her bank on 30 Nov" in her own mind: she typed a number in a chat three days ago. She has no idea. The plan refuses the tick unless the answer is true or false: no "I don't know", no "not now". That is a step she cannot get out of; I would give up here ("I just said rent came out, why is it quizzing me"). What she can answer: the date next to the line in her bank app, or what her bank shows now. Want: (a) ask "What day does your bank app show next to it?" and compare with the figure day in code; (b) or "What does your bank show now?" which settles everything; (c) "I don't know" files it the safe way (after the figure, so the app never thinks she has more than she has) and says in one line that a new bank figure will fix it if that is wrong. The plan needs a defined answer for "I don't know" here, like `unsure` on the figure step.

B2. Scene 1, rule 6 with `unsure`. Aya does not know if rent left ("I don't know, just put it in"). The plan writes the figure and the whole 82,000 gap becomes everyday spending: she sees Free to spend about 50,000 overspent. She spent about 10,000. A number that says she blew 50,000 she never spent is the one thing that makes her close the app (M12). The plan gives the assistant nothing to say here. Want, in the same reply: "I've put in 204,000. That's 82,000 less than I expected. If Rent (72,000) has gone, you've about 48,000 left to spend; if not, you're 50,000 over. Tell me when you know, or I'll ask next time." Both readings, plus the open question kept and asked again later, never dropped.

B3. Scene 1, rule 6 refuses the figure until the question is answered. If Aya wanders off ("wait, what's Rent due?") or closes the app, is 204,000 kept? Nothing in the plan saves the figure while the question is open, and she would have to type it again. Want: the figure held in the chat (or written as `unsure` if she leaves), never lost (M61, M16).

CONFUSING
C1. "has Rent (72,000, due 27 Nov) come out already?" A novice does not know where to check. Add one line on where (M2): "In your bank app, look at the list of payments around 27 Nov for 72,000." Offer the answers as buttons: "Yes it's gone", "Not yet", "I don't know".
C2. Scene 2 when it works: Free to spend jumps from 0 to 48,000. Nobody told her why. To her, the app just found 48,000. The change card for a later tick dated before a figure must say: "Rent was part of the 82,000 gap, so only about 10,000 of it was spending. Free to spend is now 48,000." Rule 7 covers the words only for the one-step case (C4), not the later tick (rule 8).
C3. Scene 3: one sentence naming three pays plus bills ("Pay 50,000 7 Nov, Pay 50,000 14 Nov, Pay 50,000 21 Nov, Phone 5,000 20 Nov...") is a form squeezed into a chat bubble. Ren answers "yeah all of them I think". Want a tap list in the chat, everything ticked, untick what didn't happen (the screen already does this: "Untick anything that has not gone through yet"), plus "I don't know".
C4. Amounts: "yes, but it was 73,000". Rule 5 gives `landed: [refs]` with no amount; the single `landed` step takes one today. Want the figure step to take a different amount per item.
C5. The leftover 10,000: the plan does not say the assistant tells her "about 10,000 went out that you didn't log; I've counted it as everyday spending" or offers to name it. The screen offers "Log it as a spend now, on ..."; the chat should offer the same, or "leave it".
C6. Card figure (rule 2b): "Card A shows 31,000" then a question about a payment from Main. A novice reading her card app sees "payment received", not "came out of Main". Ask in the card's words: "Has your card's 31,000 bill been paid off yet?"

POLISH
P1. Rent "not yet" (bounced or late): after that, nothing tells her Rent is still waiting. A later nudge ("Rent is 3 days late, has it gone?") would help; out of this slice, worth a WATCH line.
P2. "came out", "due", "landed", "ticked" in the plan's words: the assistant must use one ("gone out" / "come in") everywhere (M51).

FOR MAKO'S EYE
- Whether a bank figure from someone who says "I don't know" should show the scary reading or the kind reading as the headline until they answer (B2 gives both; which one is big is taste).

NOT CHECKED
- No build, no browser, no fake AI run (plan round). The real wording is not written yet (left to qc-voice).
- The screen path (checkin3.js) only read to see today's words; the plan says it does not change.
- Two devices and older builds (scope).
