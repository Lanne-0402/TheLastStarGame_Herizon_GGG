export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'ECO_TOWER_SAVE_DATA';
    this.data = this.load();
  }

  // Khởi tạo mặc định nếu chưa từng chơi
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage không khả dụng, sử dụng bộ nhớ tạm.', e);
    }

    // Giá trị ban đầu
    const defaultData = {
      playerId: 'ECO-' + Math.floor(1000 + Math.random() * 9000),
      unlockedLevels: [1], // Màn 1 mở sẵn
      highScores: { 1: 0, 2: 0, 3: 0 },
      bestRanks: { 1: '-', 2: '-', 3: '-' },
      introSeen: false
    };
    this.save(defaultData);
    return defaultData;
  }

  save(customData = null) {
    if (customData) this.data = customData;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Không thể ghi LocalStorage', e);
    }
  }

  unlockLevel(level) {
    if (!this.data.unlockedLevels.includes(level) && level <= 3) {
      this.data.unlockedLevels.push(level);
      this.save();
    }
  }

  isLevelUnlocked(level) {
    return this.data.unlockedLevels.includes(Number(level));
  }

  recordLevelResult(level, score, rank) {
    // Cập nhật Highscore
    if (score > (this.data.highScores[level] || 0)) {
      this.data.highScores[level] = score;
    }
    // Cập nhật Rank tốt nhất
    this.data.bestRanks[level] = rank;

    // Tự động mở khóa màn tiếp theo nếu qua màn
    if (level < 3) {
      this.unlockLevel(level + 1);
    }
    this.save();
  }

  markIntroSeen() {
    this.data.introSeen = true;
    this.save();
  }
}