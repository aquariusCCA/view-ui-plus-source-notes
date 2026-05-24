# ButtonGroup And Style System：群組容器如何透過樣式系統影響子按鈕

## 1. 本章定位

本章專門分析 View UI Plus 中 `ButtonGroup` 與 `Button` 樣式系統的協作方式。

前面幾章已經分別處理了 `Button` / `ButtonGroup` 的 source map、public props contract、render 與 class mapping、狀態事件與 navigation。本章的重點則轉向「樣式如何接手 runtime 輸出的 class」。

換句話說，本章要回答的不是：

> `ButtonGroup` 可以怎麼用？

而是：

> `ButtonGroup` 為什麼只包一層 `div`，卻能讓一組 `Button` 看起來像同一個控制組？

讀完本章後，你應該能回答以下問題：

1. `ButtonGroup` runtime 到底做了什麼，沒有做什麼。
2. `size`、`shape`、`vertical` 如何轉成 group class。
3. group class 如何透過 less parent-child selector 影響子 `Button`。
4. 橫向 group 如何合併相鄰按鈕的邊框與圓角。
5. 縱向 group 為什麼不是單純把排列方向改成 column。
6. primary button 在 group 中為什麼需要額外邊框規則。
7. 為什麼 `ButtonGroup` 必須和 `Button` 的樣式一起閱讀。

本章不會重新整理 `Button` 的所有 props，也不會重複分析 `Button` 的 click、loading、link navigation。這些內容應回到前面的獨立筆記閱讀。

---

## 2. 先建立核心觀念：ButtonGroup 不是子元件管理器

閱讀 `ButtonGroup` 前，必須先建立一個重要觀念：

> `ButtonGroup` 的主要責任不是「管理子 Button」，而是「建立一個樣式上下文」。

在某些複雜元件中，父元件會透過 `provide/inject`、slot props、子元件註冊、事件收集或狀態同步來管理子元件。例如，表單元件可能會收集欄位狀態，選單元件可能會管理目前選中的 item，Tabs 可能會同步 active key。

但這個版本的 `ButtonGroup` 並不是這種設計。它不會主動取得 slot 裡的 `Button` 實例，也不會把 `size` 或 `shape` 透過 props 傳給子按鈕，更不會在 runtime 中計算第一個、最後一個或中間的按鈕。

它採用的是另一種更輕量的設計：

```txt
ButtonGroup props
  -> 轉成父層 class
  -> less 使用父子 selector 命中子 Button
  -> 子 Button 在視覺上被群組化
```

這種設計的好處是 runtime 簡單、耦合低、執行成本低。缺點是行為理解會分散在兩個地方：你必須同時看 `button-group.vue` 和 less 檔案，才能知道 `ButtonGroup` 的完整效果。

---

## 3. Source Baseline：本章要對照哪些檔案

分析 `ButtonGroup` 時，不能只看 `button-group.vue`。因為 `ButtonGroup` 的核心效果不是寫在 runtime 裡，而是藏在 style system 裡。

| 類型 | 路徑 | 閱讀重點 |
| --- | --- | --- |
| `ButtonGroup` runtime | `src/components/button/button-group.vue` | 看 props、computed class 與 slot wrapper。 |
| `Button` runtime | `src/components/button/button.vue` | 看子按鈕會輸出哪些 `ivu-btn-*` class，方便理解樣式 selector 的目標。 |
| Component style | `src/styles/components/button.less` | 看 `ivu-btn`、`ivu-btn-group`、`ivu-btn-group-vertical` 等樣式入口。 |
| Button style mixin | `src/styles/mixins/button.less` | 看 `.btn()`、`.btn-circle()`、`.btn-group()`、`.btn-group-vertical()` 等底層樣式規則。 |
| Official example | `examples/routers/button.vue` | 看官方如何展示 group、size、shape、vertical、disabled、icon group 等場景。 |
| Type declaration | `types/button.d.ts` | 回頭確認 `ButtonGroup` public props 與 runtime props 是否一致。 |

本章的主線是 `button-group.vue`、`button.less`、`styles/mixins/button.less` 三者的對照。`button.vue` 和 `examples/routers/button.vue` 則用來輔助驗證：前者告訴你子按鈕會長出哪些 class，後者告訴你官方預期使用者怎麼組合它們。

