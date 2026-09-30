export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'THE_LAST_STAR_SAVE';
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.unlockedLevels)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', e);
    }

    const defaultData = {
      unlockedLevels: [1], // Mặc định mở Map 1
      stars: { 1: 0, 2: 0, 3: 0 },
      highScores: { 1: 0, 2: 0, 3: 0 },
      bestRanks: { 1: '-', 2: '-', 3: '-' }
    };
    this.save(defaultData);
    return defaultData;
  }

  save(data = null) {
    if (data) this.data = data;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Lỗi ghi LocalStorage:', e);
    }
  }

  isLevelUnlocked(lvl) {
    if (!this.data || !Array.isArray(this.data.unlockedLevels)) {
      return Number(lvl) === 1;
    }
    return this.data.unlockedLevels.includes(Number(lvl));
  }

  recordResult(level, score, starsCollected, rank) {
    if (score > (this.data.highScores[level] || 0)) {
      this.data.highScores[level] = score;
    }
    if (starsCollected > (this.data.stars[level] || 0)) {
      this.data.stars[level] = starsCollected;
    }
    this.data.bestRanks[level] = rank;

    // Thu đủ 3 sao mới mở khóa Map tiếp theo
    if (starsCollected >= 3 && level < 3) {
      if (!this.data.unlockedLevels.includes(level + 1)) {
        this.data.unlockedLevels.push(level + 1);
      }
    }
    this.save();
  }
}