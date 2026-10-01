import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Block, BlockState } from './block.js';
import { HazardManager } from './hazards.js';
import { StarManager } from './stars.js';
import { ParallaxBackground } from './background.js';
import { ASSETS, soundManager, assetLoader } from './assets.js';
import { StorageManager } from './storage.js'; // 1. BỔ SUNG IMPORT NÀY

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.camera = new Camera();
    this.hazards = new HazardManager();
    this.stars = new StarManager();
    this.bg = new ParallaxBackground();
    this.storage = new StorageManager(); // 2. KHỞI TẠO STORAGE MANAGER

    this.currentLevel = 1;
    this.landedBlocks = [];
    this.currentBlock = null;
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;

    this.cumulativeInstability = 0;
    this.isPaused = true;
    this.isGameOver = false;

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
    this.ui.btnStartGame.addEventListener('click', () => {
      this.ui.startScreen.classList.add('hidden');
      this.startLevel(1);
    });

    this.ui.btnCloseMemory.addEventListener('click', () => {
      this.ui.memoryModal.classList.add('hidden');
      if (this.currentLevel < 3) {
        this.startLevel(this.currentLevel + 1);
      }
    });

    window.addEventListener('pointerdown', (e) => {
      if (this.isPaused) return;
      if (e.target.closest('button') || e.target.closest('.modal-overlay')) return;
      this.dropBlock();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isPaused) this.dropBlock();
      // Phím tắt kiểm thử nhanh cho ban giám khảo/demo
      if (['1', '2', '3'].includes(e.key)) {
        this.ui.endModal.classList.add('hidden');
        this.ui.memoryModal.classList.add('hidden');
        this.startLevel(Number(e.key));
      }
    });

    this.ui.btnReplay.addEventListener('click', () => {
      this.ui.endModal.classList.add('hidden');
      this.startLevel(this.currentLevel);
    });

    // Xử lý nút Sang Map hoặc Xem Kết
    this.ui.btnNext.addEventListener('click', () => {
      const nextLvl = this.currentLevel + 1;

      if (this.currentLevel < 3) {
        // CHỐT CHẶN BẢO MẬT: Bắt buộc storage phải xác nhận đã unlock mới cho đi tiếp
        if (this.storage && !this.storage.isLevelUnlocked(nextLvl)) {
          this.showFeedback(`BẠN PHẢI THU ĐỦ 3 SAO ĐỂ MỞ MAP ${nextLvl}!`);
          return;
        }
        this.ui.endModal.classList.add('hidden');
        this.startLevel(nextLvl);
      } else {
        this.ui.endModal.classList.add('hidden');
        this.showVictoryScreen();
      }
    });
  }

  startLevel(lvl) {
    this.currentLevel = Number(lvl);
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    const blockAsset = ASSETS.BLOCKS[`map${this.currentLevel}`];

    this.landedBlocks = [];
    this.camera.reset();
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.cumulativeInstability = 0;
    this.isGameOver = false;
    this.isPaused = false;

    const baseBlock = new Block(
      (CONFIG.CANVAS_WIDTH - 150) / 2,
      CONFIG.CANVAS_HEIGHT - 60,
      150,
      45,
      '#475569',
      true,
      blockAsset
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
    const blockAsset = ASSETS.BLOCKS[`map${this.currentLevel}`];
    const variations = lvlCfg.blockVariations;
    const variant = variations[Math.floor(Math.random() * variations.length)];
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];

    const pivotX = CONFIG.CANVAS_WIDTH / 2;
    const targetOffset = CONFIG.CANVAS_HEIGHT * 0.70;
    const pivotY = (topBlock ? topBlock.y : CONFIG.CANVAS_HEIGHT) - targetOffset;

    this.currentBlock = new Block(
      pivotX,
      pivotY,
      variant.width,
      variant.height,
      variant.color,
      false,
      blockAsset
    );

    this.currentBlock.setInstability(this.cumulativeInstability);
  }

  evaluateRank(score, maxScore) {
    const ratio = score / maxScore;
    if (ratio >= CONFIG.RANK_THRESHOLDS.S) return 'S';
    if (ratio >= CONFIG.RANK_THRESHOLDS.A) return 'A';
    if (ratio >= CONFIG.RANK_THRESHOLDS.B) return 'B';
    return 'C';
  }

  dropBlock() {
    if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
      this.currentBlock.drop();
      if (typeof soundManager !== 'undefined') soundManager.play('drop');
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

      if (this.currentBlock.isFalling()) {
        if (this.currentBlock.x <= 0 || (this.currentBlock.x + this.currentBlock.width) >= CONFIG.CANVAS_WIDTH) {
          this.handleMiss('CHẠM VIỀN! (-1 TIM)', true);
          return;
        }

        if (this.stars.checkCollision(this.currentBlock)) {
          if (typeof soundManager !== 'undefined') soundManager.play('star');
          this.showFeedback('+1 SAO KÝ ỨC! ⭐');
          this.updateHUD();
        }
      }

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
            this.handleMiss('TRƯỢT ĐẾ! (-1 TIM)', false);
          }
        }
      }
    }

    this.camera.update(topBlock.y);
  }

  // --- HÀM ĐÁNH GIÁ TỔNG KẾT MÀN CHƠI CHUẨN XÁC 2 CƠ CHẾ ---
  handleLevelCompletion() {
    this.isPaused = true;
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    const maxPossibleScore = lvlCfg.targetBlocks * 10;
    const rank = this.evaluateRank(this.score, maxPossibleScore);
    const starsGot = this.stars.collectedCount;

    const isRankS = (rank === 'S');      // Cơ chế 2: Điểm đạt S mới tính hoàn thành map
    const hasEnoughStars = (starsGot === 3); // Cơ chế 1: Đủ 3/3 sao mới được mở map tiếp theo

    // Ghi nhận dữ liệu vào storage
    if (this.storage) {
      this.storage.recordMapResult(this.currentLevel, this.score, rank, starsGot);
    }

    // 1. Hiển thị Sao & Huy hiệu Rank
    if (this.ui.endStars) {
      this.ui.endStars.innerHTML = `
        <div style="font-size: 32px; letter-spacing: 4px; margin-bottom: 8px;">
          ${'⭐'.repeat(starsGot)}${'☆'.repeat(3 - starsGot)}
        </div>
        <div>XẾP HẠNG: <span class="rank-badge rank-${rank.toLowerCase()}">${rank}</span></div>
      `;
    }

    if (this.ui.endScore) {
      this.ui.endScore.textContent = `Điểm kỹ năng: ${this.score}/${maxPossibleScore} (${Math.round((this.score / maxPossibleScore) * 100)}%)`;
    }

    // 2. Phân loại chi tiết theo 4 trường hợp
    let titleText = '';
    let hintHtml = '';

    if (hasEnoughStars && isRankS) {
      // TH 1: Hoàn hảo tuyệt đối
      titleText = `HOÀN THÀNH XUẤT SẮC MAP ${this.currentLevel}!`;
      hintHtml = `
        <div class="status-box success">
          <p class="status-title">🎉 HOÀN THÀNH BẢN ĐỒ TOÀN DIỆN!</p>
          <p class="status-desc">Bạn đã đạt chuẩn <b>Hạng S</b> và thu thập đủ <b>3/3 Sao Ký Ức</b>!</p>
        </div>
      `;
    } else if (hasEnoughStars && !isRankS) {
      // TH 2: Đủ sao nhưng điểm chưa đạt S
      titleText = `KẾT THÚC MAP ${this.currentLevel}`;
      hintHtml = `
        <div class="status-box warning">
          <p class="status-title">⚠️ CHƯA HOÀN THÀNH BẢN ĐỒ (Cần Hạng S)</p>
          <p class="status-desc">Bạn đạt <b>Hạng ${rank}</b>. Bản đồ chỉ được tính là hoàn thành khi đạt <b>Hạng S</b>.<br>
          <small style="color: #38bdf8;">(Đã đủ 3/3 Sao nên bạn vẫn có thể sang Map tiếp theo hoặc chơi lại để lấy S)</small></p>
        </div>
      `;
    } else if (!hasEnoughStars && isRankS) {
      // TH 3: Điểm đạt S nhưng thiếu sao
      titleText = `THIẾU SAO TẠI MAP ${this.currentLevel}`;
      hintHtml = `
        <div class="status-box danger">
          <p class="status-title">🔒 MAP TIẾP THEO ĐANG KHÓA (Cần 3/3 ⭐)</p>
          <p class="status-desc">Kỹ năng đạt <b>Hạng S</b> rất tốt, nhưng bạn mới có <b>${starsGot}/3</b> Sao.<br>
          Bắt buộc phải có đủ <b>3/3 Sao Ký Ức</b> mới mở được màn kế tiếp!</p>
        </div>
      `;
    } else {
      // TH 4: Vừa thiếu sao vừa chưa đạt S
      titleText = `CHƯA HOÀN THÀNH MAP ${this.currentLevel}`;
      hintHtml = `
        <div class="status-box danger">
          <p class="status-title">🔒 CHƯA ĐỦ ĐIỀU KIỆN TIẾP TỤC!</p>
          <p class="status-desc">Bạn chỉ đạt <b>Hạng ${rank}</b> và thiếu sao (<b>${starsGot}/3 ⭐</b>).<br>
          Hãy chơi lại để đạt chuẩn Hạng S và thu thập trọn vẹn 3 Sao!</p>
        </div>
      `;
    }

    if (this.ui.endTitle) this.ui.endTitle.textContent = titleText;
    if (this.ui.endHint) this.ui.endHint.innerHTML = hintHtml;

    // 3. Điều khiển trạng thái nút bấm
    if (hasEnoughStars) {
      // Đủ sao -> Nút Next khả dụng
      if (this.ui.btnNext) {
        this.ui.btnNext.disabled = false;
        this.ui.btnNext.classList.remove('disabled');
        if (this.currentLevel < 3) {
          this.ui.btnNext.textContent = `SANG MAP ${this.currentLevel + 1} ❯`;
          this.ui.btnNext.style.display = 'block';
        } else {
          this.ui.btnNext.textContent = `XEM ĐOẠN KẾT (OUTRO)`;
        }
      }
      if (this.ui.btnReplay) {
        this.ui.btnReplay.textContent = isRankS ? 'CHƠI LẠI MÀN NÀY' : 'CHƠI LẠI ĐỂ LẤY HẠNG S 🔄';
      }
    } else {
      // Thiếu sao -> Khóa cứng nút Next
      if (this.ui.btnNext) {
        this.ui.btnNext.disabled = true;
        this.ui.btnNext.classList.add('disabled');
        this.ui.btnNext.textContent = (this.currentLevel < 3) 
          ? `MAP ${this.currentLevel + 1} KHÓA (CẦN 3/3 ⭐) 🔒` 
          : `OUTRO ĐANG KHÓA (CẦN 3/3 ⭐) 🔒`;
      }
      if (this.ui.btnReplay) {
        this.ui.btnReplay.textContent = 'CHƠI LẠI ĐỂ TÌM ĐỦ 3 SAO 🔄';
      }
    }

    if (this.ui.endModal) {
      this.ui.endModal.classList.remove('hidden');
    }
  }

  showVictoryScreen() {
    if (this.ui.endTitle) this.ui.endTitle.textContent = 'HOÀN THÀNH TẤT CẢ MAP!';
    if (this.ui.endStars) this.ui.endStars.textContent = '⭐⭐⭐';
    if (this.ui.endScore) this.ui.endScore.textContent = `Tổng điểm kỹ năng: ${this.score}`;
    if (this.ui.endHint) this.ui.endHint.innerHTML = `<span style="color: #facc15; font-weight: bold;">Chúc mừng bạn đã khôi phục lại bầu trời đêm trọn vẹn!</span>`;
    if (this.ui.btnNext) {
      this.ui.btnNext.textContent = 'CHƠI LẠI TỪ ĐẦU';
      this.ui.btnNext.disabled = false;
      this.ui.btnNext.classList.remove('disabled');
      this.ui.btnNext.onclick = () => { location.reload(); };
    }
    if (this.ui.endModal) {
      this.ui.endModal.classList.remove('hidden');
    }
  }

  showFeedback(text) {
    if (!this.ui.feedback) return;
    this.ui.feedback.textContent = text;
    this.ui.feedback.classList.add('show');
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.ui.feedback.classList.remove('show');
    }, 650);
  }

  updateHUD() {
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    if (this.ui.floor) this.ui.floor.textContent = this.floor;
    if (this.ui.target) this.ui.target.textContent = lvlCfg.targetBlocks;
    if (this.ui.score) this.ui.score.textContent = this.score;
    if (this.ui.hearts) this.ui.hearts.textContent = '❤️'.repeat(Math.max(0, this.lives));
    if (this.ui.stars) this.ui.stars.textContent = `${this.stars.collectedCount}/3`;
    if (this.ui.levelTitle) this.ui.levelTitle.textContent = `MAP ${this.currentLevel}: ${lvlCfg.name.toUpperCase()}`;
  }

  render() {
    this.bg.render(this.ctx, this.camera, this.currentLevel, this.floor);
    this.hazards.render(this.ctx, this.camera, this.currentLevel);
    this.stars.render(this.ctx, this.camera);
    for (const b of this.landedBlocks) b.render(this.ctx, this.camera);
    if (this.currentBlock) this.currentBlock.render(this.ctx, this.camera);
  }

  triggerScreenShake() {
    if (this.container) {
      this.container.classList.remove('shake-screen');
      void this.container.offsetWidth;
      this.container.classList.add('shake-screen');
      setTimeout(() => {
        if (this.container) this.container.classList.remove('shake-screen');
      }, 360);
    }
  }

  triggerEdgeBorderFlash() {
    if (this.ui.edgeOverlay) {
      this.ui.edgeOverlay.classList.add('show');
      clearTimeout(this.edgeTimer);
      this.edgeTimer = setTimeout(() => {
        if (this.ui.edgeOverlay) this.ui.edgeOverlay.classList.remove('show');
      }, 450);
    }
  }

  handleMiss(reason, isWallHit = false) {
    if (typeof soundManager !== 'undefined') soundManager.play('miss');
    this.triggerScreenShake();

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