//Copyright © 2019 Tom Wesley
//SINGULARITY: This original novelty arcade game allows users pilot a Spacecraft which surfs on the gravitational waves of black holes to explore various galaxies.
//Coder: Thomas Wesley
//Last Edit 4/4/2024
//Notes - Add some aliens in the top left corner that shoots every 3 seconds, for levels 10-15. Change the galaxy color based on level.
//Current Level Count - 10

//Variable Declarations

//import { initializeApp } from 'firebase/app'

var app = 0
//Images
let ratioX = 1
let ratioY = 1

let imgOne
let imgThree
let imgFive
let imgSeven
let imgNine
let imgPortal

let finalPosition

//Arrays
let Stars = []
let Surfers = []
let BlackHoles = []
let Asteroids = []

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
let gamePhase = 0
let prevx = 0
let prevy = 0

let mousex
let mousey
let GameOver = 0
let LevelChangeCount = 0
let LevelChangeTrigger = 0
let noText = 0
let levelStart = 0

let xGravity = 0
let yGravity = 0
let gConstant = 55
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
let Craftselectioncount //Helps so a mouse click on the opening screen doesn't also select your craft
let lifeCount = 1
let extraLife = 1
let displayExtraLife = 0
let surferSpeed = 4
let surfRed
let surfBlue
let surfGreen
let surfType
let surfMass

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
  imgOne = loadImage('YellowGal.jpg')
  imgThree = loadImage('BlueNStar.jpg')
  imgFive = loadImage('SpiralGal.jpg')
  imgSeven = loadImage('BlueGal.jpg')
  imgNine = loadImage('WDwarf.jpg')
  imgPortal = loadImage('ExitPortal.png')
}

