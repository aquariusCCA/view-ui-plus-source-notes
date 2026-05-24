# View UI Plus `Tag` 元件 Source Map：閱讀入口、責任分工與學習路線

## 1. 本章定位

本章是一篇 View UI Plus `Tag` 元件的 source map 筆記，目標是幫助讀者建立「第一次系統性閱讀 `Tag` 原始碼」時需要的全局地圖。

在閱讀元件庫原始碼時，初學者常見的錯誤是只打開 `.vue` 檔案，然後試圖從單一檔案理解所有行為。但在 View UI Plus 這類 UI component library 中，一個元件通常由多層共同組成：`.vue` 檔案處理 props、template、狀態與事件；`.less` 檔案處理視覺外觀；`.d.ts` 檔案提供 TypeScript 使用者看到的 public API；example 展示官方預期的使用場景；registry 與 install 檔案則決定元件如何被匯出與全域註冊。

`Tag` 是很適合入門閱讀的小型元件，因為它不像大型表單或表格元件那樣龐大，但又不是完全靜態的展示元件。它同時具備幾種常見的 UI 元件能力：

- 透過 props 決定外觀，例如 `color`、`type`、`size`。
- 透過狀態決定是否 checked。
- 透過互動事件支援 close 與 check。
- 透過 slot 顯示使用者傳入的標籤文字。
- 透過 less class 與 inline style 共同完成顏色系統。
- 透過上層 consumer 被組合成更完整的選取功能。

因此，本章不追求一次講完所有細節，而是先回答一個更基礎的問題：如果要讀懂 `Tag`，應該先知道有哪些檔案、每個檔案負責什麼，以及它們之間如何互相配合。

---

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼地圖為準。這裡的「baseline」不是指完整原始碼逐行分析，而是指本章所有閱讀路線、檔案角色與責任分工，都依據這個版本的檔案結構整理。

| 類型 | 路徑 | 主要角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/tag.vue` | 定義元件本體的 props、template、computed class/style、內部 `isChecked` 狀態、`close()`、`check()` 與 watcher。 | 先理解 `Tag` 如何把 props 與內部狀態轉成 DOM、class、style 與事件。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag/index.js` | 匯出 `tag.vue` 作為單元件入口。 | 確認單一元件模組如何被其他 index 或 install 流程引用。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/tag.less` | 定義 `ivu-tag`、尺寸、checked、checkable、closable、border、dot、內建色等樣式。 | 對照 `tag.vue` 產生的 class，理解畫面結果真正如何形成。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/tag.d.ts` | 定義 `Tag` 對 TypeScript 使用者暴露的 public contract。 | 比對型別宣告與 runtime 行為是否完全一致。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Tag } from './tag'` 匯出 `Tag` 型別。 | 理解元件型別如何被納入整個 View UI Plus 的 typed public exports。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/tag.vue` | 展示官方使用場景與 props 組合。 | 先用 example 建立「官方期望使用方式」，再回頭看實作細節。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Tag`、`TagSelect`、`TagSelectOption`。 | 理解 `Tag` 與其相關組合元件如何一起進入 component map。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域安裝時透過 component map 註冊 `Tag`。 | 理解 `app.component(key, ViewUI[key])` 如何把元件註冊到 Vue app。 |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/tag-select/tag-select-option.vue` | 使用 `Tag checkable` 包出選項，展示 `on-change` 如何被上層接管。 | 觀察 `Tag` 作為底層元件時，如何被上層元件組合成列表選取。 |
| Consumer | `01-origin/source/view-ui-plus-v1.3.20/src/components/notification/notification-item.vue` | 使用 `Tag` 呈現 notification 的狀態標籤。 | 觀察 `Tag` 在其他業務型元件中的展示用途。 |

這張表不是單純查路徑用，而是閱讀順序的基礎。對 `Tag` 這種元件來說，runtime、style 與 type 三者缺一不可。只讀 `tag.vue`，會知道它產生了哪些 class，但不知道這些 class 會變成什麼畫面；只讀 `tag.less`，會看到大量 selector，但不知道哪些 selector 由哪些 props 觸發；只讀 `.d.ts`，會知道使用者能傳哪些 props，卻看不到 runtime 是否還有更細的行為分支。

