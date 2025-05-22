const c = document.getElementById('gameCanvas');
const ctx = c.getContext('2d');
let pressed = {};

function fitScreen() {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}
window.addEventListener('resize', fitScreen);
fitScreen();

class Player {
  constructor(x, y, clr, keys) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.a = 0;
    this.clr = clr;
    this.k = keys;
    this.shots = [];
    this.cool = 0;
  }

  move() {
    if (pressed[this.k.left]) this.a -= 0.05;
    if (pressed[this.k.right]) this.a += 0.05;
    if (pressed[this.k.thrust]) {
      this.vx += Math.cos(this.a) * 0.05;
      this.vy += Math.sin(this.a) * 0.05;
    }
    if (pressed[this.k.fire] && this.cool <= 0) {
      this.fire();
      this.cool = 20;
    }
    this.cool--;

    // friktion
    this.vx *= 0.98;
    this.vy *= 0.98;

    this.x += this.vx;
    this.y += this.vy;

    // screen wrapping
    if (this.x < 0) this.x = c.width;
    else if (this.x > c.width) this.x = 0;
    if (this.y < 0) this.y = c.height;
    else if (this.y > c.height) this.y = 0;

    this.shots.forEach(s => s.move());
    this.shots = this.shots.filter(s => s.live());
  }

  fire() {
    this.shots.push(new Shot(this.x, this.y, this.a, this.clr));
  }

  render() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    ctx.fillStyle = this.clr;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.shots.forEach(s => s.render());
  }
}

class Shot {
  constructor(x, y, a, clr) {
    this.x = x;
    this.y = y;
    this.a = a;
    this.clr = clr;
    this.s = 5;
  }

  move() {
    this.x += Math.cos(this.a) * this.s;
    this.y += Math.sin(this.a) * this.s;
  }

  live() {
    return this.x > 0 && this.x < c.width && this.y > 0 && this.y < c.height;
  }

  render() {
    ctx.fillStyle = this.clr;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

const p1 = new Player(100, 300, 'crimson', {
  left: 'a',
  right: 'd',
  thrust: 'w',
  fire: 's'
});

const p2 = new Player(700, 300, 'royalblue', {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  thrust: 'ArrowUp',
  fire: 'ArrowDown'
});

function tick() {
  ctx.clearRect(0, 0, c.width, c.height);

  p1.move();
  p1.render();

  p2.move();
  p2.render();

  requestAnimationFrame(tick);
}

document.addEventListener('keydown', e => pressed[e.key] = true);
document.addEventListener('keyup', e => pressed[e.key] = false);

tick();

//ändra startpos för p1 o p2