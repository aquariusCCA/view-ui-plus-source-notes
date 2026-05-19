# Layer Model（分層模型）

這篇展開 `03-architecture/01-overview.md` 裡提到的分層模型。`overview` 偏向總覽 View UI Plus 如何被組成；這篇則把架構拆成幾個 layer（層），說明每一層負責什麼、依賴誰、對上層提供什麼能力，以及不應該跨界處理什麼。

這裡的 layer 不是單純等於目錄。目錄是程式碼放置位置，layer 是架構責任。某些目錄會同時支撐多個 layer，例如 `src/index.js` 同時是 package runtime entry，也是 plugin install 的集中點；`package.json` 則同時描述 npm entry、type entry 和 build scripts。

## 1. 分層總圖

View UI Plus 可以從使用者接觸 library 的角度往下看：

```txt
使用者層
  -> 入口安裝層
    -> 組件層
      -> 共用能力層
      -> 樣式層
  -> 型別/發佈層
    -> 建置層
```

更接近程式碼的依賴方向可以寫成：

```txt
npm / Vue app users
  -> package entry and public API
    -> src/index.js
      -> src/components/index.js
        -> src/components/*
          -> src/utils/
          -> src/mixins/
          -> src/locale/
          -> src/styles/

package metadata
  -> types/
  -> dist/
  -> build scripts
```

這個模型的重點是：上層描述「外部如何使用」，下層提供「內部如何支撐」。越往上越接近 public API，越往下越接近 implementation detail（實作細節）或 build artifact（建置產物）。

## 2. 七層責任概覽

| Layer | 主要位置 | 對上層提供什麼 | 不應該承擔什麼 |
| --- | --- | --- | --- |
| 使用者層 | 使用者的 Vue app、npm import、CSS import | library 的使用方式與整體體驗 | 不定義內部 component 實作 |
| 入口安裝層 | `src/index.js` | plugin install、global registration、globalProperties、locale setup | 不實作單一 component 細節 |
| 組件層 | `src/components/index.js`、`src/components/*` | named exports、global component source、component runtime behavior | 不處理 package build 或發佈格式 |
| 共用能力層 | `src/utils/`、`src/mixins/`、`src/directives/`、`src/locale/` | 跨 component 共用的邏輯、directive、i18n 能力 | 不應直接變成使用者入口 |
| 樣式層 | `src/styles/` | Less source、component CSS、iconfont、基礎樣式 | 不承擔 component state 或 business logic |
| 型別/發佈層 | `types/`、`dist/`、`package.json` entry | TypeScript contract、runtime bundles、CSS/locale artifacts | 不作為設計來源或主要維護入口 |
| 建置層 | `package.json` scripts、`vite.config.js`、`build/` | 將 source/style/locale 轉成可發佈 output | 不定義 runtime API 語意 |

## 3. 使用者層：Library 被如何消費

使用者層描述的是 View UI Plus 在外部 Vue app 裡的使用方式。它不是 repo 裡的單一目錄，而是 public API 被消費時呈現出來的形狀。

常見使用面包括：

- 透過 `app.use(ViewUIPlus, options)` 安裝整個 Vue plugin。
- 透過 named imports，例如 `import { Button } from 'view-ui-plus'` 取用單一 component。
- 在 template 中使用全域註冊後的 components。
- 透過 `this.$Message`、`this.$Modal`、`this.$Notice` 等 imperative APIs 呼叫全域服務。
- 載入 `dist/styles/viewuiplus.css` 或其他 style output。
- 讓 TypeScript 和 IDE 讀取 `types/index.d.ts` 提供的 declarations。

這一層關心的是「使用者能否穩定、清楚地使用 library」。它不關心 component 內部如何計算狀態，也不直接決定 build 如何輸出 bundle。這些都交給下層完成。

## 4. 入口安裝層：Plugin 與 Public Runtime Surface

