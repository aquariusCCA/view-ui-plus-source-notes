# 工具型能力與全域服務總覽

## 學習目標

這篇建立 `15-utility-components-and-global-services` 的閱讀方法。工具型能力的重點不是某個畫面區塊，而是「在任何頁面、任何元件、任何互動流程裡，都能用一致方式呼叫的能力」。

讀完後，要能判斷一段設計應該是普通元件、全域服務、工具函數、mixin、插件設定，還是企業二次封裝。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/message/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/notice/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/loading-bar/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/spin/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/modal/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/copy/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-top/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/scroll-into-view/`
- `01-origin/source/view-ui-plus-v1.3.20/src/locale/`
- `01-origin/source/view-ui-plus-v1.3.20/src/mixins/`
- `01-origin/source/view-ui-plus-v1.3.20/src/utils/`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`

## 能力分類

| 類型 | 代表 | 閱讀重點 |
| --- | --- | --- |
| 命令式回饋服務 | `$Message`、`$Notice`、`$Loading`、`$Spin` | 不靠模板掛載，由方法呼叫建立、更新與銷毀 |
| 命令式確認服務 | `$Modal.info`、`$Modal.confirm`、`$ImagePreview.show` | 以一次性任務建立浮層，把確認、取消、移除回呼收束在 options |
| DOM 工具服務 | `$Copy`、`$ScrollTop`、`$ScrollIntoView` | 直接操作瀏覽器能力，需要 SSR guard、callback 與失敗處理 |
| 全域設定 | `$VIEWUI`、`locale`、`i18n` | 安裝期注入，元件內透過 mixin 或全域屬性讀取 |
| 低層工具函數 | `assist`、`dom`、`date`、`csv` | 不綁 Vue 實例，提供可重用的純邏輯或 DOM 封裝 |

本章不是把這些 API 當使用手冊背起來，而是看它們如何把「全域可用」變成可維護的工程結構。

## 閱讀順序

建議按照這個流程讀：

1. 從 `src/index.js` 看哪些能力被掛到 `app.config.globalProperties`。
2. 對照 `components/index.js`，分辨具名匯出和全域屬性掛載的差異。
3. 追蹤 Message、Notice、LoadingBar、Spin 這類服務如何建立單例。
4. 看 Modal confirm、ImagePreview 這類一次性浮層如何把 `onRemove` 接回外層狀態。
5. 看 Copy、ScrollTop、ScrollIntoView 如何直接操作 DOM。
6. 看 `locale/index.js`、`mixins/locale.js`、`mixins/globalConfig.js` 如何讓元件讀設定。
7. 最後對照 `types/index.d.ts`，確認 runtime 掛載和 TypeScript 宣告是否一致。

## 全域服務資料流

可以先用這條線理解服務：

```txt
install(app, opts)
  -> app.config.globalProperties.$X = service
  -> component instance 呼叫 this.$X.method(options)
  -> service 建立或取得 singleton instance
  -> instance 操作 DOM / Vue 子 app / notification queue
  -> close / destroy / onRemove 收束狀態
```

這和普通元件不同。普通元件由父元件 template 控制生命週期；全域服務則常常自己建立掛載點、自己維護狀態，也要自己負責清理。

## 和其他章節的關係

- `04-plugin-system/`：回答服務如何被安裝；本章回答服務安裝後如何被設計。
- `05-shared-logic/`：回答工具函數如何抽象；本章回答工具函數如何支撐服務 API。
- `12-feedback-and-overlays/`：回答浮層和回饋如何互動；本章回答它們如何成為命令式全域服務。
- `17-style-system/`：回答 class 和樣式如何呈現；本章只追必要的 prefix、z-index 與掛載位置。

## 設計啟發

全域服務 API 要先回答幾個問題：

- 使用者是用模板宣告，還是用方法呼叫？
- 服務是否需要共享單例，還是每次呼叫都建立新實例？
- options 裡哪些欄位是內容，哪些是行為，哪些是生命週期 callback？
- 服務會不會碰到 DOM、window、document，是否有 `isClient` 保護？
- 關閉時只隱藏畫面，還是真的 unmount 並移除 DOM？
- TypeScript 是否能描述 `this.$X` 和具名匯入 API？

## 複習題

1. 為什麼 `$Message` 比 `<Message>` 更適合表達一次性操作回饋？
2. 全域服務和低層 `utils` 最大的邊界是什麼？
3. 為什麼命令式服務需要特別注意 destroy？
4. `$VIEWUI` 和 `$Message` 都掛在 `globalProperties`，但角色差在哪裡？
5. 如果要新增 `$Download`，你會先把它設計成元件、服務還是工具函數？
