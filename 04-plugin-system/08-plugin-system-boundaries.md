# View UI Plus Plugin System Boundaries：插件系統閱讀邊界與章節分工

## 1. 本章定位

本章是 `04-plugin-system/` 的**邊界整理筆記**，也可以視為整個插件系統章節的收束與索引。

`04-plugin-system/` 主要研究的是 View UI Plus 在 Vue 3 應用中被 `app.use(ViewUIPlus, options)` 安裝時，plugin layer 如何完成整體 runtime orchestration。這裡的 runtime orchestration 指的是：誰負責接收 install options、誰負責註冊元件與指令、誰負責注入全域設定、誰負責掛載 instance-level API，以及這些 runtime 行為如何對應到 TypeScript declaration。

本章要解決的問題是：

- 哪些內容應該放在 `04-plugin-system/`。
- 哪些內容雖然會從 plugin 入口被接觸到，但不應該在 plugin 章節深入展開。
- 讀 `src/index.js` 時應該讀到哪裡為止。
- 後續如果 View UI Plus plugin runtime surface 變更，應該同步更新哪些筆記。

本章不負責深入分析單一 component 的 props、events、slots，也不負責分析 `$Message`、`$Modal`、`$Notice` 等 service 的內部 DOM 建立、queue、z-index 或 destroy 行為。這些主題雖然可能透過 plugin 暴露給使用者，但它們的真正實作責任不在 plugin layer，而應分流到 component、imperative API、overlay system、directive、style、type 或 build 相關章節。

讀完本章後，你應該能夠建立一個明確判斷：

> 只要一個內容是在說「View UI Plus 如何被安裝到 Vue app，並在安裝時暴露哪些全域能力」，它通常屬於 `04-plugin-system/`；但如果內容開始深入某個元件、服務、指令或建置產物的內部行為，就應該分流到其他章節。

---

## 2. 學習前先建立的基本觀念

### 2.1 Plugin system 是組裝層，不是所有功能的實作層

在 Vue 3 中，plugin 的典型入口是：

```js
app.use(ViewUIPlus, options);
```

對 View UI Plus 這類 component library 來說，plugin layer 的主要工作不是實作每個 component，而是把整個套件安裝到 Vue app 裡。它會負責：

- 接收使用者傳入的 options。
- 呼叫 `install(app, opts)`。
- 註冊 component。
- 註冊 directive。
- 注入全域設定。
- 掛載 instance-level API。
- 建立 locale / i18n 的 install-time contract。
- 暴露 package-level public surface，例如 `version`、`locale`、`i18n`、`lang` 等。

因此，`04-plugin-system/` 應該把焦點放在「安裝與暴露」上，而不是「每個功能如何被實作」。

例如 `$Message` 同時可以從很多角度理解：

| 觀察角度 | 應放章節 | 原因 |
| --- | --- | --- |
| `$Message` 被寫入 `app.config.globalProperties` | `04-plugin-system/05-global-properties.md` | 這是 plugin install 暴露 instance API 的行為 |
| `$Message.info()` 如何建立 message DOM | `10-imperative-api/` 或 `08-overlay-system/` | 這是 service 內部行為，不是 plugin 安裝流程 |
| `$Message` 的 TypeScript 型別是否精確 | `04-plugin-system/07-runtime-type-contract.md` 或 `06-type-system/` | plugin 層可以記 property 是否宣告；method-level 型別可分流到 type system |
| message 樣式 class 與 Less variable | `12-style-system/` | 這是樣式系統，不是 plugin orchestration |

這種切分方式能避免一份筆記過度膨脹，也能讓每個章節維持單一主題。

### 2.2 「擁有」不等於「唯一提到」

本章使用的「own」或「擁有」不是指其他章節完全不能提到這個概念，而是指該主題的**主要解釋責任**在哪裡。

例如 `directives` map 是 plugin system 擁有的主題，因為 plugin 決定哪些 directive 會被全域註冊。但 directive hook 的細節，例如 `mounted`、`updated` 中如何操作 DOM，則不屬於 plugin system，而是 `11-directives/` 的主題。

所以筆記分工可以理解成：

