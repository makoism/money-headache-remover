(QC round 14 art director, on the build staged from c45f8d0. Copied from the reviewer's reply.)

FAIL

The report is also saved at /tmp/qc/art-director/REPORT.md. Screenshots are in /tmp/qc/art/.

verify.txt, last ten lines:
```
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK
```
artcheck.sh: `ART CHECK PASS`.

BLOCKERS
1. Home, "Burrows" grid, 390x844 dpr 2 (/tmp/qc/art/hb_grid.png; pack 390-dollar-plan-1-home.png). Two different art styles sit in one picture. "Emergency fund", "Home or move", "Trip" and "Yearly cost" are green hooded mounds. "Education", "Investing" and "Giving" (and "Bills and basics" under "This month") are square brown crates with an oval hole, no moss and no flower. The four mounds share one mirror-symmetric silhouette and differ only by one flower pixel. The crates are one shape with a different top marker. None of them stands on ground, has a contact shadow or has grass over its foot. This breaks ART_GUIDE 0 ("No two alike", "Never a floating sticker", "cover the label: if it still looks like an app icon, it is wrong"), 13 (plain mound = "moss, bark, gold, ember, one flower colour") and 1 ("mixed styles"). Fix: draw all seven in the one mound family, seeded by id, on a strip of ground with a shadow.

CONFUSING
2. Every tab, phone 390x844 and 412x915 (/tmp/qc/art/r1_home.png, /tmp/qc/art/r2_home600.png). A solid 70 px slab (`.help-row::before`, rgb(6,19,13), fixed, full width) covers the bottom of the screen and holds only the "?" button. It hides the forest, covers the art on Home (the "¥110,000" line under "Bills and basics" only shows after scrolling) and clips text ("this week yet." under the Burrows grid). Replacement: drop the slab and let the "?" float over the world, as "Ask" and "Help" already do on desktop.
3. The "?" button (near-white ring, rgb(233,243,238)) is the brightest thing on every phone screen. That breaks ART_GUIDE 6 ("One focal point per screen, the brightest and warmest thing: the lit door"). Replacement: a moss-toned ring.
4. Plan, "Burrows" tab, 390 (/tmp/qc/art/g1.png). Each goal is a coloured dot plus a bar ("$150 of $1,200 by the end of Nov"). The burrow picture appears on Home but not here. Visual first: show the same mound with its coin pile above each bar. No wisteria shows on this card either, although ART_GUIDE 00 says "The purple wisteria on Goals stays as it is".

POLISH
5. Home burrows: "Giving ¥10,000" shows the same width of coin pile as "Education ¥20,000" and "Investing ¥20,000" (ART_GUIDE 9, coins must mean the amount).
6. Mixed pixel sizes on one screen. On the phone the scene is 4x (98x211 drawn at 392x844), the card vines are 3x (120x18 drawn at 360x54) and the mounds are 5x. On the desktop (1300x900) the scene is 5x and the vines 3x. On the burrow screen the `bv-clouds` layer sits at x = -7.77 px, off the 4x grid of the other layers (ART_GUIDE 2).
7. The card vines (Home "Your burrow", Receipts) are pale mint, the same tone as the app's buttons. They read as UI colour, not deep foliage. Mako dislikes "bright, fake-looking greens". Use the deeper moss steps.
8. Desktop forest (/tmp/qc/art/d1_lantern.png): the lantern and firefly halos are smooth falloffs at art-pixel size, not 3 or 4 stepped rings with a Bayer edge. artcheck reports `sky 589 colours, 93.9% within palette`. That is 6.1% off the palette, over the 5% limit in ART_GUIDE 12, but the tool still prints PASS. The guide or the tool should name the exemption.
9. The "This month" and "Burrows" picture cards use a smooth teal-to-green CSS gradient behind pixel art. In light mode (412-panel-51-light-home.png) the "This month" card stays a dark slab on a light page.
