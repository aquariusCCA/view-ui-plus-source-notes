# View UI Plus 架構總覽

## 1. 文件定位

本文件是 `03-architecture/` 的入口文件，用來建立 View UI Plus 原始碼的整體架構地圖。

本文件不深入分析單一組件實作，而是先整理：

- 專案定位
- 原始碼目錄分層
- 核心模組職責
- 模組之間的依賴方向
- 後續源碼閱讀順序

---

## 2. 專案定位

View UI Plus 是一套基於 Vue 3 的企業級 UI 組件庫，主要提供：

- 通用 UI 組件
- 表單、彈窗、表格、選單等中後台常見能力
- 全局安裝能力
- 全局配置能力
- 樣式系統
- 國際化能力
- TypeScript 型別宣告
- 打包後的發佈產物

從架構角度來看，它不是單一組件集合，而是一套完整的 Vue 3 組件庫工程。

---

## 3. 架構總圖

```text
ViewUIPlus
├── build/          # 建置與打包相關腳本
├── dist/           # 打包後產物
├── examples/       # 範例與開發預覽
├── src/            # 核心原始碼
│   ├── components/ # 組件層
│   ├── directives/ # 指令層
│   ├── locale/     # 國際化
│   ├── mixins/     # 共用邏輯
│   ├── styles/     # 樣式系統
│   ├── utils/      # 工具函數
│   └── index.js    # 組件庫入口
├── test/           # 測試相關
├── types/          # TypeScript 型別宣告
├── package.json    # 套件資訊與 scripts
├── vite.config.js  # Vite 打包設定
└── vue.config.js   # Vue CLI 相關設定
```

---

## 4. 核心分層模型

我會先把 View UI Plus 分成七層理解：

```text
使用者層
  ↓
入口安裝層
  ↓
組件層
  ↓
共用能力層
  ↓
樣式系統層
  ↓
型別與發佈層
  ↓
建置工程層
```

---

## 5. 各層職責

### 5.1 使用者層

使用者透過以下方式使用 View UI Plus：

```js
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

app.use(ViewUIPlus)
```

這一層關心的是：

* 如何安裝
* 如何引入樣式
* 如何使用組件
* 如何使用全局方法，例如 `$Message`、`$Modal`

---

### 5.2 入口安裝層

對應核心檔案：

```text
src/index.js
```

這是整個組件庫的入口，主要負責：

* 匯出所有組件
* 收集所有組件
* 註冊全局組件
* 註冊全局指令
* 掛載全局配置 `$VIEWUI`
* 掛載全局方法，例如 `$Message`、`$Modal`、`$Notice`
* 匯出 `install`
* 匯出版本號與國際化 API

這一層是閱讀 View UI Plus 架構時的第一個重點。官方原始碼中的 `src/index.js` 確實負責匯入 `components`、`locale`、`directives`，並在 `install(app, opts)` 中透過 `app.component`、`app.directive`、`app.config.globalProperties` 完成全局註冊與全局 API 掛載。:contentReference[oaicite:1]{index=1}

---

### 5.3 組件層

對應目錄：

```text
src/components/
```

這一層是 View UI Plus 的主體，包含 Button、Input、Form、Modal、Table、Select、DatePicker 等大量組件。`src/components` 目錄中可以看到許多獨立組件資料夾，例如 `button`、`form`、`input`、`modal`、`table`、`select` 等。([GitHub][2])

這一層應該關注：

* 每個組件如何組織資料夾
* 組件如何暴露 install 能力
* 父子組件如何拆分
* 組件如何使用 props、emits、slots
* 複雜組件如何管理狀態
* 組件如何依賴 utils、mixins、locale、styles

---

### 5.4 共用能力層

對應目錄：

```text
src/utils/
src/mixins/
src/directives/
src/locale/
```

這一層不是具體 UI，而是支撐組件運作的基礎設施。

| 模組            | 職責                                  |
| ------------- | ----------------------------------- |
| `utils/`      | 工具函數、DOM 操作、型別判斷、共用邏輯               |
| `mixins/`     | 跨組件複用的 Vue 邏輯                       |
| `directives/` | 全局指令，例如 resize、line-clamp、style 類指令 |
| `locale/`     | 國際化、多語系、文字配置                        |

---

### 5.5 樣式系統層

對應目錄：

```text
src/styles/
```

