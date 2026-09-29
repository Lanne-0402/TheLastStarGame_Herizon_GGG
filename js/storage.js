export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'THE_LAST_STAR_DATA_V2';
    this.data = this.load();
  }

  // Khởi tạo mặc định nếu chưa từng chơi
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    const defaultData = {
      unlockedLevels: [1],   // Mở map mới (được phép chơi)
      completedLevels: [],   // CHỈ HOÀN THÀNH KHI ĐẠT RANK S
      bestRanks: { 1: '-', 2: '-', 3: '-' },
      bestScores: { 1: 0, 2: 0, 3: 0 }
    };
    this.save(defaultData);
    return defaultData;
  }

  save(customData = null) {
    if (customData) this.data = customData;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }

  // Mở khóa map tiếp theo (không yêu cầu phải có rank S)
  unlockLevel(lvl) {
    if (!this.data.unlockedLevels.includes(lvl) && lvl <= 3) {
      this.data.unlockedLevels.push(lvl);
      this.save();
    }
  }

  // Ghi nhận kết quả map: Bắt buộc starsGot === 3 mới unlockLevel kế tiếp
  recordMapResult(lvl, score, rank, starsGot) {
    // 1. Cập nhật Điểm & Rank cao nhất
    if (score > (this.data.bestScores[lvl] || 0)) {
      this.data.bestScores[lvl] = score;
    }
    this.data.bestRanks[lvl] = rank;

    // 2. KHÓA CHẶT TIẾN TRÌNH: CHỈ KHI ĐỦ 3/3 SAO MỚI MỞ KHÓA MAP TIẾP THEO
    if (starsGot === 3 && lvl < 3) {
      this.unlockLevel(lvl + 1);
    }

    // 3. Đánh giá hoàn thành map (khi đạt Rank S)
    if (rank === 'S' && !this.data.completedLevels.includes(lvl)) {
      this.data.completedLevels.push(lvl);
    }

    this.save();
  }

  isMapCompleted(lvl) {
    return this.data.completedLevels.includes(Number(lvl));
  }

  markIntroSeen() {
    this.data.introSeen = true;
    this.save();
  }
}