入口安裝層的核心是 `src/index.js`。這裡是 View UI Plus 的 `runtime entry`，負責把內部能力組裝成使用者看得到的 public runtime surface。

它主要做幾件事：

- `export * from './components'`，將 component named exports 暴露出去。
- 匯入 `src/components/index.js`，組合成 `ViewUI` component map。
- 加上 `iButton`、`iForm`、`iInput` 等相容 alias。
- 定義 `install(app, opts)`，讓使用者可以透過 `app.use()` 安裝。
- 在 install flow 中註冊 components 和 directives。
- 設定 `$VIEWUI` global config。
- 掛載 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等 imperative APIs 到 `app.config.globalProperties`。
- 接入 locale 和 i18n 設定。

這一層是 library 的門面。它應該負責組裝、註冊和暴露能力，但不應深入實作每個 component 的渲染細節，也不應混入 build output 的產生規則。

## 5. 組件層：UI 能力的主要實作

組件層由 `src/components/index.js` 和 `src/components/*` 組成。`src/components/index.js` 是 component export map，集中列出 View UI Plus 對外提供的 components；各 component 目錄則保存實際實作。

這一層提供的能力包括：

- named component exports，例如 `Button`、`Form`、`Table`、`Modal`。
- plugin install 時可被全域註冊的 component source。
- 單一 component 的 props、events、slots、render/template、internal state。
- 部分 service-style API 的來源，例如 Message、Notice、Modal、Spin、Loading。

組件層通常會向下依賴共用能力層和樣式層。例如 component 可能使用 `src/utils/` 做 DOM 或日期處理，使用 `src/mixins/` 共用行為，使用 `src/locale/` 取得文字，並依賴 `src/styles/` 裡的 class/style 規則完成 UI 呈現。

這一層不應承擔 package 發佈或建置格式的責任。component 應該描述「UI 行為如何工作」，而不是描述「bundle 要怎麼輸出」。

## 6. 共用能力層：跨 Component 的支撐能力

共用能力層支撐多個 components 和入口安裝層，目的是避免每個 component 重複處理相同問題。

主要區域包括：

- `src/utils/`：DOM、date、CSV、textarea height、assist 等通用工具。
- `src/mixins/`：locale、form、emitter、globalConfig、link 等跨 component 行為。
- `src/directives/`：`resize`、`line-clamp`、style-related directives 等 Vue directives。
- `src/locale/`：locale data、i18n setup、文字格式化能力。

這一層的架構角色是「支撐」而不是「入口」。它應該被 component 或 `src/index.js` 使用，但不應直接變成使用者主要依賴的 public API。若 shared utility 被外部依賴，就會讓內部重構變得困難，因為原本的 implementation detail 會被誤認成 contract。

## 7. 樣式層：UI 呈現與視覺系統

樣式層主要位於 `src/styles/`。它負責 Less source、component styles、animation、common styles、mixins、iconfont 等和 UI 呈現相關的能力。

樣式層和組件層是平行支撐關係：

- component 負責 DOM 結構、狀態和互動。
- styles 負責 class 對應的視覺規則。
- build process 會把 Less source 轉成 `dist/styles/viewuiplus.css`。

這一層不應承擔 component runtime logic。舉例來說，樣式可以定義 disabled 外觀，但 disabled 狀態如何判斷、事件是否觸發，仍應由 component runtime 負責。

閱讀樣式層時，可以把它看成「component runtime 的視覺對應表」。要理解互動行為看 `src/components/`；要理解樣式輸出看 `src/styles/` 和 `build/build-style.js`。

## 8. 型別/發佈層：Public Contract 與 Artifacts

型別/發佈層把 library 的能力轉成使用者可依賴的 package 介面。這一層主要由 `types/`、`dist/` 和 `package.json` entry fields 組成。

`types/` 的責任是 public type contract：

- `types/index.d.ts` 是 `package.json` 的 `typings` 指向。
- 它描述 plugin install options、global properties、named exports。
- `types/viewuiplus.components.d.ts` 描述 component declarations。

