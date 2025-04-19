const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pauseButton');

const bird = {
  x: 50,
  y: 150,
  width: 34,
  height: 24,
  gravity: 0.6,
  lift: -10,
  velocity: 0,
};

const pipes = [];
const pipeWidth = 20;
const pipeGap = 230;
let frameCount = 0;
let score = 0;
let highScore = 0;
let gameOver = false;
let baseSpeed = 1.0;
let speed = baseSpeed;
let isPaused = false;

// Load highScore from localStorage
function loadData() {
  const storedHighScore = localStorage.getItem('flappyHighScore');
  if (storedHighScore) {
    highScore = parseInt(storedHighScore, 10);
  }
}

// Save highScore to localStorage
function saveData() {
  localStorage.setItem('flappyHighScore', highScore.toString());
}

function drawBird() {
  ctx.fillStyle = 'yellow';
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  ctx.fillStyle = 'green';
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
  });
}

function updatePipes() {
  if (frameCount % 60 === 0) {
    const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 20;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + pipeGap,
    });
  }
  pipes.forEach(pipe => {
    pipe.x -= speed;
  });
  if (pipes.length && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
    score++;
    // Increase speed slowly as score increases
    speed = baseSpeed + score * 0.03;
  }
}

function checkCollision() {
  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    gameOver = true;
  }
  pipes.forEach(pipe => {
    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.bottom)
    ) {
      gameOver = true;
    }
  });
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
  ctx.fillText('High Score: ' + highScore, 10, 60);
}

function resetGame() {
  if (score > highScore) {
    highScore = score;
  }
  bird.y = 150;
  bird.velocity = 0;
  pipes.length = 0;
  frameCount = 0;
  score = 0;
  speed = baseSpeed;
  gameOver = false;
}

function drawPaused() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '40px Arial';
  ctx.fillText('Paused', canvas.width / 2 - 60, canvas.height / 2);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isPaused) {
    drawPaused();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText('Semangat Kakak', canvas.width / 2 - 80, canvas.height / 2 - 10);
    ctx.fillText('Untuk Dapat Score Bagus', canvas.width / 2 - 110, canvas.height / 2 + 20);
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2 - 40, canvas.height / 2 + 50);
    return;
  }

  drawBird();
  drawPipes();
  drawScore();

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  updatePipes();
  checkCollision();

  frameCount++;
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? '▶' : '||';
  if (!isPaused && !gameOver) {
    gameLoop();
  }
}

pauseButton.addEventListener('click', () => {
  togglePause();
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    if (gameOver) {
      resetGame();
      gameLoop();
    } else if (!isPaused) {
      bird.velocity = bird.lift;
    }
  } else if (e.code === 'Escape') {
    togglePause();
  }
});

// Add touch event for mobile devices
window.addEventListener('touchstart', e => {
  e.preventDefault();
  if (gameOver) {
    resetGame();
    gameLoop();
  } else if (!isPaused) {
    bird.velocity = bird.lift;
  }
}, { passive: false });

loadData();
gameLoop();
