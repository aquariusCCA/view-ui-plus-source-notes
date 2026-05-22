# Public Component Registry：`viewuiplus.components.d.ts` 的匯出地圖

## 0. 原始筆記問題分析

這篇原始筆記的主題很明確：它在分析 View UI Plus 的 `types/viewuiplus.components.d.ts`，也就是元件型別匯出的集中 registry。原始筆記已經整理出幾個重要觀察，例如 `types/index.d.ts` 會轉出 `viewuiplus.components.d.ts`、runtime 的 `src/components/index.js` 與 type registry 應該同步、registry 中不只包含元件，也包含一些 config / instance-like 型別，並且指出 v1.3.20 中可能存在 runtime 與 type registry 的差異。

不過，原始筆記目前比較像「原始碼閱讀後的重點紀錄」，適合快速回查，但如果要放在 `06-type-system/` 目錄下作為長期學習材料，還可以再補強幾個地方。

第一，原始筆記已經列出 registry 的結構，但對於「為什麼 UI library 需要 public component registry」的背景說明還不夠。初次閱讀元件庫原始碼時，如果只看到一串 `export { ... } from './xxx'`，容易把它當成普通匯出清單，而忽略它其實是在定義套件的 public type surface。

第二，原始筆記已經對照 runtime registry 與 type registry，但還可以更明確地拆分「runtime value export」、「type declaration export」與「plugin global component registration」三個層次。這三者在 Vue component library 中很容易混淆：使用者可以 `import { Button }`，也可以透過 plugin install 使用全域元件，甚至還可能有 `iButton` 這類 alias；但這些入口背後由不同檔案與不同機制支撐。

第三，原始筆記提到 registry 中不只 component，也有 `TableColumnConfig`、`MessageConfig`、`ModalInstance` 等型別，但可以進一步說明這代表 registry 的責任不是「只匯出 Vue component」，而是「集中暴露套件願意公開給 TypeScript 使用者的元件相關型別」。

第四，原始筆記指出 v1.3.20 中存在 registry gap，這是很有價值的觀察，但需要補上判讀方式：看到 runtime 有、type 沒有，不一定馬上等於 bug；它可能代表缺少型別、可能是內部元件不打算公開，也可能是型別檔維護落差。這些都需要回到實際使用情境與 package entry 測試來確認。

因此，優化後的版本會保留原始筆記所有核心內容，並補成一篇「原始碼閱讀 + TypeScript public API 設計」的教材型筆記，讓你之後閱讀其他 UI library 的型別匯出設計時，也能套用同一套分析方法。

---

## 1. 本章定位

本章分析的是 View UI Plus 在 TypeScript 型別層面的 public component registry，也就是：

```txt
types/viewuiplus.components.d.ts
```

這份檔案的核心責任不是描述每個 component 的 props 細節，也不是定義 component 的 runtime 行為，而是把分散在 `types/*.d.ts` 中的元件 declaration 集中轉匯出，讓 TypeScript 使用者可以從 package entry 取得 View UI Plus 對外公開的元件與相關型別。

例如使用者在專案中可能會這樣使用：

```ts
import { Button, Table, Modal, Message } from 'view-ui-plus';
```

這種 named import 能不能被 TypeScript 正確辨識，除了 runtime 真的要有對應的 JavaScript export 之外，型別層也要有對應的 declaration export。`types/viewuiplus.components.d.ts` 正是在回答這個問題：View UI Plus 在型別層面願意公開哪些 component、哪些 component family、哪些 config type、哪些 instance-like declaration。

本章屬於 `06-type-system/` 目錄下的「原始碼閱讀筆記 + public API 型別設計筆記」。讀完本章後，你應該能理解以下幾件事：

1. `types/viewuiplus.components.d.ts` 在 View UI Plus 型別系統中的位置。
2. type registry 與 runtime registry 的差異與同步關係。
3. 為什麼 registry 中會同時出現 component 與 config / instance 型別。
4. 為什麼不能只靠 `types/viewuiplus.components.d.ts` 推斷 plugin install 時的全域元件 alias。
5. 新增、刪除或改名 public component 時，需要同步檢查哪些檔案。

本章不會深入分析單一 component 的 props 設計，也不會逐一解釋 `Button`、`Table`、`Modal` 的完整型別內容。這些細節應該留到後續的 component declaration 筆記，例如 `types/button.d.ts`、`types/table.d.ts`、`types/modal.d.ts` 等章節再處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 什麼是 registry？

在原始碼閱讀中，`registry` 可以理解成「集中登記表」。它通常不負責實作功能，而是負責把某一類東西集中收斂起來，讓外部或其他模組可以用穩定的方式取得。

在 View UI Plus 這類 UI component library 中，registry 常見於兩個層面：

| Registry 類型 | 代表檔案 | 主要責任 |
| --- | --- | --- |
| Runtime registry | `src/components/index.js` | 決定 JavaScript runtime 可以從套件匯入哪些元件 value |
| Type registry | `types/viewuiplus.components.d.ts` | 決定 TypeScript 可以看到哪些元件與相關 public declarations |
| Plugin install registry | `src/index.js` 中的 `ViewUI` map | 決定 `app.use(ViewUIPlus)` 後會全域註冊哪些 component 與 alias |

