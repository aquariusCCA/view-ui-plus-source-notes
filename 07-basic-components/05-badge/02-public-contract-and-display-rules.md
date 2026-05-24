# Badge Public Contract And Display Rules：從 Props 到顯示優先序

## 1. 本章定位

本章是一篇 **Public API 與顯示規則對照筆記**，用來理解 `Badge` 對外開放哪些輸入，以及這些輸入如何在 runtime 中轉換成實際畫面。

在 View UI Plus 的 `Badge` 元件中，使用者看見的是「角標」、「小紅點」或「狀態點」。但從原始碼閱讀角度來看，這三種畫面不是單純靠 CSS 切換，而是由 template 先分成三條互斥路線：

```txt
1. dot branch
2. status / color branch
3. count branch
```

因此本章的核心問題不是「Badge 長什麼樣子」，而是：

1. 哪些 props 屬於元件的 public contract？
2. 哪些 props 只是改內容，哪些 props 會直接改變 template branch？
3. `#count` 和 `#text` 的覆蓋層級有什麼不同？
4. `finalCount`、`badge`、`hasCount` 各自負責哪一段顯示邏輯？
5. 為什麼 `dot`、`status`、`color`、`type` 不能用直覺疊加理解？

本章不深入展開 `badge.less` 的定位、尺寸、顏色、動畫與 selector 細節。這些內容應放到後續的 `03-class-style-and-position.md` 處理。本章只會在必要時說明某個 runtime class 或 inline style 的用途，避免把 public contract 筆記寫成 CSS 實作筆記。

## 2. Public Contract 的閱讀方式

閱讀元件庫原始碼時，`props` 與 `slots` 代表元件對使用者開放的「可控制入口」。這些入口共同形成 public contract，也就是元件允許外部使用者用哪些方式改變元件行為與畫面。

對 `Badge` 來說，public contract 可以分成兩層。

第一層是 **TypeScript declaration** 所描述的 public API。這層讓使用者在型別系統中知道可以傳入哪些 props，例如 `count`、`dot`、`overflow-count`、`show-zero`、`status`、`text`、`offset`、`color`，也能知道有哪些 slots，例如 `count` 與 `text`。

第二層是 **runtime implementation** 真正執行的顯示邏輯。即使 `.d.ts` 告訴你 `dot`、`status`、`color` 都是可用 props，也不代表它們會同時生效。實際畫面仍要回到 `badge.vue` 的 template branch 與 computed rules 判斷。

這也是本章最重要的閱讀原則：

```txt
.d.ts 告訴你可以怎麼用，badge.vue 告訴你實際怎麼生效。
```

如果只看型別檔，容易以為所有 props 都能疊加；如果只看 template，又可能漏掉某些 public API 的命名與使用語意。因此本章會把 runtime props、type declaration、template branch、slot override 與 computed 顯示條件放在同一套閱讀框架中。

## 3. Runtime Props 與 Type Declaration 對照

`Badge` 的 props 都屬於展示輸入。它們不負責事件處理，也不會建立元件內部互動狀態。換句話說，`Badge` 不像 `Input` 或 `Select` 那樣需要處理使用者輸入、同步 value 或 emit change event；它主要接收外部狀態，然後把狀態轉成畫面。

下表整理 `badge.vue` 中的 runtime props，以及它們在 type declaration 中對應的 public API 名稱。

