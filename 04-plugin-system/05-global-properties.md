# View UI Plus Plugin System：Global Properties 與 Instance-level API

## 1. 本章定位

本章是 `04-plugin-system/` 目錄下的原始碼閱讀筆記，主題是 View UI Plus 在 Vue plugin 安裝流程中，如何透過 `app.config.globalProperties` 暴露 instance-level API。

`04-plugin-system/` 主要關注的是 Vue plugin 安裝流程、全局註冊、配置注入與插件化設計。因此，本篇的重點不是深入分析 `$Message`、`$Modal`、`$Notice` 這些 service 內部如何建立 DOM 或管理 overlay，而是回答以下問題：

- View UI Plus 在 install 時，掛了哪些 global properties？
- 這些 global properties 分別代表什麼角色？
- 為什麼同一個能力可能同時存在於 named export 和 `this.$...`？
- TypeScript 如何讓這些 `$...` 屬性被 component instance 辨識？
- 本篇和後續的 imperative API、overlay system 筆記如何分工？

讀完本章後，應該能建立以下理解：

> View UI Plus 的 plugin install 不只負責註冊全局元件，也會把部分全域設定、命令式 API 與工具物件掛到 `app.config.globalProperties` 上，讓 Options API component 可以透過 `this.$...` 使用這些能力。

本章不解決以下問題：

- `$Message.info()` 的完整 method contract。
- `$Modal.confirm()` 如何建立彈窗、掛載 vnode 或管理生命週期。
- `$Notice`、`$Loading`、`$Spin` 的 queue、z-index、destroy 行為。
- overlay 類 API 的 DOM 建立與銷毀細節。

這些內容應拆到 `10-imperative-api/` 與 `08-overlay-system/` 繼續分析。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin install 是在擴充整個 app

在 Vue 3 中，使用者通常會透過下列方式安裝一個元件庫：

```js
import { createApp } from 'vue';
import ViewUIPlus from 'view-ui-plus';
import App from './App.vue';

const app = createApp(App);

app.use(ViewUIPlus);
app.mount('#app');
```

`app.use(ViewUIPlus)` 會觸發 View UI Plus 提供的 plugin install 邏輯。元件庫通常會在 install 過程中做幾件事：

1. 全局註冊元件，例如讓使用者可以直接在 template 使用 `<Button />`、`<Modal />`。
2. 注入全域設定，例如尺寸、z-index、transfer、locale 等 config。
3. 暴露全域 instance-level API，例如 `this.$Message`、`this.$Modal`。
4. 補上工具函數或 helper，例如 `this.$Date`。

本篇聚焦的是第 3 點與部分第 4 點：View UI Plus 如何把 API 寫入 `app.config.globalProperties`。

---

### 2.2 `app.config.globalProperties` 是 component instance 的全域屬性入口

Vue 3 的 `app.config.globalProperties` 可以理解為「掛在所有 component instance proxy 上的共用屬性」。當 plugin 寫入：

```js
app.config.globalProperties.$Message = components.Message;
```

之後，Options API component 中就可以透過：

```js
this.$Message.info('Saved');
```

來呼叫它。

這種寫法的核心意義是：

- 對使用者而言，不需要在每個元件都手動 import `Message`。
- 對元件庫而言，可以提供一組看起來像「全域服務」的 instance API。
- 對 Vue app 而言，這些屬性只會在該 app instance 安裝 plugin 後生效。

要注意的是，`globalProperties` 並不是 JavaScript 真正的全域變數。它是掛在 Vue app instance 的 component proxy 上，因此它的作用範圍和 `app` 有關，而不是整個瀏覽器環境。

---

### 2.3 Instance-level API 與 module-level API 是兩個不同入口

View UI Plus 同一個能力可能同時有兩種使用方式：

```js
import { Message } from 'view-ui-plus';

Message.info('Saved');
```

以及：

```js
this.$Message.info('Saved');
```

這兩者看起來都在呼叫 Message service，但它們來自不同 API surface：

- `import { Message } from 'view-ui-plus'` 是 module-level import surface。
- `this.$Message` 是 plugin install 後建立的 instance-level surface。

這個差異很重要。因為 named export 是由模組匯出系統提供，而 `this.$Message` 是由 Vue plugin install 寫入 `app.config.globalProperties` 之後才存在。

---

## 3. 整體概覽

本篇的核心 source 來自：

