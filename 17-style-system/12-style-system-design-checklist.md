# 樣式系統設計檢查清單

## 學習目標

這篇把前面樣式系統分析整理成可操作的檢查清單。目標是讓你在仿寫元件庫或做企業二次封裝時，有一套可重複使用的樣式設計流程。

讀完後，要能用這份清單檢查自己的元件庫樣式是否具備入口、token、命名、mixins、元件樣式、主題覆蓋與打包能力。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/base.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`
- `01-origin/source/view-ui-plus-v1.3.20/build/build-style.js`

## 入口檢查

- 是否有單一完整樣式入口，例如 `index.less`？
- 入口匯入順序是否穩定？
- token 是否早於 mixins 和 components 載入？
- components 是否由集中入口管理？
- build script 是否明確指向這個樣式入口？

最小順序可以是：

1. tokens
2. reset / base
3. mixins
4. common
5. animation
6. components

## token 檢查

- 是否有主色、狀態色、文字色、背景色？
- 是否有字級、行高、間距、圓角、陰影？
- 是否有 border、disabled、placeholder 等語意 token？
- 是否有 z-index 層級表？
- 是否有 breakpoint？
- 是否區分全域 token 和元件 token？
- 是否避免在元件中散落硬編碼顏色？

token 命名應優先表達用途，例如 `@error-color`、`@component-background`，不要只表達色值。

## 命名檢查

- 是否有全域 class prefix？
- 每個元件是否有自己的 prefix class？
- 元件內部部位是否沿用同一 prefix？
- 尺寸、狀態、語意變體是否有一致 suffix？
- JS、樣式、文件是否使用同一套 class 命名？
- 是否避免把業務語意混入基礎元件 class？

穩定 class 是使用者覆蓋樣式的基礎。命名一旦公開，就要視為樣式 API。

## mixin 檢查

- Button、Input 這類控制項是否抽出 hover、active、disabled？
- 浮層元件是否抽出 mask、content header、close？
- 尺寸與方形能力是否抽成工具 mixin？
- 動畫 class 是否有生成 mixin？
- mixin 是否有清楚命名與合理參數？
- 是否避免為只用一次的細節過度抽象？

mixin 的目的不是把 CSS 藏起來，而是讓重複的樣式模式有名字。

## 元件樣式檢查

對每個元件至少檢查：

- 根 class 是否清楚？
- 尺寸 class 是否完整？
- disabled、loading、active、focus、error 等狀態是否覆蓋？
- hover / active 是否有 token 支撐？
- DOM 結構 class 是否穩定？
- 父子元件狀態是否透過 class 契約表達？
- 是否考慮小螢幕或 overflow？
- 是否有和其他元件組合時的邊界樣式？

對複雜元件還要額外檢查 fixed、scroll、empty、selection、expand、filter 等狀態組合。

## 動畫檢查

- 是否有統一 animation duration 和 transition duration？
- enter / leave class 是否和 Vue transition name 對齊？
- fade、move、slide、collapse、loading 是否分工明確？
- 動畫是否短且可預期？
- loading 動畫是否可持續循環且不影響布局？
- 展開收合是否處理 height 和 padding？

企業後台中的動畫應該支撐狀態理解，不應成為主要視覺負擔。

## 主題與覆蓋檢查

- 使用者是否能透過 token 改主色？
- 是否能透過 token 改字體、圓角、間距、z-index？
- 是否提供穩定 class 讓業務局部覆蓋？
- 是否避免要求使用者依賴深層脆弱 DOM？
- 是否記錄哪些樣式是全域影響？
- 是否有企業封裝時的 namespace 建議？

覆蓋策略優先順序應是 token、props、局部 namespace、全域覆蓋。

## 打包檢查

- Less 是否能被 build script 編譯？
- 是否需要 `javascriptEnabled`？
- 是否有 autoprefixer？
- 是否有 CSS 壓縮？
- 是否有字型或圖片資源拷貝？
- dist CSS 是否能被使用者直接引入？
- 字型路徑是否和 dist 目錄一致？

元件庫樣式必須能交付。只在 source 裡能跑，不代表使用者能正確引入。

## 現代化檢查

若要支援暗色模式或 runtime theme，再檢查：

- 哪些 token 應轉成 CSS variables？
- light / dark 是否有語意 token 對照？
- hover / active 色是否有 runtime 可用變數？
- 硬編碼 `#fff`、`#000` 是否已替換？
- 舊 Less 變數覆蓋方式是否需要保留？
- 是否有主題切換回歸頁？

不要一開始就追求完整 token pipeline。先把語意 token 整理乾淨，再談輸出格式。

## 最小仿寫流程

如果要從零仿寫一套小型樣式系統，可以照這個順序：

1. 建立 `styles/index.less`。
2. 建立 `custom.less`，放 prefix、色彩、文字、間距、圓角、z-index。
3. 建立 `mixins/`，先放 button、input、mask、size。
4. 建立 `common/`，放 reset、base、iconfont 或 icon 策略。
5. 建立 `animation/`，放 fade、move、collapse、loading。
6. 建立 `components/`，先完成 Button、Input、Modal、Table。
7. 建立 build script，輸出 CSS 和必要資源。
8. 建立覆蓋範例，驗證 token 客製與局部覆蓋。

## 複習題

1. 樣式入口的匯入順序應該如何安排？
2. token 檢查中為什麼要特別看 z-index？
3. 什麼樣的樣式值得抽成 mixin？
4. 複雜元件樣式為什麼要檢查狀態組合？
5. 主題覆蓋策略的推薦優先順序是什麼？
