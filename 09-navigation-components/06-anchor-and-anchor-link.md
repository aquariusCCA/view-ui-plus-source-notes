# Anchor 與 AnchorLink

## 學習目標

這篇分析 `Anchor` 和 `AnchorLink` 如何實作錨點導航。重點是 hash 解析、滾動容器、連結註冊、active link 計算、ink 位置，以及點擊錨點時如何同時處理 router 和瀏覽器位置。

## 對照源碼

- `src/components/anchor/anchor.vue`
- `src/components/anchor/anchor-link.vue`
- `types/anchor.d.ts`
- `src/styles/components/anchor.less`

## 元件定位

`Anchor` 是狀態與滾動控制中心，`AnchorLink` 是可巢狀的連結節點。每個 `AnchorLink` mounted 時會註冊到父層，讓 `Anchor` 能根據 link 清單找到對應標題元素。

```txt
AnchorLink.href
  -> Anchor.links
  -> titlesOffsetArr
  -> scrollTop / currentLink / inkTop
```

## Props 與狀態

| props | 作用 |
| --- | --- |
| `affix` | 是否用 `Affix` 包住 Anchor |
| `offsetTop`、`offsetBottom` | 傳給 Affix，並影響 wrapper 高度 |
| `bounds` | 滾動判斷 active title 的容錯距離 |
| `container` | 指定滾動容器，可以是 selector 或 element |
| `showInk` | 是否顯示左側小圓點 |
| `scrollOffset` | 點擊滾動時額外扣除距離 |

核心狀態：

| state | 說明 |
| --- | --- |
| `currentLink` | 目前 active 的 `#id` |
| `currentId` | hash 去掉 `#` 後的 id |
| `scrollContainer` | 實際監聽 scroll 的容器 |
| `scrollElement` | 計算 scrollTop 的元素 |
| `links` | 子 `AnchorLink` 註冊清單 |
| `inkTop` | 小圓點 top 位置 |

## 初始化流程

`Anchor.init()` 會：

1. 從目前 URL 解析 hash，更新 `currentLink` 和 `currentId`。
2. nextTick 後移除舊 listener。
3. 解析 `container`，決定 `scrollContainer` 和 `scrollElement`。
4. 計算 `wrapperTop`。
5. 呼叫 `handleScrollTo()` 和 `handleSetInkTop()`。
6. 綁定 scroll 與 window hashchange listener。

`container` 變化或 `$route` 變化時會重新處理定位。

## Active Link 計算

`titlesOffsetArr` 是 computed，會從 `links` 取出每個 `href`，找到對應 DOM id，計算標題相對於 scroll element 的 offset。

scroll 時，`getCurrentScrollAtTitleId(scrollTop)` 會把 scrollTop 加上 `bounds`，再尋找目前位於哪兩個 title offset 之間。找到後更新 `currentLink`，並調整 ink top。

`currentLink` watch 會 emit `on-change(newHref, oldHref)`。

## 點擊流程

`AnchorLink.goAnchor()` 會：

1. 呼叫父層 `handleHashChange()`。
2. 呼叫父層 `handleScrollTo()`。
3. emit `on-select(href)`。
4. 如果存在 `$router`，用 `this.$router.push(href)`。
5. 否則設定 `window.location.href = href`。

`handleScrollTo()` 會找目標 DOM，取得該 link 的 `data-scroll-offset`，再用 `scrollTop()` 做 600ms 動畫。動畫期間 `animating` 為 true，scroll listener 不會反向更新 active。

## Class 與 Style

| DOM | class / style |
| --- | --- |
| wrapper | `ivu-anchor-wrapper`，maxHeight 依 `offsetTop` 計算 |
| 根節點 | `ivu-anchor` |
| ink | `ivu-anchor-ink`、`ivu-anchor-ink-ball`，top 由 `inkTop` 控制 |
| link | `ivu-anchor-link`、`ivu-anchor-link-active` |
| link title | `ivu-anchor-link-title` |

`AnchorLink` 支援巢狀，default slot 可以繼續放子 link。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `container` | runtime 為 `null`，註解說避免 SSR 下 HTMLElement 型別問題；型別寫 `string | HTMLElement` |
| `scrollOffset` | `AnchorLink` default 會從注入的 `AnchorInstance.scrollOffset` 取得 |
| `on-change` | runtime 回傳 newHref、oldHref，型別只寫 any |
| `on-select` | runtime 回傳 href，型別只寫 any |
| `Affix` | template 使用字串元件名 `Affix`，需要依賴全域或上下文註冊 |

## 設計啟發

Anchor 是導航元件中 DOM 依賴最強的一組。它的公開 API 看起來很小，但內部要處理 hash、router、scroll container、動畫、active 判斷與 listener 清理。

設計錨點導航時，要特別注意 SSR 保護、容器切換、卸載清理與動畫期間的狀態競爭。

## 複習題

1. `AnchorLink` 為什麼要註冊到 `Anchor.links`？
2. `bounds` 如何影響 active link 判斷？
3. `scrollContainer` 和 `scrollElement` 有什麼差異？
4. 點擊錨點時，router 和非 router 場景分別如何處理？
5. `animating` 為什麼可以避免 scroll listener 干擾點擊滾動？
