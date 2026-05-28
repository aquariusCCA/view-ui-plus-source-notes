# 暗色模式與 token 現代化

## 學習目標

這篇不是說 View UI Plus v1.3.20 已經完整支援暗色模式，而是從現有 Less token 推導如果要現代化樣式系統，應該如何演進到暗色模式、CSS variables 與 token pipeline。

讀完後，要能分辨「目前源碼事實」和「可演進方向」，避免把編譯期 Less token 誤讀成 runtime theme 系統。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/styles/custom.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/color/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/button.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/input.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/modal.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/table.less`

## 目前能力邊界

View UI Plus v1.3.20 的樣式主體是 Less 編譯期變數。這代表：

- 主題值在 build 階段決定。
- 瀏覽器收到的是普通 CSS。
- runtime 切換主題需要換 CSS 或額外覆蓋。
- 色彩、背景、文字、邊框沒有以 CSS variables 暴露。
- 暗色模式沒有形成完整 token 分層。

所以本章的暗色模式討論是設計延伸，不是對現有能力的直接描述。

## 暗色模式需要哪些 token

暗色模式不是把背景改黑就好。至少要重新定義：

- page background
- component background
- elevated background
- text primary / secondary / disabled
- border base / split
- fill hover / active / selected
- shadow
- mask
- primary、success、warning、error 在暗色背景上的可讀性

現有 `custom.less` 已經有一些可對應的變數，例如：

- `@body-background`
- `@component-background`
- `@title-color`
- `@text-color`
- `@text-color-secondary`
- `@border-color-base`
- `@border-color-split`
- `@background-color-base`
- `@tooltip-bg`
- `@shadow-color`

但它們還沒有被組織成 light / dark 兩套主題。

## 為什麼需要語意 token

暗色模式最怕使用「顏色名稱 token」而不是「語意 token」。

例如：

- `@white` 在 light theme 中可能是背景。
- 在 dark theme 中，背景不應仍然是 white。
- 如果元件寫死 `background-color: #fff`，暗色模式就需要大量覆蓋。

更好的方式是使用語意 token：

- `@component-background`
- `@text-color`
- `@border-color-split`
- `@table-thead-bg`
- `@input-bg`

語意 token 可以在不同主題下指向不同實際顏色。

## 從 Less 到 CSS variables

如果要支援 runtime 切換主題，可以把部分 token 轉成 CSS variables：

```css
:root {
    --ivu-primary-color: #2d8cf0;
    --ivu-text-color: #515a6e;
    --ivu-component-background: #fff;
}

[data-theme="dark"] {
    --ivu-text-color: rgba(255, 255, 255, 0.85);
    --ivu-component-background: #1f1f1f;
}
```

元件樣式再使用：

```css
color: var(--ivu-text-color);
background: var(--ivu-component-background);
```

這樣主題切換可以在瀏覽器 runtime 完成，不必重新編譯 Less。

## 漸進式現代化策略

不需要一次把所有 Less 變數搬成 CSS variables。可以先挑高價值 token：

1. 色彩：primary、success、warning、error。
2. 背景：body、component、elevated。
3. 文字：title、text、secondary、disabled。
4. 邊框：base、split。
5. 浮層：mask、shadow、z-index 保持 Less 或常數。

尺寸 token 如 `@btn-height-base`、`@input-height-base` 不一定需要 runtime 切換，可以保留編譯期 Less。

## 元件改造風險

把 Less token 改成 CSS variables 時，要注意：

- Less 的 `tint()`、`shade()` 不能直接處理 runtime CSS variable。
- hover / active 色需要預先產生變數，例如 `--ivu-primary-hover-color`。
- 透明度可以用 rgba token 或 color-mix，但瀏覽器相容性要確認。
- 舊版覆蓋 Less 變數的使用者可能需要遷移。
- dist CSS 體積可能增加。

也就是說，CSS variables 解決 runtime 主題，但會改變原本的編譯期色彩生成模型。

## token pipeline

更完整的現代 token pipeline 可能長這樣：

1. 用 JSON 或 TS 定義基礎 token。
2. 產生 Less 變數給舊版樣式使用。
3. 產生 CSS variables 給 runtime theme 使用。
4. 產生文件表格與設計工具 token。
5. 產生 light / dark / compact 等主題包。

View UI Plus v1.3.20 還停留在 Less token 階段，但它的變數命名已經能作為 token pipeline 的起點。

## 設計啟發

暗色模式的核心不是黑色，而是語意映射。先把 token 從「值」整理成「用途」，再談不同主題下的值。

改造順序可以是：

1. 找出硬編碼顏色。
2. 將硬編碼顏色替換成語意 Less token。
3. 將高價值語意 token 暴露為 CSS variables。
4. 建立 light / dark token 對照。
5. 補元件狀態截圖與回歸測試。

## 複習題

1. 為什麼 View UI Plus v1.3.20 不能直接視為 runtime theme 系統？
2. 暗色模式至少需要重新定義哪些 token？
3. 為什麼語意 token 比顏色名稱 token 更適合暗色模式？
4. Less 的 `tint()`、`shade()` 和 CSS variables 有什麼衝突？
5. 哪些 token 適合優先轉成 CSS variables？
