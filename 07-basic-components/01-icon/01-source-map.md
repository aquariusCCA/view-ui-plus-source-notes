# Icon Source Map：圖標元件原始碼入口

## 0. 原始筆記問題分析

原本的 `README.md` 已經列出 `Icon` 的主要入口，但還偏向索引型筆記。它告訴你要看哪些檔案，卻還沒有說明每個檔案在 `Icon` 這個元件中扮演什麼角色，也沒有把 runtime、樣式、型別與安裝流程串成完整閱讀路線。

這篇筆記的目標，是把入口表整理成可以實際帶路的 source map。讀者第一次打開 `Icon` 原始碼時，可以先用這篇建立全局視角，再進入 props、render 與 icon font 系統的細節。

---

## 1. 本章定位

本章是一份 `Icon` 元件的原始碼地圖，不負責完整講解每一行實作。它要先回答一個問題：如果要理解 View UI Plus 的 `Icon`，到底要看哪些檔案，並且每個檔案各自補上哪一塊資訊？

`Icon` 看似只有一個 `.vue` 檔案，但元件庫中的 public component 不是只有 runtime source。真正的對外行為需要同時對照：

```txt
runtime component
  -> type declaration
  -> style / icon font
  -> examples
  -> component registry
  -> plugin install
```

如果只看 `icon.vue`，你會知道它輸出 `<i>`，但不知道 `ivu-icon-ios-add` 為什麼能顯示字形。如果只看 icon font 樣式，則不知道使用者如何透過 `type` prop 產生這些 class。

---

## 2. 學習前先建立的基本觀念

`Icon` 是 View UI Plus 裡最小的視覺原子之一。它不像 `Button` 需要處理 click、loading、disabled，也不像 `Badge` 需要處理數值展示規則。它的任務非常集中：把 props 映射成 class 和 style。

這裡要先區分兩個層次。

第一個層次是 Vue component。`src/components/icon/icon.vue` 只負責接收 `type`、`size`、`color`、`custom`，並產生 `<i :class="classes" :style="styles"></i>`。

第二個層次是 CSS icon font。`src/styles/common/iconfont/` 會定義 `.ivu-icon` 的字體、渲染方式，以及每個 `.ivu-icon-xxx:before` 對應的 Unicode content。沒有這層樣式，`Icon` 即使產生了 class，也不會顯示正確圖標。

因此閱讀 `Icon` 時，要把它當成「class 轉接器」來看，而不是把它當成真正存放圖標圖形的地方。

---

## 3. Source Entry

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue` | 元件實作 | props 定義、`classes`、`styles`、`<i>` 節點。 |
| Component Entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/index.js` | 單元件出口 | 將 `icon.vue` 作為 default export。 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/icon.d.ts` | 對外型別契約 | `type`、`size`、`color`、`custom` 的 public API。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/icon.vue` | 官方使用範例 | 大量使用 `<Icon :type="item" />` 展示內建圖標。 |
| Style Import | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less` | common style 入口 | 匯入 `iconfont/ionicons`。 |
| Icon Font | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/` | 圖標字體系統 | `@font-face`、`.ivu-icon`、`.ivu-icon-xxx:before`。 |
| Public Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | public export | `export { default as Icon } from './icon';`。 |
| Plugin Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域註冊 | `ViewUI` 收集 components，install 時呼叫 `app.component`。 |

這張表的重點不是背路徑，而是建立一個閱讀順序。先看 runtime 會知道元件如何輸出 class；再看 icon font 會知道 class 如何變成圖標；最後看 registry / install 會知道它如何進入使用者可用的 public surface。

---

## 4. 核心內容逐步講解

### 4.1 `icon.vue` 是最小 runtime 實作

`Icon` 的 template 非常短：

```vue
<i :class="classes" :style="styles"></i>
```

這代表它沒有 slot，也不包裹任何文字或子節點。圖標顯示完全依靠 class 與 CSS `:before` 產生內容。

`script` 裡的核心是兩個 computed：

```txt
props -> classes
props -> styles
```

`classes` 負責產生 `ivu-icon`、`ivu-icon-${type}` 與自訂 class；`styles` 負責產生 `font-size` 與 `color`。這種設計讓 `Icon` 非常容易被其他元件嵌入，因為它沒有自己的互動狀態，也不會主動影響父元件資料流。

### 4.2 `types/icon.d.ts` 定義 public contract

型別宣告中，`Icon` 對外公開四個 props：

| Prop | Type | 說明 |
| --- | --- | --- |
| `type` | `string` | 圖標名稱，會對應到 `ivu-icon-${type}`。 |
| `size` | `number \| string` | 圖標大小，註解說明單位是 px。 |
| `color` | `string` | 圖標顏色。 |
| `custom` | `string` | 自訂圖標 class。 |

