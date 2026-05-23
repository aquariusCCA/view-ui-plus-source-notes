# Global Size Impact：`$VIEWUI.size` 對基礎元件預設尺寸的影響

## 0. 原始筆記問題分析

在個別元件筆記中，`Button`、`ButtonGroup`、`Avatar` 都提到 `size` prop 會讀 `$VIEWUI.size`。但如果只分散在各元件筆記中，很容易漏掉兩個重點：

1. `$VIEWUI.size` 只在使用者沒有傳 `size` prop 時生效。
2. 同樣讀 `$VIEWUI.size`，不同元件轉成 class / style 的方式並不一樣。

本篇把基礎元件中的全域 size 行為集中整理。

## 1. 本章定位

本章專門分析：

```txt
app.use(ViewUIPlus, { size })
  -> $VIEWUI.size
  -> Button / ButtonGroup / Avatar size default
  -> class 或 inline style
```

本章不處理表單、輸入、資料展示等其他類別元件。那些元件也可能讀 `$VIEWUI.size`，但不屬於 `07-basic-components/` 的範圍。

## 2. `$VIEWUI.size` 的來源

`src/index.js` 中建立：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || '',
    // ...
}
```

規則很簡單：

| install option | `$VIEWUI.size` |
| --- | --- |
| 未傳 `size` | `''` |
| `size: 'large'` | `'large'` |
| `size: 'small'` | `'small'` |
| `size: 'default'` | `'default'` |

`size` 使用 `opts.size || ''`，所以 falsy value 會被轉成空字串。這和 `transfer`、`capture` 的 key-existence 判斷不同。

## 3. 共用 default 讀取模式

`Button`、`ButtonGroup`、`Avatar` 都在 `size` prop default 中讀取：

```js
const global = getCurrentInstance().appContext.config.globalProperties;
return !global.$VIEWUI || global.$VIEWUI.size === '' ? 'default' : global.$VIEWUI.size;
```

這段邏輯可以整理成：

```txt
使用者傳了 size prop
  -> 使用 prop 值
使用者沒有傳 size prop
  -> 讀 $VIEWUI.size
      -> $VIEWUI.size 是空字串：使用 default
      -> $VIEWUI.size 有值：使用全域 size
