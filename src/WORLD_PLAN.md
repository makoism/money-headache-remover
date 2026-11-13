# The Burrow: world plan (written 2026-11-13, resume from here)

The app is being renamed **The Burrow** (was "M.H.R.2000 / The Money Headache Remover 2000"). Rename user-visible strings (title, header, README, manifest, tests that assert them) in one pass, then deploy. Keep repo and wrangler names.

## Mako's standing rules
Accuracy and stability first, nobody loses data. Minimal wording, never em dashes, never "too AI". Don't ask small questions, keep going, never wait on him. Send small updates with images (SendUserFile) after each first draft. Use as many credits as needed. When a session limit stops work, schedule a resume (send_later) and carry on until finished. Run a full first-time-user walkthrough at the end and report honestly. Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01BFpKEXqe77cgznnsMgzp9R`. Repo is public: never commit keys.

## The approach (HD-2D for the browser)
Research result: Kingdom, Octopath, The Last Night, Eastward, Celeste, Graveyard Keeper, Hyper Light Drifter, Owlboy all pair crisp pixel art with a real rendering stack: depth layers + parallax, fog/haze, depth of field, dynamic coloured light, bloom, god rays, reflections, per-time-of-day grading, weather at several depths. Soft gradients across crisp pixels are fine (hi-bit). Detail falls off with distance.
Implemented: `vgfx.js` (drawing kit), `vista.js` (engine: stacked canvases moved by the compositor, pointer/tilt parallax, CSS sway, light canvas with screen blend, rays, CSS weather), `vcommon.js` (palettes, forest band, shared live pass), `vs_<realm>.js` (a realm = palette + layout + layers + lights + life).

## Realms (ids in realm.js)
1. `wood` Fairy Woods: done first pass (old cliff/cascade kept, now in layers). Spirit: the hollow Elder tree.
2. `crystal` Crystal Deep: dark greens, old relics and ruins, crystal, tall ethereal white humanoid fairies, floating. Spirit: the crystal heart.
3. `sea` The Sunken Dynasty: underwater ancient dynasty (pagoda halls, gates), magical intelligent jellyfish that talk in visible light. Spirit: the great old jelly.
4. `shire` The Green: pastoral beautiful hobbit-like land (not hobbit-hole houses). New creature: **Greenlings**, energy sprites made of shades of green; Avatar style: they feed plants and animals with energy, carry it from the Heart Tree through glowing roots (visible soil cutaway at the bottom), plants light up and grow where they touch. Spirit: the Heart Tree.
5. `chiba` Chiba, After: Ghibli-style overgrown ruins of Chiba, Japan (suspended monorail, danchi apartment blocks, konbini, vending machines, utility poles, flooded street, torii). The cats' world: many magical cats with weird physics (melting loaf, noodle cat on wires, ceiling cat, phasing through walls, stacks, orbiting kitten, detached shadow). Spirit: the Great Cat (a hill that breathes).
6. `dream` The Dreaming (rare, ~8%): floating islands, mirror sea, upward waterfalls, moon, doors, stairs; moon whale, paper cranes, clock owl, glass deer.

## Theme for all
Avatar: the world is alive, each realm has a Spirit that connects everything. Every creature is intelligent and communicates: visible links (NET) between creatures, plants, homes and the Spirit; messages (glyph bubbles) and pulses travelling along them; the whole world answers app actions (a coin, a streak, opening the scroll) with a wave from the Spirit.
Per realm: 7+ creatures (2+ magical), 8+ plant kinds, habitats, title card on open, ambient sound bed, a goal house that builds in 8 stages in the realm's own style, rare/dream realm.

## Also still to do
- Redo hands and orb art (they look goofy and not magical). Concept stays.
- Title card + enter animation each open; cave/waterfall onboarding transition.
- Tests (fast + full), usability walkthrough, version stamp, ARCHITECTURE.md, deploy, mirror, project doc.
- Phone composition, performance budget (guard idle CPU < 1.5%).
- Screenshot gallery: /tmp/v38/world_shots.js, par_shot.js, house_shot.js.
