# package scripts 與 build pipeline

## 學習目標

這篇分析 `package.json` 如何描述 View UI Plus 的建置入口、發布產物入口與套件邊界。讀完後，要能從 scripts 判斷每個指令的職責，並知道哪些發布風險無法只靠 `npm run build` 發現。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/vite.lang.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`

## scripts 的分工

View UI Plus v1.3.20 的核心 scripts 是：

```json
{
    "dev": "vue-cli-service serve",
    "build": "npm run build:prod && npm run build:style && npm run build:lang",
    "build:style": "gulp --gulpfile build/build-style.js",
    "build:prod": "vite build",
    "build:lang": "vite build --config build/vite.lang.config.js",
    "lint": "vue-cli-service lint --fix"
}
```

這裡可以看出幾個歷史特徵：

- 開發服務仍使用 Vue CLI。
- production build 使用 Vite。
- 樣式 build 使用 Gulp。
- 語系包使用另一份 Vite config。
- lint 預設帶 `--fix`，會修改檔案，不能視為純檢查命令。

這不是單一世代工具鏈，而是元件庫演進過程中常見的混合形態。

## build 的順序

`build` 使用 `&&` 串接，表示前一段失敗時後一段不會執行：

1. `build:prod` 先產生主要 JavaScript bundle。
2. `build:style` 再產生 CSS 與字型。
3. `build:lang` 最後產生 locale 檔案。

這個順序合理，但它不包含清理舊 `dist` 的步驟。如果某次 build 少產生了某個檔案，舊檔仍可能留在 `dist/`，讓人誤以為產物完整。正式發布前應該搭配乾淨目錄或 `npm pack --dry-run` 檢查。

## package 入口

`package.json` 的幾個欄位直接影響使用者如何消費套件：

| 欄位 | 值 | 意義 |
| --- | --- | --- |
| `name` | `view-ui-plus` | npm 安裝與 import 名稱 |
| `version` | `1.3.20` | 發布版本 |
| `main` | `dist/viewuiplus.min.js` | Node/bundler 預設入口 |
| `typings` | `types/index.d.ts` | TypeScript 型別入口 |
| `files` | `dist`、`src`、`types` | npm package 主要包含內容 |

這裡沒有 `module` 或 `exports`。雖然 build 產生了 `dist/viewuiplus.min.esm.js`，但 package metadata 沒有把它明確標成 module 入口。對現代 bundler 來說，這會降低入口選擇與 tree-shaking 的可預期性。

## dependencies 與 devDependencies

`dependencies` 放的是 runtime 需要的套件，例如 `async-validator`、`dayjs`、`deepmerge`、`popper.js`、`tinycolor2` 等。這些是使用者安裝 View UI Plus 時也需要的能力。

`devDependencies` 放 build、lint、test、Vue compiler、Vite、Gulp 等工具。值得注意的是，`vue` 在 v1.3.20 中位於 `devDependencies`，而 Vite config 又把 `vue` 設成 external。這代表 bundle 不會包 Vue，但 package metadata 沒有用 `peerDependencies` 明確要求使用者提供 Vue。現代元件庫通常會把 Vue 放在 `peerDependencies`，並保留在 `devDependencies` 供本地開發測試。

## build script 不能保證的事

`npm run build` 能確認三段建置命令跑完，但不能保證：

- 發布 package 中真的只包含預期檔案。
- `main` 指向的檔案適合所有 bundler。
- ESM 產物被 package metadata 正確暴露。
- `types/` 與 `src/` 實作同步。
- 使用者專案會自動安裝正確 Vue 版本。
- CSS、fonts、locale 的路徑能在真實消費端正常解析。

這些都要放進發布檢查清單，而不是只看 build exit code。

## 設計啟發

讀元件庫的 `package.json` 時，可以照這個順序：

1. 先看 scripts，知道 source 如何變成 dist。
2. 再看 `main`、`typings`、`files`，知道 npm 對外暴露什麼。
3. 再看 dependencies，分辨 runtime 依賴和 build 工具。
4. 最後看缺少的 metadata，例如 `peerDependencies`、`module`、`exports`、`sideEffects`。

`package.json` 不是單純的專案設定檔，它是 npm 發布契約。

## 複習題

1. `build:prod`、`build:style`、`build:lang` 分別使用什麼工具？
2. 為什麼 `lint --fix` 不適合當作 CI 中唯一的檢查指令？
3. `main` 和 `typings` 對使用者有什麼影響？
4. 有 ESM 檔但沒有 `module` 或 `exports` 會造成什麼限制？
5. 為什麼 Vue 更適合出現在 `peerDependencies`？
