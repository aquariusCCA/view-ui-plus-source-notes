# dist 產物與使用者引入模式

## 學習目標

這篇整理 View UI Plus 的 dist 產物如何被使用者消費。讀完後，要能把 `dist/`、`src/`、`types/` 和不同引入方式對上，並知道哪些模式是 v1.3.20 明確支援，哪些需要現代化 metadata 才能更穩定。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/README-CN.md`

## dist 目錄內容

View UI Plus v1.3.20 的 `dist/` 主要包含：

```text
dist/
  viewuiplus.min.js
  viewuiplus.min.esm.js
  styles/
    viewuiplus.css
    fonts/
  locale/
    en-US.js
    zh-CN.js
    zh-TW.js
    ...
```

這些檔案分別服務不同使用方式。不要把 `dist/` 視為單一 bundle，它其實是 JS、CSS、fonts、locale 的交付集合。

## 全量插件引入

最常見的 bundler 用法是：

```js
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

app.use(ViewUIPlus)
```

這會使用 package 的 `main` 指向 `dist/viewuiplus.min.js`，再由 `install()` 全域註冊所有元件、指令與服務。

這種方式最簡單，但 bundle 成本最高，因為它以全量插件為核心。

## CDN 或 script tag 引入

README 中也展示了全域引用：

```html
<script type="text/javascript" src="viewuiplus.min.js"></script>
<link rel="stylesheet" href="dist/styles/viewuiplus.css">
```

這個模式依賴 UMD 產物和全域名稱 `ViewUIPlus`。由於 Vue 被 external，實際使用時還需要先載入 Vue，讓全域存在 `Vue`。

CDN 模式的優點是不用 bundler；缺點是載入順序、全域名稱與 CSS 路徑都要使用者自己管理。

## 命名匯入

`src/index.js` 和 `src/components/index.js` 提供 named exports，所以使用者可以寫：

```js
import { Button, Table } from 'view-ui-plus'
```

這種語法看起來像按需使用，但實際 tree-shaking 效果取決於 package 入口、bundle format、side effects、bundler 能力與元件內部依賴。v1.3.20 沒有 `exports` map，也沒有 `sideEffects` 描述，所以不能把 named import 等同於穩定的按需發布策略。

## 直接引用 dist 子路徑

使用者也可能直接引用：

```js
import 'view-ui-plus/dist/styles/viewuiplus.css'
import lang from 'view-ui-plus/dist/locale/en-US.js'
```

這類子路徑能否長期穩定，取決於 package 是否承諾這些路徑。因為 v1.3.20 沒有 `exports` map，Node/bundler 通常允許 deep import，但這也表示 package 很難精確限制哪些子路徑是公開 API。

## TypeScript 消費

TypeScript 使用者的型別入口不是 `dist/`，而是：

```json
"typings": "types/index.d.ts"
```

所以使用者 import runtime 時，TypeScript 會從 `types/` 讀型別。這是另一條平行路徑：runtime resolve 到 JS，type resolve 到 d.ts。

## 使用者模式對照

| 使用者需求 | 使用方式 | 依賴產物 |
| --- | --- | --- |
| 快速全量使用 | `app.use(ViewUIPlus)` | `main`、`dist/viewuiplus.min.js`、CSS |
| CDN 使用 | `<script>` + `<link>` | UMD、全域 Vue、CSS |
| 命名匯入 | `import { Button } ...` | entry exports、bundler tree-shaking |
| 載入語系 | `dist/locale/*.js` | locale ESM 產物 |
| TypeScript 提示 | 一般 import | `types/index.d.ts` |

這張表能幫你檢查：每一種文件中承諾的使用方式，是否都有對應產物支撐。

## 設計啟發

現代元件庫應該把消費模式寫進 package metadata：

- 用 `exports` 明確列出公開入口。
- 用 `module` 或 `exports.import` 指向 ESM。
- 用 `types` 或 `exports.types` 指向型別。
- 用 `sideEffects` 保護 CSS 和 locale 副作用。
- 用文件說清楚全量、按需、CDN、語系、CSS 的引入方式。

View UI Plus v1.3.20 已有多種產物，但 metadata 還不夠精確。這是學習現代化發布設計的好案例。

## 複習題

1. `dist/` 中的 JS、CSS、fonts、locale 分別服務什麼場景？
2. 全量插件引入和命名匯入有什麼差異？
3. 為什麼 named import 不必然等於真正按需打包？
4. TypeScript 為什麼不從 `dist/` 讀型別？
5. `exports` map 可以改善哪些 deep import 和入口問題？