---

## 4. ButtonGroup runtime：薄元件的基本形狀

`button-group.vue` 的 template 非常簡單：

```vue
<div :class="classes">
    <slot></slot>
</div>
```

這段 template 表示 `ButtonGroup` 只做兩件事：

1. 輸出一個父層容器 `div`。
2. 把使用者傳入的內容放進 default slot。

它沒有 methods，沒有 emits，也沒有 provide/inject。這代表它不會主動處理點擊事件，不會監聽子按鈕狀態，也不會把某些資料注入給子元件。

它的核心 computed 是 `classes`：

```js
classes () {
    return [
        'ivu-btn-group',
        {
            [`ivu-btn-group-${this.size}`]: !!this.size,
            [`ivu-btn-group-${this.shape}`]: !!this.shape,
            'ivu-btn-group-vertical': this.vertical
        }
    ];
}
```

這段程式碼透露了 `ButtonGroup` runtime 的本質：它的責任不是直接改變子 `Button`，而是把自己的 props 翻譯成 group class。真正的視覺效果要等到 less 讀到這些 class 後才會發生。

因此，閱讀 `ButtonGroup` 時不要問：

> 它在哪裡把 size 傳給子 Button？

而要問：

> 它產生了哪些 class？這些 class 在 less 裡被誰使用？

這個問題轉換非常重要，因為它會決定你接下來要讀 runtime 還是 style source。

---

## 5. Props 到 group class 的映射

`ButtonGroup` 的 props 主要是 `size`、`shape`、`vertical`。這些 props 都不會直接改寫子元件，而是轉成父層 class。

| 使用方式 | 產生的主要 class | 說明 |
| --- | --- | --- |
| `<ButtonGroup>` | `ivu-btn-group ivu-btn-group-default` | 基本群組。由於 `size` 通常會有 default 值，因此會出現 default group class。 |
| `<ButtonGroup size="small">` | `ivu-btn-group-small` | 建立 small group 樣式上下文，讓內部按鈕使用小尺寸規則。 |
| `<ButtonGroup size="large">` | `ivu-btn-group-large` | 建立 large group 樣式上下文，讓內部按鈕使用大尺寸規則。 |
| `<ButtonGroup shape="circle">` | `ivu-btn-group-circle` | 建立 circle group 樣式上下文，讓首尾按鈕呈現群組化的圓角效果。 |
| `<ButtonGroup vertical>` | `ivu-btn-group-vertical` | 切換成縱向群組，套用垂直排列、邊框合併與上下圓角規則。 |

這裡要特別注意 `Button` 和 `ButtonGroup` 在 default size class 上的差異。

`Button` 自己在 `size === 'default'` 時，不會輸出 `ivu-btn-default` 作為尺寸 class；`ivu-btn-default` 其實是 `type="default"` 的 type class，而不是 size class。

但 `ButtonGroup` 的 class mapping 是：

```js
[`ivu-btn-group-${this.size}`]: !!this.size
```

只要 `this.size` 有值，就會產生 `ivu-btn-group-${size}`。如果 default function 讓 `size` 成為 `'default'`，就會出現 `ivu-btn-group-default`。

這代表兩者的 class 策略不同：

| 元件 | default size 時的 class 策略 |
| --- | --- |
| `Button` | 不輸出 `ivu-btn-default` 作為尺寸 class。 |
| `ButtonGroup` | 可能輸出 `ivu-btn-group-default` 作為 group size class。 |

這種差異提醒我們：不要看到 class 名稱就直接套用另一個元件的規則。每個元件的 class mapping 都要回到自己的 computed 或 render 邏輯確認。

---

## 6. Group 不傳 props，而是讓樣式接手

假設使用者寫：

```vue
<ButtonGroup size="large">
    <Button>Left</Button>
    <Button>Right</Button>
</ButtonGroup>
```

從 runtime 角度看，`ButtonGroup` 只會輸出類似這樣的父層結構：

```html
<div class="ivu-btn-group ivu-btn-group-large">
    <!-- 子 Button 的 DOM output -->
</div>
```

