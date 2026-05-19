# Module Dependency Map：主要模組依賴方向

這篇用一張較粗粒度的依賴地圖，說明 View UI Plus 主要模組之間的方向關係。它不是完整 import graph，而是用來回答三個架構問題：

1. package runtime entry 如何把 components、directives、locale 聚合成 public API。
2. components 在實作時依賴哪些共用能力層。
3. `package.json` 如何把 source、build、types、dist 串成 npm package 的輸出面。

閱讀這張圖時，箭頭代表「主要依賴方向」或「產出方向」。如果某個單一 component 有額外的局部 import，應回到該 component 目錄閱讀，不在這篇展開。

## 1. 總覽圖

```txt
package.json
  -> build/
  -> types/
  -> dist/

src/index.js
  -> src/components/index.js
  -> src/directives/*
  -> src/locale/index.js

src/components/*
  -> src/utils/
  -> src/mixins/
  -> src/locale/
  -> src/styles/
```

這張圖可以分成兩種方向：

- Runtime dependency：`src/index.js` 聚合 runtime source，讓使用者可以 `app.use(ViewUIPlus)`、named import components，或使用 locale API。
- Package output dependency：`package.json` 宣告 package entry、types entry、files 與 build scripts，讓 source 被打包成 `dist/`、讓 public type contract 指向 `types/`。

## 2. `src/index.js` 的聚合方向

`src/index.js` 是 package runtime entry。它不負責實作每一個 component，而是把 component export map、directive map、locale API 與 install flow 串起來。

```txt
src/components/index.js
src/directives/style.js
src/directives/resize.js
src/directives/line-clamp.js
src/locale/index.js
dayjs
package.json version
      -> src/index.js
        -> export * from './components'
        -> install(app, opts)
        -> app.component()
        -> app.directive()
        -> app.config.globalProperties
        -> locale / i18n / lang
        -> default API
```

主要方向如下：

| From | To | 方向意義 |
| --- | --- | --- |
| `src/index.js` | `src/components/index.js` | 取得所有 component named exports，並在 `install()` 中全域註冊。 |
| `src/index.js` | `src/directives/style.js` | 組成 `display`、`width`、`height`、`margin`、`padding`、`font`、`color`、`bg-color` 等 style directives。 |
| `src/index.js` | `src/directives/resize.js` | 註冊 `resize` directive。 |
| `src/index.js` | `src/directives/line-clamp.js` | 註冊 `line-clamp` directive。 |
| `src/index.js` | `src/locale/index.js` | 對外提供 `locale`、`i18n`、`lang`，並在 `install()` 中套用 `opts.locale` / `opts.i18n`。 |
| `src/index.js` | `package.json` | 讀取 `version`，形成 runtime API 的版本資訊。 |

因此，`src/index.js` 是 public runtime surface 的集中點：

- `export * from './components'` 讓使用者可以 named import component。
- `install(app, opts)` 讓使用者可以透過 Vue plugin 一次註冊所有 components 與 directives。
- `app.config.globalProperties` 暴露 `$VIEWUI`、`$Message`、`$Modal`、`$Notice`、`$Spin`、`$Date` 等 instance-level API。
- default export 把 `version`、`locale`、`i18n`、`install`、`lang` 與 components 放在同一個 API object。

## 3. Components 的內部依賴方向

`src/components/index.js` 是 component export map；真正的 component 行為分散在 `src/components/*`。這些 component 會向下依賴共用能力層，而不是把所有邏輯都寫在 package entry。

```txt
src/components/index.js
  -> src/components/affix
  -> src/components/button
  -> src/components/form
  -> src/components/modal
  -> src/components/table
  -> src/components/*

src/components/*
  -> src/utils/
  -> src/mixins/
  -> src/locale/
  -> src/styles/
```

| Components dependency | 角色 |
| --- | --- |
| `src/utils/` | DOM helper、assist helper、date、csv、textarea height、transfer queue、keyCode 等共用工具。 |
| `src/mixins/` | `form`、`locale`、`globalConfig`、`link`、`emitter` 等跨 component 的行為抽取。 |
| `src/locale/` | locale data 與 i18n runtime；部分 component 透過 locale mixin 或 locale component 取得文案。 |
| `src/styles/` | Less source、component class 樣式、animation、common style、iconfont 與 style mixins。 |

這裡的重點是方向性：

```txt
components
  -> shared runtime helpers
  -> shared behavior mixins
  -> shared i18n source
  -> shared style source
```

components 可以使用 shared layers，但 shared layers 不應反向綁定某個具體 component。這讓共用工具、mixins、locale 與 styles 保持可重用，避免底層能力變成某個 component 的私有延伸。

