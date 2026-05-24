# View UI Plus `Avatar` / `AvatarList` 原始碼閱讀筆記：從單一展示元件到列表聚合元件

## 1. 本章定位

本章是一篇 **View UI Plus `Avatar` / `AvatarList` 原始碼閱讀地圖**，目的不是直接完成逐行源碼解析，而是先幫你建立「閱讀這組元件時應該怎麼切入」的整體框架。

讀完本章後，你應該能理解三件事。

第一，你應該知道 `Avatar` / `AvatarList` 的關鍵檔案分布在哪裡，包括 runtime 元件、單元件入口、樣式檔、型別宣告、範例頁、元件註冊與全域安裝入口。

第二，你應該能清楚區分 `Avatar` 與 `AvatarList` 的責任。`Avatar` 解決的是單一頭像顯示問題，例如圖片、icon、文字 slot、尺寸、形狀、圖片錯誤事件與文字縮放；`AvatarList` 解決的是多個頭像聚合問題，例如根據 `list` 產生多個 `Avatar`、是否包 `Tooltip`、超出數量如何顯示、額外 slot 如何插入，以及列表重疊樣式如何呈現。

第三，你應該建立一個重要的元件庫閱讀習慣：不要只看 `.d.ts` 或 example 就以為理解了元件行為。真正的行為來源應該以 runtime source 為準，`.d.ts`、example、style、consumer 都是輔助你理解 public contract 與實際使用方式的材料。

本章不解決以下問題：

- 不逐行分析 `avatar.vue` 裡每個 computed 的完整實作。
- 不逐行分析 `avatar-list.vue` 的 template、computed 與 slot 判斷。
- 不完整拆解 `avatar.less` / `avatar-list.less` 每個 selector 的 CSS 細節。
- 不直接修正 `.d.ts`，只指出目前筆記中已觀察到的型別與 runtime 落差。

這些內容適合拆成後續獨立筆記，例如「`Avatar` runtime 逐行分析」、「`AvatarList` 聚合邏輯分析」、「樣式系統分析」與「型別宣告修正建議」。

---

## 2. 學習前先建立的基本觀念

### 2.1 元件庫的一個元件，通常不是只有一個 `.vue` 檔

在一般業務專案中，你可能會把一個 Vue 元件理解成一個 `.vue` 檔。但在元件庫中，一個元件通常由多層檔案共同構成。

以 `Avatar` 為例，`avatar.vue` 是 runtime 行為的主體，但它不是全部。元件還需要 `index.js` 作為單元件入口，需要 `.less` 定義視覺樣式，需要 `.d.ts` 讓 TypeScript 使用者取得型別提示，需要 example 展示官方用法，也需要在 components registry 與 plugin install 中被整體匯出與註冊。

因此，閱讀元件庫時不能只問「這個元件在哪個 `.vue` 檔」，而應該問：「這個元件從實作、樣式、型別、範例、匯出到註冊，整條鏈路是什麼？」

### 2.2 `Avatar` 是展示原子，`AvatarList` 是聚合元件

這組元件最重要的設計分層是：`Avatar` 處理單一頭像，`AvatarList` 處理多個頭像。

`Avatar` 的問題比較像是：「如果使用者給我 `src`，我要顯示圖片；如果沒有圖片但有 icon，我要顯示 icon；如果兩者都沒有，我要顯示 slot 文字。不同尺寸與形狀要如何對應 class 或 inline style？」

`AvatarList` 的問題則是：「如果使用者給我一組資料，我要顯示前幾個？每個項目要不要包 Tooltip？超過 `max` 時要不要顯示 `+N`？如果使用者提供 `extra` slot，優先序要如何決定？」

這種分層在元件庫中非常常見：先有一個足夠穩定的基礎展示元件，再用另一個元件把它組合成更高階的使用場景。

### 2.3 runtime source 與 type declaration 要分開看

`avatar.vue` 與 `avatar-list.vue` 是 runtime source，也就是元件在瀏覽器執行時真正會採用的行為。`types/avatar.d.ts` 與 `types/avatar-list.d.ts` 則是 TypeScript 型別宣告，用來描述外部使用者在編譯階段看到的 props、事件與元件型別。

理想情況下，runtime 與 `.d.ts` 應該一致。這組元件存在明顯落差：`Avatar` 的 runtime `size` 支援 `String | Number`，example 也展示數字尺寸，但 `types/avatar.d.ts` 只寫了 `'large' | 'small' | 'default'`；`AvatarList` 的 `.d.ts` 更像是複製了 `Avatar` 的部分 props，沒有完整反映 runtime props。

所以這裡要建立一個重要習慣：

> `.d.ts` 可以幫你理解元件預期暴露的 public contract，但不能單獨代表元件真實行為。當 `.d.ts` 與 runtime 衝突時，應以 runtime source 與實際 example 交叉驗證。

### 2.4 閱讀 source map 時，要先看責任，再看細節

原始碼閱讀最常見的錯誤是，一開始就鑽進某個 computed、watcher 或 CSS selector，結果看了很多細節，卻不知道整個元件在系統中負責什麼。

這份筆記的正確讀法是：先看 source baseline，知道有哪些檔案；再看 `Avatar` / `AvatarList` 的責任分工；接著看 runtime、style、type、example、consumer 之間的關係；最後才進入逐行分析。

---

## 3. 整體概覽

### 3.1 這組元件的整體心智模型

