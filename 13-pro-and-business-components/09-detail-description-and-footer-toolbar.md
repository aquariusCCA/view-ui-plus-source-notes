# 詳情區塊與底部操作列

## 學習目標

這篇分析 `DescriptionList`、`Description`、`FooterToolbar`、`GlobalFooter`，並整理後台詳情頁、流程頁與長表單頁的頁面結構。這類元件的價值在於建立穩定的資訊區塊與操作收束，而不是展示單個欄位。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/description-list/description-list.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/description-list/description.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/description-list/responsive.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/footer-toolbar/footer-toolbar.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/global-footer/global-footer.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/description-list.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/footer-toolbar.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/global-footer.d.ts`

## DescriptionList

`DescriptionList` 提供標題、layout、gutter、col，並透過 `provide` 讓子 `Description` 取得父層配置。

閱讀重點：

- `layout` 分成 horizontal 與 vertical。
- `col` 限制在 1 到 4。
- `Row` 和 `Col` 負責實際排列。
- title 支援 prop 與 slot。
- responsive 邏輯如何影響不同螢幕下的欄位數。

## 詳情頁設計

詳情頁常見區塊：

```txt
基本資訊
業務資訊
關聯資料
審批紀錄
操作紀錄
附件與備註
```

每個區塊都適合用 DescriptionList 或 Table 組合，但欄位過多時要避免把所有資訊塞成一個巨大的單區塊。

## FooterToolbar

`FooterToolbar` 把底部操作固定成左右兩塊：

- 左側 `extra` 放額外資訊，例如已選數量、校驗提示、總金額。
- 右側 default slot 放主要操作，例如取消、上一步、下一步、提交。

長表單和流程頁常用 FooterToolbar，因為使用者滾到頁面中段時仍能看到主要操作。

## GlobalFooter

`GlobalFooter` 偏頁面框架層，適合整理連結、版權與系統資訊。它不是業務流程核心，但在後台產品中常作為 layout 的收尾元件。

## 複習題

1. DescriptionList 為什麼用父子組合，而不是直接接收一個 data array？
2. 詳情頁欄位很多時，應該如何分區？
3. FooterToolbar 的 `extra` 和 default slot 分別承載什麼？
4. 固定底部操作列可能帶來哪些遮擋與響應式問題？
5. GlobalFooter 應該放在頁面內，還是 layout 層？
