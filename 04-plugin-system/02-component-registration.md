# View UI Plus Plugin 元件註冊流程：從 `src/components/index.js` 到 Global Components

## 1. 本章定位

本篇筆記屬於 **原始碼閱讀筆記 + Vue Plugin 註冊機制分析筆記**。

它位於 `04-plugin-system/` 目錄下，因為本章討論的是 `View UI Plus` 作為 Vue plugin 被安裝時，如何把 components 批次註冊成 Vue global components。它不是單一 component 的實作分析，也不是 UI 樣式系統分析，而是整個 plugin installation process 中的「component registration」子流程。

本章要解決的核心問題是：

```txt
當使用者執行 app.use(ViewUIPlus) 時，
View UI Plus 如何把 components export 清單轉換成 Vue App 可直接使用的全域元件？
```

讀完本章後，應該能理解以下內容：

1. `src/index.js` 為什麼同時使用 `export * from './components'` 和 `import * as components from './components'`。
2. `src/components/index.js` 在 component registration 流程中扮演什麼角色。
3. `ViewUI` map 如何把原始 component export name 與 `i` prefix alias 集中到同一個註冊來源。
4. `Object.keys(ViewUI).forEach(key => app.component(key, ViewUI[key]))` 如何把每個 key 變成 Vue global component name。
5. 為什麼本篇只分析「註冊成 global component」，不深入 component implementation、service API、style system 或 build output。

本章會延續 `04-plugin-system/01-install-flow.md` 的主線：`install(app, opts)` 是整個 plugin system 的 orchestration layer，而 component registration 是其中一個重要階段。

---

## 2. 學習前先建立的基本觀念

### 2.1 Global Component 是什麼

在 Vue 3 中，component 可以分成局部註冊與全域註冊兩種常見使用方式。

局部註冊通常發生在某個 component 內部，只讓該 component 或特定範圍能使用某個子元件。全域註冊則是透過 Vue App instance 的 `app.component(name, component)`，把某個元件註冊到整個 Vue App，使它可以在多數 template 中直接使用。

例如：

```js
app.component('Button', Button);
```

註冊後，template 中就可以直接寫：

```vue
<template>
  <Button>送出</Button>
</template>
```

對 UI library 來說，global component registration 是很常見的設計。因為使用者安裝 UI library 後，通常希望可以直接在 template 中使用它提供的元件，而不是每個頁面都手動 import、手動註冊。

---

### 2.2 Vue Plugin 為什麼適合做批次註冊

Vue plugin 的價值在於：它可以在 `app.use(plugin)` 被呼叫時，集中對 Vue App 做設定或註冊。

對 `View UI Plus` 這種 UI component library 而言，plugin install 階段通常適合做幾件事：

1. 批次註冊 components。
2. 批次註冊 directives。
3. 注入全域設定。
4. 注入 instance properties，例如 `$Message`、`$Modal`。
5. 初始化語系、翻譯函式或其他跨元件能力。

本章只聚焦在第一點：**批次註冊 components**。

也就是說，本篇關心的是：

```txt
components export 清單
  -> ViewUI map
  -> app.component()
  -> template 可使用的 global components
```

---

### 2.3 Public Surface：具名匯入與全域註冊是兩種不同入口

`src/index.js` 同時有：

```js
export * from './components';
import * as components from './components';
```

這兩行看起來都和 components 有關，但它們服務的是不同方向。

`export * from './components'` 是給使用者或外部模組使用的 public export surface。它讓使用者可以寫：

```js
import { Button, Table } from 'view-ui-plus';
```

`import * as components from './components'` 則是給 plugin install 內部使用。它把 `src/components/index.js` 匯出的所有 components 收集成一個 object，方便後續建立 `ViewUI` map 並批次註冊。

因此，本篇要建立一個重要觀念：同一份 component export 清單可以同時支援兩種使用模式。

| 使用模式 | 對使用者的意義 | 對 plugin 的意義 |
| --- | --- | --- |
| 具名匯入 | 使用者可以 `import { Button } from 'view-ui-plus'` | 提供可被外部取用的 component public API |
| 全域註冊 | 使用者可以 `app.use(ViewUIPlus)` 後直接在 template 使用 | plugin install 需要取得所有 components 並呼叫 `app.component()` |

