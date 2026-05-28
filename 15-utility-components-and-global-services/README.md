# 15-utility-components-and-global-services

本目錄存放 View UI Plus 的工具型元件與全域服務分析。這一章不只看「某個元件如何渲染」，而是整理元件庫如何把提示、通知、載入、確認、複製、滾動、語系、全域設定與工具函數包裝成可跨頁面呼叫的能力。

建議在讀完插件系統、共用邏輯、回饋浮層與文字排版後進入本章，因為全域服務會同時牽涉 `app.config.globalProperties`、`createApp`、單例實例、DOM 掛載、timer、z-index、SSR guard、locale、TypeScript 宣告與業務封裝邊界。

## 閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [工具型能力與全域服務總覽](./01-utility-and-global-services-overview.md) | 建立 utility component、global service、plugin globalProperties、utils、locale 的分工 |
| 2 | [全域服務 API 形狀](./02-global-service-api-shape.md) | 分析 `$Message`、`$Notice`、`$Modal`、`$Spin`、`$Loading`、`$Copy`、`$ScrollTop`、`$ScrollIntoView` 的 API 形狀 |
| 3 | [Message、Notice 與 Loading 服務契約](./03-message-notice-loading-service-contract.md) | 從服務契約角度整理提示、通知、載入條與全螢幕 Spin |
| 4 | [Modal Confirm 與 ImagePreview 服務](./04-modal-confirm-and-image-preview-service.md) | 分析命令式 Modal、Confirm、ImagePreview 這類非模板呼叫服務 |
| 5 | [Copy 與 Scroll 工具服務](./05-copy-and-scroll-service.md) | 分析 Copy、ScrollTop、ScrollIntoView、BackTop、Affix 這類工具型互動能力 |
| 6 | [Locale、i18n 與全域設定](./06-locale-i18n-and-global-config-provider.md) | 整理 `locale`、`i18n`、`$VIEWUI`、`globalConfig`、`mixins/locale` 的設定讀取 |
| 7 | [Utils 作為公開設計啟發](./07-utils-as-public-design-inspiration.md) | 從 `assist`、`dom`、`date`、`csv`、`keyCode` 等整理工具函數設計原則 |
| 8 | [服務生命週期與單例模式](./08-service-lifecycle-and-singleton-pattern.md) | 分析 singleton instance、createApp/render、queue、timer、destroy 模式 |
| 9 | [全域服務型別系統](./09-type-system-for-global-services.md) | 對照 `types/index.d.ts` 與各服務 `.d.ts`，分析 globalProperties 型別補強與 API 漂移 |
| 10 | [工具服務設計檢查清單](./10-utility-service-design-checklist.md) | 建立仿寫 `$Permission`、`$Watermark`、`$Download` 等服務時的檢查流程 |

## 原始碼主線

主要對照這幾個位置：

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image-preview/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-top/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-into-view/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/back-top/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/affix/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/globalConfig.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/locale.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 本章邊界

本章聚焦「可跨頁面呼叫或可被多元件共享的工具能力」，不重複分析每個視覺元件的完整 UI 細節。

- `04-plugin-system/` 負責講 `install(app, opts)` 如何註冊元件、指令與全域屬性；本章只講服務被註冊後的 API 契約與使用方式。
- `05-shared-logic/` 負責講低層工具函數本身；本章只抽取對工具服務設計有啟發的模式。
- `12-feedback-and-overlays/` 負責講 Message、Notice、Modal、Spin、LoadingBar 的視覺互動；本章從命令式服務、生命週期、配置與跨頁使用角度整理。
- `14-typography-and-text/` 已分析 Typography 如何使用 Copy；本章分析 `$Copy` 作為獨立工具服務時的 DOM 操作與提示依賴。
- `16-directives/` 負責講 directive 生命週期；本章只在工具服務需要 DOM 行為時交叉提及。

## 學完後要能回答

- 全域服務和普通 Vue 元件的設計差異是什麼？
- `$Message.success()` 這類 API 為什麼適合命令式呼叫？
- Message、Notice、LoadingBar、Spin 的狀態模型有什麼差異？
- Modal confirm 和普通 `<Modal v-model>` 的控制權差在哪裡？
- `$VIEWUI`、`locale`、`i18n`、`globalConfig` 分別解決什麼問題？
- Copy、ScrollTop、ScrollIntoView 這類工具型能力為什麼適合掛到全域？
- 全域服務如何避免重複實例、timer 泄漏、DOM 殘留或 SSR 崩潰？
- TypeScript 如何讓 `this.$Message`、`this.$Loading` 這類全域屬性可被辨識？
- 如果要仿寫一個 `$Permission`、`$Watermark` 或 `$Download` 服務，應該檢查哪些 API 與生命週期問題？
