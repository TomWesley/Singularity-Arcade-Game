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

Nothing marks where the pull becomes unwinnable, and nothing measures it either.
There used to be a ring at the craft-specific escape radius drawn in red as you
neared it, and a GRAV bar in the corner reading the field strength. Both were the
wrong kind of help: one turned a thing the player is meant to develop a feel for
into a boundary they could read off the screen, the other into a number.

The HUD is down to two things: a row of the ship you are flying in the bottom
left, the way an arcade cabinet has always shown lives, and the capture banner.
What is left has to be interpreted. The aura falls off with the field, and the
craft starts going soft on the cursor as thrust loses to the pull — that last one
is the real teacher, since you feel the steering give before anything else tells
you. The only explicit signal is the capture banner, and it fires once you are
already past saving, so it narrates rather than warns.

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

### Stars

A third obstacle: same gravity law and the same `mu` as a black hole of equal
mass, because gravity does not care what the mass is made of. What differs is
that a star has a *surface*, so the field never gets the room to climb — you are
stopped at the photosphere, where `1/r²` is still mild. A 22 M☉ black hole lets
you to within 88px of its centre; a 14 M☉ red giant stops you at 61px, where the
pull is about two thousand times gentler.

There is no horizon term in a star's gravity. Paczyński–Wiita corrects Newton
near an event horizon and a star has none, so the plain inverse square is the
right law there.

Stellar density falls out for free: a 2.4 M☉ white dwarf at 16px is **fiercer at
its surface than a 14 M☉ red giant at 61px**, despite carrying a sixth of the
mass. Small and dense beats large and diffuse, exactly as it does in the sky.

One honest compromise: stellar radii are not to scale and cannot be. The length
scale is pinned by black hole horizons at 4px per solar mass, which puts the
Sun's photosphere around 940,000px across. A board cannot show a 30km horizon and
a 700,000km surface at once, so a star's radius is authored. Its mass — and
therefore its pull — stays real.

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

The starfield follows a power law: most stars sit near the threshold of
visibility and a few carry the field, which is most of what makes a scatter of
dots read as sky. Colour is white with only a whisper of warm or cool on a
minority — real stellar colours are far less saturated than they are usually
drawn. Each star twinkles on its own phase, faint ones shimmering more than
bright ones, and the brightest carry a faint diffraction cross. Positions round
to whole pixels at draw time, because a 1px dot on a half-pixel boundary
antialiases across two columns and turns to mush.

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

Gravity treats all four identically — acceleration does not depend on the mass
being accelerated. What differs is three axes, and each hull is strong on some
and pays for it on the others:

| Craft | hull | acceleration | top speed | fraction of c | 0→top |
|---|---|---|---|---|---|
| Superbug | 10.0 | 3880 | 852 | 0.92c | 0.22s |
| Psych Bike | 7.9 | 3710 | 882 | 0.95c | 0.24s |
| The Compiler | 8.3 | 3943 | 788 | 0.85c | 0.20s |
| Voidwalker | 10.5 | 5077 | 776 | 0.84c | 0.15s |

Top speeds now run at 0.84c–0.95c, and that ceiling is real rather than chosen.
`integrate` holds everything to `c`, so a hull asking for more than 928 px/s
simply pins there — and if two hulls both ask for more, their top speeds become
identical and the whole axis collapses. `c` cannot be raised independently
either: horizon size fixes `METERS_PER_PIXEL`, field strength fixes
`SECONDS_PER_GAME_SECOND`, and `c = c_SI · T / MPP` falls out of the two. The
only way past this wall is to strengthen the field, since `c` scales as `T` while
gravity scales as `T²` — 30% more speed would cost 69% more gravity.

**Every hull draws at the same overall size** — 2.7% spread, checked by
`npm run metrics`. The hitbox difference comes entirely from how much of that
size each silhouette actually fills, measured by rasterising the art and counting
lit pixels: the Voidwalker's plate cluster fills **78%** of its box, the
Compiler's thin swept wings only **43%**. Two craft the same size on screen, one
a third easier to hit.

