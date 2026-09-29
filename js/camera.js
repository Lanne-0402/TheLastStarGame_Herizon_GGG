import { CONFIG } from './config.js';

export class Camera {
  constructor() {
    this.y = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.08; // Hệ số mượt (0.05 - 0.1)
  }

  update(topBlockY) {
    const targetOffset = CONFIG.CANVAS_HEIGHT * 0.62;
    if (topBlockY < targetOffset) {
      this.targetY = topBlockY - targetOffset;
    } else {
      this.targetY = 0;
    }
    this.y += (this.targetY - this.y) * this.lerpSpeed;
  }

  isVisible(y, height) {
    const screenY = y - this.y;
    return screenY + height >= 0 && screenY <= CONFIG.CANVAS_HEIGHT;
  }

  reset() {
    this.y = 0;
    this.targetY = 0;
  }
}