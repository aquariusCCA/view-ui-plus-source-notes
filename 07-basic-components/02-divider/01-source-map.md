# View UI Plus Divider 元件原始碼閱讀筆記：Source Map

## 0. 原始筆記問題分析與筆記類型判斷

### 0.1 筆記類型判斷

這份筆記的主要類型是**原始碼閱讀筆記**，輔助類型是 **API / 設定筆記**。

原因是原始內容的核心不是介紹 `Divider` 的畫面效果而已，而是在整理「要讀懂 `Divider` 元件，需要從哪些檔案切入」。筆記中已經明確列出 runtime component、type declaration、style source、example、component registry 與 plugin install 等入口，這些都屬於原始碼閱讀時會使用的 source map。

不過，`Divider` 同時也是元件庫的 public component，因此閱讀時不能只停留在「檔案在哪裡」，還需要理解：

- 使用者可以透過哪些 props 操作它。
- default slot 是否會改變渲染結構。
- runtime 產生的 class 如何交給 Less 樣式處理。
- 元件如何被匯出與全域註冊，進入 View UI Plus 的 public surface。

因此，本篇會以「原始碼閱讀路線」為主軸，並在適當位置補上 public API、使用情境與樣式行為。

---

### 0.2 原始筆記目前的優點

原始筆記已經具備一份 source map 的基礎結構，尤其已經整理出以下關鍵資訊：

1. `Divider` 的主要 runtime 檔案是 `src/components/divider/divider.vue`。
2. public type declaration 位於 `types/divider.d.ts`。
3. 官方範例位於 `examples/routers/divider.vue`。
4. 樣式規則位於 `src/styles/components/divider.less`。
5. component registry 與 plugin install 需要分別回到 `src/components/index.js` 與 `src/index.js` 確認。
6. `Divider` 的視覺行為不能只看 `.vue`，必須對照 Less。
7. default slot 會影響是否產生帶文字的分隔線結構。
8. 帶文字分隔線的左右線段，主要來自 CSS pseudo-elements。

這些資訊非常適合作為後續深入閱讀的骨架。

---

### 0.3 原始筆記需要補強的地方

原始筆記雖然已經列出不少入口，但仍有幾個地方可以再教材化。

| 需要補強的地方 | 問題說明 | 重構方向 |
| --- | --- | --- |
| 檔案清單偏索引型 | 讀者知道要看哪些檔案，但不一定知道為什麼要看 | 把每個檔案放回「元件對外行為」與「原始碼閱讀流程」中說明 |
| runtime 與 style 的關係還可更清楚 | `divider.vue` 只產生 DOM 與 class，真正畫線的是 Less | 補上 props / slot / class / Less 的轉換鏈 |
| public API 的定位可再加強 | props 不只是內部變數，而是元件對使用者的契約 | 從 `types/divider.d.ts` 說明 public contract |
| 範例檔的價值可再強化 | example 不只是展示畫面，也反映元件作者預期的使用情境 | 把官方範例整理成使用場景表 |
| registry / install 容易被忽略 | 初學者常只看元件本體，忽略元件如何被公開 | 補上 public surface 的概念 |
| 可確認資訊與待確認資訊需要分開 | 原始筆記沒有提供完整 source code | 對未完整列出的 default、validator、Less 變數來源標註需要後續確認 |

---

### 0.4 本篇的資訊邊界

本篇依據原始筆記提供的資訊進行重構，不假裝已完整逐行閱讀所有 View UI Plus 原始碼。因此，以下內容會保守處理：

- 不任意補上原始筆記沒有明確列出的 props default value。
- 不任意補上 `divider.vue` 中完整 script 實作。
- 不任意推測 Less 變數的來源與實際色值。
- 不任意宣稱 `src/index.js` 的註冊細節，除非後續回原始碼確認。

本篇的目標是建立閱讀地圖與理解框架，而不是取代完整源碼逐行分析。

---

