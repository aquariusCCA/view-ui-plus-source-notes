# Type System

本區用來整理 View UI Plus 的 TypeScript 型別設計。

View UI Plus v1.3.20 的元件實作主要是 Vue SFC / JavaScript Options API，TypeScript 對外契約則集中在 `types/*.d.ts`。因此本區的閱讀重點不是「元件內部如何用 TypeScript 寫成」，而是：

- runtime 的 `props`、`emits`、slots、methods 如何被整理成 declaration file。
- `types/index.d.ts` 如何成為 package 的型別入口。
- component named exports 如何對應 `types/viewuiplus.components.d.ts`。
- plugin install、globalProperties、imperative APIs 如何被 TypeScript 承認。
- 哪些型別目前是精準契約，哪些仍是 `any` / `Function` 這類弱契約。
- 如果要用現代 TypeScript 重構，可以在哪些資料型元件導入泛型。

## Source Baseline

| 項目 | 內容 |
| --- | --- |
| Package | `view-ui-plus` |
| Version | `1.3.20` |
| Source root | `01-origin/source/view-ui-plus-v1.3.20/` |
| Type entry | `types/index.d.ts` |
| Component registry types | `types/viewuiplus.components.d.ts` |
| Component declarations | `types/*.d.ts` |
| Runtime components | `src/components/**` |
| Runtime plugin entry | `src/index.js` |

## 筆記索引

| 筆記 | 主題 |
| --- | --- |
| `01-type-system-overview.md` | 建立 runtime source 與 `.d.ts` type surface 的整體地圖。 |
| `02-component-props-contract.md` | 分析 component props 如何在 `DefineComponent<{ ... }>` 中表達。 |
| `03-emits-and-v-model-types.md` | 分析 emits、`v-model`、`onOnChange` 事件監聽器型別。 |
| `04-component-instance-and-ref-api.md` | 理解 component instance、template ref、method exposure 的型別邊界。 |
| `05-global-plugin-types.md` | 分析 `install` options、`$VIEWUI`、`ComponentCustomProperties`。 |
| `06-public-component-registry.md` | 解析 `types/viewuiplus.components.d.ts` 的 component export registry。 |
| `07-table-and-form-as-type-case-studies.md` | 用 Table 與 Form 觀察複雜元件的型別取捨。 |
| `08-overlay-and-imperative-api-types.md` | 分析 Modal、Message、Notice 等命令式 API 的型別形狀。 |
| `09-generic-design-opportunities.md` | 標記可泛型化的改良設計機會。 |
| `10-type-system-boundaries-and-tradeoffs.md` | 總結這套型別系統的邊界、成本與取捨。 |
| `11-type-reading-checklist.md` | 提供閱讀單一元件型別時的檢查清單。 |
| `12-mini-reimplementation-labs.md` | 用小型仿作練習驗證 props、emits、plugin、泛型設計。 |

## 閱讀主線

建議先照以下順序讀：

```txt
01 overview
  -> 02 props
  -> 03 emits / v-model
  -> 04 instance / ref
  -> 05 plugin global types
  -> 06 component registry
  -> 07 Table / Form cases
  -> 08 imperative APIs
  -> 09 generic opportunities
  -> 10 boundaries
  -> 11 checklist
  -> 12 labs
```

核心心智模型是：

```txt
src/**/*.vue / src/**/*.js
  -> runtime behavior

types/*.d.ts
  -> TypeScript public contract

兩者需要對照閱讀，不應任選一邊作為完整事實。
```

