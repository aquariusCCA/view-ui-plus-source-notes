# AvatarList Aggregation Tooltip And Excess：列表聚合、提示與超出項

## 0. 原始筆記問題分析

這份原始筆記已經抓到 `AvatarList` 的幾個關鍵閱讀點：它會根據 `list` 產生多個 `Avatar`、會依條件包裹 `Tooltip`、會根據 `max` 顯示超出數量，並且 `types/avatar-list.d.ts` 和 runtime source 存在明顯落差。

不過，如果要把它整理成適合長期學習的教材型筆記，還需要進一步補強幾個層次。

第一，原始筆記雖然列出了 props，但還可以更明確地說明 `AvatarList` 的元件定位。它不是「讓使用者放入任意 Avatar 子節點的容器」，而是「根據資料陣列主動產生頭像列表的聚合元件」。這個定位會影響我們如何理解 `list`、`currentList`、`Tooltip`、`extra`、`excess` 之間的關係。

第二，`max`、`currentList`、`extra`、`excess` 的互動需要用流程來理解。若只看單一 computed 或單一 template branch，很容易誤以為 `extra` 只在超出 `max` 時才出現，或誤以為 `excess` 一定會出現在列表尾端。實際上，`extra` 的優先序高於 `excess`，而且只要使用者提供 `#extra` slot，它就會顯示。

第三，`Tooltip` 的角色需要獨立說明。它不是 `AvatarList` 每個 item 的必然結構，而是由 `tooltip && item.tip` 共同決定的可選包裹層。這代表 DOM 結構會依資料與 prop 而變化。

第四，`types/avatar-list.d.ts` 的落差不應只當成附註，而應該明確整理成「runtime contract 與 typed contract 不一致」的閱讀案例。對學習元件庫原始碼的人來說，這是一個很典型的提醒：閱讀元件行為不能只看 `.d.ts`，必須回到 `.vue` runtime source。

---

## 1. 本章定位

本章是一篇 **`AvatarList` 原始碼閱讀筆記**，主題是分析 `AvatarList` 如何把資料陣列轉成一組重疊排列的頭像列表，並在必要時加入提示文字與超出數量顯示。

本章要解決的問題是：

1. `AvatarList` 的 public runtime contract 是什麼？
2. `list` 中每個 item 實際會被讀取哪些欄位？
3. `currentList` 如何根據 `max` 決定實際渲染的頭像數量？
4. `Tooltip` 什麼時候會包住 `Avatar`？
5. `extra` slot 與 `excess` slot 的優先序如何運作？
6. `avatar-list.less` 如何實作頭像重疊效果？
7. 為什麼 `types/avatar-list.d.ts` 不能被視為完全可信的 runtime 行為來源？

本章不重複分析單一 `Avatar` 的內容分支、圖片錯誤處理、尺寸樣式與文字縮放。這些內容應該先閱讀：

```txt
02-avatar-public-contract-and-content-priority.md
03-avatar-size-style-and-text-scaling.md
```

讀完本章後，應該能把 `AvatarList` 看成一個小型的「資料驅動聚合元件」：它本身不負責單一頭像的圖片、icon 或文字 fallback，而是負責把一組資料轉換成多個 `Avatar`，再加上列表層級的 tooltip、超出提示與重疊樣式。

---

## 2. 學習前先建立的基本觀念

### 2.1 `Avatar` 是展示原子，`AvatarList` 是聚合元件

在這組元件中，`Avatar` 與 `AvatarList` 的責任不是平行的。

`Avatar` 是展示原子。它負責單一頭像的內容來源，例如圖片、icon 或文字 slot，也負責單一頭像自己的尺寸與形狀樣式。

`AvatarList` 則是聚合元件。它不讓使用者自由塞入多個 `Avatar` 來排版，而是要求使用者提供 `list`，再由它自己決定要產生幾個 `Avatar`、每個 `Avatar` 是否要包 `Tooltip`、尾端是否要顯示 `extra` 或 `excess`。

因此閱讀 `AvatarList` 時，重點不是「每個 `Avatar` 內部怎麼渲染」，而是「列表資料如何被轉換成一串固定結構」。

