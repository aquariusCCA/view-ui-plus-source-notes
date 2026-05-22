# Public Component Registry：`viewuiplus.components.d.ts` 的匯出地圖

## 1. 本章定位

本章分析 `types/viewuiplus.components.d.ts`。

這個檔案是 View UI Plus component named exports 的型別 registry。它不描述每個 component 的 props 細節，而是把所有單一元件 declaration 集中轉匯出，讓 TypeScript 使用者可以從 package entry 取得：

```ts
import { Button, Table, Modal, Message } from 'view-ui-plus';
```

---

## 2. Registry 的基本形狀

`types/viewuiplus.components.d.ts` 長得像：

```ts
export { Button, ButtonGroup } from './button'
export { Form, FormItem } from './form'
export { Table, TableColumnConfig } from './table'
export { Modal, ModalInstance } from './modal'
export { Message, MessageConfig } from './message'
export { Notice, NoticeConfig } from './notice'
export { Tree, TreeChildConfig } from './tree'
export { Title, Text, Paragraph, Link, CopyConfig, EditConfig, EllipsisConfig } from './typography'
```

它是一個集中清單。

```txt
types/index.d.ts
  -> export * from './viewuiplus.components'

types/viewuiplus.components.d.ts
  -> export { Button } from './button'
  -> export { Table } from './table'
  -> export { Modal } from './modal'
  -> ...

types/button.d.ts
  -> export declare const Button: DefineComponent<...>
```

---

## 3. Runtime Registry 對照

runtime 的對應來源是：

```txt
src/index.js
  -> export * from './components'

src/components/index.js
  -> export { default as Button } from './button'
  -> export { default as Table } from './table'
  -> export { default as Modal } from './modal'
  -> ...
```

可以把它看成兩條平行 registry：

| Runtime | Type |
| --- | --- |
| `src/components/index.js` | `types/viewuiplus.components.d.ts` |
| 決定 JS import 時有哪些 named exports | 決定 TS 知道哪些 named exports |
| `export { default as Button } from './button'` | `export { Button } from './button'` |

這兩份 registry 應該盡量同步。runtime 有 export 但 type registry 沒有，TypeScript 使用者可能無法 import。type registry 有 export 但 runtime 沒有，編譯可能過，執行時可能壞。

---

## 4. Registry 中不只 Component

`viewuiplus.components.d.ts` 不只 export component，也 export 一些 configuration / instance-like declarations：

| Export | 來源 | 角色 |
| --- | --- | --- |
| `TableColumnConfig` | `./table` | Table column option shape |
| `TreeChildConfig` | `./tree` | Tree node child config |
| `MessageConfig` | `./message` | Message global config |
| `NoticeConfig` | `./notice` | Notice global config |
| `ModalInstance` | `./modal` | Modal imperative options / instance declaration |
| `CopyConfig`、`EditConfig`、`EllipsisConfig` | `./typography` | Typography feature config |

這代表 registry 的責任是「public type exports」，不只是 `.vue` component exports。

讀這份檔案時，可以問：

1. 這個 export 是 component 嗎？
2. 還是 service config / data config / helper type？
3. runtime 是否有同名 named export？
4. 使用者是否應該從 package entry import 它？

---

## 5. Component Grouping

有些 declaration 會從同一個檔案匯出多個相關 component：

```ts
export { Button, ButtonGroup } from './button'
export { Breadcrumb, BreadcrumbItem } from './breadcrumb'
export { Checkbox, CheckboxGroup } from './checkbox'
export { Menu, MenuItem, Submenu, MenuGroup } from './menu'
export { Tabs, TabPane } from './tabs'
```

這反映 UI library 的 component family 設計。

| Group | 主元件 | 子元件 / 相關元件 |
| --- | --- | --- |
| Button | `Button` | `ButtonGroup` |
| Form | `Form` | `FormItem` |
| Menu | `Menu` | `MenuItem`、`Submenu`、`MenuGroup` |
| Select | `Select` | `Option`、`OptionGroup` |
| Tabs | `Tabs` | `TabPane` |
| Layout | `Layout` | `Sider`、`Content`、`Footer`、`Header` |

