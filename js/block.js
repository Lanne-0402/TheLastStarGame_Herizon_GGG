import { CONFIG } from './config.js';

export const BlockState = {
  SWINGING: 'SWINGING',
  FALLING: 'FALLING',
  LANDED: 'LANDED',
  MISSED: 'MISSED'
};

export class Block {
  constructor(x, y, width, height, color, isBase = false) {
    this.width = width || 140;
    this.height = height || 42;
    this.color = color || '#38bdf8';
    this.isBase = isBase;
    this.state = isBase ? BlockState.LANDED : BlockState.SWINGING;

    // Chốt chặn chống NaN cho x và y
    const defaultX = (CONFIG.CANVAS_WIDTH - this.width) / 2;
    const defaultY = isBase ? (CONFIG.CANVAS_HEIGHT - 60) : 480;

    this.x = (typeof x === 'number' && !isNaN(x)) ? x : defaultX;
    this.y = (typeof y === 'number' && !isNaN(y)) ? y : defaultY;

    // Cơ chế Dây ánh sáng
    this.pivotX = CONFIG.CANVAS_WIDTH / 2;
    this.swingAngle = 0;
    this.swingAmplitude = 135;
    this.swingSpeed = CONFIG.BASE_SWING_SPEED || 2.2;
    this.dropSpeed = CONFIG.DROP_SPEED || 900;
  }

  isFalling() {
    return this.state === BlockState.FALLING;
  }

  applyDrift(dx) {
    if (!isNaN(dx)) this.x += dx;
  }

  setInstability(unstableRatio) {
    const ratio = (typeof unstableRatio === 'number' && !isNaN(unstableRatio)) ? unstableRatio : 0;
    this.swingAmplitude = 135 + (ratio * 70);
    this.swingSpeed = (CONFIG.BASE_SWING_SPEED || 2.2) + (ratio * 0.8);
  }

  update(dt) {
    if (this.state === BlockState.SWINGING) {
      this.swingAngle += this.swingSpeed * dt;
      // Dao động con lắc điều hòa
      this.x = this.pivotX + Math.sin(this.swingAngle) * this.swingAmplitude - (this.width / 2);
    } else if (this.state === BlockState.FALLING || this.state === BlockState.MISSED) {
      this.y += this.dropSpeed * dt;
    }

    // Bảo vệ tuyệt đối: nếu x hoặc y bị NaN thì tự phục hồi
    if (isNaN(this.x)) this.x = (CONFIG.CANVAS_WIDTH - this.width) / 2;
    if (isNaN(this.y)) this.y = 450;
  }

  drop() {
    if (this.state === BlockState.SWINGING) {
      this.state = BlockState.FALLING;
    }
  }

  checkLanding(targetBlock) {
    if (!targetBlock) return null;

    if (this.y + this.height >= targetBlock.y) {
      const left1 = this.x;
      const right1 = this.x + this.width;
      const left2 = targetBlock.x;
      const right2 = targetBlock.x + targetBlock.width;

      const overlapWidth = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
      const overlapRatio = overlapWidth / this.width;

      // Trượt nếu diện tích tiếp xúc < 25%
      if (overlapRatio < 0.25) {
        this.state = BlockState.MISSED;
        return { success: false, score: 0, feedback: 'THẤT BẠI', ratio: 0 };
      }

      this.y = targetBlock.y - this.height;
      this.state = BlockState.LANDED;

      const rules = CONFIG.OVERLAP_RULES || [];
      for (const rule of rules) {
        if (overlapRatio >= rule.minRatio) {
          if (rule.minRatio >= 0.95) {
            this.x = targetBlock.x + (targetBlock.width - this.width) / 2; // Snap thẳng tâm
          }
          return { success: true, score: rule.score, feedback: rule.feedback, ratio: overlapRatio };
        }
      }

      return { success: true, score: 2, feedback: 'NGUY HIỂM', ratio: overlapRatio };
    }

    return null;
  }

  render(ctx, camera) {
    if (isNaN(this.x) || isNaN(this.y)) return;

    const renderY = this.y - (camera ? camera.y : 0);

    ctx.save();

    // 1. VẼ DÂY ÁNH SÁNG
    if (this.state === BlockState.SWINGING) {
      const topHookX = this.pivotX;
      const topHookY = 0;
      const blockCenterX = this.x + this.width / 2;
      const blockCenterY = renderY;

      // Hào quang vàng của dây
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(topHookX, topHookY);
      ctx.lineTo(blockCenterX, blockCenterY);
      ctx.stroke();

      // Lõi phát sáng trắng
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 2. VẼ KHỐI NHÀ
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, renderY, this.width, this.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, renderY, this.width, this.height);

    ctx.restore();
  }
}