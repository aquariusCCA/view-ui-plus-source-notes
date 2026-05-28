# 文字排版 API 模式與檢查清單

## 學習目標

這篇整理文字排版類元件的 API 設計模式與檢查清單。適用於 Typography、Ellipsis、WordCount、Time、Numeral，也適合用來仿寫企業後台中的文字顯示元件。

## 1. 語意是否清楚

- 這段文字是標題、段落、行內文字、連結，還是輔助資訊？
- 元件是否使用合適的 HTML tag？
- 標題是否有層級，而不是只用字體大小模擬？
- 連結是否真的有導航語意？
- 純樣式需求是否可以交給 class，而不是新增元件？

## 2. 內容來源

- 內容由 `modelValue`、`value`、`text`、`time` 還是 default slot 提供？
- 如果同時支援 prop 和 slot，優先順序是否明確？
- slot 內容轉純文字時是否用 `innerText`？
- 可見文字和複製文字是否可能不同？
- 格式化元件是否保留原始值與格式化值的邊界？

## 3. 修飾與狀態

- 狀態色是否使用有限 union，例如 `success`、`warning`、`danger`？
- `disabled` 是否同時影響樣式與互動？
- `strong`、`code`、`mark`、`keyboard` 是否使用語意標籤？
- 多個修飾同時存在時，包裹順序是否穩定？
- 樣式是否交給樣式系統，而不是在 render 中硬編碼？

## 4. 複製能力

- 是否有能力開關，例如 `copyable`？
- 複製內容是否有明確優先序？
- 成功與失敗是否都有事件？
- 成功狀態是否會自動復原？
- Tooltip、成功提示、錯誤提示是否可配置？
- 自訂 icon 是否能知道 copied 狀態？

## 5. 編輯能力

- 展示值和編輯草稿是否分開？
- 進入編輯、變更、保存、取消是否都有事件？
- Enter、Esc、blur 的行為是否明確？
- Esc 取消後是否避免 blur 再保存？
- `v-model` 是保存時更新，還是輸入時即時更新？
- 編輯模式是否借用 Input，但不混入 Form 驗證責任？

## 6. 省略能力

- 省略是 CSS line clamp、JS 裁切，還是兩者混用？
- 是否能知道內容真的溢出？
- 未溢出時是否避免顯示 Tooltip？
- 容器尺寸變化後是否重新測量？
- observer、timer 或 event listener 是否在卸載時清理？
- 文件、examples、runtime 是否對 `suffix`、`expandable` 等能力說法一致？

## 7. 格式化能力

- 原始值允許哪些型別？
- 日期、時間戳、字串如何解析？
- 數字格式化是否依賴第三方套件？
- 格式化結果是否需要事件回報或實例方法取得？
- 相對時間是否需要 timer，以及 interval 是否可關閉？
- locale 是否由 mixin 或全域配置提供？

## 8. slots 與 events

- slots 是否只暴露使用者需要的狀態？
- slot props 是否有型別宣告？
- event 名稱是否能表達生命週期，而不是只叫 `change`？
- event payload 是否足夠但不洩漏內部細節？
- Vue template 事件名和 `.d.ts` 的 `onOnXxx` 宣告是否一致？

## 9. 全域配置

- 哪些預設值可以從 `$VIEWUI` 讀取？
- 本地 prop 是否能覆蓋全域配置？
- 合併配置時是否保留未指定的預設值？
- 全域配置是否只影響未來 render，還是會動態改變現有元件？
- 測試中是否需要重置全域配置？

## 10. 型別與文件核對

- runtime props 是否在 `.d.ts` 中存在？
- prop 名稱是否符合 kebab-case 使用方式？
- events 是否完整宣告？
- slots 是否和 template/render 實際一致？
- examples 是否使用了未完整實作或未宣告的 API？
- 第三方依賴回傳值是否有合理型別？

## 常見漂移點

閱讀 View UI Plus 這章時，特別要記錄：

- Typography `ellipsisConfig` 有 `suffix`、`expandable`、`symbol` 預設值，但主要渲染邏輯被註解。
- examples 中可能出現超出 `.d.ts` 宣告的標題層級。
- WordCount runtime 使用 `value`，但 `.d.ts` 宣告為 `model-value`。
- Numeral 的 `getValue()` 是否在型別中有對應宣告，需要額外核對。

## 設計檢查流程

仿寫文字類元件時，可以依序檢查：

```txt
語意 tag
  -> 內容來源
  -> 修飾與狀態
  -> copy / edit / ellipsis 是否需要
  -> Tooltip / Input / Circle 等依賴邊界
  -> slots / events
  -> 全域配置
  -> runtime 與 .d.ts
  -> 清理 timer / observer
```

## 複習題

1. 文字類元件為什麼要先決定語意，再決定樣式？
2. copy、edit、ellipsis 三種能力最容易互相干擾的地方是什麼？
3. 省略能力為什麼一定要檢查清理邏輯？
4. 全域配置和本地 prop 的優先順序應該如何設計？
5. runtime、examples、`.d.ts` 不一致時，筆記應該保留哪些證據？