---

## 3. 先建立 `Tag` 的整體模型

在深入檔案之前，應先把 `Tag` 理解成一個同時具備「展示」、「互動」與「可組合」能力的小型元件。

所謂展示能力，是指它可以把 slot 內容包裝成標籤樣式，並依據 `color`、`type`、`size` 這類 props 顯示不同外觀。這部分通常需要同時看 `tag.vue` 與 `tag.less`，因為 `tag.vue` 會決定 class 與 inline style，而 `tag.less` 才會把 class 轉成真正的視覺結果。

所謂互動能力，是指它不只是靜態文字。`Tag` 有 `closable` 與 `checkable` 這類 prop，也有 `close()` 與 `check()` method。當使用者點擊 root tag 時，會進入 `check()`；當使用者點擊 close icon 時，會進入 `close()`。此外，`checked` prop 的變化會透過 watcher 同步到內部 `isChecked` 狀態。這表示 `Tag` 同時支援外部控制與內部互動狀態。

所謂可組合能力，是指 `Tag` 本身只負責單顆標籤，但它可以被 `TagSelectOption` 這類上層元件包裝成列表選項。這種設計在 UI 元件庫中很常見：底層元件提供最小可用單位，上層元件負責資料集合、選取規則、同步邏輯與更複雜的互動流程。

因此，讀 `Tag` 時不要只問「這個 prop 是什麼」，而要問：這個 prop 影響的是 DOM、class、inline style、事件，還是上層 consumer 的組合方式？這個問題會貫穿本章後續所有閱讀路線。

---

## 4. Runtime：`tag.vue` 的責任分工

`tag.vue` 是 `Tag` 的主要行為入口。它負責把使用者傳入的 props、slot 與使用者互動轉換成元件的 DOM 結構、class、style 與事件輸出。對第一次閱讀的人來說，`tag.vue` 不應該被視為「全部真相」，而應該被視為「行為調度中心」。它決定要產生哪些狀態與標記，再交由 style、type 與 consumer 共同完成整體行為。

### 4.1 Public props：元件對外可調整的入口

public props 包含：

```txt
closable / checkable / checked / color / type / name / size
```

這些 props 可以分成幾種不同責任。

| Prop | 責任類型 | 閱讀時要問的問題 |
| --- | --- | --- |
| `closable` | 互動與結構 | 是否顯示 close icon？點擊 icon 後會觸發什麼事件？ |
| `checkable` | 互動狀態 | root tag 是否可被點擊切換？是否會影響 cursor 與 checked 樣式？ |
| `checked` | 外部狀態輸入 | 外部傳入的 checked 如何同步到內部 `isChecked`？ |
| `color` | 視覺樣式 | 是內建色還是自定義色？由 class 還是 inline style 處理？ |
| `type` | 視覺變體 | `border`、`dot` 或 default 類型會如何影響 DOM 與 class？ |
| `name` | 事件識別 | 事件輸出時是否用來讓上層辨識是哪一顆 tag？實際 payload 需後續確認。 |
| `size` | 視覺尺寸 | 對應到哪些 size class？是否由 `tag.less` 控制高度與 padding？ |

這裡的重點是：props 不是單純資料欄位，而是 runtime 與 style 之間的橋樑。舉例來說，`color` 在 public API 上看起來只是一個顏色設定，但實作上可能會分成內建色 class 與自定義 inline style 兩條路線；`checked` 看起來只是 boolean，但它會牽涉外部 prop、內部 `isChecked`、watcher、class 與互動事件。

### 4.2 Template：固定 DOM 骨架與條件節點

template 結構如下：