| Runtime prop | Runtime 限制 / default | Type declaration | 主要責任 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| `count` | `Number` | `count?: number` | 提供一般數字角標內容 | `0` 預設不顯示，需要搭配 `showZero` 才顯示。 |
| `dot` | `Boolean`，預設 `false` | `dot?: boolean` | 啟用 dot branch | 一旦為 `true`，會優先進入 dot branch，不顯示數字。 |
| `overflowCount` | `Number` 或 `String`，預設 `99` | `'overflow-count'?: number \| string` | 控制數字封頂顯示 | `count >= overflowCount` 時顯示 `${overflowCount}+`。 |
| `className` | `String` | `'class-name'?: string` | 自訂一般角標 class | 只作用於一般 count / custom count 的 `sup`，dot branch 不使用。 |
| `showZero` | `Boolean`，預設 `false` | `'show-zero'?: boolean` | 控制 `count=0` 是否顯示 | 會影響 `hasCount` 與 `badge` 的結果。 |
| `text` | `String`，預設 `''` | `text?: string` | 提供文字內容 | 在一般 count branch 會覆蓋 `finalCount`，在 status branch 作為狀態文字。 |
| `status` | `success`、`processing`、`default`、`error`、`warning` | status union | 啟用 status branch | 顯示 inline 狀態點，不是右上角角標。 |
| `type` | `success`、`primary`、`normal`、`error`、`warning`、`info` | type union | 修飾一般 count badge 顏色 | 只影響一般 count branch 的 `countClasses`。 |
| `offset` | `Array` | `offset?: any[]` | 調整角標偏移 | 長度為 2 時轉成 `margin-top` / `margin-right`。 |
| `color` | `String` | `color?: string` | 啟用 status branch 並指定狀態點顏色 | 不是一般 count badge 的背景色設定。 |

這張表的學習價值不只是記住 API，而是看出 props 之間的層級差異。`dot`、`status`、`color` 會改變 template branch，因此它們屬於「模式選擇」；`count`、`overflowCount`、`showZero`、`text` 主要控制內容與可見性；`type`、`className`、`offset` 則是樣式修飾。

## 4. Props 分組：先分清楚它們負責哪一類問題

直接背 `Badge` 的 props 很容易混淆，因為有些 prop 會決定顯示模式，有些只決定內容，有些只在特定 branch 中有效。比較好的閱讀方式，是先把 props 分成四組。

| 分組 | Props / Slots | 解決的問題 | 是否改變 branch |
| --- | --- | --- | --- |
| 模式選擇 | `dot`、`status`、`color` | 決定元件要顯示小紅點、狀態點，還是一般 count badge | 是 |
| 內容輸入 | `count`、`overflowCount`、`showZero`、`text` | 決定角標內容、封頂顯示與 `0` 是否顯示 | 通常否，但會影響是否渲染 / 顯示 |
| 樣式修飾 | `type`、`className`、`offset` | 調整一般角標顏色、class 與位置 | 否，只在特定 branch 有效 |
| Slot override | `#count`、`#text`、default slot | 覆蓋角標內容，或提供被角標附著的元素 | `#count` 會改變 count branch 內部路線 |

這個分組可以轉成一個固定閱讀口訣：

```txt
先看模式，再看內容，再看覆蓋，最後才看樣式。
```

例如看到以下用法：

```vue
<Badge :count="100" type="primary" color="blue">
    <a href="#">Message</a>
</Badge>
```

直覺上可能會以為它會顯示一個藍色或 primary 的數字角標。但依照本章規則，`color="blue"` 會讓元件進入 `status || color` branch，而 status branch 不渲染 default slot，也不會使用一般 count badge 的 `type` 顏色。因此真正要先問的是：目前是哪一個 branch 生效？不是每個 prop 是否都被套用。

## 5. Template Branch 優先序

`Badge` 的 template 是本章的核心。因為它決定了 props 之間不是自由疊加，而是先經過三段互斥分支。

template 結構如下：

```vue
<span v-if="dot" :class="classes" ref="badge">
    <slot></slot>
    <sup :class="dotClasses" :style="styles" v-show="badge"></sup>
</span>
<span v-else-if="status || color" :class="classes" class="ivu-badge-status" ref="badge">
    <span :class="statusClasses" :style="statusStyles"></span>
    <span class="ivu-badge-status-text"><slot name="text">{{ text }}</slot></span>
</span>
<span v-else :class="classes" ref="badge">
    <slot></slot>
    <sup v-if="$slots.count" :style="styles" :class="customCountClasses"><slot name="count"></slot></sup>
    <sup v-else-if="hasCount" :style="styles" :class="countClasses" v-show="badge"><slot name="text">{{ finalCount }}</slot></sup>
</span>
```

