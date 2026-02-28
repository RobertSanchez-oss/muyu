# Muyu

一个基于 Vite + 原生 JavaScript 的木鱼计数网页应用，用于记录「功德」并提供段位成长反馈。

## 功能概览

- 点击/触摸木鱼进行计数（`+1`）
- 功德总数展示与动画反馈
- 段位系统（随功德提升自动晋级）
- 段位进度条与升级弹窗
- 更新记录弹窗
- 本地数据持久化（含基础防篡改校验）
- 兼容移动端，包含安全区域（safe-area）适配

## 技术栈

- Vite 7
- Vanilla JavaScript (ESM)
- CSS3 动画与响应式布局
- LocalStorage

## 目录结构

```text
.
├─ public/
├─ src/
│  ├─ main.js       # 业务逻辑与交互
│  └─ style.css     # 页面样式与动画
├─ index.html       # 页面结构
├─ deploy.bat       # Windows 部署脚本
├─ deploy.sh        # Linux/macOS 部署脚本
└─ package.json
```

## 本地开发

```bash
npm install
npm run dev
```

默认启动后可在终端提示地址访问开发环境。

## 构建与预览

```bash
npm run build
npm run preview
```

构建产物输出在 `dist/` 目录。

## 部署

项目提供了两个简单部署脚本（通过 `scp` 上传 `dist/`）：

- Windows: `deploy.bat`
- Linux/macOS: `deploy.sh`

使用前请先修改脚本中的以下变量：

- `SERVER_USER`
- `SERVER_IP`
- `SERVER_PATH`

然后执行：

```bash
# Windows
deploy.bat

# Linux/macOS
./deploy.sh
```

## 数据说明

- 本地存储 key：`muyu_data`
- 兼容旧 key 迁移：`muyuCount` -> `muyu_data`
- 包含基础校验机制，异常数据会回退到默认值

## 协作建议

- 将 `src/main.js` 逐步拆分为模块（存储、段位、动画、事件）
- 为核心逻辑补充自动化测试（计数、晋级、数据校验）
- 在部署脚本之外补充 CI/CD 流程（可选）
