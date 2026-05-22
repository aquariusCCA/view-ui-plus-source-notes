# Type System Boundaries and Tradeoffs：型別系統的邊界與取捨

> 所屬目錄：`06-type-system/`  
> 筆記定位：整理 View UI Plus 的 TypeScript 型別設計邊界，包含 `props`、`emits`、component instance、public API、global API、slots 與泛型化能力的取捨。

---

## 0. 原始筆記問題分析

這份原始筆記屬於「原始碼閱讀筆記 + 架構分析筆記 + TypeScript declaration 分析筆記」。它不是單純介紹某個 API，而是在總結 View UI Plus v1.3.20 型別系統的整體邊界：哪些地方已經有實用型別支援，哪些地方仍停留在寬鬆型別，哪些地方則受限於歷史相容性與維護成本。

原始筆記已經抓到幾個很重要的核心觀察，例如：

- View UI Plus 有明確的 `types/` 目錄與 `typings` 入口。
- `types/viewuiplus.components.d.ts` 提供 component registry，讓 named import 有基礎型別。
- 許多 props 已經使用 literal union，能提供實際 autocomplete 與型別保護。
- 仍存在大量 `any`、`Function`、弱化的 event payload 與缺少泛型的資料型元件。
- `$Message`、`$Modal`、`$Notice` 等 global API 只做到 property-level，還沒有完整 service contract。
- `on-change` 這類歷史事件命名會導致 listener prop type 出現 `onOnChange` 這類不自然命名。

不過，原始筆記仍有幾個可以補強的地方。

第一，原始筆記雖然列出了「做得好的地方」與「型別邊界」，但還可以再補一層心智模型：閱讀元件庫型別時，不應只問「有沒有型別」，而應該問「型別精準到哪一層」。例如 `this.$Message` 存在，只是 property-level；`this.$Message.success()` 有參數型別，才是 method-level；Table 的 `row`、`column`、`key` 能互相關聯，才接近 data-flow-level。

第二，原始筆記對 `.d.ts` 和 runtime 分離的問題已經有指出，但可以進一步說明這種架構對 library 維護者與使用者各自代表什麼。對維護者來說，這代表每次改 runtime 都要人工同步 declaration；對使用者來說，這代表 TypeScript 顯示能用，不一定等於 runtime 實際存在或行為完全一致。

第三，原始筆記有提到泛型缺席，但可以補成更完整的「資料型元件型別設計」問題。像 `Table`、`Form`、`Select`、`Tree` 這類元件不只是 props 多，而是資料會在多個位置流動：`data`、`columns`、`row`、`render`、slot props、event payload 之間如果沒有泛型關聯，TypeScript 就只能做表層提示，無法保護資料流。

第四，原始筆記的改善優先順序是正確方向，但還可以補上「為什麼這樣排」。型別改造不應一開始就全面泛型化，因為元件庫的 public API 一旦變嚴格，可能會破壞既有使用者。比較安全的做法是先修 runtime/type 明顯缺口，再補 global service interface，再逐步精準化高頻元件的 event、slot 與 helper types，最後才考慮泛型化 component declaration。

第五，原始筆記已經具備總結性，但如果要放在 `06-type-system/` 目錄下，應該更明確串起此目錄的主題：`props`、`emits`、instance、public API、global API 與泛型。這樣這篇筆記才會像「型別系統總結章」，而不是單篇零散觀察。

---

## 1. 本章定位

本章是 View UI Plus 型別系統閱讀筆記中的「邊界與取捨總結章」。

放在 `06-type-system/` 目錄下時，它的角色不是教你如何寫單一元件的 props type，也不是逐行解析某一個 `.d.ts` 檔案，而是幫你建立一個更高層次的判斷框架：當你閱讀 View UI Plus 的型別宣告時，應該如何判斷它的型別支援到底完整到哪裡，以及為什麼它會停在某些邊界上。

本章要解決的核心問題是：

```txt
View UI Plus v1.3.20 明明有 types/ 目錄，
也能提供不少 props autocomplete，
為什麼仍不能算是一套高度泛型化、payload 精準化的現代型別系統？
```

讀完本章後，應該能理解：

- View UI Plus 型別系統做得好的部分是什麼。
- `JS / SFC runtime` 與 `.d.ts` 分離會帶來什麼同步成本。
- `any`、`Function` 在元件庫型別中為什麼同時代表彈性與風險。
- 為什麼 `on-change` 這類歷史 API 會造成 `onOnChange` 這種不自然的型別命名。
- 為什麼 `$Message: any` 只能算是 property-level 型別支援，而不是完整 service contract。
- 為什麼資料型元件如果缺少泛型，就很難建立 `row`、`model`、`option`、`node` 這類資料流關聯。
- 若要改善這套型別系統，應該採取什麼優先順序，避免一次改太大造成破壞性。

本章不會完整重新設計 View UI Plus 的所有型別，也不會保證列出每一個元件的所有 props、emits 與 slots。若要進一步改造具體元件，例如 `Table`、`Form`、`Select` 或 `$Message`，應該拆成後續獨立筆記處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 元件庫的型別系統不只是在寫 props

很多人在閱讀 Vue 元件庫的 TypeScript 支援時，容易把焦點放在 props 是否有型別。例如看到以下寫法，就會認為這個元件已經有型別支援：

```ts
align?: 'left' | 'right' | 'center';
sortable?: boolean | 'custom';
```

這種判斷只看到 props 層。對元件庫來說，完整的型別系統至少會牽涉到以下幾個層面：

