# Card 內容容器

## 學習目標

這篇分析 `Card` 如何作為內容容器。它同時處理標題區、右上角操作區、內容區、邊框陰影、內距，以及可點擊跳轉行為，是本章最接近「業務頁面區塊」的元件。

讀完後，要能說明 `Card` 如何根據 props 和 slot presence 決定 DOM 結構，並理解它為什麼會混入 link 行為。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/card/card.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/card/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/card.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/card.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`

## 結構定位

`Card` 的模板可以拆成三個區域：

| 區域 | class | 來源 |
| --- | --- | --- |
| head | `ivu-card-head` | `title` / `icon` props 或 `title` slot |
| extra | `ivu-card-extra` | `extra` slot |
| body | `ivu-card-body` | default slot |

外層會依照是否有跳轉行為決定標籤：

```txt
to 存在 -> <a>
to 不存在 -> <div>
```

這讓 `Card` 不只是靜態容器，也可以作為整張卡片可點擊的入口。

## 視覺 props

`Card` 的主要視覺 props：

| Prop | 預設值 | 說明 |
| --- | --- | --- |
| `bordered` | `true` | 是否顯示邊框 |
| `disHover` | `false` | 是否停用 hover 陰影 |
| `shadow` | `false` | 是否直接使用陰影樣式 |
| `padding` | `16` | body 內距，單位 px |
| `title` | 無 | 簡單標題文字 |
| `icon` | 無 | 標題前 icon type |

`classes` 的邏輯：

```txt
bordered && !shadow -> ivu-card-bordered
disHover || shadow -> ivu-card-dis-hover
shadow -> ivu-card-shadow
```

這裡有一個設計細節：`shadow` 會同時讓 hover 效果停用，避免已經固定有陰影的卡片再套 hover 陰影。

## head 與 extra 的 slot presence

`Card` 內部有兩個狀態：

```txt
showHead
showExtra
```

在 `mounted` 時判斷：

```txt
showHead = title || $slots.title !== undefined
showExtra = $slots.extra !== undefined
```

所以 head 的出現規則是「有 `title` prop 或有 `title` slot」。extra 的出現規則是「有 `extra` slot」。

head 內部還有 fallback：

```txt
title slot
  -> 若不存在，使用 title prop
  -> 若 icon 存在，在 title 前渲染 Icon
```

這種設計讓簡單使用者可以只傳 `title`，複雜使用者可以用 slot 接管整個標題區。

## body padding

`bodyStyles` 只有在 `padding` 不等於預設值 `16` 時才回傳 inline style：

```txt
padding !== 16
  -> { padding: `${padding}px` }
```

預設狀態交給 less，客製數值才用 inline style。這能讓預設樣式維持在設計系統中，同時保留使用者調整內距的能力。

## link mixin

`Card` 混入 `mixinsLink`，因此支援：

| Prop | 說明 |
| --- | --- |
| `to` | 跳轉目標，可支援 vue-router |
| `replace` | router replace |
| `target` | 對應 `<a target>` |
| `append` | router append |

`isHrefPattern` 只看 `to` 是否存在。當 `to` 存在時，外層變成 `<a>`，並把 `href` 和 `target` 放入 `tagProps`。

點擊流程：

```txt
click Card
  -> handleClickLink(event)
  -> 若沒有 to，直接 return
  -> 判斷 ctrl/meta 是否新視窗
  -> handleCheckClick(event, openInNewWindow)
```

這和 Button 的 link 行為屬於同一套設計思想：讓元件可以保有自己的外觀，同時支援跳轉入口。

## Runtime 與 Type 對照

`types/card.d.ts` 對應 runtime 大致完整，包含視覺 props、link props 與 slots。

值得注意的是事件：`Card` 沒有額外宣告 click emit。它是透過原生 DOM 點擊處理 link 行為，而不是對外提供一個新的 `on-click` API。

slot 宣告包括：

| Slot | 角色 |
| --- | --- |
| `title` | 覆蓋標題區 |
| `extra` | 右上角附加內容 |
| `default` | 主體內容 |

閱讀 `Card` 時要把 slot 看成公開契約，因為使用者常會依賴 `extra` 放操作按鈕或連結。

## 設計啟發

`Card` 的設計重點是讓「常見內容區塊」有穩定外框：

- 簡單標題用 props。
- 複雜標題用 slot。
- 右上角操作只用 `extra` slot，不額外設計 props。
- 預設 padding 用 less，客製 padding 用 inline style。
- 可跳轉行為復用 link mixin，不在 Card 內重寫 router 邏輯。

仿寫容器元件時，可以借鑑這種做法：簡單場景提供 props，複雜內容交給 slot，跨元件共用行為交給 mixin 或 composable。

## 複習題

1. `Card` 的 head 在哪些情況下會被渲染？
2. `title` prop、`icon` prop、`title` slot 的優先順序如何？
3. 為什麼 `shadow` 會讓 `dis-hover` class 也出現？
4. `padding` 為什麼只在非預設值時使用 inline style？
5. `Card` 透過 link mixin 得到哪些跳轉能力？
