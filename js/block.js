import { CONFIG } from './config.js';
import { ASSETS, assetLoader } from './assets.js';

export const BlockState = {
  SWINGING: 'SWINGING',
  FALLING: 'FALLING',
  LANDED: 'LANDED',
  MISSED: 'MISSED'
};

export class LightRopeBlock {
  constructor(pivotX, pivotY, width, height, isBase = false, type = 'normal') {
    this.pivotX = pivotX; // Điểm treo dây trên đỉnh màn hình
    this.pivotY = pivotY;
    this.width = width;
    this.height = height;
    this.isBase = isBase;
    this.type = type;

    this.angle = 0;
    this.time = Math.random() * 10;
    this.state = isBase ? BlockState.LANDED : BlockState.SWINGING;

    // Tọa độ thực tế
    this.x = pivotX - width / 2;
    this.y = pivotY;
    this.color = isBase ? '#475569' : '#38bdf8';
  }

  // Cập nhật chuyển động con lắc dây ánh sáng
  update(dt, windForce = 0) {
    if (this.state === BlockState.SWINGING) {
      this.time += dt * CONFIG.SWING_FREQUENCY;
      this.angle = Math.sin(this.time) * CONFIG.BASE_SWING_ANGLE + (windForce * 0.002);
      
      // Tọa độ khối treo dưới dây ánh sáng
      this.x = this.pivotX + Math.sin(this.angle) * CONFIG.ROPE_LENGTH - this.width / 2;
      this.y = this.pivotY + Math.cos(this.angle) * CONFIG.ROPE_LENGTH;
    } else if (this.state === BlockState.FALLING || this.state === BlockState.MISSED) {
      this.y += CONFIG.DROP_SPEED * dt;
    }
  }

  drop() {
    if (this.state === BlockState.SWINGING) {
      this.state = BlockState.FALLING;
    }
  }

  // ĐÁNH GIÁ OVERLAP CHUẨN GDD v0.2 (Mục 7.3 & 8.1)
  checkLanding(targetBlock) {
    if (this.y + this.height >= targetBlock.y) {
      // Tính độ phủ ngang (Overlap)
      const left = Math.max(this.x, targetBlock.x);
      const right = Math.min(this.x + this.width, targetBlock.x + targetBlock.width);
      const overlapWidth = right - left;

      // Tỷ lệ diện tích đè lên nhau
      const overlapRatio = overlapWidth / this.width;

      // Ngưỡng thất bại theo GDD: Nhỏ hơn 25% là trượt hoàn toàn
      if (overlapRatio < 0.25 || overlapWidth <= 0) {
        this.state = BlockState.MISSED;
        return { success: false, score: 0, feedback: 'THẤT BẠI (<25%)' };
      }

      // Xếp trúng
      this.y = targetBlock.y - this.height;
      this.state = BlockState.LANDED;

      // Tra cứu thang điểm GDD
      for (const rule of CONFIG.OVERLAP_RULES) {
        if (overlapRatio >= rule.threshold) {
          return { success: true, score: rule.score, feedback: rule.feedback };
        }
      }

      return { success: true, score: 2, feedback: 'NGUY HIỂM' };
    }
    return null;
  }

  render(ctx, camera) {
    const renderY = this.y - camera.y;

    ctx.save();
    // 1. Vẽ sợi dây ánh sáng (chỉ vẽ khi đang treo đung đưa)
    if (this.state === BlockState.SWINGING) {
      const renderPivotY = this.pivotY - camera.y;
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.pivotX, renderPivotY);
      ctx.lineTo(this.x + this.width / 2, renderY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 2. Vẽ khối
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, renderY, this.width, this.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, renderY, this.width, this.height);

    ctx.restore();
  }
}