| 層面 | 說明 | 常見位置 |
| --- | --- | --- |
| props type | 描述使用者傳入元件的屬性 | `types/<component>.d.ts` |
| emits / listener type | 描述事件名稱與 payload | listener prop、component declaration |
| slots type | 描述 slot 名稱與 scoped slot props | `'v-slots'` 或 slot declaration |
| instance type | 描述元件實例可被 ref 調用的方法與屬性 | `ModalInstance`、`FormInstance` 等 |
| global API type | 描述 `this.$Message`、`this.$Modal` 等全域 API | `ComponentCustomProperties` |
| public export type | 描述 library 對外匯出的元件、方法與型別 | `types/index.d.ts`、`viewuiplus.components.d.ts` |
| generic data-flow type | 描述資料在 `data`、`model`、`row`、`option`、`node` 之間的關聯 | `Table<T>`、`FormRules<T>`、`FieldPath<T>` 等 |

因此，本章討論的「型別系統邊界」不是只看有沒有 props autocomplete，而是看整套 declaration 是否能描述元件庫的 public API、資料流、事件 payload 與使用者互動方式。

### 2.2 `.d.ts` 是 declaration layer，不等於 runtime 本身

View UI Plus v1.3.20 的重要特徵是：source 主要不是由 TypeScript 直接撰寫，而是由 JavaScript / Vue SFC runtime 搭配 declaration files 對外提供 TypeScript 支援。

可以把它理解成兩層：

```txt
runtime layer
  負責真正執行元件邏輯、渲染、事件、方法、plugin install

declaration layer
  負責告訴 TypeScript 和 IDE：
  這個套件有哪些元件、props、方法、事件、全域屬性與型別
```

這種架構很常見，尤其是從 JavaScript codebase 漸進遷移到 TypeScript 支援的 library。它的好處是可以在不重寫 runtime 的情況下，先補上 TypeScript 使用體驗；代價是 runtime 與 declaration 不會自動保持一致。

換句話說，`.d.ts` 是對外型別契約，但它本身不會保證 runtime 一定真的存在相同 API。當 runtime 新增 prop、event、service method 或 component export 時，維護者需要手動同步 `.d.ts`。如果同步不完整，就會出現「runtime 可以用，但 TypeScript 不知道」或「TypeScript 說可以用，但 runtime 不支援」的落差。

### 2.3 型別精準度可以分層理解

本章最重要的心智模型是：不要用「有型別 / 沒型別」二分法看元件庫，而要判斷 declaration 精準到哪一層。

| 精準層級 | 代表意義 | 範例 |
| --- | --- | --- |
| existence-level | TypeScript 只知道某個東西存在 | `this.$Message` 存在 |
| property-level | TypeScript 知道某個屬性存在，但內容很寬鬆 | `$Message: any` |
| props-level | TypeScript 能提示 props 名稱與部分值域 | `align?: 'left' \| 'right' \| 'center'` |
| method-level | TypeScript 知道方法名稱、參數與回傳值 | `success(config: MessageConfig): CloseFn` |
| payload-level | TypeScript 能描述 event callback 的 payload | `onChange?: (value: string) => void` |
| slot-props-level | TypeScript 能描述 scoped slot 傳入的資料 | `default?: (props: { row: T; index: number }) => any` |
| data-flow-level | TypeScript 能讓資料型別在多個 API 之間互相關聯 | `TableColumn<T>` 的 `key` 只能是 `keyof T` |

View UI Plus v1.3.20 的型別系統大多已達到 props-level 與部分 existence-level / property-level，但在 method-level、payload-level、slot-props-level 與 data-flow-level 還有明顯改善空間。

### 2.4 元件庫型別設計必須平衡四件事

對一般專案來說，型別越精準通常越好。但對元件庫來說，事情比較複雜。因為元件庫面對的是大量使用者與既有程式碼，一旦 public type 改得太嚴格，就可能讓使用者升版後出現大量 TypeScript error。

因此 library 維護者通常要平衡四件事：

| 目標 | 好處 | 可能代價 |
| --- | --- | --- |
| 型別精準 | IDE 提示更好、錯誤更早發現 | 維護成本高，可能破壞既有使用方式 |
| 使用彈性 | 舊專案比較容易升級 | TypeScript 保護力下降 |
| API 相容 | 遷移成本低，使用者不容易被迫改寫 | 可能保留不自然命名或歷史包袱 |
| 維護成本 | declaration 比較容易跟上 runtime | 型別設計深度可能不足 |

所以 View UI Plus 的型別設計不能只用「好」或「不好」評價，而要看它在當時的 codebase、使用者相容性、Vue 3 遷移成本與維護資源下做了什麼取捨。

---

## 3. 整體概覽

### 3.1 View UI Plus 型別系統的大致結構

從原始筆記提供的線索來看，View UI Plus v1.3.20 有明確的 TypeScript declaration layer。它至少包含以下幾個角色：

```txt
package.json
  └─ "typings": "types/index.d.ts"
       ├─ 對外型別入口
       ├─ Vue module augmentation
       ├─ plugin / global API 相關宣告
       └─ 可能匯出 component registry

types/viewuiplus.components.d.ts
  ├─ 集中匯出 public components
  ├─ 支援 named import
  └─ 匯出部分 component helper types

types/<component>.d.ts
  ├─ 描述各元件 props
  ├─ 描述部分 listener props
  ├─ 描述部分 slots
  └─ 描述部分 instance / public API

runtime source
  ├─ 真正的 JS / SFC 元件實作
  ├─ 真正的 props runtime options
  ├─ 真正的 emits 行為
  └─ 真正的 service API 行為
```

這裡的關鍵是：`types/` 目錄讓 TypeScript 使用者有型別入口，但它與 runtime source 是分離的。這也是後面所有型別邊界的根源。

### 3.2 這套型別系統目前的主要成就

原始筆記已經指出 View UI Plus 型別系統有幾個實用成果。

第一，它在 `package.json` 中透過 `typings` 指向 `types/index.d.ts`：

```json
"typings": "types/index.d.ts"
```

這表示 TypeScript 使用者安裝套件後，可以從穩定入口讀到 library 的型別宣告。這是元件庫能支援 TypeScript 的基礎。

第二，它有 component registry，例如：

