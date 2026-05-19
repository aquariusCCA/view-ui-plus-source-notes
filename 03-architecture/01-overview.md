# Architecture Overview 整體架構總覽

這份筆記整理 View UI Plus 作為 Vue 3 UI library 的整體架構骨架。它承接 `00-roadmap/01-source-map.md`，但不重複做閱讀路線；重點是理解 package entry、runtime composition（執行期組裝）、Vue plugin install flow（外掛安裝流程）與 public API shape（對外 API 形狀）。

這篇只看整體結構，不深入單一 component 的 props、events、slots 或內部實作。component、type、style、directive、build 等細節會分流到後續主題筆記。

讀完這篇應該能回答三件事：View UI Plus 如何被 Vue app 安裝、`src/index.js` 如何把 components 與全域能力組裝成 library API，以及各層程式碼應該分流到哪些後續筆記。

## 1. Architecture at a Glance 架構概覽

View UI Plus 的主要組裝路線可以先理解成：

```txt
package.json
  -> src/index.js
    -> src/components/index.js
    -> install(app, opts)
      -> Vue app runtime
```

如果用職責分層來看，則可以理解成：

```txt
使用者層
  -> 入口安裝層
    -> 組件層
      -> 共用能力層
        -> 樣式系統層
          -> 型別與發佈層
            -> 建置工程層
```

核心組成如下：

| 組成 | 來源 | 角色 |
| --- | --- | --- |
| Package entry | `package.json` | 定義 runtime bundle、TypeScript 型別入口與 build scripts |
| Runtime entry | `src/index.js` | 組裝 components、directives、locale、global config 與 imperative APIs |
| Components | `src/components/index.js`, `src/components/*` | 對外匯出與實作各 UI components |
| Directives | `src/directives/*` | 提供 Vue directives，例如尺寸、樣式、resize、line-clamp |
| Locale/i18n | `src/locale/*` | 處理語系切換與 i18n 整合 |
| Global config | `$VIEWUI` | 保存全域設定，例如 size、transfer 與各 component 的 icon/config |
| Imperative APIs | `$Message`, `$Notice`, `$Modal`, `$Spin`, `$Loading` 等 | 提供命令式 API，讓使用者可透過 instance globalProperties 呼叫 |
| Styles | `src/styles/*` | Less style system（樣式系統） |
| Types | `types/*` | TypeScript declarations（型別宣告） |

## 2. Runtime Composition 執行期組裝

`src/index.js` 是 View UI Plus 的 runtime entry。它不是單一 component 的實作檔，而是 library runtime 的組裝層。

主要責任：

1. 透過 `export * from './components'` 對外暴露 named component exports。
2. 透過 `import * as components from './components'` 收斂所有 components。
3. 建立 `ViewUI` 物件，作為全量註冊 components 的來源。
4. 匯入 locale、directives、dayjs 與 package version。
5. 定義 `install(app, opts)`，作為 Vue plugin install 入口。
6. 建立 default `API`，對外提供 `install`、`version`、`locale`、`i18n`、`lang` 與所有 components。

`ViewUI` 除了展開 `components`，也額外建立部分 `i` 前綴 alias，例如 `iButton`、`iForm`、`iInput`、`iTable`。這代表全量註冊時，同一個 component 可能會同時有標準名稱與相容名稱。

## 3. Vue Plugin Install Flow

使用者通常會透過以下形式安裝：

```js
app.use(ViewUIPlus, options)
```

這會進入 `src/index.js` 裡的 `install(app, opts)`。

`install(app, opts)` 的執行重點如下：

| 階段 | 行為 |
| --- | --- |
| 防止重複安裝 | 若 `install.installed` 已存在，直接 return |
| Locale setup | 若有 `opts.locale`，呼叫 `localeFile.use(opts.locale)` |
| i18n setup | 若有 `opts.i18n`，呼叫 `localeFile.i18n(opts.i18n)` |
| Component registration | 遍歷 `ViewUI`，用 `app.component(key, ViewUI[key])` 全量註冊 |
| Directive registration | 遍歷 directives，使用 `app.directive(key, directives[key])` 註冊 |
| Global config | 寫入 `app.config.globalProperties.$VIEWUI` |
| Imperative APIs | 寫入 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等 |
| Date helper | 寫入 `$Date = dayjs` |

這個流程表示 View UI Plus 的 Vue plugin layer（外掛層）同時負責三件事：全量註冊 components、注入全域設定、提供命令式服務 API。

## 4. Layer Map 分層地圖