可以把 `Avatar` / `AvatarList` 理解成兩層結構。

```txt
使用者輸入
  │
  ├─ 單一頭像場景
  │    └─ Avatar
  │         ├─ 決定顯示圖片 / icon / slot
  │         ├─ 根據 shape / size 產生 class 或 inline style
  │         ├─ 處理圖片載入錯誤事件
  │         └─ 處理 slot 文字縮放
  │
  └─ 多頭像列表場景
       └─ AvatarList
            ├─ 根據 list 產生多個 Avatar
            ├─ 根據 tooltip 與 item.tip 決定是否包 Tooltip
            ├─ 根據 max 決定是否顯示 +N
            ├─ 根據 extra / excess slot 決定額外頭像內容
            └─ 透過 avatar-list.less 呈現重疊列表效果
```

這張圖的重點是：`AvatarList` 並不是取代 `Avatar`，而是組合 `Avatar`。所以當你看到列表裡每個頭像的尺寸、形狀、圖片來源時，應該回到 `Avatar` 理解單顆頭像怎麼顯示；當你看到列表數量、Tooltip、超出提示與重疊樣式時，才回到 `AvatarList`。

### 3.2 Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。下面這張表不是單純查路徑，而是幫你理解「每個檔案在整條元件鏈路中的位置」。