```ts
export { Button, ButtonGroup } from './button'
export { Table, TableColumnConfig } from './table'
export { Modal, ModalInstance } from './modal'
```

這讓使用者在 named import 元件或型別時，至少能取得基礎型別支援：

```ts
import { Button, Table, Modal } from 'view-ui-plus'
```

第三，許多 props 已經使用 literal union。例如：

```ts
target?: '_blank' | '_self' | '_parent' | '_top';
'label-position'?: 'left' | 'right' | 'top';
align?: 'left' | 'right' | 'center';
sortable?: boolean | 'custom';
```

這種寫法很實用，因為它能讓 IDE 提示可用值，也能阻擋拼錯或傳入不合法字串。

第四，它有 Vue module augmentation，例如：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $VIEWUI: ViewUIPlusGlobalOptions;
    $Message: any;
    $Modal: any;
  }
}
```

這讓 Options API 中的 `this.$Message`、`this.$Modal` 至少不會被 TypeScript 視為不存在。

### 3.3 這套型別系統的主要邊界

從整體來看，View UI Plus v1.3.20 的型別系統可以理解成一套「實用型 declaration layer」，而不是「高度泛型化的完整型別模型」。

它的主要邊界包含：

1. runtime source 與 `.d.ts` 分離，需要人工同步。
2. `any` / `Function` 使用較多，提供彈性但降低保護力。
3. 歷史事件命名如 `on-change` 造成 listener prop type 出現 `onOnChange`。
4. `$Message`、`$Modal`、`$Notice` 等 global API 多半只做到 property-level。
5. `Table`、`Form`、`Select`、`Tree` 等資料型元件缺少泛型資料流關聯。
6. slots 型別通常只能提示 slot 名稱，無法完整描述 scoped slot props。
7. 若要改善型別，需要考慮相容性與維護成本，不能直接全面重寫。

---

## 4. 核心內容逐步講解

### 4.1 好的起點：明確的 type entry

`package.json` 中的 `typings` 是整個型別系統的入口：

```json
"typings": "types/index.d.ts"
```

這個設定的意義是：當 TypeScript 或 IDE 解析 `view-ui-plus` 這個套件時，會知道應該從 `types/index.d.ts` 讀取型別宣告。

對 library 來說，這是很重要的 public contract。因為使用者不會直接知道每個元件的 `.d.ts` 檔案放在哪裡，他們只會透過套件入口取得型別資訊。只要這個入口穩定，後續不管內部怎麼拆分 `button.d.ts`、`table.d.ts`、`modal.d.ts`，使用者都能從同一個入口取得型別支援。

但是要注意，`typings` 只解決「TypeScript 從哪裡讀型別」的問題，不代表型別內容一定完整，也不代表它和 runtime 一定同步。它是型別系統的門口，不是型別品質的保證。

### 4.2 Component registry：讓 public components 有集中出口

`types/viewuiplus.components.d.ts` 這類檔案通常扮演 component registry 的角色。原始筆記中的例子是：

```ts
export { Button, ButtonGroup } from './button'
export { Table, TableColumnConfig } from './table'
export { Modal, ModalInstance } from './modal'
```

這類 registry 的意義是把散落在各元件檔案中的型別集中起來，形成對外可匯入的 public components 與 helper types。

對使用者來說，它支援以下使用方式：

```ts
import { Table } from 'view-ui-plus'
import type { TableColumnConfig } from 'view-ui-plus'
```

對維護者來說，它提供一個集中管理 public export 的地方。當新增元件或新增 helper type 時，除了 runtime export 外，也要確認 declaration registry 是否同步。

這裡的風險在於：如果 runtime 已經 export 某個元件，但 `viewuiplus.components.d.ts` 沒有 export，使用者在 TypeScript 中可能會無法 named import；反過來，如果 `.d.ts` 宣告了某個 export，但 runtime 沒有實際 export，就可能在執行時出錯。

所以 component registry 的閱讀重點不是只看有哪些元件，而是要問：

```txt
這裡列出的 public component 與 runtime 對外 export 是否一致？
helper types 是否真的對應到使用者會需要的 public API？
```

### 4.3 Literal union props：最實用的 props-level 保護

View UI Plus 的許多 props 使用 literal union，例如：

```ts
target?: '_blank' | '_self' | '_parent' | '_top';
'label-position'?: 'left' | 'right' | 'top';
align?: 'left' | 'right' | 'center';
sortable?: boolean | 'custom';
```

這種型別設計是元件庫最直接、最容易產生價值的地方。因為元件 props 常常有固定值域，如果只寫成 `string`，TypeScript 只能知道它是字串，無法知道哪些字串合法。

比較一下兩種寫法：

```ts
// 寬鬆，但保護力低
align?: string;

