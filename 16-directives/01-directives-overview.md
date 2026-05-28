# 指令系統總覽

## 學習目標

這篇建立 View UI Plus 指令系統的閱讀框架。重點不是背 Vue directive 的語法，而是判斷一段能力什麼時候應該放在 directive，什麼時候應該放在元件、composable、工具函式或全域服務。

讀完後，要能把指令看成「模板層宣告的 DOM 行為」，並理解 View UI Plus 為什麼會把樣式快捷、文字省略、resize、click outside、transfer DOM 這些能力放在指令附近。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/style.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/line-clamp.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/resize.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/clickoutside.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/v-click-outside-x.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/directives/transfer-dom.js`

## directive 解決什麼問題

directive 適合封裝「貼在某個真實 DOM 節點上的行為」。它的使用方式通常長這樣：

```vue
<div v-width="240" />
<p v-line-clamp="2">很長的文字</p>
<div v-resize="handleResize" />
<div v-click-outside="handleClose" />
```

這些能力的共同點是：

- 行為主體是 DOM 元素本身。
- 使用者希望在模板上直接宣告。
- 不一定需要新的視覺結構。
- 需要在掛載時建立副作用，卸載時清理副作用。

directive 的優點是語意短、貼近模板；缺點是狀態流向不如 component 或 composable 明顯，所以不能把複雜業務流程都塞進指令。

## 和其他抽象的邊界

| 抽象 | 適合放什麼 | 不適合放什麼 |
| --- | --- | --- |
| directive | DOM style、listener、focus、resize、外部點擊 | 複雜畫面結構、業務流程 |
| component | 可組合 UI、slot、props、emit、可見狀態 | 單純替元素加一個 DOM listener |
| composable | reactive 狀態、生命週期、provide/inject | 需要模板層非常直觀的單元素行為 |
| util | 純資料處理、格式化、判斷 | 需要 Vue instance 或 DOM 清理的行為 |
| global service | 命令式通知、彈窗、全域 loading | 只作用在單個元素上的行為 |

判斷時可以問一句：這個能力的使用者是不是只想在一個元素上寫 `v-xxx`？如果答案是肯定的，directive 通常是合理候選。

## View UI Plus 的指令分類

| 類型 | 代表檔案 | 重點 |
| --- | --- | --- |
| 樣式快捷 | `style.js` | 把常用 inline style 寫入封裝成 `v-width`、`v-color` 等指令 |
| 文字省略 | `line-clamp.js` | 加 class 並寫入 `-webkit-line-clamp` |
| 元素監聽 | `resize.js` | 對元素尺寸變化建立 observer |
| 外部互動 | `clickoutside.js`、`v-click-outside-x.js` | 在 document 層監聽事件，再判斷 target 是否在元素外 |
| DOM 搬移 | `transfer-dom.js` | 將元素移出原位置並掛到目標容器 |

這些指令都不是完整 UI 元件，而是讓既有元素獲得一段 DOM 行為。

## 公開與內部使用

View UI Plus 的 `src/index.js` 會把部分指令註冊成全域指令：

- `display`
- `width`
- `height`
- `margin`
- `padding`
- `font`
- `color`
- `bg-color`
- `resize`
- `line-clamp`

另外有些指令主要在元件內局部註冊，例如 Select、DatePicker、ColorPicker 會使用 click outside 來關閉浮層。閱讀時要區分「提供給使用者的全域指令」和「元件內部實作細節」。

## 設計啟發

一個好的 directive 應該讓使用者只宣告意圖，而不需要知道底層 DOM 細節。例如 `v-line-clamp="2"` 表達「最多兩行」，使用者不需要手寫 `display: -webkit-box`、`-webkit-box-orient` 和 class。

但 directive 也要克制。當一個能力開始需要大量 props、slot、emit、內部狀態與複雜可見結構時，應該升級成 component。當一個能力主要是邏輯狀態復用，而不是元素行為，應該拆成 composable。

## 最小模仿

```js
const focus = {
    mounted(el) {
        el.focus();
    }
};

const title = {
    mounted(el, binding) {
        el.title = binding.value || '';
    },
    updated(el, binding) {
        el.title = binding.value || '';
    },
    unmounted(el) {
        el.removeAttribute('title');
    }
};
```

這兩個指令都只作用在元素本身，沒有額外 UI 結構，所以適合用 directive 表達。

## 複習題

1. directive 和 component 的核心差異是什麼？
2. 為什麼 click outside 適合做成 directive？
3. 為什麼全域通知服務不適合做成 directive？
4. View UI Plus 哪些指令是全域註冊，哪些主要是元件內部使用？
5. 如果要仿寫 `v-permission`，它應該是 directive、component 還是 composable？為什麼？
