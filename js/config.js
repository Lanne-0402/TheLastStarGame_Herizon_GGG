export const CONFIG = {
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 800,
  
  // Thông số Level & Test
  TARGET_BLOCKS: 20,
  DEBUG_FAST_WIN: false,
  
  // Khối nhà mặc định
  BLOCK_WIDTH: 140,
  BLOCK_HEIGHT: 45,
  DROP_SPEED: 850,     
  BASE_SWING_SPEED: 220, 
  SPEED_INCREMENT: 4.5,  

  // Dung sai tính điểm 
  PERFECT_TOLERANCE: 4, 
  MAX_LIVES: 3,

  LEVELS: {
    1: { name: 'Thành Phố Bình Minh', theme: 'city', bg: '#0f172a' },
    2: { name: 'Vùng Biển Lộng Gió', theme: 'sea', bg: '#082f49' },
    3: { name: 'Tầng Khí Quyển Bão', theme: 'storm', bg: '#18181b' }
  },
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
