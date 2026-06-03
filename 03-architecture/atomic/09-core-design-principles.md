# 元件庫核心設計思想與取捨

> 來源：03-architecture/origin/07-core-design-principles.md / # 核心設計思想

## 學習目標

這篇筆記總結 View UI Plus 作為元件庫的核心設計思想。這些不是單一檔案中的語法細節，而是整套專案反覆出現的工程取向。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/examples/`

## 六個設計思想

View UI Plus 的架構可以用六個設計思想來理解：

1. 對使用者提供簡單入口。
2. 對內部維持可拆分結構。
3. 用集中匯出管理公開元件面。
4. 用全域配置統一跨元件體驗。
5. 用樣式系統維持視覺一致性。
6. 用型別宣告補足使用者側開發體驗。

## 簡單入口

使用者可以用整包安裝：

```js
app.use(ViewUIPlus)
```

也可以具名匯入：

```js
import { Button, Modal } from 'view-ui-plus'
```

這兩種使用方式背後都依賴 `src/index.js` 和 `src/components/index.js` 的入口設計。

設計重點是：使用者入口要簡單，但內部結構可以複雜。

## 可拆分結構

每個元件通常有自己的資料夾與 `index.js`，複雜元件會再拆成多個子元件、工具檔或 mixin。

這種結構讓元件可以按複雜度成長：

- 簡單元件可以只有 `index.js` + `.vue`。
- 複合元件可以拆成父子元件。
- 命令式服務可以拆出 JS 控制器。
- 複雜元件可以有 util、mixin、panel、base 等內部模組。

## 集中匯出

`src/components/index.js` 是公開元件清單。這份清單的價值是讓「哪些元件對外可用」變得明確。

對元件庫來說，公開匯出不是普通內部細節，而是 API 契約。只要某個元件被匯出，使用者就可能依賴它的名稱、用法與型別。

## 全域配置

`$VIEWUI` 把多個跨元件預設值集中在一起，例如尺寸、transfer、箭頭圖示、Modal 行為、Typography 設定等。

這種設計讓元件庫可以提供一致體驗：

- 同一套預設尺寸。
- 同一種彈層掛載策略。
- 同一種 icon 或 arrow 配置。
- 同一種服務 API 掛載位置。

但它也讓元件和全域環境產生關聯，所以閱讀元件時要注意是否有讀取 `$VIEWUI`。

## 樣式一致性

`src/styles/index.less` 把變數、基礎樣式、mixins、動畫與元件樣式串起來。這代表元件庫不是每個元件各寫各的 CSS，而是有統一樣式入口。

閱讀樣式時要關注：

- class prefix 是否一致。
- 狀態 class 是否和 props、data 對應。
- 變數和 mixins 是否被多個元件重用。
- 動畫、浮層、尺寸是否有統一模式。

## 型別體驗

`types/index.d.ts` 和各元件型別檔讓 TypeScript 使用者能取得：

- 元件型別。
- `install` options 型別。
- 全域服務屬性型別。
- `$VIEWUI` 全域配置型別。

這說明成熟元件庫的 API 不只存在於 JavaScript runtime，也存在於 TypeScript 型別層。

## 相容性意識

`src/index.js` 中的 `iButton`、`iInput`、`iTable` 等別名，顯示元件庫需要考慮既有使用者習慣。這類設計通常不是技術必要，而是產品與生態相容性的選擇。

閱讀源碼時，不要把所有設計都理解成「最佳抽象」。有些設計是為了相容歷史 API，有些是為了降低遷移成本。

## 設計啟發

如果你要從 View UI Plus 學元件庫設計，最值得帶走的是：

- 入口要穩定。
- 公開元件清單要集中。
- 元件內部可以漸進拆分。
- 樣式要有統一入口。
- 全域服務要同時考慮 runtime 與 type。
- 相容性也是架構設計的一部分。

## 檢查問題

1. 為什麼「使用者入口簡單」不代表「內部結構簡單」？
2. 集中匯出元件有哪些好處？
3. `$VIEWUI` 這種全域配置和 props 配置應該如何分工？
4. 樣式系統為什麼需要統一入口？
5. 你如何判斷某個設計是技術抽象，還是相容性選擇？
