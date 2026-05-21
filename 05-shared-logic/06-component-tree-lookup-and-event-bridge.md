# Component Tree Lookup and Event Bridge：元件樹查找與事件橋接

## 1. 本章定位

本篇整理 View UI Plus 中與「元件樹關係」有關的共用邏輯。

主要來源：

```txt
src/utils/assist.js
src/mixins/emitter.js
src/components/menu/mixin.js
```

本篇重點不是 DOM tree，而是 Vue component tree：父元件、子元件、兄弟元件如何被查找與溝通。

---

## 2. 元件樹查找工具

`assist.js` 中有一組 helper：

```txt
findComponentUpward(context, componentName)
findComponentDownward(context, componentName)
findComponentsDownward(context, componentName)
findComponentsUpward(context, componentName)
findBrothersComponents(context, componentName, exceptMe)
```

它們都依賴 Options API component instance 上的：

```txt
this.$parent
this.$children
child.$options.name
```

這是一種典型的 Vue 2 / Options API 風格：透過 component name 在元件樹中尋找特定角色。

---

## 3. `findComponentUpward()` 的用途

`findComponentUpward()` 會沿著 `$parent` 往上找，直到找到指定 component name。

典型使用：

```txt
Input
  -> 判斷自己是否包在 DatePicker / TimePicker / Cascader / Search 中

DropdownItem
  -> 找到 Dropdown 父層

Tree node
  -> 找到 Tree 父層

Cascader panel/item
  -> 找到 Cascader 父層
```

這種查找適合「子元件需要知道最近的某種父層角色」。

---

## 4. `findComponentsUpward()` 與 Menu 階層

`components/menu/mixin.js` 使用：

```js
import { findComponentsUpward } from '../../utils/assist';
```

它提供：

```js
computed: {
    hasParentSubmenu () {
        return !!this.SubmenuInstance;
    },
    parentSubmenuNum () {
        return findComponentsUpward(this, 'Submenu').length;
    },
    mode () {
        return this.MenuInstance.mode;
    }
}
```

這裡同時使用兩種方式：

1. `provide/inject` 取得 `MenuInstance`、`SubmenuInstance`。
2. `findComponentsUpward()` 計算上層 `Submenu` 數量。

也就是說，`provide/inject` 解決「拿到最近的上下文」，元件樹查找解決「計算階層資訊」。

---

## 5. `emitter.js`：Vue 2 風格事件橋接

`src/mixins/emitter.js` 提供兩個 method：

```txt
dispatch(componentName, eventName, params)
broadcast(componentName, eventName, params)
```

語意是：

| 方法 | 方向 | 行為 |
| --- | --- | --- |
| `dispatch` | 往父層找 | 找到指定 component name 後 `$emit(eventName, ...params)`。 |
| `broadcast` | 往子層遞迴 | 找到指定 component name 後 `$emit(eventName, ...params)`。 |

這是 Vue 2 時代 UI library 常見的父子事件橋接模式。當時常用它讓 FormItem、Select、Menu 等跨層級元件互相通知。

不過，在目前 v1.3.20 source 中，使用 `rg` 搜尋沒有看到 `emitter.js` 被實際 import。這表示它比較像保留下來的歷史工具，而不是目前主要溝通機制。

---

## 6. 與 `provide/inject` 的關係

View UI Plus v1.3.20 更常見的是 `provide/inject`。

例子：

```txt
Form
  provide FormInstance
FormItem
  inject FormInstance
  provide FormItemInstance
Field component
  inject FormInstance / FormItemInstance
```

或：

```txt
Table
  provide TableInstance
Modal / Drawer / Tabs
  provide instance
children
  inject parent instance
```

可以把幾種方式做比較：

| 機制 | 適合用途 | 風險 |
| --- | --- | --- |
| `provide/inject` | 穩定上下文傳遞，例如 Form、Menu、Table。 | 依賴注入 key 與父層是否存在。 |
| 元件樹查找 | 臨時尋找父/子/兄弟角色或計算階層。 | 強依賴 component name 與 `$parent/$children`。 |
| `dispatch/broadcast` | Vue 2 風格跨層事件橋接。 | 在 Vue 3 中較不主流，且目前未見實際使用。 |

---

## 7. 讀碼提醒

當你看到：

```js
findComponentUpward(this, 'xxx')
```

要問：

1. 它是不是在判斷自己處於某個複合元件內？
2. 它找到父層後，是讀資料、呼叫方法，還是只做條件判斷？
3. 如果 component name 改了，這段邏輯會不會失效？

當你看到：

```js
inject: { XxxInstance: ... }
```

要問：

1. 上層是哪個元件 provide 這個 instance？
2. default 值是什麼？
3. 沒有注入時，元件是否能獨立運作？

---

## 8. 本章結論

View UI Plus 的元件溝通不是單一模式，而是混合使用：

```txt
provide/inject
component tree lookup
legacy dispatch/broadcast
```

閱讀時要避免只用「父傳子、子傳父」這種簡化模型。UI library 裡常有複合元件、跨層級包裝、浮層 teleport、FormItem 包欄位等情境，因此它會需要更多 component tree 層面的共用工具。
