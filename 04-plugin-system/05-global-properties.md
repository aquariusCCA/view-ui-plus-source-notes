# Global Properties

本篇說明 View UI Plus plugin 寫入 `app.config.globalProperties` 的 instance-level API。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 中 `$VIEWUI` 後面的 globalProperties 設定。

## 1. Role of globalProperties

Vue 3 的 `app.config.globalProperties` 會讓 component instance 可以透過 `this.$...` 存取全域屬性。

View UI Plus install 時寫入兩類 globalProperties：

| Category | Examples | Purpose |
| --- | --- | --- |
| 全域設定 | `$VIEWUI` | components 讀取全域 config |
| 命令式 API / helper | `$Message`, `$Modal`, `$Date` | component instance 直接呼叫 service 或工具 |

`$VIEWUI` 的詳細結構見 `04-plugin-system/04-global-options-and-viewui-config.md`。

## 2. Installed Instance APIs

install 會寫入：

| global property | Runtime value |
| --- | --- |
| `$Spin` | `components.Spin` |
| `$Loading` | `components.LoadingBar` |
| `$Message` | `components.Message` |
| `$Notice` | `components.Notice` |
| `$Modal` | `components.Modal` |
| `$ImagePreview` | `components.ImagePreview` |
| `$Copy` | `components.Copy` |
| `$ScrollIntoView` | `components.ScrollIntoView` |
| `$ScrollTop` | `components.ScrollTop` |
| `$Date` | `dayjs` |

這表示 plugin install 後，Options API component 可以使用：

```js
this.$Message.info('Saved');
this.$Modal.confirm({ title: 'Confirm' });
this.$Date().format('YYYY-MM-DD');
```

實際 method shape 取決於各 service object，本篇只記 plugin 如何暴露它們。

## 3. Difference from Named Exports

同一個能力可能同時出現在 named export 和 globalProperties：

| Access pattern | Example | Meaning |
| --- | --- | --- |
| Named import | `import { Message } from 'view-ui-plus'` | module-level import surface |
| Instance property | `this.$Message` | Vue app install 後的 instance surface |

plugin system 的責任是建立 instance surface；named export surface 來自 `export * from './components'`。

## 4. Type Surface

`types/index.d.ts` 透過 module augmentation 宣告：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: ViewUIPlusGlobalOptions;
        $Spin: any;
        $Loading: any;
        $Message: any;
        $Notice: any;
        $Modal: any;
        $ImagePreview: any;
        $Copy: any;
        $ScrollIntoView: any;
        $ScrollTop: any;
        $Date: any;
    }
}
```

目前多數 service 型別是 `any`，所以型別只保證 property 存在，不保證 method-level contract。

## 5. Boundary

本篇不深入：

- `$Message.info`、`$Notice.open`、`$Modal.confirm` 等 method behavior。
- service instance 如何建立 DOM 或 overlay。
- loading、modal、notice 的 queue、z-index、destroy 行為。

這些應放在 `10-imperative-api/` 和 `08-overlay-system/`。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `10-imperative-api/`
- `08-overlay-system/`
