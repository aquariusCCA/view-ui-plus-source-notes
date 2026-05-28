# 仿寫後重構手冊

仿寫的第一步是做出最小版本，第二步才是重構。過早抽象會讓練習變得難懂；完全不重構又會錯過元件庫最重要的工程能力。

## 練習目標

- 學會判斷什麼時候該抽 composable。
- 學會判斷什麼時候該抽 utils。
- 學會把共用型別從元件中移出。
- 學會整理樣式模式。
- 學會保留行為不變的重構流程。

## 對照源碼

主要對照：

- `src/hooks/`
- `src/utils/`
- `src/components/*/composables`
- `src/styles/mixins/`
- `types/`
- `05-shared-logic/`

閱讀時關注：

- 哪些邏輯被抽成 hook。
- 哪些只是普通 util。
- 哪些型別被導出給使用者。
- 樣式 mixin 解決的是重複還是語意。

## 最小實作範圍

這篇不要求一次建立完整共用層，而是針對前面 Mini 元件做小步重構。每次只選一種重構目標：

- 抽出一個 composable。
- 抽出一個純 util。
- 抽出一組對外型別。
- 抽出一個樣式 mixin 或變數。
- 整理一個重複的 class 命名規則。

先不做跨套件架構重整、不改公開 API、不改檔案命名規則，也不為只有單一使用點的邏輯建立抽象。

## API 設計

重構後的共用 API 要保持小而清楚：

| 類型 | 命名範例 | 設計要求 |
| --- | --- | --- |
| composable | `useOptions`、`useClickOutside` | 回傳值少，依賴 Vue 狀態或生命週期 |
| util | `formatSize`、`toArray` | 純函式，不讀寫 DOM，不 emit |
| type | `MiniTableColumn`、`MiniFormRule` | 使用者會手寫或匯入時才導出 |
| mixin | `focus-ring`、`disabled` | 解決穩定重複樣式，不改 class 契約 |

所有重構都必須維持原元件的 props、emits、slots、expose 不變。

## 重構時機

可以重構的訊號：

- 同一段 class 計算出現在 3 個以上元件。
- 多個元件都有 disabled/loading/focused 狀態處理。
- 多個元件都需要點擊外部關閉。
- Form、Select、Table 中出現可獨立測試的資料轉換。
- 型別在多個檔案被複製。
- 樣式中重複出現同一組尺寸、顏色或狀態。

不要重構的訊號：

- 只有一個元件使用。
- 抽出後命名比原邏輯更難懂。
- 抽象需要傳入太多參數。
- 只是為了讓程式碼看起來更進階。
- 行為還沒有驗收案例保護。

## Composable 抽取

適合抽成 composable 的邏輯通常和 Vue 響應式或生命週期有關。

候選案例：

| composable | 適用元件 | 內容 |
| --- | --- | --- |
| `useMergedSize` | Button、Input、Tag、Avatar | 合併自身 props、group context、預設值 |
| `useFormField` | Input、Select | 觸發 FormItem 驗證 |
| `useClickOutside` | Select、Modal、Dropdown | 點擊外部關閉 |
| `useOptions` | Select、Cascader、TreeSelect | option 註冊與查詢 |
| `useZIndex` | Modal、Message、Tooltip | 浮層層級 |

抽取原則：

- composable 回傳值要少。
- composable 不應知道特定元件的 class 名稱。
- composable 名稱描述行為，不描述 UI。
- composable 要能用簡單案例驗收。

## Utils 抽取

適合抽成 utils 的邏輯通常不依賴 Vue。

候選案例：

| util | 適用元件 | 內容 |
| --- | --- | --- |
| `isEmptyValue` | Form、Input、Select | 判斷 required 是否為空 |
| `getValueByPath` | Form、Table | 從物件路徑取值 |
| `toArray` | Select、CheckboxGroup | 把值正規化為陣列 |
| `formatSize` | Icon、Avatar | 數字轉 px，字串保留 |
| `omitUndefined` | 全部 | 清理物件中的 undefined |

抽取原則：

- util 必須是純函式。
- util 不應讀寫 DOM。
- util 不應 emit 事件。
- util 要有輸入輸出範例。

## 型別整理

當資料結構被外部使用者傳入，應該優先整理型別。

應抽出的型別：

- `MiniFormRule`
- `MiniTableColumn`
- `MiniMessageType`
- `MiniMessageHandle`
- `MiniSelectValue`
- `MiniSize`
- `MiniStatus`

型別整理原則：

- 對外型別放在穩定入口。
- 元件內部型別可以留在元件檔附近。
- 不要為每個小變數都建立型別別名。
- 使用者會手寫的資料結構才值得導出。

## 樣式重構

樣式重構先從變數與 mixin 開始，不要急著做主題系統。

可以抽出的樣式：

- disabled 狀態。
- focus ring。
- ellipsis。
- size map。
- color map。
- overlay shadow。
- close icon hover。

樣式重構原則：

- class 名稱不因重構改變。
- mixin 只處理重複且穩定的樣式。
- 變數命名描述語意，不描述顏色值。
- 元件特有樣式仍留在元件檔。

## 實作步驟

1. 先補驗收案例，記錄目前行為。
2. 找出重複邏輯，確認至少兩到三處真的相同。
3. 抽出最小 composable、util、type 或 mixin。
4. 回到原元件替換，但不改公開 API。
5. 重新跑驗收案例。
6. 在筆記中記錄重構前後差異。

## 驗收案例

- 重構後所有原本範例仍能運作。
- public props、emits、slots、expose 沒有改名。
- 抽出的 composable 不依賴單一元件 class。
- 抽出的 util 可以用純輸入輸出測試。
- 樣式重構不改變使用者需要寫的 class。

## 源碼反思

View UI Plus 的共用邏輯不是為了漂亮而抽象，而是為了大量元件長期維護。仿寫版也應該遵守同一個原則：只有當重複、語意與測試都足夠明確時，才抽出共用層。

重構的目標不是讓程式碼變短，而是讓下一個元件更容易正確實作。
