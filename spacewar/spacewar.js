const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let keys = {};
let player1, player2;
let gameMode = 'pvp';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Player {
  constructor(x, y, color, controls = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.color = color;
    this.controls = controls;
    this.shots = [];
    this.cooldown = 0;
    this.hp = 3;
  }

  update(isAI = false) {
    if (!isAI) {
      if (keys[this.controls.left]) this.angle -= 0.05;
      if (keys[this.controls.right]) this.angle += 0.05;
      if (keys[this.controls.thrust]) {
        this.vx += Math.cos(this.angle) * 0.05;
        this.vy += Math.sin(this.angle) * 0.05;
      }
      if (keys[this.controls.fire] && this.cooldown <= 0) {
        this.shoot();
        this.cooldown = 20;
      }
    }

    this.cooldown--;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = canvas.width;
    else if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    else if (this.y > canvas.height) this.y = 0;

    this.shots.forEach(s => s.update());
    this.shots = this.shots.filter(s => s.isAlive());
  }

  shoot() {
    this.shots.push(new Shot(this.x, this.y, this.angle, this.color));
  }

  render() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.shots.forEach(s => s.render());
  }

  checkHit(enemyShots) {
    enemyShots.forEach((shot, i) => {
      const dx = this.x - shot.x;
      const dy = this.y - shot.y;
      if (dx * dx + dy * dy < 20 * 20) {
        this.hp--;
        enemyShots.splice(i, 1);
      }
    });
  }
}

class Shot {
  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
    this.speed = 5;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  isAlive() {
    return this.x > 0 && this.x < canvas.width && this.y > 0 && this.y < canvas.height;
  }

  render() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function aiControl(ai, target) {
  const dx = target.x - ai.x;
  const dy = target.y - ai.y;
  const targetAngle = Math.atan2(dy, dx);
  const angleDiff = ((targetAngle - ai.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

  if (angleDiff > 0.1) ai.angle += 0.03;
  else if (angleDiff < -0.1) ai.angle -= 0.03;

  if (Math.random() < 0.7) {
    ai.vx += Math.cos(ai.angle) * 0.03;
    ai.vy += Math.sin(ai.angle) * 0.03;
  }

  if (Math.abs(angleDiff) < 0.2 && ai.cooldown <= 0) {
    ai.shoot();
    ai.cooldown = 30;
  }

  ai.cooldown--;
}

function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '20px monospace';
  ctx.fillText(`Spelare 1 HP: ${player1.hp}`, 20, 30);
  ctx.fillText(`Fiende HP: ${player2.hp}`, canvas.width - 160, 30);
}

function resetGame() {
  player1.x = canvas.width * 0.25;
  player1.y = canvas.height / 2;
  player1.vx = player1.vy = 0;
  player1.angle = 0;
  player1.hp = 3;
  player1.shots = [];

  player2.x = canvas.width * 0.75;
  player2.y = canvas.height / 2;
  player2.vx = player2.vy = 0;
  player2.angle = Math.PI;
  player2.hp = 3;
  player2.shots = [];
}

function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameMode === 'pve') aiControl(player2, player1);

  player1.update();
  player1.render();
  player1.checkHit(player2.shots);

  player2.update(gameMode === 'pve');
  player2.render();
  player2.checkHit(player1.shots);

  drawHUD();

  if (player1.hp <= 0 || player2.hp <= 0) {
    ctx.fillStyle = 'white';
    ctx.font = '40px monospace';
    const winner = player1.hp > 0 ? "Spelare 1 vann!" : "Fienden vann!";
    ctx.fillText(winner, canvas.width / 2 - 120, canvas.height / 2);
    setTimeout(resetGame, 2000);
    setTimeout(tick, 2000);
    return;
  }

  requestAnimationFrame(tick);
}

function startGame(mode) {
  document.getElementById('menu').style.display = 'none';
  gameMode = mode;

  player1 = new Player(canvas.width * 0.25, canvas.height / 2, 'crimson', {
    left: 'a',
    right: 'd',
    thrust: 'w',
    fire: 's'
  });

  if (gameMode === 'pvp') {
    player2 = new Player(canvas.width * 0.75, canvas.height / 2, 'royalblue', {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      thrust: 'ArrowUp',
      fire: 'ArrowDown'
    });
  } else {
    player2 = new Player(canvas.width * 0.75, canvas.height / 2, 'royalblue');
  }

  tick();
}

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);