- `04-plugin-system/`：說明「directive 如何被 plugin 註冊」。
- `11-directives/`：說明「directive 被觸發後實際做了什麼」。

這樣就能同時保留關聯，又避免重複展開。

### 2.3 Source anchor 是閱讀起點，不一定是終點

source anchors 包含：

- `src/index.js`
- `src/components/index.js`
- `types/index.d.ts`
- `src/locale/index.js`
- `src/directives/*`

這些檔案不是要全部在 `04-plugin-system/` 裡完整分析，而是作為 plugin system 的閱讀錨點。尤其是 `src/index.js`，它是 plugin install、component map、directive map、globalProperties、locale exports 等內容的核心來源。

但當你從 `src/index.js` 往下追到 `src/locale/index.js` 或 `src/directives/*` 時，就要開始判斷：目前是在理解 plugin contract，還是已經進入 locale module / directive module 的內部實作？如果是後者，就應該只在本章留下入口與邊界，詳細內容移到其他章節。

---

## 3. 整體概覽

`04-plugin-system/` 可以理解成 View UI Plus public surface 的安裝層。它把 package 提供的 component、directive、config、service API、locale API 與型別宣告串在一起。

從宏觀角度看，可以用以下流程理解：

```txt
使用者
  |
  | app.use(ViewUIPlus, options)
  v
View UI Plus plugin entry
  |
  | install(app, opts)
  v
Plugin runtime orchestration
  |
  |-- 處理 locale / i18n options
  |-- 註冊 ViewUI component map
  |-- 註冊 directives map
  |-- 寫入 app.config.globalProperties.$VIEWUI
  |-- 寫入 app.config.globalProperties.$Message / $Modal / $Date 等
  |-- 暴露 version / locale / i18n / lang / default API
  v
Vue app runtime 可使用的全域能力
```

因此，`04-plugin-system/` 的核心不是某一個 component，而是 View UI Plus 如何把多個能力整合成一個可安裝的 Vue plugin。

如果要用一句話收束：

> `04-plugin-system/` 負責說明 View UI Plus 如何被安裝、如何註冊全域能力、如何接收設定、如何暴露 instance API 與 plugin-level public API，以及這些 runtime 行為如何對應到 TypeScript 型別宣告。

---

## 4. 核心內容逐步講解

### 4.1 `04-plugin-system/` 擁有的主題

`04-plugin-system/` 主要擁有的是 `src/index.js` 的 runtime orchestration。只要主題的核心問題是「plugin 安裝時做了什麼」，通常就應該放在這個章節。

| Owned topic | 為什麼屬於 plugin system | 閱讀重點 |
| --- | --- | --- |
| `app.use(ViewUIPlus, options)` | 這是 Vue plugin 的使用入口 | 理解使用者如何觸發 View UI Plus 的安裝流程 |
| `install(app, opts)` sequence | 這是 plugin 安裝流程的核心函式 | 觀察 install 內部執行順序，例如 locale、component、directive、globalProperties |
| `ViewUI` component map | plugin 決定哪些 component 會被全域註冊 | 觀察 component map 的 key/value 以及是否有 alias |
| `directives` map | plugin 決定哪些 directive 會被全域註冊 | 觀察 directive name 如何被掛到 Vue app |
| `$VIEWUI` config | install options 被轉成 Vue instance global config | 理解全域設定如何供 component runtime 使用 |
| `globalProperties` | plugin 暴露 instance-level service APIs | 理解 `this.$Message`、`this.$Modal`、`this.$Date` 等 API 來源 |
| locale install contract | `opts.locale`、`opts.i18n` 與 `locale` / `i18n` / `lang` runtime API 都在 plugin public surface 中 | 理解語系設定如何在 install-time 或 module-level 被設定 |
| runtime/type contract | `src/index.js` 與 `types/index.d.ts` 需要對齊 | 檢查 runtime surface 是否有對應的 TypeScript declaration |

這些主題共同構成一個完整問題：View UI Plus 是如何從一包 source code 變成可以被 Vue app 安裝與使用的 component library？

### 4.2 `04-plugin-system/` 不擁有的主題

有些主題雖然會從 plugin 入口被接觸到，但它們不應在 `04-plugin-system/` 中深入分析，否則 plugin 章節會和其他章節重複。

