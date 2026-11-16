# The Burrow pixel art guide

One artist, one hand. Every picture in this app (a creature, a burrow, a whole world, an icon) is drawn by the same rules so that it
looks like one person made it on purpose. Read this before drawing anything. The checks at the end are run on every picture.

## 0. The nature rule (first, above everything)

Nothing in this app is an icon. Everything is something that grew, fell, or was dug. Draw the way nature is, with its inconsistencies.

- **No two alike.** Every burrow, tree, clump and stone is its own: a different lean, height, width, colour. Each burrow gets a seed from its id, so the mound, the plants and the stones differ.
- **Irregular on purpose.** No half-disc hills, no centred perfect doors, no even rows, no flat outline around scenery. A bank leans one way. A door is a little lopsided. A root crosses it.
- **Growth has reasons.** Moss on the damp, shaded side. Ferns at the foot of things. Reeds at water. Mushrooms on logs and in the lee of stones. Grass thin on slopes, thick in hollows. Roots where the soil is thin.
- **Layers, like a real floor.** Soil, moss, tall grass, then small life. Tall grass comes in several species (thin tufts, broad blades, reeds with seed heads, ferns) and several greens (cool, warm, deep), with clearings where small things live.
- **Straight trunks.** Trees stand straight with only a slight lean. No twisting, swaying or crooked trunks. (Mako's rule.)
- **Never a floating sticker.** Every picture sits in its world: on its ground, in its light, with a contact shadow, with grass over its feet.
- **Small surprises for the ones who look.** A stump with a lit door, a frog that blinks on its stone, a snail on the log, eyes blinking in the grass. They appear now and then, never on a loop you can set a watch by.
- **Icons stay simple.** A small picture (home burrow mound, favicon) is a few big shapes in flat tones, not a scene: one mound, one door, one light, one clump of grass. Detail belongs to the big pictures. Edges are tone against tone, never a black ring: no black outlines on living things (the dragon is shaded dark green, not outlined).
- **Test:** cover the label. If it still looks like an app icon, it is wrong. If it looks like a place, it is right.

## 0a. The world rule (never skip this one)

**Nothing is laid over the art.** Anything the person needs to see or use (a way back, a label, a sign, a direction) is painted INTO the world it stands in, in that world's own pixel grid, palette, light, ground and weather. The page may add only an invisible hit area and an aria label. Mako, twice: "you just superimpose it on top and be lazy with the work. I told you to incorporate it fully into the graphic."

- **No sticker, no pill, no badge, no overlay canvas** for anything that belongs to a place. The way back to the burrow is a wooden signpost standing on a road in each world (`BUR.drawRoad`, `BUR.drawSign`), not a button drawn on top. (The small "Home" pill is a control, not a picture; it stays out of the art.)
- **Same world, same light.** Rainy world: night palette, wet planks, rain drips, lamplight on the board. Forest: moss and grass over the foot of the post, the time-of-day tint over the board and road.
- **Depth.** It stands on the ground with a contact shadow, grass grows over its foot, and creatures in front of it are drawn in front of it (draw it as a sprite in the same layer, at the right depth, never in a separate top layer).
- **Fit every screen.** Phone and desktop each get their own placement and board size, so it never overlaps the burrow, the creatures or the floating buttons.
- **Check before showing:** screenshot it at desktop and phone, zoom 3x. If you can imagine peeling it off like a sticker, it is wrong. `artcheck.sh` fails the build if `.bv-sign` shows any background, border or image, or if an overlay canvas for it exists.

## 1. Who draws these

A patient hand-painter who loves small, warm, safe places. The work says: *it is rough out there, and here is a lit door.*

- **Warm light in cool dark.** Worlds are cool blue and green. Warmth (amber, gold) lives only where someone is home: a door, a window,
  a lantern, a coin. Warmth is the reward, so it is never spent on anything else.
- **Round, chunky, soft.** Shapes are ellipses and arcs. No sharp spikes, no thin hairlines on characters. Things look like they could
  be held.
- **Safe, not sad.** Rain, night and storms are shown from inside shelter. Nothing is ever frightening.
- **A little more to find.** Every picture has one small thing you only notice on the second look (the frog's music note, the owl that
  turns its eyes to the door, a bluebell glowing in the ivy).
- **Made by hand.** Symmetry is broken on purpose. Details are placed in small groups, not sprinkled evenly.

Mako's taste, from his own words (the final say on everything):
likes: dark rich trunk colours; lush, deep foliage; depth and shading; simple but rich; round corners; cute; healthy, growing, safe;
sparkle and magic; a world that feels alive and reacts; art that is the main thing on a screen; small things that read at 16 px.
dislikes: bright, fake-looking greens; too complex when small; too many flowers (keep them low, never in leaves); anything clickable
that does nothing useful; things in front that should be behind; the same world on every screen; mixed styles; "a little graphic" where
an animated character was wanted.

## 2. The grid (one pixel size, no exceptions)

- Every picture lives on one **art pixel**. On a screen one art pixel is `S` screen pixels, a whole number (`S = round(viewport height / 150)`,
  never less than 2, capped so the burrow fits the width).
- **Never mix pixel sizes in one scene.** No half-size rain, no 2x sprite beside a 1x one, no rotation or non-integer scaling, no blur.
  (Flagged mixels: none allowed.)
- Characters are drawn at their native size and flipped by whole pixels only. Squash and stretch moves whole rows and columns.
- UI icons (Home overview, favicon) use their own small grid shown at an integer scale. They are icons, not scenery.
- A scene's design size is about 240 x 150 art pixels on desktop and 130 x 260 on a phone. Compose for both. Ground line at 80% of the height.

## 3. Palette (74 colours, `pal.js`)

- Twelve ramps, dark to light: night, moss, teal, bark, stone, ember, gold, fur, ash, rose, violet, rain.
- **Every pixel is a palette colour.** A picture uses at most 3 ramps plus stone/night for shadow. A single sprite uses at most 24 colours.
- Hue shifts along a ramp: shadows lean blue or violet, lights lean warm yellow. That is what makes it look painted, not tinted.
- **No pure black, no pure white.** The darkest dark is `night[0]`. The brightest white is `ember[6]` or `ash[5]`. A glint is the lightest
  step of its own ramp.
- Translucent overlays are allowed for light and shadow only (warm tint, contact shadow, rain). Never for painting forms.
- Each world has one **signature accent** against its cool base. Rainy day: amber on blue.

## 4. Form and shading

- **Three tones plus a rim.** Every form gets shadow, base, light, and one thin rim or glint on the side facing the strongest light.
  Pick the three from one ramp, adjacent steps, so the form reads without outlines doing the work.
- **Selective outline.** Characters get a 1 px outline in the darkest step of their own ramp (never black). Scenery has no outline. Where
  a character meets light, the outline may lift one step. All characters in a scene follow this the same way.
- **One light model per scene.** Key light is the sky (moon: cool, from upper left). Practical lights (door, window, lantern) are warm and
  local. A character near a practical light gets a warm edge on the side that faces it and cool everywhere else.
- **Contact shadows.** Everything standing on the ground has a soft dark ellipse under it. No floating.
- **No pillow shading, no banding on purpose.** Light follows the form, not the outline.
- **Clean lines.** Curves use runs that step evenly (1-1-2-2-3, never 3-1-2). Remove doubles (two pixels stacked on a diagonal).
- **Minimum feature size on characters: 2 x 2 art pixels.** An eye is 2 x 3 with one white highlight pixel. If it cannot be read at
  the size it will be shown, enlarge it or remove it.

## 5. Light and glow (pixels, not blur)

- **No smooth gradients and no blurred glows on art.** A glow is stepped: 3 or 4 concentric rings, each one palette step apart, the
  outer ring dithered (checkerboard) into the background. (`PXK.halo`)
- Dither only with a 4 x 4 ordered (Bayer) pattern, only for skies, mist and glow edges. Never on a character. Never random noise.
- Sky gradients are made of ramp steps with ordered dithering between them.

## 6. Composition

- **One focal point per screen**, the brightest and warmest thing: the lit door. Everything else is quieter than it.
- **Frame it.** Dark trunks or leaves at the edges, a path that leads in, the horizon low.
- **Depth in four layers**: sky, far (hazy, cool), mid, near (darkest, framing). Each nearer layer is darker and more saturated at the edges.
- **Place, do not scatter.** Details go in groups of 1, 3 or 5, of different sizes, with empty space around them. Random even
  sprinkling is the clearest sign of a machine. Plant things where something would grow: against the base of a trunk, along a path, in the lee
  of a rock.
- Leave **rest areas** (flat, quiet) so the busy parts read.

## 7. Characters

- Head about 40 to 50% of the height. Eyes large, low on the face, spaced wide. One highlight pixel in each eye. A blush of 2 px.
- Silhouette first: the shape alone must say squirrel, owl, frog. Give each one a signature: squirrel = the big tail curl, owl = ear tufts and
  round face discs, frog = bulging eyes, mouse = big round ears, snail = glowing shell.
- Personality through one repeating action: the squirrel hops, the frog ribbits, the owl turns its eyes.

## 8. Animation

- Characters animate **stepped**, not smooth: about 10 to 14 poses a second. Pixel-snap positions every frame.
- Use anticipation (crouch before a jump), squash and stretch (whole rows), follow-through (the tail lags the body) and a held pose before a
  turn. A hop has take-off, peak and landing with a one-frame squash.
- Ambient loops use different lengths (prime-ish millisecond periods) so they never line up and feel mechanical. One shared "breath"
  every 10 to 15 seconds ties the world together.
- **Idle is zero.** Nothing draws unless a screen is open and visible. Reduced-motion turns loops down to a still or a slow loop.
- Weather scales with the story: the fuller the fund, the calmer the storm.

## 9. Meaning

Every graphic has a job in the money story. Ask before drawing: *what does this tell the person about their money, and how does it make
them feel?* Coins in the door equal the real percentage. Calm sky equals progress. A creature reacting equals an action was noticed.

## 10. What makes it look machine-made (avoid)

smooth blurred glows; even random sprinkles; perfect mirror symmetry; many colours with no ramp logic; the same detail density everywhere;
a gradient doing the work a shape should do; outlines of different weights in one scene; mixed pixel sizes; text-book "neon accent on black".

## 11. The process (every graphic, in order)

1. **Brief.** One sentence: feeling, job in the money story, where it appears. Mako's words if he gave any.
2. **Silhouette.** Tiny thumbnails (about 16 px). Pick the one that reads.
3. **Values first.** Block it in with 3 values only. It must read in greyscale and squinted.
4. **Palette.** Choose ramps from `pal.js`. Count them.
5. **Big shapes, then planes of light** (section 4).
6. **Details by hand**, in groups, each placed on purpose. Add one secret.
7. **Break symmetry.**
8. **Animate** the one signature action, then the ambient loops.
9. **Check.** Run `./artcheck.sh`. View at 1x, 2x and 4x, on desktop and phone sizes, day and night if both exist. Squint test.
10. **Show Mako.** Fix what he says, then log his words in section 1.

## 12. The checks (`./artcheck.sh`)

Fails the build of a picture if: a colour is off the palette (more than 0.04 in OKLab from any palette colour) for more than 5% of its
pixels; a sprite uses more than 24 colours; any canvas in a scene is not at the scene's pixel size; the world rule is broken (a visible background, border or image on `.bv-sign`, or a `paintSign` overlay); the art files contain a smooth
gradient or blur; a character is drawn without the shared outline pass. It prints a per-picture report. It cannot judge taste, so section 11
step 9 and 10 stay with a human.

## 13. Registry of pictures

| Picture | File | Grid | Ramps |
| --- | --- | --- | --- |
| Squirrel (3 looks) | squirrel.js | native 44 x 46 cell | fur or ash, rose, gold, bark |
| Rainy day burrow and world | burrow_rainy.js | 96 x 72 burrow, scene on S | night, moss, ember, bark, stone, teal, violet |
| Burrow mounds (Home, and burrow screens without their own look yet) | burrows.js (plain look) | 24 x 18 at 5x | moss, bark, gold, ember, one flower colour; one round hole where the coins pile |
| Signpost and road (every burrow screen) | burrows.js (paintSign) | 64 x 44 at 2x or 3x | bark, moss, stone, gold |
| Dragon | scene.js | 1x scene grid, about 30 px | moss, teal, ember, rose |
| Back-tree squirrels, meadow, stump, rabbit, hedgehog | scene.js | 1x scene grid | palette mixed toward the scene's fog |
| Forest scene (app background) | scene.js | scene grid | older palette, to be moved onto pal.js |
| Favicon | pwa/make_icons.py | 16 x 16 | moss, bark, gold, night |
