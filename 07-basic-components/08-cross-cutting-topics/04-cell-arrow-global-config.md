# Cell Arrow Global Config：`$VIEWUI.cell` 對 `Cell` 預設箭頭的影響

## 0. 原始筆記問題分析

`Cell` 的個別筆記已經分析過 render、class、style 與 arrow，但 `$VIEWUI.cell` 值得在本目錄再單獨整理一次，原因是它和 `$VIEWUI.size`、`$VIEWUI.transfer` 的使用方式不同。

`size`、`transfer` 是 top-level option，通常進入 prop default；`cell` 則是 component-specific config，透過 `globalConfig` mixin 進入 computed，最後影響預設 arrow `Icon`。

## 1. 本章定位

本章專門分析：

```txt
app.use(ViewUIPlus, { cell })
  -> $VIEWUI.cell
  -> Cell.globalConfig
  -> arrowType / customArrowType / arrowSize
  -> 預設 Icon
```

本章不重複 `Cell` 的 click、router navigation、`CellGroup` provide/inject 流程。那些內容請看：

```txt
07-basic-components/07-cell-and-cell-group/03-click-link-and-provide-inject-flow.md
07-basic-components/07-cell-and-cell-group/04-render-style-arrow-and-global-config.md
```

## 2. `$VIEWUI.cell` 的來源

`src/index.js` 中建立：

```js
cell: {
    arrow: opts.cell ? opts.cell.arrow ? opts.cell.arrow : '' : '',
    customArrow: opts.cell ? opts.cell.customArrow ? opts.cell.customArrow : '' : '',
    arrowSize: opts.cell ? opts.cell.arrowSize ? opts.cell.arrowSize : '' : ''
}
```

`types/index.d.ts` 對應：

```ts
cell?: {
    arrow: string;
    customArrow: string;
    arrowSize: number | string;
};
```

整理成：

| install option | `$VIEWUI.cell` runtime 值 |
| --- | --- |
| 未傳 `cell` | `{ arrow: '', customArrow: '', arrowSize: '' }` |
| 傳 `cell.arrow` | `arrow` 有值 |
| 傳 `cell.customArrow` | `customArrow` 有值 |
| 傳 `cell.arrowSize` | `arrowSize` 有值 |

這些欄位使用 truthy fallback，所以空字串會被視為沒設定。

## 3. Cell 如何取得 `$VIEWUI.cell`

`Cell` source：

```txt
src/components/cell/cell.vue
```

它混入：

```js
mixins: [ mixinsLink, globalConfig ]
```

`globalConfig` mixin 會把 `$VIEWUI` 存成：

```txt
this.globalConfig
```

所以 `Cell` computed 中讀的是：

```js
const config = this.globalConfig;
```

這和 `Button.size` 那種 prop default 直接讀 `getCurrentInstance()` 不同。

## 4. Arrow Render Branch

`Cell` 只有在 `to` 有值時才渲染 arrow：

```vue
<div class="ivu-cell-arrow" v-if="to">
    <slot name="arrow">
        <Icon :type="arrowType" :custom="customArrowType" :size="arrowSize" />
    </slot>
</div>
```

因此 `$VIEWUI.cell` 的影響有兩個前提：

```txt
Cell.to 有值
沒有提供 #arrow slot
```

如果沒有 `to`，arrow 區塊根本不渲染。  
如果使用者提供 `#arrow` slot，預設 `Icon` 會被 slot 覆蓋。

## 5. Arrow 優先序

完整優先序：

```txt
有 #arrow slot
  -> 使用 slot，忽略預設 Icon
沒有 #arrow slot
  -> 渲染 Icon
      -> type / custom / size 由 computed 決定
```

computed 的來源是 `$VIEWUI.cell`。

## 6. `arrowType` 規則

`arrowType`：

```js
arrowType () {
    const config = this.globalConfig;
    let type = 'ios-arrow-forward';

    if (config) {
        if (config.cell.customArrow) {
            type = '';
        } else if (config.cell.arrow) {
            type = config.cell.arrow;
        }
    }
    return type;
}
```

