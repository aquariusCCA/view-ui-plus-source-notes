# 語系包建置與 locale 產物

## 學習目標

這篇分析 View UI Plus 的語系包如何獨立建置。讀完後，要能說明 `build/vite.lang.config.js` 如何把 `src/locale/lang/*.js` 轉成 `dist/locale/*.js`，以及語系包為什麼不應全部塞進主 bundle。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/build/vite.lang.config.js`
- `01-origin/source/view-ui-plus-v1.3.20/build/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/lang.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/lang/`
- `01-origin/source/view-ui-plus-v1.3.20/dist/locale/`

## 語系 build 指令

`package.json` 中的語系建置是：

```json
"build:lang": "vite build --config build/vite.lang.config.js"
```

這代表語系包不是主 `vite.config.js` 的一部分，而是使用獨立 config。這樣可以讓主 library bundle 和 locale bundle 有不同 entry、outDir 與 output 設定。

## entry 產生方式

`vite.lang.config.js` 會讀取 `src/locale/lang`：

```js
const files = readDir('./src/locale/lang');
const entry = {};
files.forEach(file => {
    const name = file.split('.')[0];
    entry[name] = `./src/locale/lang/${file}`;
});
```

每個語系檔都變成 Rollup input。例如：

| source | output |
| --- | --- |
| `src/locale/lang/en-US.js` | `dist/locale/en-US.js` |
| `src/locale/lang/zh-CN.js` | `dist/locale/zh-CN.js` |
| `src/locale/lang/zh-TW.js` | `dist/locale/zh-TW.js` |

這種設計讓新增語系時不需要手動更新 entry 清單，只要新增檔案即可被 build 掃到。

## output 設定

語系包輸出到：

```js
outDir: path.resolve(__dirname, '../dist/locale')
```

Rollup output 使用：

```js
output: {
    format: 'es',
    exports: 'default',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    assetFileNames: '[name].[ext]'
}
```

這代表每個語系包都是 ES module，並以 default export 暴露語系物件。檔名和語系代碼一致，方便使用者或 CDN 按語系載入。

## 語系檔的副作用

以 `en-US.js` 為例，source 會：

```js
import setLang from '../lang';

const lang = { ... };
setLang(lang);
export default lang;
```

`setLang(lang)` 會在瀏覽器環境中把語系註冊到 `window.viewuiplus.langs`。因此語系包不只是純資料 default export，它也帶有「載入後註冊語系」的副作用。

這是發布時要注意的地方：如果現代化 package metadata 加上 `sideEffects: false`，必須排除 locale 檔案，否則 bundler 可能錯誤移除語系註冊副作用。

## 主 bundle 與語系包的關係

主入口 `src/index.js` 內有：

- `locale = localeFile.use`
- `i18n = localeFile.i18n`
- `lang(code)` 用來根據載入的語系物件切換

這代表主 bundle 提供 locale runtime，獨立語系包提供資料與註冊。兩者分離可以降低主 bundle 體積，避免所有使用者都被迫下載所有語言。

## 發布風險

語系發布常見風險：

- 新增 `src/locale/lang/*.js` 後忘記跑 `build:lang`。
- `dist/locale` 中保留舊語系檔，造成 npm package 包含已刪除語言。
- 語系物件結構缺少某些元件需要的 key。
- locale 檔案帶副作用，卻在現代 tree-shaking metadata 中被標成可移除。
- 文件沒有說清楚語系包載入順序。

語系包看似只是翻譯資料，但對 DatePicker、Table、Page、Modal 等元件都是 runtime 行為的一部分。

## 設計啟發

多語系元件庫應該分清楚：

- 預設語系放在哪裡。
- 額外語系如何按需載入。
- 語系資料是否有副作用註冊。
- 語系 key 是否有型別或測試守住。
- 發布 package 是否包含所有 dist locale 檔案。

語系包是降低 bundle 體積的重要工具，但它會增加發布檢查成本。

## 複習題

1. `build:lang` 為什麼使用獨立 Vite config？
2. `vite.lang.config.js` 如何自動建立多 entry？
3. 每個語系檔為什麼既是 default export，又有註冊副作用？
4. 語系包和主 bundle 分離有什麼好處？
5. 現代化 `sideEffects` 設定時，為什麼要特別注意 locale？