這三種 registry 都在處理「對外暴露什麼」，但它們暴露的層次不同。runtime registry 暴露的是 JavaScript 執行時真的存在的值；type registry 暴露的是 TypeScript 編譯時能看到的型別宣告；plugin install registry 暴露的是 Vue app 安裝插件後能在 template 中使用的全域元件名稱。

### 2.2 `.d.ts` 檔案的角色

`.d.ts` 是 TypeScript declaration file，也就是型別宣告檔。它通常不包含真正的 runtime 實作，而是描述 JavaScript 模組對 TypeScript 使用者呈現出來的型別形狀。

例如原始筆記中提到的 `types/button.d.ts` 可能會提供類似以下的宣告形狀：

```ts
export declare const Button: DefineComponent<...>
```

這段宣告的意思是：在型別層面，`Button` 是一個 Vue component，並且它的型別可以由 `DefineComponent<...>` 描述。實際的 `Button` component runtime 實作不在這個檔案，而是在 `src/button` 或相關原始碼中。

因此，閱讀 `types/viewuiplus.components.d.ts` 時要先建立一個觀念：它不是在建立元件，而是在告訴 TypeScript「這個套件有哪些對外可見的元件與型別」。

### 2.3 Public surface：套件真正承諾給使用者的表面

對 library 作者來說，public surface 是非常重要的概念。它指的是套件對使用者公開、承諾可以使用的 API、元件、型別與設定。

在 View UI Plus 中，以下都可能是 public surface 的一部分：

```ts
import { Button } from 'view-ui-plus'
import { TableColumnConfig } from 'view-ui-plus'
import { MessageConfig } from 'view-ui-plus'
```

如果某個名稱被放進 `types/viewuiplus.components.d.ts`，通常代表它被納入 TypeScript 使用者可以從 package entry 取得的 public declarations。這就是為什麼這份檔案不能只被看成「整理方便的 export 清單」：它實際上會影響使用者能不能順利 import、編譯器能不能推斷型別、IDE 能不能提供自動補全。

### 2.4 容易混淆的三種匯出

閱讀這份檔案時，最容易混淆的是下面三種東西：

| 層次 | 範例 | 核心問題 | 對應檔案 |
| --- | --- | --- | --- |
| Runtime value export | `export { default as Button } from './button'` | JavaScript 執行時是否真的有這個 named export？ | `src/components/index.js` |
| Type declaration export | `export { Button } from './button'` | TypeScript 是否知道這個 export 的型別？ | `types/viewuiplus.components.d.ts` |
| Global component alias | `<iButton />` | plugin install 後 template 是否可以用這個名稱？ | `src/index.js` 的 `ViewUI` map |

這三者都和「元件對外暴露」有關，但不能互相替代。runtime 有 export，不代表 type registry 一定有型別；type registry 有 export，也不保證 runtime 一定有對應 value；plugin install 有 alias，也不代表 package named export 一定有同名 alias。

---

## 3. 整體概覽

### 3.1 `types/viewuiplus.components.d.ts` 在型別入口中的位置

原始筆記中整理出的型別入口關係如下：

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

這條鏈路可以理解成「由 package type entry 往下轉匯出 component declarations」。

當使用者從 `view-ui-plus` 匯入 `Button` 時，TypeScript 會依照套件的型別入口找到 `types/index.d.ts`，再透過 `export * from './viewuiplus.components'` 接到 `types/viewuiplus.components.d.ts`。接著，`viewuiplus.components.d.ts` 再從 `./button` 轉出 `Button` 的 declaration。

也就是說，`types/viewuiplus.components.d.ts` 站在一個中繼層的位置。它不直接寫完所有 component 的完整型別，而是負責把各個 component declaration module 收斂成一個 package-level 的 public type registry。

### 3.2 Runtime registry 的對應位置

原始筆記也整理出 runtime 側的對應關係：

```txt
src/index.js
  -> export * from './components'

src/components/index.js
  -> export { default as Button } from './button'
  -> export { default as Table } from './table'
  -> export { default as Modal } from './modal'
  -> ...
```

這條鏈路可以理解成「由 package runtime entry 往下轉匯出 component values」。

`src/components/index.js` 負責把元件的 runtime implementation 轉成 named exports。這會影響 JavaScript 使用者與打包器實際能 import 到什麼值。

因此，View UI Plus 至少存在兩條平行 registry：

| Runtime registry | Type registry |
| --- | --- |
| `src/components/index.js` | `types/viewuiplus.components.d.ts` |
| 決定 JavaScript import 時有哪些 named exports | 決定 TypeScript 知道哪些 named exports |
| 匯出 runtime component value | 匯出 type declaration |
| 範例：`export { default as Button } from './button'` | 範例：`export { Button } from './button'` |

這兩份 registry 應該盡量同步。否則就會出現「JavaScript 能用但 TypeScript 不認得」或「TypeScript 編譯通過但 runtime 找不到」的落差。

### 3.3 本章要建立的心智模型

閱讀 `types/viewuiplus.components.d.ts` 時，可以用下面這個模型理解：

