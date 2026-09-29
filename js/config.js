export const CONFIG = {
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 800,
  MAX_LIVES: 3,

  LIGHT_ROPE_LENGTH: 280,       
  BASE_SWING_SPEED: 2.2,      
  DROP_SPEED: 850,
  // Thông số Level & Test
  TARGET_BLOCKS: 20,
  DEBUG_FAST_WIN: false,
  
  // Khối nhà mặc định
  BLOCK_WIDTH: 140,
  BLOCK_HEIGHT: 45,      
  SPEED_INCREMENT: 4.5,
  
  MAX_SWING_ANGLE: 0.48,      // Biên độ góc lắc (~37 độ tạo đường cong võng rõ rệt)  

  // Dung sai tính điểm 
  PERFECT_TOLERANCE: 4, 

  LEVELS: {
    1: {
      name: 'Ngoại Ô Thành Phố',
      targetBlocks: 15,
      starMilestones: [4, 9, 14], // Xuất hiện sao ở các mốc block
      blockVariations: [
        { width: 140, height: 42, color: '#38bdf8' },
        { width: 120, height: 40, color: '#60a5fa' },
        { width: 150, height: 45, color: '#0284c7' }
      ]
    },
    2: {
      name: 'Bãi Biển Lộng Gió',
      targetBlocks: 20,
      starMilestones: [6, 12, 19],
      blockVariations: [
        { width: 130, height: 40, color: '#0d9488' },
        { width: 110, height: 38, color: '#14b8a6' },
        { width: 140, height: 44, color: '#0f766e' }
      ]
    },
    3: {
      name: 'Tầng Mây & Bầu Trời Mở',
      targetBlocks: 30,
      starMilestones: [8, 18, 29],
      blockVariations: [
        { width: 120, height: 40, color: '#818cf8' },
        { width: 100, height: 38, color: '#6366f1' },
        { width: 135, height: 42, color: '#4f46e5' }
      ]
    }
  },


  // 2. QUY CHUẨN XẾP LOẠI S/A/B/C (Tính trên % điểm tối đa: targetBlocks * 10đ)
  RANK_THRESHOLDS: {
    S: 0.95, // Điểm >= 95% điểm tối đa -> RANK S (ĐẠT CHUẨN HOÀN THÀNH MAP)
    A: 0.80, // Điểm >= 80% -> RANK A
    B: 0.55, // Điểm >= 55% -> RANK B
    C: 0.00  // Dưới 55% -> RANK C
  },
  // Thang điểm theo tỷ lệ Overlap diện tích GDD Mục 8.1
  OVERLAP_RULES: [
    { minRatio: 0.95, score: 10, feedback: 'HOÀN HẢO' },
    { minRatio: 0.80, score: 8, feedback: 'RẤT TỐT' },
    { minRatio: 0.60, score: 6, feedback: 'TỐT' },
    { minRatio: 0.40, score: 4, feedback: 'OK' },
    { minRatio: 0.25, score: 2, feedback: 'NGUY HIỂM' }
  ], 
  
  SEAGULL_SPAWN_INTERVAL: 3.5,
  SEAGULL_SPEED: 180,
  SEAGULL_DEFLECTION: 35,
  WHIRLWIND_RADIUS: 90,
  WHIRLWIND_PULL_FORCE: 95,
  MAX_WIND_FORCE: 160,
  RAIN_COUNT: 75,

  // --- DEV-10 & DEV-11: CẤU HÌNH ITEM & ESG ---
  ITEM_TYPES: {
    NORMAL: {
      id: 'normal',
      name: 'Nhà Chuẩn',
      heightMul: 1.0,
      maxScore: 10,
      pollutionDelta: 2,     // Tăng nhẹ ô nhiễm ánh sáng
      color: '#38bdf8'
    },
    GREEN: {
      id: 'green',
      name: 'Mái Xanh Sinh Thái',
      heightMul: 1.0,
      maxScore: 10,
      pollutionDelta: -18,
      color: '#22c55e'
    },
    GREEN_ROOF: {
      id: 'green',
      name: 'Mái Xanh Sinh Thái',
      heightMul: 1.0,
      maxScore: 10,
      pollutionDelta: -18,   // Giảm mạnh ô nhiễm ánh sáng
      color: '#22c55e'
    },
    NEON: {
      id: 'neon',
      name: 'Tòa Neon Đô Thị',
      heightMul: 2.0,        // Chiều cao gấp đôi
      maxScore: 30,          // Thang điểm tối đa 30
      pollutionDelta: +25,   // Ô nhiễm nặng
      color: '#ec4899'
    }
  },

  ITEM_SPAWN_INTERVAL_FLOORS: 3 // Cứ 3 tầng xuất hiện 1 item lơ lửng
};
