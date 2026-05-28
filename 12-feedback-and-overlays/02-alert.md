# Alert 警告提示

## 學習目標

Alert 是本章最適合入門的回饋元件。它沒有 `Teleport`、沒有 Popper、沒有全域單例，也不需要管理 body scroll；它的價值在於示範「低狀態提示元件」如何把類型、圖示、描述、關閉與 slot 組成穩定 API。

讀完後，要能回答：一個看似簡單的提示框，如何在不暴露太多內部狀態的前提下支援不同語意、不同內容層級與可關閉行為。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/alert/alert.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/alert/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/alert.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/alert.less`

## 公開 API

| API | 類型 | 作用 |
| --- | --- | --- |
| `type` | prop | `info`、`success`、`warning`、`error` 四種語意 |
| `closable` | prop | 是否顯示關閉入口 |
| `showIcon` | prop | 是否顯示狀態圖示 |
| `banner` | prop | 是否使用 banner 樣式 |
| `fade` | prop | 是否套用關閉過渡 |
| `on-close` | event | 關閉時回傳原始事件 |
| `default` | slot | 主訊息 |
| `desc` | slot | 輔助描述 |
| `icon` | slot | 自訂圖示 |
| `close` | slot | 自訂關閉內容 |

Alert 的 API 很克制：沒有 `v-model`，也沒有外部控制的 `visible`。一旦點擊關閉，它只修改內部 `closed` 狀態，並透過 `on-close` 通知外部。

## 狀態拆解

`alert.vue` 的內部狀態只有兩個：

| 狀態 | 來源 | 用途 |
| --- | --- | --- |
| `closed` | 內部 data | 控制整個 Alert 是否渲染 |
| `desc` | mounted 後判斷 slot | 控制描述樣式與圖示 outline 版本 |

這裡值得注意的是 `desc`。元件不是只看 prop，而是在 mounted 時透過 `$slots.desc !== undefined` 判斷是否存在描述 slot，進而加入 `ivu-alert-with-desc` class，並把圖示改成 outline 版本。

```txt
type + showIcon + desc slot
  -> wrap class
  -> icon type
  -> message / desc / close 結構
```

## 圖示映射

Alert 把 `type` 轉成 icon 名稱：

| type | icon |
| --- | --- |
| `success` | `ios-checkmark-circle` |
| `info` | `ios-information-circle` |
| `warning` | `ios-alert` |
| `error` | `ios-close-circle` |

如果存在 `desc`，會在 icon 名稱後面加上 `-outline`。這個設計讓同一個語意在「短提示」與「帶描述提示」中有不同視覺重量。

## 渲染結構

Alert 的 DOM 層級可以簡化成：

```txt
transition
  div.ivu-alert.ivu-alert-{type}
    span.ivu-alert-icon
    span.ivu-alert-message
    span.ivu-alert-desc
    a.ivu-alert-close
```

這個結構有三個教學重點：

1. 主訊息和描述訊息分成兩個 slot，避免使用者把所有內容塞進同一層後樣式不可控。
2. icon 和 close 都提供 slot，讓視覺可替換，但 class 和布局仍由元件維持。
3. `transition` 是否啟用由 `fade` 控制，讓使用者能在表格、列表等對布局敏感的地方關閉動畫。

## 關閉語意

`close(e)` 做兩件事：

```txt
closed = true
emit on-close(e)
```

它不提供「阻止關閉」或「重新打開」。如果使用者需要外部控制，應該在外層條件渲染 Alert，而不是讓 Alert 同時支援內部與外部兩套可見狀態。

這是一個重要取捨：低狀態元件不要過度設計。Alert 的關閉是一次性的局部行為，Modal、Drawer 這類高狀態浮層才需要 `v-model`、`beforeClose` 與 async close。

## 型別對照

`types/alert.d.ts` 宣告了 props、`onOnClose` 與 slots。閱讀時要核對三件事：

- runtime 的 `banner` 是否也需要出現在型別中。
- `type` 的聯合型別是否和 runtime `oneOf` 保持一致。
- slot 名稱是否和 template 中的 `default`、`desc`、`icon`、`close` 一致。

型別檔是公開契約，不只是補全工具。當 runtime 和 `.d.ts` 漂移時，使用者會在 IDE 中看到不存在或缺失的能力。

## 設計啟發

仿寫 Alert 時，可以照這個流程：

1. 先定義語意類型，不要先定義顏色。
2. 把主訊息、輔助描述、狀態圖示、關閉入口拆成固定槽位。
3. 用內部狀態處理一次性關閉，除非真的需要外部控制。
4. 讓 slot 替換內容，不讓使用者重寫整個 DOM。
5. 讓 class 承載所有樣式狀態，例如 type、with-icon、with-desc、banner。

## 複習題

1. Alert 為什麼不需要 `v-model`？
2. `desc` 為什麼不是 prop，而是根據 slot 判斷？
3. `fade` 對使用者布局體驗有什麼影響？
4. Alert 的 icon slot 和 close slot 分別保留了哪些內部控制權？
5. 如果要新增 `neutral` 類型，需要同步修改哪些 runtime、style 與 type 檔案？
