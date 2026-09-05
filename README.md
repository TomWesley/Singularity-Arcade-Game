# Singularity Arcade Game

A space adventure game where players pilot spacecraft through gravitational fields created by black holes to reach portals at the end of each level.

**▶ Play it live: [wesleyarcade.com/singularity](https://wesleyarcade.com/singularity/)**

## Game Overview

**Singularity** is an original arcade-style game that challenges players to navigate through 10 increasingly difficult levels filled with black holes, asteroids, and gravitational forces. Players can choose from four different spacecraft, each with unique characteristics, and must use skill and physics to surf gravitational waves to victory.

## Features

- **Responsive Design**: Locked 1280x720 aspect ratio that scales perfectly to any screen size
- **4 Unique Spacecraft**: Each with different speed and mass characteristics
- **10 Challenging Levels**: Progressively difficult scenarios with moving black holes
- **Physics-Based Gameplay**: Realistic gravitational forces affect both player and asteroids
- **JSON Level System**: Easy-to-edit level configurations
- **Clean Architecture**: Modular code structure for maintainability

## Spacecraft Types

1. **Superbug** - Balanced craft with good speed and moderate mass
2. **Psych Bike** - High speed, low mass - fast but easily affected by gravity
3. **The Compiler** - Maximum speed, high mass - powerful but harder to control
4. **Voidwalker** - Lower speed, moderate mass - stable and predictable

## Local Development Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional but recommended)

### Quick Start

1. **Clone or Download** the repository
2. **Navigate** to the project directory
3. **Serve the files** using one of these methods:

#### Option 1: Using Node.js (Recommended)
```bash
# Install dependencies
npm install

# Start the development server
npm start
```
The game will be available at `http://localhost:3000`

#### Option 2: Using Python (if you have Python installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open `http://localhost:8000/public/` in your browser

#### Option 3: Using VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `public/index.html`
3. Select "Open with Live Server"

#### Option 4: Direct File Access (Limited functionality)
You can open `public/index.html` directly in your browser, but level loading may not work due to CORS restrictions.

### File Structure

```
Singularity-Arcade-Game/
├── public/
│   ├── index.html          # Main HTML file
│   ├── sketch.js           # Main P5.js entry point
│   ├── game.js             # Core game logic and state management
│   ├── classes.js          # Game object classes
│   ├── style.css           # Styles
│   ├── volt.ttf            # Game font
│   └── p5.js               # P5.js library
├── levels/
│   ├── level1.json         # Level configurations
│   ├── level2.json
│   └── ... (level1-10.json)
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## Game Controls

- **Mouse**: Move your spacecraft by moving the mouse cursor
- **Click**: Navigate through menus and select spacecraft
- **Objective**: Reach the glowing finish line at the right side of each level

## Level Configuration

Levels are stored as JSON files in the `levels/` directory. Each level defines:

- **Black holes** with positions, sizes, and movement patterns
- **Asteroid spawn** configurations
- **Special items** like extra lives
- **Finish line** position and dimensions

### Example Level Structure
```json
{
  "levelNumber": 1,
  "name": "Training Course",
  "blackHoles": [
    {
      "x": 0.5,        // X position (0-1 normalized)
      "y": 0.5,        // Y position (0-1 normalized)  
      "size": 0.278,   // Size (normalized to screen height)
      "isMoving": false,
      "moveAngle": 0,
      "moveRadius": 0
    }
  ],
  "asteroids": {
    "count": 13,
    "spawnSides": ["right", "top", "bottom"]
  }
}
```

## Development Notes

### Responsive Scaling System
The game uses a normalized coordinate system (1280x720) that automatically scales to fit any screen size while maintaining the correct aspect ratio. All positions and sizes are calculated relative to these base dimensions.

### Physics Implementation
- Black holes exert gravitational force on both the player and asteroids
- Force calculations use realistic physics equations
- Moving black holes create dynamic gravitational fields

### Architecture
- **game.js**: Main game state management and rendering coordination
- **classes.js**: Individual game object definitions (BlackHole, Star, Asteroid, Player)
- **sketch.js**: P5.js integration and event handling

## Customization

### Adding New Levels
1. Create a new JSON file in the `levels/` directory (e.g., `level11.json`)
2. Follow the existing level structure
3. Update the victory condition in `game.js` to handle additional levels

### Modifying Spacecraft
Edit the `getCraftData()` method in the `Player` class in `classes.js` to adjust speed, mass, or add new craft types.

### Adjusting Physics
Modify the `gConstant` value in the `updateGravity()` method to change the strength of gravitational effects.

## Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support
- Mobile browsers: Supported with responsive scaling

## Performance Notes

The game is optimized for smooth 60fps gameplay on modern devices. The responsive scaling system ensures consistent performance across different screen sizes and resolutions.

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

- **2025**: Complete refactor with responsive design, JSON levels, and clean architecture
- **2019-2024**: Original development and iterations

---

**Copyright © 2019 Tom Wesley**

*This original novelty arcade game allows users to pilot a spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.*