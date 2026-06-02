# 04-plugin-system

本目錄存放 View UI Plus 的 Vue 插件系統分析。重點不是背 API，而是看懂一套元件庫如何把元件、指令、全域設定、全域服務與型別宣告串成 `app.use(ViewUIPlus)` 這個入口。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [插件入口與 API 形狀](./origin/01-plugin-entry-and-api-shape.md) | 看懂 `src/index.js` 如何組成預設匯出與具名匯出 |
| 2 | [install 流程拆解](./origin/02-install-flow.md) | 拆解 `install(app, opts)` 的執行順序 |
| 3 | [全域元件註冊](./origin/03-global-component-registration.md) | 分析 `app.component` 與元件別名設計 |
| 4 | [全域指令註冊](./origin/04-directive-registration.md) | 分析 `v-display`、`v-resize`、`v-line-clamp` 等指令入口 |
| 5 | [全域設定 $VIEWUI](./origin/05-global-config-viewui.md) | 看懂安裝選項如何變成元件可讀取的全域設定 |
| 6 | [全域服務](./origin/06-global-services.md) | 分析 `$Message`、`$Modal`、`$Loading` 等服務如何掛到實例上 |
| 7 | [完整安裝與按需引入](./origin/07-on-demand-import.md) | 對比 `app.use(ViewUIPlus)` 與具名匯入單一元件 |
| 8 | [插件型別系統](./origin/08-plugin-type-system.md) | 對齊 runtime 的 `globalProperties` 與 TypeScript 宣告 |

以上資料目前作為 `origin/` 原始資料；正式筆記會在 `atomic/` 完成切分與 review 後，再生成到本章根目錄。

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 學完後要能回答

- `app.use(ViewUIPlus, opts)` 背後實際做了哪些事？
- 為什麼完整安裝會一次註冊所有元件？
- `$VIEWUI` 和 `$Message` 這兩種全域屬性的角色差在哪裡？
- 為什麼按需引入需要 `components/index.js` 的具名匯出？
- 為什麼 runtime 掛了 `globalProperties`，TypeScript 還需要另外宣告？
