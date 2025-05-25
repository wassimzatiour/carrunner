const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch control state
let touchLeft = false;
let touchRight = false;

const car = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100,
  speed: 4
};

const obstacles = [];
const obstacleSize = 30;
let obstacleSpeed = 3;

let obstacleSpawnInterval = 2000;
let obstacleSpawner;

let roadStripeOffset = 0;

let score = 0;
let highscore = localStorage.getItem('highscore') || 0;
let gameOver = false;

function spawnObstacle() {
  const x = Math.floor(Math.random() * (canvas.width - obstacleSize));
  obstacles.push({ x, y: -obstacleSize });
}

function startObstacleSpawner() {
  obstacleSpawner = setInterval(spawnObstacle, obstacleSpawnInterval);
}

function increaseDifficulty() {
  if (obstacleSpeed < 10) {
    obstacleSpeed += 0.5;
  }
  if (obstacleSpawnInterval > 500) {
    obstacleSpawnInterval -= 100;
    clearInterval(obstacleSpawner);
    startObstacleSpawner();
  }
}

setInterval(increaseDifficulty, 10000);
startObstacleSpawner();

function drawRoad() {
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const stripeWidth = 10;
  const stripeHeight = 40;
  const gap = 30;
  const stripeX = canvas.width / 2 - stripeWidth / 2;

  roadStripeOffset += 5;
  if (roadStripeOffset > stripeHeight + gap) {
    roadStripeOffset = 0;
  }

  for (let y = -stripeHeight - gap + roadStripeOffset; y < canvas.height; y += stripeHeight + gap) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(stripeX, y, stripeWidth, stripeHeight);
  }
}

function drawCar() {
  const purpleDark = '#4B0082';
  const purpleLight = '#800080';

  const px = car.x;
  const py = car.y;

  // Pixelated purple Dodge Challenger (simplified shape)
  ctx.fillStyle = purpleDark;
  ctx.fillRect(px + 5, py + 30, 30, 15);  // rear body
  ctx.fillRect(px + 0, py + 35, 10, 10);  // left rear tire
  ctx.fillRect(px + 35, py + 35, 10, 10); // right rear tire

  ctx.fillStyle = purpleLight;
  ctx.fillRect(px + 10, py + 10, 25, 25); // main body

  ctx.fillStyle = '#D8BFD8';
  ctx.fillRect(px + 15, py + 15, 15, 15); // windows

  ctx.fillStyle = '#000000';
  ctx.fillRect(px + 5, py + 45, 10, 10);  // left front tire
  ctx.fillRect(px + 30, py + 45, 10, 10); // right front tire
}

function drawObstacleCar(x, y) {
  // Small red pixel car
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + 5, y + 10, 20, 10);  // body
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 7, y + 20, 6, 6);    // wheel 1
  ctx.fillRect(x + 17, y + 20, 6, 6);   // wheel 2
}

function drawObstacleTruck(x, y) {
  // Bigger blue pixel truck
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(x, y + 5, 30, 15);       // body
  ctx.fillStyle = '#808080';
  ctx.fillRect(x + 5, y + 20, 8, 8);    // wheel 1
  ctx.fillRect(x + 20, y + 20, 8, 8);   // wheel 2
}

function drawObstacles() {
  obstacles.forEach((obstacle, i) => {
    if (i % 2 === 0) {
      drawObstacleCar(obstacle.x, obstacle.y);
    } else {
      drawObstacleTruck(obstacle.x, obstacle.y);
    }
  });
}

function updateObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].y += obstacleSpeed;
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }
}

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + obstacleSize &&
    rect1.x + 40 > rect2.x &&
    rect1.y < rect2.y + obstacleSize &&
    rect1.y + 60 > rect2.y
  );
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
}

function drawHighscore() {
  ctx.fillStyle = 'gold';
  ctx.font = '20px Arial';
  ctx.textAlign = 'right';

  const text = `Highscore: ${Math.floor(highscore)}`;
  const x = canvas.width - 50;
  const y = 30;

  // Draw simple cup (triangle trophy)
  ctx.fillStyle = 'gold';
  ctx.beginPath();
  ctx.moveTo(x - 25, y - 12);
  ctx.lineTo(x - 10, y - 12);
  ctx.lineTo(x - 15, y + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.fillText(text, x, y);
}

function drawMadeBy() {
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Made by: Wassim Zatiour', 20, canvas.height - 20);
}

// Touch controls for mobile
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const touch of e.touches) {
    if (touch.clientX < canvas.width / 2) {
      touchLeft = true;
    } else {
      touchRight = true;
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchLeft = false;
  touchRight = false;
}, { passive: false });

function update() {
  if (keys.ArrowLeft || touchLeft) {
    car.x -= car.speed;
  }
  if (keys.ArrowRight || touchRight) {
    car.x += car.speed;
  }
  if (car.x < 0) car.x = 0;
  if (car.x > canvas.width - 40) car.x = canvas.width - 40;

  updateObstacles();

  // Collision detection
  for (const obstacle of obstacles) {
    if (isColliding(car, obstacle)) {
      gameOver = true;
      break;
    }
  }

  if (!gameOver) {
    score += 0.05;
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('highscore', highscore);
    }
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '24px Arial';
  ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

function gameLoop() {
  drawRoad();
  drawCar();
  drawObstacles();
  drawScore();
  drawHighscore();
  drawMadeBy();

  if (gameOver) {
    drawGameOver();
  } else {
    update();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e => {
  if (gameOver && (e.key === 'r' || e.key === 'R')) {
    resetGame();
  }
});

function resetGame() {
  obstacles.length = 0;
  score = 0;
  obstacleSpeed = 3;
  obstacleSpawnInterval = 2000;
  gameOver = false;
  clearInterval(obstacleSpawner);
  startObstacleSpawner();
  roadStripeOffset = 0;
  car.x = canvas.width / 2 - 20;
}

gameLoop();
