# Progress、Circle 與 Result

## 學習目標

這篇分析 `Progress`、`Circle`、`Result` 如何呈現進度、百分比、儀表盤與結果狀態。重點是數值如何轉成 class、inline style、SVG path、狀態 icon 與 slot。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/progress/progress.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/circle/circle.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/result/result.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/progress.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/circle.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/result.d.ts`

## 三個元件的角色

| 元件 | 主要用途 | 呈現方式 |
| --- | --- | --- |
| `Progress` | 線性進度、成功分段、狀態文字 | div width/height + class |
| `Circle` | 環形進度、儀表盤 | SVG path + stroke-dasharray |
| `Result` | 成功、錯誤、警告結果頁 | icon + title/desc/extra/actions |

它們的共通點是：使用者傳入狀態值，元件把它轉成可掃描的視覺狀態。

## Progress

Progress 的主要 props：

| prop | 用途 |
| --- | --- |
| `percent` | 主要百分比 |
| `successPercent` | 成功分段百分比 |
| `status` | `normal`、`active`、`wrong`、`success` |
| `hideInfo` | 是否隱藏右側文字或 icon |
| `strokeWidth` | 線寬 |
| `vertical` | 是否垂直顯示 |
| `strokeColor` | 自訂顏色或漸層 |
| `textInside` | 百分比是否顯示在進度條內 |

`bgStyle` 根據 `vertical` 決定 width 或 height：

```txt
horizontal -> width: percent%
vertical   -> height: percent%
```

`strokeColor` 若是字串，轉成 `background-color`；若是陣列，轉成 `linear-gradient`。

## Progress 狀態推導

Progress 有內部 `currentStatus`：

```txt
status prop -> currentStatus
percent === 100 -> currentStatus = success
percent 下降 -> currentStatus = normal
```

這讓 Progress 可以在使用者沒有手動傳 `status="success"` 時，根據百分比自動顯示成功狀態。

需要注意：runtime 會 `$emit('on-status-change', ...)`，但元件沒有明確 `emits` 陣列，`types/progress.d.ts` 也沒有列出這個事件。

## Circle

Circle 用 SVG path 呈現環形進度。核心 computed：

| computed | 用途 |
| --- | --- |
| `radius` | 根據 strokeWidth 算圓半徑 |
| `pathString` | 一般圓或 dashboard 圓弧 path |
| `len` | 圓周長 |
| `trailStyle` | 背景軌道 dash 設定 |
| `pathStyle` | 進度軌道 dash 設定 |
| `strokeValue` | 字串顏色或 gradient url |
| `showDefs` | 是否渲染 linearGradient defs |

一般模式用 `stroke-dashoffset` 表示未完成百分比：

```txt
dashoffset = (100 - percent) / 100 * len
```

dashboard 模式會預留缺口，使用 `len - 75` 作為有效弧長。

## Circle 顏色

`strokeColor` 支援字串或陣列：

| 型別 | 行為 |
| --- | --- |
| string | 直接作為 stroke |
| array | 建立 `linearGradient`，stroke 使用 `url(#id)` |

每個 Circle 用 `random(3)` 產生 gradient id，避免同頁多個 gradient 互相衝突。

## Result

Result 是最接近「狀態頁」的展示元件：

| prop | 用途 |
| --- | --- |
| `type` | `success`、`error`、`warning` |
| `title` | 標題 |
| `desc` | 描述 |
| `extra` | 補充資訊 |

slot：

| slot | 用途 |
| --- | --- |
| `title` | 覆蓋標題 |
| `desc` | 覆蓋描述 |
| `extra` | 覆蓋補充資訊 |
| `actions` | 操作建議，例如按鈕或連結 |

icon 由 `type` 決定，並加上對應 class：

```txt
ivu-result-icon-success
ivu-result-icon-error
ivu-result-icon-warning
```

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `Progress.on-status-change` | runtime 有 emit，型別沒有列出 |
| `Progress.status` | runtime validator 和型別 union 對齊 |
| `Circle.strokeColor` | runtime 支援 array gradient，型別寫 `string | any[]` |
| `Result.type` | runtime 沒有 default，使用者不傳時不顯示 icon 狀態 class |
| `Result` slots | runtime 和型別都有 title/desc/extra/actions |

## 設計啟發

進度與結果展示元件要先定義「值如何映射到視覺」：

```txt
percent -> width/height/path
status -> class/icon
color -> class/inline style/svg defs
slot -> 覆蓋文字或中間內容
```

仿寫時要特別小心自動狀態推導。例如 Progress 的 `percent === 100` 自動 success 很方便，但如果業務需要 100% 後仍等待後端確認，就應該允許外部 status 覆蓋。

## 複習題

1. Progress 的 `percent` 如何影響水平和垂直模式？
2. `successPercent` 和 `percent` 分別表示什麼？
3. Circle 為什麼需要用 `stroke-dasharray` 和 `stroke-dashoffset`？
4. Circle 的漸層色為什麼需要唯一 id？
5. Result 的 `actions` slot 和 `extra` slot 適合放什麼內容？