```vue
<div :class="classes" @click.stop="check" :style="wraperStyles">
    <span v-if="showDot" :class="dotClasses" :style="bgColorStyle"></span>
    <span :class="textClasses" :style="textColorStyle"><slot></slot></span>
    <Icon v-if="closable" :class="iconClass" :color="lineColor" type="ios-close" @click.stop="close"></Icon>
</div>
```

這段 template 可以拆成三層來看。

第一層是 root `<div>`。它承載整個 tag 的外層 class、外層 inline style，並且透過 `@click.stop="check"` 接收點擊事件。這代表「點擊 tag 本身」與「切換 checked 狀態」的入口在 root 上，而不是在文字 `<span>` 上。

第二層是 dot 節點。`<span v-if="showDot">` 代表 dot 並不是永遠存在，而是由 runtime 條件決定。當 `type` 或其他條件讓 `showDot` 成立時，才會出現 dot inner。它的 class 與背景 style 分別由 `dotClasses` 與 `bgColorStyle` 決定，因此 dot 的視覺結果必須同時回到 computed 與 less 中理解。

第三層是文字與 close icon。文字節點透過 slot 承接使用者內容，因此 `Tag` 本身不決定文字內容，只決定文字外觀與包裝方式。close icon 則只有在 `closable` 為真時才會出現，而且 click handler 使用 `@click.stop="close"`，避免點擊關閉 icon 時同時冒泡到 root 的 `check()`。

這裡有一個很重要的閱讀點：`@click.stop` 不是偶然出現的。對同時具備 check 與 close 的元件來說，如果 close icon 的 click 沒有停止冒泡，使用者點擊關閉時可能同時觸發 root 的 check 行為。從 template 就可以看出，`Tag` 的互動設計需要區分「點擊 tag」與「點擊關閉 icon」。

### 4.3 Computed class / style：runtime 與 less 的交界

computed class / style 包含：

```txt
classes
wraperStyles
textClasses
iconClass
lineColor
bgColorStyle
textColorStyle
```

這些 computed 是理解 `Tag` 的核心，因為它們位於 runtime 與 style 的交界處。`tag.vue` 不會直接寫死所有 CSS 規則，而是根據 props 與內部狀態產生 class 或 inline style，再交由 `tag.less` 或瀏覽器 style attribute 產生最終畫面。

可以先用責任分工來理解它們：

| Computed | 可能責任 | 閱讀重點 |
| --- | --- | --- |
| `classes` | 根節點 class 組合 | 對應 `ivu-tag`、`checked`、`checkable`、`border`、`dot`、size、color 等外層樣式。 |
| `wraperStyles` | 根節點 inline style | 可能處理自定義色、邊框或背景等外層樣式；實際條件需後續看原始碼確認。 |
| `textClasses` | 文字節點 class | 影響文字區域樣式，可能配合 type、color 或 checked 狀態。 |
| `iconClass` | close icon class | 影響 close icon 的位置、顏色或 hover 樣式。 |
| `lineColor` | close icon color | 傳給 `<Icon>` 的 `color`，通常與 tag 顏色系統相關。 |
| `bgColorStyle` | dot 背景樣式 | dot type 或自定義 color 時，可能決定圓點背景色。 |
| `textColorStyle` | 文字 inline style | 自定義色或特殊 type 時，可能決定文字顏色。 |

此處需要注意，這份筆記目前沒有提供這些 computed 的完整程式碼，因此不能進一步斷言每一個 computed 的所有判斷條件。正確的後續閱讀方式是：先用這張表建立「每個 computed 大概負責哪一層」，再打開 `tag.vue` 逐一確認條件分支。

### 4.4 Methods 與 watcher：互動狀態的入口

`Tag` 有三條互動與同步路線：

```txt
root click -> check()
close icon click -> close()
checked prop change -> isChecked watcher sync
```

這三條路線分別對應三種設計需求。

第一，`root click -> check()` 表示當 `Tag` 被設計成 checkable 時，使用者點擊標籤本體應該能切換或通知 checked 狀態變化。實際是否一定切換內部狀態、是否 emit `on-change`、payload 長什麼樣子，需後續閱讀 `check()` 原始碼確認。

