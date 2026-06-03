# View UI Plus 專案結構與目錄責任

> 來源：03-architecture/origin/01-project-structure.md / # 專案結構總覽、## 核心概念、## `src/` 目錄責任、## 設計啟發

## 學習目標

這篇筆記先建立 View UI Plus 的專案地圖。閱讀元件庫源碼時，不要一開始就跳進某個 `.vue` 檔，而是先看每個目錄負責哪一層工作。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/examples/`
- `01-origin/source/view-ui-plus-v1.3.20/test/`

## 專案責任分區

View UI Plus 是一套 Vue 3 元件庫，它的專案結構大致可以分成五種責任：

| 區域 | 主要責任 |
| --- | --- |
| `src/` | 元件庫開發原始碼，是閱讀主線。 |
| `types/` | 對外提供的 TypeScript 型別宣告。 |
| `dist/` | 打包後提供給使用者消費的產物。 |
| `examples/` | 元件展示與開發時的範例入口。 |
| `test/` | 單元測試與測試設定。 |

其中最重要的是 `src/`。它不是只放元件，而是同時放了入口、元件、指令、語系、樣式、共用 mixins 與工具函數。

## `src/` 目錄責任

| 目錄或檔案 | 責任 |
| --- | --- |
| `src/index.js` | 套件總入口，負責匯出、安裝、全域配置、全域服務掛載。 |
| `src/components/` | 所有元件與命令式服務的主要實作。 |
| `src/components/index.js` | 元件集中匯出清單。 |
| `src/directives/` | 自訂指令，例如尺寸、樣式、文字截斷與點擊外部。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |

這個結構反映出一件事：元件庫不是一批孤立元件，而是由「入口 + 元件 + 樣式 + 指令 + 語系 + 工具 + 型別 + 建置產物」一起組成。

## 設計啟發

如果你要設計自己的 Vue 元件庫，目錄結構要回答三個問題：

- 使用者從哪個入口引入？
- 內部元件如何集中管理與對外匯出？
- JS、CSS、型別、語系、指令、全域服務是否有清楚邊界？

View UI Plus 的目錄不是最小化結構，而是一套成熟元件庫的工程結構。它讓元件可以逐步增加功能，同時保留集中安裝、統一樣式與型別支援。

## 檢查問題

1. `src/index.js` 和 `src/components/index.js` 的責任差異是什麼？
2. 為什麼元件庫需要同時有 `src/`、`types/`、`dist/`？
3. `src/styles/index.less` 在元件庫中扮演什麼角色？
4. `examples/` 對源碼閱讀有什麼幫助？
5. 如果新增一個元件，可能會牽涉哪些目錄？
