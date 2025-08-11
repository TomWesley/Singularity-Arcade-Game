class BlackHole {
  constructor(x, y, size, isMoving, moveAngle = 0, moveRadius = 0) {
    this.originalX = x
    this.originalY = y
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
      this.moveAngle += 0.01
    }
    
    this.x = this.originalX + this.offsetX
    this.y = this.originalY + this.offsetY
  }

  draw() {
    noFill()
    for (let i = 0; i < 50; i += 2) {
      if (i == 0) {
        stroke(255)
      } else {
        stroke(255, 50 - i)
      }
      strokeWeight(2)
      ellipse(this.x, this.y, this.size + i, this.size + i)
    }
    fill(0)
    noStroke()
    ellipse(this.x, this.y, this.size, this.size)
  }
}

class Star {
  constructor(designWidth = 1280, designHeight = 720) {
    this.designWidth = designWidth
    this.designHeight = designHeight
    this.starSize = random(this.designHeight / 360, this.designHeight / 100)
    this.x = random(-this.designWidth / 2, this.designWidth / 2)
    this.y = random(-this.designHeight / 2, this.designHeight / 2)
    this.z = random(this.designWidth / 2)
    this.pz = this.z
    this.colours = []
    this.colours[0] = color(255, 255, 255)
    this.colours[1] = color(235, 205, 255)
    this.colours[2] = color(255, 245, 205)
    this.colours[3] = color(255, 205, 205)
    this.colours[4] = color(255, 205, 155)
    this.primary = int(random(5))
    this.speed = 0.8
  }

  update() {
    this.z = this.z - this.speed
    if (this.z < 1) {
      this.z = this.designWidth / 2
      this.x = random(-this.designWidth / 2, this.designWidth / 2)
      this.y = random(-this.designHeight / 2, this.designHeight / 2)
      this.pz = this.z
    }
  }

  show() {
    fill(this.colours[this.primary])
    noStroke()
    let sx = map(this.x / this.z, 0, 1, 0, this.designWidth / 2)
    let sy = map(this.y / this.z, 0, 1, 0, this.designHeight / 2)
    let r = map(this.z, 0, this.designWidth / 2, this.starSize, 0)
    ellipse(sx, sy, r, r)
    
    let px = map(this.x / this.pz, 0, 1, 0, this.designWidth / 2)
    let py = map(this.y / this.pz, 0, 1, 0, this.designHeight / 2)
    this.pz = this.z
  }
}

class Asteroid {
  constructor(x, y, vx, vy, size, designWidth = 1280, designHeight = 720) {
    this.designWidth = designWidth
    this.designHeight = designHeight
    this.originalX = x
    this.x = x
    this.y = y
    this.vx = random(-10, -0.1)
    this.vy = random(-4, 4)
    this.size = size
    this.mass = size * 0.007
  }

  reset() {
    this.x = this.designWidth * 1.1
    let side = int(random(2))
    if (side == 1) {
      this.y = random(this.designHeight / 4)
    } else {
      this.y = random((3 * this.designHeight) / 4, this.designHeight)
    }
    this.vx = random(-10, -0.1)
    this.vy = random(-4, 4)
  }

  move() {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.y < 0 || this.y > this.designHeight) {
      this.reset()
    }
  }

  draw() {
    noStroke()
    for (let i = 0; i < 10; i++) {
      fill(135, 175, 255, 100 - i * 9)
      ellipse(this.x, this.y, this.size + i * 0.75, this.size + i * 0.75)
    }
    fill(135, 175, 255)
    noStroke()
    ellipse(this.x, this.y, this.size, this.size)
  }
}

class Player {
  constructor(x, y, craftType) {
    this.startX = x
    this.startY = y
    this.x = x
    this.y = y
    this.craftType = craftType
    this.gravityX = 0
    this.gravityY = 0
    
    // Craft properties
    this.craftData = this.getCraftData(craftType)
    this.speed = this.craftData.speed
    this.mass = this.craftData.mass
  }
  
  getCraftData(type) {
    const craftTypes = [
      { name: 'Superbug', speed: 13, mass: 5 },
      { name: 'Psych Bike', speed: 14.5, mass: 3 },
      { name: 'The Compiler', speed: 16, mass: 8 },
      { name: 'Voidwalker', speed: 11.5, mass: 6 }
    ]
    return craftTypes[type] || craftTypes[0]
  }
  
