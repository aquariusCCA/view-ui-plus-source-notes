# 型別宣告與 d.ts 契約

## 學習目標

這篇分析 View UI Plus 的 TypeScript 型別如何被發布。讀完後，要能說明 `typings`、`types/index.d.ts`、`viewuiplus.components.d.ts` 與各元件 d.ts 如何組成 TypeScript 使用者看到的 API。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/button.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/tsconfig.json`

## 型別入口

`package.json` 中有：

```json
"typings": "types/index.d.ts"
```

這是 TypeScript 使用者 import `view-ui-plus` 時的型別入口。它和 runtime 的 `main` 分開：

| 欄位 | 指向 | 責任 |
| --- | --- | --- |
| `main` | `dist/viewuiplus.min.js` | JavaScript runtime 入口 |
| `typings` | `types/index.d.ts` | TypeScript 型別入口 |

因此 runtime bundle 成功，不代表型別正確；型別檔存在，也不代表實作真的符合。

## index.d.ts 的內容

`types/index.d.ts` 做幾件事：

- `import type { App } from 'vue'`
- `export * from './viewuiplus.components'`
- 定義 `ViewUIPlusGlobalOptions`
- 定義 `ViewUIPlusInstallOptions`
- augment `@vue/runtime-core` 的 `ComponentCustomProperties`
- 宣告 `install(app, options)` 型別

這讓 TypeScript 使用者同時獲得：

- named component exports。
- `app.use(ViewUIPlus, options)` 的 options 型別。
- `this.$Message`、`this.$Modal`、`this.$Date` 等全域屬性型別。

## 元件型別的組織

`viewuiplus.components.d.ts` 是集中出口，將各元件 d.ts 再匯出：

```ts
export { Button, ButtonGroup } from './button'
export { Select, Option, OptionGroup } from './select'
export { Table, TableColumnConfig } from './table'
```

個別元件檔再用 `DefineComponent` 宣告 props。例如 `button.d.ts` 定義 `Button` 和 `ButtonGroup` 的 props、事件 callback 與可選值。

這種設計的好處是結構清楚，缺點是型別高度依賴人工維護。當 Vue component props 改變時，d.ts 不會自動跟著更新。

## 全域屬性型別

`src/index.js` 在 `install()` 中掛載多個 global properties，而 `types/index.d.ts` 用 module augmentation 補上：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: ViewUIPlusGlobalOptions;
        $Message: any;
        $Modal: any;
        $Date: any;
    }
}
```

這是 runtime 和 type contract 必須同步的典型例子。如果 `install()` 新增 `$Foo`，但 d.ts 沒補，TypeScript 使用者會報錯；如果 d.ts 宣告 `$Foo`，但 runtime 沒掛載，使用者會在執行期踩雷。

## 手寫型別的風險

View UI Plus v1.3.20 沒有在 build script 中執行 `vue-tsc` 或 `tsc --emitDeclarationOnly` 產生型別。`types/` 是隨 package 一起發布的手寫型別。

手寫型別常見風險：

- props 可選值和 Vue component 實作不同步。
- event callback 名稱和實際 emit 不一致。
- global properties 漏宣告或多宣告。
- `any` 過多，讓型別只能提示名稱，不能保護參數。
- 新增元件後忘記更新 `viewuiplus.components.d.ts`。

這些問題不一定會讓 build 失敗，但會直接影響 TypeScript 使用者體驗。

## tsconfig 的閱讀角度

專案中有 `tsconfig.json`，但目前發布流程的重點不是從 source 自動產生 declarations。閱讀時不要誤以為 `npm run build` 會根據 `tsconfig` 輸出 d.ts。真正被 npm 使用者看到的仍是 `package.json` 的 `typings` 指向。

如果要驗證型別發布，應該建立消費端 fixture 或用 TypeScript 對 `types/index.d.ts` 做編譯檢查。

## 設計啟發

元件庫型別發布要守住三個一致性：

- runtime entry 和 type entry 的 export 名稱一致。
- `install()` 掛載的全域屬性和 module augmentation 一致。
- Vue component props/events 和 d.ts 宣告一致。

手寫 d.ts 可以快速提供型別，但長期維護成本高。現代化時應優先補上自動產生或至少自動檢查型別的流程。

## 複習題

1. `main` 和 `typings` 分別服務什麼使用者需求？
2. `types/index.d.ts` 除了匯出元件，還宣告了哪些全域契約？
3. 為什麼 `install()` 和 `ComponentCustomProperties` 必須同步？
4. 手寫 d.ts 最大的維護風險是什麼？
5. 如果新增一個元件，型別發布至少要檢查哪些檔案？