第二，`close icon click -> close()` 表示 closable tag 可以被關閉。這裡的「關閉」通常不應理解成 `Tag` 自己直接從父層資料中刪掉自己，而是由 `Tag` 發出事件，讓父層決定是否移除該 tag。實際事件名稱與 payload 需以 `tag.vue` 與 `types/tag.d.ts` 為準。

第三，`checked prop change -> isChecked watcher sync` 表示 `Tag` 不是完全自顧自的內部狀態元件。它會接收外部傳入的 `checked`，並同步到內部 `isChecked`。這是 UI 元件常見的半受控模式：元件內部需要一個狀態來決定畫面，但也要能被父層狀態驅動。

---

## 5. Style：`tag.less` 的責任分工

`tag.less` 是 `Tag` 視覺行為的主要來源。runtime 產生的 class 只是一組標記，真正的尺寸、背景、邊框、文字顏色、dot 形狀與 close icon 位置，都需要回到 less 才能理解。

對元件庫作者來說，把視覺分支放在 less 中有一個好處：runtime 可以維持相對簡潔，只負責判斷狀態與產生 class；樣式細節則集中在 style layer 中維護。對閱讀者來說，這也代表不能只讀 `tag.vue`。如果你只看 runtime，最多知道某個狀態會加上某個 class，但不知道這個 class 會造成什麼畫面差異。

### 5.1 Less 區塊總覽

| Less 區塊 | 主要責任 | 學習重點 |
| --- | --- | --- |
| `.ivu-tag` | 定義基礎 display、height、padding、border、background、font-size。 | 這是所有 tag 樣式的基礎層，其他變體通常建立在它之上。 |
| `&-size-large` / `&-size-medium` | 定義大、中尺寸高度與 padding。 | 對照 `size` prop，理解尺寸不是 runtime 直接算出來，而是透過 class 套用。 |
| `&:not(&-border):not(&-dot):not(&-checked)` | default type 未選中時改成透明背景與透明邊框。 | 這類 selector 需要特別小心，因為它描述的是「排除某些狀態後」的樣式。 |
| `&-checkable` | 定義可選標籤的互動視覺，例如 cursor pointer。 | 對照 `checkable` prop 與 `check()` 互動行為。 |
| `&-dot` / `&-dot-inner` | 定義 dot type 的根節點尺寸、白底與圓點樣式。 | dot 不只是顏色點，通常也會影響整體 tag 的結構與間距。 |
| `&-border` | 定義 border type 的外框、分隔線與 close icon 位置。 | 對照 `type="border"` 與 `closable` 組合。 |
| `&-primary` / `&-success` / `&-warning` / `&-error` | 定義語意色背景與白字。 | 這類顏色通常對應 design system 的語意色。 |
| `.make-color-classes()` | 產生 pink、magenta、red、volcano、orange、yellow、gold、cyan、lime、green、blue、geekblue、purple 等色階 class。 | 這代表部分顏色 class 不是手寫逐一列出，而是由 less mixin 生成。 |

### 5.2 內建色與自定義色要分開讀

內建色大多由 less class 負責，但自定義色不是。自定義色主要靠 `tag.vue` 的 inline style，因此 `Tag` 的顏色系統一定要同時看 runtime 與 less。

這個觀察可以整理成以下模型：

| 顏色來源 | 主要處理位置 | 閱讀方式 |
| --- | --- | --- |
| 語意色，例如 `primary`、`success`、`warning`、`error` | `tag.less` 的語意色 class | 看 runtime 如何加 class，再看 less 如何定義背景與文字。 |
| 色階色，例如 pink、red、orange、blue、purple 等 | `tag.less` 的 `.make-color-classes()` | 看 mixin 產生哪些 class，以及這些 class 如何套到 tag。 |
| 自定義色，例如使用者傳入非內建色值 | `tag.vue` 的 inline style computed | 看 `wraperStyles`、`bgColorStyle`、`textColorStyle` 等 computed 如何處理。 |

