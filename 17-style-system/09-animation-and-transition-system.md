# 動畫與轉場系統

## 學習目標

這篇分析 `src/styles/animation/`。View UI Plus 把常見動畫拆成 fade、move、slide、loop、ease，並用 mixin 生成符合 Vue transition class 規則的 enter / leave 動畫。

讀完後，要能理解動畫 class 如何和 Vue 的 transition name 配合，以及動畫 token 如何控制速度與 easing。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/index.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/fade.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/move.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/slide.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/loop.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/animation/ease.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/`

## animation/index.less 的核心

`animation/index.less` 先定義兩個 mixin：

- `.motion-common(@time)`：設定 animation duration 與 fill mode。
- `.make-motion(@className, @keyframeName, @time)`：根據 class name 和 keyframe name 產出 enter / leave 動畫 class。

接著匯入：

- `fade`
- `move`
- `ease`
- `slide`
- `loop`

最後定義 `.collapse-transition`，用於高度與 padding 的展開收合。

## 與 Vue transition 的關係

Vue transition 會依照 `name` 產生一組 class，例如：

- `xxx-enter-active`
- `xxx-leave-active`
- `xxx-appear`

`.make-motion()` 正是為這種模式服務。它會產出：

- `.@{className}-enter-active`
- `.@{className}-appear`
- `.@{className}-leave-active`

並分別指定 `@{keyframeName}In` 和 `@{keyframeName}Out`。

因此動畫 class 命名必須和 Vue 元件裡的 transition name 對齊。CSS 和 Vue render 邏輯不是分離的，它們透過 class name 契約連在一起。

## 動畫 token

`custom.less` 定義：

- `@animation-time: .3s`
- `@animation-time-quick: .15s`
- `@transition-time: .2s`
- `@ease-in-out: ease-in-out`

這些 token 控制動畫速度與轉場節奏。Button、Input、Table cell、Modal 等元件也會使用 `@transition-time`。

動畫時間集中管理有一個好處：元件庫互動節奏一致。若每個元件隨手寫 100ms、180ms、350ms，整體體驗會變得零散。

## fade、move、slide、loop 的分工

不同動畫檔代表不同動作語意：

| 類型 | 適合場景 |
| --- | --- |
| fade | 淡入淡出，常見於提示、浮層、遮罩 |
| move | 從某個方向進出，常見於通知、抽屜感的動作 |
| slide | 高度或方向性展開，常見於下拉、收合 |
| loop | 持續旋轉或循環，常見於 loading |
| ease | 統一 timing function |

閱讀時可以從元件使用的 transition name 反查它依賴哪一組動畫。

## collapse-transition

`.collapse-transition` 是一個特殊類型，不是 keyframes，而是 transition：

- height
- padding-top
- padding-bottom

它適合 Collapse 這類高度展開收合的元件。這類動畫通常需要 JS 在進入和離開時設定元素高度，再由 CSS transition 補間。

這說明動畫系統有兩種形態：

- keyframe animation：用 class 切換進出動畫。
- transition：由 CSS 屬性變化觸發補間。

## 動畫與可維護性

動畫不是越多越好。元件庫動畫要穩定、短、可預期，尤其在企業後台中更應避免過度裝飾。

View UI Plus 的動畫設計偏實用：

- 浮層進出需要 fade / move / slide。
- loading 需要 loop。
- 控制項 hover / focus 用 transition。
- Collapse 高度變化用 collapse transition。

這些都是支撐互動理解，而不是吸引注意力的特效。

## 設計啟發

仿寫動畫系統時，先定義動畫語意，而不是先寫 keyframes：

- 顯示與隱藏：fade。
- 位移進出：move。
- 展開收合：slide 或 collapse。
- 持續等待：loop。
- 控制項反饋：transition。

然後讓 Vue transition name 和 CSS class name 成為穩定契約。不要在元件裡臨時寫隨機動畫 class。

## 複習題

1. `.make-motion()` 解決什麼問題？
2. Vue transition name 和 CSS class 有什麼契約關係？
3. `@animation-time` 和 `@transition-time` 分別適合哪些場景？
4. keyframe animation 和 transition 的差異是什麼？
5. Collapse 類元件為什麼常需要高度 transition？