```txt
使用者程式碼
  -> import { Button, Table, Message } from 'view-ui-plus'

TypeScript 型別入口
  -> types/index.d.ts
  -> types/viewuiplus.components.d.ts
  -> types/button.d.ts / types/table.d.ts / types/message.d.ts

JavaScript runtime 入口
  -> src/index.js
  -> src/components/index.js
  -> src/button / src/table / src/message

Vue plugin install
  -> src/index.js
  -> ViewUI map
  -> app.component(name, component)
```

這個模型的重點是：同一個元件可能同時出現在多條對外入口中。你在閱讀原始碼時，不應該只看某一條路徑就下結論，而是要判斷自己現在分析的是「型別入口」、「runtime 入口」，還是「plugin 全域註冊入口」。

---

## 4. 核心內容逐步講解

### 4.1 `viewuiplus.components.d.ts` 的基本形狀

原始筆記中列出的 `types/viewuiplus.components.d.ts` 大致長得像下面這樣：

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

這種寫法的本質是 re-export，也就是「從其他 declaration module 把名稱轉匯出」。它本身不是在定義 `Button`、`Table` 或 `Modal`，而是把 `./button`、`./table`、`./modal` 中已經宣告好的內容收斂到同一個 public registry。

這樣設計的好處是，單一 component 的細節可以放在自己的型別檔中維護，例如 `types/button.d.ts` 專門描述 Button family，`types/table.d.ts` 專門描述 Table 與欄位設定。外部使用者則不需要知道這些細節檔案的位置，只需要從 package entry import 即可。

對 library 來說，這是一種常見的分層設計：

| 層級 | 責任 |
| --- | --- |
| 單一元件 declaration | 描述某個 component 或 component family 的具體型別 |
| component type registry | 集中轉出所有公開元件與相關型別 |
| package type entry | 把 component registry、plugin 型別、全域方法型別等整合成套件的型別入口 |

所以，`types/viewuiplus.components.d.ts` 雖然看起來只是很多行 `export`，但它其實是 package public type surface 的重要入口之一。

### 4.2 Registry 不負責 props 細節，而是負責 public export map

原始筆記中已經指出：`types/viewuiplus.components.d.ts` 不描述每個 component 的 props 細節，而是把所有單一元件 declaration 集中轉匯出。

這個判斷很重要，因為它決定了你閱讀這份檔案時的重點。你不需要期待在這裡看到 `Button` 的 `type`、`size`、`disabled` 等 props，也不需要期待在這裡理解 `Table` 的 column render 設計。這些細節應該回到各自的 declaration module 閱讀。

在這份 registry 中真正值得觀察的是：

1. 哪些 component 被公開。
2. 哪些 component family 被分在同一個 declaration module。
3. 哪些非 component 型別也被公開。
4. 哪些 runtime export 沒有對應 type export。
5. 哪些 type export 可能只是型別層 helper，不是 runtime component。

這也讓它很適合當成「元件庫型別系統的地圖」。在深入單一元件之前，先看 registry 可以快速建立全局視角。

### 4.3 Runtime registry 與 Type registry 的同步關係

原始筆記把 runtime 與 type registry 對照成兩條平行 registry，這是本章最重要的核心觀念之一。

runtime 側：

```txt
src/components/index.js
  -> export { default as Button } from './button'
  -> export { default as Table } from './table'
  -> export { default as Modal } from './modal'
```

type 側：

```txt
types/viewuiplus.components.d.ts
  -> export { Button } from './button'
  -> export { Table } from './table'
  -> export { Modal } from './modal'
```

從使用者角度來看，`import { Button } from 'view-ui-plus'` 同時需要兩件事成立：

1. runtime package 真的有名為 `Button` 的 export。
2. TypeScript declaration 也真的有名為 `Button` 的 export。

如果只有 runtime 有 export，但 type registry 沒有 export，JavaScript 可能可以執行，但 TypeScript 使用者會遇到型別錯誤或 IDE 無法自動補全。這類問題通常會讓使用者覺得「套件明明可以用，但 TS 一直報錯」。

反過來，如果 type registry 有 export，但 runtime registry 沒有 export，TypeScript 編譯可能會通過，但實際執行時可能出現 named export 不存在的錯誤。這類問題更危險，因為它會讓型別系統對使用者做出錯誤承諾。

因此，在 component library 中維護 public API 時，runtime registry 與 type registry 應該被視為一組需要同步檢查的檔案，而不是兩個彼此獨立的清單。

### 4.4 Registry 中不只 component，也有 public helper types

原始筆記中特別指出，`viewuiplus.components.d.ts` 不只 export component，也 export 一些 configuration / instance-like declarations，例如：

| Export | 來源 | 角色 |
| --- | --- | --- |
| `TableColumnConfig` | `./table` | Table column option shape |
| `TreeChildConfig` | `./tree` | Tree node child config |
| `MessageConfig` | `./message` | Message global config |
| `NoticeConfig` | `./notice` | Notice global config |
| `ModalInstance` | `./modal` | Modal imperative options / instance declaration |
| `CopyConfig`、`EditConfig`、`EllipsisConfig` | `./typography` | Typography feature config |

