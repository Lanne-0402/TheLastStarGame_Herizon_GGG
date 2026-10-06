export const CONFIG = {
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 800,
  MAX_LIVES: 3,

  ROPE_LENGTH: 140,
  BASE_SWING_ANGLE: 0.55,      // Biên độ góc lắc (radian)
  SWING_FREQUENCY: 2.2,      
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
      targetBlocks: 15,        // Đúng chuẩn GDD
      starFloors: [5, 10, 15], // 3 Ngôi sao ký ức rải ở các mốc tầng
      baseWidth: 140,
      baseHeight: 45,
      hazard: 'none'
    },
    2: {
      name: 'Bãi Biển Lộng Gió',
      targetBlocks: 20,        // Đúng chuẩn GDD
      starFloors: [6, 14, 20],
      baseWidth: 125,
      baseHeight: 45,
      hazard: 'wind'           // Gió thổi làm lệch dây
    },
    3: {
      name: 'Tầng Mây / Bầu Trời',
      targetBlocks: 30,        // Đúng chuẩn GDD
      starFloors: [10, 20, 30],
      baseWidth: 110,
      baseHeight: 45,
      hazard: 'sway'           // Biên độ đung đưa tích lũy
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
};
