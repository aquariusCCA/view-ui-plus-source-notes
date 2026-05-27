# Breadcrumb 與 BreadcrumbItem

## 學習目標

這篇分析 `Breadcrumb` 和 `BreadcrumbItem` 的路徑提示設計。Breadcrumb 是導航元件中最輕量的一組，重點不在狀態管理，而在父層 separator、子項 link 行為與 slot 覆蓋。

## 對照源碼

- `src/components/breadcrumb/breadcrumb.vue`
- `src/components/breadcrumb/breadcrumb-item.vue`
- `types/breadcrumb.d.ts`
- `src/styles/components/breadcrumb.less`

## 元件定位

`Breadcrumb` 只是一個根容器，提供 `BreadcrumbInstance` 給子項讀取 separator。`BreadcrumbItem` 負責顯示每段路徑，並根據是否有 `to` 決定輸出 `<a>` 或 `<span>`。

```txt
Breadcrumb.separator
  -> provide BreadcrumbInstance
  -> BreadcrumbItem.separator
  -> separator text 或 separator slot
```

## Props 與 Slots

| 元件 | props | slot |
| --- | --- | --- |
| `Breadcrumb` | `separator` | default |
| `BreadcrumbItem` | link mixin props: `to`、`replace`、`target`、`append` | default、`separator` |

`BreadcrumbItem` 沒有自己宣告 props，但混入 link mixin 後會取得連結能力。這是閱讀源碼時容易漏掉的地方：props 不一定全部出現在當前 `.vue` 的 `props` 區塊。

## Link 行為

當 `BreadcrumbItem` 有 `to` 時，template 輸出 `<a>`：

```txt
to -> linkUrl -> href
click.exact -> handleCheckClick(event, false)
click.ctrl/meta -> handleCheckClick(event, true)
```

沒有 `to` 時，輸出一般 `<span>`。這讓最後一段路徑可以自然成為目前頁面文字，而不是可點擊連結。

## Separator 規則

`BreadcrumbItem` 會在 mounted 時檢查是否有 `separator` slot：

| 情況 | 渲染 |
| --- | --- |
| 無 `separator` slot | 使用父層 `Breadcrumb.separator`，透過 `v-html` 輸出 |
| 有 `separator` slot | 使用子項自己的 `separator` slot |

這代表 separator 有兩層控制：全域預設由父層 prop 設定，單一 item 的特殊分隔符由 slot 覆蓋。

## Class 與結構

主要 class 很少：

| DOM | class |
| --- | --- |
| 根容器 | `ivu-breadcrumb` |
| item 文字或連結 | `ivu-breadcrumb-item-link` |
| 分隔符 | `ivu-breadcrumb-item-separator` |

Breadcrumb 沒有 active 狀態，也不維護 item 清單。它把「目前頁面」的語意交給使用者：最後一個 item 通常不傳 `to`。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `separator` | runtime 是 `String`，型別寫 `string | Element` |
| `BreadcrumbItem` props | runtime 依賴 link mixin，型別有列 `to`、`replace`、`target`、`append` |
| `separator` slot | runtime 支援，`types/breadcrumb.d.ts` 未描述 |
| `v-html` | 預設 separator 會走 HTML 輸出，使用時要避免不可信字串 |

## 設計啟發

Breadcrumb 的設計刻意很薄。它不判斷 router、不計算目前頁面、不自動產生路徑，而是提供穩定 DOM 和 link 能力。這讓它可以被 `PageHeader` 這類複合元件重用。

當元件只是路徑提示，不需要把每個 item 註冊回父層。父層只提供共享設定，子層自己完成渲染即可。

## 複習題

1. `Breadcrumb` 為什麼只需要 provide separator，而不需要管理 item 清單？
2. `BreadcrumbItem` 的 link props 從哪裡來？
3. separator prop 和 separator slot 的優先順序是什麼？
4. 最後一個 BreadcrumbItem 通常為什麼不傳 `to`？
5. `v-html` 用在 separator 上有什麼使用風險？
