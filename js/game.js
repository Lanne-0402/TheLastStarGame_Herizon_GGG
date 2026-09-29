import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Block, BlockState } from './block.js';
import { HazardManager } from './hazards.js';
import { StarManager } from './stars.js';
import { ParallaxBackground } from './background.js';
import { ASSETS, soundManager, assetLoader } from './assets.js';
import { StorageManager } from './storage.js';
import { UIManager } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    

    this.camera = new Camera();
    this.hazards = new HazardManager();
    this.stars = new StarManager();
    this.bg = new ParallaxBackground();
    this.storage = new StorageManager(); // 2. KHỞI TẠO STORAGE MANAGER
    this.uiManager = new UIManager(this);
    this.ui = this.uiManager;

    this.currentLevel = 1;
    this.landedBlocks = [];
    this.currentBlock = null;
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.cumulativeInstability = 0;
    this.isPaused = true;
    this.isGameOver = false;
    this.lastTime = 0;
    this.init();

    // this.memoryTexts = {
    //   1: {
    //     title: 'KÝ ỨC 1: MÁI ẤM & BẦU TRỜI SAO',
    //     desc: 'Sinh linh nhìn thấy gia đình quây quần bên hiên nhà với một ngọn đèn nhỏ. Ánh sáng cần thiết cho cuộc sống vẫn có thể chan hòa cùng bóng đêm kỳ vĩ.'
    //   },
    //   2: {
    //     title: 'KÝ ỨC 2: BIỂN CẢ VÀ ĐÈN DẪN LỐI',
    //     desc: 'Những ngư dân dùng ánh sáng vừa đủ để làm việc và định hướng trên biển, nhường lại khoảng trời đêm cho các vì sao chỉ đường.'
    //   }
    // };

    // this.container = document.getElementById('game-container');
    // this.ui = {
    //   floor: document.getElementById('floor-counter'),
    //   target: document.getElementById('target-counter'),
    //   score: document.getElementById('score-counter'),
    //   hearts: document.getElementById('heart-counter'),
    //   stars: document.getElementById('star-counter'),
    //   levelTitle: document.getElementById('level-title'),
    //   feedback: document.getElementById('combo-feedback'),
    //   edgeOverlay: document.getElementById('edge-warning-overlay'),

    //   startScreen: document.getElementById('start-screen'),
    //   btnStartGame: document.getElementById('btn-start-game'),

    //   videoOverlay: document.getElementById('video-overlay'),
    //   video: document.getElementById('story-video'),
    //   btnSkipVideo: document.getElementById('btn-skip-video'),

    //   memoryModal: document.getElementById('memory-modal'),
    //   memoryImg: document.getElementById('memory-img'),
    //   memoryFallback: document.getElementById('memory-fallback'),
    //   memoryTitle: document.getElementById('memory-title'),
    //   memoryDesc: document.getElementById('memory-desc'),
    //   btnCloseMemory: document.getElementById('btn-close-memory'),

    //   endModal: document.getElementById('level-end-modal'),
    //   endTitle: document.getElementById('end-title'),
    //   endStars: document.getElementById('end-stars-display'),
    //   endScore: document.getElementById('end-score-info'),
    //   endHint: document.getElementById('end-memory-status'),
    //   btnReplay: document.getElementById('btn-replay-map'),
    //   btnNext: document.getElementById('btn-next-map')
    // };

  }

  init() {
    this.setupEvents();

    this.uiManager.showScreen('loading');
    setTimeout(() => {
      this.uiManager.showScreen('menu');
    }, 1200);

    requestAnimationFrame(this.loop.bind(this));
  }
  setupEvents() {
    const handleAction = (e) => {
      // Bỏ qua nếu bấm trúng nút bấm UI hoặc Modal
      if (e.target && (e.target.closest('button') || e.target.closest('.ui-modal'))) {
        return;
      }
      if (this.isPaused) {
        this.isPaused = false; // Tự động kích hoạt unpause nếu đang kẹt
      }
      this.dropBlock();
    };

    window.addEventListener('pointerdown', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') handleAction(e);
      if (e.key === '1') this.startLevel(1);
      if (e.key === '2') this.startLevel(2);
      if (e.key === '3') this.startLevel(3);
    });
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
    const lvlCfg = CONFIG.LEVELS[this.currentLevel] || CONFIG.LEVELS[1];
    const variations = lvlCfg.blockVariations || [
      { width: 140, height: 42, color: '#38bdf8' }
    ];
    const variant = variations[Math.floor(Math.random() * variations.length)];

    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    const ropeLen = CONFIG.LIGHT_ROPE_LENGTH || 170;
    
    // Đảm bảo toạ độ Y luôn là số nguyên hợp lệ nằm phía trên khối móng
    const baseTopY = topBlock ? topBlock.y : (CONFIG.CANVAS_HEIGHT - 60);
    const spawnY = baseTopY - ropeLen;

    this.currentBlock = new Block(
      (CONFIG.CANVAS_WIDTH - variant.width) / 2,
      spawnY,
      variant.width,
      variant.height,
      variant.color,
      false
    );

    this.currentBlock.setInstability(this.cumulativeInstability || 0);
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

      if (this.currentBlock.isFalling()) {
        if (this.stars.checkCollision(this.currentBlock)) {
          soundManager.play('star');
          this.showFeedback('+1 SAO KÝ ỨC! ⭐');
          this.updateHUD();
        }
      }

      if (this.currentBlock.state === BlockState.FALLING) {
        const result = this.currentBlock.checkLanding(topBlock);

        if (result) {
          this.showFeedback(`${result.feedback} (${Math.round(result.ratio * 100)}%)`);

          if (result.success) {
            soundManager.play('land');
            this.landedBlocks.push(this.currentBlock);
            this.floor++;
            this.score += result.score;
            this.cumulativeInstability += Math.max(0, 0.95 - result.ratio) * 0.4;

            const targetBlocks = CONFIG.LEVELS[this.currentLevel].targetBlocks;
            if (this.floor >= targetBlocks) {
              this.isPaused = true;
              setTimeout(() => {
                this.uiManager.showWin(this.score, this.stars.collectedCount);
              }, 600);
            } else {
              this.spawnNextBlock();
            }
          } else {
            soundManager.play('miss');
            this.lives--;
            if (this.lives <= 0) {
              this.isGameOver = true;
              setTimeout(() => {
                this.uiManager.showGameOver(this.score);
              }, 600);
            } else {
              this.spawnNextBlock();
            }
          }
          this.updateHUD();
        }
      }
    }

    this.camera.update(topBlock.y);
  }

  showFeedback(text) {
    this.uiManager.showFeedback(text);
  }

  updateHUD() {
    const lvlCfg = CONFIG.LEVELS[this.currentLevel];
    this.uiManager.updateHUD(
      this.floor,
      lvlCfg.targetBlocks,
      this.score,
      this.lives
    );
  }

  render() {
    this.bg.render(this.ctx, this.camera, this.currentLevel, this.floor);
    this.hazards.render(this.ctx, this.camera, this.currentLevel);
    this.stars.render(this.ctx, this.camera);
    for (const b of this.landedBlocks) b.render(this.ctx, this.camera);
    if (this.currentBlock) this.currentBlock.render(this.ctx, this.camera);
  }
}

