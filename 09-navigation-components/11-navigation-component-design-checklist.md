# 導航元件設計檢查清單

## 學習目標

這篇把本章分析整理成檢查清單。未來仿寫 Menu、Tabs、Breadcrumb、Page、Anchor、Dropdown、Steps、PageHeader 這類導航元件時，可以用這份清單檢查狀態、父子協作、事件、連結、浮層、DOM 測量、slot 與型別宣告是否完整。

## 1. 元件定位

設計前先回答：

| 問題 | 判斷 |
| --- | --- |
| 它管理的是頁面位置、選單位置、頁籤位置、資料頁碼、流程進度還是命令入口？ | 決定主要狀態命名 |
| 是否有子元件？ | 決定是否需要 provide/inject 或註冊清單 |
| 是否需要和 router/hash 互動？ | 決定 link 行為和事件順序 |
| 是否需要浮層？ | 決定 trigger、transfer、click outside |
| 是否需要 DOM 測量或 scroll listener？ | 決定 mounted、cleanup、SSR 保護 |

導航元件最重要的是狀態語意。先定義「目前在哪裡」，再設計 props 和事件。

## 2. 狀態檢查

| 檢查項 | 說明 |
| --- | --- |
| 外部狀態名稱是否清楚 | `activeName`、`modelValue`、`current`、`openNames` |
| 內部 mirror state 是否必要 | `currentActiveName`、`activeKey`、`currentPage` |
| prop 變化是否同步到內部 | watch 是否完整 |
| 內部變化是否 emit 給外部 | `update:modelValue` 或語意事件 |
| disabled 時是否阻止所有入口 | click、keyboard、dropdown item、page jumper |

若元件同時有多個狀態來源，例如 click、route、scroll，要明確規定優先順序，避免互相覆蓋。

## 3. 父子協作檢查

| 檢查項 | 說明 |
| --- | --- |
| 父層是否 provide 必要 instance | 只提供子層真正需要的狀態與方法 |
| 子層是否註冊與移除 | mounted/beforeMount 加入，beforeUnmount 移除 |
| 子層順序是否重要 | Tabs、Steps、Anchor 都依賴順序或 offset |
| 動態渲染是否穩定 | v-if、v-for、移除子項時不留下 stale instance |
| 巢狀場景是否支援 | Menu、Tabs、Dropdown 需要額外處理 |

如果父層需要批次更新所有子項，不要讓每個子項各自猜狀態，應由父層統一管理。

## 4. Link 與 Trigger 檢查

| 類型 | 要檢查 |
| --- | --- |
| router link | `to`、`replace`、`target`、ctrl/meta click、新視窗 |
| hash link | URL hash、router push、window location、scroll offset |
| hover | enter/leave 延遲、父子浮層移動時是否閃爍 |
| click | click outside、stop propagation、巢狀關閉 |
| custom | 內部是否完全尊重外部 visible |
| keyboard | 焦點、Enter、方向鍵、非法輸入 |

不要把「點擊後去哪裡」和「點擊後是否 active」視為同一件事。新視窗、disabled、外部路由守衛都可能改變結果。

## 5. Props 檢查

| 類型 | 建議 |
| --- | --- |
| 有限選項 | runtime validator 與 TypeScript union 同步 |
| 位置狀態 | 名稱使用 active/current/open/selected |
| 外觀變體 | `type`、`theme`、`size`、`direction` 用 class 消化 |
| 受控值 | 使用 `modelValue` 和 `update:modelValue` |
| 浮層設定 | 清楚傳到底層 Popper/Drop |
| 自訂區塊 | prop 提供簡單文字，slot 提供複雜內容 |

完成後要能寫出：

```txt
props -> internal state -> computed class/style -> DOM -> emits
```

## 6. Events 檢查

| 檢查項 | 說明 |
| --- | --- |
| 事件命名是否描述使用者行為 | select、click、change、remove、back |
| payload 是否穩定 | name、href、page、pageSize、tab item |
| 受控事件是否存在 | `update:modelValue` |
| 阻止條件是否一致 | disabled、transitioning、custom trigger |
| 事件是否重複觸發 | prev/next 是否同時觸發 change 是刻意設計 |

事件是使用者真正接入業務邏輯的地方，筆記和型別要記清楚 payload。

## 7. Slots 檢查

| 檢查項 | 例子 |
| --- | --- |
| default slot 是否承載子元件 | Menu、Tabs、Steps、Anchor |
| 具名 slot 是否覆蓋 prop | title、content、icon、action、extra |
| slot presence 是否改變 DOM | Breadcrumb separator、PageHeader breadcrumb |
| slot 是否需要型別宣告 | `contextMenu`、`breadcrumb`、`separator` |
| fallback 優先順序是否清楚 | slot > prop > default icon/text |

slot 如果會改變可見結構，就不是內部細節。

## 8. DOM 與生命週期檢查

| 檢查項 | 說明 |
| --- | --- |
| 是否只在 mounted 後讀 DOM | offsetWidth、offsetTop、querySelector |
| scroll 或 resize listener 是否清理 | beforeUnmount 移除 |
| 隱藏容器是否需要補更新 | Tabs 使用 MutationObserver |
| 動畫期間是否避免狀態競爭 | Anchor 的 `animating` |
| SSR 是否保護 | 使用 `isClient` 或放寬 HTMLElement runtime type |

只要元件讀 DOM，就要把初始化、更新與清理都寫進設計。

## 9. Class 與 Style 檢查

| 狀態 | 建議 |
| --- | --- |
| active/opened/disabled/selected/focused | class |
| type/theme/size/direction/status | class |
| 任意寬度、縮排、bar offset、ink top | inline style |
| transfer 浮層 | 額外 class |
| DOM 測量結果 | inline style |

導航元件的 class 通常也是測試與覆蓋樣式的重要契約，不能隨意改名。

## 10. Runtime 與型別檢查

逐項核對：

| 檢查項 | 常見問題 |
| --- | --- |
| validator 和 union type | runtime 收窄但型別寬鬆 |
| runtime 支援型別 | runtime 支援 number，型別只寫 string |
| required props | runtime required，型別寫可選 |
| emits | runtime emits 有，型別未列 |
| slots | runtime slot 有，型別未列或掛錯元件 |
| mixin props | props 來自 mixin，容易被漏記 |

型別漂移會直接影響使用者 IDE 體驗，是元件庫維護時要優先補齊的內容。

## 最小仿寫流程

1. 寫出使用者會如何宣告導航結構。
2. 定義目前位置狀態和外部控制方式。
3. 決定是否需要父子註冊、註冊時機與移除時機。
4. 設計 click、hover、keyboard、scroll 或 route 的事件流。
5. 設計 class/style 分工與 DOM 結構。
6. 補上 slot fallback 和 prop fallback。
7. 若有 DOM 測量、浮層或 listener，補 mounted 與 cleanup。
8. 補 `.d.ts`，核對 props、emits、slots、payload。
9. 用 disabled、巢狀、動態移除、外部受控、空資料與邊界頁碼測一輪。

## 複習題

1. 仿寫導航元件時，第一個要定義的狀態是什麼？
2. 哪些情境需要把子元件 instance 註冊到父層？
3. 為什麼 DOM listener 和浮層元件一定要檢查 cleanup？
4. 事件 payload 和 TypeScript 型別不一致會造成什麼問題？
5. 如何判斷一個 slot 是公開 API 而不是內部實作？
