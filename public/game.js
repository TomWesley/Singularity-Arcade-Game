class Game {
  constructor() {
    this.DESIGN_WIDTH = 1280
    this.DESIGN_HEIGHT = 720
    this.scaleX = 1
    this.scaleY = 1
    this.offsetX = 0
    this.offsetY = 0
    
    this.currentLevel = 1
    this.levelData = null
    this.gameState = 'START'
    this.lives = 3
    this.selectedCraft = null
    
    this.stars = []
    this.blackHoles = []
    this.asteroids = []
    this.player = null
    this.specialItems = []
    
    this.timer = 0
    this.finishLineAlpha = 0
    this.levelChangeTimer = 0
    this.craftLostTimer = 0
    
    this.font = null
    
    this.initializeStars()
  }
  
  setupCanvas() {
    let canvas = createCanvas(windowWidth, windowHeight)
    this.calculateScaling()
    return canvas
  }
  
  calculateScaling() {
    let aspectRatio = this.DESIGN_WIDTH / this.DESIGN_HEIGHT
    let windowAspectRatio = windowWidth / windowHeight
    
    if (windowAspectRatio > aspectRatio) {
      this.scaleY = windowHeight / this.DESIGN_HEIGHT
      this.scaleX = this.scaleY
      this.offsetX = (windowWidth - (this.DESIGN_WIDTH * this.scaleX)) / 2
      this.offsetY = 0
    } else {
      this.scaleX = windowWidth / this.DESIGN_WIDTH
      this.scaleY = this.scaleX
      this.offsetX = 0
      this.offsetY = (windowHeight - (this.DESIGN_HEIGHT * this.scaleY)) / 2
    }
  }
  
  transformCoordinates(x, y) {
    return {
      x: x * this.scaleX + this.offsetX,
      y: y * this.scaleY + this.offsetY
    }
  }
  
  transformSize(size) {
    return size * Math.min(this.scaleX, this.scaleY)
  }
  
  initializeStars() {
    for (let i = 0; i < 500; i++) {
      this.stars.push(new Star(this.DESIGN_WIDTH, this.DESIGN_HEIGHT))
    }
  }
  
  async loadLevel(levelNumber) {
    try {
      const response = await fetch(`levels/level${levelNumber}.json`)
      this.levelData = await response.json()
      this.setupLevel()
      console.log(`Level ${levelNumber} loaded successfully`)
    } catch (error) {
      console.error(`Failed to load level ${levelNumber}:`, error)
    }
  }
  
  setupLevel() {
    if (!this.levelData) return
    
    this.blackHoles = []
    this.asteroids = []
    this.specialItems = []
    
    // Setup black holes
    this.levelData.blackHoles.forEach(bhData => {
      let bh = new BlackHole(
        bhData.x * this.DESIGN_WIDTH,
        bhData.y * this.DESIGN_HEIGHT,
        bhData.size * this.DESIGN_HEIGHT,
        bhData.isMoving,
        bhData.moveAngle,
        bhData.moveRadius * this.DESIGN_HEIGHT
      )
      this.blackHoles.push(bh)
    })
    
    // Setup asteroids
    const asteroidData = this.levelData.asteroids
    for (let i = 0; i < asteroidData.count; i++) {
      let asteroid = new Asteroid(
        this.DESIGN_WIDTH * 1.1,
        random(this.DESIGN_HEIGHT),
        random(-2, -1),
        random(-2, 2),
        this.DESIGN_WIDTH / 140,
        this.DESIGN_WIDTH,
        this.DESIGN_HEIGHT
      )
      this.asteroids.push(asteroid)
    }
    
    // Setup special items
    if (this.levelData.specialItems) {
      this.levelData.specialItems.forEach(item => {
        if (item.type === 'extraLife' && item.active) {
          this.specialItems.push({
            type: 'extraLife',
            x: item.x * this.DESIGN_WIDTH,
            y: item.y * this.DESIGN_HEIGHT,
            active: true
          })
        }
      })
    }
    
    // Reset player position
    if (this.player) {
      this.player.reset()
    }
  }
  
  update() {
    this.timer++
    this.finishLineAlpha = (this.finishLineAlpha + 2) % 255
    
    switch (this.gameState) {
      case 'START':
        this.updateStartScreen()
        break
      case 'CRAFT_SELECT':
        this.updateCraftSelection()
        break
      case 'PLAYING':
        this.updateGameplay()
        break
      case 'LEVEL_COMPLETE':
        this.updateLevelComplete()
        break
      case 'GAME_OVER':
        this.updateGameOver()
        break
      case 'VICTORY':
        this.updateVictory()
        break
      case 'CRAFT_LOST':
        this.updateCraftLost()
        break
    }
  }
  
  updateStartScreen() {
    for (let star of this.stars) {
      star.update()
    }
  }
  
  updateCraftSelection() {
    for (let star of this.stars) {
      star.update()
    }
  }
  
  updateGameplay() {
    if (!this.levelData || !this.player) return
    
    // Update stars
    for (let star of this.stars) {
      star.update()
    }
    
    // Update black holes
    for (let bh of this.blackHoles) {
      bh.move()
    }
    
    // Update asteroids
    for (let asteroid of this.asteroids) {
      asteroid.move()
    }
    
    // Update player with gravity
    this.updateGravity()
    this.player.update()
    
    // Check collisions
    this.checkCollisions()
    
    // Check level completion
    this.checkLevelCompletion()
    
    // Update special items
    this.updateSpecialItems()
  }
  
  updateGravity() {
    if (!this.player) return
    
    let totalGravityX = 0
    let totalGravityY = 0
    const gConstant = 300
    
    for (let bh of this.blackHoles) {
      let distance = dist(bh.x, bh.y, this.player.x, this.player.y)
      let force = (this.player.mass * gConstant * bh.mass) / (distance * distance + 1)
      
      let denom = abs(this.player.x - bh.x) + abs(this.player.y - bh.y) + 1
      let ratioX = (bh.x - this.player.x) / denom
      let ratioY = (bh.y - this.player.y) / denom
      
      totalGravityX += ratioX * force
      totalGravityY += ratioY * force
      
      // Apply gravity to asteroids
      for (let asteroid of this.asteroids) {
        let asteroidDistance = dist(bh.x, bh.y, asteroid.x, asteroid.y)
        if (asteroidDistance < bh.size / 2) {
          asteroid.reset()
          continue
        }
        
        let asteroidForce = (asteroid.mass * gConstant * bh.mass) / (asteroidDistance * asteroidDistance + 1)
        let asteroidDenom = abs(asteroid.x - bh.x) + abs(asteroid.y - bh.y) + 1
        let asteroidRatioX = (bh.x - asteroid.x) / asteroidDenom
        let asteroidRatioY = (bh.y - asteroid.y) / asteroidDenom
        
        asteroid.vx += asteroidRatioX * asteroidForce
        asteroid.vy += asteroidRatioY * asteroidForce
      }
    }
    
    this.player.applyGravity(totalGravityX, totalGravityY)
  }
  
  checkCollisions() {
    // Check black hole collisions
    for (let bh of this.blackHoles) {
      let distance = dist(bh.x, bh.y, this.player.x, this.player.y)
      if (distance < bh.size / 2) {
        this.craftLost()
        return
      }
    }
    
    // Check asteroid collisions
    for (let asteroid of this.asteroids) {
      let distance = dist(asteroid.x, asteroid.y, this.player.x, this.player.y)
      if (distance < (asteroid.size + 10) / 2) {
        this.craftLost()
        return
      }
    }
  }
  
  checkLevelCompletion() {
    if (!this.levelData.finishLine) return
    
    let finishLine = this.levelData.finishLine
    let finishX = finishLine.x * this.DESIGN_WIDTH
    let finishY = finishLine.y * this.DESIGN_HEIGHT
    let finishWidth = finishLine.width * this.DESIGN_WIDTH
    let finishHeight = finishLine.height * this.DESIGN_HEIGHT
    
    if (this.player.x > finishX - finishWidth/2 && 
        this.player.x < finishX + finishWidth/2 &&
        this.player.y > finishY - finishHeight/2 && 
        this.player.y < finishY + finishHeight/2) {
      this.levelComplete()
    }
  }
  
  updateSpecialItems() {
    for (let item of this.specialItems) {
      if (item.active && item.type === 'extraLife') {
        let distance = dist(item.x, item.y, this.player.x, this.player.y)
        if (distance < 35) {
          this.lives++
          item.active = false
        }
      }
    }
  }
  
  updateLevelComplete() {
    this.levelChangeTimer++
    if (this.levelChangeTimer > 50) {
      this.nextLevel()
    }
  }
  
  updateCraftLost() {
    this.craftLostTimer++
    if (this.craftLostTimer > 105) {
      if (this.lives > 0) {
        this.lives--
        this.player.reset()
        this.gameState = 'PLAYING'
        this.craftLostTimer = 0
      } else {
        this.gameState = 'GAME_OVER'
      }
    }
  }
  
  updateGameOver() {
    // Animation for game over screen
  }
  
  updateVictory() {
    // Animation for victory screen
  }
  
  draw() {
    background(0)
    
    // Apply transformation for responsive scaling
    push()
    translate(this.offsetX, this.offsetY)
    scale(this.scaleX, this.scaleY)
    
    switch (this.gameState) {
      case 'START':
        this.drawStartScreen()
        break
      case 'CRAFT_SELECT':
        this.drawCraftSelection()
        break
      case 'PLAYING':
        this.drawGameplay()
        break
      case 'LEVEL_COMPLETE':
        this.drawLevelComplete()
        break
      case 'CRAFT_LOST':
        this.drawCraftLost()
        break
      case 'GAME_OVER':
        this.drawGameOver()
        break
      case 'VICTORY':
        this.drawVictory()
        break
    }
    
    pop()
  }
  
  drawStartScreen() {
    this.drawStars()
    
    if (this.font) textFont(this.font)
    fill(255, 240, 0)
    textAlign(CENTER)
    textSize(this.DESIGN_WIDTH / 10)
    text('SINGULARITY', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    
    textSize(this.DESIGN_WIDTH / 20)
    text('Click to Continue', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT * 0.7)
  }
  
  drawCraftSelection() {
    this.drawStars()
    
    if (this.font) textFont(this.font)
    fill(255, 240, 0)
    textAlign(CENTER)
    textSize(this.DESIGN_HEIGHT / 12)
    text('Select A Surfer', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 6)
    
    // Draw craft options here
    this.drawCraftOptions()
  }
  
  drawCraftOptions() {
    let craftNames = ['Superbug', 'Psych Bike', 'The Compiler', 'Voidwalker']
    let spacing = this.DESIGN_HEIGHT / 5
    
    textAlign(LEFT)
    textSize(this.DESIGN_HEIGHT / 20)
    fill(255)
    
    for (let i = 0; i < craftNames.length; i++) {
      let y = this.DESIGN_HEIGHT * 0.3 + i * spacing * 0.4
      text(craftNames[i], this.DESIGN_WIDTH * 0.25, y)
      
      // Highlight on hover
      let mousePos = this.getScaledMousePosition()
      if (mousePos.y > y - spacing * 0.2 && mousePos.y < y + spacing * 0.2) {
        fill(255, 150)
        noStroke()
        rect(0, y - spacing * 0.2, this.DESIGN_WIDTH, spacing * 0.4)
        fill(255)
      }
    }
  }
  
  drawGameplay() {
    this.drawStars()
    this.drawFinishLine()
    
    // Draw black holes
    for (let bh of this.blackHoles) {
      bh.draw()
    }
    
    // Draw asteroids
    for (let asteroid of this.asteroids) {
      asteroid.draw()
    }
    
    // Draw special items
    for (let item of this.specialItems) {
      if (item.active && item.type === 'extraLife') {
        this.drawExtraLife(item.x, item.y)
      }
    }
    
    // Draw player
    if (this.player) {
      this.player.draw()
    }
    
    // Draw UI
    this.drawUI()
  }
  
  drawFinishLine() {
    if (!this.levelData || !this.levelData.finishLine) return
    
    let finishLine = this.levelData.finishLine
    let x = finishLine.x * this.DESIGN_WIDTH
    let y = finishLine.y * this.DESIGN_HEIGHT
    let w = finishLine.width * this.DESIGN_WIDTH
    let h = finishLine.height * this.DESIGN_HEIGHT
    
    noStroke()
    fill(255, 240, 10, this.finishLineAlpha)
    
    // Draw animated finish line
    for (let i = 0; i < 3; i++) {
      let alpha = this.finishLineAlpha - (i * 80)
      if (alpha > 0) {
        fill(255, 240, 10, alpha)
        let offset = i * w * 0.1
        rect(x - w/2 - offset, y - h/2, w * 0.3, h)
        rect(x + w/2 + offset - w * 0.3, y - h/2, w * 0.3, h)
      }
    }
  }
  
  drawExtraLife(x, y) {
    let len = this.DESIGN_WIDTH / 320
    
    // Glowing effect
    fill(210, 255, 220, 4)
    noStroke()
    for (let i = 25; i < 65; i++) {
      ellipse(x, y, i, i)
    }
    
    // Extra life sprite (simplified)
    fill(120, 255, 140, 255)
    noStroke()
    rect(x - len * 2, y - len * 3, len * 4, len * 6)
    fill(255, 255, 255, 255)
    rect(x - len, y - len * 2, len * 2, len * 4)
  }
  
  drawUI() {
    fill(255, 240, 0)
    textAlign(LEFT)
    textSize(this.DESIGN_HEIGHT / 25)
    text(`Level: ${this.currentLevel}`, 20, 30)
    text(`Lives: ${this.lives}`, 20, 60)
  }
  
  drawStars() {
    push()
    translate(this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    for (let star of this.stars) {
      star.show()
    }
    pop()
  }
  
  drawLevelComplete() {
    this.drawGameplay()
    
    fill(255, 240, 0)
    textAlign(CENTER)
    textSize(this.DESIGN_HEIGHT / 8)
    text('Level Complete', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    
    fill(150, 250, 180, 35)
    noStroke()
    rect(0, 0, this.DESIGN_WIDTH, this.DESIGN_HEIGHT)
  }
  
  drawCraftLost() {
    this.drawGameplay()
    
    fill(255, 240, 0)
    textAlign(CENTER)
    textSize(this.DESIGN_HEIGHT / 6)
    text('Craft Lost', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    
    if (this.craftLostTimer < 10) {
      fill(240, 140, 255, 7)
      noStroke()
      rect(0, 0, this.DESIGN_WIDTH, this.DESIGN_HEIGHT)
    }
  }
  
  drawGameOver() {
    background(255, 240, 0)
    
    fill(0)
    textAlign(CENTER)
    textSize(this.DESIGN_HEIGHT / 6)
    text('Game Over', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    
    textSize(this.DESIGN_HEIGHT / 20)
    text('Click to Restart', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT * 0.7)
  }
  
  drawVictory() {
    background(0)
    
    this.drawStars()
    
    fill(255, 240, 0)
    textAlign(CENTER)
    textSize(this.DESIGN_HEIGHT / 6)
    text('Victory!', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 3)
    
    textSize(this.DESIGN_HEIGHT / 20)
    text('You completed all levels!', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2)
    text('Click to Restart', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT * 0.7)
  }
  
  // Input handling
  getScaledMousePosition() {
    return {
      x: (mouseX - this.offsetX) / this.scaleX,
      y: (mouseY - this.offsetY) / this.scaleY
    }
  }
  
  handleClick() {
    let mousePos = this.getScaledMousePosition()
    
    switch (this.gameState) {
      case 'START':
        this.gameState = 'CRAFT_SELECT'
        break
      case 'CRAFT_SELECT':
        this.handleCraftSelection(mousePos)
        break
      case 'GAME_OVER':
      case 'VICTORY':
        this.restart()
        break
    }
  }
  
  handleCraftSelection(mousePos) {
    let spacing = this.DESIGN_HEIGHT / 5
    
    for (let i = 0; i < 4; i++) {
      let y = this.DESIGN_HEIGHT * 0.3 + i * spacing * 0.4
      if (mousePos.y > y - spacing * 0.2 && mousePos.y < y + spacing * 0.2) {
        this.selectedCraft = i
        this.startGame()
        break
      }
    }
  }
  
  async startGame() {
    this.currentLevel = 1
    this.lives = 3
    this.player = new Player(this.DESIGN_WIDTH / 12, this.DESIGN_HEIGHT / 2, this.selectedCraft)
    await this.loadLevel(this.currentLevel)
    this.gameState = 'PLAYING'
  }
  
  levelComplete() {
    this.gameState = 'LEVEL_COMPLETE'
    this.levelChangeTimer = 0
  }
  
  async nextLevel() {
    this.currentLevel++
    if (this.currentLevel > 10) {
      this.gameState = 'VICTORY'
    } else {
      await this.loadLevel(this.currentLevel)
      this.gameState = 'PLAYING'
    }
  }
  
  craftLost() {
    this.gameState = 'CRAFT_LOST'
    this.craftLostTimer = 0
  }
  
  restart() {
    this.currentLevel = 1
    this.lives = 3
    this.selectedCraft = null
    this.player = null
    this.gameState = 'START'
    this.timer = 0
    this.levelChangeTimer = 0
    this.craftLostTimer = 0
  }
  
  windowResized() {
    resizeCanvas(windowWidth, windowHeight)
    this.calculateScaling()
  }
}