That measurement has to be a rasteriser. An earlier Node-side version tracked
path coordinates through a stub context and was wrong in a way that mattered — a
Bézier's control points sit well outside the curve they describe, so the
curve-heavy Compiler measured 63px against a true 35.

**Top speed and acceleration are separate traits**, and the roster is built on
the difference. The Psych Bike has the highest ceiling and the weakest engine, so
it takes 0.32s to get there; the Compiler reaches its lower ceiling in 0.12s. One
wins an open sprint, the other wins anywhere that demands changing direction in a
hurry. Collapsing both into a single "speed" number would hide the whole trade.

**Mass is a fourth axis, and not a restatement of acceleration.** Gravitational
acceleration does not depend on the mass being accelerated, so a heavy hull does
not fall faster — the equivalence principle is load-bearing here. What mass does
is govern how well velocity *sticks*: drag is a force, and a force slows a heavy
body less, so once a well has given a heavy craft speed it sheds that speed
slowly. The pull follows it out. That is independent of engine authority — the
Compiler is heavy *and* powerful, the Psych Bike light *and* weak — so knowing
one tells you nothing about the other.

Ranges are deliberately asymmetric: top speed spans 13% across the roster while
acceleration spans 149%. In a reach-the-gate game top speed is the stronger lever
— less time on the board is less exposure — so a wide spread there overwhelms
everything else. The measured proof is in the matrix: at a 470–700 speed spread
the averages diverged by 11.3 points and two hulls never won anything.

`hull` is the craft's extent in design pixels, measured from the art with
`npm run bounds` rather than picked. It sets wall clearance, and asteroids strike
within half of it — these silhouettes are open frames rather than solid discs, so
a full-extent hitbox would punish near-misses through gaps you can see straight
through.

### Balancing against levels that do not exist yet

Tuning the roster against level 1 overfits it: there, holes outkill debris about
three to one, so hitbox barely registers and whichever hull dodges best simply
wins. `npm run balance` runs the roster across five archetypes instead — a
channel gauntlet, a sixty-rock debris storm, a three-body system, an open sprint,
and a warren of small fierce wells.

The target is not equal survival. It is that **no hull leads the average and
every hull leads somewhere**: currently 1.5 points of spread across the four
averages, with all four topping at least one archetype. A roster where the right
answer depends on the level is a roster worth choosing from.

One thing that harness needs to be honest: its autopilot has to *attempt*
escapes. A pilot that only flies waypoints never converts thrust into survival,
so the matrix just ranks hitboxes and no high-thrust hull can ever win. When the
field starts beating the engine it now turns radially outward — which is what a
human does, and without it the measurement is not of the game people play.

## The cursor is a throttle, not a destination

The mouse is where the craft wants to go, but how far it sits from the hull also
decides how much engine is available, and inside a dead zone of about two hull
radii the engine is simply off.

That second half exists because without it the craft could hover anywhere.
`steer()` is arrival steering: it asks for a desired *velocity*, and with the
cursor on the hull that desire is zero -- so the correction becomes
`(0 - v) * responsiveness`, which is full braking at maximum power, and it
cancels gravity exactly as happily as it cancels anything else. Parking the
mouse did not cut the engine, it commanded a hover. The field only won inside
`escapeLimit()`, a ring about ten pixels wider than the hole itself, and the
rest of the board was gravitationally inert.

The throttle *ramps* rather than only switching off inside the dead zone,
because a bare dead zone is trivially gamed: park the cursor one pixel outside
it and the full braking term comes back. Measured, with the ramp in place:

```
craft           thrust/mass   hands off   small nudge   pulling away
Superbug           2771          712px        224px          84px
Psych Bike         2644          632px        228px          84px
The Compiler       2816          804px        224px          84px
Voidwalker         3626          756px        200px          76px
```

Each column is the radius inside which that input still loses the craft. Doing
nothing is fatal from most of the board; a twitch of the cursor is not enough to
save you inside ~220px; committing fully buys you back everything outside ~84px.
The gap between the first two is what closes the hover. The gap between the last
two is the room to notice the mistake and fly out of it. `npm run authority`
prints this for any hole mass.

