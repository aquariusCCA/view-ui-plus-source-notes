# Transfer Impact In Basic Components：`$VIEWUI.transfer` 在基礎元件中的實際落點

## 0. 原始筆記問題分析

`transfer` 是 View UI Plus 中很常見的全域設定，但它主要服務浮層、彈窗、下拉、提示這類需要改變掛載位置的元件。

在 `07-basic-components/` 中，真正直接讀 `$VIEWUI.transfer` 的不是所有基礎元件，而是 `AvatarList`。原因是 `AvatarList` 內部可以用 `Tooltip` 包住每個頭像項目。

本篇專門整理這個看似小但容易混淆的影響點。

## 1. 本章定位

本章回答：

1. `$VIEWUI.transfer` 在 install 階段如何建立？
2. 基礎元件中誰讀取它？
3. `AvatarList.transfer` 如何傳給內部 `Tooltip`？
4. 為什麼這不代表所有基礎元件都支援 transfer？

## 2. `$VIEWUI.transfer` 的來源

`src/index.js` 中：

```js
transfer: 'transfer' in opts ? opts.transfer : ''
```

這裡使用 key-existence 判斷，而不是 truthy fallback。

整理成：

| install option | `$VIEWUI.transfer` |
| --- | --- |
| 未傳 `transfer` | `''` |
| `transfer: true` | `true` |
| `transfer: false` | `false` |

這個寫法保留了 `false` 的語意。也就是說，使用者明確設定 `transfer: false` 時，不會被 fallback 吃掉。

## 3. AvatarList 的 transfer prop

`AvatarList` source：

```txt
src/components/avatar-list/avatar-list.vue
```

`transfer` prop：

```js
transfer: {
    type: Boolean,
    default () {
        const global = getCurrentInstance().appContext.config.globalProperties;
        return !global.$VIEWUI || global.$VIEWUI.transfer === '' ? false : global.$VIEWUI.transfer;
    }
}
```

整理成規則：

```txt
使用者傳了 AvatarList.transfer
  -> 使用 prop 值
使用者沒傳 AvatarList.transfer
  -> 讀 $VIEWUI.transfer
      -> $VIEWUI.transfer 是空字串：使用 false
      -> $VIEWUI.transfer 有值：使用該值
```

所以 `AvatarList` 的 local default 是 `false`，不是 `true`。

## 4. transfer 的實際流向

`AvatarList` 不是自己建立浮層。它是在需要 tooltip 時，把 `transfer` 傳給內部 `Tooltip`：

```vue
<Tooltip
    :content="item.tip"
    v-if="tooltip && item.tip"
    :placement="placement"
    :transfer="transfer">
    <Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
</Tooltip>
```

資料流：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer default
  -> Tooltip.transfer prop
  -> Tooltip 決定提示層掛載方式
```

因此，`$VIEWUI.transfer` 對 `AvatarList` 的影響不是改變列表本身的 DOM，而是改變 tooltip 浮層是否 transfer。

## 5. Tooltip 出現條件

`transfer` 只有在 `Tooltip` 被渲染時才有實際效果。

`Tooltip` 的出現條件：

```txt
tooltip && item.tip
```

整理成：

| 條件 | 結果 |
| --- | --- |
| `tooltip=true` 且 `item.tip` 有值 | 渲染 `Tooltip`，`transfer` 會傳入。 |
| `tooltip=false` | 不渲染 `Tooltip`，`transfer` 沒有實際作用。 |
| `item.tip` 空值 | 不渲染 `Tooltip`，`transfer` 沒有實際作用。 |

所以即使全域設定：

```js
app.use(ViewUIPlus, { transfer: true })
```

如果 `AvatarList` item 沒有 `tip`，畫面仍不會出現 tooltip，也就沒有 transfer 行為。

## 6. 和 Avatar 的關係

`AvatarList` 內部渲染：

```vue
<Avatar :src="item.src" :size="size" :shape="shape"></Avatar>
```

`transfer` 不會傳給 `Avatar`。`Avatar` 本身也沒有讀取 `$VIEWUI.transfer`。

所以關係是：

```txt
AvatarList
  -> Avatar：傳 src / size / shape
  -> Tooltip：傳 content / placement / transfer
```

這也是為什麼 `transfer` 應該歸到 `AvatarList` 的聚合提示行為，而不是單一 `Avatar` 的內容或尺寸行為。

## 7. 基礎元件範圍內的 transfer 命中

| 元件 | 是否讀 `$VIEWUI.transfer` | 備註 |
| --- | --- | --- |
| `AvatarList` | 是 | prop default 讀取，傳給內部 `Tooltip`。 |
| `Avatar` | 否 | 不處理浮層。 |
| `Button` | 否 | 不處理浮層。 |
| `ButtonGroup` | 否 | 不處理浮層。 |
| `Cell` | 否 | 讀 `$VIEWUI.cell`，不讀 transfer。 |
| `Icon` | 否 | 不處理浮層。 |
| `Divider` | 否 | 不處理浮層。 |
| `Tag` | 否 | 不處理浮層。 |
| `Badge` | 否 | 不處理浮層。 |

其他目錄中的 `Tooltip`、`Poptip`、`Dropdown`、`Select`、`Modal` 等元件也會使用 transfer，但那些不屬於本篇基礎元件範圍。

## 8. 和全域 size 的差異

`$VIEWUI.size` 和 `$VIEWUI.transfer` 都是 top-level options，但它們在基礎元件中的語意不同。

| 設定 | 基礎元件影響 | 行為類型 |
| --- | --- | --- |
| `$VIEWUI.size` | `Button`、`ButtonGroup`、`Avatar` | 視覺尺寸預設。 |
| `$VIEWUI.transfer` | `AvatarList` | 內部 tooltip 掛載行為預設。 |

`size` 通常最後會進入 class 或 inline style；`transfer` 則是傳遞給浮層元件，用來改變掛載策略。

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `AvatarList` 自己有浮層實作 | 浮層來自內部 `Tooltip`。 |
| 設定 `$VIEWUI.transfer=true` 一定會讓 `AvatarList` DOM 改變 | 只有 tooltip branch 出現時才有實際效果。 |
| `Avatar` 也會受 transfer 影響 | `Avatar` 沒有讀取 `$VIEWUI.transfer`，也沒有接收 transfer prop。 |
| 所有基礎元件都有 transfer | v1.3.20 中基礎元件範圍只確認 `AvatarList` 直接讀取。 |

## 10. 本章總結

`$VIEWUI.transfer` 在基礎元件中的落點很窄：

```txt
$VIEWUI.transfer
  -> AvatarList.transfer
  -> Tooltip.transfer
```

它不是基礎元件的通用布局設定，而是 `AvatarList` 因為使用 `Tooltip` 而接入的浮層掛載預設值。

## 11. 自我檢查問題

1. `$VIEWUI.transfer` 為什麼要用 key-existence 判斷？
2. `AvatarList.transfer` 的 local default 是什麼？
3. 什麼條件下 `AvatarList` 會渲染 `Tooltip`？
4. `transfer` 最後是傳給 `Avatar` 還是 `Tooltip`？
5. 為什麼 `transfer` 不應被理解成所有基礎元件的通用設定？