這裡要建立一個重要觀念：在元件庫中，`color` prop 的實作可能不是單一路徑。當使用者傳入的是設計系統已知的顏色名稱，元件可以透過 class 取得完整一致的樣式；當使用者傳入自定義顏色，元件可能需要用 inline style 動態指定背景、文字或 dot 顏色。

這種設計同時帶來彈性與複雜度。彈性在於使用者可以傳入客製色；複雜度在於閱讀者必須同時追 runtime computed 與 less selector，不能只看其中一邊。

### 5.3 `checked`、`border`、`dot` 是樣式閱讀的三個關鍵狀態

`tag.less` 中特別處理了 `checked`、`border` 與 `dot`。這三個狀態應該優先閱讀，因為它們會改變 tag 的主要視覺語意。

`checked` 代表標籤是否處於選中狀態。對 `checkable` tag 來說，這通常會影響背景、邊框或文字顏色。由於 `checked` 也牽涉 `checked` prop、內部 `isChecked` 與 watcher，因此它是 runtime 與 style 的交會點。

`border` 代表一種帶外框的 tag 變體。`&-border` 會處理外框、分隔線與 close icon 位置，這表示 border type 不只是改 border 顏色，也可能影響 close icon 的布局。

`dot` 代表帶有圓點提示的 tag 變體。dot type 會有 `&-dot` 與 `&-dot-inner`，並且 template 中也有 `showDot` 控制 dot 節點是否出現。這說明 dot type 是 runtime DOM 結構與 less 視覺樣式共同完成的，不是單靠 CSS pseudo-element 生成。

---

## 6. Type 與 Public Export：使用者看到的 API 表面

對元件庫來說，runtime 實作只是其中一面，型別宣告與對外匯出同樣重要。尤其在 Vue + TypeScript 專案中，使用者不一定會直接讀 `tag.vue`，但一定會透過 IDE、型別提示與文件感受到 `types/tag.d.ts` 的設計。

### 6.1 `types/tag.d.ts`：TypeScript public contract

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

這些型別宣告的作用是建立 public contract，也就是告訴 TypeScript 使用者：這個元件允許哪些 props、事件 listener 名稱是什麼、各欄位大概接受什麼型別。

但是，型別宣告不一定能完整表達 runtime 的全部細節。`types/tag.d.ts` 對自定義顏色與事件 payload 的表達不完全精準。這裡的閱讀提醒是：當你要真正理解元件行為時，不能只相信 `.d.ts`，也要回頭比對 `tag.vue` 的 props、methods、emit 行為，以及 example 中的實際用法。

此處需要後續補充：本章目前沒有完整 `types/tag.d.ts` 內容，因此無法精準列出每個 prop 的型別、預設值與 event payload。後續應獨立整理一篇「`Tag` 型別宣告與 runtime 行為對照表」。

### 6.2 Typed public export：`viewuiplus.components.d.ts`

`types/viewuiplus.components.d.ts` 透過以下方式匯出 `Tag` 型別：

```ts
export { Tag } from './tag'
```

這一層的意義是：`Tag` 不只是存在於自己的 `types/tag.d.ts`，它還需要被納入整個 View UI Plus 的 component type exports。對使用者來說，這會影響從套件層級引用元件型別時能不能拿到 `Tag`。

閱讀時要區分兩種 export：

| Export 類型 | 位置 | 責任 |
| --- | --- | --- |
| Runtime export | `src/components/index.js` | 讓 JavaScript runtime 可以取得 `Tag` component。 |
| Type export | `types/viewuiplus.components.d.ts` | 讓 TypeScript 使用者可以取得 `Tag` 的型別宣告。 |

這兩條路線雖然都叫 export，但服務的對象不同。runtime export 影響元件能不能被註冊、被引入、被渲染；type export 影響 IDE 提示、型別檢查與使用者開發體驗。

### 6.3 Component registry 與 plugin install

runtime 的 public export 在 `src/components/index.js`：

```js
export { default as Tag } from './tag';
```

全域安裝時，`src/index.js` 會遍歷 component map 並呼叫：

