# Mini Icon

Icon 是最適合開始仿寫的元件。它幾乎沒有互動狀態，但仍然具備完整元件庫會遇到的 API 問題：props 如何映射 class、inline style 如何處理、custom class 如何開放、尺寸與顏色要不要做型別限制。

## 練習目標

- 練習把 `type`、`custom`、`size`、`color` 轉成穩定 DOM 輸出。
- 練習低狀態元件的 props 設計。
- 練習 class 與 inline style 的責任切分。
- 練習讓元件能同時支援內建圖示 class 與自訂圖示 class。

## 對照源碼

主要對照：

- `src/components/icon/`
- `types/icon.d.ts`
- `src/styles/components/icon.less`

閱讀時關注：

- 元件根節點使用什麼 tag。
- `type` 與 `custom` 如何組合 class。
- `size`、`color` 是 class 還是 inline style。
- 型別宣告是否限制 icon 名稱。

## 最小實作範圍

仿寫一個 `MiniIcon`：

- 支援 `type`：內建圖示名稱，例如 `ios-add`。
- 支援 `custom`：外部傳入完整 class。
- 支援 `size`：數字或字串，轉成 `font-size`。
- 支援 `color`：轉成 `color`。
- 根節點使用 `i`。
- class prefix 使用 `mini-icon`。

先不實作：

- 完整 icon font 資源。
- 所有 View UI Plus icon 名稱。
- SVG icon loader。
- accessibility label。

## API 設計

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `type?: string` | 內建 icon 類型，轉成 `mini-icon-${type}` |
| prop | `custom?: string` | 自訂 icon class，優先與基本 class 一起套用 |
| prop | `size?: number \| string` | 轉成 `font-size` |
| prop | `color?: string` | 轉成 `color` |
| slot | 無 | Icon 不需要內容 slot |
| emit | 無 | Icon 不處理互動事件 |

class 規則：

```text
mini-icon
mini-icon-${type}
${custom}
```

style 規則：

```ts
{
  fontSize: size === undefined ? undefined : `${size}px`,
  color
}
```

若 `size` 已經是字串且包含單位，直接使用該字串。

## 實作步驟

1. 建立 `MiniIcon.vue`。
2. 用 `defineProps` 定義 `type`、`custom`、`size`、`color`。
3. 用 computed 建立 class list。
4. 用 computed 建立 style object。
5. template 只輸出一個 `i`。
6. 建立 3 到 5 個使用範例，分別展示 type、custom、size、color。

## 驗收案例

- 傳入 `type="ios-add"` 時，DOM 包含 `mini-icon mini-icon-ios-add`。
- 傳入 `custom="my-close-icon"` 時，DOM 包含 `mini-icon my-close-icon`。
- 傳入 `size="20"` 或 `size={20}` 時，元素有 `font-size: 20px`。
- 傳入 `size="1.5em"` 時，元素有 `font-size: 1.5em`。
- 傳入 `color="#f00"` 時，元素有 `color: #f00`。

## 源碼反思

View UI Plus 的 Icon 雖小，仍然有元件庫的典型設計：讓使用者用簡單 prop 控制 class，同時保留 `custom` 入口支援外部圖示系統。

仿寫時要注意不要把 Icon 寫成純 CSS class 說明。元件庫中的 Icon 是 API 設計練習：使用者不應該知道內部 class 規則，也能穩定得到預期圖示。
