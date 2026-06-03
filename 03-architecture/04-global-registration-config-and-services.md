# 全域註冊、配置與服務掛載

## 學習目標

這篇筆記追蹤 `app.use(ViewUIPlus, opts)` 背後發生的事。全域註冊流程是理解 Vue 元件庫入口設計的核心主線：它把公開元件、指令、全域配置、命令式服務與 TypeScript 全域屬性連在一起。

讀完後，你應該能說明：

1. `install(app, opts)` 在 View UI Plus 中完成哪些工作。
2. 元件註冊、指令註冊、全域配置與全域服務的責任差異。
3. 為什麼 runtime 的 `globalProperties` 需要 `types/index.d.ts` 配合。

## 來源與對照

主要 atomic：

- `03-architecture/atomic/05-global-registration-and-services.md`

origin 對照：

- `03-architecture/origin/05-registration-flow.md`
- `03-architecture/origin/04-entry-design.md`
- `03-architecture/origin/07-core-design-principles.md`

對照源碼：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## `install` 的五個責任

Vue 3 的插件安裝入口是 `install(app, options)`。在 View UI Plus 中，`install` 集中處理五類工作：

1. 檢查 `install.installed` guard。
2. 初始化 locale 和 i18n。
3. 批次註冊所有公開元件與別名。
4. 批次註冊自訂指令。
5. 掛載 `$VIEWUI` 全域配置與多個命令式服務。

可以用以下流程理解：

```txt
app.use(ViewUIPlus, opts)
  -> default API.install
  -> install(app, opts)
     -> if (install.installed) return
     -> localeFile.use(opts.locale)
     -> localeFile.i18n(opts.i18n)
     -> app.component(name, component)
     -> app.directive(name, directive)
     -> app.config.globalProperties.$VIEWUI
     -> app.config.globalProperties.$Message / $Modal / ...
```

這條路徑說明 `app.use(ViewUIPlus)` 不是單純註冊元件，而是把元件庫的多種全域能力一起放進 Vue app。

不過這裡要把 source 事實講精準：`src/index.js` 中可以看到 `if (install.installed) return`，但在同一檔案未看到 `install.installed = true`。因此它只能說明 source 有防重複安裝的 guard 檢查，不能直接寫成完整有效的防重複安裝流程。

## 元件註冊

`src/index.js` 先建立 `ViewUI` 物件。這個物件會展開 `components`，也會加入多個 `i` 前綴別名，例如 `iButton`、`iInput`、`iTable` 等。

接著 `install` 對 `ViewUI` 做批次註冊：

```txt
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這代表兩種東西都會變成全域元件：

1. `src/components/index.js` 中集中匯出的元件。
2. `src/index.js` 額外加入的別名。

這裡要注意，別名不是單純內部方便寫法。只要它被 `app.component` 註冊，就會成為使用者模板中可用的名稱，也就進入公開 API 面。

## 指令註冊

`src/index.js` 匯入三個指令來源：

- `line-clamp`
- `resize`
- `style`

再整理成 `directives` 物件。依 `src/index.js`，安裝時會註冊以下指令名稱：

| 註冊 key | 使用時形式 |
| --- | --- |
| `display` | `v-display` |
| `width` | `v-width` |
| `height` | `v-height` |
| `margin` | `v-margin` |
| `padding` | `v-padding` |
| `font` | `v-font` |
| `color` | `v-color` |
| `bg-color` | `v-bg-color` |
| `resize` | `v-resize` |
| `line-clamp` | `v-line-clamp` |

這些指令不是單一元件專屬能力，而是安裝元件庫時進入 Vue app 的全域指令面。閱讀它們時應該回到 `src/directives/`，不要把它們誤認為某個元件內部實作。

## 全域配置 `$VIEWUI`

`$VIEWUI` 是 View UI Plus 的全域配置物件，來源是 `install(app, opts)` 的第二個參數。

依 atomic 與 `src/index.js`，它包含多類跨元件預設值，例如：

- 通用尺寸：`size`
- 彈層轉移：`transfer`
- 事件捕獲：`capture`
- `cell`、`menu`、`select`、`tree`、`cascader` 等元件的 arrow / customArrow / arrowSize
- `modal.maskClosable`
- `datePicker`、`timePicker` 的 icon 設定
- `typography` 的 copy / edit / ellipsis 設定
- `space.size`
- `image.toolbar`

這種設計讓單一元件可以讀取全域預設值，同時仍保留 props 覆蓋的空間。它的好處是跨元件體驗一致；代價是元件與全域環境產生關聯。

閱讀單一元件時，如果看到它讀取 `$VIEWUI`，就不能只看該元件 props。你還要回到安裝選項與 `src/index.js`，確認全域預設值如何進入 runtime。

## 全域服務

`install` 會把多個命令式服務掛到 `app.config.globalProperties`：

- `$Spin`
- `$Loading`
- `$Message`
- `$Notice`
- `$Modal`
- `$ImagePreview`
- `$Copy`
- `$ScrollIntoView`
- `$ScrollTop`
- `$Date`

這些 API 讓使用者可以在元件實例中透過 `this.$Message.success(...)` 或 `this.$Modal.confirm(...)` 這類方式呼叫服務。

這裡的設計重點是：`Message`、`Notice`、`LoadingBar` 這類能力不只是普通模板元件。它們可以透過命令式 API 被呼叫，因此閱讀方式要從元件模板延伸到實例建立、更新、銷毀與全域掛載。

## Runtime 與 Type 對應

全域服務在 runtime 層是透過 `app.config.globalProperties` 掛載，但 TypeScript 不會因為 runtime 掛載就自動知道這些屬性存在。

因此 `types/index.d.ts` 透過擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`，補上：

