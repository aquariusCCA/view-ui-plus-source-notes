# Source Map 原始碼地圖

這份筆記是 View UI Plus 原始碼閱讀的第一張地圖。它只整理 entry points（入口）、目錄角色、public surface（對外介面）與後續閱讀路線，不深入分析單一 component（元件）或架構取捨。

View UI Plus 是一套 Vue 3 UI component library。閱讀原始碼時，先把它拆成幾個大面向：可重用 UI components、Vue plugin install（外掛安裝）、directives、locale/i18n、Less styles、TypeScript declarations，以及 build/release 產物。這份 source map 只負責指出這些面向分別從哪裡開始讀。

## 1. Source Baseline 來源基準

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Source path | `01-origin/source/view-ui-plus-v1.3.20/` |
| Package manifest | `01-origin/source/view-ui-plus-v1.3.20/package.json` |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` |
| Type entry | `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts` |

## 2. Package Entry Points 套件入口

`package.json` 定義 npm package 對外暴露的主要入口。

| 欄位 | 值 | 說明 |
| --- | --- | --- |
| `main` | `dist/viewuiplus.min.js` | 發布後的 runtime bundle |
| `typings` | `types/index.d.ts` | TypeScript 型別入口 |
| `files` | `dist`, `src`, `types` | npm package 會包含的主要內容 |

也就是說，發布後使用者主要消費 `dist/` 與 `types/`，但讀碼時應回到 `src/` 理解 runtime 與 component 實作。`package.json` 則把這三者串成 npm package 的對外形狀。

重要 scripts：

| Script | Command | 用途 |
| --- | --- | --- |
| `dev` | `vue-cli-service serve` | 啟動開發或範例環境 |
| `build` | `npm run build:prod && npm run build:style && npm run build:lang` | 完整 build 流程 |
| `build:prod` | `vite build` | 建置 JavaScript bundle |
| `build:style` | `gulp --gulpfile build/build-style.js` | 建置樣式檔 |
| `build:lang` | `vite build --config build/vite.lang.config.js` | 建置語系包 |
| `lint` | `vue-cli-service lint --fix` | 執行 lint 並自動修正 |

建置相關來源主要分散在 `build/`、`vite.config.js`、`vue.config.js` 與 `package.json` scripts；這份筆記只標出入口，細節分流到 build/release 筆記。

## 3. Runtime Entry Map 執行期入口地圖

`src/index.js` 是全量安裝與對外 API 的核心 runtime entry。

主要流程：

1. 從 `./components` 匯出所有 component API。
2. 匯入 `components`，建立全量註冊用的 `ViewUI` 物件。
3. 匯入 locale、directives、dayjs 與 package version。
4. 在 `install(app, opts)` 中註冊 components 與 directives。
5. 在 `app.config.globalProperties` 上掛載 global config（全域設定）與 imperative APIs（命令式 API）。
6. 匯出 `version`、`locale`、`i18n`、`lang` 與 default `API`。

`install(app, opts)` 的主要責任：

| 責任 | 說明 |
| --- | --- |
| Locale setup | `opts.locale` 交給 `localeFile.use()`；`opts.i18n` 交給 `localeFile.i18n()` |
| Component registration | 透過 `Object.keys(ViewUI).forEach(key => app.component(key, ViewUI[key]))` 註冊全量 components |
| Directive registration | 註冊 `display`、`width`、`height`、`resize`、`line-clamp` 等 directives |
| Global config | 建立 `$VIEWUI`，保存 size、transfer、component icon/config 等全域選項 |
| Imperative APIs | 掛載 `$Spin`、`$Loading`、`$Message`、`$Notice`、`$Modal` 等 API |
| Date helper | 掛載 `$Date = dayjs` |

## 4. Source Directory Map 原始碼目錄地圖

| 路徑 | 角色 | 後續筆記 |
| --- | --- | --- |
| `src/components/` | components 與 service API 主體 | `07-components/`, `08-overlay-system/`, `09-form-system/`, `10-imperative-api/` |
| `src/directives/` | Vue directives | `11-directives/` |
| `src/locale/` | 語系與 i18n | `03-architecture/`, `20-supplements/` |
| `src/mixins/` | 共用 mixins | `03-architecture/`, `05-composables/` |
| `src/styles/` | Less style system（樣式系統） | `12-style-system/` |
| `src/utils/` | 共用 utilities（工具函式） | `03-architecture/`, `05-composables/` |
| `types/` | 對外 TypeScript declarations（型別宣告） | `06-type-system/` |
| `build/` | build scripts（建置腳本） | `14-build-release/` |
| `dist/` | 發布後 JS、CSS 與 locale 產物 | `14-build-release/` |
| `examples/` | 文件與範例入口 | `17-demos/` |
| `test/` | 測試 | `13-testing/` |

根目錄的 `package.json`、`vite.config.js`、`vue.config.js` 是 build 與 package 行為的入口；如果只是理解 runtime，通常先讀 `src/index.js` 與 `src/components/index.js` 即可。

## 5. Public Surface Map 對外介面地圖

public surface 指的是「套件使用者能直接接觸到的 API 邊界」。讀原始碼時，可以先用這張表判斷：哪些檔案是在定義對外用法，哪些只是內部實作細節。

| 對外入口 | 使用者看到的形式 | 原始碼起點 | 讀碼重點 |
| --- | --- | --- | --- |
| Vue plugin install（外掛安裝） | `app.use(ViewUIPlus, options)` | `src/index.js` | 全量安裝流程如何啟動，包括註冊元件、指令、全域設定與服務 API |
| Named component exports | `import { Button } from 'view-ui-plus'` | `src/components/index.js` | 哪些元件支援單獨匯入，以及匯出名稱如何對應到 component |
| Global components | 安裝後可在 template 使用元件 | `install()` in `src/index.js` | `install()` 如何把所有元件註冊到 Vue app |
| Global config | `$VIEWUI` | `src/index.js` | 全域 `size`、`transfer` 與各 component 預設選項如何保存 |
| Imperative APIs | `$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading` | `src/index.js` 與 `src/components/` | 這類不用寫 component、直接呼叫的方法如何掛到 app 上；細節放到 `10-imperative-api/` |
| Directives | `display`、`width`、`height`、`resize`、`line-clamp` 等 | `src/directives/` 與 `src/index.js` | directive 從哪裡定義，並如何在 install 時註冊；細節放到 `11-directives/` |
| Type declarations | TypeScript import 與 IDE 型別提示 | `types/index.d.ts` | 對外 API 的型別入口；細節放到 `06-type-system/` |
| Locale APIs | `locale`、`i18n`、`lang` | `src/index.js` 與 `src/locale/` | 語系與 i18n API 如何被匯出與初始化 |

## 6. Suggested Reading Route 建議閱讀路線

建議先照這個順序讀，避免一開始就陷入單一 component 的實作細節。

1. `package.json`
2. `src/index.js`
3. `src/components/index.js`
4. 選一個簡單 component，例如 `button`
5. 選一個複合或狀態較多的 component，例如 `input`、`select`、`form`、`table` 或 `modal`
6. `types/index.d.ts`
7. `types/viewuiplus.components.d.ts`
8. `src/styles/` 的樣式入口
9. `src/locale/`、`src/utils/`、`src/mixins/` 的共用支撐
10. `build/` 與 root config 的建置設定

## 7. Boundaries 邊界

這份 source map 只回答「入口在哪、模組怎麼分、後續要讀哪裡」。以下內容不要寫在這份檔案中：

- 不分析 component 內部 props、events、slots。
- 不評論架構優缺點。
- 不重寫完整 API 表。
- 不追蹤每個 component 的實作細節。

深入分析應分流到對應主題筆記，避免這份索引變成大型雜記。