這代表 `viewuiplus.components.d.ts` 的角色不能被簡化成「元件清單」。更精準的理解應該是：它是 component-related public type exports 的 registry。

例如 `TableColumnConfig` 不是一個 Vue component，但它對使用 `Table` 的 TypeScript 使用者很重要。當使用者要定義 columns 時，如果可以 import `TableColumnConfig`，就能讓 column 設定具備型別提示與型別檢查。

同樣地，`MessageConfig`、`NoticeConfig` 這類型別可能對全域 service API 很重要；`ModalInstance` 可能與 imperative API 或 modal 設定形狀有關；`CopyConfig`、`EditConfig`、`EllipsisConfig` 則可能與 Typography 相關功能的設定有關。

閱讀這類 registry 時，要把每個 export 分成幾種類型來判斷：

| Export 類型 | 判斷方式 | 閱讀重點 |
| --- | --- | --- |
| Component value declaration | 通常是 `Button`、`Table`、`Modal` 這類元件名稱 | 是否有對應 runtime component export |
| Component family member | 例如 `ButtonGroup`、`FormItem`、`TabPane` | 它和主元件是否應該一起閱讀 |
| Config / option type | 例如 `TableColumnConfig`、`MessageConfig` | 它是否代表使用者可設定的資料形狀 |
| Instance-like declaration | 例如 `ModalInstance` | 它是否描述命令式 API、service API 或實例方法 |
| 需要確認的 helper type | 例如來源不明或 runtime 對照不清楚的型別 | 是否真的是 public API，或只是型別檔維護上的轉出 |

這種分類可以避免你看到 `export { ... }` 就把所有名稱都當成 component。

### 4.5 Component Grouping：registry 也是元件族譜

原始筆記中整理出，有些 declaration 會從同一個檔案匯出多個相關 component：

```ts
export { Button, ButtonGroup } from './button'
export { Breadcrumb, BreadcrumbItem } from './breadcrumb'
export { Checkbox, CheckboxGroup } from './checkbox'
export { Menu, MenuItem, Submenu, MenuGroup } from './menu'
export { Tabs, TabPane } from './tabs'
```

這種 grouping 反映的是 UI library 的 component family 設計。很多元件不是單獨存在的，而是由主元件與子元件共同構成一組使用模式。

例如：

| Group | 主元件 | 子元件 / 相關元件 | 閱讀重點 |
| --- | --- | --- | --- |
| Button | `Button` | `ButtonGroup` | 觀察單一按鈕與群組按鈕的 props 是否有共用設計 |
| Form | `Form` | `FormItem` | 觀察表單上下文、驗證、label、欄位狀態如何分工 |
| Menu | `Menu` | `MenuItem`、`Submenu`、`MenuGroup` | 觀察巢狀選單、選中狀態與群組結構 |
| Select | `Select` | `Option`、`OptionGroup` | 觀察資料選項與選擇器容器的型別關係 |
| Tabs | `Tabs` | `TabPane` | 觀察容器元件與面板元件如何配合 |
| Layout | `Layout` | `Sider`、`Content`、`Footer`、`Header` | 觀察 layout family 的語意化分工 |

因此，`types/viewuiplus.components.d.ts` 本身就可以當成一張元件族譜。當你不知道要怎麼開始讀一個 UI library，可以先從 registry 找出 component family，再挑一組元件深入分析。

這種閱讀方式比直接打開單一元件更有效，因為 UI library 的設計通常不是孤立的。理解 component family，會比只理解單一 component 更接近框架作者的設計思路。

### 4.6 Global Component Alias 與 Type Registry 不是同一層 surface

原始筆記提到，`src/index.js` 的 install 流程中有一個 `ViewUI` map，會額外註冊一些 `i` 前綴別名：

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

但 `types/viewuiplus.components.d.ts` 主要 export 的是 `Button`、`Input`、`Table` 這類 named exports，而不是 `iButton`、`iInput`、`iTable`。

這裡要特別注意：package named export 與 plugin global alias 不是同一層 API。

| Surface | 使用方式 | 來源 | 判斷重點 |
| --- | --- | --- | --- |
| Package named export | `import { Button } from 'view-ui-plus'` | `types/viewuiplus.components.d.ts` 與 `src/components/index.js` | 檢查 named export 是否在 runtime 與 type 都存在 |
| Plugin global component | `<Button />` 或其他全域元件名稱 | `src/index.js` install 流程 | 檢查 install 時是否透過 `app.component` 註冊 |
| Plugin alias | `<iButton />` | `src/index.js` 的 `ViewUI` map | 檢查 alias 是否有被額外加入全域註冊表 |

所以，不能只看 `types/viewuiplus.components.d.ts` 就推斷 install 後有哪些全域元件名稱，也不能因為 `src/index.js` 有 `iButton`，就推論使用者可以 `import { iButton } from 'view-ui-plus'`。兩者屬於不同 surface。

這個觀念對閱讀 Vue component library 很重要，因為 library 往往同時支援三種使用方式：局部 import、全域 plugin 安裝、命令式 service API。不同使用方式背後的型別入口與 runtime 入口可能不同。