```text
01-origin/source/view-ui-plus-v1.3.20/src/index.js
```

`$VIEWUI` 後面的 `globalProperties` 設定是本章主要閱讀位置。View UI Plus install 時主要寫入兩類 global properties：

| 類別 | 代表項目 | 主要目的 |
| --- | --- | --- |
| 全域設定 | `$VIEWUI` | 讓 components 讀取 View UI Plus 的全域 config |
| 命令式 API / helper | `$Message`、`$Modal`、`$Date` | 讓 component instance 可以直接呼叫 service 或工具 |

整體關係可以用下列流程理解：

```text
使用者呼叫 app.use(ViewUIPlus)
        ↓
View UI Plus plugin install 執行
        ↓
註冊全局元件、處理全域設定
        ↓
寫入 app.config.globalProperties
        ↓
component instance 可以使用 this.$VIEWUI、this.$Message、this.$Modal、this.$Date
```

其中 `$VIEWUI` 的詳細 config 結構應回到：

```text
04-plugin-system/04-global-options-and-viewui-config.md
```

本篇只把 `$VIEWUI` 放在 globalProperties 的角色中理解，不深入展開它的設定欄位。

---

## 4. 核心內容逐步講解

### 4.1 `globalProperties` 在 View UI Plus plugin system 中的角色

在 Vue plugin system 中，install 階段是一個很適合建立「全域能力入口」的位置。因為 plugin 被安裝時會拿到 `app` 物件，而 `app` 物件可以讓 plugin 對整個 Vue application 做擴充。

View UI Plus 透過 `app.config.globalProperties` 做的事情，可以理解為：

> 把 View UI Plus 中某些常用 service、helper、全域設定物件，掛到所有 component instance 都能存取的位置。

這種設計通常用在「不一定是一個視覺元件，但需要在元件內直接呼叫」的能力。例如：

- 顯示訊息：`this.$Message.info('Saved')`
- 顯示確認框：`this.$Modal.confirm({ title: 'Confirm' })`
- 使用日期工具：`this.$Date().format('YYYY-MM-DD')`

這些能力不一定適合寫成 template component，也不一定希望每次都手動 import。因此元件庫會提供 instance-level API，讓使用者在元件方法中可以直接調用。

---

### 4.2 `$VIEWUI`：全域設定入口

`$VIEWUI` 是 View UI Plus 寫入 globalProperties 的全域設定入口。它的主要目的不是給使用者呼叫某個命令式 service，而是讓 components 可以讀取 View UI Plus 的全域 config。

```text
$VIEWUI 的詳細結構見 04-plugin-system/04-global-options-and-viewui-config.md
```

因此，本篇只需要掌握 `$VIEWUI` 在這裡的定位：

- 它屬於「全域設定」類別。
- 它被掛到 component instance 可存取的位置。
- 它讓元件在 runtime 能取得 View UI Plus 的全域配置。
- 它和 `$Message`、`$Modal` 這類命令式 API 的角色不同。

換句話說，`$VIEWUI` 比較像「config container」，而 `$Message`、`$Modal` 比較像「service facade」。

---

### 4.3 `$Message`、`$Modal`、`$Notice`：命令式 API 入口

View UI Plus 也會把一些命令式 service 掛到 `globalProperties`。這類 API 的特徵是：

1. 使用者通常在事件處理函式、表單提交、API 回應後呼叫。
2. 呼叫時通常會立即產生 UI 效果，例如 message、notice、modal、loading。
3. 它們不一定透過 template 宣告，而是透過 JavaScript 方法命令式觸發。

例如：

```js
export default {
  methods: {
    async save() {
      // 省略儲存邏輯
      this.$Message.info('Saved');
    }
  }
};
```

這種設計對使用者很直覺：當某個操作成功，就直接呼叫 `this.$Message.info()`；當需要使用者確認，就直接呼叫 `this.$Modal.confirm()`。

不過，本章只說明 plugin 如何暴露這些 service，不分析 service object 的完整 method shape。像 `$Message.info`、`$Notice.open`、`$Modal.confirm` 的具體參數、回傳值、DOM 建立流程，應放到 `10-imperative-api/` 或 `08-overlay-system/` 分析。

---

### 4.4 `$Date`：掛載工具物件的例子

除了 UI service，View UI Plus 也把 `$Date` 掛到 globalProperties。

```text
$Date → dayjs
```

