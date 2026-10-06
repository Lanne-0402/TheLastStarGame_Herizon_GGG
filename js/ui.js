export class UIManager {
  constructor(game) {
    this.game = game;

    this.screens = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      hud: document.getElementById('hud-ingame'),
      setting: document.getElementById('popup-setting'),
      complete: document.getElementById('popup-complete'),
      failed: document.getElementById('popup-failed')
    };

    this.hud = {
      hearts: document.getElementById('heart-bar'),
      floor: document.getElementById('floor-display'),
      score: document.getElementById('score-display'),
      progressFill: document.getElementById('star-progress-fill'),
      feedback: document.getElementById('feedback-text'),
      guide: document.getElementById('tutorial-guide')
    };

    this.boxes = {
      winScore: document.getElementById('win-score-box'),
      failScore: document.getElementById('fail-score-box'),
      winStars: [
        document.getElementById('win-star-1'),
        document.getElementById('win-star-2'),
        document.getElementById('win-star-3')
      ]
    };

    this.isMuted = false;
    this.setupEvents();
  }

  setupEvents() {
    const playBtn = document.getElementById('btn-play-game');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.showScreen('hud');
        this.game.startLevel(1);
      });
    }

    const settingBtn = document.getElementById('btn-menu-setting');
    if (settingBtn) {
      settingBtn.addEventListener('click', () => {
        this.screens.setting.classList.remove('hidden');
      });
    }

    const pauseBtn = document.getElementById('btn-hud-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.game.isPaused = true;
        this.screens.setting.classList.remove('hidden');
      });
    }

    const resumeBtn = document.getElementById('btn-setting-resume');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.screens.setting.classList.add('hidden');
        this.game.isPaused = false;
      });
    }

    const exitBtn = document.getElementById('btn-setting-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.screens.setting.classList.add('hidden');
        this.showScreen('menu');
        this.game.isPaused = true;
      });
    }

    const winHome = document.getElementById('btn-win-home');
    if (winHome) {
      winHome.addEventListener('click', () => {
        this.screens.complete.classList.add('hidden');
        this.showScreen('menu');
      });
    }

    const failHome = document.getElementById('btn-fail-home');
    if (failHome) {
      failHome.addEventListener('click', () => {
        this.screens.failed.classList.add('hidden');
        this.showScreen('menu');
      });
    }

    const winReplay = document.getElementById('btn-win-replay');
    if (winReplay) {
      winReplay.addEventListener('click', () => {
        this.screens.complete.classList.add('hidden');
        this.game.startLevel(this.game.currentLevel);
      });
    }

    const failReplay = document.getElementById('btn-fail-replay');
    if (failReplay) {
      failReplay.addEventListener('click', () => {
        this.screens.failed.classList.add('hidden');
        this.game.startLevel(this.game.currentLevel);
      });
    }

    const winNext = document.getElementById('btn-win-next');
    if (winNext) {
      winNext.addEventListener('click', () => {
        this.screens.complete.classList.add('hidden');
        if (this.game.currentLevel < 3) {
          this.game.startLevel(this.game.currentLevel + 1);
        }
      });
    }
  }

  showScreen(name) {
    if (!this.screens.loading || !this.screens.menu || !this.screens.hud) return;

    this.screens.loading.classList.add('hidden');
    this.screens.menu.classList.add('hidden');
    this.screens.hud.classList.add('hidden');

    if (name === 'loading') this.screens.loading.classList.remove('hidden');
    if (name === 'menu') this.screens.menu.classList.remove('hidden');
    if (name === 'hud') this.screens.hud.classList.remove('hidden');
  }

  updateHUD(floor, maxFloor, score, lives) {
    if (this.hud.floor) this.hud.floor.textContent = `${floor}/${maxFloor} Floor`;
    if (this.hud.score) this.hud.score.textContent = score;
    if (this.hud.hearts) this.hud.hearts.innerHTML = '❤️'.repeat(Math.max(0, lives));

    if (this.hud.progressFill) {
      const progressRatio = Math.min(1, floor / maxFloor);
      this.hud.progressFill.style.width = `${progressRatio * 100}%`;
    }

    if (this.hud.guide) {
      if (floor > 0) {
        this.hud.guide.classList.add('hidden');
      } else {
        this.hud.guide.classList.remove('hidden');
      }
    }
  }

  showFeedback(text) {
    if (!this.hud.feedback) return;
    this.hud.feedback.textContent = text;
    this.hud.feedback.classList.add('show');
    clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.hud.feedback.classList.remove('show');
    }, 600);
  }

  showWin(score, starsCount) {
    if (this.boxes.winScore) this.boxes.winScore.textContent = score;
    this.screens.complete.classList.remove('hidden');
  }

  showGameOver(score) {
    if (this.boxes.failScore) this.boxes.failScore.textContent = score;
    this.screens.failed.classList.remove('hidden');
  }
}