## 1. 本章定位：這份 Source Map 要解決什麼問題

`Divider` 是 View UI Plus 中用來呈現分隔線的元件。它看起來很簡單，但在元件庫原始碼閱讀中，簡單元件反而很適合用來練習「從 public API 追到 runtime，再追到樣式系統」的閱讀方法。

本章不負責逐行拆解每一條 Less 規則，也不會把 `Divider` 當成單純速查元件來介紹。它要回答的是：

> 如果要真正讀懂 View UI Plus 的 `Divider`，應該從哪些檔案開始？每個檔案負責補上哪一塊理解？

在元件庫中，一個 public component 通常不是只由單一 `.vue` 檔案構成。以 `Divider` 來說，至少要同時理解以下幾個層面：

```txt
public API
  -> runtime component
  -> generated DOM / class
  -> style source
  -> official examples
  -> component registry
  -> plugin install
```

換句話說，`Divider` 的閱讀重點不是「它輸出一條線」而已，而是要理解 View UI Plus 如何把一個簡單的視覺元件拆成：

1. 對外可使用的 props。
2. Vue runtime 中的渲染結構。
3. class 命名與條件組合。
4. Less 樣式中的實際視覺規則。
5. 元件庫層級的匯出與安裝流程。

建立這個視角之後，後續閱讀其他 View UI Plus 元件時，也可以套用類似方法。

---

## 2. 先理解 Divider 的元件定位

### 2.1 Divider 是分隔元件，不是高互動元件

`Divider` 的主要用途是建立視覺分隔。它通常用在段落、區塊、表單、連結或文字群組之間，用來協助使用者辨識內容的界線。

它和 `Button`、`Input`、`Select` 這類高互動元件不同。`Divider` 通常不需要管理複雜狀態，也不需要處理使用者事件。它的核心責任可以簡化成一句話：

> 根據 props 與 slot，輸出正確的 DOM 結構與 class，然後交給樣式系統畫出對應的分隔線。

因此，閱讀 `Divider` 時應該特別關注兩件事：

1. runtime 如何判斷目前要輸出哪一組 class。
2. Less 如何根據這些 class 畫出水平線、垂直線、虛線與帶文字分隔線。

---

### 2.2 Divider 的兩個核心層次

閱讀 `Divider` 時，可以把它分成兩個主要層次。

第一個層次是 **Vue component runtime**。  
這一層位於 `src/components/divider/divider.vue`，負責接收 props、判斷 default slot 是否存在，並組合出根節點與文字節點需要的 class。

第二個層次是 **Less style source**。  
這一層位於 `src/styles/components/divider.less`，負責把 runtime 產生的 class 轉成實際視覺效果，例如水平線高度、垂直線寬度、虛線邊框、帶文字時的左右線段等。

這兩層之間的關係可以理解成：

```txt
props / slot
  -> divider.vue 判斷狀態
  -> 產生 DOM 與 class
  -> divider.less 接收 class
  -> 呈現實際分隔線樣式
```

如果只看 `divider.vue`，會知道它如何產生 class，但不知道線條怎麼被畫出來。  
如果只看 `divider.less`，會看到很多 class 規則，但不知道哪些 class 是由哪些 props 或 slot 狀態觸發。

所以，`Divider` 是一個很典型的「runtime 與 style 必須一起讀」的元件。

---

## 3. Source Map：入口檔案與責任分工

### 3.1 Source Entry 總表

