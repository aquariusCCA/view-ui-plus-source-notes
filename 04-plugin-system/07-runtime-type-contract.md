# Runtime Type Contract

本篇對照 plugin runtime surface 與 TypeScript declaration。核心 sources 是 `01-origin/source/view-ui-plus-v1.3.20/src/index.js` 與 `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`。

## 1. Runtime Surface

`src/index.js` 對外提供：

| Runtime surface | Source |
| --- | --- |
| named component exports | `export * from './components'` |
| plugin install | `export const install = function(app, opts = {})` |
| version | `export const version = pkg.version` |
| locale API | `export const locale = localeFile.use` |
| i18n API | `export const i18n = localeFile.i18n` |
| lang API | `export const lang = (code) => { ... }` |
| default export | `API` object with `install`, locale APIs, version, and components |
| instance properties | `app.config.globalProperties.$...` inside install |

## 2. Type Entry

`types/index.d.ts` 對應的主要型別內容：

| Type surface | Meaning |
| --- | --- |
| `export * from './viewuiplus.components'` | component named exports 的型別入口 |
| `ViewUIPlusGlobalOptions` | `$VIEWUI` 與 install options 的主要 config shape |
| `ViewUIPlusInstallOptions` | install options，繼承 global options 並加入 `locale`、`i18n` |
| `ComponentCustomProperties` augmentation | 宣告 `this.$VIEWUI`、`this.$Message`、`this.$Modal` 等 |
| `export const install` | 宣告 plugin install signature |

## 3. Runtime and Type Alignment

| Runtime behavior | Type coverage | Note |
| --- | --- | --- |
| `install(app, opts)` | `export const install: (app: App, options?: ViewUIPlusInstallOptions) => void` | install signature 有對應 |
| `$VIEWUI` | `$VIEWUI: ViewUIPlusGlobalOptions` | config shape 有對應，但 fallback value 是 runtime detail |
| `$Spin`, `$Message`, `$Modal` 等 | declared as `any` | property 存在有對應，method-level typing 不完整 |
| `$Date = dayjs` | `$Date: any` | property 存在有對應，dayjs 型別未精確化 |
| `locale`, `i18n`, `lang` named exports | 未在 `types/index.d.ts` 明確宣告 | runtime 有 export，但 type entry 主要只宣告 install 與 components |
| `version` named export | 未在 `types/index.d.ts` 明確宣告 | runtime 有 export，type surface 可能不足 |
| default `API` object | 未在 `types/index.d.ts` 明確宣告 default shape | package default usage 依賴 JS runtime 與 Vue plugin inference |

## 4. Important Gap

目前 `types/index.d.ts` 沒有完整描述 `src/index.js` 的所有 named exports。最明顯的是：

- `version`
- `locale`
- `i18n`
- `lang`
- default export `API`

這不一定代表使用者一定會遇到錯誤，因為 package type resolution 可能還透過其他 declaration 檔案提供部分資訊；但從 `types/index.d.ts` 單檔來看，plugin-level named APIs 沒有完整宣告。

## 5. Maintenance Rule

修改 plugin runtime 時，應同步檢查：

- 新增 install option 時，是否更新 `ViewUIPlusGlobalOptions` 或 `ViewUIPlusInstallOptions`。
- 新增 `globalProperties` 時，是否更新 `ComponentCustomProperties`。
- 新增 named export 時，是否需要在 type entry 宣告。
- 更改 `$VIEWUI` fallback semantics 時，是否需要補文件或型別註解。

## 6. Boundary

本篇只對照 plugin-level runtime/type contract，不展開每個 component 的 props type。component 型別應放在 `06-type-system/` 或各 component 筆記。

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `06-type-system/`
- `22-appendix/`