這兩種入口都很重要，但它們不是同一件事。前者是 module export；後者是 Vue App runtime registration。

---

## 3. 整體概覽

本章的核心 source 是：

```txt
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

主要追蹤兩個結構：

```txt
ViewUI map
app.component registration loop
```

整體流程可以理解成：

```txt
src/components/index.js
  -> 匯出 Button、Table、Modal、Message、Select、Tree 等 components
  -> src/index.js 使用 export * from './components' 對外轉出
  -> src/index.js 使用 import * as components 取得完整 components collection
  -> src/index.js 建立 ViewUI map
  -> install(app) 中使用 Object.keys(ViewUI)
  -> 對每個 key 呼叫 app.component(key, ViewUI[key])
  -> 每個 key 成為 Vue App 的 global component name
```

用更接近程式流程的方式表示：

```txt
components export source
  -> components namespace object
  -> ViewUI registration map
  -> Object.keys(ViewUI)
  -> app.component(name, componentDefinition)
  -> template global component surface
```

本章的閱讀重點不是 `Button` 或 `Table` 內部如何實作，而是「component export 如何被轉換成 plugin 安裝時的全域註冊表」。

---

## 4. 核心內容逐步講解

### 4.1 `src/components/index.js` 是 component export source

在這個流程中，`src/components/index.js` 可以視為元件清單的來源。它是實際 component export 清單，例如：

```txt
Button
Table
Modal
Message
Select
Tree
```

這表示 `src/components/index.js` 的職責不是安裝 plugin，而是集中整理哪些 components 要被視為 library 的 public components。

從架構角度來看，這種集中 export 的設計有兩個好處。

第一，它讓 library 的 public component surface 有一個集中位置。使用者能不能從 `view-ui-plus` 匯入某個 component，通常會和這個 export 清單有關。

第二，它讓 plugin install 可以不必手動一個一個 import components。`src/index.js` 可以透過：

```js
import * as components from './components';
```

一次取得所有被 export 的 components，然後再交給 registration loop 批次註冊。

因此，閱讀 component registration 時，不能只看 `install()` 裡的 `app.component()`，也要回頭確認 `src/components/index.js` 到底匯出了哪些 components。因為它決定了 registration source 的基礎內容。

---

### 4.2 `export * from './components'`：建立具名匯入的 public surface

`src/index.js` 先做了這件事：

```js
export * from './components';
```

這行程式的效果是將 `./components` 中 export 出來的內容，再從 `src/index.js` 對外轉出。

它主要支援這種使用方式：

```js
import { Button, Table } from 'view-ui-plus';
```

這類用法的重點是「使用者主動指定要取用哪些 components」。它比較接近 module-level API，也就是從 package entry export 出可被 import 的成員。

這和 plugin install 的全域註冊不同。使用者即使不呼叫 `app.use(ViewUIPlus)`，理論上也可能透過具名匯入拿到某個 component，再依照自己的需求做局部註冊或其他處理。

本篇不深入討論 build output 與 tree-shaking 是否能完整支援按需引入。這部分應放到 build 或 package export 專題中後續確認。

---

### 4.3 `import * as components`：讓 plugin install 取得完整 components collection

`src/index.js` 還做了：

```js
import * as components from './components';
```

這行程式和 `export * from './components'` 的方向不同。前者是「對外轉出」，後者是「在目前模組內部收集」。

`import * as components` 會把 `./components` 的 exports 收集成一個 namespace object。可以把它想像成：

```js
components = {
  Button,
  Table,
  Modal,
  Message,
  Select,
  Tree,
  // ...
}
```

實際內容取決於 `src/components/index.js` 的 export 清單。

plugin install 需要這個 object，因為它要進一步建立 `ViewUI` map。也就是說，`components` 是 `ViewUI` 的基礎來源。

這裡要注意：`components` 本身只是 components collection，還不是最終被註冊的 map。真正用於 `app.component()` 的是後面建立的 `ViewUI`，因為 `ViewUI` 除了包含 `...components`，還額外加入了 `i` prefix alias。

---

### 4.4 `ViewUI` map：把原始 component name 與 alias name 放在同一張註冊表

最關鍵的資料結構是 `ViewUI` map：

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

這個 map 的作用是建立「註冊名稱」到「component definition」的對應關係。

它可以拆成兩部分理解。

第一部分是：

```js
...components
```

這會把原始 component export name 放進 `ViewUI`。例如如果 `components` 裡有 `Button`、`Table`、`Select`，那麼 `ViewUI` 也會有：

```js
{
  Button: components.Button,
  Table: components.Table,
  Select: components.Select
}
```

第二部分是額外加入的 alias：

```js
iButton: components.Button
iTable: components.Table
iSelect: components.Select
```

這代表同一個 component definition 可能會用不同名稱註冊成 global component。

例如：

| 註冊名稱 | 對應 component definition | 說明 |
| --- | --- | --- |
| `Button` | `components.Button` | 原始 component export name |
| `iButton` | `components.Button` | 額外提供的 alias |
| `Table` | `components.Table` | 原始 component export name |
| `iTable` | `components.Table` | 額外提供的 alias |
| `Select` | `components.Select` | 原始 component export name |
| `iSelect` | `components.Select` | 額外提供的 alias |

因此，`ViewUI` 的本質不是單純 components list，而是一張 **global component registration map**。

本篇不直接推論 `i` prefix alias 的歷史原因。常見可能原因包含相容舊版命名、避免與原生元素或其他元件名稱衝突、或提供更明確的 library prefix。

---

### 4.5 Registration loop：把 `ViewUI` 的每個 key 註冊成 global component name

install 時會執行：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

這段程式碼是本章的核心流程。

它可以拆成四個步驟理解：

```txt
1. Object.keys(ViewUI)
   取得 ViewUI map 裡所有註冊名稱。