## 4. `package.json` 的輸出方向

`package.json` 描述 package 對外輸出的主要入口，也描述 source 如何被 build 成可發布 artifacts。

```txt
package.json
  -> main: dist/viewuiplus.min.js
  -> typings: types/index.d.ts
  -> files: dist / src / types
  -> scripts
      -> build:prod -> vite.config.js -> src/index.js -> dist/viewuiplus.min.js
      -> build:style -> build/build-style.js -> src/styles/index.less -> dist/styles/viewuiplus.css
      -> build:lang -> build/vite.lang.config.js -> src/locale/lang/* -> dist/locale/*
```

| `package.json` 欄位或 script | 指向 | 架構意義 |
| --- | --- | --- |
| `main` | `dist/viewuiplus.min.js` | npm package 的 runtime bundle entry。 |
| `typings` | `types/index.d.ts` | TypeScript 使用者看到的 public type contract。 |
| `files` | `dist`、`src`、`types` | 發布 package 時保留 runtime artifacts、source 與 type declarations。 |
| `build:prod` | `vite build` | 以 `src/index.js` 作為 library entry，輸出 UMD / ES bundle 到 `dist/`。 |
| `build:style` | `build/build-style.js` | 編譯 `src/styles/index.less`，輸出 `dist/styles/viewuiplus.css` 與 fonts。 |
| `build:lang` | `build/vite.lang.config.js` | 讀取 `src/locale/lang/`，輸出各語系檔到 `dist/locale/`。 |

可以把這一段理解為 package 層的依賴：

```txt
source of truth
  -> src/index.js
  -> src/styles/index.less
  -> src/locale/lang/*
  -> types/index.d.ts

build and package metadata
  -> package.json
  -> vite.config.js
  -> build/build-style.js
  -> build/vite.lang.config.js

published artifacts
  -> dist/viewuiplus.min.js
  -> dist/viewuiplus.min.esm.js
  -> dist/styles/viewuiplus.css
  -> dist/locale/*
```

## 5. Runtime 與 Build 的邊界

依賴地圖中最容易混淆的是 `src/`、`types/`、`dist/` 的角色。它們都會被 package 使用者看到，但責任不同。

| 區塊 | 責任 | 不應混淆成 |
| --- | --- | --- |
| `src/` | runtime source of truth，包含 entry、components、directives、locale、styles source。 | 不等於最終發布 bundle。 |
| `types/` | public TypeScript contract，描述 install options、globalProperties、component declarations。 | 不負責 runtime 行為。 |
| `dist/` | build artifacts，包含 JS bundle、CSS、locale output、fonts。 | 不應作為修改架構行為的 source of truth。 |
| `build/` | build scripts，負責把 source 轉成 artifacts。 | 不應承載 component runtime logic。 |
| `package.json` | package metadata、entry fields、scripts 與發布檔案範圍。 | 不應承載具體 UI 行為。 |

所以主要方向應保持為：

```txt
src/ + types/
  -> build scripts
  -> dist/
  -> package publish surface
```

而不是從 `dist/` 回推或修改 component 行為。要理解實作，回到 `src/`；要理解使用者的型別感知，回到 `types/`；要理解發布結果，查看 `dist/` 與 build scripts。

## 6. 架構閱讀順序

如果用這張依賴圖閱讀 repo，可以採用下面順序：

1. 先看 `package.json`，確認 package entry、type entry、build scripts 與發布檔案範圍。
2. 再看 `src/index.js`，理解 runtime public surface 如何組成。
3. 接著看 `src/components/index.js`，確認 component export map。
4. 進入單一 `src/components/*`，追蹤它依賴哪些 `utils`、`mixins`、`locale` 與 styles。
5. 回到 `build/` 與 `vite.config.js`，理解 source 如何被輸出到 `dist/`。
6. 最後看 `types/index.d.ts`，對照 TypeScript 使用者看到的 public contract。

## 7. 與其他 Architecture Notes 的關係

- `03-architecture/01-overview.md`：說明 View UI Plus 作為 Vue 3 UI library 的整體架構總覽。
- `03-architecture/02-repository-structure.md`：說明 repo 目錄如何分工。
- `03-architecture/03-layer-model.md`：說明各 layer 的責任邊界與上下游關係。
- `03-architecture/04-runtime-composition.md`：聚焦 `src/index.js` 如何組成 plugin install、globalProperties、locale API 與 default API。
- 本篇：聚焦主要依賴方向，特別是 `src/index.js -> components/directives/locale`、`components -> utils/mixins/styles/locale`、`package.json -> build/types/dist`。