// 精準，能提示可用值
align?: 'left' | 'right' | 'center';
```

第二種寫法能帶來幾個好處：

1. IDE 可以提示合法值。
2. 使用者拼錯時會在開發階段被攔下。
3. 文件與型別可以互相補充，使用者不用一直查文件。
4. 型別本身成為一種 public API 說明。

不過 literal union 主要解決的是 props-level 的問題。它可以讓 `align`、`target` 這類靜態值域更安全，但還無法處理複雜資料流。例如 `Table` 的 `columns.key` 是否必須對應到 `data` 裡的 row key，單靠 literal union 無法解決，通常需要泛型才做得到。

### 4.4 Vue module augmentation：讓 global properties 被 TypeScript 承認

Vue 3 的 Options API 中，元件實例上的全域屬性需要透過 module augmentation 告訴 TypeScript。原始筆記中的例子是：

```ts
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $VIEWUI: ViewUIPlusGlobalOptions;
    $Message: any;
    $Modal: any;
  }
}
```

這段型別的作用是擴充 Vue 的 `ComponentCustomProperties`，讓 TypeScript 知道在 component instance 上存在 `$VIEWUI`、`$Message`、`$Modal` 這些屬性。

如果沒有這段宣告，Options API 中寫：

```ts
this.$Message.success('儲存成功');
```

可能會出現類似「`$Message` does not exist on type ...」的錯誤。透過 module augmentation，TypeScript 至少知道 `this.$Message` 是存在的。

但這裡的關鍵是：`$Message: any` 只表示這個 property 存在，並不表示 `$Message` 的方法、參數與回傳值有被精準描述。

也就是說：

```txt
this.$Message 存在
```

和：

```txt
this.$Message.success(options) 的參數結構、回傳值、可用方法都被完整描述
```

是兩個不同層級的型別支援。

View UI Plus 在這裡完成的是 property-level 支援，而不是完整 service interface。這讓使用者可以先正常使用全域 API，但 TypeScript 無法對 `$Message.success`、`$Modal.confirm` 這類方法提供精準保護。

### 4.5 邊界一：JS Runtime 與 `.d.ts` 分離

View UI Plus v1.3.20 的 source 主要不是 TypeScript 寫成，而是 JS / SFC runtime 搭配 declaration files。這帶來最基本的架構邊界：

```txt
runtime code 不會自動產生型別
.d.ts 也不會自動保證 runtime 存在
```

如果 library 是用 TypeScript 寫成，某些型別可以直接從原始碼推導或由建置流程產生。但當 runtime 是 JS / SFC，而型別另外寫在 `.d.ts` 裡，就會形成兩套需要同步維護的資料：

| runtime 改動 | `.d.ts` 需要同步檢查 |
| --- | --- |
| 新增 prop | `types/<component>.d.ts` 是否補上 props |
| 新增 emit | listener prop type 或 emits type 是否補上 |
| 新增 slot props | `'v-slots'` 或 slot declaration 是否補上 scoped props |
| 新增 instance method | instance type 是否補上方法 |
| 新增 global property | `ComponentCustomProperties` 是否補上 |
| 新增 named export | `viewuiplus.components.d.ts` 或 `types/index.d.ts` 是否補上 |
| 新增 service method | service API type 是否補上 |

這種分離架構的好處是可以在不重寫 runtime 的情況下補 TypeScript 支援；缺點是同步成本高，而且容易產生 declaration drift，也就是型別宣告與實際 runtime 行為逐漸偏離。

閱讀這類元件庫時，要養成一個習慣：看到 `.d.ts` 中的型別宣告後，最好回到 runtime source 或文件確認它是否真的存在、是否行為一致。反過來，看到 runtime 中有某個功能，也要檢查 `.d.ts` 是否讓 TypeScript 使用者能正常取得型別提示。

### 4.6 邊界二：`any` / `Function` 是彈性也是風險

原始筆記列出一些常見弱型別：

```ts
data?: any[];
columns?: any[];
render?: Function;
rules?: object;
$Message: any;
```

這些型別不是完全沒有意義，它們通常代表 library 在相容性與維護成本上的取捨。

例如 `data?: any[]` 讓使用者可以把任何 row 結構丟進 Table，不會因為型別太嚴格而被阻擋。`render?: Function` 可以快速涵蓋各種 render callback，不需要精準建模所有參數與回傳型別。`$Message: any` 則可以讓全域 service 先被 TypeScript 承認存在，而不必馬上完整設計 service interface。

這些寫法的好處是：

1. 維護成本低。
2. 舊專案比較容易升級。
3. 不容易擋住使用者既有寫法。
4. 適合從 JS codebase 過渡到 TypeScript declaration。
5. 對複雜 callback、render function、service API 可以快速提供最低限度支援。

但代價也很明顯：

1. event payload 不精準。
2. callback 參數不清楚。
3. service method 打錯 TypeScript 也可能放過。
4. `Table`、`Form`、`Select`、`Tree` 這類資料型元件無法建立資料關聯。
5. IDE autocomplete 只能提示到表面層，無法深入資料結構。
6. 使用者在重構時，很難依賴 TypeScript 找出錯誤。

因此，`any` / `Function` 在 library 型別中不是絕對錯誤，而是一種彈性優先的設計。閱讀時要判斷它出現在哪裡：如果是非常底層、難以精準建模的 extension point，可能可以接受；如果是高頻 public API、重要事件 payload 或資料型元件核心資料流，就會明顯降低型別價值。

### 4.7 邊界三：事件命名相容性造成 listener prop type 不自然

View UI Plus 保留 `on-change`、`on-visible-change` 這類事件命名習慣。這可能與它的歷史 API、舊版使用習慣或遷移相容性有關。

在 Vue template 中，使用者可能會寫：

```vue
<Select @on-change="handleChange" />
<Modal @on-visible-change="handleVisibleChange" />
```

當這種事件名稱被轉成 listener prop type 時，就可能出現原始筆記中提到的寫法：

```ts
onOnChange?: (event?: any) => any;
onOnVisibleChange?: (event?: any) => any;
```

這裡看起來不自然，是因為 Vue 的 listener prop 命名本來就會加上 `on` 前綴，而事件名稱本身又已經包含 `on-`。因此：

```txt
@on-change
  轉成 listener prop
