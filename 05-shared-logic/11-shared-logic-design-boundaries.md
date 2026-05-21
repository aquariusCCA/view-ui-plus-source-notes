# Shared Logic Design Boundaries：共用邏輯的設計邊界

## 1. 本章定位

本篇是 `05-shared-logic/` 的總結筆記。

前面幾篇已經分別看過：

```txt
Options API mixin
Form mixin
Locale / global config
Link mixin
Component tree lookup
DOM utils
Overlay shared state
Data / keyboard utils
Measurement utils
```

本篇要回答的是：在 View UI Plus 這種 UI library 中，什麼邏輯適合抽成 mixin？什麼適合放 utils？什麼應該留在元件內？

---

## 2. 三種邊界

可以先把共用邏輯分成三種：

| 類型 | 代表 | 適合內容 |
| --- | --- | --- |
| Mixin | `form.js`、`locale.js`、`link.js` | 需要合併進 component instance 的能力。 |
| Utility | `assist.js`、`dom.js`、`csv.js` | 明確輸入輸出、可由多個元件呼叫的工具。 |
| Component-local shared logic | `modal/mixins-scrollbar.js`、`menu/mixin.js` | 只在某個元件家族內共享的邏輯。 |

這三種不是好壞之分，而是邊界不同。

---

## 3. 什麼適合做成 mixin？

適合做成 mixin 的邏輯通常有這些特徵：

1. 需要注入 props。
2. 需要注入 computed。
3. 需要注入 methods，供 template / render 使用。
4. 需要 inject parent context。
5. 多個元件要暴露一致的 public API。

例子：

```txt
link.js
  -> 多種元件都要支援 to / replace / target / append

form.js
  -> 多種欄位元件都要接入 FormItem

locale.js
  -> 多種元件都要呼叫 this.t()
```

Mixin 的代價是：來源不明顯。讀元件時必須主動打開 mixin，否則會找不到 `this.xxx` 從哪裡來。

---

## 4. 什麼適合放 utils？

適合放 utils 的邏輯通常有這些特徵：

1. 呼叫端可以明確 import。
2. 接收參數並回傳結果。
3. 不需要合併進 component instance。
4. 不需要暴露成元件 props。
5. 可以跨多個元件使用。

例子：

```txt
oneOf(value, validList)
deepCopy(data)
getStyle(element, styleName)
on(element, event, handler)
csv(columns, datas, options)
calcTextareaHeight(textarea, minRows, maxRows)
```

Utility 的優點是依賴清楚。缺點是如果像 `assist.js` 一樣包太多不同主題，就會變成雜物間。

---

## 5. 什麼應該留在元件內？

如果邏輯高度依賴單一元件的狀態、template 結構或專屬 props，就應該留在元件內。

例子：

```txt
Modal 的 visible watcher
Table 的 column / row 狀態轉換
Select 的 option selection 狀態
DatePicker panel 的選取狀態
```

這些邏輯即使有一部分能抽出，也不一定值得抽。過度抽象會讓讀者在多個檔案之間跳來跳去，反而降低可讀性。

---

## 6. Component-local shared logic 的位置

有些邏輯不是整個 library 共用，只是某個元件 family 共用。

例子：

```txt
components/modal/mixins-scrollbar.js
components/menu/mixin.js
components/color-picker/hsaMixin.js
components/table/util.js
components/date-picker/util.js
```

這類檔案放在元件目錄內，比放到 `src/utils/` 更合理，因為它們的語意邊界很明確：

```txt
只有 Modal family 需要
只有 Menu family 需要
只有 DatePicker family 需要
```

這能避免 `src/utils/` 無限制膨脹。

---

## 7. `assist.js` 的邊界問題

`assist.js` 是 View UI Plus 中最典型的混合型工具檔。

它同時包含：

```txt
prop validator
string transform
scrollbar measurement
MutationObserver
getStyle
warnProp
typeOf
deepCopy
scrollTop animation
component tree lookup
class helper
breakpoint map
matchMedia polyfill
downloadFile
```

這對使用者來說方便，但對閱讀者來說會混淆。

因此在筆記中應該按能力拆，而不是按檔案拆：

```txt
資料工具
DOM 工具
元件樹工具
量測工具
下載工具
響應式斷點工具
```

這也是 `05-shared-logic/` 用主題拆筆記的原因。

---

## 8. 判斷抽象是否合理的問題清單

看一段共用邏輯時，可以問：

1. 它被幾個元件使用？
2. 這些使用者是否真的有相同語意，還是只是程式碼長得像？
3. 它是否引入隱性依賴，例如 `this.disabled`、`this.$router`、`this.FormItemInstance`？
4. 它是否操作全域狀態，例如 body style、document event、module-level counter？
5. 它是否需要 client guard？
6. 如果未來用 Composition API 重寫，它會變成 composable、utility，還是仍留在元件內？

---

## 9. 從 View UI Plus 學到的復用策略

可以總結成：

```txt
跨很多元件且會擴充 component instance
  -> mixin

跨很多元件且是明確函式呼叫
  -> utils

只屬於某個元件 family
  -> component-local util / mixin

涉及 DOM 全域副作用
  -> utility + lifecycle cleanup

涉及全域 library config
  -> app globalProperties + 元件 default fallback
```

這套策略不是唯一答案，但很符合 Options API UI library 的歷史與實務。

---

## 10. 本章結論

`05-shared-logic/` 的核心價值不是背工具函式，而是建立判斷邏輯放置位置的能力。

讀 View UI Plus 時，你可以用這句話提醒自己：

```txt
共用邏輯不是為了少寫幾行程式，
而是為了讓多個元件共享同一份行為契約。
```

如果抽象後契約更清楚，就是好的共用邏輯。  
如果抽象後只剩來源分散、依賴隱性、debug 困難，就要對這個抽象保持警覺。