```js
app.component(key, ViewUI[key]);
```

這代表 `Tag` 的全域註冊不是只靠 `tag.vue` 自己完成，而是透過 View UI Plus 的 install 流程統一處理。對元件庫來說，這種集中式註冊很常見，因為它可以讓使用者透過 `app.use(ViewUIPlus)` 這類方式一次註冊多個元件。

`// todo i-tag` 註解，表示這個版本沒有像 `iButton` 那樣提供明確的 `iTag` alias 註冊。閱讀時要把正式 component name 與可能的歷史 alias 註解分開看，避免把 todo 註解誤解成已完成的 public API。

---

## 7. Consumer：從 `TagSelectOption` 理解控制邊界

`TagSelectOption` 是理解 `Tag` 控制邊界的重要入口。因為讀一個基礎元件時，不能只看它自己，也要看它如何被更高階的元件使用。consumer 可以告訴我們：元件作者預期底層元件承擔哪些責任，又把哪些責任交給上層。

`TagSelectOption` template 如下：

```vue
<Tag checkable :checked="checked" @on-change="handleChange" :color="color" v-bind="tagProps">
    <slot></slot>
</Tag>
```

這段用法可以拆成幾個觀察。

第一，`TagSelectOption` 明確使用 `Tag checkable`，代表它把 `Tag` 當成一個可點擊、可選取的選項外觀。這不是單純展示文字，而是把 `Tag` 的 checkable 能力納入上層選取元件。

第二，`:checked="checked"` 表示 checked 狀態由上層傳入。也就是說，`Tag` 雖然有內部 `isChecked`，但在 `TagSelectOption` 場景中，選取狀態應該由上層選取模型控制，再傳回給單顆 `Tag`。

第三，`@on-change="handleChange"` 表示 `Tag` 的變化事件不在原地結束，而是被上層接住。`Tag` 負責發出「我被點擊或狀態想要變化」的訊號，`TagSelectOption` 再把它轉成列表選取邏輯需要的行為。

第四，`v-bind="tagProps"` 表示上層可以繼續把部分 props 透傳給 `Tag`。這類設計讓 wrapper component 不必重新定義所有底層 props，但也要求閱讀者注意資料是從哪一層進來的。

所以，`TagSelectOption` 告訴我們一件事：`Tag` 的責任邊界是「單顆標籤」。它可以處理單顆標籤的外觀、點擊與事件輸出，但真正的列表選取、`modelValue` 同步、全選邏輯，都應由 `TagSelect` / `TagSelectOption` 這類上層元件接管。

### 7.1 `NotificationItem` 與其他 consumer 的閱讀價值

`notification/notification-item.vue` 會使用 `Tag` 呈現 notification 的狀態標籤。這種 consumer 的價值和 `TagSelectOption` 不同。

`TagSelectOption` 展示的是互動型 consumer：它使用 `checkable`，關注事件、checked 狀態與上層同步。

`NotificationItem` 展示的可能是展示型 consumer：它使用 `Tag` 表示某種狀態或分類，重點可能是顏色、文字與視覺語意，而不是 checkable 選取流程。

這兩種 consumer 可以幫助我們把 `Tag` 的使用場景分成兩類：

| 使用場景 | 代表 consumer | 重點 |
| --- | --- | --- |
| 展示型 tag | `notification-item.vue` | 使用 `Tag` 顯示狀態、分類或標籤語意。 |
| 互動型 tag | `tag-select-option.vue` | 使用 `Tag checkable` 作為列表選項的一部分。 |

這種分類能讓你之後閱讀 example 或專案使用場景時更快判斷：目前這顆 `Tag` 是被當成純展示，還是被當成互動選項。

---

## 8. 初次閱讀路線

第一次閱讀 `Tag` 時，不建議直接從 `tag.less` 開始，也不建議一開始就鑽進 computed 細節。比較好的順序是先建立 public API，再看官方 example，接著進入 runtime，最後才對照 style、consumer 與 export。

