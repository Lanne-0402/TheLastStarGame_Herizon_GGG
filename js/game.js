import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Block, BlockState } from './block.js';
import { HazardManager } from './hazards.js';
import { StarManager } from './stars.js';
import { ParallaxBackground } from './background.js';
import { ASSETS, soundManager, assetLoader } from './assets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.camera = new Camera();
    this.hazards = new HazardManager();
    this.stars = new StarManager();
    this.bg = new ParallaxBackground();

    this.currentLevel = 1;
    this.landedBlocks = [];
    this.currentBlock = null;
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;

    this.cumulativeInstability = 0; // Độ lệch tích lũy làm dây lắc mạnh hơn
    this.isPaused = true; // Tạm dừng lúc đầu cho màn hình Start
    this.isGameOver = false;

    // Nội dung text dự phòng cho Ký Ức Map 1 và Map 2[cite: 5]
    this.memoryTexts = {
      1: {
        title: 'KÝ ỨC 1: MÁI ẤM & BẦU TRỜI SAO',
        desc: 'Sinh linh nhìn thấy gia đình quây quần bên hiên nhà với một ngọn đèn nhỏ. Ánh sáng cần thiết cho cuộc sống vẫn có thể chan hòa cùng bóng đêm kỳ vĩ.'
      },
      2: {
        title: 'KÝ ỨC 2: BIỂN CẢ VÀ ĐÈN DẪN LỐI',
        desc: 'Những ngư dân dùng ánh sáng vừa đủ để làm việc và định hướng trên biển, nhường lại khoảng trời đêm cho các vì sao chỉ đường.'
      }
    };

    this.storyQueue = []; // Hàng đợi các trang truyện cần chiếu
    this.container = document.getElementById('game-container');
    this.ui = {
      floor: document.getElementById('floor-counter'),
      target: document.getElementById('target-counter'),
      score: document.getElementById('score-counter'),
      hearts: document.getElementById('heart-counter'),
      stars: document.getElementById('star-counter'),
      levelTitle: document.getElementById('level-title'),
      feedback: document.getElementById('combo-feedback'),
      edgeOverlay: document.getElementById('edge-warning-overlay'),

      startScreen: document.getElementById('start-screen'),
      btnStartGame: document.getElementById('btn-start-game'),

      videoOverlay: document.getElementById('video-overlay'),
      video: document.getElementById('story-video'),
      btnSkipVideo: document.getElementById('btn-skip-video'),

      memoryModal: document.getElementById('memory-modal'),
      memoryImg: document.getElementById('memory-img'),
      memoryFallback: document.getElementById('memory-fallback'),
      memoryTitle: document.getElementById('memory-title'),
      memoryDesc: document.getElementById('memory-desc'),
      btnCloseMemory: document.getElementById('btn-close-memory'),

      endModal: document.getElementById('level-end-modal'),
      endTitle: document.getElementById('end-title'),
      endStars: document.getElementById('end-stars-display'),
      endScore: document.getElementById('end-score-info'),
      endHint: document.getElementById('end-memory-status'),
      btnReplay: document.getElementById('btn-replay-map'),
      btnNext: document.getElementById('btn-next-map')
    };

    this.init();
  }

  init() {
    this.setupEvents();
    requestAnimationFrame(this.loop.bind(this));
  }

  setupEvents() {
    // 1. Khi bấm "BẮT ĐẦU HÀNH TRÌNH" -> Kích hoạt Video Intro
    this.ui.btnStartGame.addEventListener('click', () => {
      this.ui.startScreen.classList.add('hidden');
      this.playStoryVideo('intro', () => {
        this.startLevel(1);
      });
    });

    // 2. Nút Bỏ qua Video
    this.ui.btnSkipVideo.addEventListener('click', () => {
      this.stopVideoAndContinue();
    });

    // Khi video phát xong tự động chuyển tiếp
    this.ui.video.addEventListener('ended', () => {
      this.stopVideoAndContinue();
    });

    // Nếu Artist chưa xuất video mp4 -> Tự động bỏ qua không để game bị kẹt
    this.ui.video.addEventListener('error', () => {
      console.warn('Chưa tìm thấy file video. Tự động chuyển vào gameplay.');
      this.stopVideoAndContinue();
    });

    // 3. Đóng popup ký ức giữa màn
    this.ui.btnCloseMemory.addEventListener('click', () => {
      this.ui.memoryModal.classList.add('hidden');
      if (this.currentLevel < 3) {
        this.startLevel(this.currentLevel + 1);
      }
    });

    // 4. Các nút tương tác thả khối
    window.addEventListener('pointerdown', (e) => {
      if (this.isPaused) return;
      if (e.target.closest('button') || e.target.closest('.modal-overlay')) return;
      this.dropBlock();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isPaused) this.dropBlock();
      // Phím tắt kiểm thử nhanh cho BGK
      if (e.key === '1') this.startLevel(1);
      if (e.key === '2') this.startLevel(2);
      if (e.key === '3') this.startLevel(3);
    });

    this.ui.btnReplay.addEventListener('click', () => {
      this.ui.endModal.classList.add('hidden');
      this.startLevel(this.currentLevel);
    });

    this.ui.btnNext.addEventListener('click', () => {
      this.ui.endModal.classList.add('hidden');
      if (this.currentLevel < 3) this.startLevel(this.currentLevel + 1);
    });
  }

  playStoryVideo(type, onComplete) {
    this.isPaused = true;
    this.onVideoEndCallback = onComplete;

    const videoSrc = (ASSETS && ASSETS.VIDEOS && ASSETS.VIDEOS[type]) ? ASSETS.VIDEOS[type] : null;

    // Nếu không có file cấu hình, tự động lướt qua ngay lập tức
    if (!videoSrc) {
      this.stopVideoAndContinue();
      return;
    }

    // Kiểm tra nhanh xem server có file video không trước khi gọi play()
    fetch(videoSrc, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          this.ui.video.src = videoSrc;
          this.ui.videoOverlay.classList.remove('hidden');
          this.ui.video.play().catch(() => {
            this.stopVideoAndContinue();
          });
        } else {
          console.warn(`File video [${type}] chưa có sẵn trên server. Bỏ qua video.`);
          this.stopVideoAndContinue();
        }
      })
      .catch(() => {
        this.stopVideoAndContinue();
      });
  }

  stopVideoAndContinue() {
    this.ui.video.pause();
    this.ui.videoOverlay.classList.add('hidden');
    if (this.onVideoEndCallback) {
      const cb = this.onVideoEndCallback;
      this.onVideoEndCallback = null;
      cb();
    }
  }

  startLevel(lvl) {
    this.currentLevel = Number(lvl);
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];

    this.landedBlocks = [];
    this.camera.reset();
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.cumulativeInstability = 0;
    this.isGameOver = false;
    this.isPaused = false;

    // Khối móng nền
    const baseBlock = new Block(
      (CONFIG.CANVAS_WIDTH - 150) / 2,
      CONFIG.CANVAS_HEIGHT - 60,
      150,
      45,
      '#475569',
      true
    );
    this.landedBlocks.push(baseBlock);

    this.stars.setupLevel(lvlCfg, baseBlock.y);
    this.hazards.setupLevel(this.currentLevel, baseBlock.y);

    this.spawnNextBlock();
    this.updateHUD();
    this.showFeedback(`BẮT ĐẦU: ${lvlCfg.name.toUpperCase()}`);
  }

  spawnNextBlock() {
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    const variations = lvlCfg.blockVariations;
    const variant = variations[Math.floor(Math.random() * variations.length)];

    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    const spawnY = topBlock.y - CONFIG.LIGHT_ROPE_LENGTH;

    this.currentBlock = new Block(
      CONFIG.CANVAS_WIDTH / 2 - variant.width / 2,
      spawnY,
      variant.width,
      variant.height,
      variant.color,
      false
    );

    this.currentBlock.setInstability(this.cumulativeInstability);
  }

  dropBlock() {
    if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
      this.currentBlock.drop();
      soundManager.play('drop');
    }
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
    if (this.isPaused || this.isGameOver) return;
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    if (!topBlock) return;

    this.hazards.update(dt, this.currentLevel, this.currentBlock, topBlock.y);
    this.stars.update(dt);

    if (this.currentBlock) {
      this.currentBlock.update(dt);

      // --- KIỂM TRA VA CHẠM VIỀN KHI ĐANG RƠI ---
      if (this.currentBlock.isFalling()) {
        // Nếu chạm sát hoặc vượt mép trái (x <= 0) hoặc mép phải (x + width >= CANVAS_WIDTH)
        if (this.currentBlock.x <= 0 || (this.currentBlock.x + this.currentBlock.width) >= CONFIG.CANVAS_WIDTH) {
          this.handleMiss('CHẠM VIỀN! (-1 TIM)', true);
          return; // Ngắt cập nhật lượt rơi này và sinh khối mới
        }

        // Nhặt sao nếu chạm
        if (this.stars.checkCollision(this.currentBlock)) {
          if (typeof soundManager !== 'undefined') soundManager.play('star');
          this.showFeedback('+1 SAO KÝ ỨC! ⭐');
          this.updateHUD();
        }
      }

      // --- XỬ LÝ TIẾP ĐẤT & MISS DO TRƯỢT ĐẾ ---
      if (this.currentBlock && this.currentBlock.state === BlockState.FALLING) {
        const result = this.currentBlock.checkLanding(topBlock);

        if (result) {
          if (result.success) {
            if (typeof soundManager !== 'undefined') soundManager.play('land');
            this.showFeedback(`${result.feedback} (${Math.round(result.ratio * 100)}%)`);
            this.landedBlocks.push(this.currentBlock);
            this.floor++;
            this.score += result.score;
            this.cumulativeInstability += Math.max(0, 0.95 - result.ratio) * 0.4;

            const targetBlocks = CONFIG.LEVELS[this.currentLevel].targetBlocks;
            if (this.floor >= targetBlocks) {
              this.handleLevelCompletion();
            } else {
              this.spawnNextBlock();
            }
            this.updateHUD();
          } else {
            // Miss do diện tích overlap < 25% hoặc trượt đế
            this.handleMiss('TRƯỢT ĐẾ! (-1 TIM)', false);
          }
        }
      }
    }

    this.camera.update(topBlock.y);
  }

