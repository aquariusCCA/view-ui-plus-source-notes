# 基礎元件總覽

## 學習目標

這篇建立 `07-basic-components` 的閱讀方法。基礎元件的程式碼通常不長，但它們會大量重複出現在其他元件與業務頁面中，所以 API 命名、class 組裝、slot fallback、型別宣告與樣式狀態都會放大影響。

讀完後，要能判斷哪些元件適合放在本章，並用同一套流程閱讀 Button、Icon、Divider、Tag、Badge、Avatar 這類低複雜度元件。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/button/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 元件分類

本章元件可以分成三類：

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 視覺原子 | `Icon`、`Divider` | props 如何直接映射成 class/style |
| 行動入口 | `Button`、`ButtonGroup` | click、loading、disabled、link、slot 如何組合成穩定互動 |
| 狀態展示 | `Tag`、`Badge`、`Avatar` | 顏色、尺寸、計數、圖片 fallback、可關閉與可選狀態 |

這些元件的共同特徵是：單一元件本身不負責大型資料流，也不管理複雜表單或浮層生命週期。它們更像元件庫的基礎語彙，會被其他元件、文件範例與業務封裝反覆使用。

## 閱讀順序

建議每個元件都按照同一個順序讀：

1. 看 `index.js`，確認元件如何被導出。
2. 看 `.vue`，整理 props、emits、slots、computed、methods。
3. 看 `types/*.d.ts`，對照 runtime API 和使用者側型別。
4. 看 `src/styles/components/*.less`，理解 class 狀態實際對應的視覺效果。
5. 回頭整理哪些能力是公開 API，哪些只是內部實作細節。

## 基礎元件的共同模式

基礎元件常見的實作模式包括：

| 模式 | 說明 |
| --- | --- |
| `prefixCls` | 統一 class 前綴，例如 `ivu-btn`、`ivu-tag`、`ivu-avatar` |
| `oneOf` validator | 在 runtime 限制 props 可用值，避免樣式狀態失控 |
| class array/object | 用 Vue class binding 組合固定 class、變體 class 與條件 class |
| inline style | 用於動態尺寸、自訂顏色、offset 等無法全部預先寫成 class 的狀態 |
| slot presence | 透過 `$slots.default` 或具名 slot 判斷是否改變渲染與樣式 |
| `.d.ts` 對照 | 把 runtime props/events/slots 轉成使用者側 IDE 能理解的型別 |

這些模式在後面的 Form、Table、Modal 等複雜元件中仍然會出現，只是會被更多狀態與資料流包起來。

## 和其他章節的關係

本章不重複解釋所有共用邏輯，而是把它們放回元件情境中觀察：

- `oneOf` 的工具設計放在 `05-shared-logic/02-assist-utils.md`。
- Button 的 `to`、`replace`、`target` 來自 `05-shared-logic/07-link-behavior.md`。
- Props、Emits、Slots、`.d.ts` 的判斷方法放在 `06-public-api-and-type-system/`。
- class 命名、less 變數、樣式 mixin 的完整分析放在 `17-style-system/`。

## 設計啟發

基礎元件的好壞通常不在於程式碼多複雜，而在於「小 API 是否穩定」。例如：

- `Button` 的 `type`、`size`、`loading` 會成為使用者每天依賴的語彙。
- `Icon` 的 `type` 和 `custom` 決定內建圖示與外部圖示庫如何共存。
- `Badge` 的 `count`、`dot`、`status` 同時承載數字提醒與狀態點語意。
- `Avatar` 的 `src`、`icon`、slot fallback 決定資料缺失時畫面是否穩定。

閱讀這些元件時，重點不是背 API 表，而是看懂「一個小 props 最後如何穿過 runtime、type、style，形成可依賴的使用者體驗」。

## 複習題

1. 為什麼基礎元件很適合作為單一元件源碼閱讀的起點？
2. `prefixCls` 解決了什麼維護問題？
3. 哪些狀態適合用 class 表示，哪些狀態適合用 inline style？
4. `.vue` 和 `.d.ts` 對同一個 prop 的描述不同時，應該如何判斷？
5. Button、Icon、Divider、Tag、Badge、Avatar 分別代表哪一類基礎元件？
