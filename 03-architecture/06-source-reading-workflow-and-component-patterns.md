# 源碼閱讀流程與元件實作型態

## 學習目標

這篇筆記提供一套可重複使用的 View UI Plus 源碼追蹤流程，並說明普通元件、複合元件、命令式服務與浮層元件的閱讀方式差異。

讀完後，你應該能做到：

1. 從公開入口一路追到單一元件實作、樣式、型別、範例與測試。
2. 判斷一個元件是普通元件、複合元件、命令式服務還是浮層元件。
3. 根據元件型態選擇不同的閱讀重點。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/07-source-reading-workflow.md`
- `03-architecture/atomic/08-component-implementation-patterns.md`

origin 對照：

- `03-architecture/origin/06-source-reading-map.md`
- `03-architecture/origin/02-module-layers.md`
- `03-architecture/origin/03-component-taxonomy.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/*.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/*.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/examples/`
- `01-origin/source/view-ui-plus-v1.3.20/test/`

Button 最小追蹤範例：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/button.spec.js`

## 閱讀源碼時要問的問題

閱讀元件庫源碼，不要只問「這段程式碼做什麼」。更穩定的方式是按層次追問：

1. 它怎麼被使用者引入？
2. 它怎麼被註冊或掛載？
3. 它的公開 API 是什麼？
4. 它的狀態和事件如何流動？
5. 它依賴哪些共用工具、mixins、directives 或 locale？
6. 它的樣式從哪裡來？
7. 它的型別如何暴露給使用者？
8. 範例與測試保護了哪些使用方式或行為？

這些問題把單一元件放回元件庫架構中。讀完一個元件後，你應該能從使用者入口、runtime 實作、樣式與型別完整說明它。

## 第一次閱讀主線

第一次閱讀 View UI Plus，不適合直接挑最複雜元件。建議先追整體入口：

1. 看 `package.json`，確認套件入口、型別入口與建置 scripts。
2. 看 `src/index.js`，確認 `import ViewUIPlus from 'view-ui-plus'` 會進入哪裡。
3. 看 `src/components/index.js`，確認公開元件清單。
4. 挑一個簡單元件，例如 `src/components/button/index.js`，觀察單一元件如何被轉出口。
5. 看 `src/styles/index.less`，確認樣式入口如何串起變數、基礎樣式、動畫與元件樣式。
6. 看 `types/index.d.ts`，確認 TypeScript 使用者看到的是哪一層 API。

這條路線先建立骨架，再進入單一元件細節。

## 通用追蹤流程

以任一元件 `X` 為例，可以照以下順序追：

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

不是每個元件都有完整的樣式、型別、範例與測試，但這個順序能降低漏看公開入口、樣式入口或型別入口的機率。

## 先判斷元件型態

`src/components/` 裡不只存在視覺元件，也存在命令式服務與內部基礎能力。閱讀前要先判斷它屬於哪種型態。

可以先問三個問題：

1. 這個元件主要解決畫面結構還是使用者輸入？
2. 它是否需要管理複雜狀態、父子通訊或浮層？
3. 它是否能作為命令式服務，從 `this.$Message`、`this.$Modal` 這類 API 被呼叫？

常見型態：

| 型態 | 代表例子 | 主要閱讀重點 |
| --- | --- | --- |
| 普通元件 | `button`、`input` | props、slot、事件、class、style、型別。 |
| 複合元件 | `menu`、`tabs`、`form` | 父子狀態、選中/展開/校驗、provide/inject 或事件派發。 |
| 命令式服務 | `message`、`notice`、`loading-bar` | 實例建立、更新、銷毀、全域掛載、型別。 |
| 浮層元件 | `tooltip`、`poptip`、`modal`、`drawer`、`select`、`date-picker` | 定位、轉移、z-index、mask、關閉行為、鍵盤與點擊外部。 |
| 內部基礎能力 | `base/notification`、`base/popper`、`base/render` | 服務或浮層背後的共用基礎能力。 |

同樣位於 `src/components/` 的檔案，可能代表完全不同的架構問題。先判斷型態，再選擇閱讀重點，比逐檔線性閱讀更穩定。

## 普通元件閱讀模式

普通元件通常可以用 Button 這類路徑作為最小模型：

```txt
components/button/index.js
  -> components/button/button.vue
  -> styles/components/button.less
  -> types/button.d.ts
  -> examples/routers/button.vue
  -> test/unit/specs/button.spec.js
```

閱讀重點：

1. props 如何變成 class、style 或渲染分支。
2. slot 如何改變輸出。
3. click、change、input 等事件如何命名與觸發。
4. disabled、loading、size、type 等狀態如何落到 DOM。
5. d.ts 是否對應 runtime 公開 API。
6. 樣式是否有對應狀態 class。

普通元件最適合建立單一元件分析基本功。

## 複合元件閱讀模式

複合元件通常有父子檔案，例如：

```txt
components/menu/menu.vue
components/menu/menu-item.vue
components/menu/submenu.vue
components/menu/menu-group.vue
```

閱讀重點：

1. 父子元件如何共享狀態。
2. active、selected、open、disabled 等狀態如何傳遞。
3. 是否使用 provide/inject、事件派發、mixins 或手動查找父子元件。
4. 子元件是否能脫離父元件單獨使用。
5. 父元件和子元件的公開 API 邊界如何切分。

複合元件不能只看其中一個 `.vue`。它的核心往往在父子檔案如何協調。

## 命令式服務閱讀模式

命令式服務通常不是單純模板元件，而是透過 JS 建立或管理實例。例如：

```txt
components/message/index.js
components/notice/index.js
components/modal/confirm.js
components/loading-bar/loading-bar.js
```

閱讀重點：

1. 是否有單例實例。
2. 如何建立、更新、移除與銷毀。
3. API 是回傳函數、物件，還是直接觸發副作用。
4. 是否掛到 `app.config.globalProperties`。
5. `types/index.d.ts` 是否補上全域屬性型別。

命令式服務要同時看服務實作、全域掛載與 TypeScript 宣告，不能只看 `.vue` 或樣式。

## 浮層元件閱讀模式

浮層元件通常牽涉定位、掛載位置、層級與關閉行為，例如：

```txt
components/tooltip/
components/poptip/
components/modal/
components/drawer/
components/select/
components/date-picker/
```

閱讀重點：

1. popup 是否轉移到 body 或指定容器。
2. z-index、mask、scrollbar、鍵盤 ESC 如何處理。
3. 點擊外部、hover、focus、blur 如何控制顯示狀態。
4. 是否依賴 `popper.js` 或內部 base 能力。
5. 全域配置中的 `transfer`、arrow、maskClosable 等是否影響行為。

浮層元件通常比基礎元件多一層「顯示位置與生命週期」問題，因此要額外追定位、轉移與關閉行為。

## Runtime / Type / 樣式落差

這篇筆記本身不判定某個元件的具體落差，但提供檢查順序：

1. runtime：看 `src/components/x/*.vue` 或 `*.js`，確認 props、event、slot、方法與服務實作。
2. style：看 `src/styles/components/`，確認 class 與狀態樣式。
3. type：看 `types/`，確認元件型別、props 名稱與全域服務型別。
4. examples/test：看範例與測試是否和 runtime 行為一致。

如果 runtime、style、type 之間出現不一致，正式筆記應集中列出，不要分散在段落中。

## 關鍵設計

View UI Plus 的源碼閱讀方法可以總結為一條主線：

```txt
公開入口
  -> 單一元件入口
  -> runtime 實作
  -> 共用能力
  -> 樣式
  -> 型別
  -> 範例與測試
```

這條路線的價值是讓每個結論都能回查來源。你不是在逐行翻譯程式，而是在建立一條從使用者 API 到內部實作的可驗證路徑。

## 設計啟發

閱讀元件庫或設計自己的元件庫時，可以把元件分析模板固定下來：

1. 先確認公開入口。
2. 再確認元件型態。
3. 普通元件看 props、slot、event、class。
4. 複合元件看父子狀態。
5. 命令式服務看實例生命週期與全域掛載。
6. 浮層元件看定位、轉移、關閉與層級管理。
7. 最後對照樣式、型別、範例與測試。

這樣讀完一個元件後，得到的不只是零散知識，而是一個可遷移到其他元件的分析模式。

## 複習題

1. 閱讀一個元件時，為什麼要先看 `src/components/index.js`？
2. 普通元件和命令式服務的追蹤方式有什麼不同？
3. 複合元件為什麼要特別看父子狀態傳遞？
4. 浮層元件通常比基礎元件多哪些架構問題？
5. 讀完一個元件後，你應該能產出哪些來源可追溯的結論？