它不會把 `size="large"` 自動傳給每一個子 `Button`。真正讓子按鈕在視覺上變大的，是 less 中針對父層 group class 的子代選擇器，例如概念規則：

```less
&-large {
    & > .@{btnClassName} {
        .button-size(@btn-height-large; @btn-padding-large; @btn-font-size-large; @btn-border-radius);
    }
}
```

這段規則的意思是：

```txt
當父層是 large group
  -> 找到直接子層的 button class
  -> 對子 button 套用 large size 樣式
```

因此整個流程可以整理成：

```txt
<ButtonGroup size="large">
  -> ButtonGroup classes computed
  -> ivu-btn-group-large
  -> less selector: .ivu-btn-group-large > .ivu-btn
  -> 子 Button 視覺尺寸被改變
```

這是一種「樣式層面的上下文影響」，不是「runtime props 傳遞」。

### 6.1 子 Button 自己的 size 與 group size 可以同時存在

官方 example 中可能會看到類似這種寫法：

```vue
<ButtonGroup :size="buttonSize">
    <Button :size="buttonSize">Left</Button>
    <Button :size="buttonSize">Right</Button>
</ButtonGroup>
```

閱讀時要分清楚兩件事：

| 來源 | 產生效果 |
| --- | --- |
| 子 `Button` 自己的 `size` prop | 子元件 runtime 會產生自己的 `ivu-btn-small` 或 `ivu-btn-large` class。 |
| 父 `ButtonGroup` 的 `size` prop | 父層產生 `ivu-btn-group-small` 或 `ivu-btn-group-large`，再由 less selector 影響子按鈕。 |

兩者可能同時存在。這不代表 `ButtonGroup` 有把 prop 傳下去，而是官方 example 可能同時讓父層與子層都明確接收同一個 size 變數，以確保視覺一致或示範不同 API。

---

## 7. 橫向 ButtonGroup：排列、邊框合併與圓角修正

預設情況下，`ButtonGroup` 是橫向排列。橫向 group 的核心樣式來自 `styles/mixins/button.less` 中的 `.btn-group(@btnClassName)`。

### 7.1 子按鈕 float left

橫向 group 會讓直接子層的 `.ivu-btn` 進入水平排列，例如規則概念：

```less
> .@{btnClassName} {
    position: relative;
    float: left;
}
```

這表示 group 內的按鈕會一個接一個往左排列。這裡不是透過 Vue runtime 重新排序，也不是透過 JavaScript 計算位置，而是純粹交給 CSS layout 處理。

### 7.2 相鄰按鈕使用負 margin 合併邊框

如果每個按鈕都有自己的 border，兩個按鈕並排時，中間會出現兩條邊框，看起來會比外側邊框更粗。

為了讓群組按鈕看起來像一個連續控制組，樣式會對相鄰按鈕使用：

```less
.@{btnClassName} + .@{btnClassName} {
    margin-left: -1px;
}
```

這個 `margin-left: -1px` 的作用，是讓後一個按鈕往左壓 1px，讓兩個相鄰 border 疊在一起，視覺上變成一條邊框。

可以把它理解成：

```txt
獨立按鈕排列：
[ Button ][ Button ]
中間可能有兩條 border

群組按鈕排列：
[ Button[Button ]
中間 border 被疊合成一條
```

這是 UI 元件庫中很常見的「border collapse」技巧。

### 7.3 中間按鈕不應該保留圓角

如果三個按鈕連在一起：

```vue
<ButtonGroup>
    <Button>Left</Button>
    <Button>Middle</Button>
    <Button>Right</Button>
</ButtonGroup>
```

視覺上通常希望左邊按鈕只有左側圓角，右邊按鈕只有右側圓角，中間按鈕沒有圓角。否則每個按鈕都保留完整圓角，就會看起來像三個獨立按鈕，而不是一組控制。

因此橫向 group 需要處理：

```txt
中間按鈕
  -> border-radius: 0

第一個按鈕且不是最後一個
  -> 右上 / 右下圓角歸零

最後一個按鈕且不是第一個
  -> 左上 / 左下圓角歸零
```