這對閱讀 component system 很有用：type registry 本身就是一張元件族譜。

---

## 6. Global Component Alias 與 Type Registry

`src/index.js` install 中的 `ViewUI` map 會額外註冊一些 `i` 前綴別名：

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

但 `types/viewuiplus.components.d.ts` 主要 export `Button`、`Input`、`Table` 等 named exports，不是 `iButton`、`iInput`。

這提醒我們：

| Surface | 範例 | 來源 |
| --- | --- | --- |
| package named export | `import { Button } from 'view-ui-plus'` | `viewuiplus.components.d.ts` |
| plugin global component alias | `<iButton />` | `src/index.js` install 的 `ViewUI` map |

這兩者不是同一層 surface。不要用 type registry 推斷 install 時所有 alias。

---

## 7. 新增 Component 時的同步點

假設新增一個 `Foo` component，至少要檢查：

1. runtime component 是否在 `src/components/index.js` export。
2. type declaration 是否有 `types/foo.d.ts`。
3. `types/viewuiplus.components.d.ts` 是否 export `Foo`。
4. `types/index.d.ts` 是否能透過 registry 轉出它。
5. plugin install 是否會透過 `...components` 註冊它。
6. 如果有 alias，`src/index.js` 的 `ViewUI` map 是否需要補。

這是一個典型 library public surface 維護流程。

---

## 8. v1.3.20 中可以觀察到的 Registry Gap

把 `src/components/index.js` 和 `types/viewuiplus.components.d.ts` 對照後，可以看到兩類差異。

第一類是 runtime 有 named export，但 type registry 沒有明確轉出：

```txt
Copy
ScrollIntoView
ScrollTop
Typography
```

這代表 JavaScript runtime 可能能從 package import 到這些符號，但 TypeScript 使用者是否能得到正確 declaration，需要額外確認。這類差異屬於「runtime export 可能沒有 type surface」。

第二類是 type registry 有 export，但它們不是 runtime component named export，而是 helper / config / option 型別：

```txt
CopyConfig
EditConfig
EllipsisConfig
Links
LoadingBarConfig
MessageConfig
ModalInstance
NoticeConfig
TableColumnConfig
TreeChildConfig
```

其中部分是合理的 public type helper，例如 `TableColumnConfig`、`MessageConfig`；但也提醒我們，registry 中的每個名字都要判斷它是 runtime value、component、還是 purely type-level helper。不能只看到 `export { ... }` 就假設它一定是可在 runtime import 的 component。

---

## 9. Registry 的閱讀價值

`types/viewuiplus.components.d.ts` 很短，但很重要，因為它回答：

1. TypeScript 使用者可以從 package import 哪些元件？
2. 哪些元件被視為 public，而不是內部實作？
3. 哪些非元件型別也被公開？
4. component families 如何分組？
5. runtime/type named exports 是否可能不同步？

在閱讀大型 UI library 時，這種 registry 通常比單一 component source 更能快速建立全局視角。

---

## 10. 本章結論

`types/viewuiplus.components.d.ts` 是 View UI Plus component type registry。它將分散在 `types/*.d.ts` 的 component declarations 統一轉匯出，再透過 `types/index.d.ts` 暴露給 package 使用者。

它應該和 runtime 的 `src/components/index.js` 保持同步。新增、刪除或改名 component 時，如果只改 runtime registry，不改 type registry，就會讓 TypeScript 使用者看不到正確 export；反過來也會產生 type overpromise。

---

## 11. 自我檢查問題

1. `types/index.d.ts` 如何接到 `types/viewuiplus.components.d.ts`？
2. `viewuiplus.components.d.ts` 和 `src/components/index.js` 分別負責什麼？
3. 為什麼 `TableColumnConfig` 也會出現在 component registry？
4. `iButton` 這類 alias 為什麼不能只看 type registry 判斷？
5. `Copy`、`ScrollIntoView` 這類 runtime export 沒有出現在 type registry 時，可能代表什麼？
6. 新增一個 public component 時，要同步檢查哪些 registry？
