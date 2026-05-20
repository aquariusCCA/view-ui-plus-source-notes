# Repository Structure（倉庫結構）

這篇從架構角度解釋 View UI Plus repo 的主要目錄分工。它和 `00-roadmap/01-source-map.md` 的差別是：`source map` 回答「東西在哪裡」，這篇回答「為什麼 repo 要分成這些責任區」。

View UI Plus 是一個提供給 npm 使用者安裝的 Vue 3 `component library`（元件函式庫），所以 repo 裡不只需要放 `source code`（原始碼）。它還需要維護 `runtime` 實作、`type contract`（型別契約）、`build` 流程、`distribution artifacts`（發佈產物），以及可以模擬使用者情境的 `examples`。這些責任被拆到不同目錄，是為了讓每一層的輸入、輸出和消費者都清楚。

## 1. 為什麼 Repo 要這樣拆分

一個 UI `component library` 的 repo，通常不是只按「檔案種類」拆目錄，而是按 package 生命週期拆責任。先有可維護的 source 和 type contract，再透過 build 產出 dist；`examples/` 則從使用者視角回頭驗證 source 與 types 是否正確。

產出 package 的主流程可以看成：

```txt
Author-maintained source
┌────────────┐    ┌────────────┐
│   src/     │    │  types/    │
│ runtime    │    │ public TS  │
│ behavior   │    │ contract   │
└─────┬──────┘    └─────┬──────┘
      │                 │
      └────────┬────────┘
               v
        ┌────────────┐
        │  build/    │
        │ packaging  │
        │ rules      │
        └─────┬──────┘
              v
        ┌────────────┐
        │  dist/     │
        │ published  │
        │ artifacts  │
        └─────┬──────┘
              v
        npm / browser consumers
```

`examples/` 不是發佈流程的下一站，而是開發時的回饋迴路：

```txt
Development feedback loop
┌────────────┐
│ examples/  │
│ consumer   │
│ simulation │
└─────┬──────┘
      │ verifies usage, behavior, style, locale
      v
┌────────────┐    ┌────────────┐
│   src/     │    │  types/    │
└────────────┘    └────────────┘
```

換句話說，這個分層的重點不是目錄名稱，而是責任邊界：

- `src/` 是可維護的 `runtime source`，也就是實際執行行為的原始碼。
- `types/` 是提供給 TypeScript 使用者的 `public type contract`，也就是對外承諾的型別形狀。
- `build/` 是 `build strategy`（建置策略），負責把 source 轉成 package 可以交付的形式。
- `dist/` 是 `build output`，也就是 npm package 或 browser/CDN 使用者會讀到的發佈產物。
- `examples/` 是從 `consumer side`（使用者視角）驗證 library 的環境，不屬於 library runtime 本體。

## 2. 目錄責任分工

| 目錄 | 架構角色 | 主要輸入 | 主要輸出 | 主要消費者 |
| --- | --- | --- | --- | --- |
| `src/` | `runtime implementation layer`，執行期實作層 | component、directive、locale、style、utils source | library 的 runtime 行為 | build process、原始碼閱讀者 |
| `types/` | `public type contract layer`，公開型別契約層 | 手寫 `.d.ts` declarations | `typings` 入口與 component 型別 | TypeScript users、IDE |
| `build/` | `build orchestration layer`，建置流程編排層 | `src/styles/`、`src/locale/lang/` 等 source | CSS、fonts、locale artifacts | package scripts |
| `dist/` | `distribution artifact layer`，發佈產物層 | Vite/Gulp build output | UMD bundle、ESM bundle、CSS、locale files | npm consumers、browser/CDN users |
| `examples/` | `consumer simulation layer`，使用者情境模擬層 | example app、demo routes | 可互動的開發驗證場景 | library maintainers、demo readers |

這些目錄放在同一個 repo，是因為它們共同描述一個 package 的完整生命週期。但它們不是同一種東西：`src/` 是作者維護的來源，`types/` 是使用者看到的型別承諾，`dist/` 是 build 後交付出去的結果。

## 3. `src/`：Runtime Source 邊界

`src/` 是 View UI Plus 的 `runtime` 核心。`src/index.js` 是 library 的 `runtime entry`，負責組合 components、directives、locale、global config 和 imperative APIs；`src/components/`、`src/directives/`、`src/locale/`、`src/styles/`、`src/utils/`、`src/mixins/` 則承擔具體功能。

從架構上看，`src/` 的責任是回答：

- 這個 library 在 Vue app 裡實際提供哪些 runtime 能力？
- component 如何被 export、install，以及全域註冊？
- locale、directive、globalProperties 這些跨 component 能力如何接入？
- style source 如何和 component class name、Less token 對應？

因此 `src/` 不只是 component 檔案集合，而是 package runtime 的組合層。閱讀 architecture 時，應先從 `src/index.js` 看 `public runtime surface`（公開執行期介面），再往 `src/components/` 和 shared layers 展開。

## 4. `types/`：Public Type Contract 邊界

`types/` 放的是 TypeScript `declaration files`（宣告檔）。`package.json` 的 `typings` 指向 `types/index.d.ts`，表示 TypeScript 使用者和 IDE 會把這裡當成 package 的型別入口。

