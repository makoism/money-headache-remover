# app3: for Mako's run (23 Nov night JST)

Every item already has a working default. None of them block using the app.

## Server changes needed (cloud copy; nothing has been changed or deployed)
1. A write that names no base is refused when a copy already exists. Today another device's copy can be overwritten.
2. Refuse a copy whose format is not gz1, or whose shape is newer (E3).
3. Keep dated versions, not only the one copy before.
4. Leave a "deleted" marker when the cloud copy is deleted, so another device does not send it back up.
5. Watch the 400 writes a day limit (one send every 90 s).

## Feel and wording
- Tab bar at the top. It covered form fields on a phone when it was at the bottom.
- Undo: the bar shows for 8 s. Should Undo still be offered after a reload? The old app kept it for 3 days.
- Receipts: a day after today is refused. A refund given back to no line comes back to the account only.
- "Add statements" sits under Home. Should it have its own tab?
- A card statement's printed close day becomes the card's close day.
- A big check-in gap in a past period shows as Free to spend overspent. Should it have its own line?
- Goal pace reads "about ¥16,250 each pay to reach it by 1 Aug 2027".
- Overdue reads "¥25,000 due 27 Nov has not been seen. Tick it at Check your bank when it has gone".
- Cloud code look (MHR-XXXX), the turn-off words, 90 s between sends, a new build loading by itself when the page goes to the background.
- With the cloud copy on, restoring a backup does not remove records added on another device since.
- Names left open in screens/names.js: Bank today or In your bank; This pay period or Until next pay; and the others listed there.
- Privacy words for statements and Ask.