| 類型 | 路徑 | 角色 | 閱讀重點 |
| --- | --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/divider/divider.vue` | 元件實作本體 | props 定義、default slot 判斷、根節點 class、文字節點 class、template 結構 |
| Type | `01-origin/source/view-ui-plus-v1.3.20/types/divider.d.ts` | 對外型別契約 | `type`、`orientation`、`dashed`、`plain`、`size` 等 public props |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/divider.vue` | 官方使用範例 | 水平線、垂直線、帶文字、左右位置、虛線、plain、small size |
| Style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/divider.less` | 視覺規則來源 | 水平 / 垂直樣式、帶文字分隔線、pseudo-elements、虛線、plain |
| Public Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 元件公開匯出 | 確認 `Divider` 是否被納入 component export |
| Plugin Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 全域安裝入口 | 確認完整安裝 View UI Plus 時是否註冊 `Divider` |

這張表不是單純用來背路徑，而是幫助你建立閱讀順序。  
初次閱讀時，不建議直接跳進 Less 細節，也不建議只看 `.vue`。更好的方式是先從 public API 與官方 example 建立外部使用印象，再回到 runtime 與 style 追內部實作。

---

### 3.2 為什麼不能只看 `divider.vue`

`divider.vue` 是最重要的 runtime 檔案，但它不是完整答案。

原因是 `Divider` 的視覺複雜度主要藏在樣式層。根據原始筆記，普通水平線、垂直線、虛線與帶文字分隔線並不是全部用同一種 CSS 技術完成：

| 類型 | runtime 主要負責 | style 主要負責 |
| --- | --- | --- |
| 普通水平線 | 輸出水平狀態 class | 設定區塊寬度、高度、背景線 |
| 垂直分隔線 | 輸出垂直狀態 class | 設定 `inline-block`、寬度、高度 |
| 虛線 | 根據 `dashed` 產生 class | 使用 dashed border 呈現線條 |
| 帶文字分隔線 | 偵測 default slot 並輸出文字結構 | 使用 `:before` / `:after` 產生左右線段 |
| plain 文字樣式 | 根據 `plain` 產生 class | 調整文字視覺為普通正文樣式 |

因此，`Divider` 的完整理解一定要跨越 `.vue` 與 `.less`。

---

## 4. Runtime：`divider.vue` 負責把 props / slot 轉成 DOM 與 class

### 4.1 `divider.vue` 的核心職責

`src/components/divider/divider.vue` 是 `Divider` 的 runtime component。它的任務不是直接用 JavaScript 畫線，而是根據使用者傳入的 props 與 slot 狀態，產生對應的 DOM 結構與 class。

根據原始筆記，`Divider` 的 template 可以簡化理解為：

```vue
<div :class="classes">
    <span v-if="hasSlot" :class="slotClasses">
        <slot></slot>
    </span>