| 類型 | 路徑 | 角色 | 初次閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue` | 定義 `Avatar` 的 props、template branch、computed class/style、圖片錯誤事件與文字縮放。 | 先看 template 分支，再看 `classes`、`styles`、`childrenStyle`、`setScale()` 與 `handleError()`。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/index.js` | 匯出 `avatar.vue` 作為單元件入口。 | 確認其他地方 import `Avatar` 時實際拿到哪個元件。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue` | 定義 `AvatarList` 的 props、`currentList`、Tooltip 包裹、extra / excess slot。 | 先看 `list` 如何展開，再看 `max`、Tooltip 與額外頭像規則。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/index.js` | 匯出 `avatar-list.vue` 作為單元件入口。 | 確認列表元件的 import / export 邊界。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar.less` | 定義 `ivu-avatar`、形狀、尺寸、圖片、icon 與 slot 文字容器樣式。 | 對照 `Avatar` runtime 產生的 class，理解視覺結果。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar-list.less` | 定義 `ivu-avatar-list`、重疊間距、白色邊框、excess 游標與大尺寸字體。 | 理解列表重疊效果不是 runtime 算出來，而是 class 與 CSS 配合。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "avatar";` 與 `@import "avatar-list";` 納入元件樣式集合。 | 確認元件樣式如何被打包進整體樣式系統。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts` | 描述 `Avatar` 的 TypeScript public contract。 | 注意 `size` 型別與 runtime 支援範圍不完全一致。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar-list.d.ts` | 描述 `AvatarList` typed contract，但和 runtime props 有明顯落差。 | 不要把它當成 runtime 行為的唯一來源。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Avatar }` 與 `export { AvatarList }` 匯出型別。 | 理解元件型別如何被整體匯出。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar.vue` | 展示單一頭像的 icon、文字、圖片、Badge 組合、錯誤處理與數字尺寸。 | 用 example 反推 public usage，而不是只看 source。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar-list.vue` | 展示 `list`、`max` 與 `excessStyle` 的列表場景。 | 用 example 觀察 `AvatarList` 最常見的使用方式。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Avatar` 與 `AvatarList`。 | 理解元件如何出現在整個 components map。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 匯入整個 `components` map，並用 `app.component(key, ViewUI[key])` 間接註冊。 | 理解全域安裝時元件如何被註冊到 Vue app。 |

這張表的閱讀方式是：先從 runtime 建立行為，再從 style 確認視覺，再從 type 與 example 確認 public usage，最後從 registry / install 理解元件如何被整個 View UI Plus 對外提供。

---

## 4. 核心內容逐步講解

### 4.1 `Avatar` Runtime：單一頭像的行為入口

`avatar.vue` 是 `Avatar` 的核心。從元件庫作者的角度來看，`Avatar` 的設計目標是提供一個簡單、可複用、可組合的「單一頭像展示元件」。它不應該知道自己被放在通知、列表、使用者卡片或其他業務場景中；它只需要專心處理一顆頭像如何顯示。

public props 是：

```txt
shape / size / src / icon / customIcon
```

這些 props 可以分成三類來理解。

| 類別 | Props | 解決的問題 |
| --- | --- | --- |
| 外觀控制 | `shape`、`size` | 決定頭像是圓形或方形，以及尺寸大小。 |
| 內容來源 | `src`、`icon`、`customIcon` | 決定頭像裡顯示圖片、內建 icon 或自訂 icon。 |
| slot fallback | default slot | 當沒有圖片與 icon 時，允許使用文字或其他內容作為頭像內容。 |

`Avatar` 的 template branch 是理解這個元件的第一個關鍵。

```vue
<img v-if="src">
<Icon v-else-if="icon || customIcon">
<span v-else><slot></slot></span>
```

這段結構代表 `src`、`icon/customIcon`、default slot 是互斥分支，而不是同時渲染。只要 `src` 存在，元件就優先進入圖片模式；如果沒有 `src`，但有 `icon` 或 `customIcon`，才進入 icon 模式；只有前兩者都沒有時，才使用 default slot。

這個優先序很重要，因為它直接影響使用者如何預期元件行為。例如，如果使用者同時傳了 `src` 與 default slot，從這份筆記所記錄的 template branch 來看，slot 不會成為圖片旁邊的補充內容，而是會被圖片分支排除。這種互斥分支是許多展示元件常見的設計：元件先決定主要顯示模式，再進入對應渲染邏輯。

### 4.2 `Avatar` 的 class、style 與文字縮放

`Avatar` 的第二個核心是把 props 轉換成 class 與 style。這一步是 runtime 與 CSS 之間的橋樑。

| Computed | 責任 | 閱讀重點 |
| --- | --- | --- |
| `classes` | 產生 `ivu-avatar`、形狀 class、圖片 / icon 狀態 class 與預設尺寸 class。 | 觀察哪些 props 會被轉成 class，以及 class 是否能在 `avatar.less` 找到對應樣式。 |
| `styles` | 當 `size` 不是 `small`、`large`、`default` 時，寫入 `width`、`height`、`lineHeight`、`fontSize`。 | 這是數字尺寸或非預設尺寸能生效的關鍵。 |
| `childrenStyle` | slot 文字顯示時，根據 `scale` 與 `childrenWidth` 寫入 transform 與置中位置。 | 這說明文字頭像不是只靠 CSS，而有 runtime measurement 參與。 |

這裡最值得注意的是 `size`。如果 `size` 是 `small`、`large` 或 `default`，元件可以透過預設 class 搭配 Less 樣式處理；但如果 `size` 是數字或其他非預設值，就需要 runtime 寫入 inline style，例如寬、高、行高與字體大小。

這種設計在元件庫中很常見：

- 有限枚舉值交給 class，方便主題樣式統一管理。
- 動態數值交給 inline style，因為 CSS class 不可能預先覆蓋所有尺寸。

`childrenStyle` 與 `setScale()` 則處理另一個細節：文字頭像可能太長。如果頭像裡放的是一個字，通常不需要縮放；但如果 slot 文字寬度超過 avatar 容器，元件就需要讀取 DOM 寬度並計算縮放比例。`setScale()` 會讀取 slot 文字寬度與 avatar 寬度，必要時縮放文字。

這也是為什麼 `Avatar` 會在 `mounted()`、`updated()` 與 `size` watcher 中重新計算。因為文字寬度與容器寬度都不是純資料層能完全知道的事情，它們依賴實際 DOM 渲染結果。

### 4.3 `Avatar` 的圖片錯誤事件

`Avatar` 還負責圖片載入錯誤事件。`handleError()` 會在圖片載入失敗時 emit `on-error`。

這個設計代表 `Avatar` 不直接決定圖片失敗後要改成什麼內容，而是把錯誤事件交給外部使用者。這是元件庫常見的責任邊界：基礎元件提供事件，讓使用者或上層元件決定後續策略。

例如在業務使用中，圖片錯誤後可能要改成預設圖、改成 icon、記錄錯誤、或顯示使用者姓名縮寫。這些都是業務邏輯，不應該被 `Avatar` 寫死。`Avatar` 只需要提供「圖片失敗了」這個事件出口。

### 4.4 `AvatarList` Runtime：多頭像列表的聚合入口

`avatar-list.vue` 是 `AvatarList` 的核心。它與 `Avatar` 的關係不是繼承，也不是替代，而是組合。`AvatarList` 根據 `list` 產生多個 `Avatar`，並在外層加上列表場景需要的控制邏輯。

`AvatarList` props 是：

```txt
list / shape / size / excessStyle / max / tooltip / placement / transfer
```

這些 props 可以分成四類。

| 類別 | Props | 責任 |
| --- | --- | --- |
| 資料來源 | `list` | 提供要顯示的頭像資料。 |
| 子頭像外觀 | `shape`、`size` | 傳給每個子 `Avatar`，讓列表內頭像保持一致外觀。 |
| 列表數量控制 | `max`、`excessStyle` | 控制最多顯示幾個，以及超出數量頭像的樣式。 |
| 提示控制 | `tooltip`、`placement`、`transfer` | 控制是否用 `Tooltip` 顯示每個項目的提示資訊，以及 Tooltip 的位置與傳送方式。 |

這裡要注意一個設計取向：`AvatarList` 不是讓使用者任意塞入 child slot 自己排版，而是透過 `list` 主動產生子 `Avatar`。這代表 `AvatarList` 是一個資料驅動的聚合元件。

### 4.5 `currentList`、Tooltip 與子 `Avatar` 的組合關係

`AvatarList` 的渲染流程整理成以下形式：

```txt
currentList
  -> v-for avatar-list-item
  -> if tooltip && item.tip: Tooltip wraps Avatar
  -> else: Avatar directly
