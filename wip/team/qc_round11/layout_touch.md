# QC round 11, Layout and touch: PASS

Saved by MAIN 14 from the agent's reply (second run; the first was stopped). Build 675841b. Home, Receipts, Plan (Month, Burrows, All months), Settings at 320x640, 390x844, 1300x900, dark and Light: no sideways scroll, nothing off the right edge, no console errors, contrast fine, Ask and Help hidden in tour and burrow scene, keyboard and focus fine.

## Blockers
None.

## Confusing
1. Tap targets under 44px: Add a burrow, Date step chips "6 months", "1 year", "2 years", "No date" are 38px tall (320 and 390); Plan > All months rows are 42px tall at 320 only. Fix: min-height 44px.
2. Goal name maxlength 60 cuts mid-word with no warning ("...celebration abro" in the toast, tile and legend). Fix: a character count under Name, or stop at a word.
3. After "Finish later" at 390, focus lands on the Home tab with a ring that bulges outside the tab bar and stays. Fix: focus the heading (tabindex -1) or keep the ring inside the tab.

## Polish
1. Home legend at 320 with a long name: square, name and amount each on their own line; "(short)" drops alone.
2. Add a burrow at 320: main button wraps "Add a / burrow".
3. Settings Reset and setup 390: second-tap state is a three-line pill. Button "Tap again to start setup", explanation as text under it.
4. Ask panel: suggestion chip row cut at the edge with no fade.

## Open with Mako (noted)
3.2 bottom strip, 3.8 Plan at 320 dock and strip, 3.8 name columns at 320, 3.9 tour text, the vine near Sample numbers.
