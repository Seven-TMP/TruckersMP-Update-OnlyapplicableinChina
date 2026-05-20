# TMP更新工具（仅中国区可用）

## 📋 项目结构

```
TruckersMP-udp/
├── assets/
│   └── icon.ico                 # 应用图标
├── src/
│   ├── main/                    # 主进程
│   │   ├── index.js            # 入口文件
│   │   ├── window.js           # 窗口管理
│   │   └── handlers/           # IPC 处理器
│   │       ├── index.js        # 处理器入口
│   │       ├── apiHandler.js   # API 处理
│   │       └── fileHandler.js  # 文件处理
│   ├── preload/                # 预加载脚本
│   │   └── index.js
│   └── renderer/               # 渲染进程
│       ├── index.html          # 主页面
│       ├── css/
│       │   └── style.css       # 样式表
│       └── js/
│           ├── app.js          # 主应用逻辑
│           ├── api.js          # API 封装
│           └── utils.js        # 工具函数
├── package.json
└── README.md
```

## 🚀 启动方式

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
```

## 📝 使用说明

1. **选择目录**：选择新版和旧版 TMP 目录
2. **获取列表**：点击获取文件列表
3. **检查权限**：检查目录访问权限
4. **更新文件**：分别或一键更新文件

## ⚠️ 权限要求

- 旧版目录 (`C:\ProgramData\TruckersMP`) 需要管理员权限
- 请右键程序图标，选择"以管理员身份运行"

## 👨‍💻 作者

- **作者**：Seven_TMP
- **特别鸣谢**：长碳

## 📄 许可证

MIT License
