import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { LightRopeBlock, BlockState } from './block.js';
import { StorageManager } from './storage.js';
import { AssetManager } from './assets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new Camera();
    this.storage = new StorageManager();
    this.assets = new AssetManager();

    this.currentLevel = 1;
    this.landedBlocks = [];
    this.currentBlock = null;

    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.starsCollected = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.activeStars = [];
    this.carouselIndex = 0;

    this.bindUI();
  }

  // --- HÀM BỌC PHÒNG THỦ: TRIỆT TIÊU HOÀN TOÀN LỖI isLevelUnlocked is not a function ---
  isLevelUnlocked(lvl) {
    if (this.storage && typeof this.storage.isLevelUnlocked === 'function') {
      return this.storage.isLevelUnlocked(lvl);
    }
    if (this.storage && this.storage.data && Array.isArray(this.storage.data.unlockedLevels)) {
      return this.storage.data.unlockedLevels.includes(Number(lvl));
    }
    return Number(lvl) === 1;
  }

  async start() {
    await this.assets.init();

    // Tắt màn Loading sau 1.2s -> Vào Main Menu
    setTimeout(() => {
      document.getElementById('screen-loading').classList.add('hidden');
      document.getElementById('screen-menu').classList.remove('hidden');
      this.updateCarouselUI();
    }, 1200);

    requestAnimationFrame(this.loop.bind(this));
  }

  bindUI() {
    // Vuốt / Kéo Carousel chọn Map
    const track = document.getElementById('carousel-track');
    let startX = 0;

    track.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    track.addEventListener('pointerup', (e) => {
      const diff = e.clientX - startX;
      if (diff < -40 && this.carouselIndex < 2) this.carouselIndex++;
      else if (diff > 40 && this.carouselIndex > 0) this.carouselIndex--;
      this.updateCarouselUI();
    });

    // Nút Play ở từng Slide Map
    document.querySelectorAll('.btn-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lvl = Number(e.target.dataset.level);
        if (this.isLevelUnlocked(lvl)) {
          this.launchLevel(lvl);
        }
      });
    });

    // Mở popup Setting
    const openSetting = () => {
      this.isPaused = true;
      document.getElementById('popup-setting').classList.remove('hidden');
    };
    document.getElementById('btn-open-setting').addEventListener('click', openSetting);
    document.getElementById('btn-ingame-setting').addEventListener('click', openSetting);

    // Bật / Tắt âm thanh trong Setting
    const btnMusic = document.getElementById('btn-toggle-music');
    const btnSound = document.getElementById('btn-toggle-sound');

    btnMusic.addEventListener('click', () => {
      this.assets.musicEnabled = !this.assets.musicEnabled;
      btnMusic.classList.toggle('muted', !this.assets.musicEnabled);
    });

    btnSound.addEventListener('click', () => {
      this.assets.soundEnabled = !this.assets.soundEnabled;
      btnSound.classList.toggle('muted', !this.assets.soundEnabled);
    });

    // Các nút chức năng trong Popup Setting
    document.getElementById('btn-setting-resume').addEventListener('click', () => {
      this.isPaused = false;
      document.getElementById('popup-setting').classList.add('hidden');
    });
    document.getElementById('btn-setting-support').addEventListener('click', () => {
      alert('The Last STAR - Dự án Game ESG vì mục tiêu SDG 7: Năng lượng cho tất cả mọi người.');
    });
    document.getElementById('btn-setting-exit').addEventListener('click', () => {
      document.getElementById('popup-setting').classList.add('hidden');
      document.getElementById('game-hud').classList.add('hidden');
      document.getElementById('screen-menu').classList.remove('hidden');
      this.isPaused = true;
      this.updateCarouselUI();
    });

    // Các nút trong Popup Complete
    document.getElementById('btn-complete-home').addEventListener('click', () => {
      document.getElementById('popup-complete').classList.add('hidden');
      document.getElementById('game-hud').classList.add('hidden');
      document.getElementById('screen-menu').classList.remove('hidden');
      this.updateCarouselUI();
    });
    document.getElementById('btn-complete-retry').addEventListener('click', () => {
      document.getElementById('popup-complete').classList.add('hidden');
      this.launchLevel(this.currentLevel);
    });
    document.getElementById('btn-complete-next').addEventListener('click', () => {
      // Điều kiện đủ 3 sao mới cho qua màn
      if (this.starsCollected >= 3 && this.currentLevel < 3) {
        document.getElementById('popup-complete').classList.add('hidden');
        this.launchLevel(this.currentLevel + 1);
      }
    });

    // Các nút trong Popup Failed
    document.getElementById('btn-failed-home').addEventListener('click', () => {
      document.getElementById('popup-failed').classList.add('hidden');
      document.getElementById('game-hud').classList.add('hidden');
      document.getElementById('screen-menu').classList.remove('hidden');
      this.updateCarouselUI();
    });
    document.getElementById('btn-failed-retry').addEventListener('click', () => {
      document.getElementById('popup-failed').classList.add('hidden');
      this.launchLevel(this.currentLevel);
    });

    // Thao tác Thả khối
    const triggerDrop = (e) => {
      if (this.isPaused || this.isGameOver || this.isVictory) return;
      if (e.target.closest('.modal-overlay') || e.target.closest('#screen-menu')) return;
      if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
        this.currentBlock.drop();
        this.assets.playSFX('drop');
      }
    };
    window.addEventListener('pointerdown', triggerDrop);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') triggerDrop(e);
    });
  }

  updateCarouselUI() {
    const track = document.getElementById('carousel-track');
    track.style.transform = `translateX(-${this.carouselIndex * 33.3333}%)`;

    // Cập nhật các chấm tròn điều hướng
    document.querySelectorAll('.dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.carouselIndex);
    });

    // Sử dụng hàm phòng thủ an toàn
    for (let lvl = 1; lvl <= 3; lvl++) {
      const slide = document.querySelector(`.carousel-slide[data-level="${lvl}"]`);
      if (!slide) continue;
      const btn = slide.querySelector('.btn-play');
      const isUnlocked = this.isLevelUnlocked(lvl);

      slide.classList.toggle('locked', !isUnlocked);
      if (btn) btn.classList.toggle('btn-disabled', !isUnlocked);
    }
  }

  launchLevel(lvl) {
    this.currentLevel = lvl;
    this.landedBlocks = [];
    this.camera.reset();

    const lvlConfig = CONFIG.LEVELS[lvl];
    this.maxFloors = lvlConfig.targetBlocks;
    this.floor = 0;
    this.score = 0;
    this.lives = CONFIG.MAX_LIVES;
    this.starsCollected = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.activeStars = [...lvlConfig.starFloors];

    // Tạo khối móng
    const baseBlock = new LightRopeBlock(
      CONFIG.CANVAS_WIDTH / 2,
      CONFIG.CANVAS_HEIGHT - 60,
      lvlConfig.baseWidth,
      lvlConfig.baseHeight,
      true
    );
    this.landedBlocks.push(baseBlock);

    this.spawnNextRopeBlock();

    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    this.updateHUD();
  }

  spawnNextRopeBlock() {
    const lvlConfig = CONFIG.LEVELS[this.currentLevel];
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    const pivotY = topBlock.y - 200;
    this.currentBlock = new LightRopeBlock(
      CONFIG.CANVAS_WIDTH / 2,
      pivotY,
      lvlConfig.baseWidth,
      lvlConfig.baseHeight
    );
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.isPaused || this.isGameOver || this.isVictory) return;

    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    if (!topBlock) return;

    if (this.currentBlock) {
      const windForce = this.currentLevel === 2 ? Math.sin(Date.now() * 0.002) * 40 : 0;
      this.currentBlock.update(dt, windForce);

      if (this.currentBlock.state === BlockState.FALLING) {
        const result = this.currentBlock.checkLanding(topBlock);

        if (result) {
          this.showFeedback(result.feedback);

          if (result.success) {
            this.landedBlocks.push(this.currentBlock);
            this.floor++;
            this.score += result.score;

            if (this.activeStars.includes(this.floor)) {
              this.starsCollected++;
              this.assets.playSFX('star');
              this.showFeedback('THU THẬP NGÔI SAO KÝ ỨC! ⭐');
            }

            if (this.floor >= this.maxFloors) {
              this.handleVictory();
            } else {
              this.spawnNextRopeBlock();
            }
          } else {
            this.lives--;
            if (this.lives <= 0) {
              this.handleGameOver();
            } else {
              this.spawnNextRopeBlock();
            }
          }
          this.updateHUD();
        }
      }
    }

    this.camera.update(topBlock.y);
  }

  handleVictory() {
    this.isVictory = true;
    const maxPossible = this.maxFloors * 10;
    const ratio = this.score / maxPossible;

    let rank = 'C';
    if (ratio >= 0.85) rank = 'S';
    else if (ratio >= 0.70) rank = 'A';
    else if (ratio >= 0.50) rank = 'B';

    this.storage.recordResult(this.currentLevel, this.score, this.starsCollected, rank);

    const modal = document.getElementById('popup-complete');
    document.getElementById('complete-score').textContent = this.score;
    document.getElementById('complete-rank-badge').textContent = `HẠNG [ ${rank} ]`;

    // Cập nhật 3 sao trên popup
    const starSpans = document.querySelectorAll('#complete-stars .star-slot');
    starSpans.forEach((span, i) => {
      span.classList.toggle('filled', i < this.starsCollected);
    });

    const notice = document.getElementById('complete-notice');
    const btnNext = document.getElementById('btn-complete-next');

    let noticeMsg = '';
    if (rank !== 'S') {
      noticeMsg += '• Hãy đạt Hạng S để hoàn thành trọn vẹn màn chơi!<br>';
    }

    if (this.starsCollected < 3) {
      noticeMsg += '• Chưa đủ 3/3 sao. Phải thu thập đủ 3 sao mới mở được màn tiếp theo!';
      btnNext.classList.add('disabled');
    } else {
      btnNext.classList.remove('disabled');
      if (this.currentLevel === 3) {
        noticeMsg += '• Bạn đã giải cứu tất cả chòm sao của hành tinh!';
      }
    }
    notice.innerHTML = noticeMsg;

    modal.classList.remove('hidden');
  }

  handleGameOver() {
    this.isGameOver = true;
    document.getElementById('failed-score').textContent = this.score;
    document.getElementById('popup-failed').classList.remove('hidden');
  }

  showFeedback(text) {
    const el = document.getElementById('combo-feedback');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.fbTimer);
    this.fbTimer = setTimeout(() => el.classList.remove('show'), 600);
  }

  updateHUD() {
    document.getElementById('floor-counter').textContent = this.floor;
    document.getElementById('target-counter').textContent = this.maxFloors;
    document.getElementById('score-counter').textContent = this.score;
    document.getElementById('star-tracker').textContent = `⭐ ${this.starsCollected}/3`;
    document.getElementById('heart-counter').textContent = '❤️'.repeat(Math.max(0, this.lives));
  }

  render() {
    this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    for (const b of this.landedBlocks) {
      b.render(this.ctx, this.camera);
    }

    if (this.currentBlock) {
      this.currentBlock.render(this.ctx, this.camera);
    }

    this.renderMemoryStars();
  }

  renderMemoryStars() {
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    if (!topBlock) return;

    for (const starFloor of this.activeStars) {
      if (starFloor > this.floor) {
        const diff = starFloor - this.floor;
        const starY = topBlock.y - (diff * 45) - 30 - this.camera.y;

        this.ctx.save();
        this.ctx.font = '26px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⭐', CONFIG.CANVAS_WIDTH / 2, starY);
        this.ctx.restore();
      }
    }
  }
}