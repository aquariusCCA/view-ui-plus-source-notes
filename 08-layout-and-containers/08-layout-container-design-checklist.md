# 版面與容器元件設計檢查清單

## 學習目標

這篇把本章分析整理成檢查清單。未來仿寫 Grid、Layout、Card、Collapse、Space 這類版面與容器元件時，可以用這份清單檢查父子通訊、slot 包裝、class/style 分工、DOM 測量、響應式行為與型別宣告是否一致。

## 1. 元件定位

設計前先回答：

| 問題 | 判斷 |
| --- | --- |
| 它是格線、頁框、內容容器、狀態容器，還是間距容器？ | 決定 API 主要描述的是排列、結構還是狀態 |
| 子元件是否需要讀父元件設定？ | 例如 `Col`、`GridItem`、`Panel` |
| 子內容是否需要被包裝？ | 例如 `Card` head/body、`Space` item |
| 是否需要 DOM 測量或 window 事件？ | 例如 `GridItem` square、`Sider` breakpoint |
| 是否應該由父層集中配置？ | 例如 `Grid` 的 `col`、`padding` |

容器元件的 API 不應只看單一元件，要一起看父子組合後的使用方式。

## 2. 父子通訊檢查

當元件需要父子協作時，先決定通訊方向：

| 模式 | 適用情境 | 例子 |
| --- | --- | --- |
| 父層提供設定 | 子層只讀取父層配置 | `Row` -> `Col` 的 `gutter` |
| 父層提供狀態與方法 | 子層需要查詢和觸發更新 | `Collapse` -> `Panel` |
| 父層集中配置，子層零 props | 所有 item 規格一致 | `Grid` -> `GridItem` |
| slot 結構推導狀態 | 父層根據子內容調整 class | `Layout` 偵測 `Sider` |

使用 `provide/inject` 時要檢查：

| 檢查項 | 說明 |
| --- | --- |
| inject 名稱是否清楚 | 例如 `RowInstance`、`GridInstance` |
| 子層是否依賴父層必定存在 | 若單獨使用子層會不會報錯 |
| 父層提供的是資料、方法，還是整個 instance | 提供整個 instance 彈性高，但耦合也高 |
| 是否需要處理動態新增/移除子項 | `Panel` 的 index fallback 對動態重排較弱 |

## 3. Props 檢查

容器元件的 props 要避免過度細碎，應該描述使用者的排版意圖：

| 類型 | 建議 |
| --- | --- |
| 有限變體 | 用 validator 和 union type，例如 `direction`、`align`、`breakpoint` |
| 動態尺寸 | 用 number 或 string，再轉 inline style，例如 `padding`、`width`、`flex` |
| 結構開關 | 用 Boolean，例如 `border`、`hover`、`simple`、`wrap` |
| 受控狀態 | 用 `modelValue` + `update:modelValue` |
| 初始狀態 | 用 `default*`，不要和受控狀態混在一起 |

完成後，要能畫出：

```txt
props -> computed -> class/style -> DOM structure -> layout result
```

## 4. Slots 檢查

容器元件常把 slot 當成主要 API。檢查時不要只列 slot 名稱，還要確認規則：

| 檢查項 | 例子 |
| --- | --- |
| default slot 是否會被包裝 | `Space` 包成 `ivu-space-item` |
| slot presence 是否決定 DOM 是否渲染 | `Card` 的 `title`、`extra` |
| 具名 slot 是否覆蓋 props fallback | `Card` 的 `title` slot 覆蓋 `title` prop |
| slot 是否插在項目之間 | `Space` 的 `split` slot |
| slot 是否要寫進 `.d.ts` | `trigger`、`content`、`extra` 都應該宣告 |

slot 一旦影響 DOM 結構，就不是內部細節，而是公開契約。

## 5. Class 與 Style 檢查

class 和 inline style 要有穩定分工：

| 狀態 | 建議 |
| --- | --- |
| 設計系統內固定狀態 | class，例如 `ivu-card-shadow`、`ivu-collapse-simple` |
| 預先產生的格線欄位 | class，例如 `ivu-col-span-12` |
| 任意尺寸 | inline style，例如 `Sider.width`、`Card.padding` |
| DOM 測量結果 | inline style，例如 `GridItem.height` |
| gap 或 flex 值 | inline style，例如 `Space.gap`、`Col.flex` |

