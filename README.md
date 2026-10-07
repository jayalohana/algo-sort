# 🕷 Spider-Sort: 3D Sorting Algorithm Visualizer

Spider-Man hangs upside down over a platform of numbered 3D blocks and webs
each sorting operation into place — lifts, shifts, pivots, heap sifts, count
boxes, and buckets. Built with **React + TypeScript + Three.js + React Three
Fiber** (Vite).

## Setup

Requirements: **Node.js 18+** and npm.

```bash
cd sorting-algorithms
npm install
npm run dev      # local dev server (default http://localhost:5173)
npm test         # correctness + playback-boundary tests (vitest)
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build locally
```

No external model URLs or network fonts are used: Spider-Man is built from
local Three.js geometry and block numbers are canvas textures, so the app
works offline once dependencies are installed.

## How it works

```
src/
  sorting/
    types.ts       Typed operations (SortOp) + pure replay() engine
    algorithms.ts  11 generators: each emits a sequence of typed ops
    metadata.ts    Names, blurbs, complexities, pseudocode
  playback/
    usePlayback.ts Controller: applies ops one boundary at a time
                   (play / pause / next / reset, speed, cancel-safe timers)
  scene/
    SortingScene.tsx  Composes blocks, overlays, camera, lights
    SpiderMan.tsx     Local-geometry Spidey (mask, white eyes, red/blue suit)
    Blocks.tsx        Blocks, platform, beams, heap links, count boxes,
                      bucket trays, merge area, range brackets
    Label.tsx         Canvas-texture labels (always readable, no webfonts)
    BackgroundWebs.tsx Faint backdrop web
    layout.ts         Shared slot math (blocks, webs, Spidey agree)
  ui/
    Controls.tsx      Algorithm picker, transport, speed, custom input,
                      reduced-motion toggle
    LearningPanel.tsx Explanation, complexities, live operation,
                      comparison/write counts, pseudocode highlight, color key
```

**Architecture rules enforced:**

- Sorting logic only produces `SortOp[]` — it never touches the scene.
- The playback controller (`replay` + `usePlayback`) is the only thing that
  applies operations, one op per pause/next-step boundary.
- Blocks keep stable identities: every element has an `id` that generators
  carry through swaps/shifts/overwrites, and no algorithm swaps two
  equal-valued blocks.
- Reset / algorithm / input changes bump a generation token and clear timers,
  so no pending animation work survives.

## Per-algorithm animation

| Algorithm | What you see |
|---|---|
| Bubble / Selection / Cocktail | Neighbor compares (amber) and web-swaps (red arc lift) |
| Insertion / Shell | Key block lifted out, neighbors shifted, key dropped in; shell shows `gap N` and leaps by gap |
| Merge | Gold `MERGE` bracket splits groups with a red divider; winners drop from the glowing merge area |
| Quick | Red pivot with gold ring, `PARTITION` bracket, small-side moves, pivot drop + lock |
| Heap | Cyan parent→child links, `HEAP` bracket that shrinks, top lifted to the sorted end |
| Counting | Glowing count boxes tally up, then slots are written back from the boxes |
| Radix | 10 buckets per digit pass (`ONES`/`TENS`), distribute then collect |
| Bucket | Value buckets fill, each bucket is sorted, then tipped back in order |

## Controls & accessibility

- Play / Pause / Next Step / Reset / Shuffle, animation speed (0.25×–3×).
- Custom input: 3–16 integers, 0–99, with clear error messages.
- Keyboard: `Space` play/pause, `→` next step, `R` reset (ignored while typing).
- All buttons have accessible labels; live operation text uses `aria-live`.
- Reduced-motion toggle (also honors `prefers-reduced-motion`): steps apply
  instantly without swaying or gliding.
- Responsive layout for desktop and mobile; a useful message is shown if
  WebGL cannot start.

## Tests

`npm test` runs 115 checks: every algorithm on sorted, reversed, random,
duplicate, all-equal, tiny, and 16-element inputs (final order, id
permutation, no equal-value swaps, prefix/replay boundary consistency), plus
input-parser and speed-scaling tests.