onOnChange
```

這不是單純命名醜，而是相容性取捨的結果。

| 選擇 | 好處 | 代價 |
| --- | --- | --- |
| 保留 `@on-change` | 舊使用者遷移成本低，API 習慣延續 | TypeScript listener prop 會變成 `onOnChange` |
| 改成 `@change` | listener prop 更自然，例如 `onChange` | 破壞既有 API 習慣，升級成本高 |
| 同時支援兩者 | 遷移較平滑 | runtime 與 type 都更複雜，需要長期維護別名 |

對元件庫來說，相容性常常比型別命名優雅更重要。尤其是已經有大量使用者依賴 `@on-change` 的情況下，直接改成 `@change` 可能不是合理選擇。

因此閱讀這種型別時，不要只看 `onOnChange` 很奇怪，而要理解它背後代表的是：library 選擇保留歷史事件命名，讓使用者遷移成本較低，但型別層面會留下不自然命名。

### 4.8 邊界四：Global API 只做到 Property-level

View UI Plus 的 `$Message`、`$Modal`、`$Notice` 等 global API 在 `ComponentCustomProperties` 中若被宣告為 `any`，代表它只完成 property-level：

```ts
interface ComponentCustomProperties {
  $Message: any;
  $Modal: any;
}
```

這種宣告只讓 TypeScript 知道：

```txt
this.$Message 這個屬性存在
this.$Modal 這個屬性存在
```

但它沒有讓 TypeScript 知道：

```txt
this.$Message.success 的參數型別
this.$Message.error 的參數型別
this.$Message.loading 的回傳值
this.$Modal.confirm 的 options 型別
this.$Modal.remove 的方法是否存在
```

比較理想的 service interface 可能會像這樣：

```ts
type MessageContent = string | {
  content: string;
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
};

type MessageCloseFn = () => void;

interface MessageInstance {
  info(config: MessageContent): MessageCloseFn;
  success(config: MessageContent): MessageCloseFn;
  warning(config: MessageContent): MessageCloseFn;
  error(config: MessageContent): MessageCloseFn;
  loading(config: MessageContent): MessageCloseFn;
  destroy(): void;
}
```

> 注意：上面只是說明「service interface 可以如何思考」的範例，不代表 View UI Plus v1.3.20 的實際 API 已經完全如此。實際方法、參數與回傳值需要回到 runtime source 或官方文件確認。

如果能把 `$Message: any` 改成 `$Message: MessageInstance`，TypeScript 就可以提示可用方法，也能在使用者傳錯 options 時提供錯誤。但這種改造需要先確認 runtime 的真實行為，否則容易寫出看似精準但不符合實作的型別。

### 4.9 邊界五：資料型元件缺少泛型，導致資料流無法被保護

資料型元件的難點不在於 props 多，而在於資料會流經多個 API。以 `Table` 為例，常見資料流可能包含：

```txt
data row
  ├─ columns.key
  ├─ render(row, column, index)
  ├─ scoped slot props
  └─ event payload
