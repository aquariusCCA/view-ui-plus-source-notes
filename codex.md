目前我已經將 `apps\01-clone-practice` 專案搭建起來了。

首先我將模仿 `View UI Plus`:

- `src/`: 真正的元件庫原始碼
    - `src/index.js` = 元件庫本身的總入口

- `examples/`: 開發時用來展示、測試元件的 demo app
    - `examples/main.js` = 開發展示站的總入口

然後一樣模仿 `View UI Plus` 設計了三個設定檔:

- `vite.config.js`   → 開發時跑 examples 展示站
- `vite.lib.config.js`  → 正式打包 JS 元件庫
- `vite.style.config.js`  → 正式打包 CSS 

`package.json` 對應腳本如下:

```json
"dev": "vite",
"build": "npm run build:lib && npm run build:style",
"build:lib": "vite build --config vite.lib.config.js",
"build:style": "vite build --config vite.style.config.js"
```

我想請你針對這個架構設計跟我討論該如何編寫一篇高品質的教學筆記。