這表示安裝 plugin 後，Options API component 可以使用：

```js
this.$Date().format('YYYY-MM-DD');
```

這裡的 `$Date` 比較像 helper 或工具入口，而不是 overlay service。它不負責產生 UI，而是提供日期處理能力。

這也說明 `globalProperties` 不只能掛 UI service，也可以掛工具函式或第三方工具物件。不過在閱讀原始碼時要注意：是否應該把工具掛到 globalProperties，是元件庫的 API 設計選擇，不代表所有工具都應該這樣設計。

---

### 4.5 安裝後可用的 instance APIs

View UI Plus install 會寫入以下 global properties：

| global property | Runtime value | 分類 | 閱讀重點 |
| --- | --- | --- | --- |
| `$Spin` | `components.Spin` | 命令式 API / service | 需要後續確認它的 method contract 與實際 UI 建立方式 |
| `$Loading` | `components.LoadingBar` | 命令式 API / service | 通常與 loading bar 類互動有關，細節應放到 imperative API 或 overlay system |
| `$Message` | `components.Message` | 命令式 API / service | 用於訊息提示；本篇只確認其掛載方式，不分析 `.info()` 等方法 |
| `$Notice` | `components.Notice` | 命令式 API / service | 用於通知提示；queue、z-index、destroy 行為需另篇分析 |
| `$Modal` | `components.Modal` | 命令式 API / service | 用於命令式彈窗；confirm、destroy 等行為需另篇分析 |
| `$ImagePreview` | `components.ImagePreview` | 命令式 API / service | 與圖片預覽能力有關，具體行為需回看 service source |
| `$Copy` | `components.Copy` | helper / service | 可能與複製能力有關，具體 method shape 需要後續確認 |
| `$ScrollIntoView` | `components.ScrollIntoView` | helper / service | 可能與捲動到指定元素有關，具體使用方式需後續確認 |
| `$ScrollTop` | `components.ScrollTop` | helper / service | 可能與回到頂部或捲動控制有關，具體使用方式需後續確認 |
| `$Date` | `dayjs` | 工具 helper | 提供日期工具入口 |

這張表的閱讀重點不是背清單，而是看出 View UI Plus 的 plugin install 如何把不同類型的能力統一整理成 `this.$...` 形式。

---

### 4.6 Options API component 中的使用方式

範例：

```js
this.$Message.info('Saved');
this.$Modal.confirm({ title: 'Confirm' });
this.$Date().format('YYYY-MM-DD');
```

這些範例有一個共同前提：component 必須處在已安裝 View UI Plus plugin 的 Vue app 中。也就是說，必須先有類似下列安裝流程：

```js
const app = createApp(App);

app.use(ViewUIPlus);
app.mount('#app');
```

安裝後，Options API component 的 `methods`、生命週期方法或其他可以取得 `this` 的位置，就能使用這些 `$...` 屬性。

需要注意的是，這種寫法主要對 Options API 比較直覺。若在 Composition API 的 `setup()` 中，`this` 不會指向 component instance，因此不應直接寫：

```js
setup() {
  // 這裡不能依賴 this.$Message
}
```

Composition API 中如果要使用這類能力，通常會考慮：

1. 直接使用 named import，例如 `import { Message } from 'view-ui-plus'`。
2. 透過 Vue instance proxy 取得，但這會讓程式碼和 component instance 耦合較高。
3. 封裝自己的 composable，統一處理 service 呼叫。

本篇不深入展開 Composition API 的最佳實務，只提醒：`this.$Message` 是 instance-level API，理解它時要放在 component instance 的脈絡中。

---

### 4.7 Named exports 與 globalProperties 的差異

可能同時出現在 named export 和 globalProperties：

| Access pattern | Example | Meaning |
| --- | --- | --- |
| Named import | `import { Message } from 'view-ui-plus'` | module-level import surface |
| Instance property | `this.$Message` | Vue app install 後的 instance surface |

這裡可以進一步拆成兩種設計層次來理解。

第一層是 **module-level API**。當使用者寫：

```js
import { Message } from 'view-ui-plus';
```

這表示 `Message` 是 View UI Plus package 對外匯出的 JavaScript 模組成員。它的存在取決於 package 的 export 設計：

```js
export * from './components';
```

第二層是 **instance-level API**。當使用者寫：

```js
this.$Message
```

