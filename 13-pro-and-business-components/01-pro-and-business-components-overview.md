# 進階與業務型元件總覽

## 學習目標

這篇建立 `13-pro-and-business-components` 的閱讀方法。業務型元件的核心不是「多包一層 UI」，而是把表單、資料、權限、提交、回饋、頁面結構與後端契約整理成可重複使用的工作流。

讀完後，要能判斷一段封裝是一般元件、進階元件、業務元件，還是應該移到企業專案內部維護。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/login/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/auth/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/table-paste/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/number-info/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/trend/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/description-list/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/footer-toolbar/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`

## 元件分類

| 類型 | 代表 | 閱讀重點 |
| --- | --- | --- |
| 帳號流程 | Login、UserName、Password、Mobile、Email、Captcha、Submit | 欄位註冊、驗證規則、提交事件、表單模型 |
| 權限包裹 | Auth | 權限判斷、fallback slot、prevent、跳轉、提示 |
| 表格增強 | TablePaste、CrudTable 設計 | 文字解析、columns/data 生成、批量操作、行操作 |
| 複合表單 | SearchForm、AdvancedQuery 設計 | schema、收合、重置、遠端選項、查詢 payload |
| 業務彈窗 | BusinessModal、BusinessDrawer 設計 | 表單回填、非同步提交、關閉攔截、成功回刷 |
| 看板狀態 | NumberInfo、Trend、AvatarList、Exception | 數字、趨勢、成員、異常頁與業務語意 |
| 詳情與操作區 | DescriptionList、FooterToolbar、GlobalFooter | 詳情頁結構、底部固定操作、頁面收束 |

## 閱讀順序

讀業務型元件時，可以先問：

1. 它解決的是單一 UI 問題，還是一段業務流程？
2. 它內部組合了哪些 View UI Plus 基礎元件？
3. 狀態由誰持有，是元件、父頁面、service，還是路由？
4. submit、reset、cancel、refresh、permission 這些動作如何命名與 emit？
5. 哪些內容用 prop 配置，哪些內容交給 slot 或 render function？
6. 是否綁定特定後端欄位、權限模型或頁面風格？
7. 型別是否能描述 schema、事件 payload 與 slot 擴展點？

## 業務封裝的狀態線

可以把典型後台頁面拆成：

```txt
路由進入
  -> 權限判斷
  -> 查詢表單初始化
  -> 請求列表資料
  -> 表格展示與操作
  -> 開啟新增/編輯/詳情彈窗
  -> 表單驗證與非同步提交
  -> 提示結果並回刷資料
```

本章的重點是把這些流程拆回元件設計問題，而不是直接寫成某個專案的一次性頁面。

## 和其他章節的關係

- 查詢表單依賴 `10-form-and-input-components/` 的 Form、Input、Select、DatePicker、Upload。
- 進階表格依賴 `11-data-display-components/` 的 Table、Tag、Badge、Avatar、Progress。
- 業務 Modal/Drawer 依賴 `12-feedback-and-overlays/` 的浮層、關閉、loading、Message。
- 真正動手封裝 SearchForm、CrudTable、BusinessModal 的實作練習，可放在 `21-enterprise-wrappers/`。

## 複習題

1. 業務型元件和基礎元件最大的設計差異是什麼？
2. 什麼情況下 schema 比 slot 更適合？什麼情況下 slot 比 schema 更適合？
3. 為什麼業務元件需要特別注意權限、loading、錯誤與回刷？
4. 一個元件如果綁定公司內部 API payload，還適合放進通用元件庫嗎？
5. 如何判斷某個封裝應該放在本章分析，還是放進 `21-enterprise-wrappers/` 練習？
