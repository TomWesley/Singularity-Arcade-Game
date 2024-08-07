//Copyright © 2019 Tom Wesley
//SINGULARITY: This original novelty arcade game allows users pilot a Spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.
//Coder: Thomas Wesley
//Last Edit 7/6/2024
//Notes - Add some aliens in the top left corner that shoots every 3 seconds, for levels 10-15. Change the galaxy color based on level.
//Current Level Count - 10

//Variable Declarations

//import { initializeApp } from 'firebase/app'
class BlackHole {
  constructor(x, y, size, isMoving, moveAngle, moveRadius) {
    this.x = x
    this.y = y
    this.size = size
    this.mass = size * 1.5
    this.isMoving = isMoving
    this.moveAngle = moveAngle
    this.moveRadius = moveRadius
    this.offsetX = 0
    this.offsetY = 0
  }

  move() {
    if (this.isMoving) {
      this.offsetX = cos(this.moveAngle) * this.moveRadius
      this.offsetY = sin(this.moveAngle) * this.moveRadius
      this.moveAngle += 0.01 // Adjust for desired speed of movement
    }
  }

  draw() {
    noFill()
    for (let i = 0; i < 50; i = i + 2) {
      if (i == 0) {
        stroke(255)
      } else {
        stroke(255, 50 - i)
      }
      strokeWeight(2)
      ellipse(
        this.x + this.offsetX,
        this.y + this.offsetY,
        this.size + i,
        this.size + i
      )
    }
    fill(0)
    noStroke()
    ellipse(this.x + this.offsetX, this.y + this.offsetY, this.size, this.size)
    this.x = this.x + this.offsetX
    this.y = this.y + this.offsetY
  }
}
const levelBlackHoles = [
  // Level 1 configuration (1 black hole)
  [new BlackHole(640, 0, 300, false), new BlackHole(640, 720, 300, false)],
  // Level 2 configuration (2 black holes)
  [
    new BlackHole(426.67, 360, 180, false),
    new BlackHole(900, 360, 90, true, 3.14 / 2, 1.5),
  ],
  // Level 3 configuration (3 black holes)
  [
    new BlackHole(426.67, 120, 130, false),
    new BlackHole(426.67, 600, 130, false),
    new BlackHole(853.33, 360, 80, true, 0, 20), // One moving in circle
  ],
  // Level 4 configuration (4 black holes)
  [
    new BlackHole(320, 120, 125, false),
    new BlackHole(960, 120, 125, false),
    new BlackHole(320, 600, 75, false),
    new BlackHole(960, 600, 75, true, 3.14 / 2, 10), // One moving horizontally
  ],
  // Level 5 configuration (5 black holes)
  [
    new BlackHole(256, 120, 20, true, 0, 40), // One moving in circle (center)
    new BlackHole(512, 120, 20, false),
    new BlackHole(768, 120, 20, false),
    new BlackHole(256, 600, 20, false),
    new BlackHole(1024, 600, 20, false),
  ],
  // Level 6 configuration (6 black holes)
  [
    new BlackHole(426.67, 90, 30, false),
    new BlackHole(853.33, 90, 30, false),
    new BlackHole(426.67, 630, 30, false),
    new BlackHole(853.33, 630, 30, false),
    new BlackHole(160, 360, 25, true, 3.14, 25), // One moving in circle (top left)
    new BlackHole(1120, 360, 25, true, 0, 25), // One moving in circle (top right)
  ],
]
let finishLineAlpha = 0
var app = 0
//Images
let ratioX = 1
let ratioY = 1

let imgOne
let imgThree
let imgFive
let imgSeven
let imgNine

let finalPosition

//Arrays
let Stars = []
let Surfers = []
let BlackHoles = []
let blackHoles = []
let asteroids = []
const numAsteroids = 13

//Control the star speed
let speed

//Victory Sequence
let wave = 35
let phase
let meh
let osx
let osy
let flareon = 140
let jolteon = 0
let s = 0
let theta
let m

let timer = 0
let delay = 0
let LINE_C = 200
let LINE_O = 360

//Control of Wave Fluctuation from bottom of screen
let radius

let title

let prevx = 0
let prevy = 0

let mousex
let mousey

let LevelChangeCount = 0
let LevelChangeTrigger = 0
let noText = 0
let levelStart = 0

let xGravity = 0
let yGravity = 0
let xGravityAsteroid = 0
let yGravityAsteroid = 0
let gConstant = 300
let ratio = 0
let ratiotwo = 0
let prevxx = 0
let prevyy = 0

//Asteroid variables
let initialAsteroid = 0
let AsteroidDestroyed = 0

//Surfer/Player Variables
let xsurf = 0
let ysurf = 0
let surfergravity = 0
let Craftselectioncount = 15 //Helps so a mouse click on the opening screen doesn't also select your craft
let lifeCount = 1
let extraLife = 1
let displayExtraLife = 0

let surfRed
let surfBlue
let surfGreen
let surfType

//Level Variables
let levelTimer = 0
let level = 1
let victory = 0
let turnoff = 0
let full = true

//User Input Varibles
let input
let button
let nameIn

let id
let playerName = ''
let DBEntry
let loadDB = 0

let craftLost = 0 //counter to ensure the craft lost sequences are timed correctly before resetting

function preload() {
  title = loadFont('volt.ttf')
  //External Sprites Used in the game
}

function setup() {
  finalPosition = createVector(0, 0)
  //storeItem('Stage', 0)
  createCanvas(1280, 720)

  //Create arrays of the class objects to be utilized in the draw phase
  for (let i = 0; i < 500; i++) {
    Stars[i] = new Star()
  }

  for (let i = 0; i < numAsteroids; i++) {
    let temp = new Asteroid(
      width * 1.1,
      random(height),
      random(-2, -1),
      random(-2, 2),
      width / 140
    )
    append(asteroids, temp)
  }
  for (let i = 0; i < 4; i++) {
    Surfers[i] = new Surfer()
  }

  //Database Configuration
  const firebaseConfig = {
    apiKey: 'AIzaSyC7KRHKPJUlp997AFgUN1FwwbWxOZf1mII',
    authDomain: 'singularity-c216f.firebaseapp.com',
    databaseURL: 'https://singularity-c216f.firebaseio.com',
    projectId: 'singularity-c216f',
    storageBucket: 'singularity-c216f.appspot.com',
    messagingSenderId: '877374644269',
    appId: '1:877374644269:web:d377b498db0a00ab1b98a4',
    measurementId: 'G-HTXCRL5LBV',
  }

  // Initialize Firebase
  app = firebase.initializeApp(firebaseConfig)

  input = createInput()
  input.position(width / 2, (4.5 * height) / 9)
  input.size(width / 6, height / 9)
  input.style('font-size', '48px')
  input.style('background-color', '#ffffa1')
  input.style('font-family', 'Impact')
}

