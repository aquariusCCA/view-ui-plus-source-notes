# 回饋與浮層元件設計檢查清單

## 使用方式定位

設計任何回饋或浮層元件前，先確定它是哪一類：

| 問題 | 判斷 |
| --- | --- |
| 是否需要放在模板中組合內容？ | 用元件式 API |
| 是否常由業務函式直接觸發？ | 提供服務式 API |
| 是否只是一段靜態提示？ | 類似 Alert |
| 是否會阻斷使用者操作？ | 類似 Modal |
| 是否從頁面邊界打開工作區？ | 類似 Drawer |
| 是否依附某個元素定位？ | 類似 Tooltip / Poptip |
| 是否是短暫全域回饋？ | 類似 Message / Notice |
| 是否表示等待或流程推進？ | 類似 Spin / LoadingBar |

不要一開始就把所有能力做進同一個元件。Alert 不需要 Popper，Tooltip 不需要 mask，LoadingBar 不需要 slots。

## 狀態設計

檢查狀態是否被清楚拆分：

- `visible`：是否可見。
- `wrapShow`：動畫期間是否保留外層 DOM。
- `loading`：外部模式開關，還是內部實際載入狀態。
- `buttonLoading`：按鈕是否正在 loading。
- `closed`：一次性關閉狀態。
- `notices`：通知佇列。
- `percent` / `status` / `show`：進度、成功失敗與可見性。
- `tIndex` / `modalIndex`：層級序號。

如果一個狀態同時表示「存在、可見、動畫中、正在提交」，通常要拆開。

## 開啟與關閉

列出所有開啟入口：

- prop `modelValue`。
- click / hover / focus。
- `show()` / `open()` / `start()`。
- route change 或 async action。

列出所有關閉入口：

- close button。
- cancel button。
- ok button。
- mask click。
- Esc。
- click outside。
- mouseleave。
- blur。
- timer。
- manual remove。
- destroy。

再檢查：

- 是否所有關閉入口都會清理 timer。
- 是否所有關閉入口都會移除全域事件。
- 是否需要 emit 或 callback。
- 是否需要阻止關閉。
- 是否需要等待動畫後再 unmount。

## 遮罩與層級

浮層要明確回答：

- 是否需要 mask。
- mask 是否可點擊關閉。
- mask 和內容是否同一個 z-index 計算體系。
- 多個浮層疊加時誰在上面。
- 是否支援 Esc 關閉最上層。
- 是否支援 `transfer`。
- transfer 後 class 和事件是否仍正確。

避免固定寫死一個 z-index 後就不管多浮層場景。至少要有遞增序號或明確的層級規則。

## 滾動鎖定

會覆蓋頁面的元件要檢查：

- 開啟時是否鎖住 body scroll。
- 關閉時是否恢復 body scroll。
- scrollbar 消失時是否補 `paddingRight`。
- 多個 Modal/Drawer 同時存在時，關閉其中一個是否會過早恢復滾動。
- 是否提供 `scrollable` 或 `lockScroll` 讓使用者調整。
- unmount 時是否一定會恢復 body 狀態。

body side effect 是高風險區，測試和清理都要更嚴格。

## 定位浮層

Tooltip、Poptip、Dropdown、Select 類浮層要檢查：

- reference DOM 是否穩定。
- popper DOM 是否穩定。
- visible 變化時是否更新定位。
- placement 是否驗證。
- offset 是否傳給 Popper。
- transfer 模式是否修正 click outside。
- scroll/resize 是否需要 Popper eventsEnabled。
- disabled 時是否阻止所有 trigger。
- focus trigger 是否監聽真正的 input/textarea。

不要手寫簡陋 top/left 定位去替代成熟定位引擎，除非元件需求非常受限。

## 全域服務

服務式 API 要檢查：

- 是否只在 client 建立 DOM。
- 是否使用單例。
- 重複 show/open 時是更新、疊加還是忽略。
- 是否能手動 close 某一則。
- 是否能 destroy 全部。
- destroy 後單例引用是否清空。
- container 是否從 body 移除。
- timer、interval 是否清理。
- render function 是否能拿到 `h`。
- config 是否影響已存在實例。

服務式 API 最大的風險是殘留 DOM、殘留 timer、殘留全域狀態。

## 內容自訂

檢查內容自訂層級：

- 短文字是否使用 prop。
- 複雜內容是否使用 slot。
- 命令式 API 是否使用 render function。
- icon、close、header、footer 是否有 named slot。
- string content 是否被當 HTML 注入。
- render 和 content 同時存在時誰優先。
- slot 不存在時是否有合理預設。

如果是企業後台封裝，建議把未信任輸入當純文字，不要直接走 `v-html`。

## 事件與回調

事件命名要有清楚語意：

- `on-visible-change`：可見性變化。
- `on-hidden`：離場動畫後。
- `on-close`：關閉動作。
- `on-ok` / `on-cancel`：確認或取消。
- `on-resize-width`：尺寸變化。
- `on-drag`：拖拽階段。
- `on-popper-show` / `on-popper-hide`：定位浮層顯隱。

回調要說清楚觸發時機：點擊時、狀態更新後、動畫結束後、還是 DOM 銷毀後。

## 型別與樣式

完成 runtime 後同步檢查：

- `.d.ts` 是否包含所有 props。
- 聯合型別是否和 `oneOf` 一致。
- slots 是否完整。
- 服務方法和 config 型別是否完整。
- class 是否按狀態拆分，而不是依賴難以覆蓋的 inline style。
- transfer class 是否支援使用者覆蓋。
- 過渡動畫 class 是否和 transition name 一致。

## 測試建議

最少測這些情境：

1. 開啟與關閉。
2. 所有關閉入口。
3. `beforeClose` resolve 後關閉。
4. `duration: 0` 不自動關閉。
5. destroy 清理 DOM。
6. 多個通知依序關閉。
7. 多個 Modal 疊加時 Esc 只關閉最上層。
8. transfer 後 click inside 不被當成 outside。
9. scroll lock 開關與 unmount 清理。
10. LoadingBar timer 在 finish/error/destroy 時清除。

## 仿寫練習

可以依序做三個練習：

1. 仿寫 `AlertLite`：支援 type、icon、desc、closable、on-close。
2. 仿寫 `ToastService`：支援 success/error/loading、duration、手動 close、destroy。
3. 仿寫 `MiniModal`：支援 v-model、maskClosable、beforeClose、ok/cancel、scroll lock。

每個練習都要補一張狀態圖和一張關閉入口表。能把這兩張表畫清楚，元件設計通常就不會失控。
