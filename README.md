# TheLastStarGame_Herizon_GGG
Repo chứa mã nguồn game The Last Star của Herizon Gr trong GGG Game a Thon
- [link Demo Game The Last Star](https://lanne-0402.github.io/TheLastStarGame_Herizon_GGG/)

Cấu trúc mã nguồn:
```text
eco-tower/
├── assets/
│   ├── images/
│   │   ├── blocks/          # Chứa ảnh các khối nhà (m1_block1.png, ...)
│   │   ├── story/           # Chứa ảnh manga mở sau Map 1 và Map 2 (page_4.png, page_5.png)[cite: 5]
│   │   └── backgrounds/     # Chứa ảnh nền nếu có
│   ├── videos/
│   │   ├── intro.mp4        # Video Intro tỷ lệ dọc 9:16 (Mở đầu game)
│   │   └── outro.mp4        # Video Outro tỷ lệ dọc 9:16 (Kết game sau Map 3)
│   └── sounds/
│       ├── drop.mp3         # Tiếng cắt dây/thả khối
│       ├── land.mp3         # Tiếng khối tiếp đất chuẩn
│       ├── miss.mp3         # Tiếng khối rơi trượt vỡ
│       └── star.mp3         # Tiếng nhặt Ngôi sao ký ức
├── css/
│   └── style.css
├── js/
│   ├── assets.js            # Quản lý đường dẫn, video & audio
│   ├── config.js
│   ├── camera.js
│   ├── block.js
│   ├── hazards.js
│   ├── stars.js
│   ├── background.js
│   ├── game.js
│   └── main.js
└── index.html
```