### 2.2 資料驅動元件要先看資料契約

`AvatarList` 的核心輸入是 `list`。只要是資料驅動元件，第一步就應該先確認資料格式：每筆 item 要有哪些欄位？哪些欄位會被使用？哪些欄位即使傳入也不會生效？

從 template 可看出，`AvatarList` 實際只讀取 item 的兩個欄位：

| item 欄位 | 用途 |
| --- | --- |
| `src` | 傳給子 `Avatar`，作為圖片來源。 |
| `tip` | 在 `tooltip` 開啟時傳給 `Tooltip` 的 `content`。 |

這代表 item 裡就算放入 `icon`、`customIcon`、`shape`、`size`，runtime template 也不會拿來渲染每個子頭像。`shape` 與 `size` 是由 `AvatarList` 自己的 props 統一傳給所有子 `Avatar`。

### 2.3 slot 在這裡不是主要資料來源

`AvatarList` 有 `extra` 與 `excess` slot，但沒有使用 default slot 來接收任意 children。這一點很重要。

它的主要列表資料來源是 `list`，不是 slot。slot 只負責列表尾端的額外顯示，例如固定額外頭像或自訂超出數量內容。

---

## 3. 整體概覽

可以先用一個宏觀流程理解 `AvatarList`：

```txt
使用者傳入 props
  -> list / shape / size / max / tooltip / placement / transfer / excessStyle
  -> computed currentList 根據 max 取出要顯示的 item
  -> template 用 v-for 渲染 currentList
  -> 每個 item 依 tooltip && item.tip 決定是否包 Tooltip
  -> 每個 item 內部渲染 Avatar，並傳入 item.src、shape、size
  -> 列表尾端依 slot 優先序決定 extra / excess / 不顯示
  -> avatar-list.less 負責重疊排列與尺寸間距
```

從職責上可以拆成五個部分：

| 層次 | 主要內容 | 責任 |
| --- | --- | --- |
| Runtime props | `list`、`shape`、`size`、`max`、`tooltip`、`placement`、`transfer`、`excessStyle` | 定義外部可控制的列表行為。 |
| Derived data | `currentList` | 根據 `max` 決定實際渲染哪些 item。 |
| Template branch | `Tooltip` / direct `Avatar`、`extra` / `excess` | 決定 DOM 結構與列表尾端內容。 |
| Style layer | `avatar-list.less` | 實作頭像重疊、白色邊框、不同尺寸間距。 |
| Type declaration | `types/avatar-list.d.ts` | 對外型別描述，但與 runtime 有落差，需要對照閱讀。 |

這個元件的難點不在演算法，而在「多個小規則疊加後形成完整行為」。尤其是 `max`、`extra`、`excess` 與 `Tooltip` 的條件，要用流程而不是單一 props 來看。

---

## 4. 核心內容逐步講解

### 4.1 Runtime Props：`AvatarList` 對外開放的控制點

`avatar-list.vue` 宣告的 runtime props 如下：

| Runtime prop | Runtime 限制 / default | Type declaration | 閱讀重點 |
| --- | --- | --- | --- |
| `list` | `Array`，預設 `[]` | 未描述 | 列表資料來源；runtime 使用 item 的 `src` 與 `tip`。 |
| `shape` | `circle`、`square`，預設 `circle` | `shape?: 'circle' \| 'square'` | 統一傳給每個子 `Avatar`。 |
| `size` | `small`、`large`、`default`，預設 `default` | `size?: 'large' \| 'small' \| 'default'` | 統一傳給子 `Avatar`，也用於列表根節點 class。 |
| `excessStyle` | `Object`，預設 `{}` | 未描述 | 傳給 `extra` 或 `excess` 尾端 `Avatar` 的 inline style。 |
| `max` | `Number` | 未描述 | 控制最多顯示幾個 list item。 |
| `tooltip` | `Boolean`，預設 `true` | 未描述 | 控制有 `tip` 時是否包裹 `Tooltip`。 |
| `placement` | Tooltip placement union，預設 `top` | 未描述 | 傳給 `Tooltip` 的位置設定。 |
| `transfer` | `Boolean`，預設讀 `$VIEWUI.transfer` 或 `false` | 未描述 | 傳給 `Tooltip`，控制 Tooltip 是否轉移到外層容器。 |

