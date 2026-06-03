# 全域註冊、全域配置與服務掛載

## 學習目標

這篇筆記追蹤 `app.use(ViewUIPlus, opts)` 背後的流程。全域註冊是理解 Vue 元件庫的核心主線：它同時處理元件註冊、指令註冊、語系初始化、全域配置與命令式服務掛載。

讀完後，你應該能區分 `app.component`、`app.directive`、`app.config.globalProperties` 和 `types/index.d.ts` 各自解決的問題，並用這條線檢查新增全域服務是否 runtime 與 type 同步。

## 對照源碼

- `03-architecture/atomic/05-global-registration-and-services.md`
- `03-architecture/origin/05-registration-flow.md`
- `03-architecture/origin/04-entry-design.md`
- `03-architecture/origin/07-core-design-principles.md`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 安裝主線

Vue 3 plugin 的核心入口是 `install(app, options)`。View UI Plus 的 `src/index.js` 在 `install` 中完成五類工作：

1. 防止重複安裝。
2. 初始化 locale 與 i18n。
3. 批次註冊所有公開元件與別名。
4. 批次註冊自訂指令。
5. 掛載 `$VIEWUI` 全域配置與命令式服務。

流程可以整理為：

```txt
app.use(ViewUIPlus, opts)
  -> default API.install
  -> install(app, opts)
     -> localeFile.use(opts.locale)
     -> localeFile.i18n(opts.i18n)
     -> app.component(name, component)
     -> app.directive(name, directive)
     -> app.config.globalProperties.$VIEWUI = global options
     -> app.config.globalProperties.$Message / $Modal / ...
```

## 元件註冊

`src/index.js` 先建立 `ViewUI`：

```txt
ViewUI = {
  ...components,
  iButton: components.Button,
  iInput: components.Input,
  ...
}
```

接著在 `install` 中批次註冊：

```txt
Object.keys(ViewUI).forEach(key => {
  app.component(key, ViewUI[key])
})
```

這代表 `src/components/index.js` 中匯出的元件，以及 `ViewUI` 額外定義的 `i` 前綴別名，都會成為全域元件。這裡的公開面比具名匯入更大，因為它包含手動加入的別名。

## 指令註冊

`src/index.js` 匯入三個指令來源：

- `line-clamp`
- `resize`
- `style`

再整理成一個 `directives` 物件，提供：

```txt
display, width, height, margin, padding, font,
color, bg-color, resize, line-clamp
```

安裝時透過：

```txt
app.directive(key, directives[key])
```

批次註冊。這表示 View UI Plus 的 plugin install 不只提供元件，也提供全域指令能力。

## 全域配置 `$VIEWUI`

`$VIEWUI` 來自 `install(app, opts)` 的第二個參數。`src/index.js` 會把它掛到：

```txt
app.config.globalProperties.$VIEWUI
```

目前 atomic 與 source 都支持 `$VIEWUI` 包含通用尺寸、事件捕獲、彈層轉移，以及多個元件的 icon、arrow、maskClosable、Typography、Space、Image 等預設設定。

這種設計讓單一元件可以讀取全域預設值，同時仍保留 props 覆蓋的空間。但它也讓元件和全域環境產生關聯，所以閱讀元件時要注意是否讀取 `$VIEWUI`。

## 全域服務

`install` 會把多個命令式服務掛到 `app.config.globalProperties`：

```txt
$Spin
$Loading
$Message
$Notice
$Modal
$ImagePreview
$Copy
$ScrollIntoView
$ScrollTop
$Date
```

這讓使用者可以在元件實例中使用類似 `this.$Message.success(...)` 或 `this.$Modal.confirm(...)` 的方式呼叫服務。

`$Date` 來源是 `dayjs`。其他服務來源則來自 `components` namespace，例如 `components.Message`、`components.Modal`、`components.LoadingBar`。

## TypeScript 對應

全域服務掛載後，還需要型別配合。`types/index.d.ts` 透過擴充 `@vue/runtime-core` 的 `ComponentCustomProperties`，宣告 `$VIEWUI`、`$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal`、`$ImagePreview`、`$Copy`、`$ScrollIntoView`、`$ScrollTop`、`$Date`。

這是一條雙線設計：

```txt
runtime: app.config.globalProperties
type: declare module '@vue/runtime-core'
```