Note what mass does and does not do here. Gravitational acceleration does not
depend on the mass being accelerated, so a heavy hull does not fall faster --
see `gravityAt()`. Making the craft heavier makes them *more susceptible* only
by dividing thrust: less authority to argue with a well, and a slower shed of
the velocity the well has already given them. That is the whole mechanism, and
it is why the masses went up 40% rather than gravity going up.

## Levels

`levels/manifest.json` sets the order and the intended length of the campaign:

```json
{ "target": 15, "order": ["level1"] }
```

An explicit manifest rather than scanning for `level1..levelN` — the order is a
design decision, and a run of files on disk cannot express "this one comes third"
without renaming everything after it. `target` is the campaign's intended length,
so the clear card can say *1 of 15* before all fifteen exist.

Lives and craft choice carry across levels; only `restart()` puts you back at the
beginning. Clearing the last level in `order` ends the run rather than trying to
load the next one.

Adding a level is two steps: drop the JSON in `levels/`, add its id to `order`.
The five archetypes in `npm run balance` are already valid level specs.

### Orbiting stars and holes

Any attractor can be put in orbit around any other. A level authors the *shape*
of the orbit and nothing else:

```json
{
  "kind": "red-giant", "solarMasses": 1.8, "radius": 0.069,
  "orbit": {
    "host": 0,            // index into blackHoles ++ stars, in file order
    "apoapsis": 0.424,    // x DESIGN_HEIGHT -- furthest from the host
    "periapsis": 0.278,   // x DESIGN_HEIGHT -- closest approach
    "argument": 0.87,     // which way the long axis points, in turns
    "direction": -1,      // +1 anticlockwise, -1 clockwise
    "lead": 2.4           // seconds to run forward before the level opens
  }
}
```

There is no period, because a period is not a free parameter. `apoapsisSpeed()`
solves the two conserved quantities of the Paczynski-Wiita potential for the one
velocity that closes an ellipse between those radii, and how long a lap takes
then falls out of Kepler's third law — which is why the inner bodies on level 1
are visibly quicker than the outer ones without anything saying so.

Seeded, the body is **integrated, not animated**. It falls through its host's
field on the same symplectic step as the asteroids and the craft, so the ellipse
is a consequence of the field rather than a curve traced by a parameter. Three
things follow from that, and all three took finding:

- **The orbits precess.** Only an exact inverse square closes an orbit, and
  Paczynski-Wiita is not one, so the long axis turns a few degrees every pass —
  the pseudo-Newtonian stand-in for the relativistic perihelion advance. It is
  real, not integrator error: hold the step and it converges (2.897 deg/lap at
  1/120, 2.972 at 1/30720), and the same orbit with the horizon term removed
  precesses by 0.000. For level 1 it runs 34–135 deg/lap, which the weak-field
  formula `6πGM/c²a(1−e²)` predicts to within about 10%.
- **The board constraint is the annulus, not the snapshot.** Because the axis
  reaches every orientation eventually, a body can occupy anywhere between its
  apsides, and an orbit fits only if `apoapsis + radius` clears the nearest
  edge. A level composed against a snapshot looks right at load and puts a star
  off the top edge ten minutes later. `npm run stars` checks this.
- **No speed limit on the orbit step.** These orbits are genuinely relativistic
  — a body at seven Schwarzschild radii does about a third of light speed — but
  Paczynski-Wiita *is* the relativistic correction, so `integrate()`'s
  longitudinal damping on top counts the same physics twice. It also only fires
  on the infalling half of each lap, so it bleeds energy, and the four stars
  quietly fell into the hole over the first three minutes.

An orbiting body feels its host and nothing else. Four mutually attracting stars
is a five-body problem and five-body problems are chaotic — the level would not
be the same level twice. Everything else on the board feels all of them in full.

`lead` is how a level starts bodies at different points on their orbits. Rather
than solve Kepler's equation for an arbitrary anomaly — an approximation anyway,
since these orbits are not closed — the orbit is simply run forward. Start the
clock early and let the physics put the body where it belongs.

### How big a black hole looks