這段 template 可以簡化成以下優先序：

```txt
dot === true
  -> dot branch
else if status || color
  -> status branch
else
  -> count branch
```

這代表 `Badge` 的三種主要模式是互斥的。

### 5.1 `dot` branch：最高優先序

當 `dot` 為 `true` 時，元件直接進入第一個 branch。此時 status 與 color 不會再被拿來決定 status branch，數字型 count badge 也不會渲染。

dot branch 的重點是「顯示一個小點」，而不是顯示數字。它仍然保留 default slot，讓小點可以附著在某個子元素上，例如連結、按鈕、圖示或文字。

需要注意的是，dot branch 中的 dot 是否顯示，仍會交給 `badge` computed 搭配 `v-show` 判斷。因此 `dot` 代表進入 dot 模式，不代表小點在所有情境下一定可見。若 `dot` 搭配 `count=0`，dot 節點會存在，但會被 `v-show` 隱藏。

### 5.2 `status || color` branch：第二優先序

如果沒有進入 dot branch，但 `status` 或 `color` 有值，就會進入 status branch。這個 branch 代表的是「inline 狀態點」，不是包住 default slot 的右上角角標。

這裡最容易誤解的是 `color`。從 props 名稱看，`color` 很像是在設定一般 badge 的背景色，但在 runtime branch 中，只要 `color` 有值，就會進入 status branch。因此 `color` 的實際語意更接近「指定 status dot 顏色」。

### 5.3 count branch：預設路線

只有在沒有 `dot`、也沒有 `status` 或 `color` 時，才會進入一般 count branch。這條路線才會處理一般右上角數字角標、`#count`、`#text`、`finalCount`、`hasCount`、`countClasses` 等規則。

換句話說，當你想分析 `count`、`overflowCount`、`showZero`、`type`、`className` 是否生效時，前提通常是元件真的走到 count branch。

### 5.4 常見組合判斷表

| 使用組合 | 實際 branch | 結果說明 |
| --- | --- | --- |
| `dot status="success"` | dot branch | `dot` 優先，`status` 不會進入 status branch。 |
| `dot color="blue"` | dot branch | `dot` 優先，`color` 不會用來建立 status dot。 |
| `color="blue"` 且沒有 `dot` | status branch | 進入 status branch，不是一般 count badge 改背景色。 |
| `status="success"` 且有 default slot | status branch | status branch 不渲染 default slot。 |
| `type="primary"` 且沒有 `dot/status/color` | count branch | `type` 會作用於一般 count badge。 |
| 沒有 `dot/status/color` | count branch | 才會進入一般數字角標與 slot override 規則。 |

這一段是閱讀 `Badge` 的第一個關鍵：**先判斷 branch，再談其他 props 是否有效。**

## 6. Count Branch：一般角標與 Slot Override

當元件進入 count branch 後，內部還有一層 slot 優先序。

```txt
有 #count
  -> 渲染 custom count sup，數值 count 無效
沒有 #count，但 hasCount
  -> 渲染一般 count sup，內容可由 #text 覆蓋
其他
  -> 不渲染角標 sup
```

這代表 count branch 不是只看 `count`。如果使用者提供 `#count`，runtime 會優先渲染 custom count 的 `sup`，而不再根據 numeric `count` 決定內容。

### 6.1 `#count`：覆蓋整個角標本體

`#count` 的覆蓋層級最高。它不是單純替換文字，而是把整個角標內容交給使用者自訂。

```vue
<Badge>
    <template #count>
        <Icon type="md-time" size="16" color="#ff6600" />
    </template>
    <a href="#" class="demo-badge"></a>
</Badge>
```

這種寫法會進入 custom count 路線，使用 `customCountClasses`，這類 custom count 樣式會取消一般角標的背景、邊框與陰影，讓使用者自訂的圖示或內容可以自己決定視覺效果。