2. forEach(key => ...)
   逐一處理每一個註冊名稱。

3. ViewUI[key]
   根據註冊名稱取出對應的 component definition。

4. app.component(key, ViewUI[key])
   將 component definition 以 key 這個名稱註冊到 Vue App。
```

用範例來看，如果 `ViewUI` 中有：

```js
{
  Button: components.Button,
  iButton: components.Button
}
```

那麼 registration loop 會等價於：

```js
app.component('Button', components.Button);
app.component('iButton', components.Button);
```

所以安裝後，template surface 可以理解為：

```vue
<template>
  <Button />
  <iButton />
</template>
```

這裡的重點是：`key` 決定 template 上的註冊名稱，`ViewUI[key]` 決定實際渲染時使用哪個 component definition。

因此，閱讀這段原始碼時要分清楚：

| 部分 | 角色 |
| --- | --- |
| `ViewUI` | 全域元件註冊表 |
| `key` | 即將註冊成 global component 的名稱 |
| `ViewUI[key]` | 對應的 component definition |
| `app.component()` | Vue App 提供的全域元件註冊 API |

---

### 4.6 安裝後的 template surface：`Button` 與 `iButton` 都可能成為可用名稱

因為 `ViewUI` 同時包含原始 component export name 與 `i` prefix alias，所以安裝後的 template surface 可以理解為：

```txt
<Button />
<Table />
<Select />