`dist/` 的責任是 distribution artifacts：

- `dist/viewuiplus.min.js` 是 UMD bundle。
- `dist/viewuiplus.min.esm.js` 是 ES module bundle。
- `dist/styles/` 提供編譯後 CSS 和 fonts。
- `dist/locale/` 提供建置後的 locale files。

這一層服務使用者，但它不是主要設計來源。`types/` 描述 contract，不決定 runtime 行為；`dist/` 是 build result，不應被當成 source of truth。要理解設計應回到 `src/`，要理解輸出才看 `dist/`。

## 9. 建置層：把 Source 轉成 Package Output

建置層負責把 source、style、locale 轉成可發佈產物。它主要由 `package.json` scripts、root `vite.config.js` 和 `build/` scripts 組成。

這個 repo 裡的 build path 可以分成三條：

- `build:prod` 執行 `vite build`，以 `src/index.js` 為 library entry，輸出 JavaScript bundles。
- `build:style` 執行 `gulp --gulpfile build/build-style.js`，把 `src/styles/index.less` 編譯成 CSS，並複製 iconfont fonts。
- `build:lang` 執行 `vite build --config build/vite.lang.config.js`，把 `src/locale/lang/` 的語系檔輸出成 `dist/locale/`。

建置層應該描述「產物如何生成」，不應決定 component 的 runtime 語意。它可以改變輸出格式、輸出位置、壓縮策略或 build target，但不應改變 `Button`、`Modal`、`Form` 等 component 的使用語意。

## 10. 依賴方向與邊界規則

這個分層模型可以用幾條規則理解：

- 使用者層只依賴 public API，不應依賴內部 implementation detail。
- 入口安裝層負責組裝 public runtime surface，不負責實作單一 component。
- 組件層可以依賴共用能力層、樣式層、locale，但不應依賴 build output。
- 共用能力層應保持可被多個 component 使用，不應反向依賴某個特定上層 component。
- 樣式層支撐 UI 呈現，不承擔 component state 和事件語意。
- 型別層描述 public contract，但 runtime truth 仍要回到 `src/`。
- 發佈產物 `dist/` 是 build result，不是主要維護入口。
- 建置層負責 source 到 artifacts 的轉換，不決定使用者 API 的語意。

如果讀程式時分不清某段程式碼屬於哪一層，可以問兩個問題：它是給使用者直接依賴的，還是給內部支撐用的？它是在描述 runtime 行為，還是在描述 build output 或 type contract？這兩個問題通常可以幫助判斷邊界。

## 11. 建議閱讀方式

若要理解整個 layer model，可以按這個順序讀：

1. 從使用者層開始，先確認 `app.use()`、named imports、global APIs 是哪些 public surface。
2. 看 `src/index.js`，理解入口安裝層如何把 components、directives、locale、globalProperties 組起來。
3. 看 `src/components/index.js`，理解 component export map。
4. 挑一個代表性 component 進入 `src/components/*`，觀察它如何使用 shared utilities、mixins、locale 和 styles。
5. 看 `src/styles/`，理解 runtime component 如何對應到視覺系統。
6. 看 `types/index.d.ts`，確認 TypeScript 使用者看到的 contract。
7. 看 `package.json` scripts、`vite.config.js` 和 `build/`，理解 build 如何產生 `dist/`。

這條路線會先建立 public API 的輪廓，再往內部 implementation 展開，最後回到 package output。

## 12. 和其他 Architecture Notes 的分工

- `03-architecture/01-overview.md`：整體 runtime overview，說明 View UI Plus 如何作為 Vue 3 UI library 被組成。
- `03-architecture/02-repository-structure.md`：repo 目錄分工，說明 `src/`、`types/`、`build/`、`dist/`、`examples/` 為什麼分開。
- 本篇：layer model，說明使用者層、入口安裝層、組件層、共用能力層、樣式層、型別/發佈層、建置層之間的責任和依賴邊界。