### 6.2 `#text`：只覆蓋一般 count 文字

`#text` 的覆蓋層級低於 `#count`。它不會取代整個 `sup`，而是替換一般 count badge 裡面的文字內容。

```vue
<Badge :count="count">
    <a href="#" class="demo-badge"></a>
    <template #text>
        <span>hhh</span>
    </template>
</Badge>
```

這種寫法仍然渲染一般 `ivu-badge-count`，也就是保留一般 count badge 的外觀、定位與 class，只是內容不再使用 `finalCount` 的結果，而是使用 `#text` slot 提供的內容。

### 6.3 `#count` 與 `#text` 的差異

| 比較項目 | `#count` | `#text` |
| --- | --- | --- |
| 覆蓋範圍 | 覆蓋整個角標內容 | 只覆蓋角標內文字 |
| 是否仍使用 numeric `count` | 否 | 通常仍需要 `hasCount` 成立，內容可被 slot 覆蓋 |
| class 路線 | `customCountClasses` | `countClasses` |
| 視覺結果 | 自訂內容主導，原本背景、邊框、陰影會被取消 | 保留一般 count badge 外觀 |
| 適合情境 | 放 Icon、自訂標記、特殊內容 | 顯示 `new`、`hot`、自訂文字或格式化文字 |

這一段是閱讀 `Badge` 的第二個關鍵：**`#count` 是整體覆蓋，`#text` 是內容覆蓋。**

## 7. `finalCount`：一般 count 內容的計算規則

`finalCount` 只在一般 count branch 中有意義。它負責決定「當沒有用 `#text` 覆蓋時，角標裡應該顯示什麼文字」。

computed 如下：

```js
finalCount () {
    if (this.text !== '') return this.text;
    return parseInt(this.count) >= parseInt(this.overflowCount) ? `${this.overflowCount}+` : this.count;
}
```

這段邏輯可以拆成兩步：

1. 如果 `text` 不是空字串，優先顯示 `text`。
2. 如果沒有 `text`，才比較 `count` 與 `overflowCount`，決定是否顯示封頂數字。

| 輸入 | 判斷過程 | `finalCount` |
| --- | --- | --- |
| `text="new"` | `text !== ''` 成立 | `new` |
| `count=5`、`overflowCount=99` | `5 >= 99` 不成立 | `5` |
| `count=99`、`overflowCount=99` | `99 >= 99` 成立 | `99+` |
| `count=100`、`overflowCount=99` | `100 >= 99` 成立 | `99+` |

這裡最值得注意的是比較條件使用 `>=`，不是 `>`。因此當 `count` 等於 `overflowCount` 時，就已經會顯示加號。例如 `count=99`、`overflowCount=99` 的結果是 `99+`。

從 API 設計角度看，`text` 的優先序高於 `count`。因此 `text` 不只是 status branch 的文字，也能在一般 count branch 中覆蓋數字顯示。

## 8. `hasCount` 與 `badge`：渲染節點與顯示節點的分工

`hasCount` 與 `badge` 是最容易混淆的兩個 computed。它們都和「角標是否出現」有關，但負責的層次不同。

簡單來說：

```txt
hasCount -> 是否建立一般 count sup 節點
badge    -> 已建立的角標是否透過 v-show 顯示
```

### 8.1 `hasCount`：決定一般 count branch 是否建立 `sup`

`hasCount` 如下：

```js
hasCount () {
    if (this.count || this.text !== '') return true;
    if (this.showZero && parseInt(this.count) === 0) return true;
    else return false;
}
```

它的工作是配合 template 中的 `v-else-if="hasCount"`，決定一般 count 的 `sup` 是否要被建立。

這代表如果 `count=0` 且沒有 `showZero`，`hasCount` 會是 `false`，一般 count 的 `sup` 連 DOM 節點都不會建立。相反地，如果 `count=0 showZero`，`hasCount` 會是 `true`，因此節點會被建立。