</div>
```

這段 template 可以拆成兩種情境理解。

第一種情境是沒有 default slot。  
此時只會渲染根節點 `div`。這通常對應普通水平分隔線或垂直分隔線。

第二種情境是有 default slot。  
此時根節點內會多出一個 `span`，用來承載分隔線中間或左右位置的文字。這個 `span` 是否出現，取決於 `hasSlot` 的判斷。

---

### 4.2 `hasSlot` 的意義

`hasSlot` 是理解 `Divider` 的關鍵之一。

在使用者寫下：

```vue
<Divider>iView</Divider>
```

代表 `Divider` 具有 default slot。這時元件不再只是單純畫一條線，而是需要把文字放在線條中，並讓左右線段配合文字位置展開。

相反地，如果使用者寫的是：

```vue
<Divider />
```

就沒有 default slot。這時元件只需要輸出單純的分隔線，不需要內層 `span`。

所以，`hasSlot` 會影響兩件事：

1. 是否渲染承載文字的 `span`。
2. 根節點是否需要加入與 `with-text` 相關的 class，讓 Less 切換到帶文字分隔線的樣式。

---

### 4.3 `classes` 與 `slotClasses` 的閱讀方式

原始筆記中提到 `divider.vue` 會組合 `classes` 與 `slotClasses`。

可以這樣理解：

| 名稱 | 作用位置 | 主要用途 |
| --- | --- | --- |
| `classes` | 根節點 `div` | 描述整個分隔線的狀態，例如水平、垂直、虛線、帶文字、文字位置、plain |
| `slotClasses` | 內層 `span` | 描述文字容器本身的樣式，例如文字尺寸或 plain 狀態相關樣式 |

這個設計很常見：  
根節點 class 控制整體外觀，內層元素 class 控制局部內容。

閱讀時要特別注意，`classes` 不只是靜態字串，而是會被 props 與 slot 狀態影響。例如：

- `type` 會影響水平或垂直分隔線。
- `orientation` 會影響帶文字時的文字位置。
- `dashed` 會影響是否使用虛線。
- `plain` 會影響帶文字分隔線的文字樣式。
- `size` 會影響部分尺寸表現。
- default slot 會影響是否進入 `with-text` 模式。

---

### 4.4 runtime 的閱讀重點

初次閱讀 `divider.vue` 時，建議不要一開始就陷入每個 class 字串的細節，而是先回答以下問題：

1. 這個元件接收哪些 props？
2. 哪些 props 會直接影響根節點 class？
3. 是否有 default slot？
4. default slot 是否會改變 DOM 結構？
5. class 名稱是否能在 `divider.less` 中找到對應規則？
6. `size`、`plain`、`dashed` 是否只在特定情境下才有明顯視覺差異？

只要能回答這些問題，就已經掌握 `Divider` runtime 的主要邏輯。

---

## 5. Public API：`types/divider.d.ts` 定義對外契約

### 5.1 type declaration 的作用

`types/divider.d.ts` 的價值在於定義 `Divider` 的 public contract，也就是使用者在 TypeScript 環境中可以怎麼使用這個元件。

對元件庫來說，type declaration 不只是輔助工具。它代表元件公開給使用者的 API 邊界。  
如果某個 prop 出現在 type declaration 中，通常表示它是外部使用者可以依賴的公開能力；相反地，如果某個 class 或內部變數只存在於 `.vue` 中，它通常不應該被當成 public API 使用。

---

### 5.2 Divider 的 props 整理

根據原始筆記，`Divider` 對外公開五個 props：

| Prop | Type | 用途 | 閱讀重點 |
| --- | --- | --- | --- |
| `type` | `'horizontal' \| 'vertical'` | 控制水平或垂直分隔線 | 會影響根節點 class，也會對應完全不同的 Less 規則 |
| `orientation` | `'left' \| 'right' \| 'center'` | 控制帶文字分隔線中文字的位置 | 通常要搭配 default slot 才有明顯意義 |
| `dashed` | `boolean` | 控制是否使用虛線 | runtime 加 class，style 改用 dashed 線條 |
| `plain` | `boolean` | 控制帶文字時的文字樣式 | 主要影響文字視覺，不是改變分隔線方向 |
| `size` | `string` | 控制尺寸 | 註解說明可選 `small` 或 `default`，runtime validator 實際範圍需回 source 確認 |

這裡要注意，原始筆記指出 `size` 在型別上是 `string`，但 runtime validator 實際只接受 `small` 與 `default`。這是一個很好的閱讀切入點，因為它提醒我們：

> Type declaration、runtime validator 與官方文件三者不一定永遠完全等價，閱讀元件庫時要互相對照。

---

### 5.3 `orientation` 不是獨立產生線條的能力

`orientation` 很容易被誤解成「分隔線本身的位置」。  
但從 `Divider` 的使用情境來看，它主要控制的是「帶文字分隔線中文字的位置」。

例如：

```vue
<Divider orientation="left">Title</Divider>
<Divider orientation="right">Title</Divider>
```

這種寫法有 default slot，因此文字位置會產生視覺差異。

但如果寫成：

```vue
<Divider orientation="left" />
```

沒有 default slot 時，沒有文字可以被放到左側或右側。因此 `orientation` 的視覺意義就會大幅下降。這也是閱讀 `Divider` 時要同時觀察 props 與 slot 的原因。

---

## 6. Example：`examples/routers/divider.vue` 幫助理解官方使用情境

### 6.1 官方範例的閱讀價值

`examples/routers/divider.vue` 不只是展示元件效果，它也反映元件作者希望使用者如何理解 `Divider`。

對原始碼閱讀來說，example 有三個用途：

1. 先建立「外部使用者怎麼寫」的印象。
2. 反推 runtime 必須支援哪些 props 組合。
3. 對照 style source，理解每種寫法最後對應到哪些 class 與 CSS 規則。

因此，閱讀順序上可以先看 example，再回 runtime 與 Less。這樣比較不會一開始就被 class 細節淹沒。

---

### 6.2 主要範例情境整理

根據原始筆記，官方範例集中展示以下情境：

| 情境 | 範例寫法 | 這個範例想展示什麼 |
| --- | --- | --- |
| 普通水平線 | `<Divider />` | 沒有 slot，只呈現一條水平分隔線 |
| 帶文字水平線 | `<Divider>iView</Divider>` | default slot 會觸發帶文字分隔線模式 |
| small 尺寸 | `<Divider size="small">iView</Divider>` | 尺寸會影響帶文字分隔線的文字與間距表現 |
| 虛線 | `<Divider dashed />` | `dashed` prop 會切換線條樣式 |
| 左側文字 | `<Divider orientation="left">iView</Divider>` | 文字可以靠左顯示 |
| 右側文字 | `<Divider orientation="right">iView</Divider>` | 文字可以靠右顯示 |
| 垂直線 | `<Divider type="vertical" />` | 分隔線也可以用在行內文字或連結之間 |
| plain 文字 | `<Divider plain>iView</Divider>` | 帶文字分隔線可以使用較普通的文字樣式 |

這些範例剛好覆蓋 `Divider` 的主要 public API。  
如果你想快速確認某個 prop 是否有視覺效果，example 是最直接的入口。

---

### 6.3 從 example 反推 runtime

以 `<Divider dashed />` 為例，使用者只寫了一個 boolean prop，但畫面上的線條會從實線變成虛線。這代表中間至少發生了以下轉換：

```txt
使用者傳入 dashed
  -> divider.vue 接收 prop
  -> classes 加入 dashed 相關 class
  -> divider.less 根據 dashed class 套用 dashed border
