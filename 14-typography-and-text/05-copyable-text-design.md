# 可複製文字設計

## 學習目標

這篇分析 Typography 的可複製能力。`copyable` 不是在文字旁邊放一個 icon 這麼簡單，它包含複製內容來源、成功狀態、Tooltip 文案、全域配置、slot 覆蓋與事件回報。

讀完後，要能設計一個可預期、可客製、可回報狀態的文字複製 API。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/tooltip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`

## API 組成

| API | 作用 |
| --- | --- |
| `copyable` | 是否顯示複製入口 |
| `copyText` | 指定要複製的內容 |
| `copyConfig` | 設定 Tooltip、成功提示、失敗提示 |
| `copyIcon` slot | 自訂複製前後的 icon |
| `on-copy-success` | 複製成功後回報 |
| `on-copy-error` | 複製失敗後回報 |

`copyable` 控制能力開關，`copyText` 控制資料來源，`copyConfig` 控制體驗細節，事件控制外部回應。

## 複製內容來源

`handleCopy()` 的內容來源優先序是：

```txt
copyText
  -> currentContent / modelValue
  -> default slot 的 innerText
```

這個順序很重要：

- `copyText` 適合複製和畫面不同的內容，例如完整 ID、純文字 URL、去格式化內容。
- `modelValue` 適合受控文字。
- slot 內容需要透過 `handleGetContent()` 轉成純文字，避免複製到 VNode 結構。

設計筆記時要提醒：可見內容不一定等於複製內容。

## copyConfig

預設配置包含：

```txt
tooltips: ['复制', '复制成功']
showTip: false
successTip: '复制成功'
errorTip: '复制失败'
```

`copyConfig` 可以從元件 prop 傳入，也可以從全域 `$VIEWUI.typography.copyConfig` 取得。最後會用 `Object.assign` 和預設值合併，避免只傳部分配置時丟失其他預設行為。

閱讀時要注意：

- `tooltips` 為 `false` 時不包 Tooltip。
- `tooltips` 是長度為 2 的陣列時，會根據 `copied` 切換文案。
- `showTip`、`successTip`、`errorTip` 傳給 Copy 工具處理通知。

## copied 狀態

複製成功後：

```txt
emit on-copy-success
copied = true
clear old timeout
setTimeout 3000ms -> copied = false
```

`copied` 的作用是短時間內改變 icon 和 Tooltip 文案。這是 UI 狀態，不是資料狀態，所以不需要外部用 `v-model` 控制。

如果多次快速點擊複製，先清掉舊 timeout 再建立新 timeout，可以避免成功狀態過早消失。

## copyIcon slot

`copyIcon` slot 會收到 `copied`：

```txt
copyIcon({ copied })
```

這讓使用者可以根據成功狀態換 icon。這比只提供一個 `icon` prop 更靈活，因為 slot 可以回傳任意 VNode。

設計 slot props 時要保持足夠小：只給使用者需要的狀態，不暴露內部 timeout 或 Copy 工具細節。

## 失敗處理

複製失敗時會觸發 `on-copy-error`，並由 Copy 工具決定是否顯示錯誤提示。

仿寫時需要補上的測試情境：

- 瀏覽器不支援 clipboard API。
- 使用者權限拒絕。
- 複製內容是空字串。
- slot 內容轉文字失敗。
- 元件卸載時 timeout 是否需要清理。

## 設計啟發

可複製文字 API 可以遵循：

```txt
能力開關 copyable
  -> 明確內容 copyText
  -> 預設內容 modelValue / slot innerText
  -> 工具函數執行複製
  -> copied UI 狀態
  -> success/error events
```

這樣可以同時滿足簡單使用與進階客製。

## 複習題

1. `copyText` 為什麼要比 `modelValue` 和 slot 優先？
2. `copied` 為什麼適合放在內部狀態，而不是交給父元件控制？
3. `copyConfig.tooltips` 為什麼需要支援 `false`？
4. `copyIcon` slot 只暴露 `copied` 有什麼好處？
5. 可複製文字最少應該測哪些失敗情境？