### 8.2 `badge`：決定角標是否透過 `v-show` 顯示

`badge` 如下：

```js
badge () {
    let status = false;

    if (this.count) {
        status = !(parseInt(this.count) === 0);
    }

    if (this.dot) {
        status = true;
        if (this.count !== null) {
            if (parseInt(this.count) === 0) {
                status = false;
            }
        }
    }

    if (this.text !== '') status = true;

    return status || this.showZero;
}
```

它的工作是配合 template 中的 `v-show="badge"`。也就是說，當某個 branch 已經建立角標節點後，`badge` 再決定它是否顯示。

這個分工在 dot branch 特別明顯。dot branch 的 `sup` 一定會被 template 建立，但它仍然受 `v-show="badge"` 控制。因此 `dot` 無 `count` 時會顯示 dot；但 `dot :count="0"` 時，`badge` 會變成 `false`，dot 節點存在但不顯示。

### 8.3 常見情境對照表

| 輸入 | `hasCount` | `badge` | 最終畫面 |
| --- | --- | --- | --- |
| 無 `count`、無 `text` | `false` | `false` | 不渲染一般 count `sup`。 |
| `count=0` | `false` | `false` | 不渲染一般 count `sup`。 |
| `count=0 showZero` | `true` | `true` | 渲染並顯示 `0`。 |
| `count=5` | `true` | `true` | 渲染並顯示 `5`。 |
| `text="hot"` | `true` | `true` | 渲染並顯示 `hot`。 |
| `dot` 且無 `count` | 不使用一般 count branch | `true` | 顯示 dot。 |
| `dot :count="0"` | 不使用一般 count branch | `false` | dot 節點存在，但被 `v-show` 隱藏。 |

這一段是閱讀 `Badge` 的第三個關鍵：**`hasCount` 處理 DOM 是否建立，`badge` 處理建立後是否顯示。**

## 9. Status Branch：`status`、`color` 與 `text` 的關係

status branch 由 `status || color` 啟用。它的 template 結構如下：

```vue
<span :class="classes" class="ivu-badge-status" ref="badge">
    <span :class="statusClasses" :style="statusStyles"></span>
    <span class="ivu-badge-status-text"><slot name="text">{{ text }}</slot></span>
</span>
```

這段 template 顯示出 status branch 的三個特性。

第一，status branch 不渲染 default slot。它不是「把狀態點附著在某個子元素右上角」，而是直接輸出一個 inline 狀態點與文字。因此如果你寫：

```vue
<Badge status="success">
    <a href="#">Message</a>
</Badge>
```

branch 規則，`status="success"` 會進入 status branch，而 status branch 沒有 `<slot></slot>`，所以 default slot 不會在這條路線中被渲染。

第二，status branch 的文字來自 `#text` 或 `text`。如果兩者都沒有，仍然會渲染 status dot，只是後面的 `.ivu-badge-status-text` 內容為空。

第三，`color` 在這裡是 status dot 的顏色來源，不是一般 count badge 的背景色設定。`statusClasses` 與 `statusStyles` 的分工如下：

```txt
status -> ivu-badge-status-{status}
內建 color -> ivu-badge-status-{color}
非內建 color -> { backgroundColor: this.color }
```

也就是說，內建色會走 class，自訂色則會透過 inline style 寫入 `backgroundColor`。

> 此處需要後續補充：本章只根據「內建色走 class，自訂色走 inline style」的結論；實際內建色清單、class 產生規則與動畫細節，應在 `03-class-style-and-position.md` 對照 `badge.less` 補完整。

## 10. Public Contract 的使用情境對照

理解 public contract 時，不只要看 API 表，也要知道每種 API 適合解決什麼使用情境。