這個目錄獨立存在，代表 View UI Plus 把 `runtime implementation` 和 `public type contract` 分開處理：

- `src/` 決定執行期行為。
- `types/` 描述使用者可以依賴的 API shape。
- `types/index.d.ts` 對應 plugin install options、global properties 和 named exports。
- `types/viewuiplus.components.d.ts` 對應 component declarations。

這樣分的代價是 runtime 和 declarations 需要同步維護；好處是 package 對 TypeScript 使用者的入口很清楚，也不需要從每個 Vue SFC 自動推導完整 public API。

## 5. `build/`：Build Strategy 邊界

`build/` 放的是專門用來生成發佈產物的 scripts。它不是 runtime source，而是把 source 轉成 artifacts 的規則集合。

在這個版本中，build responsibility 可以拆成幾條線：

- root `vite.config.js` 以 `src/index.js` 作為 library entry，輸出 `dist/viewuiplus.min.js` 和 `dist/viewuiplus.min.esm.js`。
- `build/build-style.js` 從 `src/styles/index.less` 產出 `dist/styles/viewuiplus.css`，並複製 iconfont fonts。
- `build/vite.lang.config.js` 掃描 `src/locale/lang/`，將各語系輸出到 `dist/locale/`。

這個拆分讓 build scripts 專注在產物生成，而不污染 runtime implementation。想理解「package 怎麼被做出來」時，應看 `build/`、root build config 和 `package.json` scripts；想理解「component 怎麼運作」時，應回到 `src/`。

## 6. `dist/`：Distribution Artifact 邊界

`dist/` 是 `build output`，也是 `package.json` 的 `main` 指向的位置。對 package 消費者來說，這裡是可直接載入的 JavaScript、CSS、locale 和 font artifacts。

`dist/` 的架構角色是交付，不是設計來源：

- `dist/viewuiplus.min.js` 是 UMD bundle，支援傳統 bundle 或 browser global 使用情境。
- `dist/viewuiplus.min.esm.js` 是 ES module bundle，支援 modern bundler 使用情境。
- `dist/styles/` 是編譯後 CSS 和 fonts。
- `dist/locale/` 是個別語系的可載入 output。

因此閱讀 `dist/` 時，要把它視為「build 結果」。如果要分析原始設計、命名、依賴方向，應回到 `src/` 和 `build/`；如果要確認 package 最終交付了什麼，才看 `dist/`。

## 7. `examples/`：Consumer Simulation 邊界

`examples/` 是開發與驗證用的 example app。它提供 routes、demo components、入口 `main.js` 和 `app.vue`，用接近使用者的方式載入並操作 View UI Plus。

這個目錄的價值在於它站在 `consumer side`：

- 驗證 component 是否能在真實 Vue app 中使用。
- 提供 component 行為、樣式、互動狀態的觀察入口。
- 暴露 integration 問題，例如 plugin install、global component registration、style loading、locale usage。

但 `examples/` 不應被當成 public API 的來源。它可以幫助理解 API 怎麼被使用，不能單獨證明 API contract；真正的 runtime contract 要回到 `src/index.js`、`src/components/index.js` 和 `types/`。

## 8. Source、Contract、Artifact 的差異

這個 repo 最容易混淆的三層是 `src/`、`types/`、`dist/`：

| Layer | 回答的問題 | 目錄 | 判讀方式 |
| --- | --- | --- | --- |
| Source | library 怎麼實作？ | `src/` | 看 runtime entry、components、shared utilities |
| Contract | 使用者能依賴什麼型別？ | `types/` | 看 `typings` 入口與 declarations |
| Artifact | package 最後交付什麼？ | `dist/` | 看 build output 與 `main` 指向 |

三者可能描述同一個能力，但層級不同。以 component 為例：實作在 `src/components/`，型別在 `types/`，打包後的可載入程式碼在 `dist/`。閱讀架構時要先確認自己正在看的層級，否則容易把 generated output 誤當成設計來源，或把 examples 裡的使用方式誤當成完整 contract。

## 9. 建議閱讀順序

建議用這條順序理解 repo 結構：

1. 先看 `package.json`：確認 `main`、`typings`、`files` 和 build scripts。
2. 再看 `src/index.js`：理解 library runtime entry 和 plugin install surface。
3. 進入 `src/components/`：理解 component export 與具體實作。
4. 看 `types/index.d.ts`：確認 TypeScript 使用者看到的 public contract。
5. 看 `build/` 和 root build config：理解 JS、style、locale 如何被輸出。
6. 最後看 `dist/`：確認 package 實際交付 artifacts。
7. 用 `examples/` 回頭驗證使用情境，而不是從 examples 反推所有設計。

## 10. 和其他筆記的分工

- `00-roadmap/01-source-map.md`：偏索引，協助快速定位 entry points 和後續閱讀路線。
- `03-architecture/01-overview.md`：偏 runtime architecture，說明 plugin install、public API shape 和 dependency direction。
- 本篇：偏 repository architecture，說明主要目錄為什麼被拆成不同責任區，以及閱讀時如何區分 source、contract、artifact。
