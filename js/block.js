import { CONFIG } from './config.js';
import { ASSETS, assetLoader } from './assets.js';

export const BlockState = {
  SWINGING: 'SWINGING',
  FALLING: 'FALLING',
  LANDED: 'LANDED',
  MISSED: 'MISSED'
};

export class Block {
  constructor(pivotX, pivotY, width, height, color, isBase = false, assetSrc = null) {
    this.width = width;
    this.height = height;
    this.color = color || '#38bdf8';
    this.asset = assetLoader.getImage(assetSrc);
    this.assetBounds = ASSETS.SPRITE_BOUNDS[assetSrc];
    this.state = isBase ? BlockState.LANDED : BlockState.SWINGING;

    // TỌA ĐỘ NEO ĐIỂM TREO DÂY ÁNH SÁNG
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.ropeLength = CONFIG.ROPE_LENGTH;
    this.maxAngle = CONFIG.MAX_SWING_ANGLE;
    this.swingSpeed = CONFIG.BASE_SWING_SPEED;
    this.swingTimer = 0;
    this.dropSpeed = 980;

    // Vị trí thực tế của khối
    if (isBase) {
      this.x = pivotX;
      this.y = pivotY;
    } else {
      this.calculateArcPosition();
    }
  }

  isFalling() {
    return this.state === BlockState.FALLING;
  }

  applyDrift(dx) {
    this.x += dx;
  }

  // Tăng biên độ góc lắc khi cột bị lệch tâm tích lũy
  setInstability(unstableRatio) {
    this.maxAngle = CONFIG.MAX_SWING_ANGLE + (unstableRatio * 0.15);
    this.swingSpeed = CONFIG.BASE_SWING_SPEED + (unstableRatio * 0.4);
  }

  // TÍNH TOÁN TỌA ĐỘ VÒNG CUNG CON LẮC
  calculateArcPosition() {
    const currentAngle = this.maxAngle * Math.sin(this.swingTimer);
    // Tọa độ tâm đáy dây
    const bottomRopeX = this.pivotX + this.ropeLength * Math.sin(currentAngle);
    const bottomRopeY = this.pivotY + this.ropeLength * Math.cos(currentAngle);

    // Gán vị trí khối (tâm khối trùng với đầu mút dây)
    this.x = bottomRopeX - (this.width / 2);
    this.y = bottomRopeY;
  }

  update(dt) {
    if (this.state === BlockState.SWINGING) {
      this.swingTimer += this.swingSpeed * dt;
      this.calculateArcPosition();
    } else if (this.state === BlockState.FALLING || this.state === BlockState.MISSED) {
      // RƠI THEO PHƯƠNG THẲNG ĐỨNG: Giữ nguyên trục X, chỉ tăng trục Y
      this.y += this.dropSpeed * dt;
    }
  }

  drop() {
    if (this.state === BlockState.SWINGING) {
      this.state = BlockState.FALLING;
    }
  }

  checkLanding(targetBlock) {
    if (this.y + this.height >= targetBlock.y) {
      const left1 = this.x;
      const right1 = this.x + this.width;
      const left2 = targetBlock.x;
      const right2 = targetBlock.x + targetBlock.width;

      const overlapWidth = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
      const overlapRatio = overlapWidth / this.width;

      if (overlapRatio < 0.25) {
        this.state = BlockState.MISSED;
        return { success: false, score: 0, feedback: 'THẤT BẠI', ratio: 0 };
      }

      this.y = targetBlock.y - this.height;
      this.state = BlockState.LANDED;

      for (const rule of CONFIG.OVERLAP_RULES) {
        if (overlapRatio >= rule.minRatio) {
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
    if (!camera.isVisible(this.y - 10, this.height + 20)) return;
    const renderY = this.y - camera.y;

    ctx.save();

    // VẼ SỢI DÂY NỐI CON LẮC KHI ĐANG ĐUNG ĐƯA
    if (this.state === BlockState.SWINGING) {
      const renderPivotY = this.pivotY - camera.y;
      const blockCenterX = this.x + this.width / 2;
      const ropeAnchorY = renderY + Math.min(8, this.height * 0.2);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.pivotX, renderPivotY);
      ctx.lineTo(blockCenterX, ropeAnchorY);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (this.asset && this.asset.isLoaded) {
      const sprite = this.assetBounds;
      if (sprite) {
        ctx.drawImage(
          this.asset,
          sprite.x, sprite.y, sprite.width, sprite.height,
          this.x, renderY, this.width, this.height
        );
      } else {
        ctx.drawImage(this.asset, this.x, renderY, this.width, this.height);
      }
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, renderY, this.width, this.height);
    }

    ctx.restore();
  }
}