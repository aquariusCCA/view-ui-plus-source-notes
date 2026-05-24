# View UI Plus Tag 筆記 03：Render、Class 與 Color System

## 1. 本章定位

本章專門分析 View UI Plus `Tag` 元件的 **render、class 與 color system**。也就是說，本章關心的是：

1. `tag.vue` 的 template 長什麼樣子。
2. 哪些 props 會改變 DOM 結構。
3. 哪些 props 會改變 root class。
4. 哪些 props 會改變 text、dot、close icon 的 class 或 style。
5. 內建色與自定義色分別如何被處理。
6. `checked` 狀態如何影響未選中的視覺樣式。
7. 為什麼判斷最後畫面時，不能只看 `tag.vue`，也不能只看 `tag.less`。

本章不深入展開 `on-change` / `on-close` 的事件控制邊界。事件流程、`isChecked` 的狀態變化、`checked` prop 的同步關係，應該放到下一章 `04-state-events-and-control-boundary.md` 中集中處理。

---

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為閱讀基準。主要涉及以下來源：

| 類型 | 路徑 | 本章閱讀重點 |
| --- | --- | --- |
| Runtime component | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue` | 觀察 template、`classes`、`textClasses`、`dotClasses`、`wraperStyles`、`textColorStyle`、`bgColorStyle`、`iconClass`、`lineColor`。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less` | 觀察 `ivu-tag` 基礎樣式、尺寸、`checked`、`border`、`dot`、內建色、close icon。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/tag.vue` | 對照官方範例中普通、可關閉、border、dot、自定義色等使用情境。 |
| 後續筆記 | `04-state-events-and-control-boundary.md` | 延伸理解 `check()`、`close()`、`isChecked` 與事件 payload。 |

需要特別注意的是，`Tag` 的視覺不是由單一檔案決定。`tag.vue` 負責產生 DOM、class 與 inline style；`tag.less` 才負責把 class 轉成實際 CSS。閱讀時如果只看其中一邊，很容易得到不完整的結論。

---

## 3. 先建立整體心智模型：Tag 的渲染與樣式管線

`Tag` 是一個小型元件，但它的樣式系統其實有多條分支。可以先用下面的流程理解：

```txt
使用者傳入 props 與 slot
        ↓
tag.vue 讀取 closable / checkable / checked / color / type / size
        ↓
template 決定 root、dot、text、Icon 是否出現
        ↓
computed 產生 class 與 inline style
        ↓
DOM 帶著 class / style 被渲染到畫面
        ↓
tag.less 根據 class 套用樣式
        ↓
瀏覽器合併 class style、inline style、Icon props 後形成最終畫面
```

這條管線中有一個很重要的分流點：`color`。

如果 `color` 是 View UI Plus 內建色，例如 `primary`、`success`、`blue`、`purple`，runtime 會產生類似 `ivu-tag-primary` 或 `ivu-tag-blue` 的 class，然後交給 `tag.less` 處理。

如果 `color` 是自定義色，例如 `#EF6AFF` 或其他 CSS color 字串，runtime 不會產生對應的顏色 class，而是透過 inline style 寫到 root、text 或 dot 節點上。

因此閱讀 `Tag` 時，不能只問「這個 prop 對應哪個 class」。更精準的問題應該是：

> 這個 prop 最後是改變 DOM 結構、class、inline style，還是只是讓 less selector 可以命中？

---

## 4. Template 的基本形狀

`Tag` 的 template 可以視為整個元件的骨架：

```vue
<div :class="classes" @click.stop="check" :style="wraperStyles">
    <span :class="dotClasses" v-if="showDot" :style="bgColorStyle"></span>
    <span :class="textClasses" :style="textColorStyle"><slot></slot></span>
    <Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
</div>
```

這段 template 雖然不長，但已經包含了 `Tag` 的主要設計：

1. root `div` 是整顆 Tag 的容器。
2. dot `span` 只在 `type="dot"` 時出現。
3. text `span` 永遠存在，負責承載 default slot。
4. close `Icon` 只在 `closable=true` 時出現。
5. root click 會呼叫 `check()`。
6. close icon click 會呼叫 `close()`，而且使用 `@click.stop` 阻止事件冒泡到 root。

