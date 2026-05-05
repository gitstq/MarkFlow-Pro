<p align="center">
  <img src="https://img.shields.io/npm/v/markflow-pro?style=flat-square&color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/l/markflow-pro?style=flat-square&color=green" alt="license" />
  <img src="https://img.shields.io/badge/tests-129%20passed-brightgreen?style=flat-square" alt="tests" />
  <img src="https://img.shields.io/badge/TypeScript-5.4+-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/dependencies-zero%20runtime-ff69b4?style=flat-square" alt="zero runtime dependencies" />
</p>

<h1 align="center">MarkFlow-Pro</h1>

<p align="center">
  <strong>轻量级 Markdown 函数式排版引擎</strong><br/>
  <strong>輕量級 Markdown 函數式排版引擎</strong><br/>
  <strong>Lightweight Markdown Function-Based Typesetting Engine</strong>
</p>

<p align="center">
  <a href="https://github.com/gitstq/MarkFlow-Pro">GitHub</a> ·
  <a href="https://www.npmjs.com/package/markflow-pro">npm</a> ·
  <a href="#简体中文">简体中文</a> ·
  <a href="#繁體中文">繁體中文</a> ·
  <a href="#english">English</a>
</p>

---

**[简体中文](#简体中文) | [繁體中文](#繁體中文) | [English](#english)**

---

<a id="简体中文"></a>

# 简体中文

## 🎉 项目介绍

**MarkFlow-Pro** 是一款轻量级、可扩展的 Markdown 函数式排版引擎。它在标准 Markdown 的基础上，引入了直观的**函数调用语法**，让文档排版变得像写代码一样自然、优雅。

### 为什么选择 MarkFlow-Pro？

| 现有方案 | 痛点 | MarkFlow-Pro 的优势 |
|---------|------|-------------------|
| **LaTeX** | 学习曲线陡峭，语法晦涩 | 简洁的函数调用语法，上手即用 |
| **MDX** | 依赖 React，运行时开销大 | 零运行时依赖，纯 TypeScript 实现 |
| **Typst** | 生态尚不成熟，社区资源少 | Web 原生，浏览器端实时预览 |

### 核心差异化

- **Web 原生 TypeScript 实现** — 核心引擎完全用 TypeScript 编写，可运行于浏览器和 Node.js
- **浏览器端实时预览** — 内置 Web 编辑器，所见即所得
- **21 个内置函数** — 覆盖布局、内容、样式、逻辑、数学、图表等场景
- **5 套内置主题** — Default / Dark / Ocean / Forest / Sunset，一键切换

> 💡 **灵感来源**：受函数式文档排版理念启发，我们相信文档排版应该像函数组合一样——简洁、可组合、可扩展。

---

## ✨ 核心特性

- 📝 **扩展 Markdown 解析器** — 支持函数调用语法 `.function {arg} {body}`，无缝融合标准 Markdown
- 🔧 **21 个内置函数** — 布局类（page/columns/grid）、内容类（callout/toc/box/tabs/accordion/badge/progress）、样式类（color/align/fontsize）、逻辑类（if/for/set/counter/timestamp）、数学类（math）、图表类（mermaid）
- 🎯 **多目标渲染** — 一份源文件，同时输出 HTML、PDF、演示幻灯片
- 🎨 **5 套内置主题** — Default、Dark、Ocean、Forest、Sunset，满足不同场景需求
- ⚡ **实时预览** — 内置 Web 编辑器，左右分栏布局，编辑即可见效果
- 🖥️ **CLI 工具** — 提供 `build`、`watch`、`init` 等命令，轻松集成到工作流
- 🧩 **零运行时依赖** — 核心引擎不依赖任何外部运行时库，轻量可靠
- 📦 **编程 API** — 完整的 TypeScript 类型定义，方便二次开发与集成
- 🧪 **129 个单元测试** — 全面的测试覆盖，保障代码质量
- 🌐 **Web 原生** — 纯浏览器端运行，无需后端服务

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16
- **npm** >= 7

### 安装

```bash
# 通过 npm 全局安装
npm install -g markflow-pro

# 或从源码安装
git clone https://github.com/gitstq/MarkFlow-Pro.git
cd MarkFlow-Pro
npm install
npm run build
npm link
```

### CLI 使用

```bash
# 构建文档（HTML）
markflow build input.mf -o output.html --format html --theme dark

# 构建 PDF
markflow build input.mf -o output.pdf --format pdf

# 构建演示幻灯片
markflow build input.mf -o slides.html --format slides

# 实时预览
markflow watch input.mf --port 3000

# 创建新项目
markflow init my-doc

# 查看版本
markflow --version
```

### 编程 API

```typescript
import { parse, evaluate, renderHTML, renderPDF, renderSlides } from 'markflow-pro';

const source = '# Hello\n.callout {tip} {Tip} {Content}';
const ast = parse(source);
const evaluated = evaluate(ast);
const html = renderHTML(evaluated, { theme: 'ocean' });
```

---

## 📖 详细使用指南

### 函数调用语法

MarkFlow-Pro 的核心语法非常简洁——以点号 `.` 开头，后跟函数名和参数块：

```
.functionName {arg1} {arg2} {
  body content
}
```

参数块使用花括号 `{}` 包裹，函数体支持多行内容。

### 内置函数一览

#### 布局类

| 函数 | 说明 | 示例 |
|------|------|------|
| `.page` | 页面包裹 | `.page {文档标题} {正文内容}` |
| `.columns` | 多栏布局 | `.columns {2} {左栏内容 \|\| 右栏内容}` |
| `.grid` | 网格布局 | `.grid {3} {单元格1 \|\| 单元格2 \|\| 单元格3}` |

#### 内容类

| 函数 | 说明 | 示例 |
|------|------|------|
| `.callout` | 提示框 | `.callout {tip} {提示} {这是一条提示信息}` |
| `.toc` | 目录生成 | `.toc` |
| `.box` | 边框盒子 | `.box {这段文字会被边框包裹}` |
| `.tabs` | 选项卡 | `.tabs {Tab1\|Tab2} {内容1} {内容2}` |
| `.accordion` | 折叠面板 | `.accordion {点击展开} {隐藏的内容}` |
| `.badge` | 标签徽章 | `.badge {重要} {red}` |
| `.progress` | 进度条 | `.progress {75}` |

`.callout` 支持的类型：`info`、`warning`、`error`、`tip`、`success`

#### 样式类

| 函数 | 说明 | 示例 |
|------|------|------|
| `.color` | 文字颜色 | `.color {#ff0000} {红色文字}` |
| `.align` | 文本对齐 | `.align {center} {居中内容}` |
| `.fontsize` | 字号设置 | `.fontsize {24px} {大号文字}` |

#### 逻辑类

| 函数 | 说明 | 示例 |
|------|------|------|
| `.set` | 变量赋值 | `.set {title} {我的文档}` |
| `.if` | 条件判断 | `.if {true} {显示内容} {.else} {隐藏内容}` |
| `.for` | 循环遍历 | `.for {item} in {a,b,c} {- {item}}` |
| `.counter` | 自动计数器 | `.counter {fig}` |
| `.timestamp` | 时间戳 | `.timestamp` |

#### 数学与图表

| 函数 | 说明 | 示例 |
|------|------|------|
| `.math` | 数学公式 | `.math {E = mc^2}` |
| `.mermaid` | Mermaid 图表 | `.mermaid {graph TD; A-->B;}` |

#### 文件操作

| 函数 | 说明 | 示例 |
|------|------|------|
| `.include` | 引入外部文件 | `.include {./chapter1.mf}` |

### 主题系统

使用 `--theme` 参数一键切换主题：

```bash
markflow build input.mf -o output.html --theme ocean
```

可选主题：`default`、`dark`、`ocean`、`forest`、`sunset`

### Web 编辑器

直接在浏览器中打开 `web/index.html`，即可使用内置编辑器进行实时编辑与预览，无需安装任何依赖。

---

## 💡 设计思路与迭代规划

### 设计理念

- **函数优先** — 一切皆函数调用，可组合、可扩展，像搭积木一样构建文档
- **Web 原生** — 浏览器端运行，无需后端服务，随时随地编写
- **零依赖** — 核心引擎自包含，不依赖任何外部运行时库
- **渐进增强** — 从简单 Markdown 开始，按需引入函数能力

### 发展路线图

- [ ] **VS Code 扩展** — 语法高亮、智能提示、函数补全
- [ ] **LSP 语言服务器** — 为各编辑器提供语言支持
- [ ] **自定义函数插件系统** — 允许用户编写并注册自己的函数
- [ ] **导出 DOCX/EPUB** — 支持更多文档格式
- [ ] **协同编辑** — 多人实时协作编辑文档
- [ ] **模板市场** — 社区驱动的文档模板分享平台
- [ ] **Wasm PDF 生成** — 基于 WebAssembly 的高性能 PDF 渲染
- [ ] **更多内置主题** — 持续丰富主题库

---

## 📦 打包与部署指南

```bash
# 生产构建
npm run build

# 运行测试
npm test

# 代码检查
npm run lint

# 启动 Web 编辑器
npm start
```

### 部署

MarkFlow-Pro 生成的是纯静态文件，可部署到任何静态托管平台：

- **GitHub Pages**
- **Vercel**
- **Netlify**
- **Cloudflare Pages**

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！无论是提交 Bug、改进文档，还是贡献代码，请阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

---

<a id="繁體中文"></a>

# 繁體中文

## 🎉 專案介紹

**MarkFlow-Pro** 是一款輕量級、可擴展的 Markdown 函數式排版引擎。它在標準 Markdown 的基礎上，引入了直觀的**函數呼叫語法**，讓文件排版變得像寫程式碼一樣自然、優雅。

### 為什麼選擇 MarkFlow-Pro？

| 現有方案 | 痛點 | MarkFlow-Pro 的優勢 |
|---------|------|-------------------|
| **LaTeX** | 學習曲線陡峭，語法晦澀 | 簡潔的函數呼叫語法，上手即用 |
| **MDX** | 依賴 React，執行期開銷大 | 零執行期依賴，純 TypeScript 實作 |
| **Typst** | 生態系尚不成熟，社群資源少 | Web 原生，瀏覽器端即時預覽 |

### 核心差異化

- **Web 原生 TypeScript 實作** — 核心引擎完全以 TypeScript 撰寫，可執行於瀏覽器與 Node.js
- **瀏覽器端即時預覽** — 內建 Web 編輯器，所見即所得
- **21 個內建函數** — 涵蓋版面配置、內容、樣式、邏輯、數學、圖表等場景
- **5 套內建主題** — Default / Dark / Ocean / Forest / Sunset，一鍵切換

> 💡 **靈感來源**：受函數式文件排版理念啟發，我們相信文件排版應該像函數組合一樣——簡潔、可組合、可擴展。

---

## ✨ 核心特性

- 📝 **擴展 Markdown 解析器** — 支援函數呼叫語法 `.function {arg} {body}`，無縫融合標準 Markdown
- 🔧 **21 個內建函數** — 版面配置類（page/columns/grid）、內容類（callout/toc/box/tabs/accordion/badge/progress）、樣式類（color/align/fontsize）、邏輯類（if/for/set/counter/timestamp）、數學類（math）、圖表類（mermaid）
- 🎯 **多目標渲染** — 一份原始檔，同時輸出 HTML、PDF、簡報投影片
- 🎨 **5 套內建主題** — Default、Dark、Ocean、Forest、Sunset，滿足不同場景需求
- ⚡ **即時預覽** — 內建 Web 編輯器，左右分欄佈局，編輯即可見效果
- 🖥️ **CLI 工具** — 提供 `build`、`watch`、`init` 等指令，輕鬆整合至工作流程
- 🧩 **零執行期依賴** — 核心引擎不依賴任何外部執行期函式庫，輕量可靠
- 📦 **程式化 API** — 完整的 TypeScript 型別定義，方便二次開發與整合
- 🧪 **129 個單元測試** — 全面的測試覆蓋，保障程式碼品質
- 🌐 **Web 原生** — 純瀏覽器端執行，無需後端服務

---

## 🚀 快速開始

### 環境需求

- **Node.js** >= 16
- **npm** >= 7

### 安裝

```bash
# 透過 npm 全域安裝
npm install -g markflow-pro

# 或從原始碼安裝
git clone https://github.com/gitstq/MarkFlow-Pro.git
cd MarkFlow-Pro
npm install
npm run build
npm link
```

### CLI 使用

```bash
# 建構文件（HTML）
markflow build input.mf -o output.html --format html --theme dark

# 建構 PDF
markflow build input.mf -o output.pdf --format pdf

# 建構簡報投影片
markflow build input.mf -o slides.html --format slides

# 即時預覽
markflow watch input.mf --port 3000

# 建立新專案
markflow init my-doc

# 查看版本
markflow --version
```

### 程式化 API

```typescript
import { parse, evaluate, renderHTML, renderPDF, renderSlides } from 'markflow-pro';

const source = '# Hello\n.callout {tip} {Tip} {Content}';
const ast = parse(source);
const evaluated = evaluate(ast);
const html = renderHTML(evaluated, { theme: 'ocean' });
```

---

## 📖 詳細使用指南

### 函數呼叫語法

MarkFlow-Pro 的核心語法非常簡潔——以點號 `.` 開頭，後接函數名稱與參數區塊：

```
.functionName {arg1} {arg2} {
  body content
}
```

參數區塊使用花括號 `{}` 包裹，函數本體支援多行內容。

### 內建函數一覽

#### 版面配置類

| 函數 | 說明 | 範例 |
|------|------|------|
| `.page` | 頁面包裹 | `.page {文件標題} {正文內容}` |
| `.columns` | 多欄佈局 | `.columns {2} {左欄內容 \|\| 右欄內容}` |
| `.grid` | 網格佈局 | `.grid {3} {儲存格1 \|\| 儲存格2 \|\| 儲存格3}` |

#### 內容類

| 函數 | 說明 | 範例 |
|------|------|------|
| `.callout` | 提示框 | `.callout {tip} {提示} {這是一條提示資訊}` |
| `.toc` | 目錄生成 | `.toc` |
| `.box` | 邊框盒子 | `.box {這段文字會被邊框包裹}` |
| `.tabs` | 分頁標籤 | `.tabs {Tab1\|Tab2} {內容1} {內容2}` |
| `.accordion` | 折疊面板 | `.accordion {點擊展開} {隱藏的內容}` |
| `.badge` | 標籤徽章 | `.badge {重要} {red}` |
| `.progress` | 進度條 | `.progress {75}` |

`.callout` 支援的類型：`info`、`warning`、`error`、`tip`、`success`

#### 樣式類

| 函數 | 說明 | 範例 |
|------|------|------|
| `.color` | 文字顏色 | `.color {#ff0000} {紅色文字}` |
| `.align` | 文字對齊 | `.align {center} {置中內容}` |
| `.fontsize` | 字號設定 | `.fontsize {24px} {大號文字}` |

#### 邏輯類

| 函數 | 說明 | 範例 |
|------|------|------|
| `.set` | 變數賦值 | `.set {title} {我的文件}` |
| `.if` | 條件判斷 | `.if {true} {顯示內容} {.else} {隱藏內容}` |
| `.for` | 迴圈遍歷 | `.for {item} in {a,b,c} {- {item}}` |
| `.counter` | 自動計數器 | `.counter {fig}` |
| `.timestamp` | 時間戳記 | `.timestamp` |

#### 數學與圖表

| 函數 | 說明 | 範例 |
|------|------|------|
| `.math` | 數學公式 | `.math {E = mc^2}` |
| `.mermaid` | Mermaid 圖表 | `.mermaid {graph TD; A-->B;}` |

#### 檔案操作

| 函數 | 說明 | 範例 |
|------|------|------|
| `.include` | 引入外部檔案 | `.include {./chapter1.mf}` |

### 主題系統

使用 `--theme` 參數一鍵切換主題：

```bash
markflow build input.mf -o output.html --theme ocean
```

可選主題：`default`、`dark`、`ocean`、`forest`、`sunset`

### Web 編輯器

直接在瀏覽器中開啟 `web/index.html`，即可使用內建編輯器進行即時編輯與預覽，無需安裝任何依賴。

---

## 💡 設計思路與迭代規劃

### 設計理念

- **函數優先** — 一切皆函數呼叫，可組合、可擴展，像堆積木一樣建構文件
- **Web 原生** — 瀏覽器端執行，無需後端服務，隨時隨地撰寫
- **零依賴** — 核心引擎自包含，不依賴任何外部執行期函式庫
- **漸進增強** — 從簡單 Markdown 開始，按需引入函數能力

### 發展路線圖

- [ ] **VS Code 擴充功能** — 語法高亮、智慧提示、函數自動完成
- [ ] **LSP 語言伺服器** — 為各編輯器提供語言支援
- [ ] **自訂函數外掛系統** — 允許使用者撰寫並註冊自己的函數
- [ ] **匯出 DOCX/EPUB** — 支援更多文件格式
- [ ] **協同編輯** — 多人即時協作編輯文件
- [ ] **模板市集** — 社群驅動的文件模板分享平台
- [ ] **Wasm PDF 產生** — 基於 WebAssembly 的高效能 PDF 渲染
- [ ] **更多內建主題** — 持續豐富主題庫

---

## 📦 打包與部署指南

```bash
# 正式版建構
npm run build

# 執行測試
npm test

# 程式碼檢查
npm run lint

# 啟動 Web 編輯器
npm start
```

### 部署

MarkFlow-Pro 產生的是純靜態檔案，可部署至任何靜態託管平台：

- **GitHub Pages**
- **Vercel**
- **Netlify**
- **Cloudflare Pages**

---

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！無論是回報 Bug、改善文件，還是貢獻程式碼，請閱讀 [貢獻指南](./CONTRIBUTING.md) 了解詳情。

---

## 📄 開源協議

本專案基於 [MIT License](./LICENSE) 開源。

---

<a id="english"></a>

# English

## 🎉 Introduction

**MarkFlow-Pro** is a lightweight, extensible Markdown function-based typesetting engine. It extends standard Markdown with an intuitive **function call syntax**, making document composition as natural and elegant as writing code.

### Why MarkFlow-Pro?

| Existing Solution | Pain Point | MarkFlow-Pro Advantage |
|-------------------|-----------|----------------------|
| **LaTeX** | Steep learning curve, cryptic syntax | Clean function call syntax, easy to pick up |
| **MDX** | Requires React, heavy runtime overhead | Zero runtime dependencies, pure TypeScript |
| **Typst** | Immature ecosystem, limited community | Web-native with browser-based live preview |

### Key Differentiators

- **Web-native TypeScript implementation** — The core engine is written entirely in TypeScript, running in both browsers and Node.js
- **Browser-based live preview** — Built-in web editor with real-time WYSIWYG editing
- **21 built-in functions** — Covering layout, content, style, logic, math, and diagram use cases
- **5 built-in themes** — Default / Dark / Ocean / Forest / Sunset, switchable with a single flag

> 💡 **Inspiration**: Inspired by the concept of function-based document composition, we believe document typesetting should be like function composition — concise, composable, and extensible.

---

## ✨ Core Features

- 📝 **Extended Markdown Parser** — Supports function call syntax `.function {arg} {body}`, seamlessly blending with standard Markdown
- 🔧 **21 Built-in Functions** — Layout (page/columns/grid), Content (callout/toc/box/tabs/accordion/badge/progress), Style (color/align/fontsize), Logic (if/for/set/counter/timestamp), Math (math), Diagram (mermaid)
- 🎯 **Multi-Target Rendering** — Generate HTML, PDF, and presentation slides from a single source
- 🎨 **5 Built-in Themes** — Default, Dark, Ocean, Forest, and Sunset for different use cases
- ⚡ **Live Preview** — Built-in web editor with split-pane layout for real-time editing
- 🖥️ **CLI Tool** — `build`, `watch`, and `init` commands for easy workflow integration
- 🧩 **Zero Runtime Dependencies** — The core engine has no external runtime dependencies
- 📦 **Programmatic API** — Full TypeScript type definitions for integration and extension
- 🧪 **129 Unit Tests** — Comprehensive test coverage ensuring code quality
- 🌐 **Web-Native** — Runs entirely in the browser, no server required

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16
- **npm** >= 7

### Installation

```bash
# Install globally via npm
npm install -g markflow-pro

# Or install from source
git clone https://github.com/gitstq/MarkFlow-Pro.git
cd MarkFlow-Pro
npm install
npm run build
npm link
```

### CLI Usage

```bash
# Build document (HTML)
markflow build input.mf -o output.html --format html --theme dark

# Build PDF
markflow build input.mf -o output.pdf --format pdf

# Build presentation slides
markflow build input.mf -o slides.html --format slides

# Live preview
markflow watch input.mf --port 3000

# Create a new project
markflow init my-doc

# Show version
markflow --version
```

### Programmatic API

```typescript
import { parse, evaluate, renderHTML, renderPDF, renderSlides } from 'markflow-pro';

const source = '# Hello\n.callout {tip} {Tip} {Content}';
const ast = parse(source);
const evaluated = evaluate(ast);
const html = renderHTML(evaluated, { theme: 'ocean' });
```

---

## 📖 Detailed Usage Guide

### Function Call Syntax

MarkFlow-Pro's core syntax is clean and intuitive — prefix with a dot `.`, followed by the function name and argument blocks:

```
.functionName {arg1} {arg2} {
  body content
}
```

Arguments are wrapped in curly braces `{}`, and function bodies support multiline content.

### Built-in Functions Reference

#### Layout

| Function | Description | Example |
|----------|-------------|---------|
| `.page` | Page wrapper | `.page {Document Title} {Body content}` |
| `.columns` | Multi-column layout | `.columns {2} {Left column \|\| Right column}` |
| `.grid` | Grid layout | `.grid {3} {Cell 1 \|\| Cell 2 \|\| Cell 3}` |

#### Content

| Function | Description | Example |
|----------|-------------|---------|
| `.callout` | Callout box | `.callout {tip} {Tip} {This is a tip message}` |
| `.toc` | Table of contents | `.toc` |
| `.box` | Bordered box | `.box {This text will be wrapped in a border}` |
| `.tabs` | Tabbed content | `.tabs {Tab1\|Tab2} {Content 1} {Content 2}` |
| `.accordion` | Collapsible section | `.accordion {Click to expand} {Hidden content}` |
| `.badge` | Label badge | `.badge {Important} {red}` |
| `.progress` | Progress bar | `.progress {75}` |

`.callout` supported types: `info`, `warning`, `error`, `tip`, `success`

#### Style

| Function | Description | Example |
|----------|-------------|---------|
| `.color` | Text color | `.color {#ff0000} {Red text}` |
| `.align` | Text alignment | `.align {center} {Centered content}` |
| `.fontsize` | Font size | `.fontsize {24px} {Large text}` |

#### Logic

| Function | Description | Example |
|----------|-------------|---------|
| `.set` | Set variable | `.set {title} {My Document}` |
| `.if` | Conditional | `.if {true} {Show this} {.else} {Hide this}` |
| `.for` | Loop iteration | `.for {item} in {a,b,c} {- {item}}` |
| `.counter` | Auto-incrementing counter | `.counter {fig}` |
| `.timestamp` | Current timestamp | `.timestamp` |

#### Math & Diagrams

| Function | Description | Example |
|----------|-------------|---------|
| `.math` | Math expression | `.math {E = mc^2}` |
| `.mermaid` | Mermaid diagram | `.mermaid {graph TD; A-->B;}` |

#### File Operations

| Function | Description | Example |
|----------|-------------|---------|
| `.include` | Include external file | `.include {./chapter1.mf}` |

### Theme System

Switch themes with a single `--theme` flag:

```bash
markflow build input.mf -o output.html --theme ocean
```

Available themes: `default`, `dark`, `ocean`, `forest`, `sunset`

### Web Editor

Open `web/index.html` in your browser to use the built-in editor with live editing and preview — no installation required.

---

## 💡 Design Philosophy & Roadmap

### Design Philosophy

- **Function-first** — Everything is a function call, composable and extensible, like building blocks for documents
- **Web-native** — Runs in the browser with no server needed, write anywhere anytime
- **Zero dependencies** — The core engine is self-contained with no external runtime libraries
- **Progressive enhancement** — Start with simple Markdown, add function capabilities as needed

### Roadmap

- [ ] **VS Code Extension** — Syntax highlighting, IntelliSense, function autocompletion
- [ ] **LSP Language Server** — Language support for all editors
- [ ] **Custom Function Plugin System** — Allow users to write and register their own functions
- [ ] **Export to DOCX/EPUB** — Support for more document formats
- [ ] **Collaborative Editing** — Real-time multi-user document editing
- [ ] **Template Marketplace** — Community-driven document template sharing platform
- [ ] **Wasm-based PDF Generation** — High-performance PDF rendering via WebAssembly
- [ ] **More Built-in Themes** — Continuously expanding the theme library

---

## 📦 Build & Deployment

```bash
# Production build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Start web editor
npm start
```

### Deployment

MarkFlow-Pro generates static files that can be deployed to any static hosting platform:

- **GitHub Pages**
- **Vercel**
- **Netlify**
- **Cloudflare Pages**

---

## 🤝 Contributing

We welcome contributions of all kinds! Whether it's reporting bugs, improving documentation, or contributing code, please read the [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

This project is open-sourced under the [MIT License](./LICENSE).
