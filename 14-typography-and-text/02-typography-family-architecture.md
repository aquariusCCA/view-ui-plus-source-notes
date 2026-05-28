# Typography 家族架構

## 學習目標

這篇分析 Typography 家族的架構。View UI Plus 沒有讓 `Title`、`Text`、`Paragraph`、`Link` 各自重複實作 copy、edit、ellipsis，而是抽出 `TypographyBase` 作為共用渲染核心。

讀完後，要能說清楚薄封裝元件如何決定語意標籤，`TypographyBase` 如何承載共用能力，以及這種設計在元件庫中的取捨。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/title.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/text.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/paragraph.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/link.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`

## 架構分層

| 層級 | 檔案 | 職責 |
| --- | --- | --- |
| 匯出層 | `index.js` | 對外匯出 Typography 家族 |
| 容器層 | `typography.vue` | 提供外層 Typography 名稱與基礎結構 |
| 語意封裝層 | `title.vue`、`text.vue`、`paragraph.vue`、`link.vue` | 決定渲染標籤、預設 component、level 與 link 行為 |
| 共用核心層 | `base.vue` | 實作修飾、複製、編輯、省略、事件與渲染 |
| props mixin | `props.js` | 統一 props、全域配置、link mixin、共用 slot/event 方法 |

這種分層讓每個公開元件看起來是獨立 API，但內部維護的是同一組文字操作能力。

## 薄封裝模式

`Title`、`Text`、`Paragraph`、`Link` 的主要價值不是提供大量邏輯，而是把語意傳給 `TypographyBase`。

常見傳入資訊包括：

- `component`：實際渲染的 HTML tag，例如 `h1`、`span`、`div`、`a`。
- `level`：標題層級，用於 class 與 `h1` 到 `h5`。
- slots：把使用者內容轉交給 base。
- events：把 `update:modelValue` 與 edit/copy 事件向外傳。

薄封裝元件的好處是 API 易讀，使用者不用知道內部 base 的存在；缺點是 runtime 行為集中在 base，一旦 base 變複雜，閱讀時要回到核心檔案追蹤。

## TypographyBase 的角色

`TypographyBase` 同時處理幾條線：

| 能力 | 來源 | 核心方法或狀態 |
| --- | --- | --- |
| 文字內容 | `modelValue` 或 default slot | `currentContent`、`handleGetContent()` |
| 文字修飾 | props | `wrapperDecorations()` |
| 連結點擊 | link mixin | `handleClickContent()`、`linkProps` |
| 複製 | `copyable` | `handleCopy()`、`copied` |
| 編輯 | `editable` | `editing`、`editContent`、鍵盤與 blur 事件 |
| 省略 | `ellipsis` | `isEllipsis`、`ellipsisExpanded`、resize observer |

這是一個典型「共用行為核心」設計：公開元件越多，共用核心越能減少重複；但也更需要清楚拆分內部狀態，避免 copy、edit、ellipsis 互相干擾。

## props.js 的設計

`props.js` 把 Typography 家族共同契約集中起來：

- `type` 控制文字狀態色。
- `copyable`、`copyText`、`copyConfig` 控制複製。
- `editable`、`editConfig` 控制編輯。
- `ellipsis`、`ellipsisConfig` 控制省略。
- `disabled` 與文字修飾 props 控制樣式。
- `transfer`、`theme`、`maxWidth`、`placement` 只服務省略 Tooltip。
- link mixin 提供 `to`、`replace`、`target` 等連結能力。

注意全域配置讀取的是 `getCurrentInstance().appContext.config.globalProperties.$VIEWUI`。這表示 Typography 的預設行為可以被全域配置影響，但元件本身仍要用本地 prop 做覆蓋。

## render function 的必要性

`TypographyBase` 使用 render function，原因是它要動態組合多種結構：

- 原始文字可能被 `strong`、`code`、`mark` 等標籤包裹。
- copy/edit 圖示可能有 Tooltip，也可能沒有。
- 編輯模式要整段替換成 textarea + confirm icon。
- 省略模式要加入 style、class，必要時再包 Tooltip。
- `component` 可能是 `div`、`span`、`p`、`a` 或 `h1`。

這類高度條件化的 DOM 組合，用 template 會產生大量重複分支；render function 更接近實際節點組裝流程。

## 設計啟發

仿寫 Typography 家族時，可以用這個拆法：

```txt
公開語意元件
  -> 傳入 component / semantic props
  -> 共用 Base
  -> Base 統一處理 copy、edit、ellipsis、decorations
```

但要控制 Base 的責任邊界。當共用核心開始同時處理太多非文字能力，例如表單驗證、遠端儲存、權限判斷，就應該把那些能力放回業務層或 composable。

## 複習題

1. Typography 家族為什麼適合抽出 `TypographyBase`？
2. `component` 和 `level` 分別解決什麼問題？
3. 為什麼 `props.js` 需要讀全域 `$VIEWUI.typography`？
4. render function 在 TypographyBase 中比 template 更適合的原因是什麼？
5. 共用 Base 元件最容易累積哪些維護風險？