| Topic | Owning chapter | 為什麼不屬於 plugin system |
| --- | --- | --- |
| 單一 component props / events / slots | `07-components/` | plugin 只註冊 component，不分析 component 對外 API 細節 |
| overlay DOM、z-index、Teleport、Popper 行為 | `08-overlay-system/` | plugin 只暴露 service 或 component，不負責 overlay runtime 細節 |
| form validation 與 `Form` / `FormItem` coordination | `09-form-system/` | 這是表單系統內部協作，不是 install flow |
| `$Message`、`$Notice`、`$Modal.confirm` 的 service internals | `10-imperative-api/` | plugin 只掛載 `$Message` 等入口，不分析 method behavior |
| directive hook 與 DOM 操作細節 | `11-directives/` | plugin 只註冊 directive，不分析 hook 實作 |
| Less variables、class naming、theme token | `12-style-system/` | 這是樣式與主題系統 |
| package build、locale bundle build、release scripts | `14-build-release/` | plugin 可依賴 build artifact，但不分析 build pipeline |
| component declaration tables | `06-type-system/` 與 `22-appendix/` | plugin 只關心 plugin-level typing，不展開 component props 型別總表 |

這裡的重點不是「plugin system 不能提到這些內容」，而是「plugin system 只能提到它們和 install / public surface 的關係」。一旦要分析內部機制，就應該跳到對應章節。

### 4.3 判斷一個主題是否屬於 plugin system 的三個問題

後續閱讀 View UI Plus 原始碼時，你可以用三個問題判斷一個內容是否應該放在 `04-plugin-system/`：

#### 問題一：它是否發生在 `app.use(ViewUIPlus, options)` 或 `install(app, opts)` 的流程中？

如果答案是肯定的，通常屬於 plugin system。

例如：

- `opts.locale` 被處理。
- `components` 被註冊。
- `directives` 被註冊。
- `$VIEWUI` 被寫入 `globalProperties`。
- `$Message` 被寫入 `globalProperties`。

這些都是 install-time 行為，應放在 `04-plugin-system/`。

#### 問題二：它是否是在描述「暴露入口」，而不是「內部實作」？

如果只是說明某個能力如何被暴露，例如 `this.$Modal` 從哪裡來，屬於 plugin system。

但如果開始說明：

- `$Modal.confirm()` 如何產生彈窗。
- Modal instance 如何 destroy。
- message queue 如何排列。
- overlay z-index 如何管理。

這就已經離開 plugin system，應分流到 `10-imperative-api/` 或 `08-overlay-system/`。

#### 問題三：它是否是 plugin-level runtime surface 與 type surface 的對照？

如果是在檢查 `src/index.js` 暴露的 API 是否有在 `types/index.d.ts` 宣告，屬於 plugin system 的 runtime/type contract。

例如：

- `install` 是否有型別宣告。
- `$VIEWUI` 是否有出現在 `ComponentCustomProperties`。
- `$Message` 是否有型別。
- `locale`、`i18n`、`lang`、`version` 是否有對應 declaration。

但如果要分析某個 component 的 props type、event type、slot type，則應交給 `06-type-system/` 或 component 專章。

### 4.4 Source anchors 的閱讀方式

`04-plugin-system/` 的 source anchors 可以分成三層：

| Source | 在本章的用途 | 應讀到什麼程度 |
| --- | --- | --- |
| `src/index.js` | plugin install、`ViewUI` map、`directives` map、`globalProperties`、locale exports | 這是本章核心檔案，應完整理解 plugin-level runtime surface |
| `src/components/index.js` | component named export list | 只需理解它提供 module-level component exports；個別 component 實作不要在本章展開 |
| `types/index.d.ts` | install options、global options、`ComponentCustomProperties` | 只需對照 plugin-level declarations；component props type 可分流 |
| `src/locale/index.js` | locale behavior 的下一層 source | 本章只追到 locale contract；locale module 細節可另開筆記 |
| `src/directives/*` | directive behavior 的下一層 source | 本章只追到 directive 被註冊；hook 與 DOM 操作應分流 |

