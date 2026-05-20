# Global Options and $VIEWUI Config

本篇說明 `app.use(ViewUIPlus, options)` 的 options 如何被轉成 `this.$VIEWUI`。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 中寫入 `app.config.globalProperties.$VIEWUI` 的區塊。

## 1. Role of $VIEWUI

`$VIEWUI` 是 plugin install 寫入 Vue instance 的全域設定物件：

```js
app.config.globalProperties.$VIEWUI = { ... };
```

它的用途不是暴露命令式 API，而是讓 components 在 runtime 讀取全域預設值，例如尺寸、transfer 行為、圖示設定、關閉圖示、toolbar 設定等。

## 2. Top-Level Options

`$VIEWUI` 的 top-level 設定包含：

| `$VIEWUI` key | Option source | Default behavior |
| --- | --- | --- |
| `size` | `opts.size` | 沒有設定時為空字串 |
| `capture` | `opts.capture` | key 存在時用使用者值，否則為 `true` |
| `transfer` | `opts.transfer` | key 存在時用使用者值，否則為空字串 |

`capture` 和 `transfer` 使用 key-existence 判斷，這代表 `false` 是有效值；其他多數 nested options 則用 truthy fallback。

## 3. Component-Specific Config

`$VIEWUI` 也包含多個 component-specific config：

| `$VIEWUI` key | Config fields |
| --- | --- |
| `cell` | `arrow`, `customArrow`, `arrowSize` |
| `menu` | `arrow`, `customArrow`, `arrowSize` |
| `modal` | `maskClosable` |
| `tabs` | `closeIcon`, `customCloseIcon`, `closeIconSize` |
| `select` | `arrow`, `customArrow`, `arrowSize` |
| `colorPicker` | `arrow`, `customArrow`, `arrowSize` |
| `cascader` | `arrow`, `customArrow`, `arrowSize`, `itemArrow`, `customItemArrow`, `itemArrowSize` |
| `tree` | `arrow`, `customArrow`, `arrowSize` |
| `datePicker` | `icon`, `customIcon`, `iconSize` |
| `timePicker` | `icon`, `customIcon`, `iconSize` |
| `typography` | `copyConfig`, `editConfig`, `ellipsisConfig` |
| `space` | `size` |
| `image` | `toolbar` |

這些設定是 plugin system 和 component implementation 的交界。plugin 負責建立 config shape；各 component 負責決定如何讀取與套用。

## 4. Fallback Pattern

source 裡常見 fallback pattern：

```js
arrow: opts.select ? opts.select.arrow ? opts.select.arrow : '' : ''
```

這代表多數欄位在缺省時會落到空字串，而不是 `undefined`。這對 component 端很重要，因為 component 可能直接判斷空字串代表「使用自身預設」。

例外是 `modal.maskClosable`：

```js
maskClosable: opts.modal ? 'maskClosable' in opts.modal ? opts.modal.maskClosable : '' : ''
```

它使用 key-existence 判斷，因此 `false` 可以被保留下來。

## 5. Type Surface

`types/index.d.ts` 中的 `ViewUIPlusGlobalOptions` 描述 `$VIEWUI` 和 install options 的主要結構。它和 runtime `$VIEWUI` 應該一起閱讀：

- runtime 決定實際 fallback value。
- type declaration 決定使用者傳入 options 時的 IDE/type-checking contract。
- 若 runtime 新增 `$VIEWUI` key，型別也應同步補上。

## 6. Source Checklist

維護這篇時應核對：

- `src/index.js` 的 `$VIEWUI` object 是否新增或移除 key。
- `types/index.d.ts` 的 `ViewUIPlusGlobalOptions` 是否與 runtime config 對齊。
- component 是否讀取 `$VIEWUI` 中的對應 key；細節可放在各 component 筆記。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `06-type-system/`
- `07-components/`