function setup() {
  finalPosition = createVector(0, 0)

  createCanvas(1280, 720)
  //storeItem('nameIn', nameIn)
  //Create arrays of the class objects to be utilized in the draw phase
  for (let i = 0; i < 500; i++) {
    Stars[i] = new Star()
  }
  for (let i = 0; i < 10; i++) {
    BlackHoles[i] = new BH()
  }
  for (let i = 0; i < 14; i++) {
    Asteroids[i] = new Asteroid(random(0.1, 0.4))
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
  input.position(width / 3, (4 * height) / 9)
  input.size(width / 6, height / 9)
  input.style('font-size', '48px')
  input.style('background-color', '#ffffa1')
  input.style('font-family', 'Impact')
}

//The draw function runs through the actions within it continuously
function draw() {
  timer = timer + 1

  const database = app.database()
  var ref = database.ref('scores')

  //Use a more visually appealing cursor - Possibly insert a custom cursor eventually
  cursor(CROSS)

  //if (getItem('Stage') < 2) {
  if (getItem('nameIn') != 1) {
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
    delay = delay + 1

    if (GameOver === 0) {
      cursor(CROSS)
      if (gamePhase === 1) {
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
          gamePhase = 0
          delay = 0
        }
      }
      if (gamePhase == 0) {
        storeItem('Stage', 2)
        //Title Screen when gamePhase = 0
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
        stroke(255, 255 - (255 - delay))
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
            gamePhase = -1
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
            //fullscreen(full);
            //resizeCanvas(displayWidth, displayHeight);
            gamePhase = 2
            Craftselectioncount = 15
            extraLife = 1
          }
        }
        prevx = width / 12
        prevy = height / 2
      } else if (gamePhase === 2) {
        storeItem('Stage', 3)
        //Surfer Selection Page when gamePhase = 2
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

        Surfers[0].render(width / 8, height - height / 10, 10, 0, 255, 255, 255)
        Surfers[1].render(
          width / 8,
          height - (3 * height) / 10,
          10,
          1,
          255,
          255,
          255
        )
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
              surfMass = 2.6
              surferSpeed = 13
              gamePhase = 4
              surfType = 0
            } else if (
              mouseY < height - (2 * height) / 10 &&
              mouseY > height - (4 * height) / 10
            ) {
              //Psych Bike
              surfMass = 2.3
              surferSpeed = 14.5
              gamePhase = 4
              surfType = 1
            } else if (
              mouseY < height - (4 * height) / 10 &&
              mouseY > height - (6 * height) / 10
            ) {
              //The Compiler
              surfMass = 2.7
              surferSpeed = 16
              gamePhase = 4
              surfType = 2
            } else if (
              mouseY < height - (6 * height) / 10 &&
              mouseY > height - (8 * height) / 10
            ) {
              //Voidwalker
              surfMass = 2.5
              surferSpeed = 11.5
              gamePhase = 4
              surfType = 3
            }
          }
        }
        if (Craftselectioncount != -5) {
          //Use this to prevent an immediate selection by not accepting clicks in the first moments after entering the Surfer Selection Page
          Craftselectioncount = Craftselectioncount - 1
        }
      } else if (gamePhase >= 4) {
        storeItem('Stage', 4)
        if (gamePhase == 4) {
          prevx = width / 12
          prevy = height / 2
          levelTimer = 0
          initialAsteroid = 0
          noText = 0
          levelStart = 0
        }
        if ((keyIsPressed || mouseIsPressed) && turnoff > 10) {
          gamePhase = 5
          levelStart = 1
          noText = 1
        }
        if (turnoff < 11) {
          turnoff = turnoff + 1
        }
        background(0, 0, 0, 255)
        //finish line
        strokeWeight(10)
        stroke(255, 240, 10)
        noFill()
        ellipse((width * 9.75) / 10, height / 2, width / 25, height / 5)

        translate(width / 2, height / 2)
        for (let i = 0; i < Stars.length; i++) {
          Stars[i].show(255, 255, 255, 255)
        }
        translate(-width / 2, -height / 2)
        //Galaxy Start

        if (level < 3) {
          image(imgOne, 0, height / 2 - width / 18, width / 6, width / 9)
        } else if (level < 5) {
          image(imgThree, 0, height / 2 - width / 12, width / 6, width / 6)
        } else if (level < 7) {
          image(imgFive, 0, height / 2 - width / 18, width / 6, width / 9)
        } else if (level < 9) {
          image(
            imgSeven,
            0,
            height / 2 - width / 16.59,
            width / 6,
            width / 8.29
          )
        } else {
          image(imgNine, 0, height / 2 - width / 13.31, width / 6, width / 6.66)
        }

        //Black Holes/Asteroids
        let asteroidDistance
        //let Asteroidmass = 30;
        let AsteroidInitialSpeed = 12
        let BHdistance
        let BHx = width / 6
        let BHy = height / 6
        let gforce
        let BHmass = 0
        let denom
        xGravity = 0
        yGravity = 0
        let xAsteroidTotal = 0
        let yAsteroidTotal = 0
        let xGravityAsteroid = 0
        let yGravityAsteroid = 0
        if (level == 3) {
          BHy = height / 3.5
          BHx = width / 5.5
        }
        surfergravity = 0 //Do the surfers relation to the black holes only once

        for (let j = 13; j >= 0; j = j - 1) {
          for (let i = 0; i < BlackHoles.length; i++) {
            //Black Hole Masses Depending on the Level
            if (i == 0) {
              BHy = height / 2 - height / 5
            } else if (i % 2 == 0) {
              BHy = BHy - 2 * 180 - (i % 40)
            } else {
              BHy = BHy + 95 * 4 + 30 * cos(radians(i))
            }
            if (level == 2) {
              BHx = BHx + width / 13
            }
            if (level == 1) {
              if (i == 0) {
                BHmass = height / 2.8
                BHx = width / 2
                BHy = height / 2
              } else if (i == 1) {
                angle = delay / 2
                let xxxx = (height / 2.3) * cos(radians(angle)) + width / 2
                let yyyy = (height / 3) * sin(radians(angle)) + height / 2
                BHmass = height / 5
                BHx = xxxx
                BHy = yyyy
              } else {
                BHmass = 1
                BHx = -width
                BHy = height / 2
              }
            }
            if (level == 2) {
              BHmass = height / 6 + (((i * height) / 30) % 150)
            } else if (level == 3) {
              if (i == 2) {
                BHmass = height / 2
              } else {
                BHmass = height / 8 + (((i * height) / 40) % 160)
              }
              if (i == 2) {
                BHx = width / 2
                BHy = height / 2
              }
              if (i == 0) {
                BHx = width / 2 + width / 12
                BHy = height / 12
              }
              if (i == 1) {
                BHx = width / 2 + width / 9
                BHy = height - height / 12
              }
              if (i == 3) {
                BHx = width / 2 + width / 3.9
                BHy = height / 2.2
              }
              if (i == 4) {
                BHx = -width / 2
                BHy = height / 4
              }
              if (i == 5) {
                BHx = width - width / 40
                BHy = height - height / 5
              }
              if (i == 6) {
                BHx = width / 70
                BHy = height / 1.5
              }
              if (i == 7) {
                BHx = width / 4
                BHy = height / 8
              }
              if (i == 8) {
                BHx = width / 4
                BHy = height - height / 5
              }
              if (i == 9) {
                BHx = -width
                BHy = height / 90
              }
            } else if (level == 4) {
              if (i % 2 == 0) {
                BHmass = height / 3.5 + (i % (height / 140)) * 30

                angle = (i + 1) * 36 + delay / 2.7
                let xxxxx = (height / 4) * cos(radians(angle)) + width / 2
                let yyyyy = (height / 2) * sin(radians(angle)) + height / 2
                BHx = xxxxx
                BHy = yyyyy
              } else {
                BHmass = 15
                BHx = -width
                BHy = 0
              }
            } else if (level == 5) {
              if (i == 0) {
                BHmass = height / 2.8
                BHx = width / 2.8
                BHy = height / 2
              } else if (i == 1) {
                BHmass = height / 4.5
                BHx = width / 2
                BHy = height - height / 2.8
              } else if (i == 2) {
                BHmass = height / 4.5
                BHx = width / 2
                BHy = height / 2.8
              } else if (i == 3) {
                BHmass = height / 5
                BHx = width / 10
                BHy = height - height / 8
              } else if (i == 4) {
                BHmass = height / 5.5
                BHx = width - width / 9
                BHy = height / 10
              } else if (i == 5) {
                BHmass = height / 5.5
                BHx = width / 3
                BHy = height / 7
              } else {
                BHmass = height / 14 + (i * height) / 40
                BHx = width / 3 + ((i - 6) * width) / 6
                BHy = height * 0.9 - ((i - 6) * height) / 13
              }
            } else if (level == 6) {
              if (i % 2 == 0) {
                BHmass = height / 3.5 + (i * height) / 80
                BHx =
                  (height / 2) *
                    tan(radians(delay / 1.2 + i * 72)) *
                    cos(radians(delay / 1.2 + i * 72)) +
                  width / 1.5
                BHy =
                  (height / 1.4) *
                    cos(radians(delay / 1.2 + i * 72)) *
                    sin(radians(delay / 1.2 + i * 72)) +
                  height / 2
              } else {
                BHx = -200
                BHy = (i * width) / 10
                BHmass = 10
              }
            } else if (level == 7) {
              BHmass = height / 6.3 + (log((i % 6) + 1) * height) / 14
              BHx = width / 11 + (i * width) / 13
              if (i % 2 == 0) {
                BHy = (sqrt(i) * height) / 8.5
              } else {
                BHy = height - (sqrt(i) * height) / 8.7
              }
            } else if (level == 8) {
              BHmass = height / 3.5 + ((i % 4) * height) / 20
              angle = (i + 1) * 36 + delay / 1.6
              let xxxxxx = height * 1.5 * sin(radians(angle)) + width / 2
              let yyyyyy =
                (height / 1.2) * sin(radians(angle)) * cos(radians(angle)) +
                height / 2
              BHx = xxxxxx
              BHy = yyyyyy
            } else if (level == 9) {
              BHmass = height / 5.1 + ((i % 4) * height) / 20
              angle = (i + 1) * 36 + delay / 18
              let xxxxxxx =
                (height / 12 + width / 12) * cos(radians(angle)) -
                (width / 5) *
                  cos((height / width + radians(angle)) * radians(angle)) +
                width / 1.4
              let yyyyyyy =
                (height / 12 + width / 12) * sin(radians(angle)) -
                (width / 5) *
                  sin((height / width + radians(angle)) * radians(angle)) +
                height / 2
              BHx = xxxxxxx * 0.85
              BHy = yyyyyyy * 1
            } else if (level == 10) {
              BHmass = height / 5.5 + ((i % 5) * height) / 20
              angle = (i + 1) * 50 + 18 * cos(radians(delay / 4))
              let xxxxxxxx =
                (height / 15) *
                  (cos(radians(angle)) + radians(angle) * sin(radians(angle))) +
                width / 2
              let yyyyyyyy =
                (height / 15) *
                  (sin(radians(angle)) - radians(angle) * cos(radians(angle))) +
                height / 2
              BHx = xxxxxxxx
              BHy = yyyyyyyy
            }
            //Calculate the surfer's gravity & corresponding motion only once when this loop is run against all of the asteroids
            if (surfergravity == 0) {
              //
              if (
                abs(BHx - prevx) < BHmass / 4 &&
                abs(BHy - prevy) < BHmass / 4
              ) {
                GameOver = 1
                //Add the data to the database only once
                DBEntry = 1
              }
              BlackHoles[i].render(BHmass, BHx, BHy, 255)
              BHdistance = dist(BHx, BHy, prevx, prevy)
              //insert the surfer mass and BH mass into the equation
              gforce =
                (surfMass * gConstant * BHmass) / (BHdistance * BHdistance + 1)
              denom = abs(prevx - BHx) + abs(prevy - BHy)
              ratio = (BHx - prevx) / denom
              ratiotwo = (BHy - prevy) / denom
              xGravity = xGravity + ratio * gforce
              yGravity = yGravity + ratiotwo * gforce
            } else {
              BHx = BlackHoles[i].xx
              BHy = BlackHoles[i].yy
            }
          }
        }

        //The trigger for beating the level, indicate the level completion and have brief break
        // image(imgPortal,4.8*width/6,height/2-width/10.66,width/3,width/5.33);
        if (
          LevelChangeTrigger == 0 &&
          GameOver == 0 &&
          (44 * width) / 50 < prevx &&
          prevy < height / 2 + width / 17.8 &&
          prevy > height / 2 - width / 17.8
        ) {
          LevelChangeCount = 0
          LevelChangeTrigger = 1
        }
        if (LevelChangeTrigger == 1) {
          GameOver = 0
          textSize(height / 6.3)
          stroke(0)
          fill(255, 240, 0, 255)
          if (LevelChangeCount < 50) {
            text('Level Complete', width / 9, height / 2.8)
            noStroke()
            fill(150, 250, 180, 35)
            quad(0, 0, width, 0, width, height, 0, height)
          } else {
            LevelChangeTrigger = 0
            gamePhase = 4
            level = level + 1
            //Change the next value here to reflect the last level which will trigger the victory sequence
            if (level == 11) {
              GameOver = 2
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

        levelTimer = levelTimer + 1
        if (levelTimer > 75) {
          //NEES TO BE FIXED
          if (abs(ysurf - mouseY) > 3 && abs(xsurf - mouseX) > 3) {
            ratioX =
              abs(xsurf - mouseX) / (abs(ysurf - mouseY) + abs(xsurf - mouseX))
            ratioY =
              abs(ysurf - mouseY) / (abs(ysurf - mouseY) + abs(xsurf - mouseX))
          }
          //  ratiotwo = ysurf / (abs(xsurf) + abs(ysurf))
          // xsurf = ratio * distance
          // ysurf = ratiotwo * distance
        } else {
          if (levelStart == 0) {
            fill(255, 240, 0, 255)
            stroke(0)
            textSize(height / 7.5)
            text('Awaiting Signal', width / 6.6, height / 3.5)
            var thisText = 'Lives: ' + lifeCount
            stroke(0)
            text(thisText, width / 3, height / 1.8)
          }
          if (noText == 1) {
            fill(255, 240, 0, 255)
            stroke(0)
            textSize(height / 7.5)
            let myText = 'Lives: ' + lifeCount
            text('Engage Thrusters!', width / 8.25, height / 3.5)
            //fill(255, 0, 0, 255);
            text(myText, width / 3, height / 1.8)
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
        if (abs(mouseX - xsurf) > 3) {
          finalPosition.x =
            xsurf +
            ((mouseX - xsurf) / abs(mouseX - xsurf)) * 1 * surferSpeed * ratioX
        }
        if (abs(mouseY - ysurf) > 3) {
          finalPosition.y =
            ysurf +
            ((mouseY - ysurf) / abs(mouseY - ysurf)) * 1 * surferSpeed * ratioY
        }
        //Add in the gravity
        finalPosition.x = finalPosition.x + xGravity
        finalPosition.y = finalPosition.y + yGravity
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
        // let distanceSq = force.magSq();
        // let G = 1;
        // let strength = G *
        Surfers[int(surfType)].render(
          finalPosition.x,
          finalPosition.y,
          10,
          surfType,
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
      craftLost = 0
    }
    //What happens after being eaten by a black hole or destroyed by an asteroid, have different sequences that occur - mini graphics splash
    else if (GameOver == 1) {
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
            gamePhase = 4
            GameOver = 0
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
          GameOver = 0
          gamePhase = 0
          delay = 0
        }
      }
    }
    //Set Gameover to 2 in order to reach the victory sequence, do this after the level reaches one over the total number
    else {
      background(0)
      translate(width / 2, height / 2)
      rotate(PI * delay * 0.0001)
      for (let i = 0; i < Stars.length; i++) {
        Stars[i].show(255, 255, 255, 255)
      }
      rotate(-PI * delay * 0.0001)
      if (mouseIsPressed || keyIsPressed) {
        GameOver = 0
        gamePhase = 0
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
  render(x, y, len, quatro, red, blue, green) {
    //Color parameters are not yet utilized
    noStroke()
    len = width / 320
    if (quatro == 0) {
      //Superbug
      fill(255, 240, 0, 255)
      square(x - len, y + 3 * len, len)
      square(x + len, y + 3 * len, len)
      square(x, y + 3 * len, len)
      square(x - len * 2, y + 6 * len, len)
      square(x + len * 2, y + 6 * len, len)

      square(x + len * 2, y + len, len)
      square(x + len * 2, y, len)
      square(x + len * 2, y - len, len)
      square(x + len * 2, y - len * 2, len)
      square(x + len * 3, y - len * 3, len)
      square(x + len * 3, y - len * 4, len)
      square(x + len * 4, y - len * 4, len)
      square(x + len * 4, y - len * 5, len)
      square(x + len * 5, y - len * 5, len)
      square(x + len * 3, y + len, len)

      square(x - len * 2, y + len, len)
      square(x - len * 2, y, len)
      square(x - len * 2, y - len, len)
      square(x - len * 2, y - len * 2, len)
      square(x - len * 3, y - len * 3, len)
      square(x - len * 3, y - len * 4, len)
      square(x - len * 4, y - len * 4, len)
      square(x - len * 4, y - len * 5, len)
      square(x - len * 5, y - len * 5, len)
      square(x - len * 3, y + len, len)

      square(x - len * 5, y + len, len)
      square(x - len * 5, y + len * 2, len)
      square(x + len * 5, y + len, len)
      square(x + len * 5, y + len * 2, len)

      fill(255, 0, 0, 255)
      square(x - len, y, len * 3)
      square(x, y + 4 * len, len)
      square(x, y + 4 * len, len)
      square(x + len, y + 4 * len, len)
      square(x - len, y + 4 * len, len)
      square(x + len, y + 5 * len, len)
      square(x, y + 5 * len, len)
      square(x - len, y + 5 * len, len)

      square(x + 4 * len, y, len)
      square(x + 4 * len, y + len, len)
      square(x - 4 * len, y, len)
      square(x - 4 * len, y + len, len)

      square(x + 6 * len, y + len * 3, len)
      square(x + 6 * len, y + len * 2, len)
      square(x - 6 * len, y + len * 3, len)
      square(x - 6 * len, y + len * 2, len)
      square(x - 5 * len, y + len * 4, len)
      square(x + 5 * len, y + len * 4, len)
    } else if (quatro == 1) {
      //Psych Bike
      drawPsychBike(len, x, y)
    } else if (quatro == 2) {
      //The Compiler
      noStroke()
      fill(80, 230, 130, 255)
      square(x, y, len)
      square(x, y - len, len)
      square(x, y - len * 2, len)
      square(x, y - len * 3, len)
      square(x, y - len * 4, len)
      square(x, y + len, len)
      square(x, y + len * 2, len)
      square(x, y + len * 3, len)
      square(x, y + len * 4, len)
      square(x, y + len * 5, len)

      square(x - len, y, len)
      square(x - len, y - len, len)
      square(x - len, y - len * 2, len)
      square(x - len, y - len * 3, len)
      square(x - len, y + len, len)
      square(x - len, y + len * 2, len)
      square(x - len, y + len * 3, len)
      square(x - len, y + len * 4, len)

      square(x + len, y, len)
      square(x + len, y - len, len)
      square(x + len, y - len * 2, len)
      square(x + len, y - len * 3, len)
      square(x + len, y + len, len)
      square(x + len, y + len * 2, len)
      square(x + len, y + len * 3, len)
      square(x + len, y + len * 4, len)

      square(x + len * 2, y, len)
      square(x + len * 2, y - len, len)
      square(x + len * 2, y + len, len)
      square(x + len * 2, y + len * 2, len)
      square(x - len * 2, y, len)
      square(x - len * 2, y - len, len)
      square(x - len * 2, y + len, len)
      square(x - len * 2, y + len * 2, len)

      square(x + len * 3, y, len)
      square(x + len * 3, y + len, len)
      square(x + len * 3, y + len * 2, len)
      square(x - len * 3, y, len)
      square(x - len * 3, y + len, len)
      square(x - len * 3, y + len * 2, len)

      square(x - len * 5, y, len)
      square(x - len * 5, y + len, len)
      square(x + len * 5, y, len)
      square(x + len * 5, y + len, len)
      square(x - len * 6, y, len)
      square(x - len * 6, y + len, len)
      square(x + len * 6, y, len)
      square(x + len * 6, y + len, len)

      fill(1, 100, 87, 255)
      square(x - len * 3, y - len, len)
      square(x + len * 3, y - len, len)
      square(x + len * 4, y, len)
      square(x + len * 4, y + len, len)
      square(x + len * 4, y + len * 2, len)
      square(x - len * 4, y, len)
      square(x - len * 4, y + len, len)
      square(x - len * 4, y + len * 2, len)

      square(x - len * 7, y, len)
      square(x - len * 7, y + len, len)
      square(x + len * 7, y, len)
      square(x + len * 7, y + len, len)

      square(x - len * 7, y + len * 2, len)
      square(x - len * 7, y + len * 3, len)
      square(x + len * 7, y + len * 2, len)
      square(x + len * 7, y + len * 3, len)
      square(x - len * 7, y - len, len)
      square(x - len * 7, y - len * 2, len)
      square(x + len * 7, y - len, len)
      square(x + len * 7, y - len * 2, len)

      square(x - len * 8, y, len)
      square(x - len * 8, y + len, len)
      square(x + len * 8, y, len)
      square(x + len * 8, y + len, len)

      square(x - len * 8, y + len * 2, len)
      square(x - len * 8, y - len * 3, len)
      square(x + len * 8, y + len * 2, len)
      square(x + len * 8, y - len * 3, len)
      square(x - len * 8, y - len, len)
      square(x - len * 8, y - len * 2, len)
      square(x + len * 8, y - len, len)
      square(x + len * 8, y - len * 2, len)

      square(x - len * 2, y - len * 4, len)
      square(x + len * 2, y - len * 4, len)
      square(x - len * 3, y - len * 4, len)
      square(x + len * 3, y - len * 4, len)

      square(x - len * 3, y - len * 5, len)
      square(x + len * 3, y - len * 5, len)
      square(x - len * 4, y - len * 5, len)
      square(x + len * 4, y - len * 5, len)
      square(x - len * 5, y - len * 5, len)
      square(x + len * 5, y - len * 5, len)
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

class BH {
  //float gravity;

  constructor(constant) {
    this.gravity = constant
    this.xx = 0
    this.yy = 0
  }
  applyForce() {}
  render(mass, x, y, quatro) {
    let radius = ((width / 1280) * mass) / 2
    this.xx = x
    this.yy = y
    noStroke()
    for (let r = 15; r > 1; r = r - 0.25) {
      fill(255, 255 - noise(delay) * 40, 255 - noise(delay) * 100, sqrt(50 * r))
      ellipse(x, y, (radius * r) / 13.04, (radius * r) / 13.04)
    }
    fill(0)
    ellipse(x, y, radius, radius)
  }
}
class Asteroid {
  constructor(m) {
    // this.priorxArray = []
    // this.prioryArray = []
    // this.priorx = 0
    // this.priory = 0
    // this.secondpriorx = 0
    // this.secondpriory = 0
    this.location = createVector(0, 0)
    this.previousLocation = createVector(0, 0)
    this.velocity = createVector(0, 0)
    this.xx = 0
    this.yy = 0
    this.mass = m
    this.radius = this.mass * 50
  }
  applyForce() {
    //234
  }
  render(l, pL) {
    let distance = dist(l.x, l.y, pL.x, pL.y)
    let tailLength = distance * 5
    this.location = l
    this.previousLocation = pL
    //Draw the asteroid

    fill(100, 100, 255, 255)
    noStroke()
    ellipse(l.x, l.y, this.radius / 2, this.radius / 2)
    // fill(200, 230, 255, 25)
    // ellipse(x, y, this.radius, this.radius)
    // //Make sure the asteroids have a lot less mass so they don't fall in as easily
    this.xx = l.x
    this.yy = l.y
    this.previousLocation = l
    colorMode(RGB)
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
  //Leaderboard when gamePhase==-1
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
function errData(err) {}
