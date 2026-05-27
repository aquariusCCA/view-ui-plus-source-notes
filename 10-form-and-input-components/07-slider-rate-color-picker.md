# Slider、Rate 與 ColorPicker

## 學習目標

這篇分析非文字型輸入元件如何把拖曳、hover、鍵盤或顏色面板操作轉成穩定值。重點是視覺位置和提交值的轉換，以及 `on-input`、`on-change`、`on-active-change` 等事件差異。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/slider/slider.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/slider/marker.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/rate/rate.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/color-picker/color-picker.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/color-picker/utils.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/slider.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/rate.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/color-picker.d.ts`

## Slider

`Slider` 把數值轉成軌道位置，也把拖曳位置轉回數值：

| 狀態 | 說明 |
| --- | --- |
| `modelValue` | 外部值，單值或 range array |
| `currentValue` | 內部 array 形式，方便處理單值/range |
| `exportValue` | 經 min/max/step 修正後對外使用的值 |
| `pointerDown` | 目前拖曳的 handle |
| `marks` | 軌道標記點 |

拖曳中會觸發 `update:modelValue` 和 `on-input`，拖曳結束才觸發 `on-change`。這能讓外部區分即時預覽和最終提交。

## Rate

`Rate` 的值來自 hover 與 click：

- `modelValue` 決定目前評分。
- hover 暫時改變視覺狀態。
- click 後 emit `update:modelValue` 與 `on-change`。
- `allowHalf` 會讓滑鼠位置影響半星值。
- `clearable` 可點已選值清空。

Rate 的難點是視覺狀態不一定等於提交值，hover 應可取消。

## ColorPicker

`ColorPicker` 需要管理顏色模型：

| 區塊 | 職責 |
| --- | --- |
| saturation | 調整飽和度與亮度 |
| hue | 調整色相 |
| alpha | 調整透明度 |
| recommend colors | 點選推薦色 |
| input edit | 直接輸入顏色字串 |
| dropdown | visible、transfer、click outside |

事件上，`on-active-change` 可用於預覽目前面板顏色，`on-change` 和 `update:modelValue` 代表對外值變更，`on-pick-success` / `on-pick-clear` 表示確認或清除操作。

## 視覺值與提交值

| 元件 | 視覺值 | 提交值 |
| --- | --- | --- |
| `Slider` | handle left、bar width、tooltip | number 或 `[min, max]` |
| `Rate` | hover 星星、半星 class | number |
| `ColorPicker` | rgba preview、panel handle | color string |

這類元件的核心是座標、hover 或顏色模型轉換，不是原生 input event。

## 設計啟發

仿寫視覺化輸入時，先決定哪些狀態只是暫存：

```txt
hover / dragging / active color
  -> visual state
  -> preview event
  -> commit event
  -> modelValue
```

不要讓拖曳過程中的每一個暫存狀態都等同於業務提交。

## 複習題

1. Slider 為什麼需要區分 `on-input` 和 `on-change`？
2. range Slider 為什麼內部適合統一用 array？
3. Rate 的 hover state 和 `modelValue` 有什麼差異？
4. ColorPicker 的 active color 和提交 color 為什麼要分開？
5. 哪些狀態應使用 class，哪些狀態應使用 inline style？