這張表的重點是：`AvatarList` 的核心 runtime contract 是列表展示控制，而不是單一頭像內容控制。`src`、`icon`、`customIcon` 這類單一頭像 props 不應直接套用在 `AvatarList` 身上。

### 4.2 List Item Contract：每筆資料真正被使用的欄位

`AvatarList` 的列表項 template 大致如下：

```vue
<Tooltip
  :content="item.tip"
  v-if="tooltip && item.tip"
  :placement="placement"
  :transfer="transfer"
>
  <Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
</Tooltip>

<Avatar
  v-else
  :src="item.src"
  :size="size"
  :shape="shape"
></Avatar>
```

從這段可以清楚看出，item 的 runtime contract 只有兩個欄位：

| item 欄位 | 是否必需 | 實際用途 |
| --- | --- | --- |
| `src` | 通常需要 | 傳給 `Avatar` 的 `src`，用來顯示圖片頭像。 |
| `tip` | 選用 | 當 `tooltip` 為 `true` 時，作為 `Tooltip` 的顯示內容。 |

這裡有一個重要設計取捨：`AvatarList` 沒有讓每個 item 自己控制 `shape` 與 `size`，而是由列表層統一控制。這樣可以讓列表在視覺上保持一致，不會出現同一組頭像大小不一或形狀混雜的情況。

如果想讓每個 item 都能自訂 icon、文字或尺寸，就不是目前這個 runtime contract 的能力範圍。那會是另一種更複雜的資料結構設計，需要額外擴充元件。

### 4.3 `currentList`：從完整資料到實際渲染資料

`currentList` 是 `AvatarList` 的核心 computed，它負責決定實際要渲染哪些 item。

```js
currentList () {
    const len = this.list.length;
    const max = this.max;
    if (len <= max) {
        return [...this.list];
    } else {
        return [...this.list].slice(0, max);
    }
}
```

這段程式可以用一句話理解：

> 如果 `list.length` 沒有超過 `max`，就顯示完整 list；如果超過 `max`，就只顯示前 `max` 筆。

整理成表格：

| 狀況 | `currentList` 結果 | 是否可能顯示預設 excess |
| --- | --- | --- |
| `list.length <= max` | 複製完整 `list` | 不顯示。 |
| `list.length > max` | `list.slice(0, max)` | 顯示 `+${list.length - max}`。 |
| 未傳 `max` | 實務上會回傳完整 list copy | 不顯示預設 excess。 |
| `max = 0` 且 list 有資料 | 空陣列 | 顯示 `+list.length`。 |

未傳 `max` 的情況比較細。因為 JavaScript 中：

```js
list.length <= undefined // false
list.length > undefined  // false
list.slice(0, undefined) // 回傳完整陣列
```

所以沒有傳 `max` 時，`currentList` 會走 `else`，但 `slice(0, undefined)` 仍然得到完整陣列，而且尾端的 `excess` 條件也不成立。這是一個需要靠 JavaScript 行為理解的邊界。

### 4.4 Tooltip：列表項的可選包裹層

`Tooltip` 的出現條件是：

```txt
tooltip && item.tip
```

這代表兩個條件都要成立：

1. `AvatarList` 的 `tooltip` prop 必須是 `true`。
2. 當前 item 必須有 `tip`。

整理如下：

| `tooltip` | `item.tip` | 渲染結果 |
| --- | --- | --- |
| `true` | 有值 | `Tooltip` 包住 `Avatar`。 |
| `true` | 空值 | 直接渲染 `Avatar`。 |
| `false` | 有值 | 直接渲染 `Avatar`。 |
| `false` | 空值 | 直接渲染 `Avatar`。 |

`Tooltip` 接收三個主要輸入：

| Tooltip prop | 來源 | 說明 |
| --- | --- | --- |
| `content` | `item.tip` | 顯示提示文字。 |
| `placement` | `AvatarList` 的 `placement` prop | 決定 Tooltip 顯示位置。 |
| `transfer` | `AvatarList` 的 `transfer` prop | 決定是否使用轉移渲染策略。 |