```

這段流程可以拆成三層理解。

第一層是 `currentList`。它代表真正要被渲染的列表資料。由於 `AvatarList` 有 `max` 這類控制顯示數量的 props，所以 runtime 不一定會直接渲染完整 `list`，而是會先得到目前要顯示的清單，再進入 `v-for`。

第二層是 `avatar-list-item`。每個 item 是列表中的一個顯示單位，這層會承擔列表排列與重疊樣式所需的 class。

第三層是 `Avatar` 與 `Tooltip` 的組合。如果 `tooltip` 開啟，而且該項目有 `item.tip`，就用 `Tooltip` 包住 `Avatar`；否則直接渲染 `Avatar`。

每個列表項只會把 `item.src` 傳給子 `Avatar`，並把 `AvatarList` 自己的 `size`、`shape` 傳下去；`item.tip` 只用在 `Tooltip`。這個細節很重要，因為它說明 `AvatarList` 的 list item 資料格式並不是任意對應 `Avatar` 全部 props，而是目前筆記中觀察到的欄位用途比較集中：圖片來源給 `Avatar`，提示文字給 `Tooltip`。

### 4.6 `extra` / `excess`：額外頭像與超出數量提示

`AvatarList` 的第三個核心是額外頭像的規則。

```txt
有 #extra
  -> 顯示 extra avatar
else if list.length > max
  -> 顯示 excess avatar，預設內容為 +N
```

這裡的關鍵是優先序。

如果使用者提供 `#extra`，`AvatarList` 會優先顯示 extra avatar。這個 extra 不依賴是否真的超過 `max`，它比較像是「使用者自訂的列表尾端內容」。例如在某些場景中，extra 可能被設計成新增成員按鈕、更多操作入口或自訂補充頭像。

如果沒有 `#extra`，但 `list.length > max`，才會顯示 excess avatar，預設內容是 `+N`。這個 excess 則是典型的「超出數量提示」。它不是一個真實使用者頭像，而是一個聚合提示，告訴使用者還有多少項目沒有顯示。

因此，`extra` 與 `excess` 雖然都出現在列表尾端，但語意不同：

| 項目 | 觸發條件 | 語意 | 是否依賴超出 `max` |
| --- | --- | --- | --- |
| `extra` slot | 使用者提供 `#extra` | 自訂尾端內容 | 不依賴 |
| `excess` avatar | 沒有 `#extra` 且 `list.length > max` | 超出數量提示 | 依賴 |

閱讀這段時要特別避免一個誤解：不要把 `extra` 當成「超出數量提示的自訂內容」。`extra` 的優先序更高，而且不依賴是否超出 `max`。

### 4.7 Style：單一頭像樣式與列表重疊樣式分開管理

`avatar.less` 與 `avatar-list.less` 的分工也延續了 runtime 的分層。

`avatar.less` 負責單一頭像的基礎視覺，包括根 class、圖片模式、icon 微調、尺寸、形狀與圖片填滿容器。

| Less 區塊 | 責任 | 對應的 runtime 觀念 |
| --- | --- | --- |
| `.ivu-avatar` | inline-block、置中、背景色、文字色、nowrap、relative、hidden、vertical-align。 | 單一頭像的基礎容器。 |
| `.ivu-avatar-image` | 圖片模式背景改成 transparent。 | 當 `src` 存在時，頭像進入圖片模式。 |
| `.ivu-avatar .ivu-icon` | 微調 icon 垂直位置。 | 當 `icon` 或 `customIcon` 存在時，顯示 icon。 |
| `.avatar-size(...)` | 產生寬高、line-height、圓形 border-radius 與 icon font-size。 | 預設尺寸 class 的樣式來源。 |
| `.ivu-avatar-large` / `.ivu-avatar-small` | 套用預設大 / 小尺寸。 | `size` 使用預設枚舉值時可透過 class 控制。 |
| `.ivu-avatar-square` | 將預設圓形改成小圓角方形。 | `shape` 控制形狀。 |
| `.ivu-avatar > img` | 圖片寬高填滿頭像容器。 | 圖片模式下的圖片填滿效果。 |

`avatar-list.less` 則負責列表聚合視覺，尤其是重疊排列與分隔感。

| Less 區塊 | 責任 | 閱讀重點 |
| --- | --- | --- |
| `.ivu-avatar-list` | inline-block 根容器。 | 列表整體作為 inline 區塊存在。 |
| `.ivu-avatar-list-item` | inline-block 列表項、負 margin 重疊、pointer cursor。 | 重疊效果主要來自列表 item 樣式。 |
| `.ivu-avatar-list-item:first-child` | 第一個頭像不做負 margin。 | 避免第一個頭像也向左偏移。 |
| `.ivu-avatar-list-item .ivu-avatar` | 每個頭像加白色邊框。 | 讓重疊時每顆頭像仍有分隔感。 |
| `.ivu-avatar-list-item-excess` | 額外頭像游標改成 auto。 | excess 不是一般可點擊 item 的語意。 |
| `.ivu-avatar-list-large` / `.ivu-avatar-list-default` | 調整不同尺寸下的重疊距離。 | 列表重疊距離會隨尺寸變化。 |

這裡可以看到一個元件庫設計原則：runtime 不應該負責所有視覺細節。`AvatarList` 不需要用 JavaScript 計算每顆頭像要偏移多少，這類穩定視覺規則更適合交給 CSS / Less。

### 4.8 Type 與 Public Export：對外合約與實際行為要交叉驗證

`types/avatar.d.ts` 描述 `Avatar` 的 `shape`、`size`、`src`、`icon`、`custom-icon` 與 `onOnError`。這裡有一個明顯落差：runtime 的 `size` 是 `String | Number`，官方 example 也展示了 `size="64"` 與 `size="42"`，但 `.d.ts` 只寫：

```txt
size?: 'large' | 'small' | 'default'
```

這表示如果 TypeScript 使用者依照型別檔，可能會以為 `size` 只能傳三種字串；但 runtime 與 example 卻顯示它還可以支援數字尺寸。這是一個典型的「型別宣告落後於 runtime 能力」案例。

