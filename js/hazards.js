import { CONFIG } from './config.js';

export class Seagull {
  constructor(y, direction = 1) {
    this.width = 36;
    this.height = 18;
    this.direction = direction;
    this.x = direction === 1 ? -this.width : CONFIG.CANVAS_WIDTH + this.width;
    this.y = y;
    this.speed = (CONFIG.SEAGULL_SPEED + Math.random() * 40) * direction;
    this.wingAngle = 0;
    this.hasCollided = false;
  }

  update(dt) {
    this.x += this.speed * dt;
    this.wingAngle += dt * 12; 
  }

  isOutOfScreen() {
    return this.direction === 1 ? this.x > CONFIG.CANVAS_WIDTH + 60 : this.x < -60;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.y, this.height)) return;
    const renderY = this.y - camera.y;

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const wingY = Math.sin(this.wingAngle) * 7;
    ctx.beginPath();
    ctx.moveTo(-16, wingY);
    ctx.quadraticCurveTo(-8, -4, 0, 2);
    ctx.quadraticCurveTo(8, -4, 16, wingY);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(this.direction * 3, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Whirlwind {
  constructor(y) {
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = y;
    this.radius = CONFIG.WHIRLWIND_RADIUS;
    this.speed = 80;
    this.direction = 1;
    this.rotation = 0;
  }

  update(dt) {
    this.x += this.direction * this.speed * dt;
    if (this.x - this.radius <= 10) {
      this.x = 10 + this.radius;
      this.direction = 1;
    } else if (this.x + this.radius >= CONFIG.CANVAS_WIDTH - 10) {
      this.x = CONFIG.CANVAS_WIDTH - 10 - this.radius;
      this.direction = -1;
    }
    this.rotation += dt * 6;
  }

  applyForce(block, dt) {
    const blockCenter = block.x + block.width / 2;
    const dist = Math.abs(blockCenter - this.x);

    if (dist < this.radius) {
      const pullDir = this.x > blockCenter ? 1 : -1;
      const pullFactor = (1 - dist / this.radius);
      const shift = pullDir * CONFIG.WHIRLWIND_PULL_FORCE * pullFactor * dt;
      block.applyDrift(shift);
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.y - this.radius, this.radius * 2)) return;
    const renderY = this.y - camera.y;

    ctx.save();
    ctx.translate(this.x, renderY);
    ctx.rotate(this.rotation);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (this.radius / 3) * i, i, i + Math.PI * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class StormSystem {
  constructor() {
    this.wind = 0;
    this.windTarget = 0;
    this.windTimer = 0;
    this.drops = [];

    for (let i = 0; i < CONFIG.RAIN_COUNT; i++) {
      this.drops.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        length: 8 + Math.random() * 7,
        speed: 520 + Math.random() * 220
      });
    }
  }

  update(dt, block) {
    this.windTimer -= dt;
    if (this.windTimer <= 0) {
      this.windTimer = 2.5 + Math.random() * 2;
      this.windTarget = (Math.random() * 2 - 1) * CONFIG.MAX_WIND_FORCE;
    }
    this.wind += (this.windTarget - this.wind) * (dt * 1.5);

    if (block) {
      block.applyDrift(this.wind * dt);
    }

    for (const drop of this.drops) {
      drop.y += drop.speed * dt;
      drop.x += this.wind * 0.4 * dt;

      if (drop.y > CONFIG.CANVAS_HEIGHT) {
        drop.y = -20;
        drop.x = Math.random() * CONFIG.CANVAS_WIDTH;
      }
      if (drop.x > CONFIG.CANVAS_WIDTH) drop.x = 0;
      if (drop.x < 0) drop.x = CONFIG.CANVAS_WIDTH;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.3)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (const drop of this.drops) {
      const slantX = (this.wind / CONFIG.MAX_WIND_FORCE) * 8;
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + slantX, drop.y + drop.length);
    }
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`GIÓ: ${Math.round(this.wind)} km/h`, 16, 68);
    ctx.restore();
  }
}

export class HazardManager {
  constructor() {
    this.seagulls = [];
    this.whirlwinds = [];
    this.storm = new StormSystem();
    this.seagullTimer = 0;
  }

  reset() {
    this.seagulls = [];
    this.whirlwinds = [];
    this.seagullTimer = 0;
  }

  setupLevel(level, topBlockY) {
    this.reset();
    if (level === 2) {
      this.whirlwinds.push(new Whirlwind(topBlockY - 110));
    }
  }

  update(dt, level, currentBlock, topBlockY) {
    if (level === 1) return; 

    if (level === 2) {
      this.seagullTimer -= dt;
      if (this.seagullTimer <= 0) {
        this.seagullTimer = CONFIG.SEAGULL_SPAWN_INTERVAL + Math.random() * 1.5;
        const dir = Math.random() > 0.5 ? 1 : -1;
        const spawnY = topBlockY - 80 - Math.random() * 60;
        this.seagulls.push(new Seagull(spawnY, dir));
      }

      for (let i = this.seagulls.length - 1; i >= 0; i--) {
        const bird = this.seagulls[i];
        bird.update(dt);

        if (currentBlock && !bird.hasCollided && currentBlock.isFalling()) {
          if (
            bird.x < currentBlock.x + currentBlock.width &&
            bird.x + bird.width > currentBlock.x &&
            bird.y < currentBlock.y + currentBlock.height &&
            bird.y + bird.height > currentBlock.y
          ) {
            bird.hasCollided = true;
            const deflectDir = bird.direction;
            currentBlock.applyDrift(deflectDir * CONFIG.SEAGULL_DEFLECTION);
          }
        }

        if (bird.isOutOfScreen()) {
          this.seagulls.splice(i, 1);
        }
      }

      for (const w of this.whirlwinds) {
        w.y = topBlockY - 100; 
        w.update(dt);
        if (currentBlock) {
          w.applyForce(currentBlock, dt);
        }
      }
    }


    if (level === 3) {
      this.storm.update(dt, currentBlock);
    }
  }

  render(ctx, camera, level) {
    if (level === 2) {
      for (const w of this.whirlwinds) w.render(ctx, camera);
      for (const bird of this.seagulls) bird.render(ctx, camera);
    } else if (level === 3) {
      this.storm.render(ctx);
    }
  }
}