```

如果 `data` 是 `any[]`，`columns` 是 `any[]`，那 TypeScript 不知道 row 長什麼樣，也無法檢查 column key 是否真的存在於 row 上。

原始筆記列出的典型問題如下：

| 元件 | 目前常見寬鬆型別 | 泛型可改善的方向 |
| --- | --- | --- |
| Table | `data?: any[]` | 建立 row type |
| TableColumnConfig | `key?: string` | 限制為 `keyof TRecord` |
| Form | `model?: object` | 建立 `TModel` |
| FormItem | `prop?: string` | 建立 `FieldPath<TModel>` |
| Select | value 型別寬鬆 | 建立 `TValue` |
| Tree | node 型別寬鬆 | 建立 `TNode` |

以 `Table` 為例，泛型化後可以讓 column key 與 row type 產生關聯：

```ts
interface TableColumn<TRecord> {
  key?: keyof TRecord;
  title?: string;
  render?: (params: {
    row: TRecord;
    column: TableColumn<TRecord>;
    index: number;
  }) => any;
}
```

如果 row type 是：

```ts
interface UserRow {
  id: number;
  name: string;
  age: number;
}
```

那麼：

```ts
const columns: TableColumn<UserRow>[] = [
  { key: 'name', title: '姓名' },
  { key: 'age', title: '年齡' },
  { key: 'email', title: 'Email' } // 若 UserRow 沒有 email，TypeScript 可攔截
];
```

這就是 data-flow-level 型別保護。它不只是知道 `key` 是字串，而是知道 `key` 必須來自 row 的欄位。

不過，對現有元件庫來說，直接把所有資料型元件泛型化風險很高。因為 public declaration 一旦變嚴格，可能讓大量既有使用者的程式碼開始報錯。所以比較務實的方式通常是先導出 helper types，例如：

```ts
export type TableColumn<TRecord = any> = ...
export type FormRules<TModel = any> = ...
```

這樣既能讓需要嚴格型別的使用者逐步使用，也能保留舊使用者的寬鬆用法。

### 4.10 邊界六：Slots 型別通常只能做到提示名稱

原始筆記提到有些元件的 `.d.ts` 可能會用以下方式描述 slots：

```ts
'v-slots'?: {
  header?: () => any;
  footer?: () => any;
}
```

這種寫法可以提示 slot 名稱，例如 `header`、`footer`，但它無法完整描述 scoped slot props。

以資料型元件為例，slot 可能會傳入：

```txt
row
column
index
option
node
```

如果型別只寫成：

```ts
default?: () => any;
```

那 TypeScript 只能知道有一個 default slot，但不知道 slot function 會收到哪些 props。比較完整的設計會像：

```ts
'v-slots'?: {
  default?: (props: {
    row: TRecord;
    column: TableColumn<TRecord>;
    index: number;
  }) => any;
}
```

這樣使用者在撰寫 slot 時，IDE 才能提示 `row.name`、`row.age`、`index` 等資料。

但是 slots 型別精準化通常比 props 更難，因為它需要同時對齊 runtime slot 傳參、template 使用方式、JSX/TSX 使用方式與 Vue 型別能力。對 `Table`、`Tree`、`Select` 這類元件來說，slot props 型別會直接影響使用者開發體驗，因此適合列為後續重點改良方向。

### 4.11 型別改良的優先順序：先補缺口，再提高精準度

如果要改善 View UI Plus 的型別系統，不建議一開始就全面重寫或全面泛型化。比較安全的策略是分階段處理。

第一階段應該先補 runtime/type 明顯缺口。例如 runtime 有某個 prop、named export、global API，但 `.d.ts` 沒有宣告，這類問題最直接，也最容易驗證。

第二階段可以補 `$Message`、`$Modal`、`$Notice` 等 service interface，把 `any` 逐步替換成可描述方法、參數與回傳值的型別。這會大幅改善全域 API 的 IDE 提示與錯誤檢查。

第三階段可以精準化高頻元件的 event payload，例如 `Input`、`Select`、`Table`、`Form`。這些元件使用頻率高，payload 型別越清楚，使用者收益越大。

第四階段可以導出資料型元件 helper types，例如：

```ts
TableColumn<TRecord>
TableRenderParams<TRecord>
FormRules<TModel>
SelectOption<TValue>
TreeNode<TNode>
```

這種方式可以先提供進階使用者更精準的型別工具，又不一定要立刻修改所有 component declaration。

第五階段才適合考慮泛型化 component declaration。這通常是破壞性最大、設計成本最高的階段，必須謹慎評估 Vue 型別系統、現有使用者寫法與相容性策略。

---

## 5. 表格整理

### 5.1 View UI Plus 型別系統能力地圖

| 型別區塊 | 目前觀察 | 支援層級 | 閱讀重點 |
| --- | --- | --- | --- |
| `package.json` 的 `typings` | 指向 `types/index.d.ts` | type entry | 確認 TypeScript 從哪裡讀取套件型別 |
| `types/index.d.ts` | 作為主要型別入口，並可能包含 Vue module augmentation | public API / global type | 觀察 plugin、global properties 與主要 export |
| `types/viewuiplus.components.d.ts` | 集中匯出 public components 與部分 helper types | component registry | 檢查 named import 與 runtime export 是否一致 |
| component `.d.ts` | 描述單一元件 props、listener、slots、instance | props-level / partial API | 觀察 props 是否精準，callback 是否仍是 `any` |
| literal union props | `align`、`target`、`sortable` 等固定值域 | props-level | 這是目前最實用的型別保護之一 |
| Vue module augmentation | 宣告 `$VIEWUI`、`$Message`、`$Modal` 等 | property-level | 只代表 property 存在，不代表 service contract 完整 |
| service API | `$Message`、`$Modal` 等可能為 `any` | property-level / weak method-level | 需要後續補 service interface |
| data components | `Table`、`Form`、`Select`、`Tree` 等缺少泛型關聯 | weak data-flow-level | 需要 helper types 或泛型化設計 |
| slots | 部分元件可提示 slot 名稱 | slot-name-level | scoped slot props 需要後續確認與補強 |

### 5.2 型別邊界與設計取捨

| 邊界 | 形成原因 | 好處 | 代價 | 改良方向 |
| --- | --- | --- | --- | --- |
| JS runtime 與 `.d.ts` 分離 | source 主要不是 TypeScript 撰寫 | 不必重寫 runtime 也能提供型別 | 需要人工同步，容易 declaration drift | 建立 runtime/type 檢查清單 |
| 使用 `any` / `Function` | 兼容複雜 API 與舊使用方式 | 彈性高、維護成本低 | payload、callback、service contract 不精準 | 從高頻 public API 開始替換 |
| `onOnChange` 命名 | 保留 `@on-change` 歷史事件命名 | 舊使用者遷移成本低 | listener prop 命名不自然 | 可考慮長期支援 alias，但需評估破壞性 |
| Global API 為 `any` | 先做到 property 存在 | Options API 可正常使用 | 方法參數與回傳值無保護 | 補 `$Message`、`$Modal`、`$Notice` interface |
| 資料型元件缺少泛型 | 泛型化會增加設計與相容成本 | declaration 簡單，使用者不易被限制 | row/model/option/node 無法建立型別關聯 | 先導出 helper types，再考慮泛型 component |
| slots 型別不精準 | scoped slot props 建模成本較高 | 可先提示 slot 名稱 | slot props 無法 autocomplete | 從 Table、Tree、Select 等高頻元件開始補 |

### 5.3 型別精準度分層表

| 精準度 | 判斷標準 | View UI Plus 目前常見狀態 | 改善價值 |
| --- | --- | --- | --- |
| existence-level | 只知道某個東西存在 | module augmentation 中的 global property | 避免 TypeScript 報不存在 |
| props-level | 能提示 props 與固定值域 | literal union props | 提升 template / JSX 使用體驗 |
| method-level | 能提示方法、參數與回傳值 | service API 仍有改善空間 | 避免 method name、options 結構錯誤 |
| payload-level | 能描述 event callback payload | 許多 listener 使用 `any` | 改善事件處理與重構安全性 |
| slot-props-level | 能描述 scoped slot props | 多數仍需後續確認 | 改善 template slot 使用體驗 |
| data-flow-level | 能讓 row/model/option/node 在多 API 間關聯 | 泛型缺席導致不足 | 對 Table、Form、Select、Tree 價值最高 |

### 5.4 型別改良優先順序

| 優先順序 | 改良項目 | 原因 | 風險 |
| --- | --- | --- | --- |
| 1 | 補 runtime/type 明顯缺口 | 最容易驗證，收益直接 | 低 |
| 2 | 補 global service interface | `$Message`、`$Modal` 使用頻率高 | 中低 |
| 3 | 精準化高頻元件 event payload | 事件是元件互動核心 | 中 |
| 4 | 導出資料型元件 helper types | 可逐步提升嚴格度，不強迫所有使用者 | 中 |
| 5 | 補 scoped slot props | 對 Table、Tree、Select 很有幫助 | 中高 |
| 6 | 泛型化 component declaration | 最能提升 data-flow-level 保護 | 高 |

---

## 6. 範例或情境說明

### 6.1 情境一：為什麼 `Table` 的 `key?: string` 不夠精準

假設使用者有以下資料：

```ts
interface UserRow {
  id: number;
  name: string;
  age: number;
}

