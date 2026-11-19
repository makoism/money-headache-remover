# The Burrow world (3D): the idea, as Mako set it on 2026-11-19

Status: part of the art step, the very last layer. Nothing is built for it until the base app works and Mako has used it with his own numbers. No session starts any of this without asking Mako first.

## The idea
One small, walkable, stylized 3D world inside the app: a little town (smaller than one Minecraft chunk, about the size of the tiny planet in Messenger by Abeto). Mako's references: Mistwood Cottage and Messenger by Abeto. Stylized and a bit weird, not realistic. CPU and GPU can be spent on style, within what a mid-range phone runs smoothly.

- One world, not one world per burrow. Every burrow lives in it.
- Everything the 2D app does can be done there: add money to a burrow, log receipts, pay day, take out, check the bank. Typing numbers opens a small 2D panel; walking and seeing is 3D.
- The 2D app stays the fast, honest view. The world is optional: "Enter the burrow" opens it.
- The creature is open: probably a squirrel, maybe something else. Decided with Mako.

## How it is built (so it can never disagree with the app)
- The world calls the same actions (`ACT`) and reads the same model as the 2D app. It does no money maths of its own. A test walks the world and checks its numbers match the 2D app.
- It loads only when entered (a separate file, a cute loading screen); the 2D app sleeps while the world is open and wakes when you leave. People who never enter pay nothing.
- It needs the ledger and real balances (step B1) and the pay day ritual (B2) first, because the piles must be real and pay day is the moment the world celebrates.

## Reuse, to save time (free and open only)
Three.js (MIT) and open character-controller and collision code (MIT); models from Kenney, KayKit and Quaternius (CC0), Poly Pizza (check each); Blender, Blockbench, MagicaVoxel to make the hero pieces; Kenney audio and CC0 Freesound for sound. CC0 first, CC-BY only with a credits file from day one, never non-commercial assets. Messenger and Mistwood Cottage are inspiration only: their code and art are not free to copy.

## Rough size (after v1 and steps B and C)
Walkable prototype 3 to 5 days; every action working about 1 week; making it Mako's own (look, creature, light, sound, pay day) 2 to 4 weeks in rounds with Mako; phones and QC about 1 week. About 4 to 7 weeks in all. The efficiency agent reviews the plan before it starts.