只做 runtime 掛載，JavaScript 執行可能正常，但 TypeScript 使用者側不一定有完整提示。只做型別宣告，runtime 也不會自動存在。

## 來源明確支持

- `src/index.js` 明確在 `install` 中檢查 `install.installed`、處理 locale/i18n、批次 `app.component`、批次 `app.directive`、掛載 `$VIEWUI` 與多個全域服務。
- `types/index.d.ts` 明確擴充 `ComponentCustomProperties`，包含 `$VIEWUI` 與多個 `$Xxx` 全域屬性。
- `src/index.js` 明確把 `$Date` 指向 `dayjs`。
- atomic 05 與 origin 05 明確將全域註冊拆成元件、指令、全域配置、全域服務與 TypeScript 對應。

## 根據來源推論

- 將 `$VIEWUI` 視為跨元件預設值中心，是基於 `src/index.js` 中多個元件配置項與 atomic 05/09 的說明做出的推論。
- 將全域服務的風險描述為「便利性與全域命名面擴大之間的取捨」，是基於全域掛載行為做出的設計判斷，source 沒有直接評價取捨。

## Runtime / Type 落差

本主題最需要集中檢查的是 runtime 與 type 是否同步。

| 能力 | Runtime 來源 | Type 來源 | 檢查重點 |
| --- | --- | --- | --- |
| 全域配置 | `app.config.globalProperties.$VIEWUI` | `$VIEWUI: ViewUIPlusGlobalOptions` | options 形狀是否一致。 |
| `$VIEWUI.capture` | `src/index.js` 會把 `opts.capture` 寫入 `$VIEWUI.capture`，預設為 `true` | `ViewUIPlusGlobalOptions` 目前未列出 `capture` | 這是已知 runtime / type 落差，不能寫成已同步。 |
| 命令式服務 | `$Message`、`$Modal` 等掛載 | `ComponentCustomProperties` | runtime 有掛載時，type 是否補上。 |
| 安裝選項 | `install(app, opts)` | `ViewUIPlusInstallOptions` | locale、i18n、全域配置是否能被 TS 使用者理解。 |
| 指令 | `app.directive` | 本章來源未見集中型別入口 | 不應自行補寫未被來源支持的指令型別結論。 |

## 設計啟發

全域註冊流程要同時考慮便利性與維護成本。

- 批次註冊降低使用者手動註冊成本，但會擴大全域元件名稱面。
- 全域服務方便命令式呼叫，但必須同步型別宣告。
- 全域配置可以統一體驗，但會增加元件對環境的隱式依賴。
- 別名能降低遷移成本，但一旦進入註冊流程，就是公開 API。

## 實戰使用場景

- 新增一個全域服務時，先在 `src/index.js` 檢查 runtime 掛載，再到 `types/index.d.ts` 補 `ComponentCustomProperties`。
- 排查 `this.$Message` 不存在時，先確認是否有執行 `app.use(ViewUIPlus)`，再確認 `src/index.js` 是否掛載服務。
- 排查 TS 沒有 `$Modal` 提示時，先檢查 `types/index.d.ts`，不要只看 `src/index.js`。
- Review 全域配置使用時，檢查元件是否有 props 覆蓋空間，避免所有行為都只能依賴 `$VIEWUI`。

## 實作檢查任務

1. 在 `src/index.js` 找出 `install(app, opts)`，列出它的五類責任。
2. 找出 `ViewUI` 物件中的 `i` 前綴別名，判斷它們是否也會被 `app.component` 註冊。
3. 找出所有 `app.config.globalProperties.$Xxx`，再到 `types/index.d.ts` 比對是否有對應型別。
4. 檢查 `$VIEWUI` runtime options 和 `ViewUIPlusGlobalOptions` 是否有明顯不同步之處。
5. 找出 directives 物件，確認哪些 directive 會被全域註冊。

## 複習題

1. `install.installed` 的用途是什麼？
2. `app.component`、`app.directive` 和 `app.config.globalProperties` 分別解決什麼問題？
3. `Message` 為什麼不只是普通元件，還需要掛成 `$Message`？
4. `$VIEWUI` 這類全域配置可能帶來什麼好處與風險？
5. 為什麼全域服務需要在 `types/index.d.ts` 補型別？
