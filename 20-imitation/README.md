# 20-imitation

本目錄存放 View UI Plus 的仿寫練習。這裡不是要完整重刻一套元件庫，而是把 View UI Plus 的核心設計拆成小型可實作案例，用實作驗證源碼閱讀結果。

仿寫練習的重點是：先看懂真實元件的 API 與工程取捨，再做一個可完成、可驗收、可重構的最小版本。

## 第一階段閱讀順序

| 順序 | 筆記 | 學習重點 |
| --- | --- | --- |
| 1 | [仿寫練習總覽](./01-imitation-overview.md) | 建立仿寫章節定位、練習流程與完成標準 |
| 2 | [Mini Icon](./02-mini-icon.md) | 仿寫 Icon 的 props、class、inline style 與 custom icon |
| 3 | [Mini Button](./03-mini-button.md) | 仿寫 Button 的 type、size、loading、disabled、icon 與 slot |
| 4 | [Mini ButtonGroup](./04-mini-button-group.md) | 仿寫 ButtonGroup 的父子樣式協作與群組 class 設計 |
| 5 | [Mini Divider](./05-mini-divider.md) | 仿寫 Divider 的 slot presence、orientation、dashed 與 plain |
| 6 | [Mini Input](./06-mini-input.md) | 仿寫 Input 的 `v-model`、clearable、prefix/suffix 與事件語意 |
| 7 | [Mini Form](./07-mini-form.md) | 仿寫 Form/FormItem 的欄位註冊、rules、validate 與 reset |
| 8 | [Mini Select](./08-mini-select.md) | 仿寫 Select/Option 的選項註冊、單選、多選、filter 與浮層狀態 |
| 9 | [Mini Tag、Badge、Avatar](./09-mini-tag-badge-avatar.md) | 仿寫展示型小元件的顏色、尺寸、fallback 與事件 |
| 10 | [Mini Modal、Message](./10-mini-modal-message.md) | 仿寫受控彈窗、全域服務與動態掛載 |
| 11 | [Mini Table](./11-mini-table.md) | 仿寫簡化 Table 的 columns、data、render cell、empty 與 loading |
| 12 | [Mini Style System](./12-mini-style-system.md) | 仿寫 prefix class、SCSS 變數、BEM 與主題覆蓋 |
| 13 | [Mini Install Plugin](./13-mini-install-plugin.md) | 仿寫 `install`、全域註冊與按需匯出 |
| 14 | [仿寫元件 API 檢查清單](./14-imitation-api-checklist.md) | 檢查 props、emits、slots、expose、types 與文件契約 |
| 15 | [仿寫後重構手冊](./15-imitation-refactor-playbook.md) | 練習抽出 composable、utils、共用型別與樣式模式 |

## 建議練習方式

每篇筆記都用同一個流程：

1. 先閱讀對照源碼，確認 View UI Plus 的真實 API 與實作邊界。
2. 再定義最小實作範圍，只保留這次練習要訓練的核心能力。
3. 接著設計 props、emits、slots、expose 與型別，不急著寫畫面。
4. 然後完成最小 Vue 3 + TypeScript 實作。
5. 最後用驗收案例檢查互動、邊界與 API 語意。

每篇都應該產出一個可以獨立理解的小案例。若實作後發現程式碼開始變大，優先回到「這篇到底要練什麼」來縮小範圍。

## 第一階段邊界

第一階段只覆蓋元件庫最核心的能力面：

- 基礎展示：Icon、Button、Divider、Tag、Badge、Avatar。
- 表單輸入：Input、Form、Select。
- 回饋浮層：Modal、Message。
- 資料展示：簡化版 Table。
- 工程能力：樣式系統、插件安裝、API 檢查與重構方法。

這些案例足以建立仿寫方法論，但還不是 View UI Plus 全部元件型態的完整練習。

## 後續補充方向

第二階段可以在第一階段完成後再補，避免一開始把練習範圍擴太大。

| 方向 | 可補充案例 | 練習重點 |
| --- | --- | --- |
| 導航類 | Tabs、Menu、Dropdown、Breadcrumb、Page | active state、路徑語意、巢狀結構、鍵盤操作 |
| 浮層類 | Tooltip、Poptip、Drawer | trigger、定位、teleport、外部點擊與關閉策略 |
| 複雜輸入類 | Upload、DatePicker、Cascader、TreeSelect | 非同步流程、面板狀態、階層資料、值轉換 |
| 資料展示類 | Tree、Timeline、List、Collapse | 遞迴渲染、展開收合、空狀態、資料映射 |
| 企業封裝銜接 | SearchForm、CrudTable、BusinessModal | 從基礎元件組合成後台業務元件 |

建議補充原則：只有當第一階段的 API 設計、狀態管理、樣式系統與插件安裝都能熟練說明後，再進入第二階段。