| 使用情境 | 建議使用方式 | 原因 |
| --- | --- | --- |
| 顯示未讀數量 | `:count="unreadCount"` | 一般 count branch 會顯示右上角數字角標。 |
| 數量為 0 仍要顯示 | `:count="0" show-zero` | `showZero` 會讓 `hasCount` 與 `badge` 都成立。 |
| 超過上限顯示加號 | `:count="count" :overflow-count="99"` | `finalCount` 使用 `count >= overflowCount` 判斷。 |
| 只提示有新內容，不顯示數量 | `dot` | 進入 dot branch，只顯示小點。 |
| 要隱藏 dot | `dot :count="0"` | dot branch 仍建立節點，但 `badge` 會讓它隱藏。 |
| 顯示成功、錯誤、處理中狀態 | `status="success"` / `status="error"` / `status="processing"` | 進入 status branch，顯示 inline 狀態點。 |
| 自訂 status 文字 | `text="Success"` 或 `#text` | status branch 的文字插槽會優先使用 `#text`。 |
| 自訂整個角標內容 | `#count` | 會走 custom count，數值 count 不再主導內容。 |
| 只改一般角標內文字 | `#text` 或 `text` | 保留一般 count badge 外觀，只覆蓋內容。 |
| 調整一般 count badge 語意色 | `type="primary"` | `type` 只作用於 count branch。 |

這張表可以作為日後回查 API 時的入口。實作或除錯時，仍應回到 template branch 判斷目前是哪一條路線生效。

## 11. 常見誤區與正確理解

`Badge` 的 public contract 之所以值得單獨寫一章，是因為它的 props 名稱看起來直覺，但實際 runtime 優先序會改變很多結果。

| 常見誤區 | 正確理解 |
| --- | --- |
| `Badge` 是互動元件 | `Badge` 沒有 emits，也沒有 click handler；它主要負責展示外部狀態。 |
| `dot` 可以和 `status` 疊加 | `dot` 是第一個 template branch，會擋掉 status branch。 |
| `color` 是 count badge 的背景色 | `color` 會啟用 status branch，用來設定 status dot 顏色。 |
| `type` 能影響 status dot | `type` 只在一般 count branch 的 `countClasses` 中有意義。 |
| `text` 只是 status 文案 | `text` 在一般 count branch 也會優先於 `finalCount`。 |
| `#count` 只是改文字 | `#count` 會覆蓋整個角標內容，並使用 custom count 樣式。 |
| `overflowCount=99` 時只有大於 99 才加號 | source 使用 `>=`，所以 `count=99` 也會顯示 `99+`。 |
| `count=0` 會顯示 0 | 預設不顯示，必須搭配 `showZero`。 |
| status branch 可以包住 default slot | status branch 沒有渲染 default slot，它是 inline 狀態點加文字。 |

這些誤區的共同原因，都是把 props 當成彼此獨立的設定項，而沒有先看 template branch。

## 12. 建議閱讀路線

第一次閱讀 `Badge` 的 public contract 時，建議按照以下順序。

### 12.1 第一輪：先建立 API 地圖

先讀 `types/badge.d.ts`，理解元件對外公開哪些 props 與 slots。這一輪只需要知道使用者可以傳什麼，不需要急著理解每個 prop 的實際優先序。

閱讀重點：

1. props 名稱：`count`、`dot`、`overflow-count`、`show-zero`、`status`、`text`、`type`、`offset`、`color`。
2. slots 名稱：`count`、`text`。
3. kebab-case 與 camelCase 對應，例如 `overflow-count` 對應 runtime 的 `overflowCount`。

### 12.2 第二輪：回到 template 看 branch

接著讀 `badge.vue` template，先不要急著看 computed。這一輪只要抓住三段互斥分支：

```txt
dot -> status/color -> count
```

閱讀時可以直接問：

1. 目前使用者傳入的 props 會讓元件進入哪一段 branch？
2. 這段 branch 是否渲染 default slot？
3. 這段 branch 是否使用 `#count` 或 `#text`？
4. 這段 branch 是否會用到 `countClasses`、`statusClasses` 或 `styles`？

