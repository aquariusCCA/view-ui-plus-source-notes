# 邊界條件、回歸與 bugfix 測試設計

## 學習目標

這篇整理如何從 bug、特殊資料、狀態切換和使用者回報中設計回歸測試。重點不是堆很多案例，而是把最容易再次出錯的行為變成精準測試。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/select.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/date-picker.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/table.spec.js`
- `01-origin/source/view-ui-plus-v1.3.20/test/unit/specs/assets/locale-expects.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/util.js`

## 邊界測試的來源

元件庫邊界案例通常來自：

- 使用者 issue。
- bugfix commit。
- props 組合。
- 空值和非法值。
- 特殊字元。
- 大量資料。
- locale。
- 重置流程。
- 動態 props。
- 多 instance 同時存在。

好的回歸測試應該能一句話描述：「曾經 X 情況下會壞，現在要保證它不再壞」。

## Select 特殊字元

Select 測試中有兩個特殊字元案例：

- option label 是 `> 100$`。
- option label 是 `< 100$`。

這看起來很小，但對 UI 元件庫很重要。因為 label 可能被當成 HTML、文字、filter query 或 input value。測這個案例能守住：

- 顯示時不要被當 HTML 解析。
- filterable input 要保留原字串。
- 文字比較不能因特殊符號失真。

這類邊界不需要很多，但要選真實使用者可能遇到的值。

## DatePicker 空值與重置

DatePicker 測試覆蓋：

- `v-model` 是空字串。
- clear 後 `on-change` 要觸發。
- clear 後顯示值要清空。
- reset 後再次選 range，結果要和第一次一致。

日期元件的 bug 常出現在狀態清理不完整：

- display value 清了，但 internalValue 沒清。
- visible 關了，但 panel 狀態沒回初始。
- range 第一個日期殘留。
- type 切換後 selectionMode 沒同步。

所以日期元件的回歸測試應該特別重視 reset / clear / type change。

## Locale 回歸

DatePicker 測試用 `locale-expects.js` 驗證多語 label 格式，涵蓋：

- `de-DE`
- `en-US`
- `es-ES`
- `fi-FI`
- `fr-FR`
- `id-ID`
- `ja-JP`
- `ko-KR`
- `pt-BR`
- `pt-PT`
- `ru-RU`
- `sv-SE`
- `tr-TR`
- `vi-VN`
- `zh-CN`
- `zh-TW`

這種測試適合放在資料表驅動模式中。locale 不應每個語言寫一個 spec，而是用同一套規則跑多組資料。

## Table CSV 特殊資料

Table CSV 測試包含逗號和換行。這些是 CSV 最典型的邊界：

- 分隔符和資料內容衝突。
- 換行造成列數錯誤。
- quoted 模式要保護內容。
- 自訂 separator 要生效。

這種測試的價值在於它直接對應真實資料匯出問題。只測 simple data 會讓 CSV export 看起來正常，但一遇到使用者輸入逗號就壞。

## 多 instance 回歸

Select 測試有兩個 multiple Select 同時存在的案例。它驗證：

- A 選取後不影響 B。
- B 選取多個後不改 A。
- 各自 tag 顯示正確。

多 instance 問題是元件庫常見回歸來源，尤其元件內部如果使用 module-level 變數、全域 event listener、共享 cache，就容易互相污染。

## 從 bugfix 推測測試

遇到 bugfix 時，可以用這個格式設計回歸測試：

1. bug 條件：需要哪些 props、資料、事件順序。
2. bug 行為：以前出現什麼錯誤。
3. 修正後契約：現在應該保持什麼結果。
4. 最小重現：移除和 bug 無關的 DOM、樣式、資料。
5. 反向斷言：確認錯誤狀態不再出現。

測試名稱應該直接說明情境，例如：

- `should keep independent values across multiple select instances`
- `should fire on-change when resetting value`
- `should export data with commas and line breaks to CSV`

好的測試名稱就是 bug 的短版說明。

## 設計啟發

邊界和回歸測試不必追求全部排列組合。更實用的是建立高風險清單：

- 空值。
- 特殊字元。
- 延遲資料。
- 重置後再操作。
- props 動態切換。
- 多 instance。
- locale。
- 大量資料。
- 服務建立和銷毀。

每個複雜元件至少覆蓋其中幾種，測試價值會比只測預設渲染高很多。

## 複習題

1. 好的回歸測試應該能用哪一句話描述？
2. Select 的 `< 100$` 案例守住了什麼風險？
3. DatePicker 為什麼要測 reset 後再次選取？
4. CSV export 為什麼要測逗號和換行？
5. 多 instance 測試能抓到哪些架構問題？