// XỬ LÝ HOÀN THÀNH LEVEL AN TOÀN TUYỆT ĐỐI
  handleLevelCompletion() {
    this.isPaused = true;
    const starsGot = this.stars.collectedCount;

    // 1. Nếu xong Map 3 -> Phát Outro kết game
    if (this.currentLevel === 3) {
      setTimeout(() => {
        this.playStoryVideo('outro', () => {
          this.showVictoryScreen();
        });
      }, 600);
      return;
    }

    // 2. Cập nhật các thông số cơ bản (có bảo vệ)
    if (this.ui.endStars) this.ui.endStars.textContent = '⭐'.repeat(starsGot) + '☆'.repeat(3 - starsGot);
    if (this.ui.endScore) this.ui.endScore.textContent = `Điểm kỹ năng: ${this.score}`;
    if (this.ui.btnNext) this.ui.btnNext.textContent = `SANG MAP ${this.currentLevel + 1} ❯`;

    // 3. Nếu thu thập đủ 3/3 sao -> Mở khóa Ký ức hoặc báo hoàn hảo
    if (starsGot === 3) {
      if (this.ui.endTitle) this.ui.endTitle.textContent = `HOÀN HẢO MAP ${this.currentLevel}!`;
      if (this.ui.endHint) {
        this.ui.endHint.textContent = '✨ Bạn đã mở khóa trọn vẹn Ký Ức của màn chơi!';
        this.ui.endHint.style.color = '#38bdf8';
      }
    } else {
      if (this.ui.endTitle) this.ui.endTitle.textContent = `HOÀN THÀNH MAP ${this.currentLevel}!`;
      if (this.ui.endHint) {
        this.ui.endHint.textContent = `Bạn thu thập được ${starsGot}/3 Sao. Vẫn còn ký ức đang bị bỏ lại!`;
        this.ui.endHint.style.color = '#facc15';
      }
    }

    // Hiển thị bảng tổng kết
    if (this.ui.endModal) {
      this.ui.endModal.classList.remove('hidden');
    }
  }

  showVictoryScreen() {
    if (this.ui.endTitle) this.ui.endTitle.textContent = 'HOÀN THÀNH TẤT CẢ MAP!';
    if (this.ui.endStars) this.ui.endStars.textContent = '⭐⭐⭐';
    if (this.ui.endScore) this.ui.endScore.textContent = `Tổng điểm: ${this.score}`;
    if (this.ui.endHint) this.ui.endHint.textContent = 'Chúc mừng bạn đã khôi phục lại bầu trời đêm!';
    if (this.ui.btnNext) {
      this.ui.btnNext.textContent = 'CHƠI LẠI TỪ ĐẦU';
      this.ui.btnNext.onclick = () => { location.reload(); };
    }
    if (this.ui.endModal) {
      this.ui.endModal.classList.remove('hidden');
    }
  }

  showFeedback(text) {
    this.ui.feedback.textContent = text;
    this.ui.feedback.classList.add('show');
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.ui.feedback.classList.remove('show');
    }, 650);
  }

  updateHUD() {
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    this.ui.floor.textContent = this.floor;
    this.ui.target.textContent = lvlCfg.targetBlocks;
    this.ui.score.textContent = this.score;
    this.ui.hearts.textContent = '❤️'.repeat(Math.max(0, this.lives));
    this.ui.stars.textContent = `${this.stars.collectedCount}/3`;
    this.ui.levelTitle.textContent = `MAP ${this.currentLevel}: ${lvlCfg.name.toUpperCase()}`;
  }

  render() {
    this.bg.render(this.ctx, this.camera, this.currentLevel, this.floor);
    this.hazards.render(this.ctx, this.camera, this.currentLevel);
    this.stars.render(this.ctx, this.camera);
    for (const b of this.landedBlocks) b.render(this.ctx, this.camera);
    if (this.currentBlock) this.currentBlock.render(this.ctx, this.camera);
  }

  // Hiệu ứng Rung màn hình khi Miss
  triggerScreenShake() {
    if (this.container) {
      this.container.classList.remove('shake-screen');
      void this.container.offsetWidth; // Ép reflow để restart animation
      this.container.classList.add('shake-screen');
      setTimeout(() => {
        if (this.container) this.container.classList.remove('shake-screen');
      }, 360);
    }
  }

  // Hiệu ứng Viền đỏ bao quanh màn hình
  triggerEdgeBorderFlash() {
    if (this.ui.edgeOverlay) {
      this.ui.edgeOverlay.classList.add('show');
      clearTimeout(this.edgeTimer);
      this.edgeTimer = setTimeout(() => {
        if (this.ui.edgeOverlay) this.ui.edgeOverlay.classList.remove('show');
      }, 450);
    }
  }

  // Hàm xử lý chung khi bị MISS hoặc CHẠM VIỀN
  handleMiss(reason, isWallHit = false) {
    if (typeof soundManager !== 'undefined') soundManager.play('miss');
    
    // Kích hoạt rung màn hình cho mọi trường hợp miss
    this.triggerScreenShake();

    // Nếu chạm viền thì hiển thị thêm viền đỏ bao quanh
    if (isWallHit) {
      this.triggerEdgeBorderFlash();
    }

    this.lives--;
    this.showFeedback(reason);
    this.updateHUD();

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.showFeedback('THẤT BẠI - HẾT MẠNG!');
      setTimeout(() => this.startLevel(this.currentLevel), 1500);
    } else {
      this.spawnNextBlock();
    }
  }
}