整理成表格如下：

| 節點 | 出現條件 | 主要責任 | 對應樣式來源 |
| --- | --- | --- | --- |
| root `div` | 永遠存在 | 承載主要 class、click handler、自定義色 wrapper style。 | `classes`、`wraperStyles`、`tag.less` |
| dot `span` | `type === 'dot'` | 顯示 dot type 左側圓點。 | `dotClasses`、`bgColorStyle`、`tag.less` |
| text `span` | 永遠存在 | 承載 default slot 文字與文字顏色。 | `textClasses`、`textColorStyle`、`tag.less` |
| close `Icon` | `closable === true` | 顯示 `ios-close`，點擊後觸發 `close()`。 | `iconClass`、`lineColor`、`tag.less`、`Icon` component |

這裡有兩個初學者容易忽略的地方。

第一，`Tag` 顯示的文字不是由 `name` prop 決定，而是由 default slot 決定。例如：

```vue
<Tag name="user">使用者</Tag>
```

畫面上顯示的是 `使用者`，不是 `user`。`name` 的用途主要是事件識別，讓外層知道是哪一顆 Tag 被關閉或切換。

第二，root `div` 上的 `@click.stop="check"` 表示 Tag 自己會攔截點擊事件並執行檢查邏輯。close icon 也有自己的 `@click.stop="close"`，所以點擊 close icon 時，不會順便觸發 root 的 `check()`。

---

## 5. Root Class：`classes` 如何把 props 與狀態轉成 class

`Tag` 的 root class 由 `classes` computed 決定。整理的邏輯如下：

```js
[
    `${prefixCls}`,
    `${prefixCls}-size-${this.size}`,
    {
        [`${prefixCls}-${this.color}`]: !!this.color && oneOf(this.color, initColorList),
        [`${prefixCls}-${this.type}`]: !!this.type,
        [`${prefixCls}-closable`]: this.closable,
        [`${prefixCls}-checked`]: this.isChecked,
        [`${prefixCls}-checkable`]: this.checkable
    }
]
```

其中 `prefixCls` 固定是：

```js
const prefixCls = 'ivu-tag';
```

也就是說，所有 class 都以 `ivu-tag` 為命名基礎。這是 View UI Plus 元件常見的 BEM-like 命名方式：先有一個元件基礎 class，再依照尺寸、狀態、類型與顏色增加變體 class。

### 5.1 Root class 對照表

| 條件 | 產生 class | 分類 | 作用 |
| --- | --- | --- | --- |
| 永遠存在 | `ivu-tag` | 基礎 class | 提供 Tag 的基礎 display、height、padding、border、background、font-size。 |
| `size="default"` | `ivu-tag-size-default` | 尺寸 class | 標記 default size。實際主要樣式仍多由基礎 `.ivu-tag` 承擔。 |
| `size="medium"` | `ivu-tag-size-medium` | 尺寸 class | 對應中尺寸高度、line-height、padding。 |
| `size="large"` | `ivu-tag-size-large` | 尺寸 class | 對應大尺寸高度、line-height、padding。 |
| `color` 屬於內建色 | `ivu-tag-{color}` | 顏色 class | 交給 `tag.less` 決定背景、邊框或文字顏色。 |
| `type="border"` | `ivu-tag-border` | 類型 class | 啟用 border type 的視覺分支。 |
| `type="dot"` | `ivu-tag-dot` | 類型 class | 啟用 dot type 的視覺分支。 |
| `closable=true` | `ivu-tag-closable` | 結構 / 狀態 class | 配合 close icon 的位置、間距與 border type 分隔線。 |
| `isChecked=true` | `ivu-tag-checked` | 狀態 class | 表示目前選中，影響未選中樣式分支。 |
| `checkable=true` | `ivu-tag-checkable` | 互動 class | 讓可選 Tag 顯示 pointer cursor。 |