<iButton />
<iTable />
<iSelect />
```

這表示同一個 component 可能存在多個註冊名稱。例如 `Button` 與 `iButton` 都對應到 `components.Button`。

不過，實際在 template 中如何書寫，仍會受到 Vue template compiler 與 HTML casing 規則影響。plugin 註冊名稱就是 `ViewUI` map 的 key，但 template 寫法可能受到 casing 轉換影響。

一般而言，在 Vue Single File Component，也就是 `.vue` 檔案中，PascalCase 寫法較常見，例如：

```vue
<Button />
<iButton />
```

而在 in-DOM template 或需要符合 HTML parser 行為的場景中，則可能更常見 kebab-case：

```html
<button-component></button-component>
<i-button></i-button>
```

對本篇而言，最重要的不是判斷每種 template 環境的最終 casing，而是抓住 registration source：**全域元件名稱來自 `ViewUI` map 的 key**。

---

### 4.7 Component registration 與 service API 的邊界

本篇不深入 service-style component，例如 `Message`、`Modal` 的命令式行為。

這個邊界很重要，因為在 UI library 中，某些名稱可能同時出現在 component export、global component registration、以及 imperative service API 的討論中。例如 `Modal` 既可能作為 component 使用，也可能存在 `$Modal` 這種命令式 API。

本篇只處理這個問題：

```txt
某個 component definition 是否被 app.component() 註冊成 global component？
```

本篇不處理：

```txt
this.$Modal.confirm(...) 是如何建立、渲染、銷毀 Modal instance？
```

這兩者雖然都和 UI 顯示有關，但層次不同。

| 主題 | 所屬章節 | 關注點 |
| --- | --- | --- |
| Component registration | `04-plugin-system/02-component-registration.md` | 如何透過 `app.component()` 註冊 global component |
| Component implementation | `07-components/` | 單一 component 的 props、events、slots、render 邏輯 |
| Imperative service API | `10-imperative-api/` | `$Message`、`$Modal` 等命令式 API 如何建立 UI |
| Style system | 其他樣式章節 | class、Less、theme token、樣式覆蓋方式 |
| Build output / tree-shaking | build/package 相關章節 | 產物如何打包、是否支援按需載入 |

這樣拆分可以避免一篇筆記同時承載太多主題，導致學習焦點模糊。

---

## 5. 表格整理

### 5.1 Component registration 流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 閱讀重點 |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/components/index.js` | 集中 export components | 各 component 模組 | component export 清單 | 確認哪些 components 屬於 public surface |
| 2 | `src/index.js` | 對外轉出 components | `./components` | `export * from './components'` | 支援 `import { Button } from 'view-ui-plus'` |
| 3 | `src/index.js` | 內部收集 components | `./components` | `components` namespace object | plugin install 內部取得完整 collection |
| 4 | `src/index.js` | 建立 `ViewUI` map | `components` | 原始名稱 + `i` prefix alias | 註冊來源不是單純 `components`，而是 `ViewUI` |
| 5 | `install(app)` | 取得所有註冊名稱 | `Object.keys(ViewUI)` | `key[]` | 每個 key 都會成為 global component name |
| 6 | `install(app)` | 註冊 global component | `key`、`ViewUI[key]` | `app.component(key, ViewUI[key])` | `key` 是名稱，`ViewUI[key]` 是 component definition |
| 7 | 使用者 template | 使用 global component | 已註冊的 component name | `<Button />`、`<iButton />` 等 | 實際 casing 需考慮 Vue template 與 HTML 規則 |

這張表要從「資料如何流動」的角度閱讀。`src/components/index.js` 先提供 component export source，`src/index.js` 再把它整理成 `ViewUI` registration map，最後 `install()` 用 `app.component()` 把 map 裡的每個項目掛到 Vue App 上。

---

### 5.2 `export *` 與 `import * as components` 比較表

| 程式碼 | 方向 | 目的 | 支援的使用場景 | 注意事項 |
| --- | --- | --- | --- | --- |
| `export * from './components'` | 對外輸出 | 將 components public API 從 package entry 轉出 | `import { Button, Table } from 'view-ui-plus'` | 這是 module export，不等於 Vue App 已註冊 |
| `import * as components from './components'` | 對內收集 | 讓 `src/index.js` 取得完整 components collection | 建立 `ViewUI` map，準備全域註冊 | 這是 plugin install 的資料來源之一 |
| `const ViewUI = { ...components, ...aliases }` | 內部整理 | 建立最終註冊表 | `Object.keys(ViewUI).forEach(...)` | `ViewUI` 包含原始名稱與 alias |
| `app.component(key, ViewUI[key])` | runtime 註冊 | 將 component 註冊到 Vue App | template 直接使用 global component | 這才是 Vue global component registration |