`transfer` 的預設值會讀取全域設定：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.transfer === '' ? false : global.$VIEWUI.transfer;
```

這表示 `AvatarList` 在 Tooltip 行為上會受到 View UI Plus 全域設定影響。從元件庫設計角度來看，這是讓單一元件與全域行為保持一致的方式。

### 4.5 `extra` 與 `excess`：列表尾端內容的優先序

列表尾端的 template 有兩個互斥分支：

```vue
<div
  class="ivu-avatar-list-item ivu-avatar-list-item-excess"
  v-if="$slots.extra"
>
  <Avatar :size="size" :shape="shape" :style="excessStyle">
    <slot name="extra"></slot>
  </Avatar>
</div>

<div
  class="ivu-avatar-list-item ivu-avatar-list-item-excess"
  v-else-if="list.length > max"
>
  <Avatar :size="size" :shape="shape" :style="excessStyle">
    <slot name="excess">+{{ list.length - max }}</slot>
  </Avatar>
</div>
```

優先序可以寫成：

```txt
有 #extra
  -> 顯示 extra avatar
else if list.length > max
  -> 顯示 excess avatar
else
  -> 不顯示尾端額外 avatar
```

`extra` 與 `excess` 的差異如下：

| Slot | 觸發條件 | 預設內容 | 主要用途 |
| --- | --- | --- | --- |
| `extra` | 只要提供 `#extra` slot 就顯示 | 無 | 顯示固定的額外頭像或操作入口。 |
| `excess` | 沒有 `#extra` 且 `list.length > max` | `+{{ list.length - max }}` | 顯示超出數量，可由使用者自訂內容。 |

這裡最容易誤解的是 `extra`。`extra` 並不是「超出後才顯示的 slot」，而是「只要存在就顯示的尾端 avatar」。因此如果同時存在 `extra` 且 `list.length > max`，畫面會顯示 `extra`，不會顯示 `excess`。

`excessStyle` 會同時套用在 `extra` 與 `excess` 的 `Avatar` 上，所以它的命名雖然叫 `excessStyle`，實際上也會影響 `extra` slot 的尾端 avatar。

### 4.6 根節點 class：列表尺寸與樣式分流

`AvatarList` 根節點會產生尺寸相關 class：

```vue
<div class="ivu-avatar-list" :class="'ivu-avatar-list-' + size">
```

這代表列表層除了把 `size` 傳給每個子 `Avatar`，也會用 `size` 控制列表自己的重疊間距。

| `size` | 根節點 class | 列表層用途 |
| --- | --- | --- |
| `small` | `ivu-avatar-list-small` | 使用基礎重疊距離。 |
| `default` | `ivu-avatar-list-default` | 覆蓋中等尺寸的重疊距離。 |
| `large` | `ivu-avatar-list-large` | 覆蓋更大的重疊距離，並調整 excess 字體。 |

這裡要注意，`AvatarList` 的 `size` 同時影響兩件事：

1. 子 `Avatar` 的尺寸。
2. 列表 item 之間的重疊距離。

這是典型的聚合元件設計：同一個 prop 會向下傳給子元件，也會留在自身控制 layout。

---

## 5. 表格整理

### 5.1 `AvatarList` runtime contract 表

| 項目 | 位置 / 寫法 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| `list` | `avatar-list.vue` props | 列表資料來源 | 每個 item runtime 只使用 `src` 與 `tip`。 |
| `shape` | `avatar-list.vue` props | 控制所有子 `Avatar` 形狀 | 不是 item 層級設定，而是列表層統一控制。 |
| `size` | `avatar-list.vue` props | 控制子頭像尺寸與列表重疊間距 | 同時傳給 `Avatar`，也產生 `ivu-avatar-list-{size}`。 |
| `max` | `avatar-list.vue` props | 控制最多顯示數量 | 與 `currentList`、`excess` branch 共同決定畫面。 |
| `tooltip` | `avatar-list.vue` props | 控制是否啟用 tooltip 包裹 | 仍需 item 有 `tip` 才會出現 Tooltip。 |
| `placement` | `avatar-list.vue` props | Tooltip 位置 | 只在 Tooltip 分支出現時生效。 |
| `transfer` | `avatar-list.vue` props | Tooltip 轉移渲染設定 | 預設讀取 `$VIEWUI.transfer`。 |
| `excessStyle` | `avatar-list.vue` props | 尾端 avatar inline style | 同時作用於 `extra` 與 `excess`。 |

