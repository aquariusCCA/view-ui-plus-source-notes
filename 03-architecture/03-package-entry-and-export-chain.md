# 套件入口與元件匯出鏈

## 學習目標

這篇筆記分析 View UI Plus 的套件入口如何連到元件公開清單、Vue plugin install、型別入口與打包產物。入口設計決定使用者如何引入元件庫，也決定哪些 runtime 與 type 表面成為公開 API。

讀完後，你應該能追出 `package.json -> src/index.js -> src/components/index.js -> src/components/*/index.js -> 元件實作 -> dist / types` 的鏈路，並用它檢查新增元件是否真正被公開。

## 對照源碼

- `03-architecture/atomic/04-package-entry-and-export-chain.md`
- `03-architecture/origin/04-entry-design.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/07-core-design-principles.md`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`

## 多入口設計

View UI Plus 的入口不是單一檔案，而是一組互相配合的表面。

| 入口 | 責任 |
| --- | --- |
| `package.json` 的 `main` | 指向打包後的 CommonJS/UMD 產物 `dist/viewuiplus.min.js`。 |
| `package.json` 的 `typings` | 指向 TypeScript 型別入口 `types/index.d.ts`。 |
| `src/index.js` | 原始碼總入口，負責匯出、安裝、全域能力。 |
| `src/components/index.js` | 元件集中匯出入口。 |
| `src/components/*/index.js` | 單一元件入口。 |
| `vite.config.js` | library build 入口與輸出檔名設定。 |

入口層是元件庫的公開門面。它不只控制整包安裝，也控制具名匯入、全域服務、全域配置與型別可見性。

## `src/index.js` 的雙重角色

`src/index.js` 同時是模組入口與 Vue plugin 入口。

作為模組入口，它明確做了：

```js
export * from './components';
import * as components from './components';
```

這支援使用者具名匯入：

```js
import { Button, Modal } from 'view-ui-plus'
```

作為 Vue plugin 入口，它提供：

```js
export const install = function(app, opts = {}) {
  // locale / directives / components / globalProperties
}
```

這支援使用者整包安裝：

```js
app.use(ViewUIPlus)
```

因此 `src/index.js` 不能只理解成 re-export 檔。它還承擔 install、directives、locale、全域配置、全域服務與 `version`、`locale`、`i18n`、`lang` 等 API 匯出。

## 元件匯出鏈路

以 `Button` 為例，公開鏈路如下：

```txt
src/components/button/button.vue
  -> src/components/button/index.js
  -> src/components/index.js
  -> src/index.js
  -> dist/viewuiplus.min.js / dist/viewuiplus.min.esm.js
```

`src/components/button/index.js` 很薄，只做：

```js
import Button from './button.vue';

export default Button;
```

這種單一元件入口讓內部實作可以繼續拆分，但對外匯出路徑保持穩定。接著 `src/components/index.js` 使用命名匯出：

```js
export { default as Button } from './button';
```

再由 `src/index.js` 轉出整個 components namespace。

## 批次匯出與批次註冊

`src/components/index.js` 是具名匯入的基礎；`src/index.js` 中的 `import * as components from './components'` 則是整包註冊的基礎。

```txt
src/components/index.js
  -> export { default as Button } from './button'

src/index.js
  -> export * from './components'
  -> import * as components from './components'
  -> install(app, opts)
```

這讓同一份公開清單支援兩種使用方式：

- 具名匯入：`import { Button } from 'view-ui-plus'`
- 整包安裝：`app.use(ViewUIPlus)`

對元件庫來說，被 `src/components/index.js` 匯出的名稱不是普通內部細節，而是公開 API 契約。只要使用者能依賴這個名稱，就需要考慮文件、型別、樣式和相容性。

## 別名設計

`src/index.js` 建立 `ViewUI` 物件時，除了展開 `components`，也提供部分 `i` 前綴別名：

```txt
iButton, iCircle, iCol, iContent, iForm, iInput,
iMenu, iSelect, iTable, iTime ...
```

這類別名也會進入批次註冊流程，成為模板中可用的全域元件名稱。它通常不是技術上必要的抽象，而是產品相容性與使用習慣的選擇。

## 型別入口

`types/index.d.ts` 會從 `viewuiplus.components` 匯出元件型別，宣告 `install(app, options)`，並擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`。

這表示入口設計不只包含 JavaScript runtime，也包含 TypeScript 使用者看到的 API。runtime 有 `install` 不代表 type 會自動存在；全域服務掛載到 `globalProperties` 也不代表 TypeScript 使用者有 `$Message` 或 `$Modal` 的提示。

## 來源明確支持

- `package.json` 明確以 `main` 指向 `dist/viewuiplus.min.js`，以 `typings` 指向 `types/index.d.ts`。
- `src/index.js` 明確匯出 `components`、建立 `install`、匯出 `version`、`locale`、`i18n`、`lang` 與預設 `API`。
- `src/components/index.js` 明確集中匯出公開元件。
- `src/components/button/index.js` 明確是單一元件入口，把 `button.vue` 作為 default export。
- `vite.config.js` 明確以 `src/index.js` 作為 library entry，輸出 UMD 與 ES 格式的 JS 檔。

## 根據來源推論

- `src/components/*/index.js` 被視為穩定單一元件入口，是根據 `Button` 入口模式與集中匯出鏈路做出的推論。不同元件可能有額外內部檔案，但公開鏈路仍需逐一查證。
- 將 `iButton` 等別名視為相容性設計，是基於 atomic 04/09 與 `src/index.js` 中手動建立別名的行為做出的推論；source 沒有直接說明產品原因。

## Runtime / Type / 建置落差

入口鏈路常見的落差是 runtime、type、build 表面不同步。

| 檢查面 | 來源 | 風險 |
| --- | --- | --- |
| runtime 匯出 | `src/components/index.js`、`src/index.js` | 元件實作存在但沒有被公開匯出。 |
| plugin 安裝 | `install(app, opts)` | 具名匯入可用，但整包安裝沒有註冊。 |
| 型別入口 | `types/index.d.ts`、`types/*.d.ts` | runtime 可用，但 TypeScript 使用者沒有型別。 |
| 打包產物 | `vite.config.js`、`dist/` | source 正確，但發布產物未更新或消費入口不一致。 |

目前來源未找到 `dist/package.json`，因此本筆記只把根層 `package.json`、`vite.config.js` 與 `dist/viewuiplus.min.js`、`dist/viewuiplus.min.esm.js` 作為已確認的消費面。

## 設計啟發

一套元件庫的入口至少要回答：

- 使用者能否整包安裝？
- 使用者能否具名匯入單一元件？
- 元件內部路徑調整時，對外名稱是否穩定？
- 全域服務是否有穩定名稱？
- TypeScript 是否能理解公開 API？
- build 設定是否真的以同一個入口產出發布檔？

入口設計的目標不是讓 `index.js` 越短越好，而是讓公開 API 面可控、可追、可檢查。

## 實戰使用場景

- 新增元件時，先確認 `src/components/x/index.js`、`src/components/index.js`、`types/x.d.ts` 與必要樣式是否同步。
- 排查「具名匯入失敗」時，先檢查 `src/components/index.js` 是否匯出該名稱，再檢查 build 產物。
- 排查「TypeScript 找不到元件」時，先比對 runtime export 與 `types/index.d.ts` / `viewuiplus.components`。
- 評估別名時，把它當成公開 API 處理，不要只當內部方便名稱。

## 實作檢查任務

1. 從 `src/components/button/button.vue` 追到 `src/components/button/index.js`、`src/components/index.js`、`src/index.js`。
2. 找一個公開元件，確認它是否同時存在 runtime 匯出與型別宣告。
3. 檢查 `src/index.js` 中 `export * from './components'` 和 `import * as components from './components'` 分別服務哪個使用場景。
4. 檢查 `vite.config.js` 的 library entry 與 output 檔名，確認它如何對應 `package.json main`。
5. 搜尋 `dist/package.json`；若不存在，將它列為來源不足，不寫成既有設計。

## 複習題

1. `src/index.js` 同時作為模組入口與 Vue plugin 入口，分別體現在哪些程式碼？
2. `src/components/*/index.js` 為什麼通常保持很薄？
3. `export * from './components'` 和 `import * as components from './components'` 分別服務什麼需求？
4. `iButton` 這類別名會帶來什麼相容性價值與維護成本？
5. 為什麼入口設計必須同時看 `types/index.d.ts`？