A hole is drawn at its **shadow**, not its horizon. Light passing within the
photon capture radius `b = 3*sqrt(3)GM/c^2` spirals in and never comes back, so
the dark disc an observer sees is that radius -- `3*sqrt(3)/2 = 2.598 r_s`. A
black hole looks about two and a half times larger than its own horizon because
it bends light around itself and presents a magnified image of itself. This is
the number in the Event Horizon Telescope pictures: M87's shadow is 2.6 r_s
across, not 1. Drawing the bare horizon, as this used to, is the more familiar
picture and the wrong one; switching made every hole 2.6x bigger on screen
without touching its mass or its pull by one part.

It still **kills at the horizon**, though, which is not an inconsistency. The
shadow is the hole's image, not a surface: a craft at 2 r_s is between you and
the hole, lit, and alive -- drawn in front of the disc rather than inside
anything. Killing at the disc would also fail at mass, since the shadow grows as
`M` while `escapeLimit()` grows more slowly and the two cross near 7 solar
masses, above which a craft could power out of the black disc. In practice the
gap costs nothing: `escapeLimit()` sits outside the shadow at level 1's mass, so
touching the disc means having already lost. `node tools/smoke.mjs` reports it.

### Why asteroids orbit instead of raining in

Whether a rock swings past a hole or goes straight down it is decided by one
number, its angular momentum `L = v x r` about that hole -- and not at all by
its mass, which cancels out of the equation of motion. Below a critical `L` the
effective potential

    f(r) = L^2 / 2r^2  -  mu / (r - r_s)

has no local maximum, so there is no periapsis and no way past: the rock spirals
in whatever its speed or angle. Setting `df/dr = 0` and minimising puts the
marginal case at `r = 3 r_s`, the ISCO exactly, so `L_crit` is the angular
momentum of a circular orbit there and scales with the hole's mass.

With purely random drift, 25 of level 1's 28 rocks sat under `L_crit` from the
instant they spawned, and the board really was a vacuum. The fix is not to slow
them or lighten them: it is `asteroids.deflection`, the angle in degrees that
debris is thrown off a dead-centre aim, **away** from the horizontal midline.

The sign is the whole thing. Debris enters from the right-hand edge, and angled
*inward* the two terms of `L = x*vy - y*vx` very nearly cancel there, so a rock
arrives with almost no angular momentum and goes straight down the hole -- 20 of
28 doomed before they had moved. Angled outward the terms add instead, and the
same rocks pass above and below the hole with enough to swing right round it: 2
of 28. The two streams end up counter-rotating, which is not a disc and is not
meant to be -- it is what a stream does when a massive body splits it.

It is authored as an angle rather than a velocity because it has to mean the
same thing at every speed. It was once a `swirl` in px/s, tuned as a sideways
nudge on rocks falling vertically; the moment entry moved to the right edge the
same 85px/s became a vertical nudge on rocks crossing at 23-63px/s and swamped
them, sending the median rock out of the top or bottom without ever crossing the
board.

`asteroids.drag` is a separate and much smaller thing -- 0.05 on level 1, and
not there to slow anything. Dissipation is what makes a capture *stick*: a clean
two-body encounter conserves energy, so an unbound rock leaves unbound, and
bleeding a little at closest approach turns a fly-by into several laps. It is
why debris settles into discs at all. It must stay small: at 0.45 the rocks shed
so much energy they spiral in before completing a lap and full revolutions
collapse to zero.

### Four black holes: why level 2 is two pairs

Four black holes cannot simply be placed on a board. A flat four-body system
tears itself apart in about a second however carefully it is seeded, and level 2
is the configuration that survives: a tight binary with two bodies on a wide
circumbinary orbit around it. Real quadruple stars are nearly always this "2+2"
shape for exactly the same reason.

Three things were measured getting there, and each is worth keeping.

**The pretty idea does not work.** Three equal holes at the corners of an
equilateral triangle turning rigidly about a fourth is an exact solution --
Lagrange's, from 1772, with a central mass added -- and it seeds perfectly:
radii 215.00px each, sides 372.4px each, identical speeds. Then it comes apart.
Maxwell worked this out for Saturn's rings: a ring of fewer than about seven
bodies is linearly unstable no matter how heavy the centre is. Measured, the
figure held its shape to 5% for 6 seconds at a 1.7:1 mass ratio and still only
205 seconds at 120:1, by which point the ring bodies are invisible specks.
Exact is not the same as stable.