### 5.2 流程表：從 `list` 到畫面

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | props | 接收列表資料與展示控制 | `list`、`max`、`tooltip`、`size`、`shape` | 元件狀態來源 | `list` 是主要資料來源。 |
| 2 | `currentList` computed | 根據 `max` 決定渲染資料 | `list`、`max` | `currentList` | 未傳 `max` 時會因 JS 行為回傳完整陣列。 |
| 3 | `v-for` | 逐筆渲染列表項 | `currentList` | 多個 `.ivu-avatar-list-item` | item 只讀 `src` 與 `tip`。 |
| 4 | Tooltip branch | 判斷是否包 `Tooltip` | `tooltip`、`item.tip` | `Tooltip > Avatar` 或直接 `Avatar` | Tooltip 是可選包裹層。 |
| 5 | 子 Avatar | 渲染單一頭像 | `item.src`、`size`、`shape` | 圖片頭像 | 不傳 item 自訂 size / shape。 |
| 6 | 尾端 branch | 判斷 `extra` / `excess` | `$slots.extra`、`list.length > max` | 額外 avatar 或不顯示 | `extra` 優先於 `excess`。 |
| 7 | Less | 套用重疊排列 | `ivu-avatar-list-{size}` class | 視覺排列 | 負 margin 實作重疊。 |

### 5.3 `extra` / `excess` 優先序表

| 條件 | 顯示內容 | 說明 |
| --- | --- | --- |
| 有 `#extra`，且 `list.length > max` | `extra` | `extra` 優先，`excess` 不渲染。 |
| 有 `#extra`，且 `list.length <= max` | `extra` | `extra` 不依賴是否超出 `max`。 |
| 沒有 `#extra`，且 `list.length > max` | `excess` | 預設顯示 `+N`，可用 `#excess` 自訂。 |
| 沒有 `#extra`，且 `list.length <= max` | 不顯示尾端 avatar | 沒有額外內容。 |

### 5.4 Style 責任表

| Less 區塊 | 責任 | 閱讀重點 |
| --- | --- | --- |
| `.ivu-avatar-list` | 根容器 | 使用 `display: inline-block`，讓列表像 inline 元件一樣排列。 |
| `.ivu-avatar-list-item` | 每個列表項 | 使用 `display: inline-block` 與負 `margin-left` 做重疊。 |
| `.ivu-avatar-list-item:first-child` | 第一個列表項 | 將第一個 item 的 `margin-left` 設回 `0`，避免整組偏移。 |
| `.ivu-avatar-list-item .ivu-avatar` | 子 Avatar | 加白色邊框，讓重疊時仍能看出分隔。 |
| `.ivu-avatar-list-item-excess` | 尾端額外項 | 將 cursor 改成 `auto`，避免看起來像一般可互動項。 |
| `.ivu-avatar-list-default` | default 尺寸列表 | 調整 default 尺寸的重疊距離。 |
| `.ivu-avatar-list-large` | large 尺寸列表 | 調整 large 尺寸的重疊距離與 excess 字體。 |

---

## 6. 範例或情境說明

### 6.1 基本列表：只顯示圖片

假設使用者傳入：

```js
const list = [
  { src: 'user-a.png' },
  { src: 'user-b.png' },
  { src: 'user-c.png' }
];
```

搭配：

```vue
<AvatarList :list="list" />
```

此時每個 item 沒有 `tip`，即使 `tooltip` 預設為 `true`，也不會包 `Tooltip`，因為條件 `tooltip && item.tip` 不成立。畫面會直接渲染三個 `Avatar`。

### 6.2 帶提示的列表：有 `tip` 才包 Tooltip

```js
const list = [
  { src: 'user-a.png', tip: 'Alice' },
  { src: 'user-b.png', tip: 'Bob' },
  { src: 'user-c.png' }
];
```

