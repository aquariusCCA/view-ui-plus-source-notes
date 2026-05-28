# package files、npmignore 與發布面

## 學習目標

這篇分析 View UI Plus 發布到 npm 時，哪些檔案會成為使用者可見的 package surface。讀完後，要能說明 `files`、`.npmignore`、`dist/`、`src/`、`types/` 的關係，並知道為什麼發布前應該用 `npm pack --dry-run` 驗證。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/.npmignore`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/src/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## files 欄位

`package.json` 中有：

```json
"files": [
    "dist",
    "src",
    "types"
]
```

這是 npm package 的主要 allowlist。它表達 View UI Plus 希望發布：

- 已建置好的 `dist/`。
- 原始碼 `src/`。
- 型別宣告 `types/`。

這三個目錄對應三種消費方式：直接用 dist、讓 bundler 讀 source、讓 TypeScript 讀 d.ts。

## .npmignore 的角色

`.npmignore` 中排除了：

```text
.*
*.md
*.yml
build/
node_modules/
test/
gulpfile.js
```

這份檔案表達不希望把 dotfiles、Markdown、CI 設定、build scripts、測試與 node_modules 發到 npm。實務上，當 `files` 欄位存在時，發布內容會以 allowlist 為核心；但不同 npm 版本和目錄層級規則容易讓人誤判，所以正式發布前不要只憑直覺，應該執行：

```bash
npm pack --dry-run
```

用實際 pack 結果確認 package 裡到底有什麼。

## 為什麼發布 src

View UI Plus 發布 `src/`，代表使用者或工具可以從 source 層級消費內容。這對某些按需匯入、debug、二次封裝或直接引用元件 source 的場景有幫助。

但發布 source 也有成本：

- 使用者 bundler 可能需要處理 `.vue`、Less 或現代語法。
- source 中的內部路徑可能被使用者依賴，變成非預期公開 API。
- package 體積增加。
- 重構 source 目錄時會影響直接引用 source 的使用者。

發布 source 不是錯，但要把它視為對外 surface 的一部分。

## 為什麼發布 dist

`dist/` 是最直接的交付結果，包括：

- `viewuiplus.min.js`
- `viewuiplus.min.esm.js`
- `styles/viewuiplus.css`
- `styles/fonts/`
- `locale/*.js`

這些是使用者不經過元件庫 build pipeline 就能消費的產物。只要其中任何一個漏掉，package 就可能安裝成功但使用失敗。

## 為什麼發布 types

`types/` 是 TypeScript 使用者的入口。因為型別不由 build script 生成，所以 `types/` 必須作為 package surface 明確發布。

發布前要確認：

- `types/index.d.ts` 存在。
- `package.json` 的 `typings` 指向正確。
- `types/viewuiplus.components.d.ts` 匯出的元件和 runtime export 大致一致。
- 個別元件 d.ts 沒有引用不存在的檔案。

## package surface 檢查

發布前可以從三個角度檢查：

| 角度 | 檢查問題 |
| --- | --- |
| 檔案存在 | `main`、`typings`、CSS、fonts、locale 是否都在 package 裡 |
| 檔案不多 | test、build、docs、dotfiles 是否被排除 |
| 路徑可用 | README 或 docs 中的 import path 是否真的能 resolve |

`npm pack --dry-run` 是最接近真實發布的檢查方式。它能讓你在 `npm publish` 前看到 package tarball 將包含哪些檔案。

## 設計啟發

元件庫的發布面應該越小越好，但不能小到破壞使用者場景。View UI Plus v1.3.20 選擇發布 `dist`、`src`、`types`，是偏相容與彈性的策略。

如果要現代化，可以先建立 fixture 測試幾種 import 方式，再調整 `files`、`exports` 和是否繼續發布 `src/`。不要先刪 `src/` 再等使用者回報破壞。

## 複習題

1. `files` 欄位在 npm 發布中扮演什麼角色？
2. 為什麼有 `.npmignore` 還要跑 `npm pack --dry-run`？
3. 發布 `src/` 有哪些好處和風險？
4. `dist/` 裡哪些檔案是使用者直接依賴的？
5. package surface 應該從哪三個角度檢查？
