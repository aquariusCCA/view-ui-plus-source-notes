# Tag Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

原本 `README.md` 已經列出 `tag.vue`、`tag.less`、`types/tag.d.ts` 與 example，但還沒有說清楚這些來源之間的責任關係。

對 `Tag` 來說，只列 runtime 入口不夠，因為它的行為分散在三層：

1. `tag.vue` 決定 props、DOM 結構、內部 checked 狀態與事件輸出。
2. `tag.less` 決定 `checked`、`border`、`dot`、尺寸、內建色與關閉 icon 的視覺。
3. `types/tag.d.ts` 描述 public API，但對自定義顏色與事件 payload 的表達不完全精準。

## 1. 本章定位

本章是一篇 source map 筆記。它不逐一分析每個 computed，也不深入展開顏色樣式，而是先建立完整閱讀地圖。

讀完後，應該能回答：

1. `Tag` 的 runtime、style、type、example、registry 分別在哪裡。
2. 哪些行為由 `tag.vue` 負責，哪些效果一定要回到 less 才能理解。
3. 為什麼 `TagSelectOption` 是重要的延伸閱讀入口。
4. 初次閱讀時應該按照什麼順序打開檔案。

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue` | 定義 props、template、computed class/style、`isChecked`、`close()`、`check()`、watcher。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/index.js` | 匯出 `tag.vue` 作為單元件入口。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less` | 定義 `ivu-tag`、size、checked、checkable、closable、border、dot、內建色樣式。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts` | 定義 `Tag` 的 TypeScript public contract。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Tag } from './tag'` 匯出型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/tag.vue` | 展示官方使用場景與 props 組合。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Tag`、`TagSelect`、`TagSelectOption`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域安裝時透過 component map 註冊 `Tag`。 |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select-option.vue` | 用 `Tag checkable` 包出選項，展示 `on-change` 如何被上層接管。 |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/notification/notification-item.vue` | 用 `Tag` 呈現 notification 的狀態標籤。 |

## 3. Runtime 責任分工

`tag.vue` 是主要行為入口。它負責四件事。

第一，宣告 public props：

```txt
closable / checkable / checked / color / type / name / size
```

第二，輸出固定的 template 結構：

```vue
<div :class="classes" @click.stop="check" :style="wraperStyles">
    <span v-if="showDot" :class="dotClasses" :style="bgColorStyle"></span>
    <span :class="textClasses" :style="textColorStyle"><slot></slot></span>
    <Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
</div>
```

第三，把 props 與內部狀態轉成 class / style：

```txt
classes
wraperStyles
textClasses
iconClass
lineColor
bgColorStyle
textColorStyle
```

第四，管理互動事件：

```txt
root click -> check()
close icon click -> close()
checked prop change -> isChecked watcher sync
```

這表示 `Tag` 的 runtime 雖然短，但它同時處理「視覺分支」與「互動狀態」。閱讀時不能只看 props 表。

## 4. Style 責任分工

`tag.less` 是視覺行為的主要來源。它把 runtime 產生的 class 轉成具體畫面。

| Less 區塊 | 責任 |
| --- | --- |
| `.ivu-tag` | 基礎 display、height、padding、border、background、font-size。 |
| `&-size-large` / `&-size-medium` | 大、中尺寸高度與 padding。 |
| `&:not(&-border):not(&-dot):not(&-checked)` | default type 未選中時改成透明背景與透明邊框。 |
| `&-checkable` | 可選標籤 cursor pointer。 |
| `&-dot` / `&-dot-inner` | dot type 的根節點尺寸、白底、圓點樣式。 |
| `&-border` | border type 的外框、分隔線、close icon 位置。 |
| `&-primary` / `&-success` / `&-warning` / `&-error` | 語意色背景與白字。 |
| `.make-color-classes()` | 產生 pink、magenta、red、volcano、orange、yellow、gold、cyan、lime、green、blue、geekblue、purple 等色階 class。 |

這裡有一個閱讀重點：內建色大多由 less class 負責，但自定義色不是。自定義色主要靠 `tag.vue` 的 inline style，因此 `Tag` 的顏色系統一定要同時看 runtime 與 less。

## 5. Type 與 Public Export

`types/tag.d.ts` 描述使用者可以傳入的 props 與事件 listener，例如：

```txt
closable
checkable
checked
type
color
name
size
onOnClose
onOnChange
```

`types/viewuiplus.components.d.ts` 再透過：

```ts
export { Tag } from './tag'
```

把 `Tag` 放進 typed public exports。

runtime 的 public export 則在 `src/components/index.js`：

```js
export { default as Tag } from './tag';
```

全域安裝時，`src/index.js` 會遍歷 component map 呼叫：

```js
app.component(key, ViewUI[key]);
```

同一段附近有 `// todo i-tag` 註解，表示這個版本沒有像 `iButton` 那樣提供明確的 `iTag` alias 註冊。閱讀時要把 `Tag` 的正式 component name 與可能的歷史 alias 註解分開看。

## 6. Consumer 的閱讀價值

`TagSelectOption` 是理解 `Tag` 控制邊界的好入口。它的 template 使用：

```vue
<Tag checkable :checked="checked" @on-change="handleChange" :color="color" v-bind="tagProps">
    <slot></slot>
</Tag>
```

這代表 `Tag` 只負責單顆標籤的點擊切換與事件輸出。真正的列表選取、`modelValue` 同步、全選邏輯，全部由 `TagSelect` / `TagSelectOption` 接管。

`Select` 的 multiple tag 則是另一種參考：它直接手寫 `ivu-tag` class 形狀，不一定使用 `Tag` component。這說明 `ivu-tag` 樣式也會被其他元件借用，但本目錄主線仍以 `Tag` 本體為主。

## 7. 建議閱讀順序

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/tag.d.ts`，建立 public API 地圖。
2. 再讀 `examples/routers/tag.vue`，確認官方實際展示哪些組合。
3. 回到 `tag.vue`，理解 template、props、computed、methods、watcher。
4. 讀 `tag.less`，對照 `classes`、`textClasses`、`dotClasses`、`closable`、`checked` 的樣式結果。
5. 補看 `tag-select-option.vue`，理解 `Tag` 的 `on-change` 如何被上層封裝成列表選取。
6. 最後看 `components/index.js`、`src/index.js`、`viewuiplus.components.d.ts`，確認 public export 與 install 路徑。

這個順序能避免一開始就陷入顏色 selector，也能避免只看 runtime 而忽略 type declaration 的落差。

## 8. 本章總結

`Tag` 的完整行為由 runtime、style、type 與 consumer 共同成立。`tag.vue` 定義狀態與事件，`tag.less` 定義大量視覺分支，`.d.ts` 描述 public surface，但沒有完整表達所有 runtime 細節。

這組元件很適合用來學習「小型元件如何同時有展示狀態與互動狀態」，也能訓練閱讀 component source 時把 props、class、inline style、事件與外部控制分開理解。

## 9. 自我檢查問題

1. `Tag` 的單元件入口是哪個檔案？
2. `Tag` 的 typed public export 由哪個檔案提供？
3. 為什麼只看 `tag.less` 不能完整理解自定義 color？
4. `TagSelectOption` 為什麼適合拿來觀察 `Tag` 的控制邊界？
5. `src/index.js` 附近的 `// todo i-tag` 註解代表什麼閱讀提醒？
