import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Block, BlockState } from './block.js';
import { HazardManager } from './hazards.js';
import { ItemManager } from './items.js';
import { StorageManager } from './storage.js';
import { ParallaxBackground } from './background.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = document.getElementById('game-container');
    
    this.camera = new Camera();
    this.hazards = new HazardManager();
    this.items = new ItemManager();
    this.storage = new StorageManager();
    this.bg = new ParallaxBackground();

    this.currentLevel = 1;
    this.landedBlocks = [];
    this.currentBlock = null;
    
    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.pollution = 0;
    this.maxFloors = CONFIG.DEBUG_FAST_WIN ? 15 : CONFIG.TARGET_BLOCKS;

    this.lastTime = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false; // CỜ QUẢN LÝ TẠM DỪNG VÒNG LẶP KHI ĐỌC TRUYỆN
    this.finalRank = 'C';

    this.storyIndex = 0;
    this.storyMode = 'intro';
    this.introSlides = [
      {
        art: '🏙️💡',
        title: 'BẦU TRỜI LÃNG QUÊN',
        desc: 'Ánh sáng nhân tạo và năng lượng lãng phí từ các đại đô thị đã phủ mờ bầu trời đêm. Những chòm sao rực rỡ từ ngàn xưa nay đã biến mất hoàn toàn.'
      },
      {
        art: '✨🌱',
        title: 'SỨ MỆNH LINH HỒN',
        desc: 'Là một sinh linh ánh sáng, bạn mang sứ mệnh xếp chồng các tầng tháp sinh thái, đưa ngọn tháp vượt qua tầng mây ô nhiễm để tìm lại các vì sao.'
      },
      {
        art: '⚖️⭐',
        title: 'CÂN BẰNG BỀN VỮNG',
        desc: 'Sử dụng Tòa Neon sẽ cho điểm số lớn nhưng sinh ra ô nhiễm sáng cực nặng. Hãy cân bằng bằng Mái Xanh để đạt chuẩn Rank S và thu thập trọn vẹn Ngôi sao!'
      }
    ];

    this.outroSlides = [
      {
        art: '🌌🎉',
        title: 'CHÒM SAO ĐÃ TỎA SÁNG!',
        desc: 'Bạn đã đưa tháp xuyên qua tầng khí quyển giông bão. Năng lượng xanh đã thắp sáng cộng đồng mà không làm mất đi vẻ đẹp kỳ vĩ của vũ trụ.'
      },
      {
        art: '🏆🌟',
        title: 'SỨ GIẢ NĂNG LƯỢNG ESG',
        desc: 'Demo hoàn tất xuất sắc! Bạn đã chứng minh: Năng lượng cho tất cả mọi người (SDG 7) chỉ thực sự có ý nghĩa khi đi kèm với bảo vệ sinh thái.'
      }
    ];

    this.uiElements = {
      floor: document.getElementById('floor-counter'),
      target: document.getElementById('target-counter'),
      score: document.getElementById('score-counter'),
      hearts: document.getElementById('heart-counter'),
      feedback: document.getElementById('combo-feedback'),
      pollutionBar: document.getElementById('pollution-bar'),
      pollutionPercent: document.getElementById('pollution-percent'),
      countGreen: document.getElementById('count-green'),
      countNeon: document.getElementById('count-neon'),
      btnGreen: document.getElementById('btn-slot-green'),
      btnNeon: document.getElementById('btn-slot-neon'),
      playerTag: document.getElementById('player-tag'),
      storyModal: document.getElementById('storyboard-overlay'),
      storyArt: document.getElementById('story-art'),
      storyTitle: document.getElementById('story-title'),
      storyDesc: document.getElementById('story-desc'),
      btnStoryNext: document.getElementById('btn-story-next'),
      btnStorySkip: document.getElementById('btn-story-skip')
    };

    this.init();
  }

  init() {
    if (this.uiElements.target) this.uiElements.target.textContent = this.maxFloors;
    if (this.uiElements.playerTag) this.uiElements.playerTag.textContent = `ID: ${this.storage.data.playerId}`;

    this.setupInputs();
    this.setupStoryboardEvents();

    // 1. LUÔN KHỞI TẠO MÀN 1 ĐỂ DỰNG SẴN KHỐI MÓNG
    this.startLevel(1);

    // 2. NẾU CHƯA XEM INTRO THÌ MỞ POPUP VÀ TẠM DỪNG GAMEPLAY
    if (!this.storage.data.introSeen) {
      this.openStoryboard('intro');
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  restart() {
    this.startLevel(this.currentLevel || 1);
  }

  openStoryboard(mode = 'intro') {
    this.storyMode = mode;
    this.storyIndex = 0;
    this.isPaused = true; // Tạm dừng chuyển động
    if (this.uiElements.storyModal) {
      this.uiElements.storyModal.classList.remove('hidden');
    }
    this.renderStorySlide();
  }

  renderStorySlide() {
    const list = this.storyMode === 'intro' ? this.introSlides : this.outroSlides;
    const slide = list[this.storyIndex];

    if (this.uiElements.storyArt) this.uiElements.storyArt.textContent = slide.art;
    if (this.uiElements.storyTitle) this.uiElements.storyTitle.textContent = slide.title;
    if (this.uiElements.storyDesc) this.uiElements.storyDesc.textContent = slide.desc;
    if (this.uiElements.btnStoryNext) {
      this.uiElements.btnStoryNext.textContent = (this.storyIndex === list.length - 1) ? 'BẮT ĐẦU' : 'TIẾP TỤC';
    }
  }

  setupStoryboardEvents() {
    if (this.uiElements.btnStoryNext) {
      this.uiElements.btnStoryNext.addEventListener('click', () => {
        const list = this.storyMode === 'intro' ? this.introSlides : this.outroSlides;
        this.storyIndex++;
        if (this.storyIndex >= list.length) {
          this.closeStoryboard();
        } else {
          this.renderStorySlide();
        }
      });
    }

    if (this.uiElements.btnStorySkip) {
      this.uiElements.btnStorySkip.addEventListener('click', () => {
        this.closeStoryboard();
      });
    }

    for (let lvl = 1; lvl <= 3; lvl++) {
      const btn = document.getElementById(`btn-lvl-${lvl}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.storage.isLevelUnlocked(lvl)) {
            this.startLevel(lvl);
          } else {
            this.showFeedback(`MÀN ${lvl} ĐANG KHÓA!`);
          }
        });
      }
    }
  }

  closeStoryboard() {
    if (this.uiElements.storyModal) {
      this.uiElements.storyModal.classList.add('hidden');
    }
    this.isPaused = false; // Cho phép tiếp tục chơi
    if (this.storyMode === 'intro') {
      this.storage.markIntroSeen();
    } else {
      this.startLevel(1);
    }
  }

  triggerScreenShake() {
    if (this.container) {
      this.container.classList.remove('shake-screen');
      void this.container.offsetWidth;
      this.container.classList.add('shake-screen');
      setTimeout(() => this.container.classList.remove('shake-screen'), 360);
    }
  }

  refreshLevelBadges() {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const btn = document.getElementById(`btn-lvl-${lvl}`);
      if (btn) {
        const isUnlocked = this.storage.isLevelUnlocked(lvl);
        btn.classList.toggle('locked', !isUnlocked);
        btn.classList.toggle('active', this.currentLevel === lvl);
        btn.textContent = isUnlocked ? `LV ${lvl}` : `LV ${lvl} 🔒`;
      }
    }
  }

  setupInputs() {
    const triggerDrop = (e) => {
      // Khi đang tạm dừng đọc truyện thì không thả khối
      if (this.isPaused) return;

      if (e.target && (e.target.closest('#inventory-bar') || e.target.closest('#storyboard-overlay') || e.target.closest('#level-badges'))) {
        return;
      }

      if (e.type === 'touchstart' || (e.type === 'keydown' && e.code === 'Space')) {
        e.preventDefault();
      }

      if (this.isGameOver || this.isVictory) {
        this.restart();
        return;
      }

      if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
        this.currentBlock.drop();
      }
    };

    window.addEventListener('pointerdown', triggerDrop);
    
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') triggerDrop(e);
      if (e.key === 'q' || e.key === 'Q') this.useItem('green');
      if (e.key === 'e' || e.key === 'E') this.useItem('neon');

      // Phím tắt chuyển Level nhanh cho BGK
      if (e.key === '1') this.startLevel(1);
      if (e.key === '2') this.startLevel(2);
      if (e.key === '3') this.startLevel(3);
    });

    if (this.uiElements.btnGreen) {
      this.uiElements.btnGreen.addEventListener('click', () => this.useItem('green'));
    }
    if (this.uiElements.btnNeon) {
      this.uiElements.btnNeon.addEventListener('click', () => this.useItem('neon'));
    }
  }

  useItem(type) {
    if (this.isGameOver || this.isVictory || this.isPaused) return;
    const success = this.items.selectType(type);
    if (success) {
      const itemKey = type.toUpperCase();
      const itemCfg = CONFIG.ITEM_TYPES[itemKey] || CONFIG.ITEM_TYPES.GREEN || CONFIG.ITEM_TYPES.NORMAL;
      this.showFeedback(`ĐÃ CHỌN: ${itemCfg.name.toUpperCase()}`);

      if (this.currentBlock && this.currentBlock.state === BlockState.SWINGING) {
        const nextType = this.items.consumeNextType();
        this.currentBlock = new Block(
          this.currentBlock.x,
          this.currentBlock.y,
          CONFIG.BLOCK_WIDTH,
          CONFIG.BLOCK_HEIGHT,
          this.currentBlock.speed,
          false,
          nextType
        );
      }
      this.updateHUD();
    } else {
      this.showFeedback('HẾT VẬT PHẨM!');
    }
  }

  startLevel(lvl) {
    this.currentLevel = Number(lvl);
    this.landedBlocks = [];
    this.camera.reset();
    this.hazards.reset();
    this.items.reset();

    this.lives = CONFIG.MAX_LIVES;
    this.score = 0;
    this.floor = 0;
    this.pollution = 0;
    this.isGameOver = false;
    this.isVictory = false;

    // Tạo khối móng vững chắc dưới đáy
    const baseBlock = new Block(
      (CONFIG.CANVAS_WIDTH - CONFIG.BLOCK_WIDTH) / 2,
      CONFIG.CANVAS_HEIGHT - 60,
      CONFIG.BLOCK_WIDTH,
      CONFIG.BLOCK_HEIGHT,
      0,
      true
    );
    this.landedBlocks.push(baseBlock);

    this.hazards.setupLevel(this.currentLevel, baseBlock.y);
    this.spawnNextBlock();
    this.updateHUD();
    this.refreshLevelBadges();
    this.showFeedback(`MÀN ${this.currentLevel}: ${CONFIG.LEVELS[this.currentLevel].name.toUpperCase()}`);
  }

  spawnNextBlock() {
    const currentSpeed = CONFIG.BASE_SWING_SPEED + (this.floor * CONFIG.SPEED_INCREMENT);
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    const spawnY = (topBlock ? topBlock.y : CONFIG.CANVAS_HEIGHT) - 180;
    const blockType = this.items.consumeNextType();

    this.currentBlock = new Block(
      0,
      spawnY,
      CONFIG.BLOCK_WIDTH,
      CONFIG.BLOCK_HEIGHT,
      currentSpeed,
      false,
      blockType
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
    // Nếu game kết thúc hoặc đang mở Storyboard thì không chạy vật lý
    if (this.isGameOver || this.isVictory || this.isPaused) return;

    // CHỐT CHẶN AN TOÀN: Đảm bảo landedBlocks luôn có ít nhất 1 phần tử
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    if (!topBlock) return;

    this.hazards.update(dt, this.currentLevel, this.currentBlock, topBlock.y);
    this.items.update(dt);

    if (this.currentBlock) {
      this.currentBlock.update(dt);

      if (this.currentBlock.isFalling()) {
        const collectedType = this.items.checkBlockCollision(this.currentBlock);
        if (collectedType) {
          const itemKey = collectedType.toUpperCase();
          const itemCfg = CONFIG.ITEM_TYPES[itemKey] || CONFIG.ITEM_TYPES.GREEN || CONFIG.ITEM_TYPES.NORMAL;
          this.showFeedback(`+1 ${itemCfg.name.toUpperCase()}!`);
          this.updateHUD();
        }
      }

      if (this.currentBlock.state === BlockState.FALLING) {
        const result = this.currentBlock.checkLanding(topBlock);

        if (result) {
          this.showFeedback(result.feedback);
          if (result.success) {
            this.landedBlocks.push(this.currentBlock);
            this.floor++;
            this.score += result.score;

            this.adjustPollution(this.currentBlock.typeConfig.pollutionDelta);
            this.items.spawnItemIfEligible(this.floor, this.currentBlock.y);

            if (this.floor >= this.maxFloors) {
              this.isVictory = true;
              this.calculateRank();
              this.handleVictoryProgress();
            } else {
              this.spawnNextBlock();
            }
          } else {
            this.lives--;
            this.triggerScreenShake();
            if (this.lives <= 0) {
              this.isGameOver = true;
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

  adjustPollution(delta) {
    this.pollution = Math.max(0, Math.min(100, this.pollution + delta));
    if (this.pollution >= 100) {
      this.lives--;
      this.triggerScreenShake();
      this.pollution = 60;
      this.showFeedback('CẢNH BÁO: Ô NHIỄM ĐẠT ĐỈNH! (-1 TIM)');
      if (this.lives <= 0) this.isGameOver = true;
    }
  }

  calculateRank() {
    const maxPossibleScore = this.maxFloors * 12;
    const accuracy = this.score / maxPossibleScore;

    if (accuracy >= 0.80 && this.pollution <= 30) {
      this.finalRank = 'S';
    } else if (accuracy >= 0.65 && this.pollution <= 50) {
      this.finalRank = 'A';
    } else if (accuracy >= 0.45) {
      this.finalRank = 'B';
    } else {
      this.finalRank = 'C';
    }
  }

  handleVictoryProgress() {
    this.storage.recordLevelResult(this.currentLevel, this.score, this.finalRank);
    this.refreshLevelBadges();

    if (this.currentLevel === 3) {
      setTimeout(() => {
        this.openStoryboard('outro');
      }, 1200);
    }
  }

  showFeedback(text) {
    if (!this.uiElements.feedback) return;
    this.uiElements.feedback.textContent = text;
    this.uiElements.feedback.classList.add('show');
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.uiElements.feedback.classList.remove('show');
    }, 650);
  }

  updateHUD() {
    if (this.uiElements.floor) this.uiElements.floor.textContent = this.floor;
    if (this.uiElements.score) this.uiElements.score.textContent = this.score;
    if (this.uiElements.hearts) this.uiElements.hearts.textContent = '❤️'.repeat(Math.max(0, this.lives));
    
    if (this.uiElements.countGreen) this.uiElements.countGreen.textContent = this.items.inventory.green;
    if (this.uiElements.countNeon) this.uiElements.countNeon.textContent = this.items.inventory.neon;

    if (this.uiElements.pollutionBar) {
      this.uiElements.pollutionBar.style.width = `${this.pollution}%`;
      this.uiElements.pollutionBar.style.backgroundColor = 
        this.pollution > 75 ? '#ef4444' : (this.pollution > 45 ? '#eab308' : '#22c55e');
    }
    if (this.uiElements.pollutionPercent) {
      this.uiElements.pollutionPercent.textContent = `${this.pollution}%`;
    }
  }

  render() {
    this.bg.render(this.ctx, this.camera, this.currentLevel, this.floor);

    if (this.hazards) {
      this.hazards.render(this.ctx, this.camera, this.currentLevel);
    }

    if (this.items) {
      this.items.render(this.ctx, this.camera);
    }

    for (const block of this.landedBlocks) {
      block.render(this.ctx, this.camera);
    }

    if (this.currentBlock) {
      this.currentBlock.render(this.ctx, this.camera);
    }

    this.renderGoalStar();

    if (this.isGameOver) {
      this.renderOverlay('THẤT BẠI', 'Chạm vào màn hình để thử lại', '#ef4444');
    } else if (this.isVictory) {
      const isRankS = this.finalRank === 'S';
      const rankMsg = isRankS 
        ? 'XUẤT SẮC! Bầu trời sao đã trở lại' 
        : 'Cần đạt Rank S để hoàn thành Level';
      this.renderOverlay(`HẠNG [ ${this.finalRank} ]`, `${rankMsg} | Điểm: ${this.score}`, isRankS ? '#facc15' : '#38bdf8');
    }
  }

  renderGoalStar() {
    if (this.landedBlocks.length === 0) return;
    const topBlock = this.landedBlocks[this.landedBlocks.length - 1];
    if (this.floor >= this.maxFloors - 1) {
      const starY = topBlock.y - 120 - this.camera.y;
      this.ctx.save();
      this.ctx.font = '40px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⭐', CONFIG.CANVAS_WIDTH / 2, starY);
      this.ctx.restore();
    }
  }

  renderOverlay(title, subtitle, color) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 36px sans-serif';
    this.ctx.fillText(title, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 25);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '15px sans-serif';
    this.ctx.fillText(subtitle, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 25);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '13px sans-serif';
    this.ctx.fillText('Chạm để chơi lại | Đổi Màn ở góc trên', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 65);
  }
}