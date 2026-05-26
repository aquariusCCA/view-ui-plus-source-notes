# 連結行為共用

## 學習目標

這篇分析 `mixins/link.js`。View UI Plus 裡不只有 `<a>` 需要跳轉，Button、Cell、BreadcrumbItem、Auth、Typography 也可能需要支援 `to`、`replace`、`target`、router push、外部連結與新視窗開啟。

這些行為如果分散在每個元件中，會很容易不一致，所以被抽成共用 mixin。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/link.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/button.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/breadcrumb/breadcrumb-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/cell/cell.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/auth/auth.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`

這幾個元件與檔案不是完整使用清單，而是代表不同類型的可跳轉場景：`button.vue` 用來看按鈕如何在 `to` 存在時切成連結行為；`breadcrumb-item.vue` 用來看麵包屑項目如何使用 `linkUrl`、`target` 與 click modifier；`cell.vue` 用來看列表項如何把連結行為嵌入整列點擊；`auth.vue` 用來看權限元件如何借用 `to` 做導向；`typography/props.js` 用來看 Typography 如何在共用 props 層接入連結能力；`typography/base.vue` 用來看 Typography 實際點擊時如何呼叫 `handleCheckClick`。

## mixin 提供的 API

`mixins/link.js` 提供一組 props：

| prop | 作用 |
| --- | --- |
| `to` | 目標路徑，可以是 string 或 route object |
| `replace` | 使用 router.replace 而不是 router.push |
| `target` | `_blank`、`_self`、`_parent`、`_top` |
| `append` | 配合 router.resolve 使用的追加路徑選項 |

它也提供 computed：

| computed | 作用 |
| --- | --- |
| `linkUrl` | 將 `to` 解析成可放到 `href` 的字串 |

以及 methods：

| method | 作用 |
| --- | --- |
| `handleOpenTo` | 解析路徑後用 `window.open` 開啟 |
| `handleClick` | 根據 router / 外部連結 / replace 執行跳轉 |
| `handleCheckClick` | 在 click 事件中統一判斷是否攔截預設行為 |

## 路由與普通連結

`linkUrl` 的判斷順序可以整理成：

```txt
to 不是 string
  -> linkUrl 回傳 null
to 是包含 // 的 string
  -> 視為外部絕對連結，直接回傳
有 this.$router
  -> router.resolve(to, current, append)
  -> 回傳 route.href
沒有 router
  -> 回傳原本的 to
```

這讓同一個元件可以在有 Vue Router 的專案與沒有 Vue Router 的專案中工作。

## 點擊行為

點擊時要處理更多細節：

- `target="_blank"` 時走新視窗。
- 有 router 時，內部路徑走 `push` 或 `replace`。
- 外部 URL 走 `window.location.href`。
- 沒有 router 時，也回到瀏覽器跳轉。
- ctrl / meta 點擊可以配合新視窗開啟。

這些細節如果讓每個元件自己寫，很容易 Button 和 Breadcrumb 行為不同。抽成 mixin 後，使用者對「可跳轉元件」的預期會比較一致。

## 使用方式

Button 中會把 `linkUrl` 和 `target` 放進 anchor props，並在點擊時呼叫 `handleCheckClick`。

BreadcrumbItem 直接渲染 `<a>`，同樣使用 `linkUrl`、`target` 與 click modifier。

Cell 和 Typography 則把連結行為嵌入更複合的展示元件中。

Auth 則是在沒有權限但設定 `to` 時，借用 `handleClick` 做導向。

## 設計啟發

連結行為看起來簡單，實際上同時牽涉：

- router 存在與否。
- 內部路由與外部 URL。
- replace / push。
- target。
- 使用者按下 ctrl 或 meta。
- SSR 或非瀏覽器環境。

把這些邏輯抽成共用層，可以讓「可點擊跳轉」成為元件庫中的一致能力。

如果用 Vue 3 重構，可以設計成 `useLink(props)`，回傳 `linkUrl`、`handleClick`、`handleCheckClick`，讓元件在 setup 中使用。

## 複習題

1. `to` 為什麼同時支援 string 和 object？
2. `linkUrl` 為什麼只在 `to` 是 string 時回傳 href？
3. 外部連結和 Vue Router 內部路由的處理差異是什麼？
4. `target="_blank"` 對點擊流程有什麼影響？
5. 如果把 `mixins/link.js` 改成 composable，輸入與輸出應該怎麼設計？
