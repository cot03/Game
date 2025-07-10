class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.gameSpeed = 150; // milliseconds between updates
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // Snake properties
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.snakeLength = 1;
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        
        // Food properties
        this.food = this.generateFood();
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScoreElement = document.getElementById('finalScore');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Mobile touch controls
        this.upBtn = document.getElementById('upBtn');
        this.downBtn = document.getElementById('downBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        
        // Touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        this.initializeGame();
        this.setupEventListeners();
        this.updateHighScoreDisplay();
        this.adjustCanvasForMobile();
    }
    
    adjustCanvasForMobile() {
        // Adjust canvas size for mobile devices
        if (window.innerWidth <= 480) {
            this.canvas.width = 280;
            this.canvas.height = 280;
        } else if (window.innerWidth <= 768) {
            this.canvas.width = 320;
            this.canvas.height = 320;
        }
        
        // Recalculate tile count based on new canvas size
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Adjust snake position if needed
        if (this.snake[0].x >= this.tileCount) {
            this.snake[0].x = Math.floor(this.tileCount / 2);
        }
        if (this.snake[0].y >= this.tileCount) {
            this.snake[0].y = Math.floor(this.tileCount / 2);
        }
        
        // Regenerate food if it's outside the new bounds
        if (this.food.x >= this.tileCount || this.food.y >= this.tileCount) {
            this.food = this.generateFood();
        }
    }
    
    initializeGame() {
        this.drawGame();
    }
    
    setupEventListeners() {
        // Button event listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        
        // Mobile touch control buttons
        this.upBtn.addEventListener('click', () => this.handleTouchControl('up'));
        this.downBtn.addEventListener('click', () => this.handleTouchControl('down'));
        this.leftBtn.addEventListener('click', () => this.handleTouchControl('left'));
        this.rightBtn.addEventListener('click', () => this.handleTouchControl('right'));
        
        // Touch controls with haptic feedback
        this.upBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchControl('up');
            this.vibrate();
        });
        this.downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchControl('down');
            this.vibrate();
        });
        this.leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchControl('left');
            this.vibrate();
        });
        this.rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchControl('right');
            this.vibrate();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Swipe gestures for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent default touch behaviors
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.touch-btn') || e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.touch-btn') || e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent arrow keys from scrolling the page
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustCanvasForMobile();
                this.drawGame();
            }, 100);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.adjustCanvasForMobile();
            this.drawGame();
        });
    }
    
    vibrate() {
        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    handleTouchControl(direction) {
        if (!this.gameRunning || this.gamePaused) return;
        
        let newDx = this.dx;
        let newDy = this.dy;
        
        switch (direction) {
            case 'up':
                if (this.dy !== 1) {
                    newDx = 0;
                    newDy = -1;
                }
                break;
            case 'down':
                if (this.dy !== -1) {
                    newDx = 0;
                    newDy = 1;
                }
                break;
            case 'left':
                if (this.dx !== 1) {
                    newDx = -1;
                    newDy = 0;
                }
                break;
            case 'right':
                if (this.dx !== -1) {
                    newDx = 1;
                    newDy = 0;
                }
                break;
        }
        
        this.nextDx = newDx;
        this.nextDy = newDy;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.gameRunning || this.gamePaused) return;
        
        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        // Minimum swipe distance
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.handleTouchControl('right');
                } else {
                    this.handleTouchControl('left');
                }
                this.vibrate();
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.handleTouchControl('down');
                } else {
                    this.handleTouchControl('up');
                }
                this.vibrate();
            }
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        let newDx = this.dx;
        let newDy = this.dy;
        
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.dy !== 1) { // Prevent moving opposite direction
                    newDx = 0;
                    newDy = -1;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.dy !== -1) {
                    newDx = 0;
                    newDy = 1;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.dx !== 1) {
                    newDx = -1;
                    newDy = 0;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.dx !== -1) {
                    newDx = 1;
                    newDy = 0;
                }
                break;
        }
        
        // Update direction for next frame
        this.nextDx = newDx;
        this.nextDy = newDy;
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        // Start the game loop
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        this.pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.snake = [{ x: Math.floor(this.tileCount / 2), y: Math.floor(this.tileCount / 2) }];
        this.snakeLength = 1;
        this.dx = 0;
        this.dy = 0;
        this.nextDx = 0;
        this.nextDy = 0;
        this.food = this.generateFood();
        this.gameSpeed = 150; // Reset game speed
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        
        this.updateScoreDisplay();
        this.drawGame();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.update();
        this.drawGame();
        
        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }
    
    update() {
        // Update snake direction
        this.dx = this.nextDx;
        this.dy = this.nextDy;
        
        // Don't update if snake is not moving
        if (this.dx === 0 && this.dy === 0) return;
        
        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.dx;
        head.y += this.dy;
        
        // Check for wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check for self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check for food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.snakeLength++;
            this.food = this.generateFood();
            this.updateScoreDisplay();
            this.vibrate(); // Haptic feedback for eating food
            
            // Increase game speed slightly
            if (this.gameSpeed > 50) {
                this.gameSpeed -= 2;
            }
        } else {
            // Remove tail if no food was eaten
            this.snake.pop();
        }
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }
    
    drawGame() {
        // Clear canvas with dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle white lines)
        this.drawGrid();
        
        // Draw snake
        this.drawSnake();
        
        // Draw food
        this.drawFood();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Draw head with bright white glow
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = 15;
            } else {
                // Draw body segments with decreasing brightness
                const brightness = Math.max(100, 255 - (index * 15));
                this.ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                this.ctx.shadowColor = `rgb(${brightness}, ${brightness}, ${brightness})`;
                this.ctx.shadowBlur = Math.max(3, 10 - (index * 0.5));
            }
            
            // Draw rounded rectangle for snake segments
            const x = segment.x * this.gridSize + 1;
            const y = segment.y * this.gridSize + 1;
            const size = this.gridSize - 2;
            const radius = 4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + size - radius, y);
            this.ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            this.ctx.lineTo(x + size, y + size - radius);
            this.ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            this.ctx.lineTo(x + radius, y + size);
            this.ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    drawFood() {
        // Create pulsing effect for food
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        const brightness = Math.floor(255 * pulse);
        
        this.ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        this.ctx.shadowColor = `rgb(${brightness}, ${brightness}, ${brightness})`;
        this.ctx.shadowBlur = 20;
        
        // Draw diamond-shaped food
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const size = this.gridSize / 2 - 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size);
        this.ctx.lineTo(centerX + size, centerY);
        this.ctx.lineTo(centerX, centerY + size);
        this.ctx.lineTo(centerX - size, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add inner highlight
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - size * 0.6);
        this.ctx.lineTo(centerX + size * 0.6, centerY);
        this.ctx.lineTo(centerX, centerY + size * 0.6);
        this.ctx.lineTo(centerX - size * 0.6, centerY);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        // Haptic feedback for game over
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Update high score if necessary
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        // Update UI
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        
        // Show game over modal
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.style.display = 'block';
    }
    
    playAgain() {
        this.gameOverModal.style.display = 'none';
        this.resetGame();
        this.startGame();
    }
    
    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 