這張表的關鍵不只是「有哪些 class」，而是要分清楚 class 的角色。`ivu-tag-size-large` 是尺寸變體；`ivu-tag-border` 是類型變體；`ivu-tag-checked` 是狀態；`ivu-tag-primary` 是顏色；`ivu-tag-checkable` 則是互動能力的視覺提示。

### 5.2 為什麼自定義色不產生 class？

`classes` 裡有這段條件：

```js
[`{prefixCls}-${this.color}`]: !!this.color && oneOf(this.color, initColorList)
```

原始碼實際概念是：只有當 `color` 屬於 `initColorList` 時，才會產生 `ivu-tag-{color}`。

這是必要的設計。假設使用者傳入：

```vue
<Tag color="#EF6AFF">Label</Tag>
```

如果 runtime 真的產生：

```txt
ivu-tag-#EF6AFF
```

這會變成不合理的 CSS class 名稱，而且 `tag.less` 也不可能預先替所有使用者自定義顏色生成 selector。因此自定義色必須走 inline style，而不是 class。

---

## 6. Text、Dot 與 Close Icon 的 class / style

root class 只能決定整顆 Tag 的主要外觀。`Tag` 裡面的文字、圓點與關閉 icon 還有各自的 class / style 計算邏輯。

### 6.1 Text：承載 slot，也承載文字顏色邏輯

文字節點的 class 由 `textClasses` 決定。整理出它可能涉及以下 class：

```txt
ivu-tag-text
ivu-tag-color-{color}
ivu-tag-color-white
```

`ivu-tag-text` 是文字節點的基礎 class。`ivu-tag-color-{color}` 和 `ivu-tag-color-white` 則與顏色情境有關。

通常可以這樣理解：

| 情境 | 文字 class / style 的意義 |
| --- | --- |
| 普通 Tag | 文字主要使用基礎樣式或 root 顏色。 |
| `type="border"` 且使用內建色 | 文字需要跟 border 顏色一致，因此可能加上 `ivu-tag-color-{color}`。 |
| 普通 type + 部分內建色 + checked | 文字可能需要白色，因此可能加上 `ivu-tag-color-white`。 |
| 自定義色 | 文字可能由 `textColorStyle` 透過 inline style 控制。 |

這裡要注意 CSS 的最終結果不只取決於 runtime class。即使 runtime 加上 `ivu-tag-color-white`，最後顏色仍可能被 `tag.less` 中更具體或更後面的 selector 覆蓋。因此判斷最終視覺時，要把 `textClasses` 與 `tag.less` 的 selector 一起看。

### 6.2 Dot：只負責 dot type 的左側圓點

dot 節點只有在 `showDot` 成立時才出現，也就是概念上對應 `type="dot"` 的情境。

dot 節點的 class 較單純：

```js
dotClasses () {
    return `${prefixCls}-dot-inner`;
}
```

也就是：

```txt
ivu-tag-dot-inner
```

如果 `color` 是內建色，dot 的顏色主要由 `tag.less` 的 selector 處理。如果 `color` 是自定義色，dot 的背景色則會透過 `bgColorStyle` 寫入 inline style。

這代表 `dot` 的顏色來源可能有兩種：

| `color` 類型 | dot 顏色來源 |
| --- | --- |
| 內建色 | `ivu-tag-{color}` + `ivu-tag-dot` + `ivu-tag-dot-inner` 對應的 less selector |
| 自定義色 | `bgColorStyle` 產生的 inline `background` |

### 6.3 Close Icon：可關閉 Tag 的互動入口

close icon 來自內部的 `Icon` component：

```vue
<Icon
    v-if="closable"
    :class="iconClass"
    :color="lineColor"
    type="ios-close"
    @click.stop="close"
/>
```

它的視覺結果同時受幾個來源控制：

| 來源 | 責任 |
| --- | --- |
| `closable` | 決定 close icon 是否出現。 |
| `iconClass` | 在某些情境下補上顏色相關 class，例如 border type 內建色。 |
| `lineColor` | 透過 `Icon` 的 `color` prop 直接指定圖示顏色。 |
| `tag.less` | 定義 close icon 的大小、margin、opacity、hover 效果，以及 border type 下的位置。 |
| `@click.stop` | 防止點擊 close icon 時同時觸發 root 的 `check()`。 |