這些規則通常會透過 CSS selector 判斷 `:first-child`、`:last-child`、`:not(:first-child)`、`:not(:last-child)` 之類的情境。

---

## 8. Vertical ButtonGroup：不是只改成 column

當使用者寫：

```vue
<ButtonGroup vertical>
    <Button>Top</Button>
    <Button>Middle</Button>
    <Button>Bottom</Button>
</ButtonGroup>
```

`ButtonGroup` 會產生：

```txt
ivu-btn-group-vertical
```

然後 `button.less` 會套用對應的 vertical group mixin：

```less
&-group-vertical {
    .btn-group-vertical(@btn-prefix-cls);
}
```

直覺上，初學者可能會以為 vertical group 只是把排列方向從橫向改成縱向。但實際上，vertical group 需要處理的不只是排列方向，還包括寬度、浮動、相鄰邊框與上下圓角。

### 8.1 子按鈕改成 block 排列

vertical group 的子按鈕會套用類似：

```less
> .@{btnClassName} {
    display: block;
    width: 100%;
    max-width: 100%;
    float: none;
}
```

這裡有幾個重點：

| 規則 | 意義 |
| --- | --- |
| `display: block` | 讓每個按鈕獨占一行，形成上下排列。 |
| `width: 100%` | 讓子按鈕填滿 group 寬度。 |
| `max-width: 100%` | 避免按鈕超出父容器。 |
| `float: none` | 取消橫向 group 中的 float left 行為。 |

也就是說，vertical group 不是在原本橫向排列上「多加一個方向」，而是要覆蓋橫向 group 的 layout 行為。

### 8.2 相鄰按鈕改用 margin-top 合併上下邊框

橫向 group 用 `margin-left: -1px` 合併左右邊框。縱向 group 則改成：

```less
margin-top: -1px;
margin-left: 0px;
```

這表示相鄰按鈕會在垂直方向疊合 border，而不是水平方向。

可以整理成：

| group 類型 | 邊框合併方向 | 代表規則 |
| --- | --- | --- |
| 橫向 group | 左右邊框合併 | `margin-left: -1px` |
| 縱向 group | 上下邊框合併 | `margin-top: -1px` |

### 8.3 圓角邏輯從左右關係改成上下關係

橫向 group 的首尾是「左邊第一個」與「右邊最後一個」；縱向 group 的首尾則變成「上方第一個」與「下方最後一個」。

因此圓角處理會從左右圓角轉成上下圓角：

```txt
第一個按鈕
  -> 底部圓角歸零

最後一個按鈕
  -> 頂部圓角歸零
```

這也是為什麼不能只用 `flex-direction: column` 來理解 vertical group。因為 `vertical` 的真正工作包含：

1. 改變排列。
2. 改變寬度。
3. 取消 float。
4. 改變 margin 合併方向。
5. 改變圓角修正方向。

---

## 9. shape="circle"：群組圓角不是單顆按鈕圓角

`Button` 自己的 `shape="circle"` 會讓單顆按鈕具有圓形或圓角外觀。但 `ButtonGroup shape="circle"` 的意義不同：它不是把每一顆子按鈕都變成獨立圓角按鈕，而是讓整組按鈕在視覺上呈現「首尾圓角、中間連接」的效果。

例如：

```vue
<ButtonGroup shape="circle">
    <Button>Left</Button>
    <Button>Middle</Button>
    <Button>Right</Button>
</ButtonGroup>
```

你應該期待的是：

```txt
整組外框像一個圓角控制組
  -> 左側第一顆保留左側圓角
  -> 中間按鈕不保留獨立圓角
  -> 右側最後一顆保留右側圓角
```

這也是為什麼 `ButtonGroup` 的 `shape` 不能只從 `button-group.vue` 看出效果。`button-group.vue` 只會產生 `ivu-btn-group-circle`，真正的首尾圓角修正仍然要回到 less 的 group mixin 與相關 selector。

當你看到 `ivu-btn-group-circle` 時，要去追 `button.less` 或 `styles/mixins/button.less` 中和 group circle 有關的規則，而不是期待 runtime 有特殊邏輯。

---

## 10. Primary button 在 group 中的特殊邊框

