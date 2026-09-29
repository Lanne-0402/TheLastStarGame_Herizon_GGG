import { CONFIG } from './config.js';

export const BlockState = {
  SWINGING: 'SWINGING',
  FALLING: 'FALLING',
  LANDED: 'LANDED',
  MISSED: 'MISSED'
};

export class Block {
  constructor(x, y, width, height, speed, isBase = false, type = 'normal') {
    this.type = type;
    const key = (type || 'normal').toUpperCase();
    this.typeConfig = CONFIG.ITEM_TYPES[key] || CONFIG.ITEM_TYPES.NORMAL;
    
    this.x = x;
    this.y = y;
    this.width = width;
    // Tòa Neon cao gấp đôi khối thông thường
    this.height = height * this.typeConfig.heightMul;
    this.speed = speed;
    this.direction = 1;
    this.state = isBase ? BlockState.LANDED : BlockState.SWINGING;
    this.color = isBase ? '#4b5563' : this.typeConfig.color;
  }

  isFalling() {
    return this.state === BlockState.FALLING;
  }

  applyDrift(dx) {
    this.x += dx;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CONFIG.CANVAS_WIDTH) {
      this.x = CONFIG.CANVAS_WIDTH - this.width;
    }
  }

  update(dt) {
    if (this.state === BlockState.SWINGING) {
      this.x += this.direction * this.speed * dt;
      if (this.x <= 0) {
        this.x = 0;
        this.direction = 1;
      } else if (this.x + this.width >= CONFIG.CANVAS_WIDTH) {
        this.x = CONFIG.CANVAS_WIDTH - this.width;
        this.direction = -1;
      }
    } else if (this.state === BlockState.FALLING || this.state === BlockState.MISSED) {
      this.y += CONFIG.DROP_SPEED * dt;
    }
  }

  drop() {
    if (this.state === BlockState.SWINGING) {
      this.state = BlockState.FALLING;
    }
  }

  // Đo độ lệch tâm theo thang điểm của từng loại khối
  checkLanding(targetBlock) {
    if (this.y + this.height >= targetBlock.y) {
      const currentCenter = this.x + this.width / 2;
      const targetCenter = targetBlock.x + targetBlock.width / 2;
      const offset = Math.abs(currentCenter - targetCenter);

      if (offset >= this.width) {
        this.state = BlockState.MISSED;
        return { success: false, score: 0, feedback: 'MISS', block: this };
      }

      this.y = targetBlock.y - this.height;
      this.state = BlockState.LANDED;

      const maxScore = this.typeConfig.maxScore;

      // PERFECT HIT
      if (offset <= CONFIG.PERFECT_TOLERANCE) {
        this.x = targetBlock.x;
        return { 
          success: true, 
          score: maxScore, 
          feedback: `PERFECT! +${maxScore}`,
          block: this
        };
      }

      // GOOD HIT (Tính tỷ lệ chính xác)
      const accuracyRatio = 1 - (offset / this.width);
      const score = Math.max(1, Math.round(accuracyRatio * (maxScore * 0.9)));
      return { 
        success: true, 
        score, 
        feedback: `GOOD +${score}`,
        block: this
      };
    }

    return null;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.y, this.height)) return;
    const renderY = this.y - camera.y;

    ctx.save();
    
    // Đồ họa riêng cho từng loại block
    if (this.type === 'neon') {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, renderY, this.width, this.height);

    // Đường viền nóc mái
    if (this.type === 'green') {
      ctx.fillStyle = '#86efac';
      ctx.fillRect(this.x, renderY, this.width, 6); // Dải vườn xanh trên nóc
    }

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x, renderY, this.width, this.height);
    ctx.restore();
  }
}