`types/avatar-list.d.ts` 的落差更大。runtime props 包含：

```txt
list / max / excessStyle / tooltip / placement / transfer
```

但 `.d.ts` 沒有描述這些 props，反而保留了 `src`、`icon`、`custom-icon` 這些 `AvatarList` runtime 不接收的 props。這表示 `types/avatar-list.d.ts` 很可能不能作為 `AvatarList` 的可靠 contract，需要回到 runtime source 與 example 重新確認。

對外匯出部分則分成 runtime export 與 type export。

runtime public export 在 `src/components/index.js`：

```js
export { default as Avatar } from './avatar';
export { default as AvatarList } from './avatar-list';
```

typed public export 在 `types/viewuiplus.components.d.ts`：

```ts
export { Avatar } from './avatar'
export { AvatarList } from './avatar-list'
```

全域安裝則在 `src/index.js` 透過整個 component map 間接完成，也就是匯入 `components` map 後，以類似 `app.component(key, ViewUI[key])` 的方式註冊。

這裡的閱讀重點是：

- `avatar.vue` / `avatar-list.vue` 決定元件真實行為。
- `src/components/index.js` 決定 runtime 如何被外部 import。
- `types/*.d.ts` 決定 TypeScript 使用者看到的型別。
- `types/viewuiplus.components.d.ts` 決定型別如何被整體匯出。
- `src/index.js` 決定全域安裝時元件如何被註冊。

如果你想完整理解一個元件庫元件，這幾層都要看。

### 4.9 Consumer：從使用者視角驗證 `Avatar` 的定位

除了官方 example，可以看兩個直接 consumer：`NotificationItem` 與 `ListItemMeta`。

| Consumer | 位置 | 閱讀價值 |
| --- | --- | --- |
| `NotificationItem` | `src/components/notification/notification-item.vue` | 依照 `icon`、`customIcon`、`avatar` 選擇不同 `Avatar` 輸入，並傳入 `shape`、`size`、style。 |
| `ListItemMeta` | `src/components/list/list-item-meta.vue` | 在列表元資料中用 `Avatar :src="avatar"` 作為 default avatar slot 的預設內容。 |

consumer 的閱讀價值在於，它可以驗證元件在元件庫內部如何被其他元件組合。官方 example 告訴你使用者可能怎麼用，consumer 則告訴你元件庫自己怎麼用。

從這兩個 consumer 可以看出，`Avatar` 很適合作為「可替換的展示原子」。上層元件不需要自己處理圖片、icon、尺寸與形狀細節，只要根據場景選擇傳入 `src`、`icon`、`customIcon`、`shape`、`size` 或 style 即可。

這也是為什麼 `Avatar` 不應該包含通知元件或列表元資料元件的業務判斷。它要保持足夠純粹，才能被不同場景重複組合。

---

## 5. 表格整理

### 5.1 原始碼模組表

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `avatar.vue` | `src/components/avatar/avatar.vue` | 單一頭像 runtime 行為。 | 被 `avatar/index.js` 匯出，也被 `AvatarList` 與其他 consumer 組合使用。 | template branch、`classes`、`styles`、`childrenStyle`、`setScale()`、`handleError()`。 |
| `avatar/index.js` | `src/components/avatar/index.js` | 單元件 runtime 入口。 | 將 `avatar.vue` 封裝成可被 components registry 匯出的元件。 | 確認 export 來源。 |
| `avatar-list.vue` | `src/components/avatar-list/avatar-list.vue` | 多頭像列表 runtime 行為。 | 組合 `Avatar` 與 `Tooltip`，根據 `list` 產生列表。 | `currentList`、Tooltip 條件、`extra` / `excess` 規則。 |
| `avatar-list/index.js` | `src/components/avatar-list/index.js` | 單元件 runtime 入口。 | 將 `avatar-list.vue` 封裝成可被 components registry 匯出的元件。 | 確認 export 來源。 |
| `avatar.less` | `src/styles/components/avatar.less` | 單一頭像樣式。 | 對應 `avatar.vue` 產生的 class。 | shape、size、image、icon、slot 文字容器。 |
| `avatar-list.less` | `src/styles/components/avatar-list.less` | 列表聚合樣式。 | 對應 `avatar-list.vue` 產生的 list class。 | 重疊間距、白色邊框、excess 樣式。 |
| `types/avatar.d.ts` | `types/avatar.d.ts` | `Avatar` 型別宣告。 | 給 TypeScript 使用者 public contract。 | 注意 `size` 型別與 runtime 的落差。 |
| `types/avatar-list.d.ts` | `types/avatar-list.d.ts` | `AvatarList` 型別宣告。 | 理論上描述 `AvatarList` contract，但目前與 runtime 落差明顯。 | 不可單獨視為真實 contract。 |
| `examples/routers/avatar.vue` | `examples/routers/avatar.vue` | `Avatar` 官方使用範例。 | 驗證 runtime 支援的使用場景。 | icon、文字、圖片、Badge、錯誤處理、數字尺寸。 |
| `examples/routers/avatar-list.vue` | `examples/routers/avatar-list.vue` | `AvatarList` 官方使用範例。 | 驗證列表 API 使用方式。 | `list`、`max`、`excessStyle`。 |

### 5.2 `Avatar` API / 行為表

