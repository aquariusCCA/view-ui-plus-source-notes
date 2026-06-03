# 共用能力、樣式系統、型別與建置產物

> 來源：
> - 03-architecture/origin/01-project-structure.md / ## `src/` 目錄責任
> - 03-architecture/origin/02-module-layers.md / ### 共用能力層降低重複、### 樣式層獨立串接
> - 03-architecture/origin/07-core-design-principles.md / ## 樣式一致性、## 型別體驗
> - 03-architecture/origin/08-architecture-summary.md / ## 本章關鍵結論

## 學習目標

這篇筆記整理 View UI Plus 中不直接等同於單一元件、但支撐整套元件庫的架構表面：共用能力、樣式系統、型別入口與打包產物。

## 支撐元件庫的非元件層

`src/components/` 是閱讀主線，但成熟元件庫不只由元件組成。View UI Plus 還包含：

| 區域 | 責任 |
| --- | --- |
| `src/directives/` | 自訂指令，例如尺寸、樣式、文字截斷與點擊外部。 |
| `src/locale/` | 語系切換與 i18n 整合入口。 |
| `src/mixins/` | 跨元件共用的 Options API 邏輯。 |
| `src/styles/` | Less 樣式入口、變數、mixins、動畫與元件樣式。 |
| `src/utils/` | DOM、日期、CSV、鍵盤碼、樣式檢查等工具函數。 |
| `types/` | 對外提供的 TypeScript 型別宣告。 |
| `dist/` | 打包後提供給使用者消費的產物。 |

這些區域讓元件庫能維持一致行為、樣式、型別與發布體驗。

## 共用能力層

`utils/`、`mixins/`、`directives/`、`locale/` 讓多個元件可以共用能力。例如 DOM 操作、日期處理、語系文字、彈層轉移、尺寸監聽等，不需要散落在每個元件中。

閱讀元件時，如果看到元件依賴這些區域，應該把它視為跨元件架構設計，而不是單一元件的內部細節。

## 樣式系統

`src/styles/index.less` 是樣式入口，透過 `@import` 串起：

- `custom`
- `base`
- `mixins/index`
- `common/index`
- `animation/index`
- `components/index`

這讓樣式系統和 JS 元件入口保持分離，但又能在發布時一起提供給使用者。

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

`types/index.d.ts` 是 TypeScript 使用者理解全域 API 的入口。入口設計、全域註冊和命令式服務，都需要在型別層有對應宣告。

## 建置產物

`dist/` 是發布產物，不是主要閱讀源碼，但能幫助理解使用者最終消費的結果。

從發布角度看，建置流程把源碼整理成使用者可消費的 JS、CSS 與型別：

```txt
src/index.js
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js

src/styles/index.less
  -> dist/styles/viewuiplus.css

types/index.d.ts
  -> 使用者 TypeScript 型別入口
```

## 設計啟發

元件庫的架構分析不能只看 `.vue` 檔。要理解 View UI Plus，需要同時看 JS 入口、Less 樣式、TypeScript 型別、共用邏輯與打包產物。

如果你要設計自己的元件庫，除了元件實作，也要回答：

- 共用工具要放在哪裡？
- 樣式是否有統一入口？
- 全域服務和全域配置是否有型別？
- 打包後的 JS 與 CSS 使用者如何消費？
- 內部共用能力和公開 API 是否有清楚邊界？

## 檢查問題

1. 為什麼樣式入口不能只從單一 `.vue` 檔理解？
2. `utils/`、`mixins/`、`directives/` 和 `locale/` 各自降低了哪些重複？
3. `types/index.d.ts` 如何補足 runtime API？
4. `dist/` 為什麼不是主要閱讀源碼，但仍然有架構價值？
5. 如果新增一個跨元件能力，應該先判斷它屬於元件實作、共用能力、樣式還是型別？
