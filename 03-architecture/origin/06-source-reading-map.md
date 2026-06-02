# 源碼閱讀地圖

## 學習目標

這篇筆記提供一套可重複使用的 View UI Plus 源碼追蹤流程。之後閱讀任何元件，都可以先用這張地圖定位，再深入細節。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/*/*.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 核心概念

閱讀元件庫源碼，不要只問「這段程式碼做什麼」，而要按層次追問：

1. 它怎麼被使用者引入？
2. 它怎麼被註冊或掛載？
3. 它的公開 API 是什麼？
4. 它的狀態和事件如何流動？
5. 它依賴哪些共用工具？
6. 它的樣式從哪裡來？
7. 它的型別如何暴露給使用者？

## 通用追蹤流程

以任何一個元件 `X` 為例：

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

不是每個元件都有完整的樣式、型別、範例與測試，但這個順序可以避免漏看重要入口。

## 閱讀普通元件

普通元件通常有這種路徑：

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

## 閱讀複合元件

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

## 閱讀命令式服務

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

## 閱讀浮層元件

浮層元件通常會牽涉定位、掛載位置、層級與關閉行為：

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

## 設計啟發

源碼閱讀的目標不是逐行翻譯，而是建立一條從公開 API 到內部實作的可驗證路徑。每次閱讀都應該能回答：

- 使用者怎麼用？
- 入口在哪裡？
- 狀態怎麼走？
- DOM 怎麼生成？
- 樣式怎麼套？
- 型別怎麼暴露？

這樣讀完一個元件後，你得到的不是零散知識，而是一個可遷移到其他元件的分析模板。

## 檢查問題

1. 閱讀一個元件時，為什麼要先看 `src/components/index.js`？
2. 普通元件和命令式服務的追蹤方式有什麼不同？
3. 為什麼 `examples/` 和 `test/` 也屬於源碼閱讀材料？
4. 浮層元件通常比基礎元件多哪些架構問題？
5. 讀完一個元件後，你應該能產出哪些結論？
