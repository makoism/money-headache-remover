# QC round 4, build 38.31, art director (/tmp/qc_build/build.html)

The build fails the art check. The page dots on every burrow screen sit on top of the BACK HOME sign, and the three forest burrow worlds mix pixel sizes.

**My role:** my brief named no role, so I judged as qc-art-director. That was the only panel role nobody else had taken on this build. The /tmp/qc folders show data-safety, novice and wording claimed, plus north-star, numbers, money and layout-touch.

**Reading beyond my brief:** before choosing a role I read all of QC_ROLES.md, QC_AGENT.md and three .claude/agents files. That is more than the art brief allows. I read no plan, changelog or other reviewer's report.

**Report file:** writing /tmp/qc/art-unassigned/REPORT.md was refused (subagents may not write report files), so this reply is the only copy. My claim note, screenshots and scripts are in /tmp/qc/art-unassigned/.

verify.sh, last ten lines (/tmp/qc_build/verify.txt):
```
MISSING plan #9 $ 2027-01-03
MISSING plan #10 CHF 2027-06-10
MISSING plan #11 ¥ 2027-01-22
MISSING plan #12 ¥ 2027-01-22
MISSING plan #13 ¥ 2027-01-28
golden screens: 14 plans, 19 screens differ
FAIL the screens changed
(screens differ: every difference must be one you meant)

VERIFY OK
```
The file ends VERIFY OK, but "FAIL the screens changed" appears above it. Judging that is not my job.

`./artcheck.sh` ends "ART CHECK PASS". It checks the art source files, not the screens as they come together.

## BLOCKERS
1. **The page dots cover the BACK HOME sign.** On a burrow screen, the row of page dots ("Burrows" nav) sits on top of the sign.
   - 390x844, Home or move, Trip and Yearly cost: "BACK" is completely hidden and only "HOME" shows.
   - 430x932, Emergency fund: the top half of "BACK" is cut off.
   - 412x915 and 414x896: the dots overlap the sign by 31 to 32 px in every world (sign box 36,804 244x96; dots 112,791 188x44).

   This breaks the world rule ("Fit every screen... so it never overlaps the burrow, the creatures or the floating buttons"). Fix: give the dots their own place for each screen size, clear of the sign, and test widths from 360 to 430. Shots: shots/p390-world0.png to p390-world2.png, crops/p412-worlds-sheet.png, crops/sign-p430-Emergencyfund-burrow.png.
2. **The forest burrow worlds mix pixel sizes.** Home or move, Trip and Yearly cost show the forest at 5 css px per art pixel at 1300x900 (4 at 390x844). The mound and the sign on top of it are drawn at 6. This breaks "Never mix pixel sizes in one scene" (ART_GUIDE 2, "no exceptions"). The rainy Emergency fund world uses one size throughout. Fix: draw the mound and sign on the forest's grid. Shots: shots/d1300-world1.png, shots/p390-world1.png.

## CONFUSING
3. **Wisteria on Home > More, "Burrows" card.** A flower hangs 5 px after the heading, so it reads like a stray character: "Burrows ⸣". Another hangs 4 px from "Add a burrow" at 320, 390 and 412 wide. This breaks rule 00, "never close to words, buttons". Fix: keep the wisteria, but end each hanging stem at least 16 px from the heading and the button. crops/wisteria-zoom.png
4. **Vine on Plan > Month, "¥200,000 pay, by place".** The corner vine's top leaf is 8 px from "...about the" at 390 wide and 11 px at 320. This breaks the same rule. Fix: start the vine below the last line of text. crops/pm-vine-text.png
5. **Emergency fund at 45% on Home (390).** The gold is an upside-down triangle in the middle of the door with dark below it, so it reads as a funnel, not a pile. At 6% and 14% the gold lies on the floor, and the burrow screen shows a proper pile at 45%. Fix: fill from the floor up, widest at the bottom. crops/ef-mound-zoom.png
6. **The "Bills and basics" picture.** An orange house hangs from the top of a dark hole, and at phone size it reads as a bat or a face. This breaks "Never a floating sticker". Fix: stand the house on the gold or on the floor of the hole. crops/thismonth-pics-4x.png
7. **Receipts shows plan against spend only as text (visual first).** "Receipts, November 2026" (dollar plan, 390) shows plan against spent as a table of numbers, and "over $62.75" is red text. A bar or pile for each category that spills over would show it. The Home chest already does this well: it shows full, partly full, and empty with a mark.

## POLISH
8. **Home panels.** The "This month" and "Burrows" art panels (.hb-scene) use smooth CSS radial and linear gradients, and the mounds and chest float on them with no ground or contact shadow (ART_GUIDE 0 and 5).
9. **Burrows look alike.**
   - On Home, the mounds for Home or move, Trip and Yearly cost differ only by a flower pixel (ART_GUIDE 0, "No two alike").
   - The three forest burrow screens use the same world, the same mound and the same layout ("the same world on every screen").
10. **Mirrored fungus.** In the rainy world, the fungus sits at the same heights on the left and right trunks (390x844, y 362 and 500): mirror symmetry (ART_GUIDE 10).
11. **Lantern glows.** In the forest world at 1300x900, the lantern glows fade smoothly (2,248 tones in a 280 px square) instead of 3 or 4 stepped rings (ART_GUIDE 5).
12. **The "over" mark.** On the chest and on Bills and basics it is a pink checkered X that reads like a sparkle.
13. **Vine colour.** The vine greens (#3D8F68, #5DB98A, #A4E6BF) are minty next to the scene's deep greens. Check them against the moss ramp.

**Not covered:**
- Confetti: nothing was drawn when I added money, and I did not try a burrow reaching 100%.
- Squirrel: I did not see it on any screen I opened.
- Light theme: no finding.
- To change what is left in Free to spend, I logged spends by filling the field with a script.

## Waiting for Mako's full run (not failures)
- Q1: Home has no "they add up" line.
- Q4: Home's first screen is text. At 390x844 it shows the header, the tabs, "Your burrow" and the bank question, and the pictures only start at the bottom edge. This is my role's visual-first question, so I list it here instead of as a failure.
- Whether Check your bank should change the figure the plan starts from.
- Counting a card in the month it is paid.
- How short-month fixes should work across months.
- One word for "short".
- The borrowed row's percent beside places past 100.

Files are in /tmp/qc/art-unassigned/:
- CLAIM.txt
- shots/
- crops/
- scripts a1.js to a11.js

VERDICT: FAIL