整理成：

| `$VIEWUI.cell` | `arrowType` |
| --- | --- |
| 無設定 | `ios-arrow-forward` |
| `arrow` 有值 | 使用 `cell.arrow` |
| `customArrow` 有值 | 清空 `arrowType` |

`customArrow` 會讓 `arrowType` 清空，是為了避免同時傳 `Icon.type` 和 `Icon.custom`。

## 7. `customArrowType` 與 `arrowSize`

`customArrowType`：

```js
customArrowType () {
    const config = this.globalConfig;
    let type = '';

    if (config) {
        if (config.cell.customArrow) {
            type = config.cell.customArrow;
        }
    }
    return type;
}
```

`arrowSize`：

```js
arrowSize () {
    const config = this.globalConfig;
    let size = '';

    if (config) {
        if (config.cell.arrowSize) {
            size = config.cell.arrowSize;
        }
    }
    return size;
}
```

整理成：

| 設定 | 傳給 `Icon` |
| --- | --- |
| `cell.customArrow` | `custom` |
| `cell.arrowSize` | `size` |
| 未設定 `arrowSize` | 傳空字串，交給 `Icon` 自身預設。 |

## 8. 與 local props / slots 的邊界

`Cell` 沒有提供 `arrow`、`customArrow`、`arrowSize` 這些 local props。

使用者要改 arrow 有兩條路：

| 方法 | 作用範圍 | 適用情境 |
| --- | --- | --- |
| `$VIEWUI.cell` | 全域預設 | 整個 app 的 Cell link arrow 都想一致。 |
| `#arrow` slot | 單一 Cell | 只想覆寫某個 Cell 的 arrow 內容。 |

這個設計代表 `Cell` 把「預設箭頭樣式」交給全域設定，把「單次完全自訂」交給 slot，而不是新增多個 local props。

## 9. 和 `$VIEWUI.size` / `$VIEWUI.transfer` 的差異

| 設定 | 消費方式 | 影響位置 |
| --- | --- | --- |
| `$VIEWUI.size` | prop default 直接讀 | `Button`、`ButtonGroup`、`Avatar` 的 `size`。 |
| `$VIEWUI.transfer` | prop default 直接讀 | `AvatarList.transfer`，再傳給 `Tooltip`。 |
| `$VIEWUI.cell` | `globalConfig` mixin + computed | `Cell` 預設 arrow `Icon`。 |

`$VIEWUI.cell` 是 component-specific config，不是通用基礎元件設定。

## 10. 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `Cell` 有 `arrow` prop | v1.3.20 的 `Cell` 沒有 local `arrow` prop，arrow 預設來自 `$VIEWUI.cell` 或 slot。 |
| 設定 `$VIEWUI.cell` 後所有 Cell 都會出現 arrow | 只有 `to` 有值的 `Cell` 才渲染 arrow。 |
| `customArrow` 和 `arrow` 會一起傳給 Icon | `customArrow` 有值時，`arrowType` 會被清空。 |
| `#arrow` slot 只改 icon type | `#arrow` slot 會覆蓋整個預設 `Icon`。 |

## 11. 本章總結

`$VIEWUI.cell` 的資料流是：

```txt
install options
  -> $VIEWUI.cell
  -> globalConfig mixin
  -> Cell arrow computed
  -> default Icon props
```

它只影響 `Cell` link branch 的預設 arrow，不影響 `Cell` 的 click 行為、link navigation、selected / disabled class，也不影響沒有 `to` 的 Cell。

## 12. 自我檢查問題

1. `$VIEWUI.cell` 在 runtime 中有哪些欄位？
2. `Cell` 是透過哪個 mixin 取得 `$VIEWUI`？
3. 什麼條件下 `Cell` 會渲染 `.ivu-cell-arrow`？
4. `customArrow` 有值時，為什麼 `arrowType` 會被清空？
5. 如果單一 `Cell` 想完全自訂 arrow，應該使用全域設定還是 slot？