這種讀法的關鍵是：以 `src/index.js` 為中心，向外追一層即可。追到下一層 source 時，只要能解釋 plugin contract，就可以停止，不需要把所有內部實作都塞進 plugin 章節。

### 4.5 Reading route：先建立安裝流程，再看分支能力

建議的閱讀順序如下：

```txt
03-architecture/01-overview.md
  -> 04-plugin-system/01-install-flow.md
    -> 04-plugin-system/02-component-registration.md
    -> 04-plugin-system/03-directive-registration.md
    -> 04-plugin-system/04-global-options-and-viewui-config.md
    -> 04-plugin-system/05-global-properties.md
    -> 04-plugin-system/06-locale-plugin-contract.md
    -> 04-plugin-system/07-runtime-type-contract.md
```

這條路線的設計邏輯是：

1. 先透過 `03-architecture/01-overview.md` 建立整體專案位置感。
2. 再讀 `01-install-flow.md`，先掌握 View UI Plus plugin 安裝時的主流程。
3. 接著讀 `02-component-registration.md` 與 `03-directive-registration.md`，理解 plugin 如何把 component / directive 掛到 app。
4. 再讀 `04-global-options-and-viewui-config.md` 與 `05-global-properties.md`，理解 install options 與 instance-level API 如何進入 component runtime。
5. 然後讀 `06-locale-plugin-contract.md`，理解 locale / i18n 在 plugin system 中的 contract。
6. 最後讀 `07-runtime-type-contract.md`，用 TypeScript declaration 回頭檢查 runtime surface 是否有完整描述。

讀完 plugin system 後，再依目的分流：

| 你想理解的問題 | 接續章節 | 分流理由 |
| --- | --- | --- |
| component 實作細節 | `07-components/` | plugin 只負責註冊，不負責 component 內部 API |
| service-style APIs | `10-imperative-api/` | `$Message`、`$Notice`、`$Modal` 的 method 行為屬於命令式 API |
| directives | `11-directives/` | plugin 只註冊 directive，hook 行為應另看 |
| install options typing | `06-type-system/` | plugin 可做總覽，但深入型別系統應另開章節 |
| locale bundle build | `14-build-release/` | `lang(code)` 會依賴 bundle，但 build artifact 不是 plugin runtime 本身 |

### 4.6 Maintenance checklist：source 變更時如何同步筆記

`04-plugin-system/` 是一個很容易受到 source 變更影響的章節。因為只要 `src/index.js` 的 install 流程、public API 或 globalProperties 有變，就可能牽動多份筆記。

建議使用以下維護規則：

| Source change | 應同步更新的筆記 | 更新重點 |
| --- | --- | --- |
| `src/index.js` 新增 install step | `01-install-flow.md` | 補上新的 install 順序與它對後續流程的影響 |
| `ViewUI` map 新增 alias | `02-component-registration.md` | 補上 component map 與 alias 對全域註冊名稱的影響 |
| `directives` map 新增 key | `03-directive-registration.md` | 補上新的 directive name 與 registration contract |
| `$VIEWUI` 新增欄位或 fallback 改變 | `04-global-options-and-viewui-config.md`、`07-runtime-type-contract.md` | 同步 runtime config 語意與型別宣告 |
| `globalProperties` 新增 API | `05-global-properties.md`、`07-runtime-type-contract.md` | 補上 instance-level API 與 `ComponentCustomProperties` 對照 |
| locale export 或 `lang(code)` 改變 | `06-locale-plugin-contract.md` | 補上新的 locale runtime contract 與使用限制 |
| `types/index.d.ts` 新增或刪除 plugin-level declaration | `07-runtime-type-contract.md` | 重新對照 runtime surface 與 type surface |
| package build 影響 locale bundle | `14-build-release/`，必要時回連 `06-locale-plugin-contract.md` | build 細節在 build 章節，本章只保留 runtime 依賴關係 |

這份 checklist 的目標不是讓你每次都重寫所有筆記，而是提醒：plugin system 是一個「連接層」，它變動時通常會牽動其他章節的入口說明或邊界描述。

---

## 5. 表格整理

### 5.1 Plugin system 擁有與不擁有的總表