//   setupEvents() {
//     this.ui.btnStartGame.addEventListener('click', () => {
//       this.ui.startScreen.classList.add('hidden');
//       this.playStoryVideo('intro', () => {
//         this.startLevel(1);
//       });
//     });

//     this.ui.btnSkipVideo.addEventListener('click', () => {
//       this.stopVideoAndContinue();
//     });

//     this.ui.video.addEventListener('ended', () => {
//       this.stopVideoAndContinue();
//     });

//     this.ui.video.addEventListener('error', () => {
//       this.stopVideoAndContinue();
//     });

//     this.ui.btnCloseMemory.addEventListener('click', () => {
//       this.ui.memoryModal.classList.add('hidden');
//       if (this.currentLevel < 3) {
//         this.startLevel(this.currentLevel + 1);
//       }
//     });

//     window.addEventListener('pointerdown', (e) => {
//       if (this.isPaused) return;
//       if (e.target.closest('button') || e.target.closest('.modal-overlay')) return;
//       this.dropBlock();
//     });

//     window.addEventListener('keydown', (e) => {
//       if (e.code === 'Space' && !this.isPaused) this.dropBlock();
//       // Phím tắt kiểm thử nhanh cho ban giám khảo
//       if (e.key === '1') this.startLevel(1);
//       if (e.key === '2') this.startLevel(2);
//       if (e.key === '3') this.startLevel(3);
//     });

