# 回饋與浮層 API 模式

## 學習目標

這篇整理本章元件的 API 設計模式。回饋與浮層類元件最大的特點是同時存在「元件式 API」和「服務式 API」。前者適合可組合、可控、可放入模板的 UI；後者適合由命令快速觸發的一次性回饋。

讀完後，要能從公開 API 反推元件的生命週期、狀態歸屬與關閉語意。

## 兩種 API 形態

| 形態 | 代表 | 特徵 |
| --- | --- | --- |
| 元件式 API | Alert、Modal、Drawer、Tooltip、Poptip、Spin | 使用 props、events、slots，生命週期跟隨父元件 |
| 服務式 API | Modal.confirm、Message、Notice、Spin.show、LoadingBar | 使用方法呼叫，內部 `createApp`，生命週期由服務管理 |

元件式 API 的核心問題是「父元件如何控制它」。服務式 API 的核心問題是「方法呼叫後如何建立、更新、關閉與銷毀它」。

## 可見狀態模式

| 模式 | 代表 | 說明 |
| --- | --- | --- |
| 內部一次性狀態 | Alert | `closed` 由內部控制，外部只接收 `on-close` |
| `v-model` 雙向控制 | Modal、Drawer、Popper mixin | `modelValue` 與 `update:modelValue` 同步 |
| trigger 內部控制 | Tooltip、Poptip | hover/click/focus 改變 `visible` |
| 服務內部控制 | Message、Notice、Spin.show、LoadingBar | 使用方法更新內部實例狀態 |

設計時要避免同一個元件混入太多可見控制來源。例如 Alert 不需要同時支援 `v-model`；Tooltip 如果支援 controlled，就要明確定義哪些行為不再自動關閉。

## 關閉語意模式

| 關閉方式 | 代表 | 設計重點 |
| --- | --- | --- |
| close button | Alert、Modal、Drawer、Notice、Message | 是否可自訂 close slot，是否 emit |
| mask click | Modal、Drawer | `maskClosable` 和 `mask` 分離 |
| Esc | Modal | 只關閉最上層且 closable 的 Modal |
| click outside | Poptip | transfer 模式要額外 guard |
| timer | Message、Notice、LoadingBar | `duration: 0` 表示不自動關閉 |
| 手動 remove | Modal.confirm、Message、Notice、Spin、LoadingBar | 必須提供精準清理入口 |
| before close | Modal、Drawer | 支援 Promise 攔截 |

關閉不是單一事件，而是一組策略。閱讀源碼時要找出所有入口是否最後匯到同一條清理路徑。

## 遮罩與 body scroll

Modal、Drawer、Spin fullscreen 都可能影響 body scroll。API 上常見幾個布林值：

| API | 語意 |
| --- | --- |
| `mask` | 是否顯示遮罩 |
| `maskClosable` | 點擊遮罩是否關閉 |
| `scrollable` | 頁面是否可以繼續滾動 |
| `lockScroll` | 是否允許元件修改 body scroll |
| `transfer` | 是否 teleport 到 body |
| `inner` | 是否在局部容器內打開 |

這些 prop 不能混為一談。是否有遮罩、是否能點遮罩關閉、是否鎖住 body、是否掛到 body，是四個不同決策。

## slots 與 render

| 自訂方式 | 代表 | 適用情境 |
| --- | --- | --- |
| named slots | Modal、Drawer、Poptip、Tooltip、Alert、Spin | 模板內可組合內容 |
| render function | Modal.confirm、Message、Notice、Spin.show | 命令式 API 中自訂 VNode |
| string content | Message、Notice、Tooltip、Poptip | 短文字或簡單內容 |

服務式 API 沒有父模板可插 slot，所以常用 `render(h)`。元件式 API 有 slots，就不需要把所有內容都塞進 prop。

設計時可以用這個判斷：

```txt
在模板裡使用
  -> slot 優先

透過方法呼叫
  -> render function 或純文字 options
```

## config 模式

Message、Notice、LoadingBar 都有 `config()`。這類 API 通常修改模組層級預設值：

```txt
defaults.duration = options.duration
defaults.top = options.top
```

設計 config 時要說清楚：

- 會影響未來建立的實例，還是立即更新已存在實例。
- `0` 是否是有效值。
- config 是否可重置。
- 測試或登出時是否需要 destroy。

## name / key 模式

Notice 支援使用者傳入 `name`，Message 內部產生 key 並回傳 close function。兩者解決的是同一個問題：如何精準移除某一則全域訊息。

| 方案 | 優點 | 缺點 |
| --- | --- | --- |
| 使用者指定 `name` | 可跨函式關閉，適合任務型通知 | 需要使用者管理唯一性 |
| 回傳 close function | 不需要暴露 key，適合即時關閉 | close function 要被呼叫方保存 |

仿寫服務時，可以二選一，也可以兩者都支援。

## 型別檢查重點

讀 `.d.ts` 時要核對：

1. prop 名稱是否符合 kebab-case 使用方式。
2. event 是否使用 `onOnXxx` 這類 Vue JSX/TSX 宣告形式。
3. slots 是否包含 template 中實際存在的 slot。
4. 服務方法的 options 型別是否覆蓋 runtime 支援能力。
5. runtime 新增 prop 後，型別是否同步。

本章特別容易出現型別漂移，因為服務式 API 不只是一個 `DefineComponent`，還包含掛在物件上的方法和 config 型別。

## 設計啟發

回饋與浮層 API 設計可以依序問：

1. 使用者應該在模板中使用，還是用方法觸發？
2. 可見狀態由誰控制？
3. 有哪些關閉入口？
4. 關閉能不能被阻止？
5. 是否需要遮罩、transfer、scroll lock、z-index？
6. 內容用 slot、render 還是字串？
7. 是否需要全域 config？
8. 是否需要精準 close 某一個實例？
9. 銷毀後 DOM、timer、event listener 是否清乾淨？

## 複習題

1. 元件式 API 和服務式 API 的狀態歸屬差異是什麼？
2. `mask` 和 `maskClosable` 為什麼要分開設計？
3. `duration: 0` 為什麼常需要特殊判斷？
4. 什麼情況下應該用 render function，而不是 slot？
5. 全域通知服務為什麼需要 name、key 或 close function？