這也是 `Tag` 元件很適合練習「DOM 結構與事件隔離」的原因：一顆小小的 close icon，同時牽涉條件渲染、class、style、內部元件 prop 與事件冒泡控制。

---

## 7. DOM 輸出情境對照

下面的 DOM 範例是「概念輸出」，用來理解 template 與 class 的結果。實際瀏覽器中的 DOM 可能因 Vue 渲染、`Icon` component 內部實作或編譯結果而有細節差異。

### 7.1 普通 Tag

輸入：

```vue
<Tag>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-default ivu-tag-checked">
    <span class="ivu-tag-text">Label</span>
</div>
```

這裡最值得注意的是 `checked` 預設為 `true`。因此即使沒有傳入 `checkable`，root 仍可能帶有 `ivu-tag-checked`。這代表 `checked` 不只是給可選 Tag 使用，它也是 `Tag` 視覺狀態的一部分。

另外，`Label` 來自 default slot，而不是 prop。這一點在閱讀 template 時要先分清楚。

### 7.2 可關閉 Tag

輸入：

```vue
<Tag closable>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-default ivu-tag-closable ivu-tag-checked">
    <span class="ivu-tag-text">Label</span>
    <i class="ivu-icon ivu-icon-ios-close"></i>
</div>
```

`closable` 只負責讓 close icon 出現，並讓點擊 icon 時可以觸發 `close()`。它不會自動把這顆 Tag 從畫面上刪除。真正刪除資料或移除 DOM 的動作，必須由外部元件在收到 `on-close` 事件後處理。

這種設計在 UI library 中很常見：基礎元件只發出意圖，資料結構由使用者或上層元件管理。

### 7.3 Border Tag

輸入：

```vue
<Tag type="border" color="primary" closable>Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-primary ivu-tag-border ivu-tag-closable ivu-tag-checked">
    <span class="ivu-tag-text ivu-tag-color-primary">Label</span>
    <i class="ivu-icon ivu-icon-ios-close ivu-tag-color-primary"></i>
</div>
```

`border` type 不是只改 root 邊框而已。它會讓整顆 Tag 進入另一套視覺分支：外框、文字顏色、close icon 顏色、右側分隔線等都可能受到影響。

所以看到 `type="border"` 時，閱讀路線應該是：

```txt
tag.vue classes / textClasses / iconClass
        ↓
root 是否有 ivu-tag-border
        ↓
text / icon 是否有 ivu-tag-color-{color}
        ↓
tag.less 裡 border 相關 selector
        ↓
最終畫面
```

### 7.4 Dot Tag

輸入：

```vue
<Tag type="dot" color="success">Label</Tag>
```

概念輸出：

```html
<div class="ivu-tag ivu-tag-size-default ivu-tag-success ivu-tag-dot ivu-tag-checked">
    <span class="ivu-tag-dot-inner"></span>
    <span class="ivu-tag-text">Label</span>
</div>
```

`dot` type 的重點是多了一個左側圓點。這個圓點不是文字前面的 CSS pseudo-element，而是 template 中實際渲染出來的 `span`。

這代表如果要分析 dot 的顏色與位置，不能只看 root class，也要看：

```txt
showDot
dotClasses
bgColorStyle
tag.less 裡 .ivu-tag-dot / .ivu-tag-dot-inner
```

---

## 8. 內建色路徑：class + less

內建色的判斷基準是 `initColorList`。清單如下：

```txt
default
primary / success / warning / error
blue / green / red / yellow
pink / magenta / volcano / orange / gold / lime / cyan / geekblue / purple
```

當 `color` 屬於這份清單時，runtime 會在 root 上產生：

```txt
ivu-tag-{color}
```

例如：

```vue
<Tag color="success">成功</Tag>
```

概念上會得到：

```txt
ivu-tag-success
```

接著 `tag.less` 會根據這個 class 決定實際背景、邊框、文字或 dot 顏色。

### 8.1 內建色的分類