| Layer | Path | 責任 | 後續分流 |
| --- | --- | --- | --- |
| Package layer | `package.json` | 宣告 npm package 入口、型別入口、建置命令 | `14-build-release/01-build-map.md` |
| Runtime entry layer | `src/index.js` | 組裝並對外暴露 library API | `04-plugin-system/01-install-flow.md` |
| Component export layer | `src/components/index.js` | 集中 export 所有 components | `07-components/01-components-map.md` |
| Component implementation layer | `src/components/*` | 實作各 component 與 service API | `07-components/`, `08-overlay-system/`, `09-form-system/`, `10-imperative-api/` |
| Directive layer | `src/directives/*` | 實作 Vue directives | `11-directives/01-directives-map.md` |
| Locale layer | `src/locale/*` | 處理 locale 與 i18n | 後續可獨立成 locale 筆記 |
| Shared layer | `src/mixins/*`, `src/utils/*` | 提供共用 mixins 與 utilities | `05-composables/` 或 architecture 補充 |
| Style layer | `src/styles/*` | 管理 Less 樣式入口與樣式模組 | `12-style-system/01-style-entry-map.md` |
| Type layer | `types/*` | 提供 TypeScript declarations | `06-type-system/01-type-entry-map.md` |
| Build layer | `build/*` | 定義 build、style、lang 相關流程 | `14-build-release/01-build-map.md` |

這裡的 layer map 只描述責任邊界。components 的 props、emits、slots，styles 的變數與 class 命名，以及 build output 都應留給後續主題筆記。

## 5. Public API Shape 對外 API 形狀

View UI Plus 對使用者暴露的 API 可以分成幾類。

| API 類型 | 使用形式 | 來源 |
| --- | --- | --- |
| Vue plugin install | `app.use(ViewUIPlus, options)` | default export 的 `install` |
| Named imports | `import { Button } from 'view-ui-plus'` | `export * from './components'` |
| Global components | template 中直接使用已註冊 component | `install()` 全量註冊 |
| Global config | `this.$VIEWUI` 或 instance globalProperties | `app.config.globalProperties.$VIEWUI` |
| Imperative APIs | `this.$Message`, `this.$Modal`, `this.$Notice` 等 | `app.config.globalProperties` |
| Locale APIs | `locale`, `i18n`, `lang` | `src/index.js` named exports |
| Type declarations | component props、instance 與 plugin options 的型別 | `types/index.d.ts`, `types/viewuiplus.components.d.ts` |

這裡的重點不是列出全部 components，而是先理解 library 對外暴露的幾種型態：plugin、named exports、global registration、globalProperties、type declarations。

## 6. Dependency Direction 依賴方向

View UI Plus 的架構可以用幾條主要依賴方向掌握：

```txt
src/index.js
  -> src/components/
  -> src/directives/
  -> src/locale/
  -> package.json version

src/components/
  -> src/utils/
  -> src/mixins/
  -> src/locale/
  -> src/styles/

src/styles/
  -> animation/
  -> common/
  -> components/
  -> mixins/

package.json
  -> build scripts
  -> dependencies
  -> main
  -> typings
```

也就是說，`src/index.js` 是 runtime 的組裝點；`components` 是 UI 與 service API 的主體；`utils`、`mixins`、`directives`、`locale` 是共用支撐；`styles` 管理視覺樣式；`types`、`dist` 與 `build` 則把原始碼整理成對外可消費的 package。

## 7. Follow-up Architecture Notes 後續分流

| 主題 | 目標檔案 |
| --- | --- |
| Vue plugin install flow | `04-plugin-system/01-install-flow.md` |
| TypeScript declarations | `06-type-system/01-type-entry-map.md` |
| Components map | `07-components/01-components-map.md` |
| Overlay components | `08-overlay-system/01-overlay-map.md` |
| Form system | `09-form-system/01-form-map.md` |
| Imperative APIs | `10-imperative-api/01-global-services-map.md` |
| Directives | `11-directives/01-directives-map.md` |
| Style system | `12-style-system/01-style-entry-map.md` |
| Build/release | `14-build-release/01-build-map.md` |

## 8. Reading Boundaries 閱讀邊界

這份 overview 只建立架構理解，不處理以下內容：

- 不展開每個 component 的 props、events、slots。
- 不分析每個 service API 的實作細節。
- 不完整整理 TypeScript declarations。
- 不追蹤 Less 變數、class 命名與 theme token。
- 不分析 build output 或 release 流程。

如果後續閱讀時發現這篇內容開始變成細節清單，應把內容移到對應主題資料夾，讓 `03-architecture/01-overview.md` 維持「整體架構總覽」的角色。

一句話總結：View UI Plus 以 `src/index.js` 作為安裝與 API 組裝入口，向下收斂 components、directives、locale、styles 與 shared utilities，向外透過 plugin、named exports、globalProperties、types 與 build artifacts 提供 Vue 3 UI library。
