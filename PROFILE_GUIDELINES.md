# GitHub Profile README Guidelines (WilliamK112)

> 目标：以后改动 README 时，不再出现“视觉跑偏 / 图挂掉 / 布局破坏”。

## 1) 设计基线（必须遵守）

- 页面底色：保持 GitHub 默认白底。
- 主视觉配色：**深海军蓝 + 电光蓝 + 金色点缀**。
- 3D 模块定位：作为视觉亮点，不要占满页面，不要压过正文信息。
- 信息布局：左侧视觉 + 右侧信息卡（Stack / Featured / Focus），风格统一。
- 文本可读性：正文必须高对比（避免浅蓝字贴白底）。

## 2) 明确禁止（Do NOT）

- 不要再把 3D 全 53 周板做成超长对角平台主画面。
- 不要把图片设成 `width="220%"` 或任何会溢出容器的写法。
- 不要混用“缩进 markdown + html table”导致 `</td>` 被渲染成文本。
- 不要直接覆盖同名图片后期待立刻刷新（GitHub 有缓存）。

## 3) 文件约定

- README：`README.md`
- 3D 图：`assets/blue-gold-3d-contrib-v*.png`
- 动态 snake 输出：`output/github-contribution-grid-snake*.svg`
- snake workflow：`.github/workflows/snake.yml`

## 4) 改图规范（防改坏）

每次调视觉时：
1. 新建版本文件（例如 `v6`），不要复用旧文件名。
2. README 只改到新文件名引用。
3. alt 文案同步更新。
4. 保持模块宽度 `width="100%"`（不做溢出式缩放）。

## 5) 动效规范（snake）

- 使用 workflow 自动生成，不手工拼临时链接。
- README 使用 `<picture>` 同时提供 light/dark 两个 source。
- 若 workflow 失败，先修 workflow，再谈视觉。

## 6) 提交前检查清单（必须全通过）

- [ ] GitHub 主页 HTML 中能搜到新图片文件名（说明 README 已更新）
- [ ] 新图 URL 返回 HTTP 200
- [ ] README 没有裸露 `</td>` 等异常文本
- [ ] 手机/桌面下信息区都可读，不出现大片留白或严重失衡
- [ ] 动态 snake 链接可访问，workflow 最近一次为 success

## 7) 变更策略

- 一次只改一个方向（配色 / 布局 / 动效 三选一）。
- 每次改动后先验收，再做下一步。
- 用户说“最小改动”时，只做点改，不重构整体结构。

## 8) 当前审美锚点（2026-03-28）

- 关键词：**深海军蓝 / 电光蓝 / 金色点缀 / 高对比 / 紧凑信息 / 统一风格**
- 目标：像“打磨过的开发者展示页”，不是实验草稿。