### 4.7 新增 Component 時的同步點

原始筆記用新增 `Foo` component 作為例子，整理出至少需要檢查的同步點：

1. runtime component 是否在 `src/components/index.js` export。
2. type declaration 是否有 `types/foo.d.ts`。
3. `types/viewuiplus.components.d.ts` 是否 export `Foo`。
4. `types/index.d.ts` 是否能透過 registry 轉出它。
5. plugin install 是否會透過 `...components` 註冊它。
6. 如果有 alias，`src/index.js` 的 `ViewUI` map 是否需要補。

這可以整理成一條 public component 上架流程：

| 步驟 | 檢查位置 | 要確認的事情 | 如果漏掉可能發生什麼 |
| --- | --- | --- | --- |
| 1 | 元件實作目錄 | `Foo` 的 runtime component 是否存在 | 沒有真正的元件可用 |
| 2 | `src/components/index.js` | 是否 `export { default as Foo } from './foo'` | JavaScript named import 可能失敗 |
| 3 | `types/foo.d.ts` | 是否有 `Foo` 的 declaration | TypeScript 無法描述 `Foo` |
| 4 | `types/viewuiplus.components.d.ts` | 是否轉出 `Foo` | package type entry 看不到 `Foo` |
| 5 | `types/index.d.ts` | 是否透過 registry 間接暴露 | 使用者從套件入口 import 時可能拿不到型別 |
| 6 | `src/index.js` install | 是否會被 `...components` 或額外 map 註冊 | plugin install 後 template 可能無法使用 |
| 7 | `ViewUI` alias map | 是否需要 `iFoo` 這類 alias | 舊版相容或命名習慣可能缺失 |

這個流程其實就是 library public surface 的維護流程。對原始碼閱讀來說，它也提供了一個反向追蹤方法：當你看到某個元件在文件中可以使用，就可以沿著這幾個點去確認它是如何被公開的。

### 4.8 v1.3.20 中可以觀察到的 Registry Gap

原始筆記指出，把 `src/components/index.js` 和 `types/viewuiplus.components.d.ts` 對照後，可以看到兩類差異。

第一類是 runtime 有 named export，但 type registry 沒有明確轉出：

```txt
Copy
ScrollIntoView
ScrollTop
Typography
```

這代表 JavaScript runtime 可能能從 package import 到這些符號，但 TypeScript 使用者是否能得到正確 declaration，需要額外確認。這類差異可以暫時理解成「runtime export 可能沒有 type surface」。

不過，這裡需要保持謹慎。看到這種差異時，不應該立刻下結論說它一定是 bug。比較穩妥的判斷方式是：

1. 先確認 runtime package entry 是否真的讓使用者能 import 這些名稱。
2. 再確認這些名稱是否被官方文件視為 public API。
3. 接著確認 TypeScript 使用者實際 import 時是否報錯。
4. 最後才判斷這是型別遺漏、內部元件未公開，還是版本維護差異。

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

其中部分是合理的 public type helper，例如 `TableColumnConfig`、`MessageConfig`。但這也提醒我們，registry 中的每個名稱都要判斷它是 runtime value、component、還是 purely type-level helper。不能只看到 `export { ... }` 就假設它一定是可在 runtime import 的 component。

對這類差異，可以用下面表格判斷：

| 差異類型 | 現象 | 可能意義 | 需要後續確認 |
| --- | --- | --- | --- |
| Runtime 有、type 沒有 | JS named export 存在，但 `.d.ts` 沒有轉出 | 可能是型別遺漏，也可能是不打算公開給 TS 使用者 | 實際 import 是否報錯、官方文件是否列為 public API |
| Type 有、runtime 沒有 | `.d.ts` 有 export，但 runtime 沒有同名 value | 可能是純型別 helper，也可能是 type overpromise | 該名稱是否只用於 TypeScript 型別位置 |
| Runtime / type 名稱不同 | plugin alias 或內部名稱與 package export 不同 | 可能是不同 surface 的命名策略 | 使用場景是 import、template 還是 service API |
| 同一檔案轉出 component 與 config | 例如 `Table` 與 `TableColumnConfig` | component family 的使用型別一起公開 | config 是否應該跟著主元件一起閱讀 |

這樣判讀可以避免把 registry gap 過早解讀成錯誤，也能幫助你建立更成熟的原始碼閱讀習慣。

---

## 5. 表格整理

### 5.1 核心檔案與責任表

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| Package type entry | `types/index.d.ts` | 作為套件的 TypeScript 型別入口 | 透過 `export * from './viewuiplus.components'` 暴露 component registry | 確認它如何把各種 registry 轉給使用者 |
| Component type registry | `types/viewuiplus.components.d.ts` | 集中轉出公開 component 與相關型別 | 從 `types/*.d.ts` 轉出宣告，支援 package named import | 觀察公開了哪些元件、config、instance-like 型別 |
| Single component declaration | `types/button.d.ts`、`types/table.d.ts` 等 | 描述單一 component 或 component family 的具體型別 | 被 `viewuiplus.components.d.ts` 轉匯出 | 深入 props、emits、instance、helper type |
| Runtime component registry | `src/components/index.js` | 集中轉出 runtime component value | 與 type registry 應盡量同步 | 對照 named exports 是否與 type registry 一致 |
| Runtime package entry | `src/index.js` | 對外 export components，並處理 plugin install | 連接 `src/components/index.js` 與 Vue install 流程 | 分清楚 named export 與全域註冊 |
| Plugin alias map | `src/index.js` 中的 `ViewUI` map | 額外提供 `iButton` 等全域元件 alias | 屬於 plugin install surface，不等於 package named export | 不要用它推斷 TypeScript named exports |