| API / 行為 | 所屬位置 | 主要用途 | 重要輸入 | 輸出 / 結果 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| `shape` | `avatar.vue` props | 控制頭像形狀。 | 通常是圓形或方形相關值。 | 影響形狀 class。 | 具體可用值需後續對照 runtime props。 |
| `size` | `avatar.vue` props | 控制頭像尺寸。 | `small`、`large`、`default` 或 runtime 支援的數字尺寸。 | 預設尺寸走 class，非預設尺寸走 inline style。 | `.d.ts` 只描述部分字串尺寸，與 runtime 有落差。 |
| `src` | `avatar.vue` props | 圖片頭像來源。 | 圖片 URL。 | 進入 `<img v-if="src">` 分支。 | 優先序高於 icon 與 slot。 |
| `icon` / `customIcon` | `avatar.vue` props | icon 頭像來源。 | icon 名稱或自訂 icon。 | 進入 `<Icon v-else-if="icon || customIcon">` 分支。 | 只有沒有 `src` 時才會使用。 |
| default slot | `avatar.vue` slot | 文字或自訂內容 fallback。 | slot content。 | 進入 `<span v-else>` 分支。 | 只有沒有 `src`、`icon`、`customIcon` 時才會使用。 |
| `handleError()` | `avatar.vue` methods | 處理圖片載入失敗。 | 圖片 error event。 | emit `on-error`。 | 元件不直接決定 fallback 行為。 |
| `setScale()` | `avatar.vue` methods | 計算 slot 文字縮放。 | avatar 寬度、文字寬度。 | 更新文字縮放比例。 | 依賴 DOM measurement。 |

### 5.3 `AvatarList` API / 行為表

| API / 行為 | 所屬位置 | 主要用途 | 重要輸入 | 輸出 / 結果 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| `list` | `avatar-list.vue` props | 提供頭像列表資料。 | 陣列資料。 | 經由 `currentList` 產生列表項。 | 目前筆記指出 item 的 `src` 給 `Avatar`，`tip` 給 `Tooltip`。 |
| `shape` / `size` | `avatar-list.vue` props | 控制列表內每顆頭像外觀。 | 形狀與尺寸。 | 傳遞給子 `Avatar`。 | 這是聚合元件向下傳遞展示規則。 |
| `max` | `avatar-list.vue` props | 控制最多顯示數量。 | 數字。 | 影響 `currentList` 與 excess 顯示。 | 具體裁切邏輯需後續逐行確認。 |
| `excessStyle` | `avatar-list.vue` props | 控制超出數量頭像樣式。 | style object。 | 影響 excess avatar 視覺。 | 通常搭配 `max` 使用。 |
| `tooltip` | `avatar-list.vue` props | 控制是否顯示 Tooltip。 | boolean。 | 與 `item.tip` 一起決定是否包 `Tooltip`。 | 不是每個 item 都一定會有 Tooltip。 |
| `placement` / `transfer` | `avatar-list.vue` props | 控制 Tooltip 行為。 | Tooltip 相關設定。 | 傳給 Tooltip。 | 需要後續對照 Tooltip 元件完整 API。 |
| `#extra` | `avatar-list.vue` slot | 自訂列表尾端內容。 | slot content。 | 顯示 extra avatar。 | 優先序高於 excess，且不依賴超出 `max`。 |
| excess avatar | `avatar-list.vue` branch | 顯示超出數量提示。 | `list.length` 與 `max`。 | 預設顯示 `+N`。 | 只有沒有 `#extra` 且超出 `max` 時才出現。 |

### 5.4 概念比較表

| 概念 | 說明 | 使用場景 | 常見誤解 |
| --- | --- | --- | --- |
| `Avatar` | 單一頭像展示元件。 | 顯示一個使用者、通知圖示、列表元資料頭像。 | 誤以為它也負責列表排列。 |
| `AvatarList` | 多頭像列表聚合元件。 | 顯示多個使用者頭像、群組成員、參與者列表。 | 誤以為它接收 `Avatar` 的所有 props 作為每個 item 的完整配置。 |
| runtime source | 元件真實執行行為。 | 判斷 props、template branch、computed、event。 | 誤以為 `.d.ts` 一定等於 runtime。 |
| `.d.ts` | TypeScript public contract。 | 提供型別提示與編譯期檢查。 | 忽略型別可能落後或寫錯。 |
| example | 官方使用範例。 | 快速建立使用印象。 | 只看 example，不回頭確認 runtime。 |
| consumer | 元件庫內部使用者。 | 觀察元件如何被其他元件組合。 | 只看外部 API，不看內部組合場景。 |

---

## 6. 範例或情境說明

### 6.1 情境一：使用單一 `Avatar` 顯示圖片

當使用者傳入 `src` 時，`Avatar` 會進入圖片分支。

```txt
使用者傳入 src
  -> Avatar template 命中 <img v-if="src">
  -> classes 加上圖片模式相關 class
  -> avatar.less 讓圖片填滿容器
  -> 如果圖片載入失敗，handleError() emit on-error
```

這個流程說明 `Avatar` 的圖片模式包含三個層次：template 決定顯示圖片，style 決定圖片如何呈現，event 決定圖片失敗時如何通知外部。

### 6.2 情境二：使用文字作為頭像內容

當使用者沒有傳 `src`，也沒有傳 `icon` / `customIcon`，而是提供 default slot 時，`Avatar` 會進入 slot 分支。

