# Basic Components `$VIEWUI` 全域設定影響筆記

本目錄專門整理 View UI Plus 的 `$VIEWUI` 全域設定如何影響 `07-basic-components/` 中的基礎元件。

這裡不重複每個元件的完整 props、render、style 細節，而是把已完成的個別元件筆記拉成一條橫向主線：

```txt
app.use(ViewUIPlus, options)
  -> src/index.js 建立 $VIEWUI
  -> component default / globalConfig mixin 讀取 $VIEWUI
  -> 基礎元件的預設 size、transfer、arrow 行為改變
```

閱讀本目錄時，重點不是背 `$VIEWUI` 有哪些 key，而是理解「全域預設值」與「單一元件 props / slots」之間的邊界。

## Topic Plan

| 筆記 | 主題 | 對照元件 |
| --- | --- | --- |
| `01-viewui-config-entry-and-reading-map.md` | `$VIEWUI` 來源、型別、讀取方式與基礎元件命中矩陣 | 全部基礎元件 |
| `02-global-size-impact.md` | `$VIEWUI.size` 如何影響預設尺寸 | `Button`、`ButtonGroup`、`Avatar` |
| `03-transfer-impact-in-basic-components.md` | `$VIEWUI.transfer` 在基礎元件中的實際落點 | `AvatarList` |
| `04-cell-arrow-global-config.md` | `$VIEWUI.cell` 如何改變 `Cell` 預設箭頭 | `Cell` |

## Source Baseline

本目錄以 View UI Plus v1.3.20 為閱讀基準。

| Source | 用途 |
| --- | --- |
| `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 確認 `app.use()` options 如何被整理成 `$VIEWUI`。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js` | 確認 `globalConfig` mixin 如何把 `$VIEWUI` 存到 `this.globalConfig`。 |
| `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` | 對照 `ViewUIPlusGlobalOptions` 與 runtime `$VIEWUI` shape。 |
| `01-origin/source/view-ui-plus-v1.3.20/src/components/` | 確認哪些基礎元件實際讀取 `$VIEWUI`。 |

## 基礎元件命中概覽

| 元件 | `$VIEWUI` 影響 |
| --- | --- |
| `Button` | `size` prop 未傳時，預設讀 `$VIEWUI.size`。 |
| `ButtonGroup` | `size` prop 未傳時，預設讀 `$VIEWUI.size`。 |
| `Avatar` | `size` prop 未傳時，預設讀 `$VIEWUI.size`。 |
| `AvatarList` | `transfer` prop 未傳時，預設讀 `$VIEWUI.transfer`，並傳給內部 `Tooltip`。 |
| `Cell` | 預設 arrow icon 讀 `$VIEWUI.cell.arrow`、`customArrow`、`arrowSize`。 |
| `Icon` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Divider` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Tag` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |
| `Badge` | v1.3.20 中沒有直接讀取 `$VIEWUI`。 |

## Working Rule

每篇筆記都應回指具體 source path，並明確區分：

1. 哪些結論已由 runtime source 確認。
2. 哪些行為只是型別宣告描述。
3. 哪些元件沒有直接讀取 `$VIEWUI`，不應過度推論。