| 顏色類型 | 代表值 | 視覺策略 |
| --- | --- | --- |
| default | `default` | 使用基礎灰底、灰邊框與預設文字色。 |
| 語意色 | `primary`、`success`、`warning`、`error` | 通常代表操作狀態或語意狀態，常見策略是實色背景搭配白字。 |
| 色階色 | `pink`、`magenta`、`red`、`volcano`、`orange`、`yellow`、`gold`、`cyan`、`lime`、`green`、`blue`、`geekblue`、`purple` | 通常用 light background、light border、dark text 形成柔和標籤效果。 |

`tag.less` 中的 `.make-color-classes()` 會批次產生色階色 class。這是為什麼只看 `tag.vue` 看不到每一種顏色的具體 CSS，因為具體色值與 selector 展開邏輯是在 less 裡完成的。

### 8.2 為什麼內建色適合用 class？

內建色之所以適合用 class，是因為 library 可以預先設計好這些色彩組合。例如 `success` 應該配什麼背景、hover 時怎麼變、dot type 圓點如何顯示，這些都可以在 less 中統一維護。

這樣做有幾個好處：

1. 可以維持整個 UI library 的設計一致性。
2. 可以讓使用者只透過 `color="success"` 這種語意 API 使用顏色。
3. 可以避免 runtime 產生大量 inline style。
4. 可以讓 hover、border、dot、text 等狀態由 CSS 統一控制。

---

## 9. 自定義色路徑：computed inline style

如果 `color` 不在 `initColorList` 裡，例如：

```vue
<Tag color="#EF6AFF">Label</Tag>
```

runtime 不會產生 `ivu-tag-#EF6AFF`。這時會改走 computed inline style。

自定義色主要會經過三個 computed：

```txt
wraperStyles
textColorStyle
bgColorStyle
```

> 注意：這裡保留原始碼中的拼字 `wraperStyles`。雖然英文通常會寫作 `wrapperStyles`，但閱讀 source 時應以原始命名為準。

### 9.1 `wraperStyles`：控制 root 外觀

`wraperStyles` 主要處理 root `div` 的 inline style。可能影響範圍包括：

```txt
background
borderWidth
borderStyle
borderColor
color
```

對普通自定義色 Tag 來說，root 背景和邊框可能直接使用自定義色。這讓使用者可以傳入任何 CSS color 字串，而不需要 View UI Plus 預先在 less 裡定義 class。

### 9.2 `textColorStyle`：控制文字顏色

`textColorStyle` 主要影響 text `span`。判斷方向如下：

| 情境 | 文字處理方向 |
| --- | --- |
| 普通 type 且 checked | 通常讓文字變白，以便搭配自定義色背景。 |
| border type | 使用自定義色作為文字顏色。 |
| dot type | 文字多半維持預設，圓點顏色另外處理。 |

這裡要注意「背景色」和「文字色」不能只看一個 computed。普通 Tag 自定義色可能 root 背景變成自定義色，文字變成白色；border Tag 自定義色可能 root 背景保持較淡或透明，文字與邊框使用自定義色；dot Tag 自定義色則可能主要作用在 dot 圓點。

### 9.3 `bgColorStyle`：控制 dot 顏色

`bgColorStyle` 主要用於 dot `span`：

```txt
background: custom color
```

也就是說，當 `type="dot"` 且使用自定義色時，顏色不是靠 `.ivu-tag-dot-inner` 的內建 selector，而是直接透過 inline `background` 寫在 dot 節點上。

### 9.4 自定義色閱讀流程

遇到自定義 `color` 時，建議按照以下順序閱讀：

```txt
確認 color 是否不在 initColorList
        ↓
確認 root 是否沒有 ivu-tag-{color}
        ↓
看 wraperStyles 如何處理 root background / border / color
        ↓
看 textColorStyle 如何處理文字
        ↓
如果 type="dot"，再看 bgColorStyle 如何處理 dot
        ↓
最後回到 tag.less 檢查基礎樣式是否仍會影響 spacing / border / height
```

這個流程能避免一個常見錯誤：在 `tag.less` 裡一直找自定義色 class。自定義色不是透過 less class 做出來的，而是 runtime inline style。