const data: UserRow[] = [
  { id: 1, name: 'Alex', age: 20 }
];
```

如果 `TableColumnConfig` 只有：

```ts
interface TableColumnConfig {
  key?: string;
  title?: string;
}
```

那麼以下錯誤 TypeScript 也可能放過：

```ts
const columns: TableColumnConfig[] = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: 'Email' } // UserRow 其實沒有 email
];
```

因為 `key` 只是 `string`，TypeScript 不知道它應該對應到 `UserRow` 的欄位。

如果改成泛型 helper type：

```ts
interface TableColumn<TRecord> {
  key?: keyof TRecord;
  title?: string;
}
```

就可以建立 row 與 column key 的關聯：

```ts
const columns: TableColumn<UserRow>[] = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: 'Email' } // TypeScript 可以提示錯誤
];
```

這說明泛型不是為了炫技，而是為了讓資料型元件的多個 API 共享同一份資料結構。

### 6.2 情境二：為什麼 `$Message: any` 只能算最低限度支援

如果 declaration 寫成：

```ts
interface ComponentCustomProperties {
  $Message: any;
}
```

那使用者寫：

```ts
this.$Message.succes('儲存成功');
```

即使 `success` 拼錯成 `succes`，TypeScript 也可能不會報錯，因為 `$Message` 是 `any`。

如果有更精準的 interface：

```ts
interface MessageInstance {
  success(content: string): () => void;
  error(content: string): () => void;
}

