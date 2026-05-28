# 文字與排版類元件總覽

## 學習目標

這篇建立 `14-typography-and-text` 的閱讀方法。文字類元件的核心不是單純渲染一段字，而是把內容語意、互動入口、可讀性、可複製、可編輯、省略、格式化與型別契約整理成穩定的使用方式。

讀完後，要能判斷一個元件到底是文字排版、資料展示、表單輸入、回饋浮層，還是樣式系統的一部分。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/ellipsis/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/word-count/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/time/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/numeral/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/ellipsis.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 元件分類

| 類型 | 代表 | 閱讀重點 |
| --- | --- | --- |
| 語意文字 | `Title`、`Text`、`Paragraph`、`Link` | 對應 HTML 語意、class、slot 與可互動能力 |
| 文字操作 | `copyable`、`editable` | 複製、編輯、鍵盤、事件與 `v-model` |
| 文字省略 | Typography `ellipsis`、`Ellipsis`、`v-line-clamp` | CSS line clamp、JS 裁切、Tooltip、DOM 測量 |
| 文字輔助 | `WordCount` | 字數、溢出、slot、圓環視覺 |
| 格式化文字 | `Time`、`Numeral` | 日期、相對時間、數字格式、prefix/suffix |

這些能力都圍繞一個問題：內容本身不只是字串，還帶有使用者如何閱讀、操作與回到原始值的契約。

## 閱讀順序

建議按照這個流程讀：

1. 從 `index.js` 看元件如何註冊與匯出。
2. 看薄封裝元件，例如 `title.vue`、`text.vue`、`paragraph.vue`、`link.vue`。
3. 進入 `base.vue`，找出共用 props、render function 與狀態。
4. 對照 `props.js`，理解 copy、edit、ellipsis 的預設值與全域配置。
5. 看 examples，確認實際使用方式和源碼支援是否一致。
6. 看 `.d.ts`，核對 runtime prop、event、slot 是否有型別漂移。
7. 看依賴元件，只追到本章需要的邊界，例如 Tooltip、Input、Copy、Circle。

## 文字元件的資料流

Typography 家族可以先畫成：

```txt
modelValue / default slot
  -> wrapperDecorations()
  -> component tag + class + style
  -> copy / edit / ellipsis 額外節點
  -> 使用者操作
  -> update:modelValue 或 on-* events
```

Ellipsis 元件則是另一條線：

```txt
text + height/lines/length
  -> 隱藏狀態下測量或裁切
  -> computedText + oversize
  -> 顯示省略文字、more、suffix、tooltip
  -> on-show / on-hide
```

Time 和 Numeral 更接近純格式化：

```txt
原始值
  -> 解析與格式化
  -> 可讀文字
  -> on-change 或 timer 更新
```

## 和其他章節的關係

- `10-form-and-input-components/`：Typography editable 依賴 Input，但本章只看文字編輯流程。
- `11-data-display-components/`：WordCount 的 Circle 模式和資料展示有交叉，但本章重點是文字輔助。
- `12-feedback-and-overlays/`：Tooltip 用於省略提示與複製提示，本章只看依賴方式。
- `16-directives/`：`v-line-clamp` 是指令，本章從文字省略角度閱讀。
- `17-style-system/`：文字 class、字級、顏色與 spacing 最終要回到樣式系統核對。

## 設計啟發

文字類元件要避免把「視覺樣式」和「內容語意」混在一起。好的文字 API 應該能回答：

- 這段文字是標題、段落、行內文字、連結，還是輔助資訊？
- 文字內容由 slot 提供，還是由 `modelValue` 提供？
- 如果可以編輯，編輯後誰持有狀態？
- 如果可以複製，複製的是可見文字還是自訂文字？
- 如果會省略，完整內容如何被讀到？
- 如果是格式化文字，格式化結果能不能被外部取得？

## 複習題

1. 文字排版元件和資料展示元件的邊界在哪裡？
2. 為什麼 Typography 需要同時處理 slot、`modelValue` 和 DOM `innerText`？
3. 文字省略為什麼會牽涉 Tooltip、DOM 測量和 resize？
4. Time、Numeral 為什麼適合放在文字章，而不是只放在資料展示章？
5. 設計文字元件 API 時，最容易漏掉哪幾種互動契約？
