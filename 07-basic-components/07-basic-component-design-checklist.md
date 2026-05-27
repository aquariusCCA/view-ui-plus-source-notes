# 基礎元件設計檢查清單

## 學習目標

這篇把前面分析整理成檢查清單。未來仿寫 Button、Icon、Divider、Tag、Badge、Avatar 這類基礎元件時，可以用這份清單檢查 API 是否穩定、runtime 是否清楚、型別是否對齊、樣式狀態是否可維護。

## 1. 元件定位

設計前先回答：

| 問題 | 判斷 |
| --- | --- |
| 它是視覺原子、行動入口，還是狀態展示？ | 決定 API 複雜度 |
| 它是否需要持有內部狀態？ | 例如 Tag 的 `isChecked` |
| 它是否只是包裝內容？ | 例如 ButtonGroup、Divider |
| 它是否會被其他元件依賴？ | 例如 Icon 被 Button、Tag、Avatar 使用 |

如果元件會被大量依賴，API 應該更保守，避免暴露太多內部細節。

## 2. Props 檢查

檢查每個 prop：

| 檢查項 | 說明 |
| --- | --- |
| 名稱是否描述使用者意圖 | 例如 `loading` 比 `showLoadingIcon` 更穩定 |
| 預設值是否合理 | 預設狀態應該是最常見、最安全的狀態 |
| 可選值是否有限 | 有限值應使用 validator 和 union type |
| Boolean 是否單一語意 | 不要讓一個 Boolean 同時控制多個不相關行為 |
| 是否需要支援自訂值 | 顏色、尺寸、offset 可能需要開放 |
| 是否接全域設定 | 尺寸類 prop 可能需要讀 `$VIEWUI.size` |

完成後，要能畫出：

```txt
props -> computed -> template/render -> class/style -> visual result
```

## 3. Slots 檢查

檢查 slot 時不要只記名稱，還要記規則：

| 檢查項 | 說明 |
| --- | --- |
| default slot 是主要內容還是 fallback？ | Button 是主要內容，Avatar 是 fallback |
| slot presence 是否改變 class？ | Divider、Button、Badge 都有這種模式 |
| 具名 slot 是否覆蓋 props？ | Badge 的 `count` slot 會覆蓋 count 顯示 |
| 多個內容來源是否有優先順序？ | Avatar 是 `src -> icon -> slot` |
| d.ts 是否描述 slot？ | 有具名 slot 時應該檢查 `v-slots` |

slot 一旦被使用者依賴，就是公開契約。不要把 slot 當成單純模板細節。

## 4. Events 檢查

基礎元件的事件應該少而穩定：

| 檢查項 | 說明 |
| --- | --- |
| 事件名稱是否符合元件庫風格 | View UI Plus 常見 `on-*`，Button 使用 `click` |
| payload 是否足夠 | Tag 帶 `name` 方便列表場景 |
| payload 是否過度暴露 | 不應暴露內部 class、DOM 測量等細節 |
| d.ts 是否對應 | `on-close` 會在型別中變成 `onOnClose` |
| 是否需要阻止冒泡 | Tag close icon 使用 `@click.stop` |

事件設計的目標是讓使用者處理結果，而不是依賴元件內部流程。

## 5. Class 與 Style 檢查

class 和 inline style 要有清楚分工：

| 狀態 | 建議 |
| --- | --- |
| 設計系統內的固定變體 | class，例如 `ivu-btn-primary` |
| 有限尺寸 | class，例如 `ivu-avatar-small` |
| 任意尺寸 | inline style，例如數字 avatar size |
| 任意顏色 | inline style，例如自訂 Tag/Badge color |
| DOM 測量結果 | inline style，例如 Avatar 文字縮放 |

class 命名應維持同一個前綴：

```txt
ivu-component
ivu-component-variant
ivu-component-state
ivu-component-part
```

這樣 less、DevTools、文件說明與使用者覆蓋樣式都比較穩定。

## 6. Runtime 與 Type 檢查

每個元件完成後，要對照：

| 檢查項 | 常見問題 |
| --- | --- |
| props 是否漏宣告 | runtime 有 prop，但 d.ts 沒有 |
| union 是否一致 | validator 和 d.ts 可選值不同 |
| camelCase/kebab-case 是否對應 | `customIcon` vs `'custom-icon'` |
| emits 是否對應 | `emits: ['on-error']` vs `onOnError` |
| slots 是否對應 | 具名 slot 是否出現在 `v-slots` |
| 自訂值是否被型別允許 | runtime 支援任意 color，但 d.ts 收窄過度 |

型別不是附屬品。對元件庫來說，`.d.ts` 是使用者每天接觸 API 的入口。

## 7. 可維護性檢查

最後看維護面：

| 檢查項 | 說明 |
| --- | --- |
| 是否能用一眼看懂的 computed 表達狀態 | 避免 template 塞滿複雜條件 |
| 是否把共用行為抽出去 | Button 的 link 行為不應每個元件重寫 |
| 是否避免過度抽象 | Icon 這種薄元件不需要額外 composable |
| 是否有清楚 fallback | Avatar、Badge 都需要明確顯示規則 |
| 是否能被複雜元件重用 | Button、Icon 的 API 要足夠穩定 |

## 最小仿寫流程

仿寫一個基礎元件時，可以照這個順序：

1. 寫出使用者 API 表：props、events、slots。
2. 決定 DOM 結構與 fallback 優先順序。
3. 設計 `prefixCls` 和 class 狀態。
4. 決定哪些值用 inline style。
5. 補上 runtime validator/default。
6. 補上 `.d.ts` 並對照 runtime。
7. 用幾個典型場景檢查畫面與事件。

## 複習題

1. 設計一個基礎元件前，為什麼要先判斷它的角色？
2. 哪些 props 應該使用 validator？
3. 為什麼具名 slot 應該寫進型別？
4. runtime 支援自訂色，但型別只允許預設色，會造成什麼問題？
5. Button、Icon、Divider、Tag、Badge、Avatar 各自最值得借鑑的設計點是什麼？
