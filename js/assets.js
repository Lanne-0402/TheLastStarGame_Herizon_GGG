// 1. CẤU HÌNH ĐƯỜNG DẪN TÀI NGUYÊN (PLUG & PLAY)
export const ASSETS = {
  STORY_IMAGES: {
    page4: 'assets/images/story/page_4.png',
    page5: 'assets/images/story/page_5.png'
  },
  BACKGROUNDS: {
    map1: 'assets/images/backgrounds/map_1.png',
    map2: 'assets/images/backgrounds/map_2.png',
    map3: 'assets/images/backgrounds/map_3.png'
  },
  BLOCKS: {
    map1: 'assets/images/blocks/soil_block.png',
    map2: 'assets/images/blocks/cloud_block.png',
    map3: 'assets/images/blocks/meteor_block.png'
  },
  SPRITE_BOUNDS: {
    'assets/images/blocks/soil_block.png': { x: 36, y: 62, width: 401, height: 288 },
    'assets/images/blocks/cloud_block.png': { x: 517, y: 113, width: 1278, height: 1367 },
    'assets/images/blocks/meteor_block.png': { x: 0, y: 0, width: 1026, height: 590 }
  },
  SOUNDS: {
    drop: 'assets/sounds/drop.mp3',
    land: 'assets/sounds/land.mp3',
    miss: 'assets/sounds/miss.mp3',
    star: 'assets/sounds/star.mp3'
  }
};

// 2. TRÌNH NẠP ẢNH CÓ BẢO VỆ (IMAGE LOADER & CACHE)
class SafeAssetLoader {
  constructor() {
    this.images = new Map();
  }

  getImage(src) {
    if (!src) return null;
    if (this.images.has(src)) return this.images.get(src);

    const img = new Image();
    img.src = src;
    img.onload = () => { img.isLoaded = true; };
    img.onerror = () => { img.isLoaded = false; };
    this.images.set(src, img);
    return img;
  }
}

// 3. TRÌNH PHÁT ÂM THANH AN TOÀN (TỰ ĐỘNG GIẢ LẬP NẾU THIẾU FILE MP3)
class SafeSoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  ensureContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      this.isMuted = true;
    }
  }

  play(type) {
    if (this.isMuted) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'drop') {
        // Âm thanh vút nhẹ khi thả
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'land') {
        // Âm gõ mộc trầm ấm
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'star') {
        // Âm chuông ngân lấp lánh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'miss') {
        // Âm trượt vỡ
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {
      // Bỏ qua lỗi âm thanh nếu trình duyệt hạn chế
    }
  }
}

// XUẤT ĐỦ 3 BIẾN ĐỂ GAME.JS IMPORT KHÔNG BAO GIỜ BỊ SYNTAXERROR
export const assetLoader = new SafeAssetLoader();
export const soundManager = new SafeSoundManager();