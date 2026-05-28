# Typography 內建省略

## 學習目標

這篇分析 Typography 家族內建的 `ellipsis` 能力。它適合在 `Title`、`Text`、`Paragraph`、`Link` 上直接啟用省略，並可搭配 Tooltip 顯示完整文字。

讀完後，要能分辨 Typography ellipsis、獨立 Ellipsis 元件與 `v-line-clamp` 指令的能力差異。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/base.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/typography/props.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/tooltip/tooltip.vue`
- `01-origin/source/view-ui-plus-v1.3.20/examples/routers/typography.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/typography.d.ts`

## API 組成

| API | 作用 |
| --- | --- |
| `ellipsis` | 是否啟用省略 |
| `ellipsisConfig.rows` | 最多顯示行數 |
| `ellipsisConfig.tooltip` | 是否用 Tooltip 顯示完整內容，或指定 Tooltip 內容 |
| `transfer` | Tooltip 是否轉移到 body |
| `theme` | Tooltip 主題 |
| `maxWidth` | Tooltip 最大寬度 |
| `placement` | Tooltip 位置 |

`ellipsis` 是能力開關；`ellipsisConfig` 控制裁切語意；Tooltip 相關 props 只在省略提示中生效。

## class 與 style

啟用省略後，`classes` 會加入：

- `ivu-typography-ellipsis-line-clamp`
- `ivu-typography-ellipsis-single-line`

render 時會設定：

```txt
style['-webkit-line-clamp'] = mergedEllipsisConfig.rows
```

這表示 Typography 的省略主要依賴 CSS line clamp。它不是逐字裁切文字，而是讓瀏覽器根據行數裁切可見內容。

## 省略狀態偵測

核心判斷：

```txt
isEllipsis = $el.scrollHeight > $el.clientHeight
```

如果實際內容高度超過可見高度，就視為有省略。這個狀態會影響是否包 Tooltip。

為了處理容器尺寸變動，元件使用 `element-resize-detector`：

- `handleCreateObserver()` 建立監聽。
- `handleRemoveObserver()` 移除監聽。
- `beforeUnmount()` 清理 observer。

閱讀時要特別看 watcher：`editing`、`isEllipsis`、`ellipsis` 都可能重新建立 observer，避免編輯模式和展示模式互相干擾。

## Tooltip 條件

Tooltip 不是一啟用 ellipsis 就顯示，而是要同時符合：

```txt
ellipsis === true
ellipsisExpanded === false
isEllipsis === true
mergedEllipsisConfig.tooltip truthy
```

Tooltip 的內容如果是 `true`，會使用 `handleGetContent()` 取得完整文字；如果是字串，就使用該字串作為 Tooltip 內容。

這個設計避免沒有真正溢出的文字也出現多餘 Tooltip。

## 與編輯模式的關係

當 `editing` 為 true 時，TypographyBase 直接渲染 textarea，不再渲染省略文字。編輯結束後會在 `nextTick` 中重新建立省略觀察。

這是合理分工：

- 展示模式才需要省略。
- 編輯模式需要完整可輸入文字。
- 切換後要重新測量 DOM。

## 未完整實作的配置

`defaultEllipsisConfig` 中有：

```txt
suffix: false
expandable: false
symbol: '展开'
```

但在 `base.vue` 中，suffix、expandable、symbol 的主要渲染邏輯被註解為 todo。筆記中要明確標註：這些配置出現在預設值與 examples 中，不代表當前源碼已完整提供展開和後綴能力。

這種 runtime 與文件/示例可能不一致的地方，是源碼閱讀時最需要保留證據的位置。

## 適用場景

Typography ellipsis 適合：

- 已經在使用 `Text`、`Paragraph`、`Title` 的內容。
- 需要和 copy/edit/type 等 Typography 能力共存。
- 省略後只需要 Tooltip 顯示完整文字。
- 主要依賴 CSS 行數裁切即可。

如果需要精準按字數裁切、prefix/suffix/more slot、`on-show/on-hide`，應該看獨立 `Ellipsis` 元件。

## 複習題

1. Typography ellipsis 為什麼需要同時看 CSS class 和 DOM 高度？
2. `isEllipsis` 何時才會變成 true？
3. Tooltip 為什麼不應在未溢出時顯示？
4. 編輯模式和省略模式為什麼要互斥？
5. `ellipsisConfig.suffix` 和 `expandable` 在筆記中應該如何標註？