群組按鈕不只要處理「一般 button」的邊框合併，也要處理不同 `type` 的視覺狀態。`button.less` 對 `ivu-btn-primary` 在 group 裡有額外處理。

橫向 group 中，primary button 的相鄰邊框會使用：

```less
@btn-group-border
```

而 disabled 時會回到：

```less
@btn-default-border
```

這個設計的目的，是避免多個 primary button 連在一起時，中間邊框與背景色混在一起，造成視覺斷裂或邊界不清楚。

可以這樣理解：

| 情境 | 樣式問題 | 需要的處理 |
| --- | --- | --- |
| 多個 default button 相鄰 | 中間 border 可能變粗 | 用負 margin 合併 border。 |
| 多個 primary button 相鄰 | 背景色與 border 顏色接近，邊界可能不清楚 | 使用 group 專用 border 顏色。 |
| primary button disabled | disabled 視覺應回到較中性的邊框 | 使用 default border 或 disabled 對應邊框。 |

這說明 group 樣式不能只看 `.ivu-btn-group`。你還需要看 `.ivu-btn-primary` 或其他 type-specific selector 裡是否有針對 group 的補充規則。

閱讀 UI 元件庫樣式時，常見的陷阱是只看父層 selector，卻忽略 type class 中嵌入的 group 修正。這會導致你以為 group 樣式只處理排列，實際上它還會處理不同 type 在群組中的視覺一致性。

---

## 11. Button 本身的 style 規則也會影響 group 理解

雖然本章主角是 `ButtonGroup`，但 group 的最終效果仍然建立在子 `Button` 的樣式基礎上。因此閱讀 group 時，也應順手觀察幾個 `Button` 樣式規則。

| 規則 | 來源 | 閱讀重點 |
| --- | --- | --- |
| `& > .ivu-icon + span` / `& > span + .ivu-icon` | `button.less` | 控制 icon 和文字之間的距離。這會影響 icon group 或帶 icon 的 group button。 |
| `&&-loading` | `button.less` | loading button 會有 overlay 與 `pointer-events: none`，在 group 中仍要維持正確狀態。 |
| `&-long` | `button.less` | 讓按鈕寬度變成 `100%`，和 vertical group 的寬度規則可能同時需要理解。 |
| `&-ghost` | `button.less` | ghost 狀態會影響背景與 hover，group 中不同 type 的 ghost 需要回到樣式確認。 |
| `a.ivu-btn` | `button.less` | link button 使用 `<a>` 時需要 line-height 微調，group 中也可能出現 anchor button。 |
| `.btn()` | `styles/mixins/button.less` | 提供 button base、disabled、size、icon-only 等共用規則。 |
| `.btn-circle()` | `styles/mixins/button.less` | 處理 circle 與 icon-only circle 的尺寸與圓角。 |

這些規則說明一個關鍵觀念：`Button` 的最終視覺不是由單一 class 決定，而是多層 class 疊加後的結果。

可以把它想成：

```txt
base class
  -> ivu-btn

type class
  -> ivu-btn-primary / ivu-btn-default / ivu-btn-dashed ...

state class
  -> ivu-btn-loading / ivu-btn-ghost / ivu-btn-long / ivu-btn-icon-only

group parent class
  -> ivu-btn-group / ivu-btn-group-large / ivu-btn-group-vertical
```

當你看到某個按鈕在 group 裡的視覺結果時，要學會回推它可能同時受到哪些 class 影響。

---

## 12. 官方 example 的閱讀價值

`examples/routers/button.vue` 不只是示範給使用者看的文件頁，它也很適合拿來反推元件設計意圖。

官方 example 中的 group 場景大致包含：

| 場景 | 觀察重點 |
| --- | --- |
| 基本 group | 多個 button 是否被視覺上連成一組。 |
| disabled group | disabled button 在 group 中是否仍維持邊框一致。 |
| icon group | icon-only button 在 group 中的方形尺寸與間距。 |
| `shape="circle"` | group circle class 如何影響首尾按鈕圓角。 |
| `size="large"` / `size="small"` | group size class 如何影響子按鈕視覺尺寸。 |
| `vertical` | 子按鈕如何由橫向連接改成縱向堆疊。 |

