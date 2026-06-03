# 套件入口與匯出鏈路

## 學習目標

這篇筆記分析 View UI Plus 的入口設計。入口檔決定使用者如何引入元件庫，也決定整套元件庫的公開 API 邊界。

讀完後，你應該能理解：

1. `package.json`、`src/index.js`、`src/components/index.js`、單一元件入口與 `types/index.d.ts` 如何一起構成公開入口。
2. 為什麼 `src/index.js` 同時是模組匯出入口與 Vue 插件入口。
3. 具名匯入、整包安裝、全域服務與 TypeScript 型別如何由不同檔案共同支撐。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/04-package-entry-and-export-chain.md`

origin 對照：

- `03-architecture/origin/04-entry-design.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/07-core-design-principles.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 多入口共同形成公開門面

View UI Plus 的入口不是單一檔案，而是一組互相配合的入口。

| 入口 | 責任 |
| --- | --- |
| `package.json` 的 `main` | 指向打包後 CommonJS/UMD 產物 `dist/viewuiplus.min.js`。 |
| `package.json` 的 `typings` | 指向 TypeScript 型別入口 `types/index.d.ts`。 |
| `src/index.js` | 原始碼總入口，負責匯出、安裝、全域配置與全域服務。 |
| `src/components/index.js` | 公開元件集中匯出入口。 |
| `src/components/*/index.js` | 單一元件入口。 |

`package.json` 告訴套件消費者要從哪裡取得打包後 JS 與型別；`src/index.js` 定義原始碼層的總入口；`src/components/index.js` 管理公開元件清單；單一元件入口讓每個元件有穩定的轉出口。

這種多入口設計的核心目標是：使用者入口保持簡單，內部結構可以按複雜度拆分。

## `src/index.js` 的雙重責任

`src/index.js` 至少承擔四個責任：

1. 從 `./components` 匯出所有公開元件。
2. 匯入 `* as components`，讓 `install` 能批次註冊。
3. 建立 `install(app, opts)`，支援 `app.use(ViewUIPlus)`。
4. 掛載 directives、全域配置、命令式服務，並匯出 `version`、`locale`、`i18n`、`lang` 與預設 API。

因此它同時是兩種入口：

| 角色 | 對應能力 |
| --- | --- |
| 模組匯出入口 | 支援 `import { Button, Modal } from 'view-ui-plus'`。 |
| Vue 插件入口 | 支援 `app.use(ViewUIPlus)`，執行安裝與全域掛載。 |

這也是為什麼 `src/index.js` 不能只做 `export * from './components'`。單純轉出元件只能滿足具名匯入，無法處理整包安裝、指令註冊、全域配置、全域服務與 locale/i18n。

## 元件匯出鏈路

以 `Button` 為例，公開鏈路可以這樣理解：

```txt
src/components/button/button.vue
  -> src/components/button/index.js
  -> src/components/index.js
  -> src/index.js
  -> dist/viewuiplus.min.js / dist/viewuiplus.min.esm.js
```

`src/components/button/index.js` 的角色很薄，主要是把元件實作檔轉成該元件的預設匯出。這個薄入口有一個重要價值：如果未來 Button 內部拆成更多檔案，外部仍可以透過同一個元件入口取得它。

`src/components/index.js` 再把單一元件入口整理成集中匯出清單。它是「哪些元件對外可用」的明確契約。只要某個元件出現在這份清單中，使用者就可能依賴它的名稱、引入方式、模板名稱與型別。

## 批次匯出與批次註冊

`src/components/index.js` 使用大量命名匯出，提供公開元件清單。`src/index.js` 則同時使用兩種方式消費這份清單：

```txt
export * from './components'
import * as components from './components'
```

兩行看起來相近，但服務不同需求：

| 寫法 | 服務需求 |
| --- | --- |
| `export * from './components'` | 讓使用者可以具名匯入公開元件。 |
| `import * as components from './components'` | 讓 `install` 可以拿到元件集合並批次註冊。 |

這讓 View UI Plus 同時支援兩種使用方式：

```js
import { Button } from 'view-ui-plus'
```

```js
app.use(ViewUIPlus)
```

第一種依賴模組匯出；第二種依賴 Vue 插件安裝流程。兩者背後都需要 `src/index.js` 與 `src/components/index.js` 協作。

## 別名也是公開 API

`src/index.js` 建立 `ViewUI` 物件時，除了展開 `components`，也加入多個 `i` 前綴別名。