  update() {
    // Mouse-based movement with gravity
    let mousePos = game.getScaledMousePosition()
    
    if (abs(mousePos.x - this.x) > 2) {
      let ratioX = abs(this.x - mousePos.x) / (abs(this.y - mousePos.y) + abs(this.x - mousePos.x))
      this.x += ((mousePos.x - this.x) / abs(mousePos.x - this.x)) * this.speed * ratioX
    }
    
    if (abs(mousePos.y - this.y) > 2) {
      let ratioY = abs(this.y - mousePos.y) / (abs(this.y - mousePos.y) + abs(this.x - mousePos.x))
      this.y += ((mousePos.y - this.y) / abs(mousePos.y - this.y)) * this.speed * ratioY
    }
    
    // Apply gravity
    this.x += this.gravityX
    this.y += this.gravityY
    
    // Boundary constraints
    this.x = constrain(this.x, 0, game.DESIGN_WIDTH)
    this.y = constrain(this.y, 0, game.DESIGN_HEIGHT)
  }
  
  applyGravity(gx, gy) {
    this.gravityX = gx
    this.gravityY = gy
  }
  
  draw() {
    let len = game.DESIGN_WIDTH / 320
    
    switch (this.craftType) {
      case 0:
        this.drawSuperbug(len)
        break
      case 1:
        this.drawPsychBike(len)
        break
      case 2:
        this.drawCompiler(len)
        break
      case 3:
        this.drawVoidwalker(len)
        break
    }
  }
  
  drawSuperbug(len) {
    let wid = len * 6
    let colorOne = color(255, 120, 0, 255)
    let colorTwo = color(255, 240, 0, 255)
    
    fill(colorTwo)
    noStroke()
    ellipse(this.x, this.y - wid * 0.25, wid * 0.8, wid * 0.8)
    ellipse(this.x, this.y + wid * 0.35, wid * 0.9, wid * 0.9)
    
    fill(colorOne)
    ellipse(this.x, this.y, wid * 0.8, wid)
    
    fill(colorTwo)
    triangle(
      this.x + wid * 0.225, this.y + wid * 0.7,
      this.x - wid * 0.225, this.y + wid * 0.7,
      this.x, this.y + wid
    )
  }
  
  drawPsychBike(len) {
    let wid = len * 6
    
    stroke(255, 174, 204, 255)
    noFill()
    strokeWeight(3)
    
    // Body curves
    curve(this.x - wid * 4, this.y - wid, this.x - wid, this.y - wid * 0.6,
          this.x - wid, this.y + wid * 0.6, this.x - wid * 4, this.y + wid)
    curve(this.x + wid * 4, this.y - wid, this.x + wid, this.y - wid * 0.6,
          this.x + wid, this.y + wid * 0.6, this.x + wid * 4, this.y + wid)
    
    line(this.x + wid * 0.6, this.y, this.x - wid * 0.6, this.y)
    
    fill(255, 174, 204, 255)
    noStroke()
    ellipse(this.x, this.y, wid * 0.58, wid * 0.58)
  }
  
  drawCompiler(len) {
    let wid = len * 6
    let colorOne = color(0, 255)
    let colorTwo = color(80, 230, 130, 255)
    
    fill(colorTwo)
    noStroke()
    ellipse(this.x, this.y - wid * 0.2, wid * 0.7, wid * 0.7)
    
    stroke(colorTwo)
    noFill()
    strokeWeight(3)
    
    // Wing curves
    curve(this.x + wid * 4, this.y, this.x - wid * 1.5, this.y - wid * 0.8,
          this.x - wid * 1.5, this.y + wid * 0.8, this.x + wid * 4, this.y)
    curve(this.x - wid * 4, this.y, this.x + wid * 1.5, this.y - wid * 0.8,
          this.x + wid * 1.5, this.y + wid * 0.8, this.x - wid * 4, this.y)
  }
  
  drawVoidwalker(len) {
    fill(100, 14, 237, 255)
    noStroke()
    
    // Main body
    for (let i = -5; i <= 6; i++) {
      rect(this.x - len/2, this.y + i * len - len/2, len, len)
    }
    
    // Wings
    for (let i = -4; i <= 5; i++) {
      rect(this.x - len * 1.5, this.y + i * len - len/2, len, len)
      rect(this.x + len * 0.5, this.y + i * len - len/2, len, len)
    }
    
    // Extended wings
    for (let i = -7; i <= 7; i++) {
      rect(this.x - len * 7.5, this.y + i * len - len/2, len, len)
      rect(this.x + len * 6.5, this.y + i * len - len/2, len, len)
    }
    
    // White details
    fill(255, 255, 255, 255)
    rect(this.x - len/2, this.y - len * 1.5, len, len)
    rect(this.x - len/2, this.y + len * 2.5, len, len)
  }
  
  reset() {
    this.x = this.startX
    this.y = this.startY
    this.gravityX = 0
    this.gravityY = 0
  }
}