---

## 10. `checked` 與未選中樣式

`checked` 會先進入內部狀態 `isChecked`，而 root class 會根據 `isChecked` 決定是否加上：

```txt
ivu-tag-checked
```

在本章，我們不深入討論 `checked` 如何被更新，只討論它如何影響畫面。

less 規則很重要：

```less
&:not(&-border):not(&-dot):not(&-checked) {
    background: transparent;
    border-color: transparent;
    color: @text-color;
}
```

這段 selector 的意思是：

> 當一顆 Tag 不是 border type、不是 dot type，而且也不是 checked 狀態時，把它變成透明背景、透明邊框與普通文字色。

這能解釋為什麼普通 checkable Tag 在取消選中後，看起來像是被「淡出」或恢復成普通文字狀態，而不是整顆元件消失。

### 10.1 為什麼這段 selector 排除 border 與 dot？

因為 `border` 和 `dot` 本身就是特殊視覺類型。它們的未選中狀態不一定應該套用普通 Tag 的透明背景規則。

這裡可以用責任分工理解：

| 類型 | 未選中樣式主要由誰決定 |
| --- | --- |
| 普通 Tag | `:not(&-border):not(&-dot):not(&-checked)` 這段 selector 影響明顯。 |
| Border Tag | border type 的 selector 應維持自己的外框語意。 |
| Dot Tag | dot type 的 selector 應維持白底與左側圓點語意。 |

因此，`checked=false` 不是對所有 `type` 都產生一模一樣的視覺結果。它是否明顯改變畫面，要看目前 Tag 是否被 `border` 或 `dot` 分支排除。

### 10.2 `checkable` 和 `checked` 的差異

`checkable` 與 `checked` 很容易混淆，但它們負責不同事情：

| prop / state | 責任 |
| --- | --- |
| `checkable` | 表示這顆 Tag 可以被點擊切換，並加上 `ivu-tag-checkable` 讓 cursor 顯示 pointer。 |
| `checked` / `isChecked` | 表示目前是否被選中，並決定 root 是否有 `ivu-tag-checked`。 |

簡單說，`checkable` 是「能不能點」，`checked` 是「目前是不是選中」。一顆 Tag 理論上可以有 `checked` 狀態，但不一定開啟 `checkable` 互動。

---

## 11. Close Icon 的樣式與事件隔離

可關閉 Tag 的 close icon 雖然只是 template 的第三個子節點，但它在整個元件中扮演很重要的角色。

```vue
<Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
```

### 11.1 close icon 的視覺來源

close icon 的外觀可能來自四層：

| 層次 | 說明 |
| --- | --- |
| template | `closable` 決定是否渲染 `Icon`。 |
| computed class | `iconClass` 可能依照 `type` 與 `color` 補上顏色 class。 |
| computed value | `lineColor` 透過 `Icon` 的 `color` prop 直接指定顏色。 |
| less | `.ivu-icon-ios-close` 相關 selector 決定大小、位置、透明度、hover 與 border type 下的特殊排列。 |

這代表如果 close icon 顏色或位置看起來不符合預期，不能只看 `Icon` 的 `color` prop，也要檢查 `tag.less` 是否有針對 `.ivu-tag-closable`、`.ivu-tag-border` 或 `.ivu-icon-ios-close` 寫特殊規則。

### 11.2 close icon 的事件隔離

root 有：

```vue
@click.stop="check"
```

close icon 也有：

```vue
@click.stop="close"
```

這表示點擊 close icon 時，事件會在 icon 節點被停止，不會往上觸發 root 的 `check()`。

這個設計非常重要。假設一顆 Tag 同時有：

```vue
<Tag checkable closable>Label</Tag>
```

如果 close icon 沒有 `@click.stop`，使用者點關閉時可能同時觸發：

```txt
close()
check()
```

結果就會變成「想關閉，卻也切換了選中狀態」。`@click.stop` 把這兩個互動入口隔離開來，讓 close 和 check 各自維持清楚的語意。

---

## 12. Runtime 與 Less 的責任分工