### 5.2 Runtime / Type / Plugin 三種 surface 比較表

| Surface | 使用者怎麼使用 | 主要由誰支撐 | 典型問題 |
| --- | --- | --- | --- |
| Runtime named export | `import { Button } from 'view-ui-plus'` | `src/components/index.js`、`src/index.js` | JavaScript 執行時是否真的有這個 export |
| Type named export | `import { Button } from 'view-ui-plus'` 並取得型別提示 | `types/index.d.ts`、`types/viewuiplus.components.d.ts` | TypeScript 是否知道這個 export |
| Public helper type | `import { TableColumnConfig } from 'view-ui-plus'` | `types/viewuiplus.components.d.ts` 與對應 declaration module | 它是否是純型別，是否不應當成 runtime value |
| Plugin global component | `<Button />` | `src/index.js` install 流程 | `app.use()` 後是否被全域註冊 |
| Plugin alias | `<iButton />` | `src/index.js` 的 `ViewUI` map | alias 是否只存在於 template 全域註冊層 |

### 5.3 Registry 中的非 component 型別整理

| Export | 來源 | 類型 | 閱讀重點 |
| --- | --- | --- | --- |
| `TableColumnConfig` | `./table` | data config / option type | 與 `Table` 的 columns 設計有關，適合和 `Table` declaration 一起閱讀 |
| `TreeChildConfig` | `./tree` | data config type | 與 tree node 結構有關，應觀察資料遞迴形狀 |
| `MessageConfig` | `./message` | service config type | 可能描述 message 全域方法或配置選項 |
| `NoticeConfig` | `./notice` | service config type | 可能描述 notice 全域方法或配置選項 |
| `ModalInstance` | `./modal` | instance-like declaration | 可能與命令式 modal API 或 instance options 有關 |
| `CopyConfig` | `./typography` | feature config type | 與 Typography 的 copy 功能設定有關 |
| `EditConfig` | `./typography` | feature config type | 與 Typography 的 edit 功能設定有關 |
| `EllipsisConfig` | `./typography` | feature config type | 與 Typography 的 ellipsis 功能設定有關 |

這些名稱提醒我們，TypeScript registry 不一定只服務於 Vue component 的 template 使用，也會服務於 JavaScript / TypeScript 使用者在程式碼中建立設定物件、呼叫 service API 或描述資料結構的需求。

### 5.4 新增 public component 的同步檢查表

| 檢查項目 | 檢查位置 | 通過條件 | 漏掉時的風險 |
| --- | --- | --- | --- |
| runtime component 存在 | `src/foo` 或對應元件目錄 | 有可被 import 的 component implementation | 元件沒有實作來源 |
| runtime registry 有 export | `src/components/index.js` | 有 `export { default as Foo } from './foo'` | JS named import 失敗 |
| type declaration 存在 | `types/foo.d.ts` | 有 `Foo` 的 declaration | TS 無法理解 `Foo` |
| type registry 有 export | `types/viewuiplus.components.d.ts` | 有 `export { Foo } from './foo'` | package 型別入口看不到 `Foo` |
| package type entry 可抵達 | `types/index.d.ts` | 能透過 `viewuiplus.components` 間接轉出 | 使用者從套件入口 import 時缺型別 |
| plugin install 會註冊 | `src/index.js` | `Foo` 被 `...components` 或手動 map 註冊 | `app.use()` 後 template 不能用 |
| alias 是否需要 | `src/index.js` 的 `ViewUI` map | 若有命名相容需求，補上 `iFoo` 等 alias | 舊使用方式或文件範例可能不一致 |

這張表可以當成你之後閱讀或設計 component library public surface 的檢查清單。

---

## 6. 範例或情境說明

### 6.1 情境一：使用者 import `Button`

假設使用者寫了下面的程式碼：

```ts
import { Button } from 'view-ui-plus';
```

從 runtime 角度看，`Button` 必須能從套件的 JavaScript 入口被找到。原始筆記中指出 runtime 對應來源大致是：

```txt
src/index.js
  -> export * from './components'

src/components/index.js
  -> export { default as Button } from './button'
```

從 TypeScript 角度看，`Button` 也必須能從套件的型別入口被找到。型別側的路徑大致是：

```txt
types/index.d.ts
  -> export * from './viewuiplus.components'

types/viewuiplus.components.d.ts
  -> export { Button } from './button'

types/button.d.ts
  -> export declare const Button: DefineComponent<...>
```

所以，一個簡單的 `import { Button }` 背後，其實需要 runtime registry 與 type registry 同時成立。這就是為什麼 public component registry 對 UI library 這麼重要。

