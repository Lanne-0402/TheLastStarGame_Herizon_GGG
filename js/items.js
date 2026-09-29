import { CONFIG } from './config.js';

export class FloatingItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = 28;
    this.type = type; // 'green' hoặc 'neon'
    this.collected = false;
    this.bobAngle = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bobAngle += dt * 3;
  }

  render(ctx, camera) {
    if (this.collected || !camera.isVisible(this.y, this.size)) return;
    const renderY = this.y - camera.y + Math.sin(this.bobAngle) * 5;

    ctx.save();
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const icon = this.type === 'green' ? '🌿' : '💡';
    ctx.fillText(icon, this.x, renderY);
    ctx.restore();
  }
}

export class ItemManager {
  constructor() {
    this.floatingItems = [];
    this.inventory = { green: 1, neon: 1 }; // Tặng sẵn 1 item mỗi loại để test ngay
    this.selectedNextType = 'normal';
  }

  reset() {
    this.floatingItems = [];
    this.inventory = { green: 1, neon: 1 };
    this.selectedNextType = 'normal';
  }

  spawnItemIfEligible(floor, topBlockY) {
    if (floor % CONFIG.ITEM_SPAWN_INTERVAL_FLOORS === 0 && floor > 0) {
      const type = Math.random() > 0.5 ? 'green' : 'neon';
      const x = 60 + Math.random() * (CONFIG.CANVAS_WIDTH - 120);
      const y = topBlockY - 100;
      this.floatingItems.push(new FloatingItem(x, y, type));
    }
  }

  // Khối rơi xuyên qua item sẽ tự động nhặt
  checkBlockCollision(fallingBlock) {
    for (const item of this.floatingItems) {
      if (!item.collected) {
        if (
          item.x >= fallingBlock.x &&
          item.x <= fallingBlock.x + fallingBlock.width &&
          item.y >= fallingBlock.y &&
          item.y <= fallingBlock.y + fallingBlock.height
        ) {
          item.collected = true;
          this.inventory[item.type]++;
          return item.type;
        }
      }
    }
    return null;
  }

  // Chọn loại khối cho lượt thả tiếp theo
  selectType(type) {
    if (this.inventory[type] > 0) {
      this.inventory[type]--;
      this.selectedNextType = type;
      return true;
    }
    return false;
  }

  consumeNextType() {
    const type = this.selectedNextType;
    this.selectedNextType = 'normal'; // Reset về khối thường sau khi dùng
    return type;
  }

  update(dt) {
    for (const item of this.floatingItems) {
      item.update(dt);
    }
  }

  render(ctx, camera) {
    for (const item of this.floatingItems) {
      item.render(ctx, camera);
    }
  }
}