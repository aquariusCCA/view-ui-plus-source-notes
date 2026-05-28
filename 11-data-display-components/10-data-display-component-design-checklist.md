# 資料展示元件設計檢查清單

## 學習目標

這篇把本章分析整理成檢查清單。未來仿寫 Table、Tree、List、Timeline、Image、Skeleton、Progress 這類資料展示元件時，可以用這份清單檢查資料來源、派生資料、狀態、事件、slots、DOM 依賴、空狀態與型別宣告是否完整。

## 1. 元件定位

設計前先回答：

| 問題 | 判斷 |
| --- | --- |
| 它展示的是表格、列表、樹、時間序列、圖片、進度還是結果？ | 決定主要資料模型 |
| 資料由 prop 還是 slot 提供？ | 決定是否需要 data API |
| 是否需要排序、篩選、選取、展開？ | 決定派生資料與事件 |
| 是否需要空狀態、載入中、錯誤狀態？ | 決定 fallback UI |
| 是否需要自訂 cell、item、node 或 marker？ | 決定 slots/render function |
| 是否需要 DOM 測量、捲動或浮層？ | 決定 lifecycle 與 cleanup |

先定義資料模型，再定義顯示狀態。

## 2. 資料模型檢查

| 檢查項 | 說明 |
| --- | --- |
| 原始資料是否保持乾淨 | 不要把所有 UI 狀態直接塞回原資料 |
| 是否需要派生資料 | sort/filter/tree flatten/summary 都需要 |
| 是否需要穩定 key | Table tree、Tree node、List item 都要 |
| 是否需要保留原始索引 | sort/filter 後事件仍要能回原資料 |
| 是否支援巢狀資料 | childrenKey、rowKey、parent relation 要清楚 |

完成後要能寫出：

```txt
source data -> derived data -> rendered data -> event payload
```

## 3. 狀態檢查

| 檢查項 | 說明 |
| --- | --- |
| 選中狀態放在哪裡 | selected、checked、selection、highlight |
| 展開狀態放在哪裡 | expanded、showChildren、pending |
| 載入狀態是否分層 | 整體 loading、節點 loading、圖片 loading |
| 錯誤狀態是否可自訂 | Image error、Result type、empty text |
| 狀態是否可由外部初始化 | `_checked`、`_expanded`、`checked`、`selected` |
| 狀態變化是否 emit | 業務是否需要同步 |

狀態要避免互相污染。例如圖片載入失敗不等於整個列表空資料，節點 loading 不等於整棵 Tree loading。

## 4. Events 檢查

| 檢查項 | 說明 |
| --- | --- |
| 事件名稱是否描述使用者行為 | select、check、expand、sort、filter、load、error |
| payload 是否能定位資料 | row、column、node、key、index、position |
| sort/filter 是否區分本地與遠端 | custom/remote 模式只 emit，不改資料 |
| 右鍵或浮層事件是否帶 DOM event | contextmenu 需要 event 和 position |
| 是否避免重複觸發 | select/change、load/error、preview click |

資料展示事件通常是業務入口，payload 要比基礎元件更完整。

## 5. Slots 與 Render 檢查

| 檢查項 | 適用元件 |
| --- | --- |
| default slot 是否承載 item 或內容 | List、Timeline、Result、Circle |
| named slot 是否覆蓋固定區域 | Table header/footer、Image placeholder、Result actions |
| cell/node 是否需要 render function | Table、Tree |
| slot props 是否完整 | row、column、index、node、data |
| slot presence 是否影響 class | Timeline dot、List header/footer |
| 型別是否列出所有 slots | 對照 runtime 和 `.d.ts` |

只要 slot 能改變資料展示結果，就不是內部細節。

## 6. 空狀態與載入檢查

| 檢查項 | 說明 |
| --- | --- |
| 空資料文字是否可覆蓋 | `emptyText`、`noDataText` |
| 篩選後空資料是否分開 | Table 的 no filtered data |
| loading 是覆蓋還是替代 | Spin 覆蓋，Skeleton 替代 |
| 錯誤狀態是否有 slot | Image error |
| 非同步節點是否有 loading | Tree、Table tree data |

空狀態、載入中和錯誤狀態要分開，否則使用者無法判斷資料是不存在、還在載入，還是載入失敗。

## 7. DOM 與生命週期檢查

| 檢查項 | 說明 |
| --- | --- |
| 是否只在 mounted 後讀 DOM | offset、range、bounding rect |
| resize listener 是否清理 | Table |
| observer 是否 disconnect | Image IntersectionObserver |
| document mouse listener 是否清理 | 欄寬拖曳 |
| scroll sync 是否避免循環 | Table header/body/fixed/summary |
| SSR 是否保護 | 使用 `isClient` 或延後到 mounted |

資料展示元件常因為表格寬度、圖片載入、文字縮放和浮層位置讀 DOM。每個 DOM 依賴都要有初始化、更新與清理策略。

## 8. Props 與樣式檢查

| 檢查項 | 說明 |
| --- | --- |
| 有限值是否有 validator | size、status、fit、type |
| 自訂顏色是否走 inline style | Tag、Progress、Circle、Timeline |
| 尺寸是否支援 number/string | width、height、strokeWidth |
| class 是否表達狀態 | selected、expanded、loading、error |
| inline style 是否只放動態值 | width、height、dashoffset、position |

樣式契約要穩定，因為資料展示元件常被業務系統覆蓋樣式。

## 9. Runtime 與型別檢查

逐項核對：

| 檢查項 | 常見問題 |
| --- | --- |
| props | runtime 支援但型別漏列 |
| events | payload 具體但型別寫 any |
| slots | runtime slot 名稱和型別 slot 名稱不同 |
| render params | runtime 傳完整物件，型別只寫 Function |
| instance methods | runtime 有方法，型別沒有暴露 |
| validator vs union | runtime 收窄但型別過寬 |

資料展示元件 API 面積通常很大，型別漂移會直接影響使用者能不能正確使用。

## 最小仿寫流程

1. 定義資料來源：prop、slot、單值狀態或混合。
2. 定義派生資料：排序、篩選、展平、分組、合計或 layout。
3. 定義展示狀態：selected、checked、expanded、loading、error、empty。
4. 設計 DOM 結構和 class/style 分工。
5. 設計 slots 或 render function，明確 slot props。
6. 設計 events，payload 要能回到原資料。
7. 若有 DOM 測量、scroll、observer、document listener，補 lifecycle 與 cleanup。
8. 補空資料、載入中、錯誤與非同步節點場景。
9. 補 `.d.ts`，核對 props、events、slots、methods、render params。
10. 用空資料、大資料、動態資料、外部更新、disabled、非同步與自訂 slot 測一輪。

## 複習題

1. 仿寫資料展示元件時，第一個要定義的是 DOM 還是資料模型？
2. 什麼情境下應該建立派生資料，而不是直接改原資料？
3. slot props 應該包含哪些資訊才足夠業務使用？
4. DOM 測量類元件最容易漏掉什麼生命週期？
5. runtime 和 `.d.ts` 不一致時，哪一類問題會最先影響使用者？