閱讀 example 時，不要只停在「這樣可以用」。你可以用以下問題反推 source：

1. 這個 example 傳了哪些 props？
2. 這些 props 在 `button-group.vue` 中會變成哪些 class？
3. 這些 class 在 `button.less` 或 `styles/mixins/button.less` 中由哪些 selector 接住？
4. 子 `Button` 自己是否也產生了其他 class？
5. 最終視覺效果是父層 class、子層 class 還是兩者共同造成的？

這種讀法能讓 example 成為驗證 source map 的工具，而不是單純的展示頁。

---

## 13. 常見誤區與正確理解

| 誤區 | 正確理解 |
| --- | --- |
| `ButtonGroup` 會把 `size` prop 傳給子 `Button` | runtime 沒有傳 props，主要由 group class 和 less parent-child selector 生效。 |
| `ButtonGroup` 需要知道裡面有幾個 `Button` | runtime 不計算子按鈕數量，首尾與中間狀態主要由 CSS selector 判斷。 |
| `vertical` 只是改成直向排列 | vertical 還會處理 `display`、`width`、`float`、margin、上下圓角與邊框合併。 |
| group 樣式主要在 `button-group.vue` 裡 | `button-group.vue` 只產生 class，主要樣式邏輯在 `button.less` 與 `styles/mixins/button.less`。 |
| 只看 `.ivu-btn-group` 就能理解全部 group 樣式 | 還要看 `.ivu-btn-primary` 等 type-specific selector 中對 group 的特殊修正。 |
| `ButtonGroup shape="circle"` 等於每個子按鈕都是獨立 circle button | group circle 更偏向整組外框與首尾圓角處理，中間按鈕仍需要被連接。 |
| 子 `Button` 的 `size` 和父 `ButtonGroup` 的 `size` 是同一件事 | 子 size 是子元件 class；group size 是父層 class 透過 selector 影響子元素。 |

---

## 14. 建議閱讀路線

第一次閱讀 `ButtonGroup` 與樣式系統時，建議按照以下順序。

### 14.1 第一步：先讀 `button-group.vue`

先確認 `ButtonGroup` runtime 很薄。你要看的是：

1. template 是否只是包一層 `div`。
2. props 有哪些。
3. `classes` computed 如何產生 `ivu-btn-group-*`。
4. 是否有 methods、emits、provide/inject。

讀完後，你要得到第一個結論：

> `ButtonGroup` 的 runtime 只負責產生父層樣式上下文。

### 14.2 第二步：回頭看子 `Button` 會產生哪些 class

接著回到 `button.vue` 的 `classes` computed，確認子 `Button` 會產生：

```txt
ivu-btn
ivu-btn-default / ivu-btn-primary / ...
ivu-btn-small / ivu-btn-large
ivu-btn-circle
ivu-btn-loading
ivu-btn-icon-only
ivu-btn-ghost
```

這一步是為了讓你知道 less 中的 selector 到底會命中什麼。

### 14.3 第三步：讀 `button.less` 的 group 入口

在 `button.less` 中找：

```less
&-group
&-group-vertical
```

確認這些入口如何呼叫 mixin，例如 `.btn-group()` 或 `.btn-group-vertical()`。

這一步的重點不是背所有 selector，而是找出：

1. 橫向 group 入口。
2. 縱向 group 入口。
3. size / shape / type-specific 規則在哪裡接上。

### 14.4 第四步：讀 `styles/mixins/button.less`

接著讀底層 mixin：

```txt
.btn()
.btn-circle()
.btn-group()
.btn-group-vertical()
```

這一步要理解：

1. 子按鈕如何排列。
2. 相鄰邊框如何合併。
3. 首尾圓角如何修正。
4. vertical group 如何覆蓋橫向 group 行為。
5. primary button group 邊框是否有特殊處理。

### 14.5 第五步：用官方 example 驗證

最後打開 `examples/routers/button.vue`，找出 group 相關 example，用瀏覽器或心智模型對照：

```txt
example props
  -> runtime class
  -> less selector
  -> visual output
```

這樣你就能把「使用方式」、「runtime output」與「style result」串成完整鏈路。