//     this.ui.btnReplay.addEventListener('click', () => {
//       this.ui.endModal.classList.add('hidden');
//       this.startLevel(this.currentLevel);
//     });

//     // Xử lý nút Sang Map hoặc Xem Kết
//     this.ui.btnNext.addEventListener('click', () => {
//       const nextLvl = this.currentLevel + 1;

//       if (this.currentLevel < 3) {
//         // CHỐT CHẶN BẢO MẬT: Bắt buộc storage phải xác nhận đã unlock mới cho đi tiếp
//         if (this.storage && !this.storage.isLevelUnlocked(nextLvl)) {
//           this.showFeedback(`BẠN PHẢI THU ĐỦ 3 SAO ĐỂ MỞ MAP ${nextLvl}!`);
//           return;
//         }
//         this.ui.endModal.classList.add('hidden');
//         this.startLevel(nextLvl);
//       } else {
//         this.ui.endModal.classList.add('hidden');
//         this.playStoryVideo('outro', () => {
//           this.showVictoryScreen();
//         });
//       }
//     });
//   }

//   playStoryVideo(type, onComplete) {
//     this.isPaused = true;
//     this.onVideoEndCallback = onComplete;
//     const videoSrc = (ASSETS && ASSETS.VIDEOS && ASSETS.VIDEOS[type]) ? ASSETS.VIDEOS[type] : null;

//     if (!videoSrc) {
//       this.stopVideoAndContinue();
//       return;
//     }

//     fetch(videoSrc, { method: 'HEAD' })
//       .then((res) => {
//         if (res.ok) {
//           this.ui.video.src = videoSrc;
//           this.ui.videoOverlay.classList.remove('hidden');
//           this.ui.video.play().catch(() => this.stopVideoAndContinue());
//         } else {
//           this.stopVideoAndContinue();
//         }
//       })
//       .catch(() => this.stopVideoAndContinue());
//   }

//   stopVideoAndContinue() {
//     this.ui.video.pause();
//     this.ui.videoOverlay.classList.add('hidden');
//     if (this.onVideoEndCallback) {
//       const cb = this.onVideoEndCallback;
//       this.onVideoEndCallback = null;
//       cb();
//     }
//   }

//   startLevel(lvl) {
//     this.currentLevel = Number(lvl);
//     const lvlCfg = CONFIG.LEVELS[this.currentLevel];

//     this.landedBlocks = [];
//     this.camera.reset();
//     this.lives = CONFIG.MAX_LIVES;
//     this.score = 0;
//     this.floor = 0;
//     this.cumulativeInstability = 0;
//     this.isGameOver = false;
//     this.isPaused = false;

//     const baseBlock = new Block(
//       (CONFIG.CANVAS_WIDTH - 150) / 2,
//       CONFIG.CANVAS_HEIGHT - 60,
//       150,
//       45,
//       '#475569',
//       true
//     );
//     this.landedBlocks.push(baseBlock);

