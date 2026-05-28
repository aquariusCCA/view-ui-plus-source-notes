# Mini ButtonGroup

ButtonGroup 的價值不在於它本身有多複雜，而在於它示範了父元件如何影響子元件的視覺語意。這類設計常出現在 Menu、Tabs、RadioGroup、CheckboxGroup 與 FormItem。

## 練習目標

- 練習容器元件如何統一子元件尺寸與形狀。
- 練習使用 provide/inject 做父子協作。
- 練習 group class 如何修正相鄰按鈕的 border radius 與邊線。
- 練習區分「父層負責排版」與「子層負責狀態」。

## 對照源碼

主要對照：

- `src/components/button/`
- `types/button.d.ts`
- `src/styles/components/button.less`

閱讀時關注：

- ButtonGroup 暴露哪些 props。
- Button 是否知道自己在 group 裡。
- group 樣式如何處理第一個、最後一個與中間按鈕。
- size 是否由 group 統一下發。

## 最小實作範圍

仿寫一組 `MiniButtonGroup` + `MiniButton` 協作：

- `MiniButtonGroup` 支援 `size`。
- `MiniButtonGroup` 支援 `shape`。
- 子 `MiniButton` 若沒有自己的 `size`，使用 group size。
- 子 `MiniButton` 若沒有自己的 `shape`，使用 group shape。
- group 根節點提供 `mini-btn-group` class。

先不實作：

- vertical group。
- compact mode。
- 複雜嵌套 group。
- group 對 disabled/loading 的統一控制。

## API 設計

`MiniButtonGroup`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `size?: 'small' \| 'default' \| 'large'` | 統一子按鈕尺寸 |
| prop | `shape?: 'default' \| 'circle'` | 統一子按鈕形狀 |
| slot | `default` | 放置多個 `MiniButton` |

provide value：

```ts
interface MiniButtonGroupContext {
  size?: 'small' | 'default' | 'large'
  shape?: 'default' | 'circle'
}
```

`MiniButton` 需要調整：

- inject group context。
- `mergedSize = props.size ?? group.size ?? 'default'`。
- `mergedShape = props.shape ?? group.shape ?? 'default'`。

## 實作步驟

1. 建立 `button-group-context.ts`，定義 injection key 與 context 型別。
2. `MiniButtonGroup.vue` provide `size` 與 `shape`。
3. `MiniButton.vue` inject group context。
4. 修改 Button class computed，改用 merged size/shape。
5. 補上 group 樣式，讓相鄰按鈕看起來是一組。

## 驗收案例

- `MiniButtonGroup size="small"` 包住兩個 Button 時，兩個 Button 都套用 small class。
- 子 Button 自己傳 `size="large"` 時，優先使用子元件自己的尺寸。
- group 根節點有 `mini-btn-group`。
- group 中第一顆與最後一顆按鈕的 border radius 不同。
- group 不應該吞掉 Button 原本的 click 事件。

## 源碼反思

ButtonGroup 是理解元件庫協作方式的第一個小案例。真正的 View UI Plus 還會考慮更完整的樣式邊界、不同 type 相鄰時的 border 顏色，以及和全域配置的關係。

仿寫時要保持 group 的職責單純：它只提供群組語意與預設視覺設定，不接管每顆 Button 的互動狀態。