### 8.1 建議閱讀順序

| 順序 | 檔案 | 閱讀目的 |
| --- | --- | --- |
| 1 | `types/tag.d.ts` | 先建立 public API 地圖，知道 `Tag` 對使用者暴露哪些 props 與事件。 |
| 2 | `examples/routers/tag.vue` | 看官方如何示範 `Tag`，理解常見 props 組合與使用場景。 |
| 3 | `src/components/tag/tag.vue` | 閱讀 template、props、computed、methods、watcher，理解 runtime 如何運作。 |
| 4 | `src/styles/components/tag.less` | 對照 runtime 產生的 class，理解 checked、border、dot、size、color 的視覺結果。 |
| 5 | `src/components/tag-select/tag-select-option.vue` | 觀察 `Tag` 的 `on-change` 如何被上層封裝成列表選取。 |
| 6 | `src/components/index.js`、`src/index.js`、`types/viewuiplus.components.d.ts` | 確認 runtime export、plugin install 與 type export 路徑。 |

### 8.2 為什麼要先看 `.d.ts` 與 example？

先看 `.d.ts` 的好處是，它能讓你用使用者視角理解元件。對元件庫作者來說，public API 是元件對外承諾的入口；對學習者來說，先知道 props 與事件，後面讀 runtime 時才知道每一段程式碼是在實作哪個 public contract。

再看 example 的好處是，它能提供真實使用場景。很多 runtime 分支如果單獨看會覺得零散，但放回官方 example，就能看出這些分支是為了支援哪些組合，例如可關閉標籤、可選標籤、不同 type、不同 color 或不同 size。

### 8.3 為什麼不要一開始就看 `tag.less`？

`tag.less` 很重要，但它不是最好的第一入口。因為 less 中會有大量 selector、巢狀規則與 mixin，如果還不知道 runtime 會產生哪些 class，很容易陷入 selector 細節，卻不知道這些樣式什麼時候會被觸發。

更好的方式是先從 `tag.vue` 找出 class 來源，再回到 `tag.less` 對照。這樣讀 less 時就不是「看到什麼讀什麼」，而是帶著問題去查：

- `checkable` 會加什麼 class？less 裡如何讓它看起來可點擊？
- `checked` 狀態會加什麼 class？less 裡如何改變背景、邊框或文字？
- `dot` type 會不會增加 DOM？less 裡如何設定 dot 形狀？
- `border` type 會不會影響 close icon 位置？less 裡如何處理分隔線？
- `color` 是內建色還是自定義色？該看 less class 還是 inline style？

---

## 9. 常見誤解與閱讀提醒

### 9.1 誤解一：只看 `tag.vue` 就能完全懂 `Tag`

`tag.vue` 是 runtime 主入口，但不是完整行為的全部。它會產生 class 與 inline style，也會處理事件與狀態；可是 class 的實際視覺效果在 `tag.less`，public contract 在 `types/tag.d.ts`，實際使用方式在 example 與 consumer。因此，`tag.vue` 應該被視為「連接各層的中心」，而不是唯一答案。

### 9.2 誤解二：`color` 一定都是 CSS class 控制

內建色大多由 less class 負責，自定義色主要靠 `tag.vue` 的 inline style。這代表 `color` prop 背後至少有兩種處理路線。閱讀時要先判斷目前的 `color` 是不是內建色，否則可能會在 less 中找不到某些自定義顏色的 class。

### 9.3 誤解三：`.d.ts` 等於 runtime 真實行為

`.d.ts` 是 public type contract，但它不一定完整描述所有 runtime 分支。`types/tag.d.ts` 對自定義顏色與事件 payload 的表達不完全精準，因此閱讀時要把型別宣告與 runtime 實作互相對照。當兩者有落差時，應該標註為後續確認項，而不是直接假設其中一邊完全正確。

### 9.4 誤解四：`TagSelectOption` 只是普通使用案例