閱讀 `Tag` 時，最重要的是分清楚 runtime 和 less 各自負責什麼。

| 問題 | 主要看哪裡 | 原因 |
| --- | --- | --- |
| 哪些 DOM 節點會出現？ | `tag.vue` template | dot 和 close icon 是條件渲染。 |
| root 會有哪些 class？ | `classes` computed | props 和 `isChecked` 會被轉成 root class。 |
| 文字會有哪些 class / style？ | `textClasses`、`textColorStyle` | 文字顏色可能來自 class 或 inline style。 |
| dot 圓點顏色怎麼來？ | `dotClasses`、`bgColorStyle`、`tag.less` | 內建色與自定義色走不同路徑。 |
| close icon 的位置與 hover？ | `tag.less` | 大小、間距、hover 多由 CSS 決定。 |
| 內建色的具體色值？ | `tag.less` | `tag.vue` 只產生 class，不保存完整 CSS 色值。 |
| 自定義色的具體套用？ | `wraperStyles`、`textColorStyle`、`bgColorStyle` | 自定義色不會有預先定義的 less class。 |
| 點 close 是否會觸發 check？ | template 上的 `@click.stop` | 事件隔離由 Vue event modifier 決定。 |

這張表可以作為閱讀 `Tag` source 時的查找索引。當畫面和預期不一樣時，先判斷問題屬於「結構、class、inline style、less selector、事件」哪一層，再去對應檔案找原因。

---

## 13. 建議閱讀路線

第一次閱讀這章相關 source 時，不建議一開始就跳進 `tag.less` 的顏色 selector，因為顏色規則通常比較多，容易失去主線。比較適合的順序如下：

1. **先讀 `tag.vue` template**  
   先確認 root、dot、text、Icon 四個節點的存在條件。

2. **再讀 `classes` computed**  
   建立 root class 的完整地圖，理解 `size`、`color`、`type`、`closable`、`checked`、`checkable` 如何映射成 class。

3. **接著讀文字、dot、icon 的 computed**  
   對照 `textClasses`、`dotClasses`、`iconClass`、`lineColor`，理解內部節點如何補充 root class 做不到的視覺控制。

4. **再讀自定義色相關 computed style**  
   對照 `wraperStyles`、`textColorStyle`、`bgColorStyle`，理解自定義色為什麼走 inline style。

5. **最後讀 `tag.less`**  
   回頭確認 `ivu-tag`、尺寸、`checked`、`border`、`dot`、內建色、close icon 等 selector 如何轉成具體畫面。

6. **用 examples 驗證畫面**  
   透過官方 example 對照普通 Tag、可關閉 Tag、border Tag、dot Tag、自定義色 Tag，確認 source 閱讀結果是否能解釋畫面。

這個順序可以避免兩個常見問題：只看 runtime 而忽略 CSS，或只看 CSS 而不知道 class 是怎麼來的。

---

## 14. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `name` 會顯示在 Tag 上 | `Tag` 顯示內容來自 default slot，`name` 主要用於事件識別。 |
| `closable` 會自動刪除 Tag | `closable` 只渲染 close icon 並觸發 `close()`；是否刪除資料由外部決定。 |
| 自定義 `color` 會產生 `ivu-tag-{color}` class | 只有內建色會產生顏色 class，自定義色走 inline style。 |
| 只看 `tag.vue` 就能知道所有顏色 | `tag.vue` 只處理 class / style 分流，內建色具體 CSS 要看 `tag.less`。 |
| 只看 `tag.less` 就能理解自定義色 | 自定義色主要由 computed inline style 處理，不會在 less 裡有固定 class。 |
| `checked=false` 對所有 type 的影響都一樣 | less 的未選中 selector 排除了 border 和 dot，所以不同 type 受影響程度不同。 |
| 點 close icon 也會切換 checked | close icon 使用 `@click.stop`，正常情況下不會觸發 root 的 `check()`。 |

---

## 15. 本章總結

`Tag` 的 render output 看起來很小，但它的 class 與顏色系統並不簡單。它把一顆標籤拆成 root、dot、text、close icon 幾個固定角色，再透過 props 與內部狀態決定哪些節點出現、哪些 class 被加上、哪些 inline style 被寫入。