依 `src/index.js` 原始碼，包含：

- `iButton`
- `iCircle`
- `iCol`
- `iContent`
- `iForm`
- `iFooter`
- `iHeader`
- `iInput`
- `iMenu`
- `iOption`
- `iProgress`
- `iSelect`
- `iSwitch`
- `iTable`
- `iTime`

這些別名會一起進入批次註冊流程，因此使用者模板中也可能使用這些全域名稱。這類設計通常不是技術上必須，而是相容性與使用習慣的選擇。

關鍵是：別名一旦被全域註冊，就成為公開 API 面的一部分。它降低遷移或使用成本，但也擴大維護面。

## TypeScript 入口

入口設計不只存在於 JavaScript runtime，也存在於 TypeScript 型別層。

`types/index.d.ts` 會：

1. 從 `viewuiplus.components` 匯出元件型別。
2. 宣告 `install(app, options)`。
3. 定義全域安裝 options 的型別。
4. 擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`。
5. 補上 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等全域屬性型別。

這裡要注意，型別入口是使用者側 API 表面，不等於已完整覆蓋 `src/index.js` 的所有 runtime 匯出。依 source，`src/index.js` 另外匯出 `version`、`locale`、`i18n`、`lang` 與預設 API；但目前 `types/index.d.ts` 主要宣告元件型別、`install`、全域 options 與 `ComponentCustomProperties`。另外，runtime 的 `$VIEWUI` 內有 `capture`，但 `ViewUIPlusGlobalOptions` 中未列出 `capture`。因此這份筆記應把 runtime 與 type 視為需要對照檢查的兩條線，而不是預設兩者已完整對齊。

這表示使用者看到的公開 API 有兩條線：

| 表面 | 來源 | 作用 |
| --- | --- | --- |
| runtime | `src/index.js` | 實際匯出、安裝、註冊與掛載。 |
| type | `types/index.d.ts` | 讓 TypeScript 使用者知道 API、全域屬性與安裝 options。 |

如果 runtime 掛了全域服務，但型別沒有擴充，使用者仍可能在 IDE 或 TypeScript 檢查中遇到問題。因此成熟元件庫的入口設計必須同時看 JS 與 d.ts。

## Runtime / Type / 樣式落差

這篇的主要落差集中在 runtime 與 type：

1. `src/index.js` 決定 runtime 是否真的匯出、註冊或掛載某個能力。
2. `types/index.d.ts` 決定 TypeScript 使用者是否能看見對應能力。
3. `package.json` 的 `main` 與 `typings` 決定套件被消費時會連到哪個 JS 與型別入口。

樣式不是這篇的主線，但入口鏈路仍要記得：元件能被匯出不代表樣式自動被分析完。後續閱讀單一元件時，仍要回到 `src/styles/components/` 與 `src/styles/index.less` 確認樣式入口。

## 關鍵設計

View UI Plus 的入口設計有幾個值得保留的結論：

1. `package.json` 對使用者消費路徑很關鍵，不只是套件資訊。
2. `src/index.js` 是公開門面，不只是內部匯出檔。
3. `src/components/index.js` 是公開元件清單，具有 API 契約性質。
4. 單一元件入口讓元件內部可以變動，外部入口保持穩定。
5. 別名是相容性設計，也會擴大公開 API 面。
6. TypeScript 型別入口應檢查是否跟 runtime 公開能力對齊，並標出未覆蓋的缺口。

## 設計啟發

如果要設計自己的元件庫入口，至少要明確回答：

1. 使用者能否整包安裝？
2. 使用者能否具名匯入單一元件？
3. 單一元件是否有穩定入口？
4. 全域服務是否有穩定名稱？
5. 別名是否必要，會不會增加維護成本？
6. TypeScript 是否能理解安裝 options、元件型別、全域屬性與其他 runtime 匯出？
7. 打包後產物與原始碼入口是否有清楚對應？

入口設計的重點不是讓所有使用方式都存在，而是讓公開 API 邊界穩定、可追蹤，並且持續檢查 runtime 與 type 是否互相脫節。

## 複習題

1. `src/index.js` 作為模組入口與 Vue 插件入口，分別體現在哪些程式碼責任？
2. 為什麼 `src/components/*/index.js` 通常保持很薄？
3. `export * from './components'` 和 `import * as components from './components'` 分別服務什麼需求？
4. `iButton` 這類別名會帶來什麼相容性價值與維護成本？
5. 為什麼入口設計必須同時看 `types/index.d.ts`？