這種情況下，前兩個 item 會被 `Tooltip` 包住，第三個 item 因為沒有 `tip`，會直接渲染 `Avatar`。這代表同一組 `AvatarList` 中，不同 item 的 DOM 結構可能不同。

### 6.3 使用 `max` 顯示超出數量

```vue
<AvatarList :list="list" :max="3" />
```

假設 `list.length = 5`，則：

```txt
currentList = list.slice(0, 3)
excess = +2
```

畫面會顯示前三個頭像，尾端再顯示一個 `+2` 的 `Avatar`。如果使用者提供 `#excess`，則可以替換 `+2` 的內容。

### 6.4 使用 `extra` 當固定尾端入口

```vue
<AvatarList :list="list" :max="3">
  <template #extra>
    +
  </template>
</AvatarList>
```

只要提供 `#extra`，尾端就會顯示這個額外 avatar。即使 `list.length > max`，也不會顯示預設的 `+N`，因為 `extra` 優先於 `excess`。

這種設計適合用在「新增成員」或「查看更多」的入口，但要注意：目前 source 只負責顯示內容，沒有在 `AvatarList` 層提供 click handler。若要互動，通常需要在 slot 內容或外層自行處理。

---

## 7. 閱讀路線或學習路線

第一次閱讀 `AvatarList` 時，建議照以下順序。

### 7.1 初次閱讀路線

1. **先讀 `avatar-list.vue` 的 props**  
   目的：先確認 `AvatarList` 對外開放哪些控制點，尤其是 `list`、`max`、`tooltip`、`excessStyle`。

2. **再讀 `currentList` computed**  
   目的：理解完整 `list` 如何被裁切成實際渲染的資料。

3. **接著讀 `v-for` template**  
   目的：確認每筆 item 實際使用哪些欄位，以及 `Tooltip` 和 `Avatar` 的包裹關係。

4. **再讀尾端 `extra` / `excess` branch**  
   目的：建立尾端額外 avatar 的優先序模型。

5. **最後讀 `avatar-list.less`**  
   目的：把 runtime 產生的 class 對應到重疊排列、白色邊框和尺寸間距。

### 7.2 深入閱讀路線

1. **對照 `Avatar` 原始碼**  
   觀察 `AvatarList` 傳給子 `Avatar` 的 props 只有 `src`、`size`、`shape`，因此列表項不會走 icon 或文字 slot 的擴充路徑。

2. **對照 `Tooltip` 元件**  
   了解 `placement` 與 `transfer` 對 Tooltip DOM 與顯示位置的影響。

3. **對照官方 example**  
   確認官方範例中的 `list` 是否只使用 `src` 與 `tip`，以及 `max`、`excessStyle` 如何呈現。

4. **對照 `.d.ts`**  
   找出 typed contract 與 runtime contract 的差異，建立閱讀元件庫時「runtime source 優先」的習慣。

### 7.3 可以暫時跳過的部分

初學時可以先暫時跳過 `Tooltip` 內部實作細節，只要知道 `AvatarList` 會把 `item.tip`、`placement`、`transfer` 傳給 `Tooltip` 即可。等熟悉整個元件庫的 overlay / popper 類元件後，再回頭深入 `Tooltip`。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| `AvatarList` 是一個可以任意放入 children 的容器 | 名稱看起來像 layout list，容易以為是包多個 `Avatar` | 它根據 `list` 主動產生子 `Avatar`，不是渲染 default slot。 |
| 每個 item 都可以自己決定 `shape` / `size` | 很多資料驅動元件會允許 item 自訂欄位 | runtime 只讀 `item.src` 與 `item.tip`；`shape` / `size` 由列表層統一傳下去。 |
| 每個 item 都一定有 Tooltip | `AvatarList` 有 `tooltip` prop，容易以為開啟後每個 item 都會包 Tooltip | 仍然需要 `item.tip` 有值，條件是 `tooltip && item.tip`。 |
| `extra` 只在超出 `max` 時顯示 | 名稱和 `excess` 都出現在尾端，容易混在一起 | `extra` 只要 slot 存在就顯示，而且優先於 `excess`。 |
| `excessStyle` 只作用於 `excess` | prop 名稱暗示它只管超出項 | runtime 同時把它傳給 `extra` 與 `excess` 的 `Avatar`。 |
| 未傳 `max` 會導致列表被裁切 | 看到 `slice(0, max)` 可能直覺以為 `max` 必填 | 未傳 `max` 時，`slice(0, undefined)` 會回傳完整陣列，且不顯示 excess。 |
| `.d.ts` 已完整描述 `AvatarList` | TypeScript 使用者容易把型別檔當成唯一合約 | `types/avatar-list.d.ts` 漏掉主要 runtime props，且包含 runtime 不接收的 props。 |
| 重疊效果是靠 absolute positioning | 視覺上像堆疊，容易聯想到定位 | source 使用 inline-block 與負 `margin-left` 實作。 |