這一層處理 Less 樣式、動畫、通用樣式、組件樣式與 mixins。官方 `src/styles/README.md` 中也將樣式庫分成 `animation`、`common`、`components`、`mixins` 等部分。

這一層應該關注：

* 樣式入口在哪裡
* 變數如何定義
* mixins 如何複用
* 每個組件的樣式如何對應
* 打包時如何產出 `dist/styles/viewuiplus.css`

---

### 5.6 型別與發佈層

對應目錄：

```text
types/
dist/
```

這一層關心的是「組件庫如何被使用者消費」。

| 目錄       | 職責               |
| -------- | ---------------- |
| `types/` | TypeScript 型別宣告  |
| `dist/`  | 打包後的 JS / CSS 產物 |

從 `package.json` 可以看到套件的 `main` 指向 `dist/viewuiplus.min.js`，`typings` 指向 `types/index.d.ts`，而發佈檔案包含 `dist`、`src`、`types`。

---

### 5.7 建置工程層

對應檔案與目錄：

```text
build/
vite.config.js
vite.config.dev.js
vue.config.js
package.json
```

這一層關心：

* 開發模式如何啟動
* 生產環境如何打包
* 樣式如何打包
* 語言包如何打包
* 最終如何產出 npm package

`package.json` 中可以看到 `dev`、`dev2`、`build`、`build:style`、`build:prod`、`build:lang` 等 scripts，代表這個專案同時包含開發、正式打包、樣式打包與語言包打包流程。

---

## 6. 模組依賴方向

可以先用這張圖理解：

```text
src/index.js
  ├── components/
  ├── directives/
  ├── locale/
  └── package.json version

components/
  ├── utils/
  ├── mixins/
  ├── locale/
  └── styles/

styles/
  ├── animation/
  ├── common/
  ├── components/
  └── mixins/

package.json
  ├── build scripts
  ├── dependencies
  ├── devDependencies
  ├── main
  └── typings
```

簡化理解：

```text
入口負責整合
組件負責功能
utils / mixins / directives / locale 負責支撐
styles 負責視覺
types / dist 負責對外發佈
build 負責工程化
```

---

## 7. 建議閱讀順序

我會建議依照這個順序閱讀：

```text
1. package.json
   ↓
2. src/index.js
   ↓
3. src/components/index.js
   ↓
4. 選一個簡單組件，例如 button
   ↓
5. 選一個中等組件，例如 input / select
   ↓
6. 選一個複雜組件，例如 form / table / modal
   ↓
7. src/styles/
   ↓
8. src/locale/
   ↓
9. src/utils/、src/mixins/
   ↓
10. build/、vite.config.js
```

原因是：

* `package.json` 先看工程入口與發佈方式
* `src/index.js` 看整個組件庫如何被安裝
* `components/index.js` 看組件如何集中匯出
* 簡單組件先建立模式感
* 複雜組件再研究狀態管理、組件協作與邊界處理
* 最後再補工程化與建置流程

---

## 8. 後續筆記拆分建議

這份 overview 只放「地圖」，細節拆到後續文件：

| 文件                           | 主題                            |
| ---------------------------- | ----------------------------- |
| `02-repository-structure.md` | 專案目錄結構                        |
| `03-entry-and-install.md`    | `src/index.js`、`install`、全局註冊 |
| `04-component-layer.md`      | 組件層設計                         |
| `05-style-system.md`         | Less 樣式系統                     |
| `06-locale-and-config.md`    | 國際化與全局配置                      |
| `07-build-and-release.md`    | 打包、發佈、dist、types              |
| `08-dependency-map.md`       | 模組依賴關係圖                       |

---

## 9. 本章學習目標

學完本章後，應該能回答：

* View UI Plus 原始碼分成哪些主要模組？
* `src/index.js` 在整個架構中扮演什麼角色？
* `components`、`utils`、`mixins`、`directives`、`locale`、`styles` 之間如何分工？
* 組件庫如何透過 `install(app)` 被 Vue 應用使用？
* 樣式、型別、打包產物分別在哪裡？
* 後續讀組件源碼時，應該從哪個方向切入？

---

## 10. 一句話總結

View UI Plus 的整體架構可以理解為：

> 以 `src/index.js` 作為組件庫入口，集中整合組件、指令、國際化、全局配置與全局方法；以 `components` 作為功能主體，搭配 `utils`、`mixins`、`locale`、`styles` 等基礎設施，最後透過 `build`、`dist`、`types` 對外發佈成完整的 Vue 3 UI 組件庫。

---