```

再以 `<Divider>iView</Divider>` 為例，使用者傳入 default slot，runtime 必須判斷 slot 是否存在，並額外渲染文字容器：

```txt
使用者提供 default slot
  -> hasSlot 為 true
  -> template 渲染 span
  -> root class 進入 with-text 模式
  -> divider.less 使用 pseudo-elements 畫出左右線段
```

這種「從範例反推內部流程」的能力，是閱讀元件庫原始碼非常重要的技巧。

---

## 7. Style：`divider.less` 才是實際畫出分隔線的地方

### 7.1 為什麼 `Divider` 必須讀 Less

`Divider` 的 runtime source 很短，容易讓人誤以為元件很簡單。  
但真正的視覺行為大多在 `src/styles/components/divider.less` 中完成。

根據原始筆記，`Divider` 至少包含以下樣式類型：

| 樣式類型 | 主要 CSS 思路 |
| --- | --- |
| 普通水平線 | 透過根節點的高度與背景色呈現線條 |
| 垂直線 | 透過 `inline-block`、寬度與高度呈現行內分隔 |
| 虛線 | 改用 dashed border 呈現 |
| 帶文字水平線 | 使用內層文字節點與 `:before` / `:after` 產生左右線段 |
| 左 / 右文字位置 | 調整左右 pseudo-elements 的寬度或配置 |
| plain 文字樣式 | 調整文字呈現方式，使其更接近普通正文 |

這些效果不是 `divider.vue` 直接產生的，而是 runtime 產生 class 後，由 Less 接手完成。

---

### 7.2 帶文字分隔線的關鍵：pseudo-elements

帶文字分隔線是 `Divider` 中最值得細讀的樣式。

普通分隔線可以是一條完整的水平線，但帶文字時，線條需要被文字切開：

```txt
──────── Title ────────
```

這種畫面通常不會只靠一條背景線完成，而是會把左右兩段線拆開。  
原始筆記指出，`Divider` 的帶文字分隔線會透過 `:before` 與 `:after` 產生左右兩段線。

可以用以下概念理解：

```txt
root divider
  ├─ before：左側線段
  ├─ span：中間文字
  └─ after：右側線段
