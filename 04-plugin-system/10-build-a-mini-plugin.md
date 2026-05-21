# 10. Build a Mini View UI Plus Plugin：用迷你 Plugin 重建 View UI Plus 安裝模型

## 1. 本章定位

本章的目標不是重寫一套完整的 UI library，而是透過一個縮小版的 `MiniViewUI`，理解 View UI Plus 在 plugin 安裝層面的核心設計。

在 View UI Plus 的原始碼中，`src/index.js` 扮演的是 plugin entry 的角色。它會把 components、directives、locale、service API、全局配置與版本資訊組合起來，最後透過 `install(app, opts)` 寫入 Vue app。對使用者來說，最常見的入口是：

```js
app.use(ViewUIPlus, options);
```

這一行看起來很簡單，但背後其實會完成幾件重要事情：

1. 把元件註冊成全局元件。
2. 把指令註冊成全局指令。
3. 把全局設定整理到 `$VIEWUI`。
4. 把命令式服務 API 掛到 `app.config.globalProperties`。
5. 讓 TypeScript 知道這些 instance properties 存在。

本章會用迷你 plugin 重建這些核心動作，幫助你建立 plugin system 的底層模型。

本章不深入討論：

- 元件本身的 props、events、slots 設計。
- `$Message` 內部如何建立 DOM、管理 queue、銷毀 instance。
- CSS、theme token、打包產物與 ESM / UMD 輸出。
- locale merge 與 vue-i18n adapter 的完整實作。

這些主題會放到其他目錄或後續筆記中處理。

---

## 2. 學習前先建立的基本觀念

### 2.1 Vue plugin 是什麼

在 Vue 3 中，plugin 可以理解成「一個可以被 `app.use()` 安裝到 Vue app 的模組」。它的主要用途不是渲染畫面，而是把某些能力一次性加入 app，例如：

- 註冊全局元件。
- 註冊全局指令。
- 註冊全局設定。
- 掛載全局 instance property。
- 安裝 router、store、i18n、UI library 等基礎設施。

對 UI library 來說，plugin system 通常是整個套件對外暴露能力的總入口。使用者只要呼叫一次：

```js
app.use(MiniViewUI, options);
```

就能在整個 app 中使用這個 library 提供的元件、指令與服務 API。

### 2.2 `install(app, options)` 是 plugin 的核心介面

Vue plugin 最重要的約定是 `install(app, options)`。其中：

| 參數 | 說明 |
| --- | --- |
| `app` | Vue app instance，也就是 `createApp(App)` 建立出來的物件 |
| `options` | 使用者呼叫 `app.use(plugin, options)` 時傳入的設定 |

plugin 的核心工作就是利用 `app` 提供的方法改動 Vue app 的 public surface。例如：

```js
app.component('MiniButton', MiniButton);
app.directive('focus', focus);
app.config.globalProperties.$Message = Message;
```

換句話說，`install()` 是 plugin 把「套件內部能力」轉成「使用者可用能力」的橋樑。

### 2.3 什麼是 public surface

本篇反覆出現的 `surface`，可以理解為「使用者能碰到、能使用、能依賴的對外介面」。在 plugin system 中，常見的 public surface 有三種：

| Public surface | 使用方式 | 建立位置 |
| --- | --- | --- |
| 全局元件 | `<MiniButton />` | `app.component()` |
| 全局指令 | `v-focus` | `app.directive()` |
| instance properties | `this.$Message`、`this.$VIEWUI` | `app.config.globalProperties` |

對 View UI Plus 這類 UI library 來說，plugin system 的核心價值就是把一堆內部模組收斂成這些 public surface。

### 2.4 runtime surface 與 type surface

如果只從 JavaScript runtime 角度看，plugin 只要把 `$Message` 掛到 `app.config.globalProperties`，使用者就可以在 Options API 中呼叫：

```js
this.$Message.info('Ready');
```

但是在 TypeScript 專案中，只有 runtime 掛上去還不夠。TypeScript 編譯器並不會自動知道 `this.$Message` 存在，因此需要在 declaration file 中透過 module augmentation 補充型別：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Message: {
            info(content: string): void;
            error(content: string): void;
        };
    }
}
```

這就是 runtime surface 與 type surface 的同步問題。本篇的迷你 plugin 會刻意保留這個設計，因為這是閱讀 View UI Plus `types/index.d.ts` 時非常重要的觀念。

---

## 3. 整體概覽

本章迷你 plugin 的目錄可以設計成以下結構：

```txt
mini-view-ui/
  components.js
  directives.js
  message.js
  index.js
  index.d.ts