| 分類 | 主題 | 是否由 `04-plugin-system/` 主責 | 說明 |
| --- | --- | --- | --- |
| Plugin entry | `app.use(ViewUIPlus, options)` | 是 | Vue app 安裝 View UI Plus 的主要入口 |
| Install flow | `install(app, opts)` | 是 | plugin runtime orchestration 的核心 |
| Component registration | `ViewUI` component map | 是 | plugin 決定哪些 component 全域可用 |
| Directive registration | `directives` map | 是 | plugin 決定哪些 directive 全域可用 |
| Global config | `$VIEWUI` | 是 | install options 被轉成 instance-level config |
| Instance API | `$Message`、`$Modal`、`$Date` 等 | 是，但只到暴露入口 | 只說明如何掛到 `globalProperties`，不分析 method internals |
| Locale contract | `opts.locale`、`opts.i18n`、`locale`、`i18n`、`lang` | 是 | 說明 plugin-level locale setup 與 public API |
| Type contract | `src/index.js` vs `types/index.d.ts` | 是 | 對照 plugin-level runtime surface 與 type surface |
| Component internals | props / events / slots | 否 | 應交給 `07-components/` |
| Overlay internals | DOM / z-index / Teleport / Popper | 否 | 應交給 `08-overlay-system/` |
| Imperative service internals | `$Message.info`、`$Modal.confirm` | 否 | 應交給 `10-imperative-api/` |
| Directive internals | hooks / DOM manipulation | 否 | 應交給 `11-directives/` |
| Build pipeline | locale bundle build、release scripts | 否 | 應交給 `14-build-release/` |

閱讀這張表時要注意：`04-plugin-system/` 不是完全不提其他章節的內容，而是只保留它們在 plugin install 或 public surface 中的角色。真正的行為細節要回到各自章節分析。

### 5.2 Source anchor 表

| Source | 用於分析 | 邊界提醒 |
| --- | --- | --- |
| `src/index.js` | `install`、component map、directive map、`globalProperties`、locale exports、default API | 本章核心檔案，應完整分析 plugin-level 行為 |
| `src/components/index.js` | component named exports | 本章只需要知道 named export surface，不深入 component source |
| `types/index.d.ts` | install options、global options、`ComponentCustomProperties` | 本章只對照 plugin-level 型別，不展開所有 component declaration |
| `src/locale/index.js` | locale module 的下一層行為 | 本章只追 locale contract；細節可放 locale 或 i18n 補充筆記 |
| `src/directives/*` | directive runtime behavior 的下一層來源 | 本章只追註冊入口；hook 細節分流到 `11-directives/` |

---

## 6. 範例或情境說明

### 情境一：看到 `$Message`，應該放在哪裡？

假設你在 `src/index.js` 看到 plugin 把 `$Message` 寫入 `app.config.globalProperties`。

在 `04-plugin-system/05-global-properties.md` 中，應該記錄的是：

```txt
install 後，component instance 可以透過 this.$Message 存取 Message service。
```

這裡的主題是「instance-level API 如何被 plugin 暴露」。

但如果你接著追進 `$Message.info()`，開始分析：

- message instance 如何建立。
- DOM 掛在哪裡。
- 多個 message 如何排隊。
- 關閉時如何 destroy。
- z-index 如何管理。

這些就不應該繼續放在 plugin system，而應該分流到 `10-imperative-api/` 或 `08-overlay-system/`。

### 情境二：看到 `directives` map，應該追到哪裡？

如果 `src/index.js` 中有一個 `directives` map，plugin system 應該記錄：

```txt
install 時會遍歷 directives map，並透過 app.directive(...) 註冊全域 directive。
```

這說明了 directive 的全域註冊契約。

但如果你打開 `src/directives/*`，開始分析某個 directive 的 `mounted` hook 如何讀取 DOM、如何綁定事件、如何在 `updated` 時更新狀態，那就已經進入 `11-directives/` 的範圍。

### 情境三：看到 locale bundle，應該放在哪裡？

如果你在 `src/index.js` 看到 `lang(code)` 依賴 `window['viewuiplus/locale'].default`，plugin system 應該記錄的是：

```txt
lang(code) 是一個 runtime API，它假設頁面已經載入對應的 locale bundle，並且該 bundle 會把語系物件掛到 window['viewuiplus/locale'].default。
```