//     this.stars.setupLevel(lvlCfg, baseBlock.y);
//     this.hazards.setupLevel(this.currentLevel, baseBlock.y);

//     this.spawnNextBlock();
//     this.updateHUD();
//     this.showFeedback(`BẮT ĐẦU: ${lvlCfg.name.toUpperCase()}`);
//   }

//   spawnNextBlock() {
//     const lvlCfg = CONFIG.LEVELS[this.currentLevel];
//     const variations = lvlCfg.blockVariations;
//     const variant = variations[Math.floor(Math.random() * variations.length)];
//     const topBlock = this.landedBlocks[this.landedBlocks.length - 1];

//     const pivotX = CONFIG.CANVAS_WIDTH / 2;
//     const targetOffset = CONFIG.CANVAS_HEIGHT * 0.70;
//     const pivotY = (topBlock ? topBlock.y : CONFIG.CANVAS_HEIGHT) - targetOffset;

//     this.currentBlock = new Block(
//       pivotX,
//       pivotY,
//       variant.width,
//       variant.height,
//       variant.color,
//       false
//     );

//     this.currentBlock.setInstability(this.cumulativeInstability);
//   }

//   evaluateRank(score, maxScore) {
//     const ratio = score / maxScore;
//     if (ratio >= CONFIG.RANK_THRESHOLDS.S) return 'S';
//     if (ratio >= CONFIG.RANK_THRESHOLDS.A) return 'A';
//     if (ratio >= CONFIG.RANK_THRESHOLDS.B) return 'B';
//     return 'C';
//   }

//   dropBlock() {
//     if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
//       this.currentBlock.drop();
//       if (typeof soundManager !== 'undefined') soundManager.play('drop');
//     }
//   }

//   loop(timestamp) {
//     if (!this.lastTime) this.lastTime = timestamp;
//     const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
//     this.lastTime = timestamp;

//     this.update(dt);
//     this.render();
//     requestAnimationFrame(this.loop.bind(this));
//   }

//   update(dt) {
//     if (this.isPaused || this.isGameOver) return;
//     const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
//     if (!topBlock) return;

//     this.hazards.update(dt, this.currentLevel, this.currentBlock, topBlock.y);
//     this.stars.update(dt);

//     if (this.currentBlock) {
//       this.currentBlock.update(dt);

//       if (this.currentBlock.isFalling()) {
//         if (this.currentBlock.x <= 0 || (this.currentBlock.x + this.currentBlock.width) >= CONFIG.CANVAS_WIDTH) {
//           this.handleMiss('CHẠM VIỀN! (-1 TIM)', true);
//           return;
//         }

//         if (this.stars.checkCollision(this.currentBlock)) {
//           if (typeof soundManager !== 'undefined') soundManager.play('star');
//           this.showFeedback('+1 SAO KÝ ỨC! ⭐');
//           this.updateHUD();
//         }
//       }

//       if (this.currentBlock && this.currentBlock.state === BlockState.FALLING) {
//         const result = this.currentBlock.checkLanding(topBlock);

//         if (result) {
//           if (result.success) {
//             if (typeof soundManager !== 'undefined') soundManager.play('land');
//             this.showFeedback(`${result.feedback} (${Math.round(result.ratio * 100)}%)`);
//             this.landedBlocks.push(this.currentBlock);
//             this.floor++;
//             this.score += result.score;
//             this.cumulativeInstability += Math.max(0, 0.95 - result.ratio) * 0.4;

//             const targetBlocks = CONFIG.LEVELS[this.currentLevel].targetBlocks;
//             if (this.floor >= targetBlocks) {
//               this.handleLevelCompletion();
//             } else {
//               this.spawnNextBlock();
//             }
//             this.updateHUD();
//           } else {
//             this.handleMiss('TRƯỢT ĐẾ! (-1 TIM)', false);
//           }
//         }
//       }
//     }