### 6.2 情境二：使用者 import `TableColumnConfig`

假設使用者想定義 Table columns 的型別：

```ts
import type { TableColumnConfig } from 'view-ui-plus';
```

這裡使用者不是要拿到 runtime component，而是要拿到一個 TypeScript 型別，用來描述欄位設定資料的形狀。這種使用場景可以解釋為什麼 `types/viewuiplus.components.d.ts` 中不只出現 `Table`，也出現 `TableColumnConfig`。

這時候閱讀重點不應該放在「`TableColumnConfig` 是不是 component」，而是要問：

1. 它是不是 public helper type？
2. 它是否只應該出現在 type position？
3. 它跟 `Table` 的 props 或 columns 設計有什麼關係？
4. 它是否應該和 `types/table.d.ts` 一起閱讀？

這個情境能幫助你建立一個觀念：component library 的型別設計不只要描述 component，也要描述使用者會傳入 component 的資料結構。

### 6.3 情境三：使用者在 template 中使用 `<iButton />`

假設使用者在安裝 View UI Plus plugin 後使用：

```vue
<template>
  <iButton>確認</iButton>
</template>
```

這個能力不是由 `types/viewuiplus.components.d.ts` 決定的，而是由 `src/index.js` 中的 plugin install 與 `ViewUI` map 決定的。原始筆記提到 `ViewUI` map 額外加入了：

```js
iButton: components.Button
```

因此，`iButton` 屬於 plugin global component alias。它和下面這種寫法不是同一件事：

```ts
import { Button } from 'view-ui-plus';
```

前者關心的是 Vue app install 後全域註冊了什麼名字；後者關心的是 package named export 是否存在。這兩個 surface 必須分開閱讀。

### 6.4 情境四：發現 runtime/type registry gap

假設你對照 `src/components/index.js` 與 `types/viewuiplus.components.d.ts`，發現 runtime 有 `Copy`，但 type registry 沒有明確轉出 `Copy`。

這時候可以用以下步驟判斷：

1. 實際搜尋 `src/components/index.js`，確認 `Copy` 是否真的是 named export。
2. 搜尋 `types/viewuiplus.components.d.ts`，確認是否沒有 `Copy`。
3. 搜尋是否有 `types/copy.d.ts` 或其他 declaration module 描述 `Copy`。
4. 檢查官方文件或範例是否鼓勵使用者從 package entry import `Copy`。
5. 若 runtime 可 import、文件也公開，但 type 缺失，才比較能判斷是 type registry 漏轉。
6. 若 `Copy` 其實只是內部元件或被其他元件包裝使用，則可能不是 public API。

這種判讀方式可以避免過度武斷，也比較符合大型開源專案閱讀時需要的謹慎態度。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這個主題時，建議不要直接深入單一 component 的 props，而是先建立 public surface 地圖。

1. 先讀 `types/index.d.ts`，確認 View UI Plus 的型別入口如何組合不同 registry。
2. 再讀 `types/viewuiplus.components.d.ts`，觀察有哪些 component、component family 與 helper types 被公開。
3. 接著讀 `src/components/index.js`，和 type registry 逐項對照，找出 runtime/type 是否同步。
4. 再讀 `src/index.js`，觀察 package export 與 plugin install 的關係。
5. 最後挑一組 component family，例如 `Button` / `ButtonGroup` 或 `Table` / `TableColumnConfig`，深入閱讀單一 declaration module。

這條路線的目的，是先理解「這個 UI library 對外公開什麼」，再理解「每個公開項目的型別細節是什麼」。

### 7.2 深入閱讀路線

當你已經理解 registry 的基本作用後，可以進一步做更細的型別系統分析。

1. 選擇一組 component family，例如 `Table`。
2. 閱讀 `types/table.d.ts`，分析 `Table` component declaration、props 型別、slot 型別與 `TableColumnConfig`。
3. 回到 runtime 原始碼，對照 `Table` 實際支援的 props 與事件。
4. 檢查 declaration 是否完整描述 runtime 行為。
5. 檢查 `TableColumnConfig` 是否真的覆蓋常見 columns 使用場景。
6. 將觀察結果整理成單一 component 的型別設計筆記。

這條路線可以幫助你從 registry-level 的地圖，進入 component-level 的型別設計。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以暫時跳過以下內容：

1. 每個 component 的完整 props 泛型細節。
2. 與 registry 無直接關係的樣式檔、DOM 操作與內部 util。
3. 未被 type registry 或 runtime registry 公開的內部元件。
4. plugin install 中和全域設定、locale、directive 有關但與 component registry 無直接關係的內容。