- `$VIEWUI`
- `$Spin`
- `$Loading`
- `$Message`
- `$Notice`
- `$Modal`
- `$ImagePreview`
- `$Copy`
- `$ScrollIntoView`
- `$ScrollTop`
- `$Date`

這形成一個雙線設計：

| 表面 | 來源 | 解決問題 |
| --- | --- | --- |
| runtime | `src/index.js` 的 `app.config.globalProperties` | 使用者執行時能呼叫全域服務。 |
| type | `types/index.d.ts` 的 module augmentation | TypeScript 使用者能取得屬性提示與型別承認。 |

如果後續閱讀某個全域服務，必須同時檢查這兩條線。只看 runtime 會漏掉使用者側型別體驗；只看 d.ts 則無法確認實際掛載行為。

## 全域能力的取捨

全域註冊流程帶來便利，但也擴大維護面：

1. 批次註冊讓整包安裝容易使用，但會擴大全域元件名稱面。
2. 別名降低相容成本，但也成為需要維護的公開 API。
3. 全域服務方便呼叫，但需要同時維護 runtime 與 type。
4. `$VIEWUI` 能統一跨元件預設值，但會讓單一元件與全域環境產生隱式關聯。
5. 指令全域註冊讓樣式與行為工具容易使用，但也需要避免命名衝突。

這些不是單純好壞問題，而是元件庫在使用者便利性、API 面積與維護成本之間的取捨。

## 關鍵設計

View UI Plus 的全域註冊流程展示了完整元件庫的幾個設計原則：

1. 插件入口不只是元件註冊，也承擔配置、語系、指令與服務掛載。
2. 批次註冊依賴集中匯出清單，因此 `src/components/index.js` 和 `src/index.js` 必須一起讀。
3. 全域配置應集中管理，讓跨元件預設值有一致來源。
4. 命令式服務應明確掛載到公開名稱，並補上 TypeScript 全域屬性。
5. runtime 與 type 是兩個不同表面，必須互相對照。

## 設計啟發

如果要在自己的元件庫中提供全域安裝，應先定義清楚：

1. 哪些元件會全域註冊。
2. 是否需要別名，別名是否有相容性理由。
3. 哪些能力應該是 directive，而不是 component。
4. 全域配置的 key 是否能對應具體元件行為。
5. 命令式服務是否真的需要掛到 `globalProperties`。
6. TypeScript 是否補上所有 runtime 暴露的全域屬性。

全域能力越方便，公開 API 面越大。設計時要讓每個全域名稱都有明確責任，而不是把所有內部能力都暴露出去。

## 複習題

1. `src/index.js` 中的 `install.installed` guard 能說明什麼？不能直接推出什麼？
2. `app.component`、`app.directive` 與 `app.config.globalProperties` 分別解決什麼問題？
3. `Message` 為什麼不能只當普通元件理解？
4. `$VIEWUI` 這類全域配置可能帶來什麼好處與風險？
5. 為什麼全域服務需要在 `types/index.d.ts` 補型別？