```

每個檔案都有明確責任：

| 檔案 | 角色 | 對應 View UI Plus 觀念 |
| --- | --- | --- |
| `components.js` | 定義迷你元件，模擬 UI library 的 component exports | `src/components/index.js` |
| `directives.js` | 定義迷你指令，模擬 plugin 統一註冊 directives | `src/directives/*` 與 `src/index.js` 中的 directives map |
| `message.js` | 定義命令式服務 API，模擬 `$Message` | `components.Message` 與 imperative API |
| `index.js` | plugin entry，負責組合 map、定義 `install()`、輸出 default API | `src/index.js` |
| `index.d.ts` | TypeScript declaration，描述 options 與 global properties | `types/index.d.ts` |

整體流程可以用下面這張文字圖理解：

```txt
User code
  app.use(MiniViewUI, options)
        |
        v
Vue plugin protocol
  MiniViewUI.install(app, options)
        |
        v
Mini plugin install(app, opts)
  1. 防止重複安裝
  2. 註冊全局 components
  3. 註冊全局 directives
  4. 整理 options 並寫入 $VIEWUI
  5. 掛載 service API 到 $Message
        |
        v
User-facing public surface
  <MiniButton />
  <MiniCard />
  v-focus
  this.$VIEWUI
  this.$Message
```

這個流程對應 View UI Plus 的主線可以簡化成：

```txt
package runtime modules
  -> plugin entry
  -> install orchestration
  -> Vue app public surface
  -> TypeScript public contract
```

---

## 4. 核心內容逐步講解

### 4.1 先定義目標行為：使用者安裝後應該得到什麼

在實作 plugin 之前，應該先定義「使用者安裝後要能做什麼」。這比一開始就寫 `install()` 更重要，因為 plugin system 的本質是設計 public surface。

迷你 plugin 的使用方式如下：

```js
import { createApp } from 'vue';
import MiniViewUI from './mini-view-ui';

const app = createApp(App);

app.use(MiniViewUI, {
    size: 'large',
    transfer: true,
    message: {
        duration: 3
    }
});

app.mount('#app');
```

這段程式碼表達幾個目標：

1. `MiniViewUI` 必須是一個可以傳給 `app.use()` 的 plugin。
2. `MiniViewUI` 必須提供 `install(app, options)`。
3. 使用者可以透過第二個參數傳入全局設定。
4. 安裝完成後，這些設定應該被整理成全局 runtime config。

安裝後，使用者希望能在元件中這樣使用：

```vue
<template>
    <MiniButton v-focus>Save</MiniButton>
</template>

<script>
export default {
    mounted() {
        this.$Message.info('Ready');
        console.log(this.$VIEWUI.size);
    }
};
</script>
```

這段使用方式反推 plugin 至少要建立四種能力：

| 使用者寫法 | 背後需要的 plugin 動作 |
| --- | --- |
| `<MiniButton />` | `install()` 中呼叫 `app.component('MiniButton', MiniButton)` |
| `v-focus` | `install()` 中呼叫 `app.directive('focus', focus)` |
| `this.$Message.info()` | 把 `Message` 掛到 `app.config.globalProperties.$Message` |
| `this.$VIEWUI.size` | 把整理後的 options 掛到 `app.config.globalProperties.$VIEWUI` |

因此，本章的實作不是任意堆功能，而是從使用者 API 反推 plugin 需要做的事。

---

### 4.2 建立 component map：把元件收斂成可註冊資料

迷你 plugin 先用兩個簡單元件模擬 UI library 中的大量 components：

```js
// mini-view-ui/components.js
export const MiniButton = {
    name: 'MiniButton',
    props: {
        type: {
            type: String,
            default: 'default'
        }
    },
    template: `<button class="mini-button"><slot /></button>`
};

export const MiniCard = {
    name: 'MiniCard',
    template: `<section class="mini-card"><slot /></section>`
};
```

這裡的重點不是 `MiniButton` 或 `MiniCard` 實際上怎麼渲染，而是它們如何被 plugin entry 收集起來。

在 UI library 中，元件通常不會一個一個手動註冊：

```js
app.component('MiniButton', MiniButton);
app.component('MiniCard', MiniCard);
```

這種寫法在元件數量少時可以接受，但在大型 UI library 中會變得難以維護。因此更常見的做法是先建立 component map：

```js
const components = {
    MiniButton,
    MiniCard
};
```

接著在 `install()` 中用迴圈註冊：

```js
Object.keys(components).forEach((key) => {
    app.component(key, components[key]);
});
```

這樣設計有幾個好處：

1. 元件清單集中在同一個資料結構中。
2. 新增元件時只要加入 map，就能被統一註冊。
3. `install()` 不需要知道每個元件的細節，只負責註冊流程。
4. 可以進一步支援 alias，例如 `Button` 與 `iButton` 同時註冊。

對照 View UI Plus 時，這正是 `src/index.js` 中 `ViewUI` map 的意義。`ViewUI` 不是單純變數，而是「準備被全局註冊的 component registry」。

---

### 4.3 建立 directive map：把指令名稱變成 template 可用語法

接著建立一個最小 directive：

```js
// mini-view-ui/directives.js
export const focus = {
    mounted(el) {
        el.focus();
    }
};
```

這個 directive 的功能很簡單：元素掛載到 DOM 後自動 focus。真正重要的是它如何從 JavaScript 物件變成 template 中的 `v-focus`。

在 plugin entry 中，可以建立 directive map：

```js
const directives = {
    focus
};
```

然後在 `install()` 中註冊：

```js
Object.keys(directives).forEach((key) => {
    app.directive(key, directives[key]);
});
```

這裡的 `key` 就會成為 template 中 directive 名稱的一部分。

| directive map key | 註冊方式 | template 使用方式 |
| --- | --- | --- |
| `focus` | `app.directive('focus', focus)` | `v-focus` |
| `loading` | `app.directive('loading', loading)` | `v-loading` |
| `'line-clamp'` | `app.directive('line-clamp', lineClamp)` | `v-line-clamp` |

因此，閱讀 View UI Plus 的 directives 時，要特別注意 `src/index.js` 裡建立的 directives map。map 的 key 不只是內部名稱，它會直接影響使用者在 template 中看到的 API 名稱。

---

### 4.4 建立 service API：理解 `$Message` 只是 plugin 掛載的 public surface

View UI Plus 中的 `$Message` 屬於命令式 API。使用者不是透過 template 使用它，而是在程式碼中呼叫：

```js
this.$Message.info('Ready');
```

迷你版可以先用 console 模擬：

```js
// mini-view-ui/message.js
export const Message = {
    info(content) {
        console.info(`[info] ${content}`);
    },
    error(content) {
        console.error(`[error] ${content}`);
    }
};
```

這裡要分清楚兩層責任：

| 層次 | 負責內容 |
| --- | --- |
| `Message` service 本身 | `info()`、`error()` 要做什麼，例如建立提示訊息、渲染 DOM、管理 queue |
| plugin system | 把 `Message` 掛到 `app.config.globalProperties.$Message`，讓使用者可以透過 `this.$Message` 使用 |

本章只討論第二層，也就是 plugin system 的掛載責任。至於真正的 `$Message` 如何建立 notice instance、如何控制 duration、如何銷毀，應該放到 `10-imperative-api/` 目錄深入研究。

---

### 4.5 實作 plugin entry：`index.js` 是安裝模型的總控點

迷你 plugin 的核心檔案是 `mini-view-ui/index.js`。這個檔案對應 View UI Plus 的 `src/index.js`，負責把所有模組組合起來。

```js
// mini-view-ui/index.js
import { MiniButton, MiniCard } from './components';
import { focus } from './directives';
import { Message } from './message';

const components = {
    MiniButton,
    MiniCard
};

const directives = {
    focus
};

const defaultOptions = {
    size: '',
    transfer: '',
    message: {
        duration: 2
    }
};

export const install = function install(app, opts = {}) {
    if (install.installed) return;
    install.installed = true;

    Object.keys(components).forEach((key) => {
        app.component(key, components[key]);
    });

    Object.keys(directives).forEach((key) => {
        app.directive(key, directives[key]);
    });

    app.config.globalProperties.$VIEWUI = {
        size: opts.size || defaultOptions.size,
        transfer: 'transfer' in opts ? opts.transfer : defaultOptions.transfer,
        message: {
            duration: opts.message && opts.message.duration
                ? opts.message.duration
                : defaultOptions.message.duration
        }
    };

    app.config.globalProperties.$Message = Message;
};

const API = {
    install,
    MiniButton,
    MiniCard,
    Message
};

export {
    MiniButton,
    MiniCard,
    Message
};

export default API;
```

這個檔案可以拆成五個區塊理解。

#### 4.5.1 匯入內部模組

```js
import { MiniButton, MiniCard } from './components';
import { focus } from './directives';
import { Message } from './message';
```

這些 import 代表 plugin entry 會收集各種內部能力：元件、指令、服務 API。此時它們都還只是普通 JavaScript module export，使用者尚未透過 Vue app 使用它們。

#### 4.5.2 建立 registry map

```js
const components = {
    MiniButton,
    MiniCard
};

const directives = {
    focus
};
```

`components` 與 `directives` 是註冊清單。它們的價值是把「多個待註冊項目」變成「可以被統一迭代的資料」。這是大型 UI library 常見的整理方式。

#### 4.5.3 準備預設 options

```js
const defaultOptions = {
    size: '',
    transfer: '',
    message: {
        duration: 2
    }
};
```

`defaultOptions` 的用途是定義使用者沒有傳入設定時的預設值。這裡可以看到三種設定：

| option | 用途 |
| --- | --- |
| `size` | 模擬全局尺寸設定 |
| `transfer` | 模擬是否將某些浮層轉移到 body 或其他容器的設定 |
| `message.duration` | 模擬 message 提示訊息的預設持續時間 |

這些設定最後會被整理進 `$VIEWUI`，讓元件或服務 API 在 runtime 可以讀取。

#### 4.5.4 定義 `install(app, opts)`

```js
export const install = function install(app, opts = {}) {
    if (install.installed) return;
    install.installed = true;

    // register components
    // register directives
    // write global config
    // write service API
};
```

`install()` 是整個 plugin 的核心。它不是單純初始化函式，而是「把 library 能力安裝到 Vue app」的 orchestrator。

這裡的 `install.installed` 是防止重複安裝的旗標。它的意圖是避免同一個 plugin 被重複註冊，造成 component、directive 或 global property 重複寫入。

需要注意的是，這種旗標是掛在 `install` 函式本身上，因此它的作用範圍是 plugin module 層級，而不是單一 component 層級。若實務上存在多個 Vue app instance 共用同一個 plugin module，這種寫法是否符合需求，需要依實際場景評估。這點可以放到後續 `runtime-type-contract` 或 maintenance checklist 中延伸檢查。

#### 4.5.5 組合 default export 與 named exports

```js
const API = {
    install,
    MiniButton,
    MiniCard,
    Message
};

export {
    MiniButton,
    MiniCard,
    Message
};

export default API;
```

這段同時支援兩種使用模式：

| 使用模式 | 使用方式 | 目的 |
| --- | --- | --- |
| plugin 全量安裝 | `app.use(MiniViewUI)` | 一次註冊全部 global components、directives、globalProperties |
| named import | `import { MiniButton } from './mini-view-ui'` | 讓使用者可以單獨引用某些能力 |

這也是 View UI Plus `src/index.js` 中同時存在 default plugin export 與 named exports 的原因。default export 服務的是 `app.use()`，named exports 服務的是按需引用或更細粒度的使用方式。

---

### 4.6 拆解 `install()` 的完整安裝順序

`install()` 的安裝順序可以整理成以下流程：

```txt
install(app, opts = {})
  |
  |-- 1. if (install.installed) return
  |-- 2. install.installed = true
  |
  |-- 3. Object.keys(components).forEach(key => {
  |       app.component(key, components[key])
  |   })
  |
  |-- 4. Object.keys(directives).forEach(key => {
  |       app.directive(key, directives[key])
  |   })
  |
  |-- 5. app.config.globalProperties.$VIEWUI = normalized options
  |
  |-- 6. app.config.globalProperties.$Message = Message
```

從閱讀原始碼的角度，這個順序反映出 View UI Plus plugin system 的基本策略：

1. 先處理安裝防護。
2. 再把宣告式 template 會用到的東西註冊起來，例如 components 與 directives。
3. 接著寫入全局設定，讓 runtime 可以讀取使用者傳入的 options。
4. 最後掛載命令式 API，讓 Options API component instance 可以透過 `this.$Message` 使用。

這個順序不是唯一可能的設計，但它很適合用來理解 UI library plugin 的基本職責分工。

---

### 4.7 `$VIEWUI`：install options 的 runtime container

使用者安裝 plugin 時會傳入 options：

```js
app.use(MiniViewUI, {
    size: 'large',
    transfer: true,
    message: {
        duration: 3
    }
});
```

這些 options 不會自動出現在元件中，plugin 必須決定要如何保存它們。迷你 plugin 的做法是整理後放到 `$VIEWUI`：

```js
app.config.globalProperties.$VIEWUI = {
    size: opts.size || defaultOptions.size,
    transfer: 'transfer' in opts ? opts.transfer : defaultOptions.transfer,
    message: {
        duration: opts.message && opts.message.duration
            ? opts.message.duration
            : defaultOptions.message.duration
    }
};
```

`$VIEWUI` 可以理解成「View UI Plus 全局設定在 runtime 的容器」。它不是 component prop，也不是一般 module variable，而是掛在 Vue app instance properties 上的 global config object。

這樣設計的好處是：

1. 全局設定有固定位置可以讀取。
2. 元件內部可以透過 instance property 取得設定。
3. 使用者只需要在 `app.use()` 傳入一次 options。
4. plugin 可以在寫入前統一做 default value normalization。

不過這裡也有一個值得注意的實作細節：

```js
duration: opts.message && opts.message.duration
    ? opts.message.duration
    : defaultOptions.message.duration
```

這種寫法會把 falsy value 視為沒有設定。例如，如果使用者傳入 `duration: 0`，它會被判斷為 false，最後回退到預設值 `2`。這不一定是錯，但需要看 API 設計是否允許 `0` 代表特殊意義，例如不自動關閉。

如果要更精準保留 `0`，可以改成檢查 property 是否存在：

```js
const hasMessageDuration =
    opts.message && Object.prototype.hasOwnProperty.call(opts.message, 'duration');

const duration = hasMessageDuration
    ? opts.message.duration
    : defaultOptions.message.duration;
```

這屬於 options normalization 的細節，可以在後續 `04-global-options-and-viewui-config.md` 中延伸。

---

### 4.8 `$Message`：命令式服務 API 的掛載點

迷你 plugin 把 `Message` 掛到：

```js
app.config.globalProperties.$Message = Message;
```

掛上去之後，Options API component instance 就能使用：

```js
this.$Message.info('Ready');
```

這裡要注意兩件事。

第一，`$Message` 不是透過 `app.component()` 註冊的元件，所以它不能寫成：

```vue
<$Message />
```

第二，`$Message` 不是 directive，所以也不能寫成：

```vue
<div v-message></div>
```

它是一個掛在 component instance 上的 service object。這種設計適合處理通知、彈窗、loading、confirm 等命令式互動。

在 View UI Plus 中，類似的 globalProperties 還可能包含：

| Instance property | 類型 | 使用方式 |
| --- | --- | --- |
| `$Message` | service API | `this.$Message.info(...)` |
| `$Notice` | service API | `this.$Notice.open(...)` |
| `$Modal` | service API | `this.$Modal.confirm(...)` |
| `$Loading` | service API | `this.$Loading.start()` |
| `$Date` | helper | `this.$Date(...)` |

本章只用 `$Message` 做最小模擬，是為了聚焦 plugin system 的掛載模型，而不是深入每個 service 的內部行為。

---

### 4.9 Type surface：讓 TypeScript 知道 runtime 掛了什麼

迷你 plugin 如果要支援 TypeScript，需要提供 declaration file：

```ts
// mini-view-ui/index.d.ts
import type { App } from 'vue';

interface MiniViewUIOptions {
    size?: string;
    transfer?: boolean | string;
    message?: {
        duration?: number;
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: MiniViewUIOptions;
        $Message: {
            info(content: string): void;
            error(content: string): void;
        };
    }
}

export const install: (app: App, options?: MiniViewUIOptions) => void;
```

這裡有兩個重點。

第一，`MiniViewUIOptions` 描述的是使用者傳入 `app.use(MiniViewUI, options)` 的 options shape：

```ts
interface MiniViewUIOptions {
    size?: string;
    transfer?: boolean | string;
    message?: {
        duration?: number;
    };
}
```

第二，`ComponentCustomProperties` 描述的是 component instance 上可以用的屬性：

```ts
interface ComponentCustomProperties {
    $VIEWUI: MiniViewUIOptions;
    $Message: {
        info(content: string): void;
        error(content: string): void;
    };
}
```

也就是說，runtime 有這段：

```js
app.config.globalProperties.$Message = Message;
```

type surface 就要有這段：

```ts
$Message: {
    info(content: string): void;
    error(content: string): void;
};
```

如果 runtime 與 type surface 不同步，就會出現以下問題：

| 狀況 | 結果 |
| --- | --- |
| runtime 有 `$Message`，types 沒宣告 | 執行時可用，但 TypeScript 報錯 |
| runtime 沒 `$Message`，types 有宣告 | TypeScript 不報錯，但執行時可能出錯 |
| runtime API 與 types 方法簽名不同 | 使用者依型別寫出的程式碼可能在執行時不符合實際行為 |
| `$VIEWUI` options 型別與實際 normalization 不一致 | 使用者可能誤解可傳入設定或讀取結果 |

這就是閱讀 View UI Plus plugin system 時，不能只看 `src/index.js`，也要回頭檢查 `types/index.d.ts` 的原因。

---

## 5. 表格整理

### 5.1 迷你 plugin 與 View UI Plus 對照表

| Design | Mini plugin | View UI Plus | 閱讀重點 |
| --- | --- | --- | --- |
| default plugin export | `export default API` | `export default API` | 提供 `app.use(...)` 的主要入口 |
| install entry | `install(app, opts)` | `install(app, opts = {})` | Vue plugin protocol 的核心函式 |
| component map | `components` | `ViewUI` | 把元件收斂成可迭代註冊清單 |
| directive map | `directives` | `directives` | key 會影響 template 中的 `v-*` 名稱 |
| global config | `$VIEWUI` | `$VIEWUI` | 保存 install options normalization 後的 runtime config |
| service API | `$Message` | `$Message`、`$Modal`、`$Notice` 等 | 命令式 API 的 instance public surface |
| helper API | 此迷你版未實作 | `$Date = dayjs` | helper 也可透過 `globalProperties` 暴露 |
| named exports | `export { MiniButton }` | `export * from './components'` | 支援按需 import 或細粒度引用 |
| type declaration | `index.d.ts` | `types/index.d.ts` | 描述 options 與 component instance properties |

這張表的閱讀方式是：先不要急著看每個元件內部，而是先看 plugin entry 如何把各模組收斂成 Vue app 的 public surface。當你能用這張表對照原始碼時，就能比較穩定地閱讀 View UI Plus 的 `src/index.js`。

---

### 5.2 `install()` 流程表

| 步驟 | 發生位置 | 主要動作 | 輸入 | 輸出 | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| 1 | `install(app, opts)` 開頭 | 檢查是否已安裝 | `install.installed` | 若已安裝則 return | 需要確認此防護是否符合多 app instance 場景 |
| 2 | `install(app, opts)` | 註冊全局元件 | `components` map | `<MiniButton />`、`<MiniCard />` 可用 | map key 就是全局 component name |
| 3 | `install(app, opts)` | 註冊全局指令 | `directives` map | `v-focus` 可用 | directive key 會轉成 `v-*` 名稱 |
| 4 | `install(app, opts)` | 整理 options | `opts`、`defaultOptions` | `$VIEWUI` | 注意 falsy value 的處理方式 |
| 5 | `install(app, opts)` | 掛載 service API | `Message` | `this.$Message` 可用 | 這只是掛載，不代表實作 message 內部邏輯 |
| 6 | `index.d.ts` | 補型別宣告 | runtime public surface | TS 知道 `$VIEWUI`、`$Message` | runtime 與 types 必須同步維護 |

---

### 5.3 Public surface 分類表

| Surface | 建立方式 | 使用者寫法 | 適合承載什麼能力 |
| --- | --- | --- | --- |
| Global component | `app.component(name, component)` | `<MiniButton />` | 可在 template 宣告式使用的 UI 元件 |
| Global directive | `app.directive(name, directive)` | `v-focus` | 直接操作 DOM 或增強元素行為的功能 |
| Global config | `app.config.globalProperties.$VIEWUI = config` | `this.$VIEWUI` | install options 整理後的 runtime 設定 |
| Service API | `app.config.globalProperties.$Message = Message` | `this.$Message.info(...)` | 通知、彈窗、loading、confirm 等命令式能力 |
| Type contract | `declare module '@vue/runtime-core'` | TypeScript 型別提示 | 讓 TS 理解 runtime 已暴露的 instance properties |

---

## 6. 範例或情境說明

### 6.1 從使用者呼叫一路追到 Vue app 被改動

假設使用者寫下：

```js
app.use(MiniViewUI, {
    size: 'large',
    transfer: true,
    message: {
        duration: 3
    }
});
```

實際上可以拆成以下流程理解：

```txt
app.use(MiniViewUI, options)
  |
  v
Vue 呼叫 MiniViewUI.install(app, options)
  |
  v
install() 開始改動 app
  |
  |-- app.component('MiniButton', MiniButton)
  |-- app.component('MiniCard', MiniCard)
  |-- app.directive('focus', focus)
  |-- app.config.globalProperties.$VIEWUI = normalized options
  |-- app.config.globalProperties.$Message = Message
  |
  v
component instance 可以使用
  <MiniButton />
  v-focus
  this.$VIEWUI
  this.$Message
```

這條流程可以幫你閱讀 View UI Plus 時避免迷路。你看到 `src/index.js` 中大量 import、map、export、install 時，可以先問自己：

> 這段程式碼最後是要建立哪一種 public surface？

如果是 component，就追 `app.component()`；如果是 directive，就追 `app.directive()`；如果是 `$Message`、`$Modal`、`$VIEWUI`，就追 `app.config.globalProperties`；如果是 TypeScript 使用體驗，就追 `types/index.d.ts`。

---

### 6.2 新增一個 `MiniInput` 的流程

如果要新增一個 `MiniInput`，可以照以下步驟：

第一步，在 `components.js` 新增元件：

```js
export const MiniInput = {
    name: 'MiniInput',
    props: {
        modelValue: String
    },
    emits: ['update:modelValue'],
    template: `
        <input
            class="mini-input"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
        />
    `
};
```

第二步，在 `index.js` 匯入並放入 component map：

```js
import { MiniButton, MiniCard, MiniInput } from './components';

const components = {
    MiniButton,
    MiniCard,
    MiniInput
};
```

第三步，確認 `install()` 的 component loop 不需要改：

```js
Object.keys(components).forEach((key) => {
    app.component(key, components[key]);
});
```

這個例子說明 component map 的價值：新增元件時，核心註冊流程可以保持封閉，不需要每新增一個元件就改一次 `install()` 的演算法。這也和開閉原則有關：註冊流程穩定，元件清單可擴充。

---

### 6.3 新增一個 `$Confirm` service 的流程

如果要新增 `$Confirm`，不能只在 runtime 加，也要同步型別。

第一步，新增 service：

```js
// mini-view-ui/confirm.js
export const Confirm = {
    open(content) {
        return window.confirm(content);
    }
};
```

第二步，在 `index.js` 掛載：

```js
import { Confirm } from './confirm';

app.config.globalProperties.$Confirm = Confirm;
```

第三步，在 `index.d.ts` 補上型別：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Confirm: {
            open(content: string): boolean;
        };
    }
}
```

這個例子刻意展示 runtime/type contract 的同步要求。只改 `index.js`，TypeScript 使用者會報錯；只改 `index.d.ts`，runtime 可能找不到 `$Confirm`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

如果你是第一次閱讀這類 plugin system，建議順序如下：

1. 先看使用者端 API：`app.use(MiniViewUI, options)`。
2. 接著看 `index.js` 的 default export，確認 `API` object 是否包含 `install`。
3. 再看 `install(app, opts)` 的整體流程，不要先陷入單個元件細節。
4. 接著看 `components` map 如何被 `app.component()` 註冊。
5. 再看 `directives` map 如何被 `app.directive()` 註冊。
6. 然後看 `$VIEWUI` 如何由 `opts` 與 `defaultOptions` 合併而來。
7. 最後看 `$Message` 如何掛到 `app.config.globalProperties`。

### 7.2 對照 View UI Plus 原始碼的閱讀路線

當你要回頭閱讀 View UI Plus，可以依照以下路線：

1. 讀 `src/index.js`，找出 `install(app, opts = {})`。
2. 讀 `import * as components from './components'`，理解 component 來源。
3. 讀 `ViewUI` map，觀察是否有 alias，例如 `iButton`、`iTable`。
4. 讀 directives map，理解哪些 key 會成為 `v-*` 指令。
5. 讀 `app.component` loop 與 `app.directive` loop。
6. 讀 `$VIEWUI` 寫入，整理 options 的資料流。
7. 讀 `$Message`、`$Modal`、`$Notice`、`$Loading` 等 globalProperties。
8. 讀 `types/index.d.ts`，確認 runtime surface 與 type surface 是否對齊。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過：

- 每個 component 的完整 props、events、slots。
- `$Message` 內部如何渲染 DOM。
- theme token 與樣式打包流程。
- build release 的 ESM / UMD 細節。
- locale 與 i18n adapter 的完整策略。

這些不是不重要，而是它們屬於不同目錄的深入主題。如果一開始全部混在一起看，會模糊本章最重要的主線：plugin install 如何建立 Vue app public surface。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `app.use()` 只是 import 套件 | 使用者端只看到一行 `app.use(...)` | `app.use()` 會觸發 plugin 的 `install()`，並改動 Vue app |
| 以為元件 export 後就自動能在 template 使用 | `export const MiniButton` 看起來像已經對外提供 | 要能寫 `<MiniButton />`，還需要 `app.component()` 全局註冊，或在局部 components 中註冊 |
| 以為 directive 的變數名稱和 `v-*` 一定完全一樣 | directive 可能先被 import 成變數，再放入 map | template 名稱取決於 `app.directive(name, directive)` 的 `name` |
| 以為 `$VIEWUI` 是 prop | 它看起來像元件可以讀取的設定 | `$VIEWUI` 是掛在 `globalProperties` 上的 runtime global config，不是單一元件 prop |
| 以為 `$Message` 是 component | `$Message` 屬於 UI library，所以容易被當成元件 | `$Message` 是命令式 service API，透過 `this.$Message.info()` 使用 |
| 以為 TypeScript 會自動知道 `globalProperties` | runtime 已經掛了 `$Message`，看起來應該可用 | TypeScript 需要透過 `ComponentCustomProperties` 額外宣告 |
| 只改 runtime，不改 types | JavaScript 執行可用時容易忽略型別 | 對 library 來說，runtime surface 與 type surface 都是 public contract |
| 一開始就深入 `$Message` 內部 | `$Message` 是最容易吸引注意的功能 | 在 plugin system 筆記中，先理解「掛載點」，內部實作應放到 imperative API 筆記 |

---

## 9. 本章總結

本章用一個迷你版 `MiniViewUI` 重建了 View UI Plus plugin system 的核心安裝模型。這個模型的重點不是元件本身多複雜，而是 plugin 如何把不同類型的內部模組轉成 Vue app 可使用的 public surface。

從使用者角度來看，只需要寫：

```js
app.use(MiniViewUI, options);
```

但從 plugin 內部來看，這會觸發 `install(app, opts)`，並依序完成全局元件註冊、全局指令註冊、全局設定注入，以及 service API 掛載。這些動作共同構成 UI library 的安裝流程。

`components` map 與 `directives` map 的價值在於，它們把多個待註冊項目整理成可迭代資料，讓 `install()` 可以用穩定流程統一註冊。`$VIEWUI` 的價值在於，它把使用者傳入的 options 整理成 runtime 可讀的 global config。`$Message` 的價值在於，它展示了命令式 API 如何透過 `app.config.globalProperties` 暴露給 component instance。

最後，TypeScript declaration 不是附屬品，而是 plugin public contract 的一部分。只要 runtime 掛上 `$VIEWUI`、`$Message` 或其他 instance properties，就應該同步檢查 `types/index.d.ts` 是否有對應宣告。對 View UI Plus 這類 UI library 來說，runtime surface 和 type surface 必須一起閱讀、一起維護。

用一句話總結本章：

```txt
Mini plugin = 用最小實作重建 View UI Plus install orchestration，理解 library 能力如何被安裝到 Vue app public surface。
```

---

## 10. 自我檢查問題

1. 為什麼 Vue plugin 需要 `install(app, options)`？它和一般函式有什麼不同？
2. `app.use(MiniViewUI, options)` 背後會如何觸發 `install()`？
3. 為什麼要把 `MiniButton`、`MiniCard` 先整理成 `components` map，而不是直接一個一個寫死在 `install()` 裡？
4. directive map 的 key 和 template 中的 `v-focus`、`v-line-clamp` 有什麼關係？
5. `$VIEWUI` 是什麼？它和 component prop、一般 module variable 有什麼不同？
6. 為什麼 `$Message` 適合掛在 `app.config.globalProperties`，而不是註冊成 component？
7. `install.installed` 的用途是什麼？這種寫法在多 app instance 場景下可能需要注意什麼？
8. 如果 runtime 掛了 `$Confirm`，但 `index.d.ts` 沒有宣告，TypeScript 使用者會遇到什麼問題？
9. 如果 `index.d.ts` 宣告了 `$Confirm`，但 runtime 沒有掛載，會發生什麼風險？
10. 閱讀 View UI Plus `src/index.js` 時，如何判斷某段程式碼是在建立 component surface、directive surface，還是 instance property surface？

---

## 11. 後續延伸方向

這份筆記可以延伸成以下主題：

| 延伸主題 | 建議檔案 | 說明 |
| --- | --- | --- |
| View UI Plus 安裝主流程 | `04-plugin-system/01-install-flow.md` | 完整追蹤 `app.use(ViewUIPlus, options)` 到 `install()` 的流程 |
| 全局元件註冊 | `04-plugin-system/02-component-registration.md` | 深入 `ViewUI` map、component alias、`app.component()` loop |
| 全局指令註冊 | `04-plugin-system/03-directive-registration.md` | 深入 directives map 與 `v-*` 名稱對應 |
| 全局設定與 `$VIEWUI` | `04-plugin-system/04-global-options-and-viewui-config.md` | 分析 options normalization、預設值與設定讀取方式 |
| `globalProperties` | `04-plugin-system/05-global-properties.md` | 整理 `$Message`、`$Modal`、`$Notice`、`$Date` 等 instance properties |
| runtime/type contract | `04-plugin-system/07-runtime-type-contract.md` | 對照 `src/index.js` 與 `types/index.d.ts` |
| 命令式 API | `10-imperative-api/` | 深入 `$Message`、`$Modal`、`$Notice` 的 DOM rendering 與 queue |
| 樣式系統 | `12-style-system/` | 補齊 CSS、theme token、樣式打包 |
| 建置與發布 | `14-build-release/` | 分析 ESM、UMD、types、package exports |

---

## 12. 練習任務

以下練習可以用來確認你是否真正理解 plugin system。

| 題目 | 任務 | 要驗證的觀念 |
| --- | --- | --- |
| 題目 1 | 新增 `MiniInput`，並讓 `<MiniInput />` 可用 | component map 和 `app.component` loop |
| 題目 2 | 新增 `v-loading` directive | directive map 和 registration name |
| 題目 3 | 新增 `$Confirm` service | `globalProperties` 和 type declaration 同步 |
| 題目 4 | 新增 `button.rounded` option | install options 到 `$VIEWUI` 的資料流 |
| 題目 5 | 刪除 `$Message` type declaration 但保留 runtime | runtime/type contract mismatch |
| 題目 6 | 在 `$VIEWUI.message.duration` 支援 `0` | options normalization 與 falsy value 處理 |
| 題目 7 | 新增 `MiniButton` 的 alias `MButton` | component alias 與全局註冊名稱 |

作答時不要只貼程式碼，請同時說明：

1. 你改了哪個檔案。
2. 這個改動影響哪一種 public surface。
3. 是否需要同步修改 type declaration。
4. 是否會影響 View UI Plus 對應筆記中的哪一個主題。