這表示 `Message` 被 plugin install 過程掛到了 `app.config.globalProperties`，所以 component instance proxy 可以讀到它。

這兩者的差異可以整理如下：

| 比較面向 | Named export | `globalProperties` instance property |
| --- | --- | --- |
| 取得方式 | 透過 ES module import | 透過 component instance 的 `this.$...` |
| 是否需要 `app.use()` | 不一定 | 需要 plugin install 後才會存在 |
| 適合場景 | Composition API、工具函式、明確依賴 | Options API、元件方法中快速呼叫 |
| 來源重點 | package export surface | Vue plugin install surface |
| 可測試性 | 通常較容易 mock 或替換 import | 需要處理 component instance / app context |
| 閱讀原始碼位置 | 匯出檔、components barrel file | `src/index.js` 的 install / globalProperties 設定 |

對原始碼閱讀而言，這個差異可以幫助你區分兩種問題：

- 「這個 API 有沒有被 package 匯出？」要看 export surface。
- 「這個 API 能不能用 `this.$...` 呼叫？」要看 plugin install 是否寫入 `globalProperties`。

---

### 4.8 TypeScript type surface：`ComponentCustomProperties`

Vue 3 中，如果要讓 TypeScript 知道 component instance 上有自訂的 `$...` 屬性，通常會透過 module augmentation 擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`。

`types/index.d.ts` 有以下宣告：

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

這段宣告的重點是：

1. 它告訴 TypeScript：component instance 上存在 `$VIEWUI`、`$Message`、`$Modal` 等屬性。
2. `$VIEWUI` 有較明確的型別：`ViewUIPlusGlobalOptions`。
3. 多數 service 型別是 `any`，代表 TypeScript 不會檢查 method-level contract。

因此，當你在 Options API 中寫：

```ts
this.$Message.info('Saved');
```

TypeScript 可能不會抱怨 `$Message` 不存在，但也可能無法精準檢查 `.info()` 的參數是否正確。

> 目前多數 service 型別是 `any`，所以型別只保證 property 存在，不保證 method-level contract。

這對學習元件庫設計很重要。因為「runtime 有掛上去」和「type system 精準描述」是兩件不同的事情。

---

### 4.9 Runtime surface 與 type surface 需要一起看

閱讀 View UI Plus 這類元件庫時，建議把 globalProperties 分成兩層觀察：

| 層次 | 觀察檔案 | 你要確認的問題 |
| --- | --- | --- |
| Runtime surface | `src/index.js` | plugin install 時實際掛了哪些 `$...` 屬性？runtime value 是什麼？ |
| Type surface | `types/index.d.ts` | TypeScript 是否知道這些 `$...` 屬性？型別是否精準？ |

如果 runtime 有掛 `$Message`，但 type declaration 沒有宣告，使用者在 TypeScript component 中可能會遇到型別錯誤。

如果 type declaration 有宣告 `$Message`，但 runtime 沒有真的掛上，程式可能能通過型別檢查，但執行時會出錯。

因此，元件庫的 plugin API 不應只看 JavaScript runtime source，也要同步看 `.d.ts` 是否描述一致。

---

## 5. 表格整理

### 5.1 Global properties 分類表

| 類別 | global property | Runtime value | 主要用途 | 後續閱讀方向 |
| --- | --- | --- | --- | --- |
| 全域設定 | `$VIEWUI` | View UI Plus global options | 讓 components 讀取全域 config | `04-global-options-and-viewui-config.md` |
| Loading service | `$Spin` | `components.Spin` | 提供 spin 類命令式能力 | `10-imperative-api/`、`08-overlay-system/` |
| Loading service | `$Loading` | `components.LoadingBar` | 提供 loading bar 類命令式能力 | `10-imperative-api/` |
| Feedback service | `$Message` | `components.Message` | 提供 message 提示能力 | `10-imperative-api/` |
| Feedback service | `$Notice` | `components.Notice` | 提供 notice 通知能力 | `10-imperative-api/`、`08-overlay-system/` |
| Overlay service | `$Modal` | `components.Modal` | 提供 modal / confirm 類命令式能力 | `08-overlay-system/` |
| Preview service | `$ImagePreview` | `components.ImagePreview` | 提供圖片預覽能力 | `08-overlay-system/` |
| Helper / service | `$Copy` | `components.Copy` | 提供複製相關能力 | 需要後續確認 |
| Helper / service | `$ScrollIntoView` | `components.ScrollIntoView` | 提供捲動到指定位置相關能力 | 需要後續確認 |
| Helper / service | `$ScrollTop` | `components.ScrollTop` | 提供捲動到頂部相關能力 | 需要後續確認 |
| Utility helper | `$Date` | `dayjs` | 提供日期處理工具 | dayjs 使用方式 / helper 設計 |

這張表應該搭配 source 一起讀。表格本身只能告訴你「install 暴露了什麼」，但不能替代後續對 service source 的分析。

---

### 5.2 API surface 比較表

| Surface | 使用方式 | 建立來源 | 適合閱讀的 source | 常見用途 |
| --- | --- | --- | --- | --- |
| Named export surface | `import { Message } from 'view-ui-plus'` | package export | `export * from './components'` 相關位置 | 明確 import service 或 component |
| Instance property surface | `this.$Message` | `app.config.globalProperties` | `src/index.js` 的 install 設定 | Options API component 中快速呼叫 |
| Type surface | `this.$Message` 可被 TS 辨識 | `ComponentCustomProperties` module augmentation | `types/index.d.ts` | 讓 TypeScript 知道 instance property 存在 |

這三種 surface 是同一套元件庫 API 在不同層次上的呈現。閱讀時不要混在一起，否則容易搞不清楚某個 API 到底是「被匯出」、「被掛到 instance」還是「被型別宣告」。

---

### 5.3 流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | 使用者專案入口 | 呼叫 `app.use(ViewUIPlus)` | Vue app instance | 觸發 plugin install | 需要先建立 `createApp(App)` |
| 2 | `src/index.js` | 執行 View UI Plus install 邏輯 | `app`、全域 options | 註冊元件、設定 config、掛 global properties | 本篇聚焦 globalProperties |
| 3 | `app.config.globalProperties` | 寫入 `$VIEWUI`、`$Message`、`$Modal` 等屬性 | View UI Plus components / helpers | instance-level API surface | runtime 才會生效 |
| 4 | component instance | 使用 `this.$Message`、`this.$Date` | 已安裝 plugin 的 app context | 呼叫 service 或 helper | 主要對 Options API 直覺 |
| 5 | `types/index.d.ts` | 擴充 `ComponentCustomProperties` | 型別宣告 | TypeScript 辨識 `$...` 屬性 | 多數 service 為 `any`，型別不夠精準 |

---

## 6. 範例或情境說明

### 6.1 表單儲存成功後顯示訊息

假設某個 Options API component 有一個儲存表單的方法：

```js
export default {
  methods: {
    async handleSubmit() {
      // 1. 呼叫 API 儲存資料
      // await saveForm(this.form);

      // 2. 儲存成功後顯示提示
      this.$Message.info('Saved');
    }
  }
};
```

這裡的 `this.$Message` 不是這個 component 自己宣告的 property，也不是瀏覽器原生 API，而是 View UI Plus plugin 在 install 時寫入 `app.config.globalProperties` 後，Vue component instance proxy 可以取得的屬性。

所以這段程式能運作的前提是：

```js
app.use(ViewUIPlus);
```

已經在 app 建立階段執行。

---

### 6.2 使用確認視窗包住危險操作

另一個常見情境是刪除資料前要求使用者確認：

```js
export default {
  methods: {
    removeItem() {
      this.$Modal.confirm({
        title: 'Confirm',
        content: 'Are you sure you want to delete this item?'
      });
    }
  }
};
```

在這個例子中，`this.$Modal` 是 instance-level API。它的暴露位置屬於 plugin system，但它如何建立 modal、如何掛載 DOM、如何處理 confirm callback，則屬於 imperative API 或 overlay system 的分析範圍。

因此，閱讀這段原始碼時要拆成兩個問題：

1. 為什麼 component instance 上有 `$Modal`？  
   答案在 `src/index.js` 的 `globalProperties` 設定。

2. `$Modal.confirm()` 具體做了什麼？  
   答案要回到 `components.Modal` 或相關 service source。

---

### 6.3 使用 `$Date` 處理顯示格式

```js
export default {
  computed: {
    todayText() {
      return this.$Date().format('YYYY-MM-DD');
    }
  }
};
```

這裡的 `$Date` runtime value 是 `dayjs`。它不像 `$Message` 或 `$Modal` 會觸發 UI overlay，而是提供日期工具能力。

這個例子可以幫助你理解：`globalProperties` 的掛載對象不一定都是 component，也可能是 utility helper。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次讀本主題時，建議先建立 plugin install 的大圖，不要一開始就鑽進 `$Message.info()` 的內部實作。

建議順序如下：

1. **先讀 `04-plugin-system/01-install-flow.md`**  
   目的：理解 `app.use(ViewUIPlus)` 如何觸發 install，以及 install 大致做哪些事。

2. **再讀 `04-plugin-system/04-global-options-and-viewui-config.md`**  
   目的：理解 `$VIEWUI` 是什麼，以及全域設定如何被保存與讀取。

3. **接著讀本篇 `04-plugin-system/05-global-properties.md`**  
   目的：理解 View UI Plus 如何建立 `this.$...` instance-level API surface。

4. **最後對照 `types/index.d.ts`**  
   目的：確認 runtime 掛載的 `$...` 屬性是否有被 TypeScript 宣告，以及型別精準度如何。

---

### 7.2 深入閱讀路線

當你已經理解 globalProperties 的掛載方式後，可以再往下追 service 本身的實作：

1. 從 `$Message` 追到 `components.Message`。
2. 從 `$Modal` 追到 `components.Modal`。
3. 從 `$Notice` 追到 `components.Notice`。
4. 觀察這些 service 是否有共通的 overlay 建立、queue、z-index、destroy 管理模式。
5. 將共通設計整理到 `08-overlay-system/`。
6. 將單一 service 的 method contract 與使用方式整理到 `10-imperative-api/`。

---

### 7.3 可以暫時跳過的部分

初次閱讀時可以暫時跳過：

- `$Message.info()` 每個參數的細節。
- `$Modal.confirm()` 的完整 callback 行為。
- overlay DOM 掛載與銷毀流程。
- z-index、queue、destroyAll 等進階管理。
- service object 內部如何封裝 vnode 或 render。

這些內容雖然重要，但不是本章的主題。本章只需要回答「plugin install 如何把它們暴露到 component instance 上」。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `this.$Message` 是 JavaScript 全域變數 | 原始筆記把 `$Message` 放在全域可用 API 的脈絡下，容易讓人以為它像 `window` 上的全域變數 | `this.$Message` 是 View UI Plus install 後寫入 `app.config.globalProperties` 的 instance property，只能透過對應 Vue app 的 component instance proxy 取得 |
| 以為 named import 和 `this.$Message` 是同一個入口 | 原始筆記同時提到 `import { Message } from 'view-ui-plus'` 和 `this.$Message`，兩者看起來都能呼叫 message service | named import 來自 package module export；`this.$Message` 來自 plugin install 寫入 `app.config.globalProperties`，兩者是不同 API surface |
| 以為只要 source 有掛到 `globalProperties`，TypeScript 就一定知道 | 原始筆記同時提到 runtime source 和 `types/index.d.ts`，容易把兩者視為自動同步 | runtime surface 和 type surface 要分開確認；`src/index.js` 決定執行時是否存在，`types/index.d.ts` 決定 TypeScript 是否認得 |
| 以為 `.d.ts` 宣告完整代表 method contract 也完整 | `ComponentCustomProperties` 中列出了 `$Message`、`$Modal` 等屬性，看起來像完整型別契約 | 目前多數 service property 是 `any`，只能降低 property 不存在的型別錯誤，不能保證 `.info()`、`.confirm()` 等 method-level contract 精準 |
| 以為本章要深入分析 `$Modal.confirm()` 的所有行為 | 原始筆記列出 `$Modal`，也提到 overlay、DOM、destroy 等方向，容易把 plugin 暴露入口和 service 內部流程混在一起 | 本章只說明 `$Modal` 如何被暴露成 instance-level API；confirm callback、DOM render、destroy lifecycle 應放到 imperative API 或 overlay system 筆記 |
| 以為 `$VIEWUI`、`$Message`、`$Date` 都是同一類 API | 它們都被掛在 `globalProperties` 上，形式上都能寫成 `this.$...` | `$VIEWUI` 是全域設定物件，`$Message` / `$Modal` 是命令式 service，`$Date` 是工具 helper；同樣掛載位置不代表同樣角色 |
| 以為所有 helper 都應該掛到 `globalProperties` | 原始筆記提到 `$Date` 被掛上去，容易推論其他工具也適合這樣設計 | `$Date` 是 View UI Plus 的 API 設計選擇，不代表所有 utility 都應進入 component instance surface |
| 以為 Composition API 的 `setup()` 裡也能直接用 `this.$Message` | Options API 中 `this.$Message` 很自然，容易延伸到所有 component 寫法 | `setup()` 沒有 Options API 的 `this` 語境；Composition API 通常應使用 named import，或另外封裝 composable |

---

## 9. 本章總結

本章的核心是理解 View UI Plus plugin install 如何建立 instance-level API surface。

在 Vue 3 中，`app.config.globalProperties` 提供了一個讓 plugin 擴充 component instance 的入口。View UI Plus 利用這個入口，把 `$VIEWUI`、`$Message`、`$Modal`、`$Notice`、`$Date` 等屬性掛到 component instance 上。這使得 Options API component 可以透過 `this.$...` 直接使用全域設定、命令式 UI service 或工具 helper。

不過，這裡要清楚區分三個層次：

第一，runtime surface。也就是 `src/index.js` 在 install 時實際寫入了哪些 `globalProperties`。這決定程式執行時 `this.$Message` 是否真的存在。

第二，module export surface。也就是 `import { Message } from 'view-ui-plus'` 這類 named import 能不能使用。這取決於 package 的 export 設計，和 `globalProperties` 是不同入口。

第三，type surface。也就是 `types/index.d.ts` 是否透過 `ComponentCustomProperties` 告訴 TypeScript component instance 上有哪些 `$...` 屬性。多數 service 型別是 `any`，因此目前只能保證 property 存在，不能保證 method-level contract 精準。

因此，閱讀這類 plugin system 原始碼時，不應只背 `$Message`、`$Modal` 的清單，而應建立完整心智模型：plugin install 負責把元件庫能力接到 Vue app 上，而 `globalProperties` 是它建立 instance-level API 的其中一個關鍵機制。

---

## 10. 自我檢查問題

1. `app.config.globalProperties` 在 Vue 3 plugin system 中扮演什麼角色？
2. 為什麼 View UI Plus 會把 `$Message`、`$Modal` 這類 service 掛到 `globalProperties`？
3. `$VIEWUI` 和 `$Message` 的角色有什麼不同？
4. `import { Message } from 'view-ui-plus'` 和 `this.$Message` 的來源差異是什麼？
5. 為什麼說 named export surface 和 instance property surface 是兩種不同 API surface？
6. `types/index.d.ts` 中擴充 `ComponentCustomProperties` 的目的主要是什麼？
7. 如果 `$Message` 的型別是 `any`，這對 TypeScript 使用者代表什麼限制？
8. 為什麼本篇不深入分析 `$Modal.confirm()` 的 DOM 建立與 destroy 行為？
9. 如果 runtime 有掛 `$Message`，但 type declaration 沒有宣告，可能會發生什麼問題？
10. 如果你要繼續追 `$Notice.open()` 的內部實作，應該把筆記放到 `04-plugin-system/`、`10-imperative-api/` 還是 `08-overlay-system/`？為什麼？

---

## 11. 後續延伸方向

本篇之後可以延伸成以下主題筆記：

1. **`04-plugin-system/07-runtime-type-contract.md`**  
   分析 runtime surface 與 type surface 如何保持一致，並整理 View UI Plus 在 `.d.ts` 中的宣告策略。

2. **`10-imperative-api/message-service.md`**  
   深入分析 `$Message` / `Message` 的 method contract，例如 `info`、`success`、`warning`、`error` 等方法。

3. **`10-imperative-api/modal-service.md`**  
   深入分析 `$Modal.confirm()`、`$Modal.info()`、destroy 相關方法與使用場景。

4. **`08-overlay-system/overlay-lifecycle.md`**  
   分析 modal、notice、message 這類 overlay service 如何建立 DOM、掛載 vnode、管理 z-index 與銷毀。

5. **`04-plugin-system/named-exports-vs-instance-api.md`**  
   專門比較 View UI Plus 的 named exports、default plugin install 與 globalProperties instance API 的設計差異。

6. **`04-plugin-system/composition-api-usage-boundary.md`**  
   分析 Options API 的 `this.$...` 使用方式，和 Composition API 中使用 named import 或 composable 封裝的差異。

---

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `10-imperative-api/`
- `08-overlay-system/`