---

## 9. 本章總結

`AvatarList` 的核心是列表聚合。它接收 `list`，用 `currentList` 根據 `max` 算出實際渲染項目，再對每個 item 產生一個子 `Avatar`。如果 `tooltip` 開啟且 item 有 `tip`，該頭像就會被 `Tooltip` 包住；否則直接渲染 `Avatar`。

尾端內容由 `extra` 與 `excess` 兩個分支共同決定。`extra` 的優先序最高，只要 slot 存在就會顯示；只有在沒有 `extra` 且 `list.length > max` 時，才會進入 `excess` 分支，預設顯示 `+N`。

樣式上，`AvatarList` 使用 inline-block 與負 `margin-left` 讓頭像彼此重疊，再透過白色邊框維持分隔感。`size` 不只傳給子 `Avatar`，也會影響列表層的重疊距離。

從原始碼閱讀角度看，這個元件最有價值的地方，是它展示了元件庫中常見的「聚合元件」設計：父元件統一控制子元件的規格，資料 item 只提供必要內容，slot 則作為少量自訂出口。同時，`types/avatar-list.d.ts` 與 runtime source 的落差也提醒我們：閱讀元件庫時，型別檔可以輔助理解 public surface，但不能取代 runtime source。

---

## 10. 自我檢查問題

1. `AvatarList` 和 `Avatar` 的責任差異是什麼？
2. `AvatarList` 的 runtime props 有哪些？其中哪些沒有被 `types/avatar-list.d.ts` 描述？
3. `list` 中每個 item 實際會被讀取哪些欄位？
4. 為什麼 item 裡即使放入 `shape` 或 `size`，也不會影響單一頭像？
5. `currentList` 如何根據 `max` 產生？
6. 未傳 `max` 時，`currentList` 與 `excess` 會如何表現？
7. `Tooltip` 的出現條件是什麼？
8. `extra` 與 `excess` 的優先序是什麼？
9. `excessStyle` 實際會作用在哪些尾端 avatar？
10. `avatar-list.less` 如何實作頭像重疊？不同 `size` 對重疊距離有什麼影響？

---

## 11. 後續延伸方向

這篇筆記可以延伸成以下更深入的主題。

1. **`AvatarList` 與 `Avatar` 的組合設計分析**  
   比較展示原子與聚合元件的責任切分，理解元件庫如何從單一元件擴展到資料驅動組件。

2. **`Tooltip` 在 View UI Plus 中的全域設定與 transfer 行為**  
   深入分析 `$VIEWUI.transfer` 如何影響 overlay 類元件，並觀察 `Tooltip`、`Select`、`Dropdown` 等元件是否有相似設計。

3. **`extra` / `excess` slot 的 API 設計取捨**  
   討論為什麼要拆成兩個 slot，以及這種設計對可擴充性與使用者心智模型的影響。

4. **`types/avatar-list.d.ts` 修正建議**  
   針對 runtime contract 補齊 `list`、`max`、`tooltip`、`placement`、`transfer`、`excessStyle` 等型別，並移除 runtime 不接收的 `src`、`icon`、`custom-icon`。

5. **列表重疊樣式的 CSS 實作比較**  
   比較負 margin、absolute positioning、flex layout、CSS grid 在頭像堆疊場景中的優缺點。

6. **從 `AvatarList` 學習元件庫 API 設計**  
   分析一個元件如何決定哪些能力放在 props，哪些能力放在 slot，哪些能力留給子元件處理。