```

這代表 `$VIEWUI.size` 是 fallback，不是強制覆蓋。

## 4. Button：全域 size 進入 button class

`Button` 的 source：

```txt
src/components/button/button.vue
```

`size` validator：

```js
validator (value) {
    return oneOf(value, ['small', 'large', 'default']);
}
```

class mapping：

```js
[`ivu-btn-${this.size}`]: this.size !== 'default'
```

整理成表格：

| 實際 `this.size` | Button class |
| --- | --- |
| `default` | 不產生 `ivu-btn-default` size class。 |
| `small` | `ivu-btn-small`。 |
| `large` | `ivu-btn-large`。 |

需要注意的是，`ivu-btn-default` 在 Button 中是 type class，不是 size class。這點容易和其他元件混淆。

## 5. ButtonGroup：全域 size 進入 group class

`ButtonGroup` 的 source：

```txt
src/components/button/button-group.vue
```

`size` default 同樣讀 `$VIEWUI.size`，但 class mapping 不同：

```js
[`ivu-btn-group-${this.size}`]: !!this.size
```

整理成：

| 實際 `this.size` | ButtonGroup class |
| --- | --- |
| `default` | `ivu-btn-group-default`。 |
| `small` | `ivu-btn-group-small`。 |
| `large` | `ivu-btn-group-large`。 |

這和 `Button` 不一樣。`Button` 不為 default size 產生 size class，但 `ButtonGroup` 會。

還要注意，`ButtonGroup` 沒有把 `size` prop 傳給子 `Button`。它是透過 group class 和 less selector 影響群組內按鈕的視覺。

## 6. Avatar：全域 size 可能進入 class 或 inline style

`Avatar` 的 source：

```txt
src/components/avatar/avatar.vue
```

`Avatar.size` 支援：

```txt
small / default / large
自訂 String
自訂 Number
```

class 路徑：

```js
[`ivu-avatar-${this.size}`]: oneOf(this.size, sizeList)
```

inline style 路徑：

```js
if (this.size && !oneOf(this.size, sizeList)) {
    style.width = `${this.size}px`;
    style.height = `${this.size}px`;
    style.lineHeight = `${this.size}px`;
    style.fontSize = `${this.size/2}px`;
}
```

整理成：

| 實際 `this.size` | Avatar 行為 |
| --- | --- |
| `default` | 產生 `ivu-avatar-default`，主要尺寸來自根樣式。 |
| `small` | 產生 `ivu-avatar-small`。 |
| `large` | 產生 `ivu-avatar-large`。 |
| 非預設尺寸 | 走 inline width / height / lineHeight / fontSize。 |

因為 `$VIEWUI.size` 的 type 是 `string`，理論上使用者可以傳入非標準字串。但如果同一份全域設定也要服務 `Button`，就應避免把 `$VIEWUI.size` 設成 `Button` validator 不接受的值。

## 7. 受影響與不受影響的基礎元件

| 元件 | 是否讀 `$VIEWUI.size` | 備註 |
| --- | --- | --- |
| `Button` | 是 | prop default 讀取。 |
| `ButtonGroup` | 是 | prop default 讀取。 |
| `Avatar` | 是 | prop default 讀取。 |
| `AvatarList` | 否 | `size` prop 預設固定為 `default`，不讀 `$VIEWUI.size`。 |
| `Icon` | 否 | 沒有直接讀取 `$VIEWUI`。 |
| `Divider` | 否 | 沒有直接讀取 `$VIEWUI`。 |
| `Tag` | 否 | 沒有直接讀取 `$VIEWUI`。 |
| `Badge` | 否 | 沒有直接讀取 `$VIEWUI`。 |
| `Cell` | 否 | 讀 `$VIEWUI.cell`，不讀 top-level `size`。 |

`AvatarList` 是特別容易誤判的案例。它內部使用 `Avatar`，但自己的 `size` prop default 是固定 `default`。因為它總是把 `size` 傳給子 `Avatar`，所以子 `Avatar` 不會再使用自己的 `$VIEWUI.size` default。

## 8. 優先序總結

以 `Button` 為例：

```txt
<Button size="small" />
  -> 使用 small

app.use(ViewUIPlus, { size: 'large' })
<Button />
  -> 使用 large

app.use(ViewUIPlus)
<Button />
  -> 使用 default
```

以 `AvatarList` 為例：

```txt
app.use(ViewUIPlus, { size: 'large' })
<AvatarList />
  -> AvatarList.size 仍是 default
  -> 子 Avatar 收到 size="default"
```

所以全域 size 不是全域 CSS theme，也不是所有元件的尺寸開關。它只影響實際把 `$VIEWUI.size` 接進 prop default 的元件。

## 9. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `$VIEWUI.size` 會覆蓋所有元件上的 `size` prop | 使用者明確傳入 prop 時，prop 優先。 |
| `Button` 和 `ButtonGroup` 的 size class 規則相同 | `Button` 不為 default size 產生 size class；`ButtonGroup` 會。 |
| `AvatarList` 會跟著全域 size 改變 | `AvatarList.size` default 固定為 `default`，不讀 `$VIEWUI.size`。 |
| `Avatar` 的 size 只走 class | 非預設尺寸會走 inline style。 |

## 10. 本章總結

`$VIEWUI.size` 在基礎元件中主要是三個元件的 prop default fallback：

```txt
Button
ButtonGroup
Avatar
```

它的設計重點不是增加新的 public prop，而是讓使用者可以在 install 階段設定常用尺寸預設值。閱讀時要一直追蹤：

```txt
$VIEWUI.size
  -> prop default
  -> this.size
  -> class / style mapping
```

## 11. 自我檢查問題

1. `$VIEWUI.size` 沒設定時，runtime 值是什麼？
2. `Button.size` 未傳時，預設值如何決定？
3. 為什麼 `Button` 不會產生 `ivu-btn-default` size class？
4. `ButtonGroup` 的 `size` 會不會直接傳給子 `Button`？
5. 為什麼 `AvatarList` 不應被列入 `$VIEWUI.size` 影響元件？