```txt
沒有 src
沒有 icon / customIcon
有 default slot
  -> Avatar template 命中 <span><slot /></span>
  -> mounted / updated 後執行 setScale()
  -> 根據文字寬度與 avatar 寬度計算 childrenStyle
  -> 必要時用 transform 縮放文字
```

這個流程說明文字頭像不是單純把文字塞進去，而是要考慮文字是否超出容器。這也是 `setScale()` 與 `childrenStyle` 存在的原因。

### 6.3 情境三：使用 `AvatarList` 顯示群組成員

當使用者傳入一組 `list` 時，`AvatarList` 會先決定目前要顯示哪些 item，再逐一產生列表項。

```txt
使用者傳入 list、max、tooltip
  -> AvatarList 計算 currentList
  -> v-for 產生 avatar-list-item
  -> 每個 item 傳 item.src 給 Avatar
  -> 如果 tooltip && item.tip，外層包 Tooltip
  -> 如果沒有 #extra 且 list.length > max，顯示 +N excess avatar
```

這個流程說明 `AvatarList` 是資料驅動元件。使用者不是手寫多個 `<Avatar>`，而是把資料交給 `AvatarList`，讓它統一處理顯示數量、Tooltip 與尾端提示。

---

## 7. 閱讀路線或學習路線

### 7.1 第一次閱讀路線：先建立整體印象

第一次閱讀不要急著逐行看 computed。建議先按照以下順序建立整體地圖。

1. 先讀 `examples/routers/avatar.vue`，觀察 `Avatar` 對外展示哪些用法，例如 icon、文字、圖片、Badge、錯誤處理與數字尺寸。
2. 再讀 `types/avatar.d.ts`，建立 `Avatar` 的 public contract 印象，但先不要完全相信型別就是全部行為。
3. 回到 `avatar.vue`，先看 template branch，理解 `src`、`icon/customIcon` 與 slot 的優先序。
4. 接著看 `classes`、`styles`、`childrenStyle`，理解 props 如何轉成樣式。
5. 再看 `setScale()`、`handleError()`、`mounted()`、`updated()` 與 `size` watcher，理解 DOM measurement 與事件。
6. 讀 `avatar.less`，把 runtime 產生的 class 對回實際視覺。

### 7.2 `AvatarList` 閱讀路線：從資料展開開始

`AvatarList` 的閱讀順序應該從資料流開始，而不是從樣式開始。

1. 先讀 `examples/routers/avatar-list.vue`，理解 `list`、`max`、`excessStyle` 的外部使用方式。
2. 再讀 `avatar-list.vue` 的 props，確認列表資料、子頭像外觀、Tooltip 與超出數量控制有哪些入口。
3. 看 `currentList`，理解實際渲染清單如何從 `list` 得到。
4. 看 template 中 `v-for` 的結構，確認每個 item 如何產生 `Avatar`。
5. 看 Tooltip 判斷，理解 `tooltip && item.tip` 的條件。
6. 看 `extra` / `excess` branch，確認額外頭像的優先序。
7. 最後看 `avatar-list.less`，理解重疊排列與視覺分隔感。

### 7.3 深入閱讀路線：對照型別、匯出與 consumer

當你已經理解 runtime 與 style 後，可以進入元件庫層級的閱讀。

1. 讀 `src/components/avatar/index.js` 與 `src/components/avatar-list/index.js`，確認單元件入口。
2. 讀 `src/components/index.js`，確認 `Avatar` 與 `AvatarList` 如何被整體匯出。
3. 讀 `src/index.js`，理解全域 install 如何透過 components map 註冊元件。
4. 讀 `types/viewuiplus.components.d.ts`，確認型別如何被整體匯出。
5. 回頭比對 `types/avatar.d.ts`、`types/avatar-list.d.ts` 與 runtime props，整理型別落差。
6. 讀 `NotificationItem` 與 `ListItemMeta`，觀察 `Avatar` 在元件庫內部如何被組合。

### 7.4 可以暫時跳過的部分

第一次閱讀時，可以暫時跳過以下內容：

- `avatar.less` 中每個 CSS 屬性的細節值。
- `Tooltip` 元件本身的完整實作。
- components registry 以外的整體建置流程。
- `.d.ts` 的修正實作。

這些不是不重要，而是它們會分散第一次閱讀的注意力。對初次閱讀者來說，先建立 `Avatar` / `AvatarList` 的責任模型更重要。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `avatar.vue`，以為已經理解整個 `Avatar` 元件。 | 單一 `.vue` 檔確實是 runtime 核心，但元件庫還包含 style、type、example、registry 與 install。 | 要把 runtime、style、type、example、consumer 與 export 鏈路一起看。 |
| 把 `AvatarList` 當成 `Avatar` 的加強版。 | 兩者名稱相近，而且 `AvatarList` 內部會產生 `Avatar`。 | `Avatar` 是單一展示原子，`AvatarList` 是資料驅動的列表聚合元件。 |
| 以為 `src`、`icon`、slot 可以同時顯示。 | 從 API 名稱看起來都像內容來源。 | template branch 是互斥的，優先序是 `src` > `icon/customIcon` > default slot。 |
| 以為 `size` 只能是 `.d.ts` 寫的三種字串。 | TypeScript 使用者很容易把 `.d.ts` 當成唯一真相。 | runtime 支援 `String | Number`，example 也展示數字尺寸，需以 runtime 與 example 交叉驗證。 |
| 以為 `AvatarList` 的 `.d.ts` 是可靠 contract。 | 型別檔通常被視為 public API 來源。 | `types/avatar-list.d.ts` 與 runtime props 有明顯落差，不能單獨依賴。 |
| 以為 `extra` 是超出數量提示的自訂版本。 | `extra` 與 excess 都出現在列表尾端，視覺位置相近。 | `extra` 優先序高於 excess，且不依賴是否超出 `max`。 |
| 一開始就研究 CSS 細節。 | 樣式檔看起來比較具體，容易直接鑽進去。 | 應先理解 runtime 產生哪些 class，再回頭看 Less 如何接住這些 class。 |

