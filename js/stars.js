import { CONFIG } from './config.js';

export class MemoryStar {
  constructor(y, index) {
    this.x = 80 + Math.random() * (CONFIG.CANVAS_WIDTH - 160);
    this.y = y;
    this.size = 28;
    this.index = index; // 1, 2, hoặc 3
    this.collected = false;
    this.pulse = Math.random() * Math.PI;
  }

  update(dt) {
    this.pulse += dt * 4;
  }

  render(ctx, camera) {
    if (this.collected || !camera.isVisible(this.y, this.size)) return;
    const renderY = this.y - camera.y + Math.sin(this.pulse) * 4;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Vầng hào quang phát sáng
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 18;
    ctx.font = '26px sans-serif';
    ctx.fillText('⭐', this.x, renderY);
    ctx.restore();
  }
}

export class StarManager {
  constructor() {
    this.stars = [];
    this.collectedCount = 0;
  }

  setupLevel(levelConfig, baseBlockY) {
    this.stars = [];
    this.collectedCount = 0;

    // Đặt 3 sao tại độ cao tương ứng với các block milestone
    const milestones = levelConfig.starMilestones;
    milestones.forEach((floorIndex, idx) => {
      // Mỗi block cao tầm 42px, đặt sao lơ lửng ngay vùng block đó
      const starY = baseBlockY - (floorIndex * 42) - 40;
      this.stars.push(new MemoryStar(starY, idx + 1));
    });
  }

  checkCollision(fallingBlock) {
    for (const star of this.stars) {
      if (!star.collected) {
        if (
          star.x >= fallingBlock.x &&
          star.x <= fallingBlock.x + fallingBlock.width &&
          star.y >= fallingBlock.y &&
          star.y <= fallingBlock.y + fallingBlock.height + 20
        ) {
          star.collected = true;
          this.collectedCount++;
          return true;
        }
      }
    }
    return false;
  }

  update(dt) {
    for (const s of this.stars) s.update(dt);
  }

  render(ctx, camera) {
    for (const s of this.stars) s.render(ctx, camera);
  }
}