//The draw function runs through the actions within it continuously
function draw() {
  delay = delay + 1
  timer = timer + 1

  const database = app.database()
  var ref = database.ref('scores')

  //Use a more visually appealing cursor - Possibly insert a custom cursor eventually
  cursor(CROSS)

  if (getItem('Stage') === null) {
    background(0)
    speed = 0.8
    for (let i = 0; i < Stars.length; i++) {
      Stars[i].update()
      Stars[i].show(255, 255, 255, 255)
    }

    textFont(title)
    stroke(0)
    fill(255, 240, 0, 255)
    textSize(width / 10)
    text('Enter An Alias', (1 * width) / 9, height / 4)
    textSize(width / 23)
    text('Confirm', (3.05 * width) / 5, (4.8 * height) / 9)

    stroke(255, 255)
    fill(255, 150)
    if (
      mouseX < width - width / 5 &&
      mouseX > (3 * width) / 5 &&
      mouseY < (5 * height) / 9 &&
      mouseY > (4 * height) / 9
    ) {
      rect((3 * width) / 5, (4 * height) / 9, width / 5, height / 9)
    }
    if (
      mouseIsPressed &&
      mouseX < width - width / 5 &&
      mouseX > (3 * width) / 5 &&
      mouseY < (5 * height) / 9 &&
      mouseY > (4 * height) / 9 &&
      input.value().length > 0
    ) {
      //fullscreen(full);
      playerName = addName()
      playerName = playerName.slice(0, 8)

      input.remove()
      mouseIsPressed = false
      //resizeCanvas(displayWidth, displayHeight);
    }
  } else {
    input.remove()
    //incremental variable that increases by one each frame
    textFont(title)
    if (getItem('Stage') == 'Leaderboard') {
      //Leaderboard
      background(0)
      speed = 0.9

      translate(width / 2, height / 2)
      rotate((delay * PI) / 2000)
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].update()
        Stars[i].show(255, 255, 255, 255)
      }
      rotate((-delay * PI) / 2000)
      translate(-width / 2, -height / 2)

      if (loadDB == 1) {
        var led = database.ref('scores')
        led.on('value', gotData, errData)
      } else {
        loadDB = 0
      }

      textFont(title)
      fill(255, 240, 0, 255)
      textSize(width / 14.3)
      text('Global Leaderboard', width / 8, height / 8.9)
      for (let aj = 0; aj < 25; aj = aj + 5) {
        stroke(255, 255, 255, 255)
        strokeWeight(1)
        line(
          width / 9 + aj * 2,
          height / 7 + aj,
          width - width / 9 - aj * 2,
          height / 7.2 + aj
        )
      }

      if (mouseIsPressed || keyIsPressed) {
        mouseIsPressed = false
        keyIsPressed = false

        delay = 0
        storeItem('Stage', 1)
      }
    }
    if (int(getItem('Stage')) == 1) {
      background(0)
      textSize(32)
      textFont(title)
      translate(width / 2, height / 2)
      if (10 + delay / 220 < 10000) {
        //The Stars speed will increase over time
        speed = delay / 500
      } else {
        //Fix a maximum speed
        speed = 20
      }
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].update()
        Stars[i].show(255, 255, 255, 255)
      }

      translate(-width / 2, -height / 2)
      lifeCount = 3 //Reset the number of lives each time the game is restarted
      level = 1 //Reset the game to level 1(Change for debugging)
      textSize(width / 7.2)
      if (delay < 255) {
        fill(255, 240, 0, 255 - (255 - delay))
      } else {
        fill(255, 240, 0, 255)
      }
      strokeWeight(1)
      stroke(0, 255 - (255 - delay))
      textAlign(CENTER)
      text('SINGULARITY', width / 2, height / 2)

      if (delay > 150) {
        textSize(width / 19.5)
        text('View Leaderboard', width / 2, height - height / 4)
        stroke(255, 255)
        fill(255, 150)
        if (
          mouseX < (3 * width) / 4 &&
          mouseX > (width * 1) / 4 &&
          mouseY > height - height / 3 &&
          mouseY < height - height / 6
        ) {
          rect((1 * width) / 4, height - height / 3, width / 2, height / 9)
        }
        if (
          mouseIsPressed &&
          mouseX < (3 * width) / 4 &&
          mouseX > (width * 1) / 4 &&
          mouseY > height - height / 3 &&
          mouseY < height - height / 6
        ) {
          storeItem('Stage', 1)
          loadDB = 1
          mouseIsPressed = false
          keyIsPressed = false
        }
      }
      textAlign(LEFT)
      if (delay > 40) {
        //Delay the ability to exit the selection screen so the previous click does not trigger it accidentally

        if (
          keyIsPressed ||
          (mouseIsPressed &&
            (mouseX > (3 * width) / 4 ||
              mouseX < (width * 1) / 4 ||
              mouseY < height - height / 3 ||
              mouseY > height - height / 3 + height / 9))
        ) {
          mouseIsPressed = false
          keyIsPressed = false
          storeItem('Stage', 2)
          //fullscreen(full);
          //resizeCanvas(displayWidth, displayHeight);
          extraLife = 1
        }
      }
    }
    if (int(getItem('Stage')) == 2) {
      changeLevel(1)

      turnoff = 0
      background(0)
      translate(width / 2, height / 2)
      rotate((PI * delay) / 900)
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].show(255, 255, 255, 255)
      }
      rotate((-PI * delay) / 900)

      translate(-width / 2, -height / 2)
      textSize(height / 8.5)
      fill(255, 240, 0, 255)
      noStroke()
      textAlign(CENTER)
      text('Select A Surfer', width / 2, height / 6)
      textAlign(LEFT)
      stroke(255, 240, 0, 255)
      line(width / 7, height / 5, width - width / 7, height / 5) //Underline
      //Display the surfer sprites and stats here
      stroke(255, 255)
      fill(255, 150)
      if (mouseY < height && mouseY > height - (2 * height) / 10) {
        quad(
          0,
          height - (2 * height) / 10,
          0,
          height,
          width,
          height,
          width,
          height - (2 * height) / 10
        )
      }
      if (
        mouseY < height - (2 * height) / 10 &&
        mouseY > height - (4 * height) / 10
      ) {
        quad(
          0,
          height - (2 * height) / 10,
          0,
          height - (4 * height) / 10,
          width,
          height - (4 * height) / 10,
          width,
          height - (2 * height) / 10
        )
      }
      if (
        mouseY < height - (4 * height) / 10 &&
        mouseY > height - (6 * height) / 10
      ) {
        quad(
          0,
          height - (4 * height) / 10,
          0,
          height - (6 * height) / 10,
          width,
          height - (6 * height) / 10,
          width,
          height - (4 * height) / 10
        )
      }
      if (
        mouseY < height - (6 * height) / 10 &&
        mouseY > height - (8 * height) / 10
      ) {
        quad(
          0,
          height - (6 * height) / 10,
          0,
          height - (8 * height) / 10,
          width,
          height - (8 * height) / 10,
          width,
          height - (6 * height) / 10
        )
      }
      textSize(height / 14.5)
      noStroke()
      fill(255, 255, 255, 255)
      text('Superbug', width / 4, height - (1 * height) / 13)
      text('Psych Bike', width / 4, height - (3.6 * height) / 13)
      text('The Compiler', width / 4, height - (6.2 * height) / 13)
      text('Voidwalker', width / 4, height - (8.8 * height) / 13)
      textSize(height / 19.5)
      text('Speed', width - width / 3.5, height - (1.5 * height) / 13)
      text('Mass', width - width / 3.5, height - (0.7 * height) / 13)
      translate(0, -(height / 13) * 2.6)
      text('Speed', width - width / 3.5, height - (1.5 * height) / 13)
      text('Mass', width - width / 3.5, height - (0.7 * height) / 13)
      translate(0, (height / 13) * 2.6)
      translate(0, -(height / 13) * 2.6 * 2)
      text('Speed', width - width / 3.5, height - (1.5 * height) / 13)
      text('Mass', width - width / 3.5, height - (0.7 * height) / 13)
      translate(0, (height / 13) * 2.6 * 2)
      translate(0, -(height / 13) * 2.6 * 3)
      text('Speed', width - width / 3.5, height - (1.5 * height) / 13)
      text('Mass', width - width / 3.5, height - (0.7 * height) / 13)
      translate(0, (height / 13) * 2.6 * 3)

      stroke(255)
      //Superbug Stats
      rectangle(
        width - width / 6,
        height - (0.915 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6.5,
        height - (0.915 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6.5 + abs(width / 6.5 - width / 6),
        height - (0.915 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6.5 + 2 * abs(width / 6.5 - width / 6),
        height - (0.915 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6,
        height - (1.715 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6.5,
        height - (1.715 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      rectangle(
        width - width / 6.5 + abs(width / 6.5 - width / 6),
        height - (1.715 * height) / 13,
        height / 60,
        height / 30,
        255,
        240,
        0,
        255
      )
      //Psych Bike Stats
      rectangle(
        width - width / 6,
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        255,
        174,
        204,
        255
      )
      rectangle(
        width - width / 6,
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        255,
        174,
        204,
        255
      )
      rectangle(
        width - width / 6.5,
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        255,
        174,
        204,
        255
      )
      rectangle(
        width - width / 6.5 + abs(width / 6.5 - width / 6),
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        255,
        174,
        204,
        255
      )
      rectangle(
        width - width / 6.5 + 2 * abs(width / 6.5 - width / 6),
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        255,
        174,
        204,
        255
      )
      //Compiler Stats
      translate(0, -(height / 13) * 2.6)
      rectangle(
        width - width / 6,
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6 + abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6 + 2 * abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6 + 3 * abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6 + 4 * abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6,
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6.5,
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6.5 + abs(width / 6.5 - width / 6),
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6.5 + 2 * abs(width / 6.5 - width / 6),
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      rectangle(
        width - width / 6.5 + 3 * abs(width / 6.5 - width / 6),
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        80,
        230,
        130,
        255
      )
      translate(0, (height / 13) * 2.6)
      //VoidWalker Stats
      translate(0, -(height / 13) * 2.6 * 2)
      rectangle(
        width - width / 6,
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        100,
        14,
        237,
        255
      )
      rectangle(
        width - width / 6 + abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        100,
        14,
        237,
        255
      )
      rectangle(
        width - width / 6 + 2 * abs(width / 6.5 - width / 6),
        height - (3.505 * height) / 13,
        height / 60,
        height / 30,
        100,
        14,
        237,
        255
      )
      rectangle(
        width - width / 6,
        height -
          (3.505 * height) / 13 -
          abs((1.715 * height) / 13 - (0.915 * height) / 13),
        height / 60,
        height / 30,
        100,
        14,
        237,
        255
      )
      //Render the Sprites
      translate(0, (height / 13) * 2.6 * 2)

      Surfers[0].render(width / 8, height - height / 10, 10, 0)
      Surfers[1].render(width / 8, height - (3 * height) / 10, 10, 1)
      Surfers[2].render(
        width / 8,
        height - (5 * height) / 10,
        10,
        2,
        255,
        255,
        255
      )
      Surfers[3].render(
        width / 8,
        height - (7 * height) / 10,
        10,
        3,
        255,
        255,
        255
      )
      if (Craftselectioncount < 0) {
        if (mouseIsPressed) {
          if (mouseY < height && mouseY > height - (2 * height) / 10) {
            //SuperBug

            localStorage.setItem(
              'myObject',
              JSON.stringify({
                speed: 13,
                name: 'SuperBug',
                mass: 5,
                surfType: 0,
              })
            )

            storeItem('Stage', 3)
          } else if (
            mouseY < height - (2 * height) / 10 &&
            mouseY > height - (4 * height) / 10
          ) {
            //Psych Bike

            localStorage.setItem(
              'myObject',
              JSON.stringify({
                speed: 14.5,
                name: 'Psych Bike',
                mass: 3,
                surfType: 1,
              })
            )
            storeItem('Stage', 3)
          } else if (
            mouseY < height - (4 * height) / 10 &&
            mouseY > height - (6 * height) / 10
          ) {
            //The Compiler

            // surferSpeed = 16
            localStorage.setItem(
              'myObject',
              JSON.stringify({
                speed: 16,
                name: 'Compiler',
                mass: 8,
                surfType: 2,
              })
            )
            storeItem('Stage', 3)
          } else if (
            mouseY < height - (6 * height) / 10 &&
            mouseY > height - (8 * height) / 10
          ) {
            //Voidwalker
            // surferSpeed = 11.5

            localStorage.setItem(
              'myObject',
              JSON.stringify({
                speed: 11.5,
                name: 'Voidwalker',
                mass: 6,
                surfType: 3,
              })
            )
            storeItem('Stage', 3)
          }
        }
      }
      if (Craftselectioncount != -5) {
        //Use this to prevent an immediate selection by not accepting clicks in the first moments after entering the Surfer Selection Page
        Craftselectioncount = Craftselectioncount - 1
      }
    }
    if (getItem('Stage') >= 3) {
      storeItem('Stage', 4)
      background(0, 0, 0, 255)
      if (turnoff < 11) {
        prevx = width / 12
        prevy = height / 2
        turnoff = turnoff + 1
        noText = 0
        levelStart = 0
        levelTimer = 0
      } else if (keyIsPressed || mouseIsPressed) {
        levelStart = 1
        noText = 1
      }
      //finish line
      finishLineAlpha = finishLineAlpha + 2
      if (timer % 255 == 0) {
        finishLineAlpha = 0
      }
      noStroke()
      translate(width * 0.015, 0)
      fill(255, 240, 10, finishLineAlpha - 160)
      quad(
        width * 0.92,
        height * 0.4,

        width * 0.95,
        height * 0.4,

        width * 0.985,
        height * 0.5,

        width * 0.955,
        height * 0.5
      )
      quad(
        width * 0.92,
        height * 0.6,

        width * 0.95,
        height * 0.6,

        width * 0.985,
        height * 0.5,

        width * 0.955,
        height * 0.5
      )
      fill(255, 240, 10, finishLineAlpha - 80)

      quad(
        width * 0.89,
        height * 0.4,

        width * 0.91,
        height * 0.4,

        width * 0.945,
        height * 0.5,

        width * 0.925,
        height * 0.5
      )
      quad(
        width * 0.89,
        height * 0.6,

        width * 0.91,
        height * 0.6,

        width * 0.945,
        height * 0.5,

        width * 0.925,
        height * 0.5
      )
      fill(255, 240, 10, finishLineAlpha)
      quad(
        width * 0.87,
        height * 0.4,

        width * 0.88,
        height * 0.4,

        width * 0.915,
        height * 0.5,

        width * 0.905,
        height * 0.5
      )
      quad(
        width * 0.87,
        height * 0.6,

        width * 0.88,
        height * 0.6,

        width * 0.915,
        height * 0.5,

        width * 0.905,
        height * 0.5
      )

      translate(-width * 0.015, 0)
      // }

      noStroke()

      translate(width / 2, height / 2)
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].show(255, 255, 255, 255)
      }
      translate(-width / 2, -height / 2)
      //Galaxy Start
      //Black Holes/Asteroids
      let BHdistance
      let gforce
      let BHmass = 0
      let denom
      blackHoles = levelBlackHoles[int(getItem('Level')) - 1]
      xGravity = 0
      yGravity = 0
      xGravityAsteroid = 0
      yGravityAsteroid = 0

      for (let i = 0; i < asteroids.length; i++) {
        asteroids[i].move()
        asteroids[i].draw()
      }

      for (let i = 0; i < blackHoles.length; i++) {
        blackHoles[i].move()
        blackHoles[i].draw()

        //Gravity between the black hole and surfer
        let surferMass = JSON.parse(localStorage.getItem('myObject')).mass
        BHdistance = dist(blackHoles[i].x, blackHoles[i].y, prevx, prevy)
        gforce =
          (surferMass * gConstant * blackHoles[i].mass) /
          (BHdistance * BHdistance + 1)
        denom = abs(prevx - blackHoles[i].x) + abs(prevy - blackHoles[i].y) + 1
        ratio = (blackHoles[i].x - prevx) / denom
        ratiotwo = (blackHoles[i].y - prevy) / denom
        xGravity = xGravity + ratio * gforce
        yGravity = yGravity + ratiotwo * gforce
        for (let j = 0; j < asteroids.length; j++) {
          BHdistance = dist(
            blackHoles[i].x,
            blackHoles[i].y,
            asteroids[j].x,
            asteroids[j].y
          )
          if (BHdistance < blackHoles[i].size / 2) {
            asteroids[j].reset()
          }
          gforce =
            (asteroids[j].mass * gConstant * blackHoles[i].mass) /
            (BHdistance * BHdistance + 1)
          denom =
            abs(asteroids[j].x - blackHoles[i].x) +
            abs(asteroids[j].y - blackHoles[i].y) +
            1
          ratio = (blackHoles[i].x - asteroids[j].x) / denom
          ratiotwo = (blackHoles[i].y - asteroids[j].y) / denom
          xGravityAsteroid = ratio * gforce
          yGravityAsteroid = ratiotwo * gforce
          asteroids[j].vx = asteroids[j].vx + xGravityAsteroid
          asteroids[j].vy = asteroids[j].vy + yGravityAsteroid
        }
      }

      //The trigger for beating the level, indicate the level completion and have brief break
      if (
        LevelChangeTrigger == 0 &&
        (44 * width) / 50 < prevx &&
        prevy < height / 2 + width / 17.8 &&
        prevy > height / 2 - width / 17.8
      ) {
        LevelChangeCount = 0
        LevelChangeTrigger = 1
      }
      if (LevelChangeTrigger == 1) {
        textSize(height / 6.3)
        stroke(0)
        fill(255, 240, 0, 255)
        textAlign(CENTER)
        if (LevelChangeCount < 50) {
          text('Level Complete', width / 2, height / 2.8)
          noStroke()
          fill(150, 250, 180, 35)
          quad(0, 0, width, 0, width, height, 0, height)
        } else {
          turnoff = 0
          LevelChangeTrigger = 0

          level = level + 1
          storeItem('Level', level)
          changeLevel(level)

          //Change the next value here to reflect the last level which will trigger the victory sequence
          if (level == 11) {
            DBEntry = 1
          }
        }
        LevelChangeCount = LevelChangeCount + 1
      }
      //Extra Life Section(Only on level 5)
      if (level == 5) {
        if (extraLife == 1) {
          let len = width / 320
          extraLifeSprite(len)
        }

        if (
          prevx < width / 2 + 39 &&
          prevx > width / 2 - 35 &&
          prevy < height / 2 + 39 &&
          prevy > height / 2 - 35 &&
          extraLife == 1
        ) {
          lifeCount = lifeCount + 1
          extraLife = 0
          displayExtraLife = 25
        }
        if (displayExtraLife > 0) {
          fill(120, 255, 140, 255)
          stroke(0)
          textSize(height / 7.5)
          text('Extra Life +', width / 4.2, height / 3.5)
          displayExtraLife = displayExtraLife - 1
        }
      }

      //Surfer
      let mousex = mouseX
      let mousey = mouseY
      let mouseVector
      mouseVector = createVector(mousex, mousey)

      if (levelTimer < 75) {
        textAlign(CENTER)
        if (levelStart == 0) {
          fill(255, 240, 0, 255)
          stroke(0)
          textSize(height / 7.5)

          text('Awaiting Signal', width / 2, height / 3.5)
          var thisText = 'Lives: ' + lifeCount
          stroke(0)
          text(thisText, width / 2, height / 1.8)
        } else {
          levelTimer = levelTimer + 1
        }
        if (noText == 1) {
          fill(255, 240, 0, 255)
          stroke(0)
          textSize(height / 7.5)

          text('Engage Thrusters!', width / 2, height / 2)
          //fill(255, 0, 0, 255);
        }
        xsurf = width / 12
        ysurf = height / 2
        xGravity = 0
        yGravity = 0

        finalPosition.x = width / 12
        finalPosition.y = height / 2
        GameOver = 0
      }
      //control for the mouse being too close to the surfer, SEPARATE X AND Y HERE
      let surferSpeed = JSON.parse(localStorage.getItem('myObject')).speed
      if (abs(mouseX - xsurf) > 2) {
        ratioX =
          abs(xsurf - mouseX) / (abs(ysurf - mouseY) + abs(xsurf - mouseX))
        finalPosition.x =
          xsurf +
          ((mouseX - xsurf) / abs(mouseX - xsurf)) * 1 * surferSpeed * ratioX
        finalPosition.x = finalPosition.x + xGravity
      }
      if (abs(mouseY - ysurf) > 2) {
        ratioY =
          abs(ysurf - mouseY) / (abs(ysurf - mouseY) + abs(xsurf - mouseX))
        finalPosition.y =
          ysurf +
          ((mouseY - ysurf) / abs(mouseY - ysurf)) * 1 * surferSpeed * ratioY
        finalPosition.y = finalPosition.y + yGravity
      }
      //Add in the gravity

      //Control for the edges of the screen
      if (finalPosition.x > width) {
        finalPosition.x = width
      } else if (finalPosition.x < 0) {
        finalPosition.x = 0
      }

      if (finalPosition.y > height) {
        finalPosition.y = height
      } else if (finalPosition.y < 0) {
        finalPosition.y = 0
      }
      xsurf = finalPosition.x
      ysurf = finalPosition.y
      let force = p5.Vector.sub(finalPosition, mouseVector)
      let surferType = int(
        JSON.parse(localStorage.getItem('myObject')).surfType
      )
      Surfers[surferType].render(
        finalPosition.x,
        finalPosition.y,
        10,
        surferType,
        surfRed,
        surfBlue,
        surfGreen
      )

      prevx = finalPosition.x
      prevy = finalPosition.y

      //Display what level it is
      fill(255, 240, 0, 255)
      stroke(0)
      textSize(height / 20)
      text(int(level), width / 40, height / 20)
    }
    if (getItem('Stage') == 'Lost Life') {
      if (lifeCount > 0) {
        textSize(height / 4.5)
        fill(255, 240, 0, 255)
        stroke(0)
        text('Craft Lost', width / 9, height / 2.5)
        noStroke()
        if (craftLost < 10) {
          fill(240, 140, 255, 7)
          quad(0, 0, width, 0, width, height, 0, height)
        }
        if (craftLost > 105) {
          lifeCount = lifeCount - 1
          if (lifeCount > 0) {
          }
        }
        craftLost = craftLost + 1
      }
      //If the lifeCount is at 0, then begin the Game Over sequence where any key or mouse press will return to the home screen
      if (lifeCount == 0) {
        background(255, 240, 0, 255)
        noStroke()
        fill(0, 0, 0, 255)
        rect(
          width / 2 + (width * cos(radians(delay) / 5)) / 2,
          0,
          height / 10,
          height
        )
        rect(
          width / 2 + (width * sin(radians(delay) / 5)) / 2,
          0,
          height / 10,
          height
        )
        rect(
          width / 5 + (width * sin(radians(delay) / 3)) / 2,
          0,
          height / 10,
          height
        )
        rect(
          width / 1.2 + (width * sin(radians(delay) / 8)) / 2,
          0,
          height / 10,
          height
        )
        rect(
          width / 7 + (width * sin(cos(radians(delay)) / 12)) / 2,
          0,
          height / 10,
          height
        )
        rect(
          width / 1.6 + (width * sin(radians(delay) / 4)) / 2,
          0,
          height / 10,
          height
        )
        fill(255, 255, 255, 255)
        stroke(0)
        textSize(height / 4.5)
        textAlign(CENTER)
        text('Game Over', width / 2, (3 * height) / 4)
        if (DBEntry == 1) {
          var data = {
            name: playerName,
            level: level - 1,
            surfer: surfType,
          }
          ref.push(data)
          DBEntry = 0
        }
        translate(width / 2, height / 3)
        for (let i = 0; i < LINE_C; i = i + 0.2) {
          fill(0)
          stroke(0)
          point(x(i + delay), y(i + delay))
          point(z(i + delay), w(i + delay))
        }
        translate(-width / 2, -height / 3)
        if (keyIsPressed || mouseIsPressed) {
          delay = 0
        }
      }
    }
    if (getItem('Stage') == 'Victory') {
      background(0)
      translate(width / 2, height / 2)
      rotate(PI * delay * 0.0001)
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].show(255, 255, 255, 255)
      }
      rotate(-PI * delay * 0.0001)
      if (mouseIsPressed || keyIsPressed) {
        delay = 0
      }
      flareon = 300 * cos(radians(delay / 2))
      wave = wave + 0.0001
      for (let i = 0; i < LINE_O; i = i + 0.1) {
        theta = i * (360 / LINE_O)
        phase = PI / LINE_O
        meh = flareon * 0.5 * sin(wave * theta + phase) * cos(phase)
        osx = (meh + flareon + 140) * tan(theta)
        osy = (meh + flareon + 140) * sin(theta)

        stroke(255, 240, 0, 255)
        strokeWeight(1)
        point(osx, osy)
      }
      translate(-width / 2, -height / 2)
      fill(255, 240, 0, 255)
      stroke(0)
      textSize(height / 5)
      text('Victory', width / 4, height / 4)
      if (DBEntry == 1) {
        var dataTwo = {
          name: playerName,
          level: 10,
          surfer: surfType,
        }
        ref.push(dataTwo)
        DBEntry = 0
      }
    }
  }
}

//Class Documentation

class Star {
  // float x; float y; float z;float pz;
  constructor() {
    this.starSize = random(height / 360, height / 100)
    // I place values in the variables
    this.x = random(-width / 2, width / 2)
    // note: height and width are the same: the canvas is a square.
    this.y = random(-height / 2, height / 2)
    // note: the z value can't exceed the width/2 (and height/2) value,
    // beacuse I'll use "z" as divisor of the "x" and "y",
    // whose values are also between "0" and "width/2".
    this.z = random(width / 2)
    // I set the previous position of "z" in the same position of "z",
    this.pz = z
    // which it's like to say that the Stars are not moving during the first frame.
    // this.pz = z;
    this.colours = []
    this.colours[0] = color(255, 255, 255)
    this.colours[1] = color(235, 205, 255)
    this.colours[2] = color(255, 245, 205)
    this.colours[3] = color(255, 205, 205)
    this.colours[4] = color(255, 205, 155)
    this.primary = int(random(4))
  }
  update() {
    this.z = this.z - speed
    if (this.z < 1) {
      this.z = width / 2
      this.x = random(-width / 2, width / 2)
      this.y = random(-height / 2, height / 2)
      this.pz = this.z
    }
  }
  show(uno, dos, tres, quatro) {
    //Add a twinkling factor for the stationary frames

    fill(this.colours[this.primary])
    noStroke()
    let sx = map(this.x / this.z, 0, 1, 0, width / 2)
    let sy = map(this.y / this.z, 0, 1, 0, height / 2)
    // I use the z value to increase the star size between a range from 0 to 16.
    let r = map(this.z, 0, width / 2, this.starSize, 0)
    ellipse(sx, sy, r, r)
    let px = map(this.x / this.pz, 0, 1, 0, width / 2)
    let py = map(this.y / this.pz, 0, 1, 0, height / 2)
    this.pz = this.z

    //line(px, py, sx, sy);
  }
}

class Surfer {
  constructor() {}
  update() {}
  render(x, y, len, quatro) {
    //Color parameters are not yet utilized
    noStroke()
    len = width / 320
    if (quatro == 0) {
      drawSuperbug(len, x, y)
    } else if (quatro == 1) {
      //Psych Bike

      drawPsychBike(len, x, y)
    } else if (quatro == 2) {
      drawCompiler(len, x, y)
    } else {
      //VoidWalker
      stroke(255)
      fill(100, 14, 237, 255)
      noStroke()
      square(x, y, len)
      square(x, y - len, len)
      square(x, y - len * 2, len)
      square(x, y - len * 3, len)
      square(x, y - len * 4, len)
      square(x, y - len * 5, len)
      square(x, y + len, len)
      square(x, y + len * 2, len)
      square(x, y + len * 3, len)
      square(x, y + len * 4, len)
      square(x, y + len * 5, len)
      square(x, y + len * 6, len)
      square(x - len, y, len)
      square(x + len, y, len)
      square(x - len, y + len, len)
      square(x + len, y + len, len)

      square(x - len, y + len * 4, len)
      square(x + len, y + len * 4, len)
      square(x - len, y + len * 5, len)
      square(x + len, y + len * 5, len)
      square(x - len, y - len * 3, len)
      square(x + len, y - len * 3, len)
      square(x - len, y - len * 4, len)
      square(x + len, y - len * 4, len)

      square(x - len * 3, y - len, len)
      square(x + len * 3, y - len, len)
      square(x - len * 4, y - len, len)
      square(x + len * 4, y - len, len)
      square(x - len * 5, y - len * 2, len)
      square(x + len * 5, y - len * 2, len)
      square(x - len * 6, y - len * 3, len)
      square(x + len * 6, y - len * 3, len)
      square(x - len * 6, y - len * 2, len)
      square(x + len * 6, y - len * 2, len)
      square(x - len * 6, y - len * 1, len)
      square(x + len * 6, y - len * 1, len)
      square(x - len * 6, y, len)
      square(x + len * 6, y, len)
      square(x - len * 6, y + len, len)
      square(x + len * 6, y + len, len)

      square(x - len * 7, y, len)
      square(x + len * 7, y, len)
      square(x - len * 7, y + len, len)
      square(x + len * 7, y + len, len)
      square(x - len * 7, y + len * 2, len)
      square(x + len * 7, y + len * 2, len)
      square(x - len * 7, y - len, len)
      square(x + len * 7, y - len, len)
      square(x - len * 7, y - len * 2, len)
      square(x + len * 7, y - len * 2, len)
      square(x - len * 7, y - len * 3, len)
      square(x + len * 7, y - len * 3, len)
      square(x - len * 7, y - len * 4, len)
      square(x + len * 7, y - len * 4, len)

      fill(255, 255, 255, 255)
      square(x + len, y - len, len)
      square(x - len, y - len, len)
      square(x + len * 2, y, len)
      square(x - len * 2, y, len)
      square(x + len * 3, y + len, len)
      square(x - len * 3, y + len, len)
      square(x + len * 3, y + len * 2, len)
      square(x - len * 3, y + len * 2, len)

      square(x + len, y - len * 5, len)
      square(x - len, y - len * 5, len)
      square(x + len * 2, y - len * 4, len)
      square(x - len * 2, y - len * 4, len)
      square(x + len * 3, y - len * 3, len)
      square(x - len * 3, y - len * 3, len)
      square(x + len * 3, y - len * 2, len)
      square(x - len * 3, y - len * 2, len)

      square(x + len, y + len * 3, len)
      square(x - len, y + len * 3, len)
      square(x + len * 2, y + len * 4, len)
      square(x - len * 2, y + len * 4, len)
      square(x + len * 3, y + len * 5, len)
      square(x - len * 3, y + len * 5, len)
      square(x + len * 3, y + len * 6, len)
      square(x - len * 3, y + len * 6, len)
    }
  }
}

class Asteroid {
  constructor(x, y, vx, vy, size) {
    this.x = x
    this.y = y
    this.vx = random(-10, -0.1)
    this.vy = random(-4, 4)
    this.size = size
    this.mass = size * 0.007
  }

  reset() {
    this.x = width * 1.1
    let side = int(random(2))
    if (side == 1) {
      this.y = random(height / 4)
    } else {
      this.y = random((3 * height) / 4, height)
    }
    this.vx = random(-10, -0.1)
    this.vy = random(-4, 4)
  }

  move() {
    this.x += this.vx
    this.y += this.vy

    // Check if offscreen and respawn
    if (this.x < 0 || this.y < 0 || this.y > height) {
      this.reset()
    }
  }

  draw() {
    noStroke(0)

    for (let i = 0; i < 10; i++) {
      fill(135, 175, 255, 100 - i * 9)
      ellipse(this.x, this.y, this.size + i * 0.75, this.size + i * 0.75)
    }
    fill(135, 175, 255)
    noStroke()
    // strokeWeight(1)
    // stroke(0)
    ellipse(this.x, this.y, this.size, this.size)
  }
}

function rectangle(x, y, w, h, r, g, b, o) {
  strokeWeight(0.5)
  stroke(255, 255)
  fill(r, g, b, o)
  quad(
    x - w / 2,
    y - h / 2,
    x - w / 2,
    y + h / 2,
    x + w / 2,
    y + h / 2,
    x + w / 2,
    y - h / 2
  )
}

function extraLifeSprite(len) {
  fill(210, 255, 220, 4)
  noStroke()
  for (let i = 25; i < 65; i = i + 1) {
    ellipse(width / 2 + len / 2, height / 2 + len * 1.5, i, i)
  }
  noStroke()
  fill(255, 255)
  square(width / 2, height / 2, len)
  square(width / 2, height / 2 - len, len)
  square(width / 2, height / 2 - len * 2, len)

  square(width / 2, height / 2 + len, len)
  square(width / 2 + len, height / 2 + len, len)
  square(width / 2 - len, height / 2 + len, len)

  square(width / 2 + len * 2, height / 2 + len * 2, len)
  square(width / 2 - len * 2, height / 2 + len * 2, len)
  square(width / 2 + len, height / 2 + len * 2, len)
  square(width / 2 - len, height / 2 + len * 2, len)
  square(width / 2, height / 2 + len * 2, len)

  square(width / 2 - len, height / 2 + len * 4, len)
  fill(120, 255, 140, 255)
  square(width / 2, height / 2 - len * 3, len)
  square(width / 2 + len, height / 2 - len * 3, len)
  square(width / 2 + len * 2, height / 2 - len * 3, len)
  square(width / 2 - len, height / 2 - len * 3, len)
  square(width / 2 - len * 2, height / 2 - len * 3, len)
  square(width / 2 - len, height / 2 - len * 2, len)
  square(width / 2 + len, height / 2 - len * 2, len)
  square(width / 2 - len, height / 2 - len, len)
  square(width / 2 + len, height / 2 - len, len)
  square(width / 2 - len, height / 2, len)
  square(width / 2 + len, height / 2, len)
  square(width / 2 - len * 2, height / 2, len)
  square(width / 2 + len * 2, height / 2, len)
  square(width / 2 - len * 2, height / 2 + len, len)
  square(width / 2 + len * 2, height / 2 + len, len)
  square(width / 2 - len * 3, height / 2 + len, len)
  square(width / 2 + len * 3, height / 2 + len, len)
  square(width / 2 - len * 3, height / 2 + len * 2, len)
  square(width / 2 + len * 3, height / 2 + len * 2, len)
  square(width / 2 - len * 3, height / 2 + len * 3, len)
  square(width / 2 + len * 3, height / 2 + len * 3, len)
  square(width / 2 - len * 3, height / 2 + len * 4, len)
  square(width / 2 + len * 3, height / 2 + len * 4, len)

  square(width / 2 - len * 2, height / 2 + len * 3, len)
  square(width / 2 + len * 2, height / 2 + len * 3, len)
  square(width / 2 - len * 2, height / 2 + len * 4, len)
  square(width / 2 + len * 2, height / 2 + len * 4, len)

  square(width / 2 - len, height / 2 + len * 3, len)
  square(width / 2 + len, height / 2 + len * 3, len)

  square(width / 2 + len, height / 2 + len * 4, len)

  square(width / 2, height / 2 + len * 3, len)
  square(width / 2, height / 2 + len * 4, len)

  square(width / 2 - len * 2, height / 2 + len * 5, len)
  square(width / 2 + len * 2, height / 2 + len * 5, len)
  square(width / 2 - len, height / 2 + len * 5, len)
  square(width / 2 + len, height / 2 + len * 5, len)
  square(width / 2, height / 2 + len * 5, len)
}

//Function Logic

function addName() {
  id = input.value()
  nameIn = 1
  storeItem('Stage', nameIn)
  return id
}
//Parametric Equations
function x(t) {
  return (cos(sqrt(t)) * PI * 25) / (sin(t) + 2)
}
function y(t) {
  return (sin(sqrt(t)) * PI * 25) / (cos(t) + 2)
}
function z(t) {
  return cos(t * t) * 160 - sin(t)
}
function w(t) {
  return sin(t * t) * 150 + cos(t * sin(t))
}

function gotData(data) {
  var arr = [
    ['Kyle', 1, 2],
    ['Gary', 1, 3],
    ['Giovanni', 1, 1],
    ['Blaine', 1, 0],
    ['Misty', 1, 0],
    ['Surge', 1, 2],
    ['Erika', 1, 2],
    ['Sabrina', 1, 3],
    ['Brock', 1, 0],
    ['Koga', 1, 1],
  ]
  var minimum = 0
  var scoress = data.val()
  var keys = Object.keys(scoress)
  var skipper = 0

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    var levels = scoress[k].level
    var names = scoress[k].name
    var surf = scoress[k].surfer
    var tempArr = [names, levels, surf]

    if (levels > minimum) {
      for (var st = 0; st < arr.length; st = st + 1) {
        if (names == arr[st][0]) {
          if (levels >= arr[st][1]) {
            arr[st] = tempArr
          }
          skipper = 1
          break
        } else {
          skipper = 0
        }
      }
      if (skipper == 0) {
        append(arr, tempArr)
      }
      arr.sort((a, b) => b[1] - a[1])
      if (arr.length > 10) {
        arr.pop()
        minimum = arr[9][1]
      }
    }
  }
  textFont(title)
  textSize(width / 18.5)

  for (var j = 0; j < 10; j++) {
    if (arr[j][2] == 0) {
      fill(255, 0, 0, 255)
    }
    if (arr[j][2] == 1) {
      fill(255, 174, 204, 255)
    }
    if (arr[j][2] == 2) {
      fill(80, 230, 130, 255)
    }
    if (arr[j][2] == 3) {
      fill(100, 14, 237, 255)
    }
    stroke(0)
    text(arr[j][0], width / 3.3, (height * (j + 3.4)) / 13)
    text(arr[j][1], (2.7 * width) / 4, (height * (j + 3.4)) / 13)
  }
}
function drawPsychBike(len, x, y) {
  let wid = len * 6
  stroke(255, 174, 204, 255)
  noFill()
  strokeWeight(3)
  curve(
    x - wid * 4,
    y - wid,
    x - wid,
    y - wid * 0.6,
    x - wid,
    y + wid * 0.6,
    x - wid * 4,
    y + wid
  )
  curve(
    x + wid * 4,
    y - wid,
    x + wid,
    y - wid * 0.6,
    x + wid,
    y + wid * 0.6,
    x + wid * 4,
    y + wid
  )
  curve(
    x + wid * 2,
    y - wid,
    x - wid * 0.1,
    y + wid * 0.5,
    x - wid * 0.15,
    y + wid * 1.3,
    x + wid * 2,
    y + wid
  )
  curve(
    x - wid * 2,
    y - wid,
    x + wid * 0.1,
    y + wid * 0.5,
    x + wid * 0.15,
    y + wid * 1.3,
    x - wid * 2,
    y + wid
  )

  line(x + wid * 0.6, y, x - wid * 0.6, y)
  strokeWeight(1)
  fill(198, 220, 255, 255)
  noStroke()
  ellipse(x - wid, y - wid * 0.6, wid * 0.5, wid * 0.5)
  ellipse(x - wid, y + wid * 0.6, wid * 0.5, wid * 0.5)
  ellipse(x + wid, y - wid * 0.6, wid * 0.5, wid * 0.5)
  ellipse(x + wid, y + wid * 0.6, wid * 0.5, wid * 0.5)
  ellipse(x + wid * 0.15, y + wid * 1.3, wid * 0.25, wid * 0.25)
  ellipse(x - wid * 0.15, y + wid * 1.3, wid * 0.25, wid * 0.25)
  fill(255, 174, 204, 255)
  noStroke()
  ellipse(x, y, wid * 0.58, wid * 0.58)

  triangle(x - wid * 0.3, y, x + wid * 0.3, y, x, y + wid)
  fill(198, 220, 255, 255)
  triangle(
    x - wid * 0.15,
    y - wid * 0.1,
    x,
    y + wid * 0.45,
    x + wid * 0.15,
    y - wid * 0.1
  )
}
function drawCompiler(len, x, y) {
  let wid = len * 6
  let colorOne = color(0, 255)
  let colorTwo = color(80, 230, 130, 255)
  fill(colorTwo)
  noStroke()
  ellipse(x, y - wid * 0.2, wid * 0.7, wid * 0.7)
  fill(colorOne)
  stroke(colorTwo)
  triangle(
    x - wid * 0.05,
    y - wid * 0.2,
    x - wid * 0.05,
    y - wid * 0.4,
    x - wid * 0.5,
    y - wid * 0.6
  )
  triangle(
    x + wid * 0.05,
    y - wid * 0.2,
    x + wid * 0.05,
    y - wid * 0.4,
    x + wid * 0.5,
    y - wid * 0.6
  )

  stroke(colorTwo)
  noFill()
  strokeWeight(3)
  translate(wid, 0)
  curve(
    x + wid * 4,
    y,
    x - wid * 1.5,
    y - wid * 0.8,
    x - wid * 1.5,
    y + wid * 0.8,
    x + wid * 4,
    y
  )
  stroke(colorOne)
  curve(
    x + wid * 4,
    y,
    x - wid * 1.6,
    y - wid * 0.8,
    x - wid * 1.6,
    y + wid * 0.8,
    x + wid * 4,
    y
  )
  stroke(colorTwo)
  curve(
    x + wid * 4,
    y,
    x - wid * 1.7,
    y - wid * 0.8,
    x - wid * 1.7,
    y + wid * 0.8,
    x + wid * 4,
    y
  )
  translate(-wid * 2, 0)
  curve(
    x - wid * 4,
    y,
    x + wid * 1.5,
    y - wid * 0.8,
    x + wid * 1.5,
    y + wid * 0.8,
    x - wid * 4,
    y
  )
  stroke(colorOne)
  curve(
    x - wid * 4,
    y,
    x + wid * 1.6,
    y - wid * 0.8,
    x + wid * 1.6,
    y + wid * 0.8,
    x - wid * 4,
    y
  )
  stroke(colorTwo)
  curve(
    x - wid * 4,
    y,
    x + wid * 1.7,
    y - wid * 0.8,
    x + wid * 1.7,
    y + wid * 0.8,
    x - wid * 4,
    y
  )

  translate(wid, 0)
  line(x + wid * 0.67, y - wid * 0.8, x + wid * 0.5, y - wid * 0.8)
  line(x + wid * 0.67, y + wid * 0.8, x + wid * 0.5, y + wid * 0.8)
  line(x - wid * 0.67, y + wid * 0.8, x - wid * 0.5, y + wid * 0.8)
  line(x - wid * 0.67, y - wid * 0.8, x - wid * 0.5, y - wid * 0.8)
  stroke(colorOne)
  strokeWeight(wid / 4.5)
  line(x - wid * 1.16, y, x + wid * 1.16, y)
  strokeWeight(3)
  stroke(colorTwo)
  line(x - wid * 1.13, y - wid * 0.17, x + wid * 1.13, y - wid * 0.17)
  line(x - wid * 1.13, y + wid * 0.17, x + wid * 1.13, y + wid * 0.17)

  strokeWeight(0.75)
  line(x - wid * 1.1, y, x + wid * 1.1, y)
}
function drawSuperbug(len, x, y) {
  let wid = len * 6
  let colorOne = color(255, 120, 0, 255)
  let colorTwo = color(255, 240, 0, 255)
  strokeWeight(3)
  fill(colorTwo)
  noStroke()
  // ellipse(x + wid * 0.2, y + wid * 0.95, wid * 0.3, wid * 0.3)
  // ellipse(x - wid * 0.2, y + wid * 0.95, wid * 0.3, wid * 0.3)
  ellipse(x, y - wid * 0.25, wid * 0.8, wid * 0.8)
  ellipse(x, y + wid * 0.35, wid * 0.9, wid * 0.9)
  fill(colorOne)
  quad(
    x + wid * 0.7,
    y - wid * 0.1,
    x + wid * 0.4,
    y + wid * 0.2,
    x + wid * 0.4,
    y - wid * 0.4,
    x + wid * 0.8,
    y - wid * 0.8
  )
  quad(
    x - wid * 0.7,
    y - wid * 0.1,
    x - wid * 0.4,
    y + wid * 0.2,
    x - wid * 0.4,
    y - wid * 0.4,
    x - wid * 0.8,
    y - wid * 0.8
  )
  ellipse(x, y, wid * 0.8, wid * 1)
  // ellipse(x, y + wid * 0.7, wid * 0.6, wid * 0.6)
  stroke(colorTwo)
  line(x + wid * 0.4, y + wid * 0.3, x + wid * 0.4, y - wid * 0.4)
  line(x - wid * 0.4, y + wid * 0.3, x - wid * 0.4, y - wid * 0.4)
  line(x + wid * 0.4, y - wid * 0.4, x + wid * 0.8, y - wid * 0.8)
  line(x - wid * 0.4, y - wid * 0.4, x - wid * 0.8, y - wid * 0.8)
  line(x - wid * 0.4, y - wid * 0.4, x - wid * 0.8, y - wid * 0.8)
  line(x - wid * 0.4, y - wid * 0.1, x - wid * 0.75, y - wid * 0.45)
  line(x + wid * 0.4, y - wid * 0.1, x + wid * 0.75, y - wid * 0.45)
  line(x - wid * 0.4, y + wid * 0.2, x - wid * 0.7, y - wid * 0.1)
  line(x + wid * 0.4, y + wid * 0.2, x + wid * 0.7, y - wid * 0.1)
  fill(colorTwo)
  triangle(
    x + wid * 0.225,
    y + wid * 0.7,
    x - wid * 0.225,
    y + wid * 0.7,
    x,
    y + wid * 1
  )

  // curve(
  //   x - wid,
  //   y - wid,
  //   x - wid * 0.3,
  //   y + wid * 0.4,
  //   x - wid * 0.8,
  //   y - wid * 0.3,
  //   x - wid,
  //   y - wid * 2
  // )
}

function errData(err) {}

function changeLevel(newLevel) {
  if (newLevel >= 1 && newLevel <= 10) {
    currentLevel = newLevel
    // blackHoles = levelBlackHoles[currentLevel - 1]
  } else {
    console.error(
      'Invalid level number. Please choose between 1 and 10',
      levelBlackHoles.length
    )
  }
}
