# Mini Style System

元件庫不是把樣式寫進每個元件就結束。穩定的樣式系統需要 prefix、變數、BEM 命名、狀態 class、主題覆蓋與元件之間的一致規則。

## 練習目標

- 練習建立全域 class prefix。
- 練習用 SCSS 變數管理色彩、尺寸、間距。
- 練習 BEM 或類 BEM 命名。
- 練習狀態 class 的命名一致性。
- 練習讓元件樣式可被主題覆蓋。

## 對照源碼

主要對照：

- `src/styles/`
- `src/styles/common/`
- `src/styles/components/`
- `src/styles/mixins/`
- `src/styles/custom.less`

閱讀時關注：

- prefix class 如何統一。
- 變數如何命名。
- 元件樣式如何拆檔。
- mixin 是否處理重複狀態。
- 使用者如何覆蓋主題變數。

## 最小實作範圍

建立一套 mini style system：

- 使用 `$prefix: 'mini'`。
- 建立基礎變數：主色、成功色、錯誤色、文字色、邊框色、背景色。
- 建立尺寸變數：small、default、large。
- 建立 button、input、tag 的樣式檔。
- 建立共用 mixin：disabled、focus、ellipsis。
- 建立入口樣式檔 `index.scss`。

先不實作：

- 暗色模式。
- CSS variables 完整主題切換。
- 按需樣式打包。
- RTL。
- 所有元件樣式。

## API 設計

樣式目錄建議：

```text
styles/
  index.scss
  variables.scss
  mixins.scss
  components/
    button.scss
    input.scss
    tag.scss
```

命名規則：

```text
mini-btn
mini-btn-primary
mini-btn-disabled
mini-input
mini-input-focused
mini-tag
mini-tag-closable
```

狀態 class 原則：

- 狀態直接接在元件 class 後面。
- 不讓狀態名稱依賴 DOM 結構。
- 禁用狀態統一使用 `disabled`。
- 載入狀態統一使用 `loading`。
- 聚焦狀態統一使用 `focused`。

## 實作步驟

1. 建立 `variables.scss`，定義色彩、字級、圓角、間距。
2. 建立 `mixins.scss`，放 disabled、focus-ring、ellipsis。
3. 建立 `components/button.scss`，對應 MiniButton 的 class。
4. 建立 `components/input.scss`，對應 MiniInput 的 wrapper、prefix、suffix。
5. 建立 `components/tag.scss`，對應 MiniTag 的 color、size、close。
6. 建立 `index.scss` 匯入所有樣式。
7. 回頭檢查元件 class 是否和樣式檔一致。

## 驗收案例

- 修改 `$primary-color` 後，Button primary 與 focus ring 都跟著改變。
- disabled mixin 能同時用在 Button 與 Input。
- Button 的 size class 不影響 type class。
- Input 有 prefix/suffix 時，padding 與 icon 區域不重疊。
- Tag 的 close icon hover 樣式不需要改元件邏輯。

## 源碼反思

View UI Plus 使用完整的樣式組織方式，必須支援大量元件、使用者覆蓋、主題調整與長期維護。仿寫版不需要一次做到那麼完整，但必須從一開始建立一致命名。

如果 class 命名在前三個元件就失控，後面 Table、Select、Modal 會快速變成難以維護的樣式堆疊。