這是 plugin-level runtime contract。

但 locale bundle 是如何被打包、檔名如何產生、release 時如何輸出到 `dist/locale/*`，這些應該放到 `14-build-release/`。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

第一次閱讀 `04-plugin-system/` 時，建議不要一開始就跳進 `$Message` 或某個 component 的內部實作，而是先把 install flow 看完。

建議順序：

1. `03-architecture/01-overview.md`  
   先建立 View UI Plus 在整個專案中的位置，知道 plugin system 是 public surface 的一部分。

2. `04-plugin-system/01-install-flow.md`  
   掌握 `app.use(ViewUIPlus, options)` 到 `install(app, opts)` 的主流程。

3. `04-plugin-system/02-component-registration.md`  
   理解 `ViewUI` component map 如何決定全域註冊範圍。

4. `04-plugin-system/03-directive-registration.md`  
   理解 directive map 如何被 plugin 註冊到 Vue app。

5. `04-plugin-system/04-global-options-and-viewui-config.md`  
   理解 install options 如何轉成 `$VIEWUI` config。

6. `04-plugin-system/05-global-properties.md`  
   理解 `$Message`、`$Modal`、`$Date` 等 instance-level API 如何暴露。

7. `04-plugin-system/06-locale-plugin-contract.md`  
   理解 locale / i18n 在 install-time 與 module-level 的控制方式。

8. `04-plugin-system/07-runtime-type-contract.md`  
   最後用 TypeScript declaration 檢查 runtime surface 是否有完整對應。

### 7.2 深入閱讀路線

如果你已經理解 plugin install flow，可以依照想解決的問題往外延伸：

| 目標 | 深入路線 |
| --- | --- |
| 想理解 component 實作 | 從 `02-component-registration.md` 分流到 `07-components/` |
| 想理解 `$Message`、`$Modal` | 從 `05-global-properties.md` 分流到 `10-imperative-api/`，必要時再到 `08-overlay-system/` |
| 想理解 directive 行為 | 從 `03-directive-registration.md` 分流到 `11-directives/` |
| 想理解型別完整性 | 從 `07-runtime-type-contract.md` 分流到 `06-type-system/` |
| 想理解 locale bundle | 從 `06-locale-plugin-contract.md` 分流到 `14-build-release/` |

### 7.3 可以暫時跳過的部分

初次閱讀 plugin system 時，可以暫時跳過以下內容：

- 單一 component 的 props / events / slots。
- service API 的 queue、destroy、overlay 管理。
- directive hook 內部 DOM 操作。
- Less variable 與 class naming。
- release script 與 build output 細節。
- 完整 component declaration tables。

這些內容不是不重要，而是它們會讓你太早離開 plugin install 的主線。先把 plugin 的「安裝與暴露」理解清楚，再分流閱讀會更有效率。

---

## 8. 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 plugin system 要分析所有從 `src/index.js` 連出去的檔案 | `src/index.js` 會 import components、directives、locale，因此很容易一路追到底 | plugin system 只分析 install 與 public surface；下一層模組只追到 contract 即可 |
| 以為 `$Message` 出現在 `globalProperties`，所以 `$Message.info` 的所有細節都要放在 plugin 筆記 | `$Message` 的入口確實由 plugin 暴露 | plugin 只負責暴露入口，method behavior 應放到 imperative API 或 overlay system |
| 以為 component registration 等於 component 實作分析 | component map 會列出很多 component 名稱 | registration 只關心「是否全域註冊」與「註冊名稱」，props/events/slots 是 component 章節 |
| 以為 directive registration 等於 directive behavior | directive map 和 directive source 有直接關係 | plugin 只關心 `app.directive` 註冊；hook 與 DOM 操作交給 directive 章節 |
| 以為 build artifact 屬於 plugin system | `lang(code)` 可能依賴 locale bundle | plugin system 只記 runtime contract；bundle 如何產生屬於 build/release |
| 只把本章當目錄索引 | 本章包含大量章節分流資訊 | 本章更重要的作用是建立「判斷邊界」與「維護同步」的規則 |
| 忽略 type declaration 與 runtime surface 的對照 | 使用 JS 時可能不會立刻感受到型別缺口 | 對 component library 而言，runtime API 與 TypeScript declaration 是否一致會直接影響使用體驗 |

