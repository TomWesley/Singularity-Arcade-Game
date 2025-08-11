//Copyright © 2019 Tom Wesley
//SINGULARITY: This original novelty arcade game allows users pilot a Spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.
//Coder: Thomas Wesley
//Refactored: 2025 - Clean architecture with responsive scaling and JSON level loading

let game

function preload() {
  // Load font if available
  try {
    // Don't create game object yet, just load font
    if (!game) {
      game = {}
    }
    game.font = loadFont('volt.ttf')
  } catch (error) {
    console.log('Font not found, using default')
  }
}

function setup() {
  // Create game object here after P5 is fully initialized
  if (!game || typeof game.setupCanvas !== 'function') {
    game = new Game()
    try {
      game.font = loadFont('volt.ttf')
    } catch (error) {
      console.log('Font not found, using default')
    }
  }
  game.setupCanvas()
}

function windowResized() {
  if (game) {
    game.windowResized()
  }
}

function draw() {
  if (game) {
    game.update()
    game.draw()
  }
}

function mousePressed() {
  if (game) {
    game.handleClick()
  }
}

