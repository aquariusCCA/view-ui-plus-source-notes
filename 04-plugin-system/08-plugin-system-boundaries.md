# Plugin System Boundaries

本篇收束 `04-plugin-system` 的閱讀邊界，避免 plugin 章節和 component、directive、service、type、build 章節互相重複。

## 1. What This Chapter Owns

`04-plugin-system` 主要擁有 `src/index.js` 的 runtime orchestration：

| Owned topic | Why it belongs here |
| --- | --- |
| `app.use(ViewUIPlus, options)` | Vue plugin 的主要入口 |
| `install(app, opts)` sequence | plugin 安裝流程 |
| `ViewUI` component map | plugin 決定哪些 component 被全域註冊 |
| `directives` map | plugin 決定哪些 directive 被全域註冊 |
| `$VIEWUI` config | install options 被轉成 Vue instance global config |
| `globalProperties` | plugin 暴露 instance-level service APIs |
| locale install contract | `opts.locale`、`opts.i18n`、`locale/i18n/lang` runtime API |
| runtime/type contract | `src/index.js` 與 `types/index.d.ts` 的 plugin-level 對照 |

## 2. What This Chapter Does Not Own

| Topic | Owning chapter |
| --- | --- |
| 單一 component props/events/slots | `07-components/` |
| overlay DOM、z-index、Teleport、Popper 行為 | `08-overlay-system/` |
| form validation 與 Form/FormItem coordination | `09-form-system/` |
| `$Message`、`$Notice`、`$Modal.confirm` 的 service internals | `10-imperative-api/` |
| directive hook 與 DOM 操作細節 | `11-directives/` |
| Less variables、class naming、theme token | `12-style-system/` |
| package build、locale bundle build、release scripts | `14-build-release/` |
| component declaration tables | `06-type-system/` 與 `22-appendix/` |

## 3. Reading Route

建議閱讀順序：

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

讀完 plugin system 後，再依目的分流：

| If you need to understand | Continue to |
| --- | --- |
| component implementation | `07-components/` |
| service-style APIs | `10-imperative-api/` |
| directives | `11-directives/` |
| install options typing | `06-type-system/` |
| locale bundle build | `14-build-release/` |

## 4. Source Anchors

本章主要 source anchors：

| Source | Used for |
| --- | --- |
| `src/index.js` | plugin install、ViewUI map、directives map、globalProperties、locale exports |
| `src/components/index.js` | component named export list |
| `types/index.d.ts` | install options、global options、ComponentCustomProperties |
| `src/locale/index.js` | locale behavior 的下一層 source |
| `src/directives/*` | directive behavior 的下一層 source |

## 5. Maintenance Checklist

當 source 變更時，用這份 checklist 更新 plugin 筆記：

- `src/index.js` 新增 install step：更新 `01-install-flow.md`。
- `ViewUI` map 新增 alias：更新 `02-component-registration.md`。
- `directives` map 新增 key：更新 `03-directive-registration.md`。
- `$VIEWUI` 新增或改 fallback：更新 `04-global-options-and-viewui-config.md` 和 `07-runtime-type-contract.md`。
- `globalProperties` 新增 API：更新 `05-global-properties.md` 和 `types/index.d.ts` 對照。
- locale export 或 `lang(code)` 改變：更新 `06-locale-plugin-contract.md`。

## Related Notes

- `03-architecture/01-overview.md`
- `03-architecture/06-public-surface.md`
- `06-type-system/`
- `10-imperative-api/`
- `11-directives/`