---

## 15. 資訊不足與後續確認

這份筆記目前沒有逐行展開完整 less source，因此以下細節建議後續在閱讀原始碼時再補充：

1. `.btn-group(@btnClassName)` 的完整 selector 結構。
2. `.btn-group-vertical(@btnClassName)` 的完整 selector 結構。
3. `ivu-btn-group-circle` 對首尾按鈕的完整圓角處理規則。
4. primary button 在 group 中的完整 border selector。
5. disabled、ghost、primary、icon-only 同時出現在 group 中時，最後套用順序與 selector specificity。
6. vertical group 和 `long` button 同時出現時的寬度細節。

這些內容不應在沒有對照完整 source 的情況下硬補。後續可以把這一章再拆出一篇「Button Less Selector Deep Dive」，專門逐段分析 less selector。

---

## 16. 本章總結

`ButtonGroup` 是典型的「runtime 很薄、style 很重」的元件。它本身不主動管理子 `Button`，不傳遞 props，不計算子元素數量，也不處理 click 或狀態同步。它的核心任務是根據 `size`、`shape`、`vertical` 產生父層 group class。

真正讓一組按鈕看起來像「群組控制」的，是 `button.less` 與 `styles/mixins/button.less` 中的樣式規則。這些規則透過父子 selector 影響子 `Button` 的尺寸、排列、邊框合併與圓角。橫向 group 用 `float: left` 與 `margin-left: -1px` 合併左右邊框；縱向 group 則改用 block 排列、`width: 100%` 與 `margin-top: -1px` 合併上下邊框。

理解這一章後，你會更清楚 UI 元件庫的閱讀方式：不是所有行為都在 Vue component 裡。對像 `ButtonGroup` 這種視覺型容器元件來說，runtime 只是產生 class，真正的設計重點往往在 style system。

---

## 17. 自我檢查問題

1. 為什麼說 `ButtonGroup` 是「runtime 很薄、style 很重」的元件？
2. `ButtonGroup` 的 template 做了哪些事？
3. `ButtonGroup` 有沒有使用 provide/inject 把 `size` 傳給子 `Button`？
4. `ButtonGroup.size` 最後如何影響子按鈕的視覺尺寸？
5. 為什麼 `ButtonGroup` 的 `size="default"` 可能會產生 `ivu-btn-group-default`，但 `Button` 的 default size 不會產生 `ivu-btn-default` 作為尺寸 class？
6. 橫向 group 為什麼需要 `margin-left: -1px`？
7. group 中的中間按鈕為什麼不應該保留完整圓角？
8. vertical group 為什麼不是單純把排列方向改成 column？
9. vertical group 中為什麼要把子按鈕設成 `display: block` 與 `width: 100%`？
10. primary button 在 group 中為什麼需要特殊邊框規則？
11. 官方 example 如何幫助你反推 runtime class 與 style selector？
12. 如果只看 `button-group.vue`，會漏掉哪些重要資訊？

---

## 18. 後續延伸方向

這份筆記後續可以拆成幾個更深入的主題。

### 18.1 Button Less Selector Deep Dive

逐段閱讀 `button.less` 與 `styles/mixins/button.less`，把 `.btn()`、`.btn-circle()`、`.btn-group()`、`.btn-group-vertical()` 的 selector 展開，建立完整 selector map。

### 18.2 UI 元件庫中的 CSS Context Pattern

整理 `ButtonGroup` 這類「父層 class 影響子層視覺」的設計模式，並和 provide/inject、props drilling、CSS variables 等做比較。

### 18.3 Group 元件的可維護性設計

比較不同群組元件的設計方式，例如：

1. 純樣式型 group。
2. provide/inject 型 group。
3. slot inspection 型 group。
4. compound component 型 group。

進一步理解什麼情境適合使用 `ButtonGroup` 這種輕量設計，什麼情境需要更強的 runtime 狀態管理。

### 18.4 ButtonGroup 與 Accessibility

後續可以補一篇無障礙閱讀筆記，檢查 `ButtonGroup` 是否需要補充 ARIA role、keyboard navigation、disabled anchor 的語意差異等。