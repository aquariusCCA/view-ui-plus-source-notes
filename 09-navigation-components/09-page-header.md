# PageHeader 頁面頭部

## 學習目標

這篇分析 `PageHeader` 如何把 Breadcrumb、返回按鈕、標題、操作區、內容區、額外區塊與 Tabs 組成頁面頭部導航。它是本章的複合元件案例，重點在 slot/props fallback 和子元件組合。

## 對照源碼

- `src/components/page-header/page-header.vue`
- `types/page-header.d.ts`
- `src/styles/components/page-header.less`

## 元件定位

`PageHeader` 本身不維護複雜狀態，而是把多個導航元件組合成標準頁頭：

```txt
breadcrumbList -> Breadcrumb / BreadcrumbItem
back -> on-back
tabList + tabActiveKey -> Tabs / TabPane -> on-tab-change
title/action/content/extra/logo -> props 或 slots
```

它適合後台詳情頁、列表頁、設定頁，把頁面位置、返回、局部 tab 和主要操作放到穩定結構中。

## Props 與區塊

| props | 區塊 |
| --- | --- |
| `title` | 標題 |
| `back` | 是否顯示返回按鈕 |
| `logo` | logo 圖片 |
| `action` | title 行右側操作區 |
| `content` | 第二行主內容 |
| `extra` | 第二行右側額外內容 |
| `breadcrumbList` | 自動渲染麵包屑 |
| `hiddenBreadcrumb` | 關閉預設麵包屑 |
| `tabList`、`tabActiveKey` | 頁頭底部 Tabs |
| `wide` | 加上定寬 class |

每個文字/區塊 props 都有對應 slot 覆蓋，slot 優先於 prop。

## Breadcrumb 組合

breadcrumb 區塊條件：

```txt
$slots.breadcrumb || !hiddenBreadcrumb
```

沒有 breadcrumb slot 時，`PageHeader` 會根據 `breadcrumbList` 自動渲染 `Breadcrumb` 和 `BreadcrumbItem`，並把 item 的 `to`、`replace`、`target`、`title` 傳下去。

這表示 `hiddenBreadcrumb` 只關閉預設麵包屑；如果使用者提供 breadcrumb slot，仍會顯示。

## 返回按鈕

`back` 或 `back` slot 存在時會顯示返回區塊，點擊後 emit `on-back`。預設 icon 是 `md-arrow-back`，旁邊有垂直 `Divider`。

注意 template 中在外層 detail 和 main row 內各有一段 `ivu-page-header-back`。這通常是為了配合不同響應式布局，由樣式決定顯示效果；閱讀時要到 less 確認實際顯示策略。

## Tabs 組合

`tabList` 存在且有長度時，底部渲染：

```txt
Tabs animated=false model-value=tabActiveKey
  TabPane label=item.label name=item.name
```

`Tabs` 的 `on-click` 會呼叫 `handleTabChange(name)`，從 `tabList` 找到對應 item，深拷貝後 emit `on-tab-change(tab)`。

這裡沒有 emit `update:tabActiveKey`，所以 active key 由外部資料更新。

## Slots

| slot | 用途 |
| --- | --- |
| `breadcrumb` | 完全覆蓋 breadcrumb 區塊 |
| `back` | 覆蓋返回 icon 區 |
| `logo` | 覆蓋 logo |
| `title` | 覆蓋標題 |
| `action` | 覆蓋操作區 |
| `content` | 覆蓋內容區 |
| `extra` | 覆蓋額外區 |

型別檔有列出多數 slot，但沒有列出 `breadcrumb` slot。

## Class

主要 class 包括：

| 區塊 | class |
| --- | --- |
| 根 | `ivu-page-header`、`ivu-page-header-wide` |
| 麵包屑 | `ivu-page-header-breadcrumb` |
| detail | `ivu-page-header-detail` |
| 返回 | `ivu-page-header-back` |
| logo | `ivu-page-header-logo` |
| 主體 | `ivu-page-header-main`、`ivu-page-header-row` |
| title/action/content/extra | 對應 `ivu-page-header-*` |
| tabs | `ivu-page-header-tabs` |

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `breadcrumb` slot | runtime 支援，型別未描述 |
| `tabList` item | runtime 使用 `label`、`name`，型別只寫 any[] |
| `on-tab-change` payload | runtime 回傳深拷貝後的 tab item，型別只寫 any |
| `tabActiveKey` | runtime 只傳給內部 Tabs，沒有雙向更新事件 |

## 設計啟發

PageHeader 的價值在組合，不在新狀態。它把 Breadcrumb、Tabs、Icon、Divider 的能力排列成企業後台常見頁頭。

設計這類複合元件時，要明確決定哪些區塊可以用資料快速生成，哪些區塊必須開 slot 給業務自由組合。PageHeader 的策略是：簡單文字用 prop，複雜內容用 slot 覆蓋。

## 複習題

1. `hiddenBreadcrumb` 和 `breadcrumb` slot 同時存在時會怎樣？
2. `on-tab-change` 的 payload 是什麼？
3. 為什麼 `PageHeader` 不自己實作 Tabs，而是組合 `Tabs`/`TabPane`？
4. 哪些區塊同時支援 prop 和 slot？
5. `tabActiveKey` 為什麼需要外部自行同步？
