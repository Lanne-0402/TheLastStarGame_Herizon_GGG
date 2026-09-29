import { CONFIG } from './config.js';

export const BlockState = {
  SWINGING: 'SWINGING',
  FALLING: 'FALLING',
  LANDED: 'LANDED',
  MISSED: 'MISSED'
};

export class Block {
  constructor(x, y, width, height, color, isBase = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color || '#38bdf8';
    this.state = isBase ? BlockState.LANDED : BlockState.SWINGING;

    // Cơ chế Dây ánh sáng đung đưa
    this.pivotX = CONFIG.CANVAS_WIDTH / 2; // Điểm treo dây
    this.pivotY = 0;
    this.ropeLength = CONFIG.LIGHT_ROPE_LENGTH;
    this.swingAngle = 0;
    this.swingAmplitude = 130; // Biên độ lắc ngang (px)
    this.swingSpeed = CONFIG.BASE_SWING_SPEED;
    this.dropSpeed = 950;
  }

  isFalling() {
    return this.state === BlockState.FALLING;
  }

  applyDrift(dx) {
    this.x += dx;
  }

  // Tăng biên độ đung đưa do lệch tâm tích lũy (Stability/Sway)
  setInstability(unstableRatio) {
    this.swingAmplitude = 130 + (unstableRatio * 75);
    this.swingSpeed = CONFIG.BASE_SWING_SPEED + (unstableRatio * 0.9);
  }

  update(dt) {
    if (this.state === BlockState.SWINGING) {
      this.swingAngle += this.swingSpeed * dt;
      // Chuyển động đung đưa con lắc
      this.x = this.pivotX + Math.sin(this.swingAngle) * this.swingAmplitude - (this.width / 2);
    } else if (this.state === BlockState.FALLING || this.state === BlockState.MISSED) {
      this.y += this.dropSpeed * dt;
    }
  }

  drop() {
    if (this.state === BlockState.SWINGING) {
      this.state = BlockState.FALLING;
    }
  }

  // GDD Mục 7.3 & 8.1: Tính diện tích chồng lấn (Overlap %)
  checkLanding(targetBlock) {
    if (this.y + this.height >= targetBlock.y) {
      const left1 = this.x;
      const right1 = this.x + this.width;
      const left2 = targetBlock.x;
      const right2 = targetBlock.x + targetBlock.width;

      // Tính bề rộng tiếp xúc
      const overlapWidth = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
      const overlapRatio = overlapWidth / this.width;

      // GDD: Nhỏ hơn 25% diện tích đáy -> Thất bại, rơi khỏi cột
      if (overlapRatio < 0.25) {
        this.state = BlockState.MISSED;
        return { success: false, score: 0, feedback: 'THẤT BẠI', ratio: 0 };
      }

      // Xếp trúng: Khóa vị trí Y
      this.y = targetBlock.y - this.height;
      this.state = BlockState.LANDED;

      // Tìm mức điểm tương ứng
      for (const rule of CONFIG.OVERLAP_RULES) {
        if (overlapRatio >= rule.minRatio) {
          // Snap tâm nếu trên 95%
          if (rule.minRatio >= 0.95) {
            this.x = targetBlock.x + (targetBlock.width - this.width) / 2;
          }
          return { success: true, score: rule.score, feedback: rule.feedback, ratio: overlapRatio };
        }
      }

      return { success: true, score: 2, feedback: 'NGUY HIỂM', ratio: overlapRatio };
    }

    return null;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.y, this.height)) return;
    const renderY = this.y - camera.y;

    ctx.save();

    // 1. VẼ SỢI DÂY ÁNH SÁNG KHI ĐANG ĐUNG ĐƯA
    if (this.state === BlockState.SWINGING) {
      const topHookX = this.pivotX;
      const topHookY = 0; // Đỉnh màn hình
      const blockCenterX = this.x + this.width / 2;
      const blockCenterY = renderY;

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(topHookX, topHookY);
      ctx.lineTo(blockCenterX, blockCenterY);
      ctx.stroke();

      // Dây phát sáng lõi trắng
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. VẼ KHỐI NHÀ
    ctx.fillStyle = this.color;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x, renderY, this.width, this.height);
    ctx.shadowBlur = 0;

    // Đường viền tinh tế
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x, renderY, this.width, this.height);

    ctx.restore();
  }
}