### 12.3 第三輪：再看 computed 顯示條件

確定 branch 後，再讀 computed。這時候 `finalCount`、`hasCount`、`badge` 的責任會比較清楚。

閱讀順序建議如下：

1. `finalCount`：一般 count branch 中要顯示什麼內容。
2. `hasCount`：一般 count branch 是否建立 `sup`。
3. `badge`：已建立的 dot 或 count 是否顯示。
4. `statusClasses` / `statusStyles`：status dot 使用 class 還是 inline style。
5. `countClasses` / `customCountClasses`：一般 count 與 custom count 的 class 差異。

### 12.4 第四輪：回官方 example 驗證

最後回到 `examples/routers/badge.vue`，用官方範例驗證規則。特別適合驗證以下情境：

1. `:count="0" showZero` 是否顯示 `0`。
2. `#count` 是否覆蓋 numeric count。
3. `#text` 是否只覆蓋一般 count 內文。
4. `dot` 是否只顯示小點。
5. `color="blue"` 是否進入 status 模式。
6. `type="primary"` 是否只作用於一般 count badge。

這樣的閱讀路線能避免直接陷入 CSS selector，也能避免只看 `.d.ts` 就誤判 props 疊加效果。

## 13. 本章總結

`Badge` 是一個很適合練習 public contract 閱讀的展示型元件。它的外觀看起來簡單，但內部規則並不是「所有 props 疊加後一起生效」，而是先由 template branch 決定模式，再由 slot 與 computed 決定內容、渲染與顯示。

本章最重要的三個優先序是：

1. `dot` 優先於 `status || color`。
2. `status || color` 優先於一般 count branch。
3. 在 count branch 中，`#count` 優先於一般 numeric count，`#text` 則只覆蓋一般 count 的文字內容。

本章也要記住 `finalCount`、`hasCount`、`badge` 的分工：`finalCount` 負責算顯示內容，`hasCount` 負責一般 count `sup` 是否建立，`badge` 負責已建立的角標是否顯示。這三者合起來，才構成 `Badge` 的完整顯示規則。

## 14. 自我檢查問題

1. `Badge` 的 public contract 為什麼不能只看 `types/badge.d.ts`？
2. `Badge` 的 props 可以分成哪四組？各自負責什麼問題？
3. `dot`、`status || color`、一般 count branch 的 template 優先序是什麼？
4. `dot status="success"` 時，為什麼 `status` 不會生效？
5. `color="blue"` 為什麼不是設定一般 count badge 的背景色？
6. `#count` 和 `#text` 的覆蓋層級有什麼不同？
7. `text="new"` 在一般 count branch 中會如何影響 `finalCount`？
8. `count=99`、`overflowCount=99` 時，為什麼結果是 `99+`？
9. `hasCount` 和 `badge` 的責任差異是什麼？
10. `dot :count="0"` 為什麼會建立 dot 節點但不顯示？
11. status branch 為什麼不適合理解成「包住內容的右上角狀態角標」？
12. `type="primary"` 在什麼前提下才會影響畫面？

## 15. 後續延伸方向

這份筆記後續可以拆成幾個更深入的主題。

1. **`Badge` class 與 style 對照**：分析 `classes`、`countClasses`、`customCountClasses`、`dotClasses`、`statusClasses`、`statusStyles`、`styles` 如何對應 `badge.less`。
2. **`offset` 定位規則**：專門分析 `offset` 如何轉成 `margin-top` 與 `margin-right`，以及它在 dot branch / count branch 中的視覺效果。
3. **status color 系統**：整理 `status`、內建 `color`、自訂 hex color 與 `.make-color-classes()` 的關係。
4. **slot override 設計模式**：比較 `#count` 與 `#text` 的 API 設計，理解元件庫如何提供「整體覆蓋」與「局部覆蓋」。
5. **展示型元件的 public contract 分析法**：把本章的閱讀方法套用到 `Tag`、`Avatar`、`Alert` 等其他 View UI Plus 元件。