檢查 class 命名是否符合：

```txt
ivu-component
ivu-component-state
ivu-component-part
ivu-component-modifier
```

容器元件常有 part class，例如 `ivu-card-head`、`ivu-card-body`、`ivu-space-item`，這些 class 會成為使用者覆蓋樣式時的重要入口。

## 6. DOM 測量與事件檢查

只要元件碰到 DOM 或全域事件，就要額外檢查生命週期：

| 檢查項 | 說明 |
| --- | --- |
| 是否只在 mounted 後讀 DOM | ref 在 mounted 前不可依賴 |
| resize 是否節流 | `Grid` 使用 throttle |
| window listener 是否清理 | `Sider` 在 `beforeUnmount` 移除 resize |
| 外部 observer 是否清理 | `Grid` 移除 element resize listener |
| SSR 或非瀏覽器環境是否保護 | `Sider` 使用 `isClient` |

DOM 測量結果應該盡量收斂成少量 state，再由 computed style 使用，避免 template 直接塞複雜測量邏輯。

## 7. 狀態與事件檢查

狀態容器要先定義外部格式和內部格式：

| 檢查項 | 說明 |
| --- | --- |
| 外部是否使用 `v-model` | 例如 `Collapse`、`Sider` |
| 是否需要內部 mirror state | `Collapse.currentValue` |
| 是否要正規化資料 | active key 轉字串陣列 |
| 事件 payload 是否穩定 | `on-change` 固定回傳陣列 |
| 子層是否只呼叫父層方法 | `Panel` 不直接操作 active 陣列 |

如果元件同時有「使用者操作」和「環境事件」會更新狀態，要明確記錄來源。例如 `Sider` 的狀態可能來自 trigger click，也可能來自 breakpoint match。

## 8. Runtime 與 Type 檢查

完成元件或閱讀筆記時，要對照：

| 檢查項 | 常見問題 |
| --- | --- |
| props 型別是否一致 | runtime 支援 string，但 d.ts 只寫 number |
| union 是否一致 | validator 和 union type 是否同一組值 |
| kebab-case 是否對應 | `collapsedWidth` vs `'collapsed-width'` |
| emits 是否對應 | `on-change` vs `onOnChange` |
| slots 是否完整 | `trigger`、`split`、`content` 是否出現在型別中 |
| 子元件是否共用型別檔 | `Col` 宣告在 `types/row.d.ts` |

本章值得特別記錄的漂移案例：

| 元件 | 差異 |
| --- | --- |
| `Row` | runtime 有 `type`，型別未宣告 |
| `Col` | runtime 響應式 props 支援 number/object，型別寫 string/object |
| `Sider` | runtime `width` 支援 number/string，型別只寫 number |
| `Collapse` | runtime `modelValue` 支援 Array/String，型別只寫 array |
| `Space` | runtime `size` 支援尺寸陣列，型別只寫 `[]` |

這些差異不一定代表程式錯，但對元件庫維護者來說都是需要追蹤的 API 風險。

## 最小仿寫流程

仿寫一個版面或容器元件時，可以照這個順序：

1. 寫出使用者會如何組合父子元件。
2. 決定父層 props、子層 props、slot 和事件。
3. 決定是否需要 `provide/inject`，以及提供資料還是方法。
4. 設計 DOM 結構和 part class。
5. 決定哪些狀態用 class，哪些用 inline style。
6. 補上 slot fallback 和 slot presence 規則。
7. 若有 DOM 測量或全域事件，補上 mounted 和 cleanup。
8. 補上 `.d.ts`，對照 runtime props、events、slots。
9. 用典型場景檢查巢狀、空內容、動態狀態和響應式行為。

## 複習題

1. 容器元件為什麼常需要同時看父元件和子元件？
2. 哪些情境適合讓父層集中配置，而不是每個子層各自傳 props？
3. slot presence 改變 DOM 時，為什麼應該視為公開契約？
4. 什麼狀態適合用 class，什麼狀態適合用 inline style？
5. 本章有哪些 runtime 和 `.d.ts` 不一致的案例？