`TagSelectOption` 不只是普通 consumer，它揭示了 `Tag` 的控制邊界。`Tag` 只負責單顆標籤的點擊與事件輸出，上層的 `TagSelectOption` / `TagSelect` 才負責列表選取與同步。這能幫助你理解元件庫中「底層元件」與「組合元件」的分工。

### 9.5 誤解五：`// todo i-tag` 代表已經有 `iTag` alias

`src/index.js` 附近的 `// todo i-tag` 註解表示這個版本沒有像 `iButton` 那樣提供明確的 `iTag` alias 註冊。閱讀原始碼時要區分「已完成的 public API」與「todo / 註解中的可能意圖」，不要把註解誤當成已實作行為。

---

## 10. 本章總結、延伸方向與自我檢查

### 10.1 本章總結

`Tag` 的完整行為不是由單一檔案決定，而是由 runtime、style、type、example、registry、install 與 consumer 共同構成。`tag.vue` 負責 props、template、computed class/style、`isChecked`、`close()`、`check()` 與 watcher；`tag.less` 負責把 class 轉成具體視覺結果；`types/tag.d.ts` 負責描述 TypeScript 使用者看到的 public contract；example 負責展示官方使用場景；registry 與 install 則讓元件能被匯出與全域註冊；consumer 則告訴我們 `Tag` 在其他元件中如何被組合使用。

這份 source map 的核心學習價值在於：它讓你練習用元件庫作者的視角閱讀小型 UI 元件。不要只看 props 表，也不要只看樣式表，而要把 public API、runtime 行為、class/style 轉換、事件輸出與上層 consumer 放在同一張圖裡理解。

對 View UI Plus 的學習而言，`Tag` 是很好的切入點。它夠小，適合第一次練習 source reading；但它又包含互動狀態、顏色系統、型別宣告與上層組合，能讓你學到閱讀大型元件之前必備的基本方法。

### 10.2 後續延伸方向

這份筆記適合拆成以下幾篇後續獨立筆記：

| 延伸主題 | 建議內容 |
| --- | --- |
| `Tag` runtime 深入解析 | 逐一分析 props、data / state、computed、methods、watcher 與 template 的關係。 |
| `Tag` 顏色系統解析 | 比較內建色、語意色、色階色、自定義色在 runtime 與 less 中的處理方式。 |
| `Tag` 事件與型別宣告對照 | 比對 `close()`、`check()`、`onOnClose`、`onOnChange` 的 runtime emit 與 `.d.ts` listener 型別。 |
| `TagSelectOption` 與 `TagSelect` 組合設計 | 分析單顆 `Tag` 如何被封裝成列表選項，以及 `modelValue`、全選、選取同步如何由上層接管。 |
| `Tag` 樣式 selector 閱讀 | 逐段閱讀 `tag.less`，整理 `checked`、`border`、`dot`、`size`、`closable` 的樣式覆蓋關係。 |
| View UI Plus 元件註冊機制 | 從 `components/index.js` 與 `src/index.js` 理解 runtime export、plugin install 與全域註冊。 |

### 10.3 自我檢查問題

1. 為什麼這份筆記應該歸類為「原始碼閱讀筆記」，而不是單純的 API 筆記？
2. `Tag` 的 runtime 主入口是哪個檔案？它主要負責哪些事情？
3. 為什麼只看 `tag.vue` 不能完整理解 `Tag` 的視覺結果？
4. `tag.less` 中哪些區塊與 `checked`、`border`、`dot` 有關？這些狀態為什麼是閱讀重點？
5. 內建色與自定義色在閱讀方式上有什麼差異？
6. `types/tag.d.ts` 的作用是什麼？為什麼它不一定能完整代表 runtime 真實行為？
7. runtime export 與 type export 有什麼不同？分別影響什麼？
8. `TagSelectOption` 為什麼能幫助理解 `Tag` 的控制邊界？
9. 點擊 close icon 時為什麼需要注意 `@click.stop`？它和 root 的 `check()` 有什麼關係？
10. 如果你要下一步深入閱讀 `Tag`，你會先選擇 runtime、style、type 還是 consumer？為什麼？
