# Tag、Badge、Avatar

## 學習目標

這篇一起分析 `Tag`、`Badge`、`Avatar`。它們都屬於狀態展示型小元件：程式碼不算龐大，但要處理顏色、尺寸、slot fallback、事件與不同呈現模式。

讀完後，要能比較三個元件如何在「展示」和「少量互動」之間取得平衡。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/badge/badge.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/badge.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/badge.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar.less`

## 三個元件的角色

| 元件 | 主要用途 | 互動程度 |
| --- | --- | --- |
| `Tag` | 顯示分類、狀態、可關閉或可選標籤 | 有 `on-close`、`on-change` |
| `Badge` | 顯示數字提醒、小紅點或狀態點 | 幾乎無內部互動 |
| `Avatar` | 顯示圖片、圖示或文字頭像 | 圖片錯誤時 emit `on-error` |

它們的共同點是：都不是資料容器，但會被資料狀態驅動。顏色、數字、圖片缺失、是否選中，都是外部資料映射到 UI 的結果。

## Tag

Tag 的 API 可以分成四組：

| 類型 | API |
| --- | --- |
| 狀態 | `closable`、`checkable`、`checked` |
| 樣式 | `color`、`type`、`size` |
| 識別 | `name` |
| 事件 | `on-change`、`on-close` |

Tag 有一個內部狀態：

```js
isChecked: this.checked
```

當 `checkable` 為 true 時，點擊 Tag 會切換 `isChecked`，再 emit `on-change`。同時 watch `checked`，讓外部受控狀態可以同步回元件內部。

### Tag 的顏色策略

Tag 把顏色分成兩類：

- 預設顏色：在 `initColorList` 中，走固定 class。
- 自訂顏色：不在清單中，走 inline style。

這是元件庫處理顏色擴展常見做法。預設色交給 less 管理，保持主題一致；自訂色用 inline style，讓使用者能臨時傳品牌色或資料色。

### Tag 的事件 payload

`close` 和 `check` 都會根據 `name` 是否存在決定 payload：

| 條件 | `on-close` | `on-change` |
| --- | --- | --- |
| 沒有 `name` | `(event)` | `(checked)` |
| 有 `name` | `(event, name)` | `(checked, name)` |

這讓使用者在 `v-for` 渲染多個 Tag 時，不必額外包一層函數也能知道是哪個 Tag 觸發事件。

## Badge

Badge 有三種主要呈現模式：

| 模式 | 條件 | 輸出 |
| --- | --- | --- |
| 小紅點 | `dot` | default slot + `sup.ivu-badge-dot` |
| 狀態點 | `status` 或 `color` | dot + text slot/text |
| 數字角標 | 預設 | default slot + count/custom count |

Badge 的核心 computed 是：

- `finalCount`：處理 `text` 與 `overflowCount`。
- `badge`：決定是否顯示角標。
- `hasCount`：決定是否渲染 count。
- `alone`：沒有 default slot 時加上獨立角標 class。

### Badge 的 slot

`types/badge.d.ts` 明確宣告了 `v-slots`：

| slot | 用途 |
| --- | --- |
| `count` | 自訂角標內容，且不使用預設角標背景 |
| `text` | 自訂帶背景角標內容，也可用於狀態點文字 |

這是基礎元件中很好的 slots API 範例：runtime template 有具名 slot，型別也有描述。

### Badge 的顯示規則

Badge 對 `0` 做了特別處理：

- `count` 為 0 時，預設隱藏。
- `showZero` 為 true 時，才顯示 0。
- `dot` 模式下，如果 `count` 是 0，也會隱藏 dot。
- `text` 不為空時，會強制顯示。

這些規則看似細小，但會直接影響通知、待辦數、狀態提醒的使用者體驗。

## Avatar

Avatar 的內容優先順序是：

```txt
src
  -> img
icon/customIcon
  -> Icon
default slot
  -> 文字頭像
```

這是一個典型 fallback chain。資料完整時顯示圖片；沒有圖片時可以顯示圖示；再不然就顯示文字縮寫。

### Avatar 的尺寸策略

`size` 支援兩種形態：

- 預設尺寸字串：`small`、`default`、`large`，走 class。
- 自訂數字：用 inline style 設定 width、height、lineHeight、fontSize。

runtime 的 `size` 是 `String | Number`，但 `types/avatar.d.ts` 只宣告 `large | small | default`。這表示使用者側型別沒有完整描述 runtime 支援的數字尺寸。

### 文字縮放

Avatar 如果走 default slot，會在 mounted/updated 時計算 slot 文字寬度，當文字超過頭像寬度時用 `scale()` 縮小，並用 `left: calc(...)` 置中。

這段邏輯說明：即使是小元件，也可能需要 DOM measurement 來保證視覺穩定。文字頭像不能只靠 CSS，因為使用者可能放入不同長度的字串。

### 圖片錯誤事件

圖片載入失敗時：

```js
this.$emit('on-error', e);
```

這讓使用者可以在外層切換備用圖片、改成文字頭像或記錄錯誤。Avatar 不自己決定錯誤後要怎麼處理，只把事件交出去。

## Runtime 與 Type 對照

| 元件 | 對照觀察 |
| --- | --- |
| `Tag` | runtime `color` 支援任意自訂色，但 d.ts 把 `color` 收窄成預設色 union，和實作不完全一致 |
| `Badge` | d.ts 有描述 `v-slots`，是 slots 型別較完整的基礎元件 |
| `Avatar` | runtime `size` 支援 number，但 d.ts 只描述預設尺寸字串 |

這些落差很適合用來練習 `06-public-api-and-type-system/09-runtime-api-vs-type-api-drift.md` 的檢查方法。

## 設計啟發

Tag、Badge、Avatar 的共同啟發是：

- 預設視覺狀態用 class，自訂值用 inline style。
- 展示元件也可能需要事件，但事件應該只暴露必要行為。
- slot fallback 要有明確優先順序，避免畫面同時出現多種內容。
- `.d.ts` 應該忠實描述 runtime 能力，否則使用者會被型別限制住。

## 複習題

1. Tag 為什麼需要同時支援 `checked` prop 和內部 `isChecked`？
2. Tag 的預設色和自訂色分別走什麼路徑？
3. Badge 的 `count`、`text`、`showZero` 如何共同決定是否顯示角標？
4. Avatar 的 `src`、`icon`、default slot 優先順序是什麼？
5. 哪些 runtime/type 落差會影響使用者側 TypeScript 體驗？