**Mutual orbits need a simultaneous step.** Every body has to read the field it
is sitting in *before* any of them moves. Stepped one at a time, the second body
of a pair computes its pull from where the first has already got to -- half a
step of asymmetry injected into every tick, momentum stops being conserved, and
a mutual orbit pumps itself apart. A two-body circular orbit is exact, and over
ten minutes it holds its separation to 1% stepped simultaneously and blows up by
a factor of 10^4 stepped sequentially. It is invisible while bodies only orbit
something fixed, which is why it survived all of level 1. `stepBodies()`.

**The circumbinary bound falls out on its own.** A body orbiting a binary is
only bound outside roughly 2.3x the binary's separation; inside that the orbit
is chaotic. Nothing in the code knows that, and it reproduces it:

```
 binary sep   outer radius   ratio   outer orbit over 15 min
      120px          300px     2.5   escapes to 137,942px
      110px          315px     2.9   holds, 257-317px
       95px          315px     3.3   holds, 274-315px
       80px          320px     4.0   holds, 293-320px
```

Level 2 sits at 3.3. `npm run rings` checks it, along with whether the whole
figure stays on the board.

One restriction is named rather than implied: `ring.independent` marks bodies
that share an orbit but not a field, so each feels only what it is orbiting. For
level 2's outer pair, 600px apart, their pull on each other is 6% of what holds
them on the orbit -- while including it couples all four into the flat four-body
problem that comes apart in seconds.

### Backdrop

`"backdrop": "assets/backdrop.jpg"` puts one stationary image behind the board,
cover-fit; omit it and the field is black. It is deliberately not a parallax
starfield. A procedural scatter of dots never read as sky — a real night sky
spans orders of magnitude of brightness, almost all of it below what one 8-bit
pixel can hold, so it quantises into either sparse specks or grey dust — and
drifting it put slow parallax behind a board whose whole subject is things
falling. A captured sky carries the nebulosity and dust lanes that dots cannot.

The image must be at least as wide as the canvas it will be drawn on to stay
sharp: roughly 2560px for a 1440p display, 3840px for 4K.

Note that a lit backdrop is unforgiving of translucency bugs. The black hole's
horizon had been 24.7% white since it was written — `destination-out` scales
what it erases by the source alpha, and the fill style still in effect was the
aura gradient — which is invisible over black and a grey coin over a starfield.

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
npm start                  # http://localhost:3210 — zero dependencies
npm run physics            # geometry table for a range of black hole masses
npm run simulate           # autopilot balance report for levels/level1.json
npm run speeds             # asteroid speed distribution, for tuning the tails
npm run stars              # star orbits: apsides, lap time, precession, envelope
npm run paths              # renders the star orbits to a PNG, to look at
npm run capture            # how often asteroids actually orbit the stars
npm run authority          # from how far out gravity beats each craft's engine
npm run rings              # does a level's mutually-orbiting system hold together
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

- `users/{uid}` — public profile (`displayName`, `photoURL`). Owner-writable.
- `scores/{scoreId}` — one document per completed run (`uid`, `displayName`,
  `levelsCleared`, `craftRemaining`, `craftId`). Publicly readable, append-only:
  no updates or deletes, by anyone.

**A survival score, not a time.** The run clock was removed from the game — this
is about how far you get and what you have left when you stop, not how fast you
got there — so a run ranks by levels cleared, with craft still in hand as the
tiebreak.

Scores are written straight from the client, so `firestore.rules` can validate
their *shape* but not their *authenticity* — a determined player can post a
fabricated run. Closing that requires a Cloud Function, which requires the Blaze
plan. Noted as a known tradeoff rather than an oversight.


## Version History

- **2026**: Full rebuild — Arcade Graphics Engine, Paczyński–Wiita gravity,
  fixed-timestep symplectic integration, p5.js removed
- **2025**: Responsive refactor, JSON levels
- **2019–2024**: Original development

---

**Copyright © 2019 Tom Wesley**

*This original novelty arcade game allows users to pilot a spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.*
