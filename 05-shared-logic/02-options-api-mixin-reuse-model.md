# Options API Mixin Reuse Model：View UI Plus 的 mixin 復用模型

## 1. 本章定位

本篇筆記整理 View UI Plus 如何用 Options API mixin 做跨元件復用。

View UI Plus v1.3.20 雖然是 Vue 3 library，但元件實作大量使用 Options API。這會讓共用邏輯自然落在 mixin，而不是 Composition API composable。

本篇要回答三個問題：

1. View UI Plus 的 mixin 通常復用什麼能力？
2. mixin 注入 component 後，元件如何使用這些能力？
3. 讀 mixin 時要注意哪些隱性依賴與命名衝突？

---

## 2. Mixin 在這份 source 中的角色

Vue Options API mixin 可以合併多種 option：

```txt
props
computed
methods
inject
data
lifecycle hooks
```

因此它不是單純的工具函式，而是「把一組元件能力直接合併進 component instance」。

在 View UI Plus 中常見例子：

| Mixin | 典型用途 |
| --- | --- |
| `mixins/form.js` | 欄位元件接入 `FormItem` 驗證與 `Form` disabled 狀態。 |
| `mixins/locale.js` | 元件取得 `this.t()` 翻譯方法。 |
| `mixins/link.js` | 元件取得 `to`、`replace`、`target` 等跳轉 props 與 click handler。 |
| `mixins/globalConfig.js` | 元件取得 `this.globalConfig`。 |
| `components/modal/mixins-scrollbar.js` | Modal / Drawer / Spin 共用 body scroll lock 相關方法。 |
| `components/menu/mixin.js` | MenuItem / Submenu 共用 menu 注入與階層資訊。 |

---

## 3. 典型使用方式

以 `Button` 為例，它同時混入 link 與 form：

```js
import mixinsLink from '../../mixins/link';
import mixinsForm from '../../mixins/form';

export default {
    name: 'Button',
    mixins: [ mixinsLink, mixinsForm ]
};
```

混入後，`Button` 可以直接使用：

| 來源 | 注入能力 | Button 使用情境 |
| --- | --- | --- |
| `mixins/link.js` | `to`、`target`、`linkUrl`、`handleCheckClick()` | 讓 Button 可渲染成可跳轉的 `<a>`。 |
| `mixins/form.js` | `itemDisabled`、`handleFormItemChange()` | 讓 Button 在 Form disabled 時也能被禁用。 |

這種寫法的優點是 component 本身不用重複宣告 link/form 相關 props 與方法。缺點是讀 `Button` 時，如果沒有打開 mixin，就會不知道 `this.to`、`this.linkUrl`、`this.itemDisabled` 從哪裡來。

---

## 4. Mixin 與 utility 的差異

在這份 source 中，mixin 與 utility 的邊界可以這樣理解：

| 類型 | 使用方式 | 適合放什麼 |
| --- | --- | --- |
| Mixin | `mixins: [xxx]` | 需要注入 props、computed、methods、inject、lifecycle 的元件能力。 |
| Utility | `import { xxx } from '../../utils/assist'` | 明確呼叫的資料處理、DOM 操作、元件查找、格式化工具。 |
| Component local mixin | `import ScrollbarMixins from './mixins-scrollbar'` | 只在少數同類元件之間共享的內部能力。 |

簡單判斷：

如果某段邏輯需要讓模板或 instance method 直接使用 `this.xxx`，它可能會被寫成 mixin。

如果某段邏輯只是接收參數、回傳結果，通常會放在 utils。

---

## 5. Options API mixin 的隱性依賴

Mixin 的最大風險是依賴不明顯。

例如 `form.js` 提供：

```js
computed: {
    itemDisabled () {
        let state = this.disabled;
        if (!state && this.FormInstance) state = this.FormInstance.disabled;
        return state ? true : null;
    }
}
```

這段看起來在 mixin 內部完整，但其實依賴呼叫端 component 有：

1. `disabled` prop 或 data。
2. `FormInstance` inject。
3. template 或 render function 知道要使用 `itemDisabled`。

所以讀 mixin 時要反向檢查：

```txt
mixin 提供了什麼？
  -> 哪些 component 使用它？
  -> 使用元件是否有對應 prop / template / event？
  -> 它依賴的 inject 是否真的存在？
```

---

## 6. Mixin 合併時的命名風險

Options API mixin 會把內容合併到 component option 裡。如果 component 和 mixin 有同名內容，就可能互相覆蓋或產生難讀的結果。

需要特別注意：

| 類型 | 風險 |
| --- | --- |
| `props` | mixin 宣告的 prop 會變成元件 public API，但讀元件本體時不一定看得到。 |
| `computed` | 同名 computed 可能造成覆蓋或語意混亂。 |
| `methods` | method 名稱容易與元件本體 method 衝突。 |
| `data` | mixin data 與元件 data 都會進 instance namespace。 |
| lifecycle | 多個 hook 都會執行，但閱讀流程變得分散。 |

View UI Plus 的 mixin 大多命名比較明確，例如 `handleFormItemChange`、`handleCheckClick`，但閱讀時仍要把 mixin 視為 component 實作的一部分。

---

## 7. 讀碼清單

當你看到一個元件有：

```js
mixins: [A, B]
```

建議照以下順序讀：

1. 先列出 mixin 注入的 `props`、`computed`、`methods`、`inject`。
2. 回到 component template / render，看哪些 `this.xxx` 來自 mixin。
3. 檢查 mixin 是否依賴 `provide/inject`、`$router`、`$VIEWUI`、DOM 或父子結構。
4. 檢查 mixin 是否改變了元件對外 API，例如增加 `to`、`target`、`replace` props。
5. 判斷這段共用能力是跨很多元件，還是只是一個局部 family 的內部復用。

---

## 8. 本章結論

View UI Plus 的 shared logic 不是以 composable 為主，而是以 Options API mixin 和 util function 混合形成。

讀 mixin 時不要只看它本身，要把它當成「被合併進元件的半個元件實作」：

```txt
Component source
  + mixins
  + injected providers
  + imported utils
  = component 真正的 runtime behavior
```

這個觀念是後續理解 `Form`、`Button`、`Modal`、`Select` 等元件的基礎。