interface ComponentCustomProperties {
  $Message: MessageInstance;
}
```

那麼 `this.$Message.succes()` 就會被 TypeScript 擋下。

這說明 global API 的型別不應只滿足「不報錯」，更理想的目標是描述 service method 的真正 contract。不過在實務上，必須先確認 `$Message` runtime 的完整方法、參數形式與回傳值，不能憑空設計。

### 6.3 情境三：為什麼 `@on-change` 會變成 `onOnChange`

當元件事件叫做 `on-change` 時：

```vue
<Select @on-change="handleChange" />
```

Vue / TSX listener prop 可能會形成：

```ts
onOnChange?: (event?: any) => any;
```

這是因為 listener prop 通常會加 `on` 前綴，而事件名稱本身又已經有 `on-`。

這個命名雖然不美觀，但它保留了舊 API 相容性。如果 library 直接改成：

```vue
<Select @change="handleChange" />
```

那 listener prop 會變成較自然的：

```ts
onChange?: (event?: any) => any;
```

但所有使用 `@on-change` 的既有使用者都可能需要遷移。因此這不是單純型別命名問題，而是 API 相容性問題。

### 6.4 情境四：Slots 型別若不描述 props，使用體驗會停在表層

假設 `Table` 的 scoped slot 實際會給：

```txt
row
column
index
```

如果型別只寫：

```ts
'v-slots'?: {
  default?: () => any;
}
```

使用者在 slot 中就無法取得清楚的 `row` 型別提示。

比較理想的方向是：

```ts
'v-slots'?: {
  default?: (props: {
    row: TRecord;
    column: TableColumn<TRecord>;
    index: number;
  }) => any;
}
```

這樣使用者在 slot 中操作 `row.name`、`row.age` 時，IDE 才能提供正確提示。這也是為什麼 slots 型別與泛型常常需要一起思考。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 View UI Plus 型別系統時，建議不要直接從複雜元件開始，而是按照型別入口到元件細節的順序閱讀。

1. 先看 `package.json`  
   目的：確認 `typings` 指向哪個檔案，理解 TypeScript 解析套件型別的入口。

2. 再看 `types/index.d.ts`  
   目的：理解 View UI Plus 對外型別入口、plugin 相關型別與 Vue module augmentation。

3. 接著看 `types/viewuiplus.components.d.ts`  
   目的：掌握 public components 與 helper types 的集中出口。

4. 再選一個簡單元件，例如 `Button`  
   目的：觀察一般 props、literal union、listener prop 的宣告方式。

5. 再選一個複雜資料型元件，例如 `Table` 或 `Form`  
   目的：觀察 `any`、`Function`、資料流缺少泛型的地方。

6. 最後看 global service，例如 `$Message`、`$Modal`  
   目的：判斷 global API 目前是 property-level 還是 method-level。

### 7.2 深入閱讀路線

如果已經理解基本結構，可以進一步對照 runtime source 與 `.d.ts`。

1. 選一個元件，例如 `Table`。
2. 先閱讀 runtime props、emits、slots 與 public methods。
3. 再閱讀對應的 `types/<component>.d.ts`。
4. 建立一張對照表，檢查 runtime 與 declaration 是否一致。
5. 特別標出使用 `any`、`Function`、`object`、`string` 的地方。
6. 判斷這些弱型別是合理彈性，還是應該被精準化。
7. 最後設計 helper type，而不是直接改整個 component declaration。

### 7.3 可以暫時跳過的部分

初學者剛開始閱讀時，可以先暫時跳過以下內容：

- 全面泛型化 component declaration。
- 複雜 JSX / TSX slot typing。
- 完整重寫所有 service API types。
- 為所有元件建立嚴格 payload model。
- 設計自動化 runtime/type 一致性檢查工具。

這些都屬於進階改造主題。初期更重要的是先看懂現有 declaration layer 的結構、邊界與取捨。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 看到 `types/` 目錄就以為型別完整 | TypeScript 能讀到型別入口，會讓人以為支援完整 | `types/` 只代表有 declaration layer，還要看精準到哪一層 |
| 看到 props 有 autocomplete 就以為整套型別很好 | props-level 是最容易做出效果的部分 | event payload、slots、instance、service API、泛型資料流也要一起看 |
| 認為 `any` 一定是壞設計 | 在 library 過渡期，`any` 有時是為了兼容既有使用者 | 關鍵是判斷 `any` 出現在 extension point 還是高頻 public API |
| 認為 `onOnChange` 是設計失誤 | 命名確實不自然，但它背後通常是歷史事件命名相容性 | 應從 API 相容性與遷移成本理解，而不是只看命名美觀 |
| 認為 `$Message: any` 等於已完成 global API 型別 | `any` 只讓 property 存在 | 完整 global API 型別應包含方法、參數、options 與回傳值 |
| 認為泛型越多越好 | 泛型會提高精準度，但也會提高 public API 複雜度 | 元件庫應先導出 helper types，再逐步考慮泛型化 declaration |
| 認為 `.d.ts` 一定和 runtime 同步 | `.d.ts` 是人工維護時可能和 runtime 偏離 | 閱讀時應對照 runtime source、文件與型別宣告 |
| 認為 slots 只要知道名稱就夠 | 對靜態 layout slot 可能足夠，但資料型元件通常需要 scoped props | Table、Tree、Select 這類元件應重視 slot props 型別 |

---

## 9. 本章總結

View UI Plus v1.3.20 的型別系統可以理解成一套實用的 declaration layer。它有明確的 `typings` 入口、集中式 component registry、許多 literal union props，也透過 Vue module augmentation 讓 `$VIEWUI`、`$Message`、`$Modal` 等全域屬性至少能被 TypeScript 承認存在。

這些設計已經能提供不少實際價值，尤其是在 props autocomplete、固定值域檢查、named import 與基礎 global property 使用上。對從 JavaScript codebase 過渡到 TypeScript 支援的元件庫來說，這是一個務實起點。

但它的主要邊界也很清楚：runtime source 與 `.d.ts` 分離，需要人工同步；許多地方仍使用 `any`、`Function`、`object` 等寬鬆型別；事件 payload 不夠精準；global service 多半只做到 property-level；資料型元件缺少泛型，因此無法讓 `row`、`model`、`option`、`node` 在 props、slots、events、render callback 之間建立型別關聯。

因此閱讀這套型別系統時，不應只問「View UI Plus 有沒有 TypeScript 型別」，而應該問：

```txt
這個 declaration 精準到哪一層？
是 existence-level、property-level、props-level、method-level、
payload-level、slot-props-level，還是 data-flow-level？
```

如果未來要改善，合理路線不是一次全面重寫，而是先補 runtime/type 明顯缺口，再補 global service interface，接著精準化高頻元件 event payload，然後導出資料型元件 helper types，最後才評估泛型化 component declaration。這樣才能在提升型別品質的同時，降低對既有使用者的破壞性。

---

## 10. 自我檢查問題

1. 為什麼 View UI Plus v1.3.20 的 `.d.ts` 與 runtime 分離會帶來同步成本？
2. `package.json` 中的 `"typings": "types/index.d.ts"` 解決的是什麼問題？它不能保證什麼？
3. `types/viewuiplus.components.d.ts` 在型別系統中扮演什麼角色？
4. literal union props 為什麼能提供實際保護？它又無法解決哪些問題？
5. `any` / `Function` 在元件庫型別中有哪些好處？又有哪些風險？
6. 為什麼 `@on-change` 可能在 listener prop type 中變成 `onOnChange`？
7. 為什麼 `$Message: any` 只能算 property-level，而不是完整 service contract？
8. 對 `Table` 這類資料型元件來說，泛型可以改善哪些資料流問題？
9. slots 型別只提示 slot 名稱，和完整描述 scoped slot props，有什麼差異？
10. 如果要改善 View UI Plus 型別系統，為什麼不建議一開始就全面泛型化？

---

## 11. 後續延伸方向

這篇筆記可以延伸成以下幾個更深入的主題。

### 11.1 `$Message` / `$Modal` / `$Notice` service interface 設計

可以專門分析 global service 的 runtime API，確認每個方法的參數、options 與回傳值，再設計對應 interface。這會把 global API 從 property-level 提升到 method-level。

### 11.2 `Table<TRecord>` 與 `TableColumn<TRecord>` 泛型設計

可以針對 `Table` 建立完整泛型模型，研究如何讓 `data`、`columns.key`、`render`、scoped slot props 與 event payload 共用同一個 row type。

### 11.3 `Form<TModel>`、`FormRules<TModel>` 與 `FieldPath<TModel>`

可以針對 `Form` / `FormItem` 研究 `model`、`rules`、`prop` 的關聯，尤其是如何讓 `prop` 對應到 `model` 的欄位路徑。

### 11.4 `Select<TValue, TOption>` 型別設計

可以研究 `Select` 的 value、option、label、event payload 與 slot props 如何建立泛型關聯。

### 11.5 `Tree<TNode>` 節點型別設計

可以分析 `Tree` 的 node 結構、children、checked、selected、render、slot props 與 event payload 如何建立型別模型。

### 11.6 Event payload 精準化策略

可以挑選高頻元件，例如 `Input`、`Select`、`Table`、`Form`，逐一整理事件名稱、runtime payload 與 `.d.ts` listener type，建立 event typing 對照表。

### 11.7 Slot props 型別對照表

可以整理哪些元件有 scoped slots，實際會傳哪些 props，目前 `.d.ts` 是否有描述，哪些地方需要補強。

### 11.8 Runtime 與 Declaration 一致性檢查清單

可以設計一份維護者用 checklist，當 runtime 新增 prop、emit、slot、method、export 或 service API 時，如何同步檢查 `.d.ts` 是否更新。

### 11.9 View UI Plus 型別改造風險評估

可以從 library 維護角度分析：哪些型別改動是 non-breaking，哪些可能是 breaking change，哪些適合透過 helper types 漸進提供。

---

## 附錄：本章核心判斷句

閱讀 View UI Plus 的型別系統時，最重要的判斷不是：

```txt
它有沒有 TypeScript？
```

而是：

```txt
它的型別支援精準到哪一層？
```

如果一個宣告只告訴你 property 存在，那是 property-level；如果它能描述方法參數與回傳值，那是 method-level；如果它能讓 row、model、option、node 在不同 API 之間建立關聯，那才接近 data-flow-level。

View UI Plus v1.3.20 的型別系統已經能提供實用的 props-level 與基礎 public API 支援，但在 global service、event payload、slot props 與泛型資料流上，仍有明確的改良空間。