---

### 5.3 `ViewUI` name type 整理表

| Name type | Example | 對應 component definition | Meaning | 閱讀重點 |
| --- | --- | --- | --- | --- |
| 原始 component export name | `Button` | `components.Button` | 來自 `src/components/index.js` 的原始 export name | 確認 export 清單是否包含該 component |
| 原始 component export name | `Table` | `components.Table` | 來自 `src/components/index.js` 的原始 export name | 安裝後會成為 global component name |
| 原始 component export name | `Select` | `components.Select` | 來自 `src/components/index.js` 的原始 export name | 可與 alias 對照 |
| `i` prefix alias | `iButton` | `components.Button` | plugin 額外註冊的 template alias | 與 `Button` 指向同一個 component definition |
| `i` prefix alias | `iTable` | `components.Table` | plugin 額外註冊的 template alias | 與 `Table` 指向同一個 component definition |
| `i` prefix alias | `iSelect` | `components.Select` | plugin 額外註冊的 template alias | 與 `Select` 指向同一個 component definition |

---

### 5.4 模組責任表

| 模組 / 檔案 | 所在位置 | 負責職責 | 與其他模組的關係 | 初次閱讀重點 |
| --- | --- | --- | --- | --- |
| `src/components/index.js` | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 集中 export components | 被 `src/index.js` 對外轉出，也被 `import * as components` 收集 | 確認 public component export 清單 |
| `src/index.js` | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | package runtime entry 與 plugin install orchestration | 建立 `ViewUI` map，並在 `install()` 中註冊 components | 先讀 `export *`、`import * as components`、`ViewUI`、registration loop |
| `ViewUI` | `src/index.js` 內部常數 | 建立 global component registration map | 以 `components` 為基礎，額外加入 `i` prefix aliases | 分清楚原始名稱與 alias 名稱 |
| `install(app, opts)` | `src/index.js` | Vue plugin 安裝入口 | 呼叫 `app.component()` 完成 global component registration | 追蹤 `Object.keys(ViewUI).forEach(...)` |
| `app.component()` | Vue App API | 註冊 global component | 接收註冊名稱與 component definition | 理解 `key` 與 `ViewUI[key]` 的差異 |

---

## 6. 範例或情境說明

### 6.1 使用者整包安裝 View UI Plus

使用者通常在專案入口寫：

```js
import { createApp } from 'vue';
import App from './App.vue';
import ViewUIPlus from 'view-ui-plus';

const app = createApp(App);

app.use(ViewUIPlus);

app.mount('#app');
```

從使用者角度來看，這表示「安裝 View UI Plus」。

從本章的 component registration 角度來看，這會觸發：

```txt
app.use(ViewUIPlus)
  -> ViewUIPlus.install(app)
  -> Object.keys(ViewUI).forEach(...)
  -> app.component(key, ViewUI[key])
```

安裝完成後，使用者就可以在 template 中使用已註冊的 global components：

```vue
<template>
  <Button type="primary">新增</Button>
  <Table :columns="columns" :data="data" />

  <iButton>Alias Button</iButton>
  <iTable :columns="columns" :data="data" />
</template>
```

這裡的 `<Button />` 與 `<iButton />` 之所以都可能可用，是因為 `ViewUI` map 同時註冊了 `Button` 與 `iButton`，而它們都指向 `components.Button`。

---

### 6.2 使用者具名匯入 component

另一種使用方式是：

```js
import { Button } from 'view-ui-plus';
```

這個能力來自：

```js
export * from './components';
```

它和 plugin 全域註冊不同。具名匯入只是讓使用者在 module 層級拿到 `Button`，不代表 `Button` 已經自動成為 Vue App 的 global component。

如果使用者沒有呼叫 `app.use(ViewUIPlus)`，而是只具名匯入 component，仍需要依照自己的使用方式註冊或引用它。

因此可以這樣理解：

```txt
export * from './components'
  -> 讓使用者可以 import component

app.component(key, ViewUI[key])
  -> 讓使用者可以在 template 直接使用 global component
```