型別檔的價值在於確認這四個欄位是 public API，而不是 `icon.vue` 內部偶然使用的變數。閱讀元件庫時，runtime source 告訴你「實際怎麼做」，type declaration 則告訴你「使用者被承諾可以怎麼用」。

### 4.3 `examples/routers/icon.vue` 展示主要使用情境

官方範例頁主要用大量 `icons` 陣列搭配：

```vue
<Icon v-for="item in icons" :key="item" :type="item" />
```

這個範例的重點是展示內建圖標名稱，而不是展示複雜互動。它也反映出 `Icon` 最常見的使用方式：傳入 `type`，讓元件產生對應的 `ivu-icon-*` class。

`custom` 的使用比較多出現在其他範例或其他元件中，例如 `Button` 範例會出現 `custom="i-icon i-icon-search"`。這表示 `custom` 是補充能力，主要用來接入使用者自己的 icon font。

### 4.4 icon font 樣式才是真正的字形來源

`src/styles/common/index.less` 會匯入：

```less
@import "iconfont/ionicons";
```

`ionicons.less` 再匯入 variables、font 與 icons：

```less
@import "_ionicons-variables";
@import "_ionicons-font";
@import "_ionicons-icons";
```

其中 `_ionicons-font.less` 定義 `@font-face` 與 `.ivu-icon` 基礎樣式；`_ionicons-icons.less` 定義每個 `.ivu-icon-xxx:before` 的 `content`。因此，`Icon` 的 `type` prop 和 icon font 樣式是透過 class 命名約定接上的。

### 4.5 registry 與 install 確認 public surface

`src/components/index.js` 中有：

```js
export { default as Icon } from './icon';
```

這代表 `Icon` 是元件庫 public export 的一部分。`src/index.js` 會把 components 收集成 `ViewUI`，並在 `install(app)` 時呼叫：

```js
app.component(key, ViewUI[key]);
```

因此使用者透過完整安裝 View UI Plus 時，可以全域使用 `Icon`。這和單純存在於 `src/components/icon/` 不一樣；registry 與 install 才能確認它真的進入對外使用面。

---

## 5. 建議閱讀路線

初次閱讀時，建議照這個順序：

1. 先看 `types/icon.d.ts`，確認 public props 只有四個。
2. 再看 `src/components/icon/icon.vue`，理解 props 如何轉成 class / style。
3. 接著看 `src/styles/common/iconfont/_ionicons-font.less`，理解 `.ivu-icon` 的基礎樣式。
4. 再看 `src/styles/common/iconfont/_ionicons-icons.less`，理解 `ivu-icon-*` 如何對應 `:before content`。
5. 最後看 `examples/routers/icon.vue` 與其他元件中的 `Icon` 使用，確認它如何被組合。

可以暫時跳過完整 icon 清單。清單很長，不需要逐項背誦；閱讀時只要確認命名規則與 `:before content` 的存在即可。

---

## 6. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `Icon` component 裡存放所有圖標 | `Icon` 範例頁列出大量圖標名稱 | 圖標字形在 icon font 樣式與字體檔中，component 只產生 class。 |
| 只看 `icon.vue` 就以為讀完了 | `Icon` runtime 很短 | 還必須看 `src/styles/common/iconfont/` 才知道 class 如何顯示圖標。 |
| 把 `type` 和 `custom` 當成同一件事 | 兩者都會變成 class | `type` 接內建 `ivu-icon-*` 命名；`custom` 接外部自訂 class。 |
| 以為 `size` 可以傳任意 CSS 單位 | Type 接受 `number \| string` | runtime 會補上 `px`，因此適合傳數字或數字字串。 |

---

## 7. 本章總結

`Icon` 的 source map 要從多個檔案一起看。`icon.vue` 定義 runtime 映射，`types/icon.d.ts` 定義 public contract，`src/styles/common/iconfont/` 定義實際圖標字形，examples 展示主要使用方式，registry 與 install 則確認它進入元件庫 public surface。

理解這張地圖後，後續閱讀 `Icon` 就不會停留在「它是一個 `<i>`」這種表面結論，而能看出元件庫如何把 API、class naming、字體資源與全域安裝串成一個穩定的基礎元件。

---

## 8. 自我檢查問題

1. `Icon` 的 runtime source、type declaration、icon font style 各自回答什麼問題？
2. 為什麼 `src/components/icon/index.js` 不是主要邏輯檔？
3. `src/components/index.js` 和 `src/index.js` 在 public surface 上有什麼差別？
4. 如果 `<Icon type="ios-add" />` 沒有顯示圖標，你會先檢查哪幾個來源？
5. 為什麼不需要逐一閱讀完整 icon 清單？