---

## 9. 本章總結

`Avatar` / `AvatarList` 是一組很適合用來學習元件庫原始碼閱讀方法的元件。它們的表面功能很簡單：顯示頭像與頭像列表；但從原始碼閱讀角度看，這組元件涵蓋了元件庫中常見的多層結構：runtime、style、type declaration、example、registry、install 與 consumer。

本章最重要的心智模型是：`Avatar` 是單一展示原子，`AvatarList` 是列表聚合元件。`Avatar` 負責處理圖片、icon、slot、尺寸、形狀、錯誤事件與文字縮放；`AvatarList` 則負責把一組資料轉成多個 `Avatar`，並額外處理 Tooltip、最大顯示數量、超出提示、額外 slot 與列表重疊樣式。

第二個重要觀念是 runtime 與型別宣告要分開看。`types/avatar.d.ts` 與 `types/avatar-list.d.ts` 可以幫助你理解 public contract，但它們不一定完整反映 runtime 行為。尤其本章已經觀察到 `Avatar` 的 `size` 與 `AvatarList` 的 props 存在型別落差，因此閱讀時必須回到 runtime source 與 official examples 交叉驗證。

第三個重要觀念是閱讀順序。對元件庫初學者來說，不應該一開始就逐行鑽 CSS 或 computed。更穩定的做法是先建立 source map，再理解元件責任，再看 runtime branch，接著對照 style、type、example 與 consumer，最後才進入逐行分析與重構判斷。

如果你能用這種方式讀懂 `Avatar` / `AvatarList`，之後閱讀其他 View UI Plus 元件時，也可以複用同一套方法：先找 runtime，確認入口，再看 style，檢查型別，觀察 example，最後追 consumer 與全域註冊。

---

## 10. 自我檢查問題

1. `Avatar` 與 `AvatarList` 的核心責任分別是什麼？請用「單一展示原子」與「列表聚合元件」的角度說明。
2. `Avatar` 的內容 branch 優先序是什麼？如果同時傳入 `src` 與 default slot，根據本章筆記會優先顯示什麼？
3. 為什麼 `Avatar` 需要 `setScale()`？這個方法和一般 CSS 樣式控制有什麼不同？
4. `AvatarList` 的 `currentList` 在整個渲染流程中扮演什麼角色？它和原始 `list` 的關係是什麼？
5. `AvatarList` 何時會用 `Tooltip` 包住 `Avatar`？這個條件中 `tooltip` 與 `item.tip` 各自扮演什麼角色？
6. `extra` slot 與 excess avatar 的優先序是什麼？為什麼不能把 `extra` 單純理解成「超出數量提示的自訂內容」？
7. `avatar.less` 與 `avatar-list.less` 的責任有什麼不同？請分別說明它們處理的是單一頭像視覺還是列表聚合視覺。
8. 為什麼閱讀這組元件時不能只依賴 `.d.ts`？請用 `Avatar` 的 `size` 與 `AvatarList` 的 props 落差舉例。
9. `NotificationItem` 與 `ListItemMeta` 這兩個 consumer 對理解 `Avatar` 有什麼幫助？
10. 如果你要繼續寫下一篇逐行分析筆記，你會先分析 `avatar.vue` 的哪三個部分？為什麼？

---

## 11. 後續延伸方向

這份筆記是 source map 與責任分工層級的教材型筆記。後續可以拆成以下主題繼續深入。

| 延伸主題 | 建議內容 | 產出形式 |
| --- | --- | --- |
| `Avatar` runtime 逐行分析 | 逐段分析 props、template branch、computed、methods、watcher 與 lifecycle。 | 原始碼逐行講解筆記。 |
| `Avatar` 樣式系統分析 | 對照 `classes` 與 `avatar.less`，理解尺寸、形狀、圖片、icon 與 slot 文字樣式。 | runtime + style 對照表。 |
| `AvatarList` runtime 逐行分析 | 分析 `list`、`currentList`、Tooltip branch、`extra` / `excess` branch。 | 流程圖 + 原始碼筆記。 |
| `AvatarList` 列表重疊樣式分析 | 分析負 margin、白色邊框、尺寸差異與 excess 樣式。 | CSS / Less 教學筆記。 |
| `.d.ts` 型別落差整理 | 對照 runtime props 與 `.d.ts`，列出缺漏、錯誤與可能修正方向。 | 型別修正建議表。 |
| consumer 使用場景分析 | 分析 `NotificationItem` 與 `ListItemMeta` 如何組合 `Avatar`。 | 元件組合案例筆記。 |
| 元件庫閱讀方法論 | 將本章方法抽象成適用於其他 View UI Plus 元件的閱讀流程。 | 通用學習指南。 |

---