---

## 9. 本章總結

`04-plugin-system/` 的核心任務，是理解 View UI Plus 作為 Vue plugin 被安裝時，如何完成 runtime orchestration。它關心的是 `app.use(ViewUIPlus, options)` 如何進入 `install(app, opts)`，以及 install 過程中如何處理 component registration、directive registration、global config、globalProperties、locale contract 與 plugin-level type contract。

本章最重要的心智模型是：plugin system 是「組裝層」與「暴露層」，不是所有功能的實作層。它可以記錄 `$Message` 被掛到 `this.$Message`，但不應深入 `$Message.info()` 如何建立 DOM；它可以記錄 directive 被全域註冊，但不應深入 directive hook 如何操作元素；它可以記錄 `lang(code)` 依賴 locale bundle，但不應深入 bundle 如何打包。

因此，閱讀 `04-plugin-system/` 時，要把焦點固定在「安裝流程、全域註冊、配置注入、instance API 暴露、locale contract、runtime/type 對照」。一旦主題開始進入 component、service、directive、style、type 或 build 的內部細節，就應該分流到對應章節。

這樣整理後，`04-plugin-system/` 不只是幾篇分散筆記的集合，而是一條清楚的原始碼閱讀主線：先從 plugin entry 建立整體安裝流程，再依照 component、directive、config、service、locale、type 等方向逐步展開，最後透過本篇邊界筆記收束，避免知識庫重複、混亂或失焦。

---

## 10. 自我檢查問題

1. 為什麼 `04-plugin-system/` 應該聚焦在 `src/index.js` 的 runtime orchestration，而不是深入所有 component 的實作？
2. `app.use(ViewUIPlus, options)` 和 `install(app, opts)` 在 plugin system 中各自代表什麼角色？
3. 為什麼 `ViewUI` component map 屬於 plugin system，但單一 component 的 props / events / slots 不屬於 plugin system？
4. `$Message` 被掛到 `app.config.globalProperties` 這件事應該放在哪一章？`$Message.info()` 如何建立 DOM 又應該放在哪一章？
5. `directives` map 和 `src/directives/*` 的閱讀邊界應該如何切分？
6. `lang(code)` 為什麼可以放在 plugin system 討論？locale bundle 的 build 流程又為什麼應該分流到 `14-build-release/`？
7. 當 `src/index.js` 新增一個 `globalProperties` API 時，哪些筆記可能需要同步更新？
8. 為什麼 runtime surface 與 TypeScript declaration 的對照是 plugin system 的重要維護項目？
9. 如果你看到一個新的 install option，應該用哪三個問題判斷它是否屬於 `04-plugin-system/`？
10. 本章所說的「擁有某主題」和「可以提到某主題」有什麼差別？

---

## 11. 後續延伸方向

本章之後可以延伸出以下筆記或章節：

- `07-components/`：分析單一 component 的 props、events、slots、render、composition 邏輯。
- `08-overlay-system/`：分析 overlay DOM、z-index、Teleport、Popper、浮層掛載與銷毀。
- `09-form-system/`：分析 `Form` / `FormItem` 的 validation、欄位註冊與表單協作。
- `10-imperative-api/`：分析 `$Message`、`$Notice`、`$Modal.confirm` 等 service-style API 的內部實作。
- `11-directives/`：分析 directive hooks、DOM 操作、事件綁定與更新時機。
- `12-style-system/`：分析 Less variables、class naming、theme token 與樣式架構。
- `14-build-release/`：分析 package build、locale bundle build、release scripts 與輸出產物。
- `06-type-system/`：分析 install options、component declaration、module augmentation 與型別完整性。
- `22-appendix/`：整理 component declaration tables、API 表、路徑索引與查表型資料。

---

## Related Notes

- `03-architecture/01-overview.md`
- `03-architecture/06-public-surface.md`
- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/06-locale-plugin-contract.md`
- `04-plugin-system/07-runtime-type-contract.md`
- `06-type-system/`
- `10-imperative-api/`
- `11-directives/`