```

這也是為什麼 default slot 會如此重要。  
沒有 slot 時，不需要中間文字，也就不需要左右兩段線的結構。

---

### 7.3 class 與視覺規則的對應

閱讀 `divider.less` 時，不要只看每條 CSS 屬性，而要回頭對照 runtime 會產生哪些 class。

| class 類型 | 可能來源 | 視覺意義 |
| --- | --- | --- |
| `ivu-divider-horizontal` | `type="horizontal"` | 水平分隔線 |
| `ivu-divider-vertical` | `type="vertical"` | 垂直分隔線 |
| `ivu-divider-with-text` | 有 default slot | 帶文字的分隔線 |
| `ivu-divider-with-text-left` | `orientation="left"` 且有文字 | 文字靠左 |
| `ivu-divider-with-text-right` | `orientation="right"` 且有文字 | 文字靠右 |
| `ivu-divider-dashed` | `dashed` 為 true | 使用虛線 |
| `ivu-divider-plain` | `plain` 為 true | 文字使用普通樣式 |
| 與 `small` 相關的 class | `size="small"` | 影響文字或間距尺寸 |

> 注意：上表根據原始筆記提到的 class 方向整理。實際 class 名稱與組合方式仍應以 `divider.vue` 與 `divider.less` 原始碼為準。

---

### 7.4 讀 Less 時要避免的錯誤

閱讀 `divider.less` 時，常見錯誤是把 CSS 規則當成孤立內容看。  
正確方式應該是從 runtime 產生的 class 回來查樣式：

```txt
某個 prop / slot 狀態
  -> 產生某個 class
  -> Less 中找到該 class
  -> 理解該 class 實際改變了什麼視覺行為
```

例如：

- 想理解 `dashed`，就找 dashed 相關 class。
- 想理解 `orientation="left"`，就找 `with-text-left` 相關規則。
- 想理解 default slot，除了看 `span`，還要看 `with-text`、`:before`、`:after`。
- 想理解 `type="vertical"`，就找 vertical 相關規則，而不是只看 horizontal 的樣式。

這樣閱讀才不會只是在看 CSS，而是在讀「元件狀態如何映射到視覺」。

---

## 8. Public Surface：registry 與 install 確認元件如何被使用者取得

### 8.1 `src/components/index.js`：確認元件是否被公開匯出

`src/components/index.js` 的角色通常是整理元件庫中所有可被公開使用的 components。  
對 `Divider` 來說，閱讀這個檔案可以回答：

> `Divider` 是否被納入 View UI Plus 的 component export？

這個問題很重要。因為一個 `.vue` 檔案存在於 source tree 中，不代表它一定是 public component。  
只有當它被正確匯出、註冊或納入安裝流程時，外部使用者才有穩定使用它的入口。

---

### 8.2 `src/index.js`：確認完整安裝時是否註冊

`src/index.js` 則通常是元件庫的整體安裝入口。  
當使用者執行類似「完整引入 View UI Plus」的操作時，這類入口檔會負責把元件掛進 Vue application。

因此，閱讀 `src/index.js` 可以回答：

> 使用者完整安裝 View UI Plus 時，`Divider` 是否會被一起註冊成可使用的元件？

這類檔案通常不包含 `Divider` 的核心實作，但對理解元件庫的 public surface 很重要。

---

### 8.3 為什麼 registry / install 也值得讀

初學者閱讀元件原始碼時，常常只看元件本身。但真正的元件庫閱讀，需要多看一層：

```txt
單一元件是否存在
  -> 是否被匯出
  -> 是否被安裝
  -> 使用者如何取得它
