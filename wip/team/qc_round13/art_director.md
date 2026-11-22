FAIL

verify.txt (last ten lines):
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zf.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

BLOCKERS
1. Home, Burrows card, 1280x800 and 390x844 (/tmp/qc/art/d1_home_bottom.png, m1_home_2300.png): the coin piles do not match the money. "Education ¥20,000", "Investing ¥20,000" and "Giving ¥10,000" all show the same one-row gold bar. "Home or move ¥5,700, 6% full", "Trip ¥2,500, 6% full" and "Yearly cost ¥2,900, 14% full" show the same thin line. ART_GUIDE 9: "Coins in the door equal the real percentage." Fix: pile height scales with the amount.
2. Every Home view at 390x844 (m1_home_500.png, m1_home_2300.png): `.help-row::before` paints a solid 70 px band, rgb(6,19,13), fixed at the bottom of the screen, holding only the "?" button. It slices cards mid-line and, at the page end, hides the scene's ground and lit burrow. Breaks the world rule. Fix: drop the slab; let the "?" float alone.

CONFUSING
3. Home, Burrows card: two drawing styles side by side. Goals are grassy hooded mounds; "Education", "Investing", "Giving" (and "Bills and basics" in This month) are flat brown rectangular frames around a near-black hole, no grass, no ground. None of the seven has ground, grass over the foot or a contact shadow; they float on a smooth teal gradient card (ART_GUIDE 0 "Never a floating sticker"; 1 "mixed styles"). Fix: one mound family on shared ground with contact shadows.
4. The four goal mounds at 1280 are one silhouette copied four times. ART_GUIDE 0: "No two alike... Each burrow gets a seed from its id." Fix: seed lean, width and door offset per burrow.
5. This month, "Bills and basics" picture (390x844, m1_home_500.png): an orange crown shape over a gold cone in a brown frame. It does not read as bills or a place. Fix: e.g. a burrow with paper notes pinned at the door.
6. Plan > Burrows tab (390-first-open-4-plan-goals.png): "Home or move", "Trip", "Yearly cost", "Emergency fund" are coloured dots and flat bars only. Visual first: show each row's burrow filling up.
7. Burrow screen, 412 (412-panel-41-burrow-screen.png): the "Emergency fund ... 26% full" card and the "o ●" pager pill sit on top of the sky; fullness is a flat UI bar, not the burrow. Fix: let the door pile carry the 26%.

POLISH
8. Burrow screen: the warm glow is a checkerboard dither over the whole mound, door frame and path, so the hill reads murky (c_bscreen_bot.png). ART_GUIDE 5: dither only on the outer ring of a glow.
9. Card vines (`canvas.gv`) carry `filter: drop-shadow(rgba(0,0,0,0.4) 0 2px 1.5px)`: a blurred shadow on pixel art. And `body::before` lays a smooth radial green glow over the scene. ART_GUIDE 5: no blurred glows, no smooth gradients on art.
10. Home "Burrows" wisteria (390x844 after about 6 s, c_dark_wist.png): it hangs as a straight run from mid-top, not from a corner, and its lowest flowers sit about 10 px from the "Burrows" heading and the "planned" chip. Keep it (Mako's note) but move it clear of the words.
11. Welcome, 390x844 (m0_welcome.png): the scene is dimmed almost to black under "Welcome"; the first screen shows no place.
12. artcheck.sh prints "sky 589 colours ... 93.9%" within palette (6.1% off) and still says "ART CHECK PASS"; ART_GUIDE 12 sets the fail line at 5%. Exempt the sky in the guide or tighten the check.
Screenshots and scripts: /tmp/qc/art/