//     this.camera.update(topBlock.y);
//   }

//   // --- HÀM ĐÁNH GIÁ TỔNG KẾT MÀN CHƠI CHUẨN XÁC 2 CƠ CHẾ ---
//   handleLevelCompletion() {
//     this.isPaused = true;
//     const starsGot = this.stars.collectedCount;
//     setTimeout(() => {
//       this.ui.showWin(this.score, starsGot);
//     }, 600);
//   }
//   handleGameOver() {
//     this.isGameOver = true;
//     setTimeout(() => {
//       this.ui.showGameOver(this.score);
//     }, 600);
//   }

//   showVictoryScreen() {
//     if (this.ui.endTitle) this.ui.endTitle.textContent = 'HOÀN THÀNH TẤT CẢ MAP!';
//     if (this.ui.endStars) this.ui.endStars.textContent = '⭐⭐⭐';
//     if (this.ui.endScore) this.ui.endScore.textContent = `Tổng điểm kỹ năng: ${this.score}`;
//     if (this.ui.endHint) this.ui.endHint.innerHTML = `<span style="color: #facc15; font-weight: bold;">Chúc mừng bạn đã khôi phục lại bầu trời đêm trọn vẹn!</span>`;
//     if (this.ui.btnNext) {
//       this.ui.btnNext.textContent = 'CHƠI LẠI TỪ ĐẦU';
//       this.ui.btnNext.disabled = false;
//       this.ui.btnNext.classList.remove('disabled');
//       this.ui.btnNext.onclick = () => { location.reload(); };
//     }
//     if (this.ui.endModal) {
//       this.ui.endModal.classList.remove('hidden');
//     }
//   }

//   showFeedback(text) {
//     if (!this.ui.feedback) return;
//     this.ui.showFeedback(text);
//   }

//   updateHUD() {
//     const lvlCfg = CONFIG.LEVELS[this.currentLevel];
//     this.ui.updateHUD(
//       this.floor,
//       lvlCfg.targetBlocks,
//       this.score,
//       this.lives,
//       this.stars.collectedCount
//     );
//   }

//   render() {
//     this.bg.render(this.ctx, this.camera, this.currentLevel, this.floor);
//     this.hazards.render(this.ctx, this.camera, this.currentLevel);
//     this.stars.render(this.ctx, this.camera);
//     for (const b of this.landedBlocks) b.render(this.ctx, this.camera);
//     if (this.currentBlock) this.currentBlock.render(this.ctx, this.camera);
//   }

//   triggerScreenShake() {
//     if (this.container) {
//       this.container.classList.remove('shake-screen');
//       void this.container.offsetWidth;
//       this.container.classList.add('shake-screen');
//       setTimeout(() => {
//         if (this.container) this.container.classList.remove('shake-screen');
//       }, 360);
//     }
//   }

//   triggerEdgeBorderFlash() {
//     if (this.ui.edgeOverlay) {
//       this.ui.edgeOverlay.classList.add('show');
//       clearTimeout(this.edgeTimer);
//       this.edgeTimer = setTimeout(() => {
//         if (this.ui.edgeOverlay) this.ui.edgeOverlay.classList.remove('show');
//       }, 450);
//     }
//   }

//   handleMiss(reason, isWallHit = false) {
//     if (typeof soundManager !== 'undefined') soundManager.play('miss');
//     this.triggerScreenShake();

//     if (isWallHit) {
//       this.triggerEdgeBorderFlash();
//     }

//     this.lives--;
//     this.showFeedback(reason);
//     this.updateHUD();

//     if (this.lives <= 0) {
//       this.isGameOver = true;
//       this.showFeedback('THẤT BẠI - HẾT MẠNG!');
//       setTimeout(() => this.startLevel(this.currentLevel), 1500);
//     } else {
//       this.spawnNextBlock();
//     }
//   }
// }