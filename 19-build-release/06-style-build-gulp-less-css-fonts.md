# Gulp、Less、CSS 與字型產物

## 學習目標

這篇分析 View UI Plus 如何把 Less 樣式系統輸出成可發布的 CSS。讀完後，要能說明為什麼樣式 build 獨立於 Vite JS build，以及 `build/build-style.js` 如何產生 `dist/styles/viewuiplus.css` 和 fonts。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/fonts/`
- `01-origin/source/view-ui-plus-v1.3.20/dist/styles/viewuiplus.css`
- `01-origin/source/view-ui-plus-v1.3.20/dist/styles/fonts/`

## style build 的入口

`package.json` 中的樣式指令是：

```json
"build:style": "gulp --gulpfile build/build-style.js"
```

Gulpfile 位於 `build/` 目錄，所以裡面的路徑使用 `../src/styles/index.less` 和 `../dist/styles`。這個相對路徑要從 gulpfile 所在位置理解，不是從專案根目錄理解。

## CSS task

`css` task 的流程是：

```text
src/styles/index.less
  -> less({ javascriptEnabled: true })
  -> autoprefixer(...)
  -> cleanCSS()
  -> rename('viewuiplus.css')
  -> dist/styles/viewuiplus.css
```

每一步都有明確目的：

- Less 編譯把 token、mixins、components 樣式合併成 CSS。
- `javascriptEnabled: true` 支援 Less 中需要 JavaScript 的語法或函式。
- autoprefixer 補瀏覽器前綴。
- cleanCSS 壓縮 CSS。
- rename 固定發布檔名。

這裡輸出的是單一全量 CSS，而不是每個元件各自一份 CSS。

## fonts task

`fonts` task 很直接：

```text
src/styles/common/iconfont/fonts/*.* -> dist/styles/fonts/
```

這一步不能省略。CSS 中如果引用 iconfont，npm package 必須同時帶上字型檔，而且相對路徑要和 `dist/styles/viewuiplus.css` 中的 URL 對得上。

很多元件庫發布錯誤不是 JS 壞掉，而是 CSS 可以載入但字型、圖片或其他資源路徑失效。

## default task

Gulp 預設任務是：

```js
gulp.task('default', gulp.parallel('css', 'fonts'));
```

CSS 編譯和 fonts 複製可以平行執行，因為兩者沒有資料依賴。最後發布時，兩份產物都必須存在。

## 為什麼不用 Vite 直接處理樣式

View UI Plus v1.3.20 的主 JS entry 沒有在 `src/index.js` 中 import `src/styles/index.less`。這表示 Vite JS build 不負責把樣式抽出成 CSS。樣式被視為獨立交付物，由使用者自行引入：

```js
import 'view-ui-plus/dist/styles/viewuiplus.css'
```

這種做法讓 JS plugin 和 CSS 交付分開，優點是清楚、可被 CDN 使用；缺點是使用者忘記引入 CSS 時，元件會有行為但沒有正確樣式。

## 發布風險

樣式建置常見風險包括：

- `dist/styles/viewuiplus.css` 未更新。
- fonts 沒有複製到 `dist/styles/fonts/`。
- Less 編譯依賴 `javascriptEnabled`，現代工具升級後預設行為改變。
- autoprefixer 目標瀏覽器過舊或不符合新專案需求。
- CSS 壓縮後缺少 source map，除錯不方便。
- npm package 中漏掉 fonts 或 styles 目錄。

這些問題不能只靠看 Vue 元件測試發現，要在發布檢查中直接驗證 dist 產物。

## 設計啟發

樣式 build 應該回答四個問題：

- 樣式入口是哪個檔案？
- 是否輸出全量 CSS、元件 CSS，或兩者都有？
- CSS 需要哪些靜態資源？
- 使用者如何引入，文件是否明確？

View UI Plus 選擇全量 CSS，是傳統 UI 元件庫最穩定的交付方式。若要做更細的按需樣式，應該另設產物策略，而不是假設 JS named imports 會自動帶入樣式。

## 複習題

1. `build:style` 為什麼使用 Gulp 而不是 `vite build`？
2. `css` task 的五個主要處理步驟是什麼？
3. fonts task 為什麼是發布流程的一部分？
4. 使用者為什麼需要手動 import `viewuiplus.css`？
5. 全量 CSS 和 per-component CSS 各有什麼取捨？
