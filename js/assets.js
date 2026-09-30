export class AssetManager {
  constructor() {
    this.images = {};
    this.musicEnabled = true;
    this.soundEnabled = true;
  }

  loadImage(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = () => {
        // Nếu chưa có ảnh, giữ null để CSS hiển thị giao diện thay thế mượt mà
        this.images[key] = null;
        resolve(null);
      };
    });
  }

  async init() {
    // Chỉ tải các file UI thực tế
    const uiList = [
      { key: 'logo', src: 'assets/images/ui/logo.png' },
      { key: 'btn_play', src: 'assets/images/ui/btn_play.png' },
      { key: 'btn_setting', src: 'assets/images/ui/btn_setting.png' }
    ];
    await Promise.all(uiList.map(item => this.loadImage(item.key, item.src)));
  }

  playSFX(sfxName) {
    if (!this.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (sfxName === 'drop') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (sfxName === 'star') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  }
}