```

這層視角對你之後閱讀大型元件庫很有幫助。  
因為許多元件庫會同時支援：

- 全量安裝。
- 按需引入。
- 單元件匯出。
- 型別宣告。
- 樣式單獨引入。

`Divider` 雖然簡單，但它剛好可以用來練習這個完整路線。

---

## 9. 建議閱讀路線、常見誤區與待補充事項

### 9.1 初次閱讀路線

如果你是第一次系統性閱讀 `Divider`，建議照以下順序：

1. 先看 `types/divider.d.ts`  
   先確認 public props 有哪些，建立對外 API 邊界。

2. 再看 `examples/routers/divider.vue`  
   透過官方範例建立使用情境，知道每個 prop 大致會造成什麼畫面差異。

3. 接著看 `src/components/divider/divider.vue`  
   理解 props、default slot、`hasSlot`、`classes`、`slotClasses` 與 template。

4. 再看 `src/styles/components/divider.less`  
   對照 runtime 產生的 class，理解水平線、垂直線、虛線與帶文字分隔線如何被畫出。

5. 最後看 `src/components/index.js` 與 `src/index.js`  
   確認 `Divider` 如何被公開匯出與全域註冊。

這個順序的好處是：先從使用者視角建立模型，再回到內部實作驗證模型。

---

### 9.2 深入閱讀路線

如果你已經完成初讀，可以進一步追蹤以下主題：

| 深入主題 | 建議追蹤內容 |
| --- | --- |
| props 到 class 的映射 | 每個 prop 會讓 `classes` 多出哪些 class |
| slot 對 DOM 的影響 | default slot 有無時，template 實際輸出有何差異 |
| `orientation` 的限制 | 文字位置是否只在有 slot 時有意義 |
| `dashed` 的 CSS 實作 | 虛線如何從 background 線切換成 border 線 |
| `plain` 的設計意圖 | plain 是否只影響文字樣式，還是也影響其他結構 |
| `size` 的型別與 validator | type declaration 與 runtime validator 是否完全一致 |
| Less 變數來源 | 顏色、間距、字級是否來自 View UI Plus 全域變數 |

這些主題適合拆成後續獨立筆記。

---

### 9.3 常見誤區

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 只看 `divider.vue` 就以為讀完了 | runtime source 很短，容易低估樣式層重要性 | 帶文字線、虛線與 plain 的關鍵都在 `divider.less` |
| 以為 `orientation` 永遠有效 | prop 看起來像獨立控制位置 | 沒有 default slot 時，沒有文字可以定位 |
| 以為 `plain` 會改變分隔線方向 | plain 名稱容易被理解成整體模式 | plain 主要是文字樣式相關能力 |
| 以為所有線條都用 background 畫 | 普通水平線可能使用 background | 虛線、帶文字線可能改用 border 或 pseudo-elements |
| 忽略 `types/divider.d.ts` | 初學者常只看 `.vue` | type declaration 才能確認 public API |
| 忽略 registry 與 install | 覺得它們不是核心邏輯 | 它們能確認元件是否真正進入 public surface |

---

### 9.4 資訊不足與後續確認清單

原始筆記已經建立主要方向，但若要寫成完整逐行源碼解析，還需要回原始碼確認以下內容：

| 待確認項目 | 為什麼需要確認 |
| --- | --- |
| `type` 的 default value | 需要確認預設是否為 `horizontal` |
| `orientation` 的 default value | 需要確認預設是否為 `center` |
| `size` 的 validator 實作 | 原始筆記提到 validator 接受 `small` 與 `default`，但仍建議回源碼確認 |
| `plain` 的實際 class 組合 | 需要確認 plain 是加在 root 還是 inner text，或兩者都有 |
| `prefixCls` 或 class prefix 來源 | 需要確認 class 名稱是否由常數組合產生 |
| Less 變數來源 | 需要確認顏色、字級、間距來自哪些全域樣式變數 |
| registry / install 具體匯出方式 | 需要確認是 named export、陣列註冊，還是 install function 批次處理 |

這些內容不應在沒有原始碼的情況下任意補完。後續若要做 `Divider` 的逐行閱讀筆記，這張表可以當成檢查清單。

---

## 10. 本章總結、自我檢查與後續延伸

### 10.1 本章總結

`Divider` 是一個低互動、強樣式導向的結構型元件。它的 runtime 本身不複雜，核心工作是接收 props、判斷 default slot、組合 DOM 與 class；真正的視覺效果則大量依賴 `divider.less`。

理解 `Divider` 時，不應只停留在「它是一條分隔線」。更重要的是看出它背後的元件庫設計流程：

```txt
type declaration 定義 public API
  -> example 展示官方使用情境
  -> divider.vue 將 props / slot 轉成 DOM 與 class
  -> divider.less 將 class 轉成視覺規則
  -> components/index.js 與 index.js 將元件納入 public surface
