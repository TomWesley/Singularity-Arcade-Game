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

Nothing marks where the pull becomes unwinnable. There used to be a ring at the
craft-specific escape radius, drawn in red as you neared it, and it was the wrong
kind of help — it turned a thing the player is meant to develop a feel for into a
boundary they could read off the screen. The aura falls off with the field, the
GRAV gauge climbs, and the craft starts refusing the cursor. Learning where that
adds up to "too close" is the game.

### The board's speed limit

Slingshots off a horizon could reach 18,000 px/s, which crosses the board in
three frames. Speed is now capped at 1,500, enforced the way relativity does it:
acceleration along the direction of travel is damped by `(1 - v²/c²)^(3/2)`
while acceleration across it is untouched, so a body approaches the limit
asymptotically instead of hitting a clamp. A hole can still whip a rock through
a hairpin at full speed; it just cannot keep adding speed.

That limit is the real `c`, converted — not a number picked to feel right. It
used to be a house rule: at the original time scale `c` worked out at 379 px per
game-second while the craft flew at 470–610, so the game was superluminal in its
own units. Lengthening the game-second to strengthen the field moved `c` with it
(gravity scales as `T²`, `c` as `T`), and it now lands at **928 px/s** — well above
every craft's top speed (0.51c–0.66c). Nothing on the board outruns light.

### Tuning the field without resizing the holes

Horizon radius is `r_s / METERS_PER_PIXEL` and has no time term; gravitational
acceleration carries a `T²`. So `SECONDS_PER_GAME_SECOND` is the one dial that
changes how hard the wells pull while every hole stays exactly the size it was.
It has been raised by `√6` from the original scale, so the field is six times
what it started at — a 22 M☉ hole's escape limit went from 137px to **209px**
with its horizon unchanged at 88px.

### Orbits

Asteroids can orbit, and some complete several revolutions. What they cannot do
is *fall into* orbit: a two-body gravitational encounter conserves specific
orbital energy, so anything arriving unbound leaves unbound. Capture needs a
third body or dissipation. About 41% of rocks spawn bound, and a level may seed
a few directly onto near-circular orbits around a hole that sits well inside the
board — `asteroids.orbiters` in the level JSON. Those are placed on an orbit,
not captured into one; everything after the placement is the same integration as
the rest of the field, free to precess, decay or be flung out.

A life opens on a clear board. Every rock is re-entered from off-screen at the
moment play begins, so the first wave arrives together rather than the player
inheriting whatever the last life left mid-flight. Because nothing spawns
on-screen, the wave takes about a second to fly in — that pause is the point,
not a side effect: it is the beat where a pilot picks a line before anything is
in the way. The field is also emptied while a wreck is playing out.

Asteroids enter only from above the top edge or below the bottom edge, always
off-screen. Nothing appears inside the board, and nothing arrives from the right,
where the gate is -- a rock entering there closes on a player who is looking the
other way at the moment they have committed to the run. `npm run spawns` enforces
both rules.

`npm run orbits` audits all of this: how many spawn bound, why rocks get
recycled, and how far round a hole they get first.

### Integration

Fixed 120 Hz timestep with an accumulator, integrated by semi-implicit
(symplectic) Euler — velocity first, then position from the *new* velocity.
Explicit Euler pumps energy into an orbit and makes it spiral outward
artificially; the symplectic form conserves it well enough to hold a clean arc.
The renderer interpolates between steps, so motion is smooth on any display and
the simulation runs identically at 60 Hz and 144 Hz.

### Rendering

The field is black and a black hole is an absence: a disc of true black with a
white aura hugging the rim to say where the edge is, and nothing else. All of
that geometry is static for a given mass, so each hole renders once into an
offscreen canvas and is blitted. Glow is expensive and therefore rationed --
roughly 27 shadow-blurred draws per frame out of ~900 canvas calls total.

Subtext is set in Share Tech Mono rather than the kit's Rajdhani `body` role: a
game running real Schwarzschild geometry should speak in a readout voice, and
sentence-case Rajdhani is the one thing in the type kit that reads as generic UI.

Canvas text does not trigger webfont loading the way DOM text does -- setting
`ctx.font` to a face the browser has not already fetched falls back silently,
with nothing to correct it later. Every weight the game draws with is requested
explicitly and awaited before the first frame.

Colour belongs to the craft. The four hulls keep their 2019 shapes and their
2019 palette exactly; only the rendering is new.

Asteroid tails are drawn from a recorded position history rather than
extrapolated along the velocity vector, so a rock whipping past a hole trails a
curve that matches the path it actually flew. Sampling at a fixed interval also
makes the tail's length proportional to speed for free.

Rocks are drawn in red only, ramped by speed from deep crimson at rest to hot
ember at the board's limit. One hue varying continuously reads as a temperature
map; two hues would read as categories.

Each rock is built as two rings -- an outer hull and an inner ring pulled toward
the middle -- triangulated into a rim band around a raised cap. That shoulder is
what gives a 15px shape the read of a solid with volume rather than a flat plate
with a gradient on it.

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

## Portrait and pause

The board is authored at 1280x720 and letterboxed, so in portrait it collapses to
an unplayable strip. Rather than pretend, the game stops and asks for a rotation.
Coming back to landscape does not resume on its own — a device that has just been
turned is usually still moving, and dropping a player into a live board
mid-rotation costs them a craft they never saw coming. They tap when ready.

Enter pauses and resumes on desktop. A portrait pause overrides a manual one, so
the rotate prompt is always what the player sees.

## Running it

```bash
npm start                  # http://localhost:3000 — zero dependencies
npm run physics            # geometry table for a range of black hole masses
npm run simulate           # autopilot balance report for levels/level1.json
npm run speeds             # asteroid speed distribution, for tuning the tails
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
tools/         physics report, balance simulator, speed sampler, smoke test
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