兩者都屬於 public surface，但一個是 module import surface，一個是 Vue runtime template surface。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀這段原始碼時，建議按照以下順序：

1. 先讀 `src/index.js` 的 import/export 區塊  
   目的是確認 components 是如何從 `./components` 被對外轉出，以及如何被內部收集。

2. 再讀 `src/components/index.js`  
   目的是確認實際有哪些 components 被 export，例如 `Button`、`Table`、`Modal`、`Message`、`Select`、`Tree` 等。

3. 接著讀 `ViewUI` map  
   目的是分辨哪些名稱來自 `...components`，哪些名稱是額外加入的 `i` prefix alias。

4. 再讀 `install(app, opts)` 中的 component registration loop  
   目的是確認 `Object.keys(ViewUI)` 如何搭配 `app.component()` 完成 global registration。

5. 最後回到 template surface  
   目的是從使用者角度理解安裝後為什麼可以使用 `<Button />`、`<Table />`、`<iButton />`、`<iTable />` 等名稱。

---

### 7.2 深入閱讀路線

理解本篇後，可以往以下方向深入：

1. 對照 `src/components/index.js` 的完整 export 清單  
   確認哪些 components 被公開，哪些沒有被公開。

2. 對照 `ViewUI` map 的 alias 清單  
   確認哪些 components 有 `i` prefix alias，哪些沒有。

3. 對照文件或歷史版本  
   確認 `iButton`、`iTable` 等 alias 的設計目的，是否與相容舊版本或命名衝突有關。

4. 對照 `types/index.d.ts`  
   確認具名匯入與全域註冊的型別 surface 是否一致。

5. 對照 build output  
   若要研究按需引入、tree-shaking 或 bundle size，應另開 build/package 相關筆記，不要混在本章。

---

### 7.3 可以暫時跳過的部分

如果目標只是理解 plugin component registration，可以暫時跳過：

1. 單一 component 的 props、events、slots。
2. 單一 component 的 render function 或 template。
3. component 樣式 class 與 Less 結構。
4. `$Message`、`$Modal` 等命令式 API 的內部實作。
5. build output 與 tree-shaking 行為。
6. alias 的歷史原因與版本相容性細節。

這些主題都值得研究，但不屬於本章的第一優先。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `export * from './components'` 就等於完成全域註冊 | `export` 和 `component registration` 都和 components 有關，容易混在一起 | `export *` 只是 module export；真正的全域註冊是 `app.component(key, ViewUI[key])` |
| 以為 `components` 就是最終註冊表 | `components` 已經收集了所有 component exports，看起來可以直接註冊 | 最終註冊來源是 `ViewUI`，因為它除了 `...components`，還額外加入 `i` prefix aliases |
| 以為 `Button` 和 `iButton` 是兩個不同元件 | template 上名稱不同，容易以為背後 component 不同 | 根據目前筆記，`iButton` 指向 `components.Button`，是同一個 component definition 的 alias |
| 以為 `app.component(key, ViewUI[key])` 的 `key` 和 `ViewUI[key]` 是同一種東西 | 兩者都出現在同一行，初學者容易忽略差異 | `key` 是註冊名稱；`ViewUI[key]` 是 component definition |
| 以為本篇要分析 `Button`、`Table` 的 props 和 events | 標題有 component registration，容易延伸到 component implementation | 本篇只分析如何註冊成 global component，單一 component 實作應放在 `07-components/` |
| 以為 `Message`、`Modal` 的命令式 API 也在本篇分析 | `Message`、`Modal` 可能同時出現在 component 與 service API 脈絡 | `$Message`、`$Modal` 等命令式行為應放在 `10-imperative-api/` |
| 忽略 Vue template casing 規則 | 原始註冊名稱是 JavaScript key，但 template 會受到 compiler 與 HTML parser 影響 | plugin 註冊名稱來自 `ViewUI` key；實際 template 寫法需依 Vue template 環境判斷 |

---

## 9. 本章總結

本章的核心觀念是：`View UI Plus` 的 component registration 並不是單純把 `src/components/index.js` 匯出的內容直接丟給 Vue App，而是先經過 `src/index.js` 的整理。