```

這份 Source Map 的價值，在於幫你建立完整閱讀順序。  
只要掌握這條路線，後續閱讀其他 View UI Plus 元件時，也可以用同樣方式拆解：

1. 先看 public API。
2. 再看官方使用範例。
3. 接著看 runtime。
4. 再對照 style。
5. 最後確認 export 與 install。

---

### 10.2 自我檢查問題

1. `Divider` 為什麼不能只看 `divider.vue` 就算讀完？
2. `types/divider.d.ts` 在元件庫中扮演什麼角色？
3. `Divider` 的 default slot 會影響哪些 runtime 輸出？
4. `hasSlot` 對帶文字分隔線有什麼重要性？
5. `orientation` 為什麼通常需要搭配 default slot 才有明顯視覺意義？
6. `dashed` 從使用者傳入到畫面變成虛線，中間大概經過哪些步驟？
7. 為什麼帶文字分隔線需要回到 `divider.less` 看 `:before` 與 `:after`？
8. `src/components/index.js` 與 `src/index.js` 分別能回答什麼問題？
9. `size` 在 type declaration 與 runtime validator 之間可能需要注意什麼？
10. 如果要繼續寫 `Divider` 逐行源碼解析，你會先確認哪些資訊？

---

### 10.3 後續延伸方向

這份筆記可以再拆成以下更深入的主題：

1. **`Divider` Runtime 逐行閱讀**  
   逐步分析 props、computed class、slot 判斷與 template 輸出。

2. **`Divider` 樣式系統解析**  
   專門閱讀 `divider.less`，整理水平線、垂直線、虛線、帶文字線、plain 與 size 的 CSS 實作。

3. **View UI Plus 元件命名規則與 class prefix**  
   追蹤 `ivu-` prefix 的來源，以及不同元件如何維持一致命名。

4. **View UI Plus public surface 閱讀法**  
   從 `src/components/index.js`、`src/index.js`、`types` 與 examples 建立元件庫級別閱讀方法。

5. **從 Divider 延伸到其他低互動元件**  
   可以比較 `Divider`、`Icon`、`Tag`、`Badge` 等元件，看它們如何在 runtime 與 style 之間分工。

---

## 附錄：本篇閱讀關鍵字

| 關鍵字 | 說明 |
| --- | --- |
| `Divider` | View UI Plus 的分隔線元件 |
| `divider.vue` | runtime component，負責 props、slot、DOM 與 class |
| `divider.less` | style source，負責實際視覺呈現 |
| `types/divider.d.ts` | public type declaration |
| `hasSlot` | 判斷是否有 default slot，影響帶文字分隔線 |
| `classes` | 根節點 class 集合 |
| `slotClasses` | 文字容器 class 集合 |
| `with-text` | 帶文字分隔線相關 class |
| `orientation` | 文字位置，通常搭配 default slot 使用 |
| `dashed` | 是否使用虛線 |
| `plain` | 是否使用普通文字樣式 |
| `public surface` | 元件被外部使用者取得的公開入口 |
