# Vue 元件庫專案架構設計

這篇文章用 `apps/01-clone-practice` 作為例子，說明一個 Vue 3 元件庫專案內部應該如何分工。

重點不是先討論怎麼打包或發布，而是先回答一個更基礎的問題：

```text
哪些檔案是元件庫本身？
哪些檔案只是開發時用來展示元件？
哪些入口會影響使用者未來怎麼使用這個套件？
```

如果這些邊界沒有先分清楚，後面新增元件、整理樣式、設定打包與發布時，很容易把 demo app 和元件庫本體混在一起。

## 整體分工

`apps/01-clone-practice` 可以先用三個區塊理解：

```text
apps/01-clone-practice/
  src/                    # 真正的元件庫原始碼
  examples/               # 開發時使用的展示站
  vite.config.js          # 啟動 examples 展示站
  vite.lib.config.js      # 打包 JS 元件庫
  vite.style.config.js    # 打包 CSS 樣式
```

這裡最重要的分界是：

```text
會提供給使用者的能力，應該從 src/ 出發。
只用來開發、展示、驗證元件的內容，應該留在 examples/。
```

所以 `src/` 和 `examples/` 不是隨便拆開，而是代表兩種不同角色。

| 目錄 | 角色 | 入口 |
| --- | --- | --- |
| `src/` | 元件庫本體 | `src/index.js` |
| `src/style/` | 元件庫樣式 | `src/style/index.less` |
| `examples/` | 開發展示站 | `examples/main.js` |

## `src/` 是元件庫本體

`src/` 放的是元件庫真正要對外提供的原始碼。

目前結構可以簡化成：

```text
src/
  index.js
  components/
    index.js
    HelloWorld/
      index.js
      HelloWorld.vue
  style/
    index.less
    base.less
    components/
      index.less
      helloworld.less
```

其中 `src/index.js` 是元件庫的公開 API 入口。

它負責整理元件庫要對外提供的內容：

- 匯入所有元件。
- 匯出 `version`。
- 提供 Vue plugin 形式的 `install(app)`。
- 支援 `app.use(MyUI)` 全量註冊。
- 支援 `import { HelloWorld } from '@kevinxiao0210/myui'` 這種具名匯入。

也就是說，未來使用者怎麼引入這個元件庫，最核心的源頭是 `src/index.js`，不是展示站裡的 `examples/main.js`。

## `src/style/` 是元件庫樣式入口

元件庫除了 JavaScript 入口，通常也需要一個清楚的樣式入口。

目前樣式總入口是：

```text
src/style/index.less
```

它再往下匯入基礎樣式和各元件樣式：

```less
@import './base.less';
@import './components/index.less';
```

這代表未來新增元件樣式時，不應該散落在展示站裡，而應該回到 `src/style/` 底下整理。

例如新增 `Button` 元件時，合理方向會是：

```text
src/components/Button/
src/style/components/button.less
```

再由：

```text
src/components/index.js
src/style/components/index.less
```

統一匯出元件與匯入樣式。

## `examples/` 是開發展示站

`examples/` 放的是開發時用的 demo app。

目前結構是：

```text
examples/
  index.html
  main.js
  App.vue
```

`examples/main.js` 會直接引用本地的元件庫原始碼：

```js
import MyUI from '../src/index'
import '../src/style/index.less'
```

這樣做的意思是：開發時不需要先打包、不需要先發布，也不需要安裝自己的 npm package。

流程可以簡化成：

```text
npm run dev
  -> vite.config.js
  -> examples/main.js
  -> ../src/index.js
  -> ../src/style/index.less
```

所以 `examples/` 的任務是幫你驗證 `src/` 裡的元件是否能正常使用。

`examples/App.vue` 可以自由展示各種元件組合，但它不應該成為元件庫 API 的一部分。

## `vite.config.js` 只負責開發展示站

`vite.config.js` 的重點是：

```js
export default defineConfig({
  root: resolve(__dirname, 'examples'),
  publicDir: resolve(__dirname, 'public'),

  plugins: [vue()],

  server: {
    open: true,
  },
})
```

最關鍵的是：

```js
root: resolve(__dirname, 'examples')
```

這代表 Vite 開發伺服器會把 `examples/` 當成網站根目錄，進而找到：

```text
examples/index.html
examples/main.js
```

所以：

```powershell
npm run dev
```

實際上是在啟動一個用來開發元件的本地展示站。

這份設定的重點是開發體驗，不是元件庫發布產物。

## 打包設定在架構中的位置

除了開發展示站，專案裡還有兩個打包設定：

```text
vite.lib.config.js      # 從 src/index.js 打包 JS 元件庫
vite.style.config.js    # 從 src/style/index.less 打包 CSS
```

在架構層面，只需要先記住一件事：

```text
打包設定的輸入應該來自 src/，不應該來自 examples/。
```

因為 `examples/` 只是開發展示站。真正要交給其他專案使用的是 `src/` 裡整理出來的元件庫能力。

詳細的 JS / CSS 打包流程、`dist/` 產物、`external: ['vue']`、`build:lib` 與 `build:style` 的分工，可以接著看：

```text
docs/vue-component-library-build-flow.md
```

## 這個架構的學習重點

學這個架構時，不要只背目錄名稱，而是要抓住每個入口的職責。

| 檔案 | 職責 |
| --- | --- |
| `src/index.js` | 元件庫公開 API 入口 |
| `src/style/index.less` | 元件庫樣式入口 |
| `examples/main.js` | 開發展示站入口 |
| `vite.config.js` | 開發展示站設定 |
| `vite.lib.config.js` | JS 元件庫打包設定 |
| `vite.style.config.js` | CSS 樣式打包設定 |

最重要的判斷標準是：

```text
如果內容會影響使用者怎麼使用元件庫，優先放回 src/ 思考。
如果內容只是幫自己開發與展示元件，才放在 examples/。
```

這個邊界清楚後，後面新增元件、重構共用邏輯、整理樣式和設計打包產物時，都會比較容易判斷每個檔案應該放在哪裡。