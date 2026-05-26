# 源碼閱讀順序

源碼閱讀應該先看穩定主線，再看局部細節。不要從 Table、Select、DatePicker 這類複雜元件開始，否則會同時遇到渲染、狀態、樣式、事件、型別與邊界條件，閱讀成本過高。

## 0. 確認來源

先閱讀：

- `01-origin/source-record.md`
- `README.md`

確認事項：

- 主線版本使用 `v1.3.20`。
- 原始碼本地路徑為 `01-origin/source/view-ui-plus-v1.3.20/`。
- 後續筆記預設都以這個版本為準。

## 1. 入口與註冊

優先追蹤：

- 套件入口
- 元件匯出入口
- `install` 方法
- 全域註冊流程
- 按需引入方式

對應筆記：

- `03-architecture/`
- `04-plugin-system/`

閱讀問題：

- 使用者 `app.use(ViewUIPlus)` 時發生了什麼？
- 單一元件如何被匯出與安裝？
- 全域服務與一般元件的註冊方式是否不同？

## 2. 公共工具與型別

接著追蹤：

- utils
- hooks / composables
- shared constants
- Props / Emits 型別
- component instance 型別

對應筆記：

- `05-shared-logic/`
- `06-public-api-and-type-system/`

閱讀問題：

- 哪些邏輯被抽到元件外？
- 哪些型別是給內部使用，哪些型別是給使用者使用？
- 一個元件的 public API 如何從型別上被約束？

## 3. 基礎元件

建議順序：

1. Icon
2. Button
3. Divider
4. Space
5. Tag
6. Badge

對應筆記：

- `07-basic-components/`
- `08-layout-and-containers/`
- `11-data-display-components/`

閱讀問題：

- Props 如何轉成 class、style 或渲染分支？
- slot 如何影響元件輸出？
- 事件如何命名與暴露？

## 4. 容器與導航元件

建議順序：

1. Layout
2. Grid
3. Card
4. Breadcrumb
5. Dropdown
6. Menu
7. Tabs
8. Page

對應筆記：

- `08-layout-and-containers/`
- `09-navigation-components/`

閱讀問題：

- 父子元件如何共享狀態？
- active、selected、open、disabled 等狀態如何流動？
- 元件如何同時支援受控與非受控使用方式？

## 5. 表單與輸入元件

建議順序：

1. Input
2. Checkbox
3. Radio
4. Switch
5. Form
6. Select
7. DatePicker
8. Upload

對應筆記：

- `10-form-and-input-components/`

閱讀問題：

- `modelValue` 與 `update:modelValue` 如何實作？
- FormItem 如何收集、校驗與展示欄位狀態？
- 複雜輸入元件如何處理彈層、鍵盤、清除與禁用狀態？

## 6. 資料展示與回饋浮層

建議順序：

1. List
2. Timeline
3. Tree
4. Table
5. Tooltip
6. Poptip
7. Modal
8. Drawer
9. Message
10. Notice

對應筆記：

- `11-data-display-components/`
- `12-feedback-and-overlays/`
- `15-utility-components-and-global-services/`

閱讀問題：

- 大資料或樹狀資料如何被拆分與渲染？
- 浮層如何處理定位、掛載、關閉與層級？
- 命令式 API 如何建立、更新與銷毀元件實例？

## 7. 樣式、測試與建置

最後補上：

- SCSS 變數與元件樣式
- directive
- test cases
- build scripts
- package exports

對應筆記：

- `16-directives/`
- `17-style-system/`
- `18-testing/`
- `19-build-release/`

閱讀問題：

- 樣式命名是否與元件狀態一致？
- 測試主要保護哪些行為？
- 打包後的 JS、CSS、型別檔如何被使用者消費？
