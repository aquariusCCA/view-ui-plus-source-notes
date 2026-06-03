# 普通元件、複合元件、命令式服務與浮層的閱讀模式

> 來源：
> - 03-architecture/origin/06-source-reading-map.md / ## 閱讀普通元件、## 閱讀複合元件、## 閱讀命令式服務、## 閱讀浮層元件
> - 03-architecture/origin/02-module-layers.md / ### 元件實作層包含兩種型態
> - 03-architecture/origin/03-component-taxonomy.md / ## 分類判斷方式

## 學習目標

這篇筆記整理不同元件型態的閱讀模式。普通元件、複合元件、命令式服務與浮層元件都位於 `src/components/`，但它們的架構問題不一樣。

## 判斷元件型態

分類時可以用三個問題判斷：

1. 這個元件主要解決「畫面結構」還是「使用者輸入」？
2. 這個元件是否需要管理複雜狀態、父子通訊或浮層？
3. 這個元件是否能作為命令式服務從 `this.$Message`、`this.$Modal` 這類 API 被呼叫？

`src/components/` 裡不只存在視覺元件，也存在命令式服務。

- 視覺元件：`button`、`input`、`table`、`modal`。
- 命令式服務：`message`、`notice`、`loading-bar`、`image-preview`。
- 內部基礎能力：`base/notification`、`base/popper`、`base/render`。

這提醒我們閱讀元件時，要先判斷它是「模板渲染型元件」還是「JS 建立實例的服務」。

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

同樣位於 `src/components/` 的檔案，可能代表完全不同的架構型態。閱讀時先判斷元件類型，再選擇追蹤重點，會比逐檔線性閱讀更穩定。

普通元件適合從 props、slot、事件與樣式入手；複合元件要看父子狀態；命令式服務要看實例生命週期與全域掛載；浮層元件要看定位、轉移、關閉與層級管理。

## 檢查問題

1. 普通元件和命令式服務的追蹤方式有什麼不同？
2. 複合元件為什麼要特別看父子狀態傳遞？
3. 浮層元件通常比基礎元件多哪些架構問題？
4. `Message` 為什麼不能只用普通元件閱讀方式理解？
5. 你如何根據元件型態決定先讀哪個檔案？
