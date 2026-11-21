# Golden baseline 3831zb (MAIN 13, 2026-11-22 about 06:35 JST)

Recorded on 98d1e1c after QC round 8's fixes (four helper branches: borrowing month, safety words, layout and wording polish, number gate should-fixes). Against 3831za, 63 screens differ. Checked by a script that compares every number on every differing screen (minus signs, U+2060 and a trailing .00 ignored) and then by reading every line left over after these rules:
- Month names are short everywhere ("Mar 2027", "Receipts, Nov 2026").
- Times read "6:00 PM", not "6:00 pm".
- An over amount reads "¥1,000 over", never "over ¥1,000" or with a minus.
- A line that holds any amount with cents writes every amount in it with cents ("₱3,800.00").
- Settings restore steps: "Tap Choose file and pick your backup file, then tap Load text twice. Or paste the backup text in the box above, then tap Load text twice."
- Settings Free to spend cap hint: "shown as the cap line on the Free to spend bar in Plan."
No number appeared, went away or changed. No other wording changed.
Next baseline: 3831zc (sort picks the newest).
