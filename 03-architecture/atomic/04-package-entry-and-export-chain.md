# 套件入口、元件匯出鏈路與公開 API

> 來源：
> - 03-architecture/origin/04-entry-design.md / # 入口設計分析
> - 03-architecture/origin/02-module-layers.md / ### 入口層控制公開表面、### 元件匯出層維護元件清單
> - 03-architecture/origin/07-core-design-principles.md / ## 簡單入口、## 集中匯出、## 相容性意識

## 學習目標

這篇筆記分析 View UI Plus 的入口設計。入口檔決定使用者如何引入元件庫，也決定套件的公開 API 邊界。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

其中 `src/components/*/index.js` 是單一元件入口模式，建議先用 `src/components/button/index.js` 作為最小範例。

## 多入口設計

View UI Plus 的入口不是單一匯出，而是一組互相配合的入口：

| 入口 | 責任 |
| --- | --- |
| `package.json` 的 `main` | 指向打包後的 CommonJS/UMD 產物 `dist/viewuiplus.min.js`。 |
| `package.json` 的 `typings` | 指向 TypeScript 型別入口 `types/index.d.ts`。 |
| `src/index.js` | 原始碼總入口，負責匯出、安裝與全域能力。 |
| `src/components/index.js` | 元件集中匯出入口。 |
| `src/components/*/index.js` | 單一元件入口。 |

入口層是元件庫的公開門面。它不只控制使用者能不能整包安裝，也控制具名匯入、全域服務、全域配置與型別可見性。

## `src/index.js` 的責任

`src/index.js` 有四個核心責任：

1. 從 `./components` 匯出所有元件。
2. 建立 `install(app, opts)`，支援 `app.use(ViewUIPlus)`。
3. 註冊 directives、全域配置與全域服務。
4. 匯出 `version`、`locale`、`i18n`、`lang` 與預設 `API`。

因此它同時是「模組匯出入口」與「Vue 插件入口」。

使用者可以用整包安裝：

```js
app.use(ViewUIPlus)
```

也可以具名匯入：

```js
import { Button, Modal } from 'view-ui-plus'
```

這兩種使用方式背後都依賴 `src/index.js` 和 `src/components/index.js` 的入口設計。設計重點是：使用者入口要簡單，但內部結構可以複雜。

## 元件匯出鏈路

以 `Button` 為例：

```txt
src/components/button/button.vue
  -> src/components/button/index.js
  -> src/components/index.js
  -> src/index.js
  -> dist/viewuiplus.min.js / dist/viewuiplus.min.esm.js
```

`src/components/button/index.js` 的角色很薄，只是把實作檔轉成該元件的預設匯出。這種模式讓每個元件都有穩定入口，未來如果元件內部拆分更多檔案，外部匯出路徑仍然可以保持一致。

## 批次匯出與批次註冊

`src/components/index.js` 使用大量命名匯出：

```js
export { default as Button } from './button';
export { default as Modal } from './modal';
export { default as Message } from './message';
```

接著 `src/index.js` 使用：

```js
export * from './components';
import * as components from './components';
```

這讓套件同時支援兩種使用方式：

- 具名匯入：`import { Button } from 'view-ui-plus'`
- 整包安裝：`app.use(ViewUIPlus)`

`src/components/index.js` 是公開元件清單。這份清單的價值是讓「哪些元件對外可用」變得明確。對元件庫來說，公開匯出不是普通內部細節，而是 API 契約。只要某個元件被匯出，使用者就可能依賴它的名稱、用法與型別。

## 別名設計

`src/index.js` 建立 `ViewUI` 物件時，除了展開 `components`，也提供部分 `i` 前綴別名：

- `iButton`
- `iCircle`
- `iCol`
- `iContent`
- `iForm`
- `iInput`
- `iMenu`
- `iSelect`
- `iTable`

這是相容性與使用習慣層面的設計。架構上要注意：別名也是公開 API，一旦放進集中註冊流程，就會影響使用者模板中可用的元件名稱。

這類設計通常不是技術必要，而是產品與生態相容性的選擇。閱讀源碼時，不要把所有設計都理解成「最佳抽象」。有些設計是為了相容歷史 API，有些是為了降低遷移成本。

## 型別入口

`types/index.d.ts` 會：

- 從 `viewuiplus.components` 匯出元件型別。
- 宣告 `install(app, options)`。
- 擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`。
- 補上 `$VIEWUI`、`$Message`、`$Modal`、`$Date` 等全域屬性型別。

這表示入口設計不只包含 JS，也包含使用者在 TypeScript 中看到的全域 API。

## 設計啟發

一個元件庫入口至少要回答：

- 使用者能否整包安裝？
- 使用者能否按需匯入單一元件？
- 全域服務是否有穩定的公開名稱？
- TypeScript 是否能理解這些公開 API？
- 元件內部路徑調整時，外部 API 是否保持穩定？

View UI Plus 的入口設計把這些問題集中到 `src/index.js`、`src/components/index.js` 和 `types/index.d.ts`。

## 檢查問題

1. `src/index.js` 同時作為模組入口與 Vue 插件入口，分別體現在哪些程式碼？
2. `src/components/*/index.js` 為什麼通常保持很薄？
3. `export * from './components'` 和 `import * as components from './components'` 分別服務什麼需求？
4. `iButton` 這類別名會帶來什麼相容性價值與維護成本？
5. 為什麼入口設計必須同時看 `types/index.d.ts`？
