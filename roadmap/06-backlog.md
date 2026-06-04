# Backlog

本筆記用來暫存未來想研究、但目前不急著處理的主題。

原則：

```text
想到可以先放進來。
放進來不代表現在要做。
目前主線仍然是 01-clone-practice。
```

## 一、源碼架構相關

- View UI Plus 專案整體目錄結構
- 元件匯出與安裝機制
- plugin / install 設計
- 全域配置機制
- locale / i18n 機制
- theme / style 組織方式
- TypeScript 型別組織方式
- 文件系統與示例系統
- 測試系統

## 二、元件設計相關

- props 命名規則
- emits 設計規則
- slots 設計規則
- v-model 設計方式
- controlled / uncontrolled 狀態設計
- disabled 狀態共用邏輯
- size 狀態共用邏輯
- loading 狀態共用邏輯
- class name 組裝方式

## 三、樣式系統相關

- SCSS 變數
- mixins
- class 命名規則
- BEM 或類 BEM 結構
- size / type / status 樣式
- theme 架構
- 樣式打包
- 按需引入樣式

## 四、指令系統相關

- click outside
- resize directive
- scroll directive
- transfer / portal
- directive 生命週期
- 指令與元件狀態的關聯

## 五、插件系統相關

- app.use()
- install 方法
- 全域元件註冊
- 單一元件註冊
- 全量元件註冊
- 全域配置
- 函式式 API
- Message / Notice 動態掛載

## 六、公開 API 與型別系統相關

- props type
- emits type
- slot type
- v-model type
- public instance methods
- component export
- type declaration
- package exports
- API docs 與 source 對照

## 七、建置與發布流程相關

- package scripts
- build command
- bundle output
- ESM / CJS / UMD
- CSS output
- type declaration output
- tree-shaking
- peerDependencies
- npm publish
- changelog
- version management

## 八、表單相關

- Form / FormItem 關聯機制
- 表單驗證流程
- rules 設計
- validate 方法設計
- resetFields 設計
- 表單元件如何與 FormItem 溝通
- Input / Select / Radio / Checkbox 與 Form 的整合方式

## 九、彈層相關

- Modal 顯示控制
- Drawer 顯示控制
- Tooltip 浮層定位
- Poptip confirm 設計
- Message 動態掛載
- Notice 動態掛載
- 全域單例與多實例管理

## 十、複雜元件相關

- Table columns 設計
- Table render / slot 設計
- Table 排序、篩選、分頁
- Upload 檔案狀態管理
- DatePicker 面板切換
- Tree 遞迴渲染
- Menu 巢狀結構與 active 狀態

## 十一、重構練習候選

- Button 的 type / size / loading 抽取
- Input 的 prefix / suffix / clearable 抽取
- RadioGroup / CheckboxGroup 共用邏輯
- FormItem 與表單元件的共用通訊方式
- Modal / Drawer 的 visible 控制抽象
- Message / Notice 的動態掛載抽象
- 樣式 class 組裝工具
- 共用 props 定義

## 十二、企業級封裝候選

- SearchForm
- QueryPanel
- DataTable
- FormDialog
- DetailDrawer
- PermissionButton
- StatusTag
- AmountInput
- DateRangeSearch
- BankSelect
- BranchSelect
- CustomerSelector

## 十三、暫時不處理

目前先不要深入：

- 完整主題系統
- 完整元件庫架構重寫
- Table 深度實作
- Form 完整驗證器重寫
- DatePicker 複雜日期面板
- Tree 大量節點效能最佳化
- npm 發布完整流程
