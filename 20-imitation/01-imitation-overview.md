# 仿寫練習總覽

`20-imitation/` 是把源碼閱讀轉成工程能力的練習區。前面章節負責看懂 View UI Plus 怎麼設計元件，這一章負責把那些設計縮小成可以親手完成的小案例。

仿寫不是複製貼上，也不是追求 1:1 還原。真正要練的是：看懂元件的公開契約，抓出最核心的狀態與互動，再用 Vue 3 + TypeScript 做出一個可驗收的版本。

## 練習目標

- 建立從源碼分析到最小實作的固定流程。
- 練習設計 props、emits、slots、expose 與型別。
- 練習把 class、style、狀態、事件整理成穩定元件 API。
- 練習辨認哪些是真實元件庫必備能力，哪些可以在練習版先略過。
- 練習完成後回頭重構，而不是一開始就過度抽象。

## 對照源碼

第一階段主要對照這些位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/components/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/`
- `03-architecture/`
- `04-plugin-system/`
- `05-shared-logic/`
- `06-public-api-and-type-system/`
- `17-style-system/`

不要只看 `.vue` 檔。元件庫的完整契約通常同時存在於實作、型別宣告、樣式 class、文件範例與全域安裝入口中。

## 最小實作範圍

每個仿寫案例都只做一個「教學版元件」。教學版元件應該具備：

- 清楚的 component name。
- 必要 props 與預設值。
- 明確 emits 與 payload。
- 至少一種 slot 使用方式。
- 可觀察的 class 命名規則。
- 基本樣式狀態。
- 可寫成範例的驗收情境。

先不追求：

- 完整相容 View UI Plus 的所有 API。
- 完整 accessibility 細節。
- 所有瀏覽器兼容問題。
- 所有邊界型別。
- SSR、按需樣式載入、完整文件站整合。

## API 設計

仿寫前先回答這些問題：

| 問題 | 說明 |
| --- | --- |
| 這個元件的主狀態是什麼？ | 例如 Button 是狀態樣式，Input 是輸入值，Select 是選中值。 |
| 使用者最常傳哪些 props？ | 只保留最能代表元件設計的 props。 |
| 哪些狀態應該用事件通知外部？ | 例如 `update:modelValue`、`change`、`clear`。 |
| slot 是內容入口還是擴充入口？ | 例如 Button default slot 是內容，Input prefix/suffix 是擴充。 |
| 樣式如何由 props 映射？ | 例如 `type="primary"` 對應 `mini-btn-primary`。 |
| 是否需要暴露 instance 方法？ | Form 需要 `validate`，Input 可能需要 `focus`。 |

API 設計完成後再寫元件，能避免一邊寫一邊把公開契約改得失控。

## 實作步驟

1. 找出 View UI Plus 對應元件的入口、主元件、子元件、型別與樣式。
2. 寫下真實元件的 API 清單。
3. 刪掉這次不練的部分，留下最小實作範圍。
4. 先寫 props/emits/slots 的設計表。
5. 再寫 template 或 render 結構。
6. 補上 class 計算與樣式狀態。
7. 補上互動事件與外部通知。
8. 寫使用範例與驗收案例。
9. 對照源碼反思真實元件多處理了什麼。

## 驗收案例

- 可以說明這個仿寫版練的是哪一種元件庫能力。
- 可以列出它的 props、emits、slots 與 class 規則。
- 可以用 3 個以上範例展示主要狀態。
- 可以指出至少 3 個真實 View UI Plus 比仿寫版更完整的地方。
- 可以判斷下一步是否需要抽 composable、utils 或共用型別。

## 源碼反思

真正的 View UI Plus 需要面對長期維護、向下相容、文件一致性、跨元件互通、樣式覆蓋、型別提示與使用者錯誤輸入。仿寫版只保留學習主線，所以程式碼應該更小、更直觀。

好的仿寫不是功能越多越好，而是每次都能準確回答：這個案例讓我多掌握了哪一種元件庫設計能力。