本章最重要的觀念是：`Tag` 的視覺系統有兩條顏色路徑。

第一條是 **內建色路徑**。當 `color` 屬於 `initColorList`，runtime 會產生 `ivu-tag-{color}`，具體顏色交給 `tag.less`。這條路徑適合 library 預先定義好的設計語言。

第二條是 **自定義色路徑**。當 `color` 不屬於內建色，runtime 不會產生顏色 class，而是透過 `wraperStyles`、`textColorStyle`、`bgColorStyle` 產生 inline style。這條路徑讓使用者可以傳入任意 CSS color。

另外，`checked` 不是單純的互動狀態，它也會透過 `ivu-tag-checked` 影響視覺；`closable` 不只增加一個 icon，也牽涉 icon 樣式與事件隔離；`type="border"` 和 `type="dot"` 則會讓 Tag 進入不同的視覺分支。

閱讀這類元件時，應該持續追問四個問題：

1. 這個 prop 是否改變 DOM 結構？
2. 這個 prop 是否改變 class？
3. 這個 prop 是否改變 inline style？
4. 最終畫面是否還需要回到 less selector 才能確認？

---

## 16. 自我檢查問題

1. `Tag` template 中哪些節點永遠存在？哪些節點按條件出現？
2. 為什麼 `Tag` 的顯示文字來自 default slot，而不是 `name` prop？
3. `classes` computed 會根據哪些 props 或 state 產生 root class？
4. 自定義 `color` 為什麼不會產生 `ivu-tag-{color}` class？
5. 內建色與自定義色的處理路徑有什麼差異？
6. `type="dot"` 的圓點顏色可能由哪些來源決定？
7. `checked=false` 為什麼主要影響普通 type，而不是所有 type 都產生同樣變化？
8. close icon 的顏色與位置分別可能由哪些來源控制？
9. 為什麼判斷內建色最終顏色時，不能只看 `textClasses`？
10. 如果一顆 Tag 同時有 `checkable` 和 `closable`，為什麼 close icon 上的 `@click.stop` 很重要？

---

## 17. 後續延伸方向

這一章主要建立 `Tag` 的 render、class 與 color system。後續可以拆成以下更深入的筆記：

| 延伸主題 | 建議筆記方向 |
| --- | --- |
| `04-state-events-and-control-boundary.md` | 分析 `check()`、`close()`、`isChecked`、`checked` watcher、`on-change`、`on-close`。 |
| `05-tag-less-deep-reading.md` | 專門逐段閱讀 `tag.less`，整理尺寸、border、dot、內建色、hover、close icon。 |
| `06-custom-color-behavior.md` | 專門用多個範例測試自定義 color 在普通、border、dot、checked / unchecked 下的差異。 |
| `07-tag-select-option-integration.md` | 分析 `TagSelectOption` 如何包裝 `Tag checkable`，以及上層如何接管列表選取狀態。 |
| `08-ui-library-component-reading-method.md` | 把 `Tag` 的閱讀方法抽象成一套可套用到其他 View UI Plus 元件的 source reading checklist。 |

---

## 18. 資訊不足與後續確認事項

仍有幾個地方需要後續回到完整 source 補充：

1. `wraperStyles`、`textColorStyle`、`bgColorStyle` 的完整條件分支尚未逐行展開。
2. `iconClass` 與 `lineColor` 的完整判斷邏輯尚未逐行展開。
3. `tag.less` 中 `.make-color-classes()` 實際產生的所有 selector 與色值尚未完整列表化。
4. `checked=false` 在 `border`、`dot`、自定義色組合下的實際畫面差異，最好透過 example 或本地 demo 驗證。
5. `Icon` component 自身如何處理 `color` prop，不屬於本章範圍，若要精確理解 close icon 顏色，後續可補讀 `Icon` source。

這些部分不應在沒有 source 對照的情況下任意推測。後續若要深入，可以直接補一篇 `Tag` 的 computed 與 less selector 逐行閱讀筆記。

---