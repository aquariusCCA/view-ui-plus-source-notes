# 版本管理、發布檢查與風險點

## 學習目標

這篇把前面的 build、style、locale、types、package surface 整理成發布前檢查清單。讀完後，要能規劃一次 View UI Plus 風格元件庫發布，並知道哪些問題最容易在使用者安裝後才暴露。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/dist/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/README.md`
- `01-origin/source/view-ui-plus-v1.3.20/README-CN.md`

## 版本號檢查

`package.json` 中的版本是：

```json
"version": "1.3.20"
```

元件庫發布前要先判斷版本變更類型：

| 類型 | 代表情境 |
| --- | --- |
| patch | bugfix、型別修正、文件修正、不改公開行為 |
| minor | 新增元件、新增 props、向後相容能力 |
| major | 破壞既有 API、移除元件、改變 import path 或樣式契約 |

UI 元件庫的破壞變更不只發生在 JS API。CSS class、全域服務名稱、locale key、d.ts export、dist 子路徑都可能是公開契約。

## 發布前最小流程

一次安全發布至少應包含：

1. 確認 `package.json` version 已更新。
2. 跑 lint 或靜態檢查，但避免在發布流程中使用會自動改檔的 `--fix` 作為唯一檢查。
3. 跑測試，確認元件契約沒有回歸。
4. 跑 `npm run build`，產出 JS、CSS、locale。
5. 檢查 `dist/styles/viewuiplus.css` 和 fonts 是否存在。
6. 檢查 `dist/locale` 是否包含預期語系。
7. 檢查 `types/index.d.ts` 與主要元件 d.ts 是否能被 TypeScript 消費。
8. 跑 `npm pack --dry-run`，確認 npm package 內容。
9. 用一個乾淨 consumer fixture 安裝 pack 出來的 tarball。
10. 驗證全量引入、CSS 引入、locale 引入、TypeScript import 都能工作。

這裡的重點是「用消費者角度驗證」，不要只在元件庫 repo 內確認 build 成功。

## 產物檢查清單

發布前至少確認：

- `dist/viewuiplus.min.js` 存在。
- `dist/viewuiplus.min.esm.js` 存在。
- `dist/styles/viewuiplus.css` 存在。
- `dist/styles/fonts/` 存在且非空。
- `dist/locale/*.js` 存在。
- `types/index.d.ts` 存在。
- `package.json` 的 `main` 指向存在的檔案。
- `package.json` 的 `typings` 指向存在的檔案。
- README 中的安裝與 CSS import 路徑仍可用。

這些是發布面最基本的生命線。

## 常見風險點

View UI Plus 這類流程最容易出錯的地方：

- build 沒清理舊 `dist`，導致舊產物混入。
- 只跑 JS build，忘記 CSS 或 locale。
- 新增元件後忘記更新 `src/components/index.js` 或 `types/viewuiplus.components.d.ts`。
- 新增全域服務後忘記更新 `ComponentCustomProperties`。
- CSS 改了 iconfont 路徑，但 fonts 沒同步。
- locale key 改了，但某些語系檔缺 key。
- `main`、`typings` 指向不存在或過時檔案。
- external Vue 但沒有清楚要求使用者安裝 Vue。
- 文件示例和實際 package path 不一致。

這些錯誤通常不是 unit test 一定能抓到，需要 packaging 檢查和 consumer fixture。

## 發布後驗證

發布完成後，還應該檢查：

- npm 頁面顯示版本正確。
- `npm install view-ui-plus@x.y.z` 能安裝。
- unpkg 或 CDN 能找到 `dist/viewuiplus.min.js` 和 CSS。
- TypeScript 專案能 import 並取得型別。
- Vue app 能 `app.use(ViewUIPlus)`。
- 常用元件能顯示正確樣式。
- 語系包能被載入。

發布後驗證是為了確認 npm registry、CDN、package metadata 和真實 consumer resolve 都沒有問題。

## 設計啟發

好的 release checklist 應該按照交付契約排列，而不是按照工具排列：

- Runtime JS 是否可用？
- CSS 與靜態資源是否可用？
- Locale 是否可用？
- TypeScript 是否可用？
- Package 內容是否正確？
- 文件中的使用方式是否可用？

工具會更換，但交付契約不會消失。

## 複習題

1. UI 元件庫中哪些內容可能構成破壞變更？
2. 為什麼發布前要用 consumer fixture 驗證？
3. `npm run build` 成功後，還要檢查哪些 dist 檔案？
4. 新增元件時，runtime export 和 type export 分別要檢查哪裡？
5. 發布後驗證和發布前檢查各自解決什麼問題？
