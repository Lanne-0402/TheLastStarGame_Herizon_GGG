import { CONFIG } from './config.js';
import { ASSETS, assetLoader } from './assets.js';

export class ParallaxBackground {
  constructor() {
    // Tạo sẵn vị trí ngẫu nhiên cho các vì sao ở Level 3
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * (CONFIG.CANVAS_HEIGHT * 2.5),
        radius: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    // Các tòa nhà bóng mờ (Silhouettes) cho Level 1
    this.buildings = [];
    for (let i = 0; i < 14; i++) {
      this.buildings.push({
        x: i * 35 - 20,
        width: 25 + Math.random() * 20,
        height: 120 + Math.random() * 140
      });
    }
  }

  render(ctx, camera, level, floor) {
    const camY = camera.y;
    const mapAsset = assetLoader.getImage(ASSETS.BACKGROUNDS[`map${level}`]);

    if (mapAsset && mapAsset.isLoaded) {
      const mapHeight = mapAsset.naturalHeight * (CONFIG.CANVAS_WIDTH / mapAsset.naturalWidth);
      ctx.drawImage(mapAsset, 0, -camY, CONFIG.CANVAS_WIDTH, mapHeight);
      return;
    }

    if (level === 1) {
      // --- NỀN LEVEL 1: THÀNH PHỐ ĐÊM DUSK TO NIGHT ---
      const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      // Lớp nhà xa (Parallax rất chậm: 0.08)
      ctx.fillStyle = '#111827';
      const offsetFar = camY * 0.08;
      for (const b of this.buildings) {
        ctx.fillRect(b.x, CONFIG.CANVAS_HEIGHT - b.height + offsetFar + 40, b.width, b.height);
      }

      // Lớp nhà gần (Parallax: 0.18)
      ctx.fillStyle = '#030712';
      const offsetNear = camY * 0.18;
      for (let i = 0; i < this.buildings.length; i++) {
        const b = this.buildings[i];
        ctx.fillRect(b.x + 15, CONFIG.CANVAS_HEIGHT - (b.height * 0.7) + offsetNear + 50, b.width * 1.1, b.height);
      }

    } else if (level === 2) {
      // --- NỀN LEVEL 2: BIỂN KHƠI & ĐƯỜNG CHÂN TRỜI ---
      const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
      grad.addColorStop(0, '#042f2e');
      grad.addColorStop(0.7, '#0f766e');
      grad.addColorStop(1, '#0e7490');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      // Mặt biển chân trời (Parallax: 0.15)
      const seaLevelY = CONFIG.CANVAS_HEIGHT * 0.65 + (camY * 0.15);
      if (seaLevelY < CONFIG.CANVAS_HEIGHT) {
        ctx.fillStyle = '#083344';
        ctx.fillRect(0, seaLevelY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - seaLevelY);

        // Gợn sóng phản chiếu ánh trăng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        for (let y = seaLevelY + 15; y < CONFIG.CANVAS_HEIGHT; y += 22) {
          ctx.beginPath();
          ctx.moveTo(30, y);
          ctx.lineTo(CONFIG.CANVAS_WIDTH - 30, y);
          ctx.stroke();
        }
      }

    } else if (level === 3) {
      // --- NỀN LEVEL 3: KHÍ QUYỂN BÃO TIẾN VÀO KHÔNG GIAN SAO ---
      const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
      grad.addColorStop(0, '#020617'); // Đen thẳm vũ trụ
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      // Sao lấp lánh (Mật độ và độ sáng tăng dần khi lên cao)
      const starParallax = camY * 0.12;
      for (const s of this.stars) {
        const drawY = s.y + starParallax;
        if (drawY >= 0 && drawY <= CONFIG.CANVAS_HEIGHT) {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, drawY, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}