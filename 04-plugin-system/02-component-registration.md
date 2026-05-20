# Component Registration

本篇說明 plugin install 如何把 `src/components/index.js` 匯出的 components 註冊成 Vue global components。核心 source 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 的 `ViewUI` map 與 `app.component` loop。

## 1. Component Export Source

`src/index.js` 先做兩件事：

```js
export * from './components';
import * as components from './components';
```

這代表 component public surface 同時被用於兩個方向：

| Direction | Purpose |
| --- | --- |
| `export * from './components'` | 支援 `import { Button, Table } from 'view-ui-plus'` |
| `import * as components` | plugin install 內部取得所有 components，準備全域註冊 |

`src/components/index.js` 是實際 component export 清單，例如 `Button`、`Table`、`Modal`、`Message`、`Select`、`Tree` 等。

## 2. ViewUI Map

`src/index.js` 建立 `ViewUI`：

```js
const ViewUI = {
    ...components,
    iButton: components.Button,
    iCircle: components.Circle,
    iCol: components.Col,
    iContent: components.Content,
    iForm: components.Form,
    iFooter: components.Footer,
    iHeader: components.Header,
    iInput: components.Input,
    iMenu: components.Menu,
    iOption: components.Option,
    iProgress: components.Progress,
    iSelect: components.Select,
    iSwitch: components.Switch,
    iTable: components.Table,
    iTime: components.Time
};
```

這個 map 包含兩種名稱：

| Name type | Example | Meaning |
| --- | --- | --- |
| 原始 component export name | `Button`, `Table`, `Select` | 來自 `src/components/index.js` |
| `i` prefix alias | `iButton`, `iTable`, `iSelect` | plugin 額外註冊的 template alias |

## 3. Registration Loop

install 時執行：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

因此 `ViewUI` 裡的每個 key 都會變成 Vue app 的 global component name。

安裝後的 template surface 可以理解為：

```txt
<Button />
<Table />
<Select />

<iButton />
<iTable />
<iSelect />
```

實際 Vue template 的 casing 仍會受到 Vue template compiler 與 HTML casing 規則影響，但 plugin 註冊名稱就是 `ViewUI` map 的 key。

## 4. Boundary

這篇只關心「如何註冊成 global component」，不深入：

- 單一 component 的 props、events、slots。
- service-style component 例如 `Message`、`Modal` 的命令式行為。
- component 的樣式 class 與 Less 結構。
- tree-shaking 或 build output 是否保留按需引入能力。

component 實作細節應放在 `07-components/`；service API 細節應放在 `10-imperative-api/`。

## 5. Source Checklist

閱讀或維護這篇時，至少確認：

- `src/index.js` 是否仍有 `export * from './components'`。
- `src/index.js` 是否仍建立 `ViewUI` alias map。
- `src/index.js` 的 install 是否仍用 `Object.keys(ViewUI).forEach(app.component)`。
- `src/components/index.js` 是否有新增或移除 public component export。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `03-architecture/06-public-surface.md`
- `07-components/`
- `10-imperative-api/`
