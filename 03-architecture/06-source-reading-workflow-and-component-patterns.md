# 源碼閱讀流程與元件實作模式

## 學習目標

這篇筆記把 View UI Plus 的架構地圖轉成可重複使用的源碼閱讀流程。之後閱讀任何元件，都不應只逐行翻譯 `.vue`，而要從公開入口追到元件實作，再補查樣式、型別、範例與測試。

讀完後，你應該能根據元件型態選擇不同追蹤策略：普通元件看 props/class/event，複合元件看父子狀態，命令式服務看實例生命週期與全域掛載，浮層元件看定位、轉移、關閉與層級管理。

## 對照源碼

- `03-architecture/atomic/07-source-reading-workflow.md`
- `03-architecture/atomic/08-component-implementation-patterns.md`
- `03-architecture/origin/06-source-reading-map.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/03-component-taxonomy.md`
- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/*.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/`

## 閱讀源碼時要問的問題

閱讀元件庫源碼時，不要只問「這段程式碼做什麼」，而要按層次追問：

1. 它怎麼被使用者引入？
2. 它怎麼被註冊或掛載？
3. 它的公開 API 是什麼？
4. 它的狀態和事件如何流動？
5. 它依賴哪些共用工具？
6. 它的樣式從哪裡來？
7. 它的型別如何暴露給使用者？
8. 官方範例與測試保護了哪些行為？

## 第一次閱讀主線

第一次閱讀整體架構時，只追主線：

1. 看 `package.json`，確認套件入口、型別入口與 build scripts。
2. 看 `src/index.js`，確認使用者 `import ViewUIPlus from 'view-ui-plus'` 會進入哪裡。
3. 看 `src/components/index.js`，確認公開元件清單。
4. 挑一個簡單元件，例如 `src/components/button/index.js`，觀察單一元件如何被轉出口。
5. 看 `src/styles/index.less`，確認樣式入口如何串起變數、基礎樣式、動畫與元件樣式。
6. 看 `types/index.d.ts`，確認 TypeScript 使用者看到的是哪一層 API。

這條主線的目標不是讀完所有元件，而是先建立可重複套用的路徑。

## 通用追蹤流程

以任一元件 `X` 為例：

```txt
1. src/components/index.js
   -> 找到 export { default as X } from './x'

2. src/components/x/index.js
   -> 確認單一元件入口匯出什麼

3. src/components/x/*.vue 或 *.js
   -> 閱讀 props、emits、data、computed、methods、watch、render/template

4. src/index.js
   -> 確認它是否參與全域註冊、是否有別名、是否掛到 globalProperties

5. src/styles/components/
   -> 找樣式命名、狀態 class、尺寸與主題變數

6. types/
   -> 找對外型別宣告

7. examples/routers/
   -> 看官方範例如何使用

8. test/unit/specs/
   -> 看測試保護哪些行為
```

不是每個元件都有完整的樣式、型別、範例與測試，但這個順序能降低漏看公開入口、樣式或型別表面的風險。

## 先判斷元件型態

`src/components/` 裡不只存在視覺元件，也存在命令式服務與內部基礎能力。

| 型態 | 代表來源 | 閱讀重點 |
| --- | --- | --- |
| 普通元件 | `button`、`input` | props、slot、event、class、style、type。 |
| 複合元件 | `menu`、`tabs`、`form` | 父子狀態、註冊關係、provide/inject、事件或 mixins。 |
| 命令式服務 | `message`、`notice`、`loading-bar`、`modal/confirm.js` | 實例建立、更新、移除、銷毀、全域掛載。 |
| 浮層元件 | `tooltip`、`poptip`、`modal`、`drawer`、`select`、`date-picker` | 定位、轉移、z-index、mask、scrollbar、關閉行為。 |
| 內部基礎能力 | `base/notification`、`base/popper`、`base/render` | 是否被多個服務或浮層元件共用。 |

同樣位於 `src/components/`，架構問題可能完全不同。先分類，再決定追蹤重點。

## 普通元件閱讀模式

普通元件通常可以沿這條路徑：

```txt
components/button/index.js
  -> components/button/button.vue
  -> styles/components/button.less
  -> types/button.d.ts
  -> examples/routers/button.vue
  -> test/unit/specs/button.spec.js
```

閱讀重點：

- props 如何變成 class、style 或渲染分支。
- slot 如何改變輸出。
- click、change、input 等事件如何命名與觸發。
- disabled、loading、size、type 等狀態如何落到 DOM。

## 複合元件閱讀模式

複合元件通常有父子檔案：

```txt
components/menu/menu.vue
components/menu/menu-item.vue
components/menu/submenu.vue
components/menu/menu-group.vue
```

閱讀重點：

- 父子元件如何共享狀態。
- active、selected、open、disabled 等狀態如何傳遞。
- 是否使用 provide/inject、事件派發、mixins 或手動查找父子元件。
- 子元件是否能脫離父元件單獨使用。

## 命令式服務閱讀模式

命令式服務通常不是單純 `.vue` 元件，而是透過 JS 建立或管理實例：

```txt
components/message/index.js
components/notice/index.js
components/modal/confirm.js
components/loading-bar/loading-bar.js
```

閱讀重點：

- 是否有單例實例。
- 如何建立、更新、移除、銷毀。
- API 是回傳函數、物件，還是直接觸發副作用。
- 是否掛到 `app.config.globalProperties`。
- 型別是否補上全域屬性。

## 浮層元件閱讀模式

浮層元件通常牽涉定位、掛載位置、層級與關閉行為：

```txt
components/tooltip/
components/poptip/
components/modal/
components/drawer/
components/select/
components/date-picker/
```

閱讀重點：

- popup 是否轉移到 body 或指定容器。
- z-index、mask、scrollbar、鍵盤 ESC 如何處理。
- 點擊外部、hover、focus、blur 如何控制顯示狀態。
- 是否依賴 `popper.js` 或內部基礎能力。

## 來源明確支持

- atomic 07 明確提供從 `package.json`、`src/index.js`、`src/components/index.js`、單一元件入口、樣式入口到型別入口的閱讀順序。
- atomic 08 明確區分普通元件、複合元件、命令式服務與浮層元件的閱讀模式。
- origin 06 明確將 examples 與 test 納入源碼閱讀材料。
- source 中存在 `src/components/message/index.js`、`src/components/base/notification/` 等命令式服務與內部基礎能力相關檔案。

## 根據來源推論

- 將這些閱讀模式整理成「先入口、再實作、再 style/type/examples/test」的標準流程，是基於 atomic 07/08 做出的教學化推論。
- 不同元件是否真的有完整測試、範例或型別，必須逐一查證；不能因流程列出就假設每個元件都具備。

## Runtime / Type / 樣式落差

閱讀流程中要刻意比對三種表面：

- Runtime：`.vue`、`.js`、`src/index.js` 決定行為是否存在。
- Type：`types/` 決定使用者側是否能得到 IDE 提示與 TS 檢查。
- Style：`src/styles/components/` 決定狀態 class 是否有視覺效果。

如果三者不同步，正式筆記應標出落差，不應自行補成「一定完整」。

## 設計啟發

源碼閱讀的目標不是逐行翻譯，而是建立一條從公開 API 到內部實作的可驗證路徑。讀完一個元件後，應該能回答：

- 使用者怎麼用？
- 入口在哪裡？
- 狀態怎麼走？
- DOM 怎麼生成？
- 樣式怎麼套？
- 型別怎麼暴露？
- 哪些行為有範例或測試保護？

## 實戰使用場景

- 做源碼導讀時，用通用流程避免只看 `.vue` 而漏掉入口與型別。
- Review 新元件時，根據元件型態決定檢查清單，不用同一套問題套所有元件。
- 排查命令式服務錯誤時，優先看 JS 控制器、全域掛載與型別擴充，而不是只找模板。
- 排查浮層問題時，優先查定位、轉移、z-index、關閉行為與 base 能力。

## 實作檢查任務

1. 用 `Button` 跑一次通用追蹤流程，記錄 runtime、style、type、example、test 各自位置。
2. 用 `Message` 跑一次命令式服務追蹤流程，確認它是否掛到 `globalProperties`。
3. 選一個複合元件，找出父子檔案與狀態傳遞方式。
4. 選一個浮層元件，列出定位、掛載、關閉、層級相關檔案。
5. 對任一元件回答「它怎麼被使用者引入、怎麼被註冊、型別在哪裡」三個問題。

## 複習題

1. 閱讀一個元件時，為什麼要先看 `src/components/index.js`？
2. 普通元件和命令式服務的追蹤方式有什麼不同？
3. 複合元件為什麼要特別看父子狀態傳遞？
4. 浮層元件通常比基礎元件多哪些架構問題？
5. examples 與 test 在源碼閱讀中各自能提供什麼證據？