這些不是不重要，而是它們屬於後續章節。若一開始就全部展開，很容易失去本章的主線。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `export { Button } from './button'` 就以為這裡定義了 Button | `export` 語法看起來像是在宣告功能 | 這裡是 re-export，真正的 declaration 在 `types/button.d.ts` |
| 以為 `viewuiplus.components.d.ts` 只會匯出 component | 檔名中有 `components`，容易直覺認為只包含元件 | 它也會匯出 component-related public helper types，例如 `TableColumnConfig`、`MessageConfig` |
| 以為 runtime 有 export，TypeScript 就一定知道 | 在 JavaScript 專案中 runtime export 就足夠 | TypeScript 需要對應 `.d.ts` declaration，否則會缺型別 |
| 以為 type registry 有 export，runtime 一定存在 | 型別系統看起來像是對實作的保證 | `.d.ts` 只描述型別，不產生 runtime value；需要對照 runtime registry |
| 以為 `iButton` 也應該出現在 `viewuiplus.components.d.ts` | `iButton` 也是使用者能看到的元件名稱 | `iButton` 是 plugin global alias，不是 package named export |
| 把所有 registry gap 都當成 bug | 對照表出現差異時很容易直接判定錯誤 | 差異可能代表型別遺漏、純型別 helper、內部元件、不同 surface，需要進一步確認 |
| 只從單一 component 開始讀 | 初學者常想直接看 `Button` 或 `Table` | 先看 registry 可以先建立全局 public surface，再深入單一元件會更有效率 |

---

## 9. 本章總結

`types/viewuiplus.components.d.ts` 是 View UI Plus 在 TypeScript 型別系統中的 component-related public export registry。它的主要工作不是實作元件，也不是詳細描述每個 props，而是把分散在 `types/*.d.ts` 中的元件 declaration 與相關 public helper types 集中轉匯出，讓使用者可以從 package entry 取得型別支援。

閱讀這份檔案時，要特別注意它和 runtime registry 的平行關係。`src/components/index.js` 決定 JavaScript runtime 可以 named import 哪些元件；`types/viewuiplus.components.d.ts` 決定 TypeScript 可以辨識哪些 named exports。兩者若不同步，就可能造成「執行時可用但 TS 不認得」或「TS 編譯通過但執行時壞掉」的問題。

同時，這份 registry 不只公開 component，也公開 config、option、instance-like declaration 等型別。這代表 UI library 的 public type surface 不只是 template 能用哪些元件，也包含使用者在 TypeScript 程式碼中會使用到的設定資料結構與 service API 型別。

最後，`src/index.js` 中的 plugin install 與 `ViewUI` alias map 屬於另一層 surface。`iButton` 這類 alias 是全域註冊名稱，不等於 package named export，也不應直接從 `types/viewuiplus.components.d.ts` 推斷。閱讀 View UI Plus 的型別系統時，必須分清楚 runtime export、type export、plugin global registration 三條線，才能正確理解元件庫的 public API 設計。

---

## 10. 自我檢查問題

1. `types/viewuiplus.components.d.ts` 的主要責任是什麼？它為什麼不是用來分析單一 component props 的地方？
2. `types/index.d.ts` 和 `types/viewuiplus.components.d.ts` 之間是什麼關係？
3. `src/components/index.js` 和 `types/viewuiplus.components.d.ts` 分別決定哪一層的 named exports？
4. 為什麼 runtime registry 有 export，但 type registry 沒有 export，會影響 TypeScript 使用者？
5. 為什麼 type registry 有 export，但 runtime registry 沒有 export，可能造成執行時問題？
6. `TableColumnConfig`、`MessageConfig`、`ModalInstance` 這類名稱為什麼會出現在 component registry 中？
7. `Button` / `ButtonGroup`、`Menu` / `MenuItem` / `Submenu` 這種 grouping 對閱讀元件庫原始碼有什麼幫助？
8. 為什麼不能只看 `types/viewuiplus.components.d.ts` 就判斷 `<iButton />` 是否可用？
9. 新增一個 `Foo` component 時，至少要同步檢查哪些 runtime 與 type 檔案？
10. 當你發現 runtime/type registry gap 時，應該如何判斷它是 bug、型別遺漏、純型別 helper，還是不同 public surface 的正常差異？

---

## 11. 後續延伸方向

這篇筆記建立的是 registry-level 的全局視角。後續可以沿著以下方向繼續拆成更深入的筆記：

1. **`types/index.d.ts` 型別入口分析**：整理 View UI Plus 的完整 package type entry，分析除了 component registry 之外，還有哪些 plugin、directive、locale 或 service 型別被公開。
2. **單一 component declaration 分析**：挑選 `types/button.d.ts`、`types/table.d.ts`、`types/modal.d.ts`，深入分析 `DefineComponent<...>` 中 props、emits、slots、instance 型別如何設計。
3. **Table 型別系統分析**：以 `Table` 與 `TableColumnConfig` 為例，分析資料欄位設定、render function、formatter、selection、tree data 等型別如何描述。
4. **Message / Notice / Modal service API 型別分析**：分析全域命令式 API 的 config type、instance type 與 runtime service 實作之間的關係。
5. **Plugin install 與 global component typing 分析**：分析 `src/index.js` 的 install 流程、`ViewUI` alias map，以及 Vue template 全域元件型別是否有對應支援。
6. **Runtime / Type registry 差異檢查筆記**：針對 v1.3.20 的 `Copy`、`ScrollIntoView`、`ScrollTop`、`Typography` 等差異進行更完整的逐項驗證。
7. **UI library public surface 維護流程**：整理新增、刪除、改名 component 時，runtime、type、文件、測試、plugin install 需要同步更新的完整 checklist。
