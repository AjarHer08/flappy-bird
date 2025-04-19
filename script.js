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
// Add flag for full leaderboard view
let isPaused = false;
let isGameStarted = false;
let isLeaderboardView = false;
let isAndroid = /Android/i.test(navigator.userAgent);
let isDesktop = !isAndroid;

// Load highScore and leaderboard from localStorage
// Store leaderboard as array of objects {name, score}
let leaderboard = [];
let playerName = 'Player';

// Prompt for player name at game start
function promptPlayerName() {
  const name = prompt('Enter your name:', 'Player');
  console.log('Player name entered:', name); // Debug log
  if (name && name.trim() !== '') {
    playerName = name.trim();
  } else {
    console.log('No valid player name entered, using default:', playerName);
  }
}

function loadData() {
  const storedHighScore = localStorage.getItem('flappyHighScore');
  if (storedHighScore) {
    highScore = parseInt(storedHighScore, 10);
  }
  const storedLeaderboard = localStorage.getItem('flappyLeaderboard');
  if (storedLeaderboard) {
    leaderboard = JSON.parse(storedLeaderboard);
  }
}

// Save highScore and leaderboard to localStorage
function saveData() {
  localStorage.setItem('flappyHighScore', highScore.toString());
  localStorage.setItem('flappyLeaderboard', JSON.stringify(leaderboard));
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

  if (!isLeaderboardView) {
    // Draw leaderboard below scores (top few)
    ctx.fillText('Leaderboard:', 10, 90);
    ctx.font = '16px Arial';
    // Sort leaderboard descending by score
    const sortedLeaderboard = leaderboard.slice().sort((a, b) => b.score - a.score);
    for (let i = 0; i < Math.min(5, sortedLeaderboard.length); i++) {
      const entry = sortedLeaderboard[i];
      ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, 10, 110 + i * 20);
    }
  }
}

function drawFullLeaderboard() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('Full Leaderboard (Top 100)', 20, 40);

  ctx.font = '18px Arial';
  const sortedLeaderboard = leaderboard.slice().sort((a, b) => b.score - a.score);
  const maxEntries = Math.min(100, sortedLeaderboard.length);
  for (let i = 0; i < maxEntries; i++) {
    const entry = sortedLeaderboard[i];
    ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, 20, 70 + i * 25);
  }

  ctx.font = '16px Arial';
  ctx.fillText('Press L to close leaderboard', 20, canvas.height - 30);
}

function resetGame() {
  // Update highScore only if current score is greater
  if (score > highScore) {
    highScore = score;
  }
  // Add current player's name and score to leaderboard if > 0
  if (score > 0) {
    // Check if player already exists in leaderboard
    const existingIndex = leaderboard.findIndex(entry => entry.name === playerName);
    if (existingIndex !== -1) {
      // Update score if current score is higher
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = score;
      }
    } else {
      // Add new player entry
      leaderboard.push({ name: playerName, score: score });
    }
  }
  // Sort leaderboard descending by score
  leaderboard.sort((a, b) => b.score - a.score);
  saveData();

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

  if (!isGameStarted) {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('silahkan tap apapun untuk memulai gamenya', 20, canvas.height / 2);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (isLeaderboardView) {
    drawFullLeaderboard();
    requestAnimationFrame(gameLoop);
    return;
  }

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

pauseButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  togglePause();
});

function startGame() {
  if (!isGameStarted) {
    isGameStarted = true;
    gameLoop();
  }
}

window.addEventListener('click', startGame);
window.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startGame();
}, { passive: false });

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
  } else if (e.code === 'KeyR') {
    // Reset leaderboard on pressing 'R'
    resetLeaderboard();
  } else if (e.code === 'KeyL') {
    // Toggle full leaderboard view on pressing 'L'
    isLeaderboardView = !isLeaderboardView;
    if (!isLeaderboardView && !isPaused && !gameOver) {
      gameLoop();
    }
  }
});

// Function to reset leaderboard
function resetLeaderboard() {
  leaderboard = [];
  saveData();
}

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

// Load data and prompt player name immediately for all platforms
loadData();
promptPlayerName();

document.addEventListener('DOMContentLoaded', () => {
  // Add Android-specific leaderboard button
  if (isAndroid) {
    const leaderboardButton = document.createElement('button');
    leaderboardButton.textContent = 'Show Leaderboard';
    leaderboardButton.style.position = 'fixed';
    leaderboardButton.style.top = '10px';
    leaderboardButton.style.right = '10px';
    leaderboardButton.style.zIndex = '10000'; // Increased z-index for better layering
    leaderboardButton.style.padding = '18px 24px';
    leaderboardButton.style.fontSize = '20px';
    leaderboardButton.style.fontWeight = 'bold';
    leaderboardButton.style.backgroundColor = '#0056b3'; // Darker blue for better contrast
    leaderboardButton.style.color = 'white';
    leaderboardButton.style.border = 'none';
    leaderboardButton.style.borderRadius = '10px';
    leaderboardButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
    leaderboardButton.style.opacity = '1';
    leaderboardButton.style.cursor = 'pointer';
    leaderboardButton.style.pointerEvents = 'auto'; // Ensure pointer events enabled
    leaderboardButton.style.touchAction = 'manipulation'; // Improve touch responsiveness

    leaderboardButton.addEventListener('click', () => {
      console.log('Leaderboard button clicked'); // Debug log
      isLeaderboardView = !isLeaderboardView;
      if (!isLeaderboardView && !isPaused && !gameOver) {
        gameLoop();
      }
      leaderboardButton.textContent = isLeaderboardView ? 'Hide Leaderboard' : 'Show Leaderboard';
    });

    document.body.appendChild(leaderboardButton);
  }

  // Add desktop leaderboard button
  if (isDesktop) {
    const desktopLeaderboardButton = document.createElement('button');
    desktopLeaderboardButton.textContent = 'Show Leaderboard';
    desktopLeaderboardButton.style.position = 'fixed';
    desktopLeaderboardButton.style.top = '10px';
    desktopLeaderboardButton.style.right = '10px';
    desktopLeaderboardButton.style.zIndex = '10000';
    desktopLeaderboardButton.style.padding = '12px 18px';
    desktopLeaderboardButton.style.fontSize = '16px';
    desktopLeaderboardButton.style.fontWeight = 'bold';
    desktopLeaderboardButton.style.backgroundColor = '#28a745'; // Green color for desktop
    desktopLeaderboardButton.style.color = 'white';
    desktopLeaderboardButton.style.border = 'none';
    desktopLeaderboardButton.style.borderRadius = '8px';
    desktopLeaderboardButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    desktopLeaderboardButton.style.opacity = '0.95';
    desktopLeaderboardButton.style.cursor = 'pointer';

    desktopLeaderboardButton.addEventListener('click', () => {
      isLeaderboardView = !isLeaderboardView;
      if (!isLeaderboardView && !isPaused && !gameOver) {
        gameLoop();
      }
      desktopLeaderboardButton.textContent = isLeaderboardView ? 'Hide Leaderboard' : 'Show Leaderboard';
    });

    document.body.appendChild(desktopLeaderboardButton);
  }
});
