# 多多迷宫 Duoduo Maze

把孩子用磁力片搭出来的实体迷宫，做成一个可以在浏览器里玩的 Web 小应用。项目使用 Vite、React、TypeScript 和 Babylon.js 构建，支持儿童友好的 2D 模式，也保留了第一人称自由视角模式。

线上地址：<https://paulloo.github.io/duoduo-maze/>

## 功能

- 儿童 2D 模式：默认进入，直接用方向键或屏幕按钮移动，适合低龄孩子上手。
- 自由视角模式：第一人称 3D 迷宫，桌面端使用 WASD + 鼠标，移动端使用左摇杆移动、右侧拖动视角。
- 地图编辑器：可以切换墙、空地、起点、终点，自定义迷宫关卡。
- 哨兵小地图：自由视角模式下可显示当前位置、朝向、起点和终点。
- 移动端适配：支持触控操作，横屏体验更好。
- 本地保存：编辑后的迷宫可以保存到浏览器本地存储，也可以导出 JSON。

## 操作方式

### 儿童 2D 模式

- 键盘：方向键或 `W/A/S/D`
- 移动端：屏幕方向按钮
- 目标：从绿色起点走到橙色终点

### 自由视角模式

桌面端：

- `W` 前进
- `S` 后退
- `A` 向左平移
- `D` 向右平移
- 点击画面后，鼠标控制视角
- `Esc` 释放鼠标

移动端：

- 左侧摇杆控制移动
- 右侧区域拖动控制视角

## 本地开发

需要 Node.js 和 pnpm。

```bash
pnpm install
pnpm dev
```

默认开发服务会监听局域网：

```text
http://127.0.0.1:5173
http://你的局域网 IP:5173
```

## 构建

```bash
pnpm build
```

构建产物会输出到 `dist/`。

## 发布到 GitHub Pages

项目已经包含 GitHub Actions workflow：`.github/workflows/deploy-pages.yml`。

推送到 `main` 分支后，会自动执行：

1. 安装依赖
2. TypeScript 编译
3. Vite 构建
4. 发布 `dist/` 到 GitHub Pages

如果是第一次启用 Pages，需要在 GitHub 仓库设置里确认：

- `Settings` -> `Pages`
- `Build and deployment` -> `Source` 选择 `GitHub Actions`

## 技术栈

- Vite
- React
- TypeScript
- Babylon.js
- GitHub Actions
- GitHub Pages

## 项目结构

```text
src/
  components/       UI 和交互组件
  data/             默认迷宫数据
  game/             Babylon.js 场景和迷宫计算逻辑
  types/            共享类型定义
  App.tsx           应用主入口
  styles.css        全局样式和响应式布局
```
