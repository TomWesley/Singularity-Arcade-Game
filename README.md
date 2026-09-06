# Singularity

Pilot a craft through the gravity wells of real black holes. The cursor is where
you want to be; the field decides how much say you get.

**▶ Play it live: [wesleyarcade.com/singularity](https://wesleyarcade.com/singularity/)**

Originally written in 2019 in p5.js. Rebuilt in 2026 on the
[Arcade Graphics Engine](https://github.com/TomWesley/ArcadeGraphicsEngineAndLibrary)
with a real gravitational model — same premise, nothing else shared.

## The physics

The game does not invent a gravity number. A level authors a black hole by one
value, its **mass in solar masses**, and every other property is derived from it
using the actual constants:

| Quantity | Formula | 10 M☉ |
|---|---|---|
| Schwarzschild radius | `r_s = 2GM/c²` | 29.5 km |
| Photon sphere | `1.5 r_s` | where light orbits |
| Innermost stable circular orbit | `3 r_s` | no stable orbit inside |

Gravity uses the **Paczyński–Wiita potential**, the standard pseudo-Newtonian
approximation from accretion astrophysics:

```
Φ(r) = −GM / (r − r_s)          a(r) = GM / (r − r_s)²
```

It costs one subtraction over Newton and buys the three things that make a black
hole a black hole: the potential diverges at the horizon, so it is a true point
of no return rather than somewhere a big enough engine can escape; it reproduces
the ISCO at exactly `3 r_s`; and it puts the marginally bound orbit at `4 r_s`,
as in the exact solution. Far away, `r_s` becomes negligible and it relaxes into
Newtonian `1/r²`.

> Paczyński, B. & Wiita, P. J. (1980), *Thick accretion disks and supercritical
> luminosities*, Astronomy & Astrophysics **88**, 23.

Two consequences worth knowing before you fly:

- **Craft mass does not affect how you fall.** Gravitational acceleration is
  independent of the mass being accelerated, so every hull follows the same arc.
  Mass divides *thrust* instead (`a = F/m`), so a heavy craft shares the light
  one's fate but has less authority to argue with it.
- **Small black holes are far more dangerous than large ones.** Surface gravity
  goes as `1/r_s`, so a 3 M☉ hole 12 px across has a fiercer well than a 22 M☉
  one at 88 px. The big ones are terrain; the small ones are ambushes.

Every ring drawn around a hole is one of these radii, not decoration. A pilot who
learns to read them is learning orbital mechanics.

### Integration

Fixed 120 Hz timestep with an accumulator, integrated by semi-implicit
(symplectic) Euler — velocity first, then position from the *new* velocity.
Explicit Euler pumps energy into an orbit and makes it spiral outward
artificially; the symplectic form conserves it well enough to hold a clean arc.
The renderer interpolates between steps, so motion is smooth on any display and
the simulation runs identically at 60 Hz and 144 Hz.

### Rendering

The board holds a 60 Hz budget by staying spare. Each black hole's static
geometry -- horizon, photon sphere, ISCO -- is rendered once into an offscreen
canvas and blitted; only the accretion disk, a single stroked ellipse, is drawn
live. Glow is expensive and therefore rationed: about 27 shadow-blurred draws
per frame out of ~900 canvas calls total.

An earlier pass drew each disk as 9 bands of 46 blurred arc segments, which came
to 1,656 shadowed strokes a frame and ran at 5 fps. It was also simply worse to
look at. The reference is the Jupiter sequence in *2001*: a few monumental shapes
on near-total black, hard edges, no texture standing in for composition.

## The craft

Gravity treats all four identically. What differs is thrust authority
(`thrust/mass`), top speed, and damping.

| Craft | thrust/mass | max vel | damping | Feel |
|---|---|---|---|---|
| Superbug | 2600 | 520 | 0.90 | Balanced, forgiving |
| Psych Bike | 3065 | 610 | 0.62 | Light and twitchy, quickest to turn |
| The Compiler | 2471 | 560 | 1.05 | Heavy frame, huge engine, commits to a line |
| Voidwalker | 2320 | 470 | 1.55 | Heavily damped, goes exactly where aimed |

## Running it

```bash
npm start                  # http://localhost:3000 — zero dependencies
npm run physics            # geometry table for a range of black hole masses
npm run simulate           # autopilot balance report for levels/level1.json
node tools/smoke.mjs       # headless wiring + physics assertions
npm run vendor:engine      # re-copy the graphics engine from the sibling checkout
```

`tools/simulate.mjs` flies the **real** `Game` class — same physics, same
integrator, same collision rules — under an autopilot sweeping hundreds of
routes. It reports the share that survive per craft, which is what catches a
level that is unfair, trivial, or completable by only one hull.

## Layout

```
public/
  index.html  styles.css  favicon.svg
  src/
    core/      viewport (letterboxing), fixed-timestep loop, input, PRNG
    game/      constants, physics, entities, crafts, level, game state
    render/    theme, starfield, black holes, asteroids, craft, HUD, screens
  vendor/arcade-graphics-engine/    vendored ESM build, see npm run vendor:engine
levels/        level1.json, plus the 2019 levels under archive/
tools/         physics report, balance simulator, smoke test
```

Native ES modules, canvas 2D, no bundler and no build step — the deploy copies
these files verbatim. There are no runtime dependencies.

## Deployment & Firebase Architecture

This repo owns the game and its data. It does **not** own its own hosting.

| Concern | Where it lives | Deployed by |
| --- | --- | --- |
| Hosting (`wesleyarcade.com/singularity/`) | Firebase project `singularity-c216f` | `TomWesley/WesleyArcadeSite` CI |
| Auth + Firestore (leaderboard) | Firebase project `singularitythegame` | this repo |

The arcade's hub repo (`WesleyArcadeSite`) checks this repo out during its
GitHub Actions deploy, copies `public/` and `levels/` into `dist/singularity/`,
and publishes the whole site. Pushing to `main` here fires a
`repository_dispatch` at the hub, which triggers that deploy.

**The `firebase.json` in this repo deliberately has no `hosting` block.** That
is not an oversight. A Firebase custom domain maps to exactly one Hosting site,
so every arcade game must be served from the hub's site -- but Firestore rules
are per-project, so each game keeps its own. Adding a `hosting` block here, or
pointing `.firebaserc` at `singularity-c216f`, would put this game's rules back
in the shared project where an unrelated deploy can overwrite them.

```bash
# Safe from this repo -- only ever touches the singularitythegame project.
firebase deploy --only firestore:rules,firestore:indexes

# Local emulators for auth + firestore.
firebase emulators:start
```

### Leaderboard data model

- `users/{uid}` -- public profile (`displayName`, `photoURL`). Owner-writable.
- `scores/{scoreId}` -- one document per completed run (`uid`, `displayName`,
  `level`, `timeMs`, `ship`). Publicly readable, append-only: no updates or
  deletes, by anyone.

Scores are written straight from the client, so `firestore.rules` can validate
their *shape* but not their *authenticity* -- a determined player can post a
fabricated time. Closing that requires a Cloud Function, which requires the
Blaze plan. Noted as a known tradeoff rather than an oversight.


## Version History

- **2026**: Full rebuild — Arcade Graphics Engine, Paczyński–Wiita gravity,
  fixed-timestep symplectic integration, p5.js removed
- **2025**: Responsive refactor, JSON levels
- **2019–2024**: Original development

---

**Copyright © 2019 Tom Wesley**

*This original novelty arcade game allows users to pilot a spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.*