`src/components/index.js` 是 component export source。它定義哪些 components 屬於 public component surface，例如 `Button`、`Table`、`Modal`、`Message`、`Select`、`Tree` 等。

`src/index.js` 對這份 export source 做了兩件不同方向的處理。第一，它透過 `export * from './components'` 把 components 對外轉出，支援使用者具名匯入。第二，它透過 `import * as components from './components'` 在內部收集完整 components collection，作為 plugin install 的註冊來源。

接著，`src/index.js` 建立 `ViewUI` map。這張 map 不只包含 `...components` 的原始 component export name，也額外加入了 `iButton`、`iTable`、`iSelect` 等 `i` prefix aliases。這代表同一個 component definition 可以用多個名稱註冊到 Vue App。

最後，`install()` 透過：

```js
Object.keys(ViewUI).forEach(key => {
    app.component(key, ViewUI[key]);
});
```

把 `ViewUI` map 裡的每個 key 註冊成 Vue global component name。這就是為什麼使用者安裝 View UI Plus 後，可以在 template 中直接使用 `<Button />`、`<Table />`、`<Select />`，也可能使用 `<iButton />`、`<iTable />`、`<iSelect />` 等 alias。

因此，閱讀這段原始碼時，最重要的是建立這條資料流：

```txt
src/components/index.js
  -> components namespace object
  -> ViewUI registration map
  -> app.component()
  -> global component template surface
```

只要掌握這條資料流，就能清楚理解 View UI Plus 在 plugin install 階段如何建立 component-level public surface。

---

## 10. 自我檢查問題

1. `src/components/index.js` 在 component registration 流程中扮演什麼角色？
2. `export * from './components'` 和 `import * as components from './components'` 的方向有什麼不同？
3. 為什麼具名匯入 `import { Button } from 'view-ui-plus'` 不等於 Vue App 已經完成 global component registration？
4. `ViewUI` map 和 `components` namespace object 有什麼不同？
5. `ViewUI` 中的 `iButton: components.Button` 表示什麼？
6. `Object.keys(ViewUI).forEach(key => app.component(key, ViewUI[key]))` 可以拆成哪幾個步驟理解？
7. 在 `app.component(key, ViewUI[key])` 中，`key` 和 `ViewUI[key]` 各自代表什麼？
8. 為什麼本篇不深入分析 `Button`、`Table` 的 props、events、slots？
9. 為什麼 `Message`、`Modal` 的命令式行為應該放到 `10-imperative-api/`，而不是本篇？
10. 如果要確認新增 component 是否會被 plugin 全域註冊，應該檢查哪些檔案或程式片段？

---

## 11. 後續延伸方向

本篇完成的是 plugin system 中的 component registration 主線。後續可以延伸成以下筆記：

1. `04-plugin-system/03-directive-registration.md`  
   分析 View UI Plus 如何把 directives collection 註冊成 global directives。

2. `04-plugin-system/04-global-options-and-viewui-config.md`  
   分析 plugin options 如何寫入 `$VIEWUI`，以及這些設定如何影響元件行為。

3. `04-plugin-system/05-global-properties.md`  
   整理 `app.config.globalProperties` 上掛載了哪些 `$xxx` properties。

4. `04-plugin-system/07-runtime-type-contract.md`  
   對照 runtime registration 與 `types/index.d.ts`，確認 public API 型別契約是否完整。

5. `07-components/index-export-map.md`  
   針對 `src/components/index.js` 建立完整 component export map，整理每個 component 的來源、用途與初次閱讀路線。

6. `07-components/button-source-reading.md`  
   以 `Button` 作為第一個單一 component source reading 範例，分析 props、events、slots、class name 與 render/template。

7. `10-imperative-api/message-modal-service.md`  
   分析 `$Message`、`$Notice`、`$Modal` 等 service API 如何和 component registration 區分。

8. `12-build-package/tree-shaking-and-on-demand-import.md`  
   分析 `export * from './components'`、package entry、build output 與 tree-shaking / 按需引入之間的關係。
