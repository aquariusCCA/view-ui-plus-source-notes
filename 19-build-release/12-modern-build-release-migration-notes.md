# 現代化 build/release 遷移筆記

## 學習目標

這篇從 View UI Plus v1.3.20 的現況出發，整理如果要現代化元件庫 build/release，可以補強哪些能力。讀完後，要能分辨哪些是原始碼已經具備的能力，哪些是遷移時應新增的發布契約。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/vite.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`

## 先保留既有契約

現代化前，先列出不能輕易破壞的既有契約：

- `import ViewUIPlus from 'view-ui-plus'`
- `app.use(ViewUIPlus)`
- `import { Button } from 'view-ui-plus'`
- `import 'view-ui-plus/dist/styles/viewuiplus.css'`
- `dist/locale/*.js`
- `types/index.d.ts`
- `dist/viewuiplus.min.js` 的 UMD 使用方式

遷移不是把舊產物全部換掉，而是先保留主要使用方式，再逐步增加更清楚的現代入口。

## package metadata 補強

最優先補的是 `package.json` 對外契約：

- 加上 `peerDependencies.vue`，明確要求宿主提供 Vue。
- 加上 `module` 或直接用 `exports` 提供 ESM 入口。
- 加上 `types` 或在 `exports` 中提供 type entry。
- 加上 `exports` map，明確列出 `.`、CSS、locale、可能的元件子路徑。
- 加上 `sideEffects`，保護 CSS、locale 註冊與其他有副作用的檔案。

這些設定不一定改變 build 產物，但會大幅改善使用者 bundler 如何理解 package。

## JS 產物現代化

目前主 build 產生一份 UMD 和一份 ESM bundle。若要支援更好的按需使用，可以考慮：

- 保留 UMD 作為 CDN 與向後相容產物。
- 建立 ESM per-component 產物，例如 `es/button`。
- 建立 CJS 或只支援 ESM，取決於目標使用者。
- 使用 Rollup `preserveModules` 或元件級 entry 產生可 tree-shake 的目錄。
- 避免把所有元件都透過單一 entry 強制聚合。

這類改造會影響 import path，必須先用 `exports` map 和遷移文件設計好相容策略。

## 型別產物現代化

目前型別是手寫 `types/`。可以逐步補強：

- 使用 `vue-tsc` 或 declaration plugin 從 source 產生 d.ts。
- 保留人工補充的全域服務型別。
- 建立 type test，驗證 `app.use`、named import、global properties。
- 在 CI 中檢查 d.ts 是否和 source 同步。
- 對 props、emits、slots 建立更精準的型別，而不是大量使用 `any`。

型別現代化的目標不是追求自動化本身，而是降低實作和 d.ts 漂移。

## 樣式與 side effects

如果要支援按需樣式，可以考慮：

- 保留 `dist/styles/viewuiplus.css` 作為全量入口。
- 另外輸出元件級 CSS。
- 在 `exports` 中提供 CSS 子路徑。
- 在 `sideEffects` 中保留 `*.css`、`*.less`、locale 註冊檔。
- 確認 fonts、圖片等靜態資源仍能被 resolve。

不要把 `sideEffects` 設成 `false` 後就結束。元件庫通常有 CSS import、全域註冊、locale 註冊等副作用，必須精確描述。

## CI 與發布自動化

現代化 release pipeline 可以加入：

- lint check，不自動改檔。
- unit tests。
- type tests。
- build。
- `npm pack --dry-run`。
- consumer fixture 安裝 tarball。
- size check 或 bundle analyzer。
- changelog 產生。
- npm provenance 或 CI publish。

自動化的目的不是讓發布看起來複雜，而是把「使用者會不會裝壞」提前到 CI 發現。

## 遷移順序建議

保守遷移可以照這個順序：

1. 補 `peerDependencies.vue`，不改產物。
2. 補 consumer fixture，先守住現有使用方式。
3. 補 `module` 或 `exports` 的最小入口，保留 `main`。
4. 補 type test，確認 `types/` 不漂移。
5. 補 `sideEffects`，先保護 CSS 和 locale。
6. 再設計 per-component ESM 與 CSS 產物。
7. 最後才考慮移除舊入口或調整 dist 結構。

這樣可以降低一次性破壞的風險。

## 設計啟發

現代化不是把工具全部換成最新版本，而是把發布契約寫得更清楚：

- 誰提供 Vue？
- 哪個檔案是 ESM 入口？
- 哪個檔案是型別入口？
- 哪些 deep import 是公開 API？
- 哪些檔案有副作用？
- 發布前如何證明消費者能正常使用？

只要這些問題沒有答案，即使 build 工具很新，發布體驗仍然不穩。

## 複習題

1. 現代化前為什麼要先列出既有使用方式？
2. `exports` map 可以解決哪些 package 入口問題？
3. `sideEffects` 對 CSS 和 locale 為什麼特別重要？
4. d.ts 自動產生和 type test 分別解決什麼問題？
5. 為什麼 per-component 產物應該放在較後面的遷移階段？
