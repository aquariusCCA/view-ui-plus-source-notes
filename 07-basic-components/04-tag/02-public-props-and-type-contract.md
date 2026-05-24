# View UI Plus Tag：Public Props 與 Type Contract 教材型筆記

## 1. 本章定位

本章是一篇 **Public Props And Type Contract** 筆記，目標是理解 `View UI Plus` 的 `Tag` 元件對外暴露了哪些使用方式，以及這些使用方式在三個層次中的關係：

1. **Runtime props**  
   `tag.vue` 實際宣告的 props、default、validator，以及 methods / watcher 如何使用這些 props。

2. **TypeScript declaration**  
   `types/tag.d.ts` 對使用者公開的型別描述，也就是 TypeScript 使用者在開發時看到的 component contract。

3. **Event contract**  
   `Tag` 對外 emit 的事件名稱與 payload 結構，例如 `on-change`、`on-close` 在有無 `name` 時會回傳不同參數。

本章不深入展開 DOM template、class 計算、顏色樣式實作與 Less 視覺規則。這些內容應放到後續章節，例如：

- `03-render-class-and-color-system.md`
- `04-state-events-and-control-boundary.md`
- `05-tag-select-option-consumer.md`

讀完本章後，你應該能回答：

1. `Tag` 有哪些 public props？
2. 每個 prop 主要影響畫面、互動、狀態，還是事件 payload？
3. runtime props 和 `.d.ts` 有哪些不一致？
4. `checked` 為什麼不是 Vue 3 標準 `v-model`？
5. `name` 為什麼不影響畫面，卻仍然是重要的 public prop？

---

## 2. 背景：為什麼要讀 Public Contract

閱讀元件庫原始碼時，很多人會先打開 `.vue` 檔，直接看 template、props、computed 和 methods。這種方式可以看到實作細節，但如果沒有先建立 public contract，容易發生兩個問題。

第一，你可能會只記得「內部怎麼寫」，卻沒有搞清楚「使用者可以怎麼用」。元件庫的核心價值不是單一畫面，而是穩定提供一組對外 API，讓使用者可以用 props、slots、events 組合出不同情境。

第二，你可能會忽略 runtime 與型別宣告之間的差異。對 Vue 元件庫來說，`tag.vue` 的 props 是執行時實際行為，`.d.ts` 則是 TypeScript 使用者看到的編譯期提示。這兩者理想上應該一致，但實務上常會有落差。例如 runtime 支援自定義顏色，但 `.d.ts` 可能只列出內建色 union。

因此，本章的閱讀方法不是只背 props 表，而是把每個 prop 放進以下問題中理解：

| 問題 | 閱讀目的 |
| --- | --- |
| 這個 prop 控制什麼能力？ | 判斷它屬於互動、狀態、視覺還是事件識別。 |
| runtime 有沒有 default 或 validator？ | 確認執行時真正接受哪些值。 |
| `.d.ts` 是否精準描述 runtime？ | 確認 TypeScript contract 是否過寬或過窄。 |
| 這個 prop 是否會影響 emit payload？ | 判斷外部使用者如何接收事件資料。 |
| 它是否需要外部同步狀態？ | 判斷元件是內部管理、外部受控，還是半受控。 |

這種讀法非常適合用在 `Tag` 這種小型但行為完整的元件上。它的程式碼不大，但同時包含展示、選取、關閉、自定義顏色與事件識別，是練習元件 public API 分析的好素材。

---

## 3. Source Baseline 與閱讀範圍

`View UI Plus v1.3.20` 相關來源為基準，重點關注以下檔案與概念。

| 類型 | 來源 | 本章關注點 |
| --- | --- | --- |
| Runtime component | `src/components/tag/tag.vue` | props、emits、methods、watcher、內部 `isChecked` 狀態。 |
| Type declaration | `types/tag.d.ts` | `Tag` 對 TypeScript 使用者公開的 props 與 listener typing。 |
| Type export entry | `types/viewuiplus.components.d.ts` | 透過 `export { Tag } from './tag'` 對外匯出型別。 |
| Official example | `examples/routers/tag.vue` | 觀察 `name`、`closable`、`on-close` 等 props / events 的使用場景。 |
| 後續延伸 | `src/components/tag-select/tag-select-option.vue` | 理解 `Tag checkable` 如何被上層封裝成列表選取。 |

本章的重點不是「所有實作細節都展開」，而是先回答 public contract 的問題：**使用者可以傳什麼、會得到什麼事件、型別宣告是否完整描述 runtime 行為。**

---

## 4. Runtime Props 總覽

`tag.vue` 本身宣告的 props 可以整理如下。

| Runtime prop | Runtime 限制 / default | Type declaration | 核心責任 |
| --- | --- | --- | --- |
| `closable` | `Boolean`，預設 `false` | `boolean` | 決定是否渲染 close `Icon`，並允許使用者觸發 `on-close`。 |
| `checkable` | `Boolean`，預設 `false` | `boolean` | 決定根節點 click 是否能切換內部 `isChecked`。 |
| `checked` | `Boolean`，預設 `true` | `boolean` | 初始化並同步內部 `isChecked`，但不是標準 `v-model`。 |
| `color` | `String`，預設 `default` | 內建色 union | 控制內建色 class 或自定義 inline style。 |
| `type` | validator：`border`、`dot` | `'' \| 'border' \| 'dot'` | 控制普通、border、dot 等視覺分支。 |
| `name` | `String` 或 `Number` | `string` 或 `number` | 不影響畫面，主要用於事件 payload 識別。 |
| `size` | validator：`default`、`medium`、`large`，預設 `default` | `string` | 控制尺寸樣式，但 typing 比 runtime 寬。 |

這張表不要只當成速查表。更重要的是看出一件事：`Tag` 的 props 不是同一種類型的設定，有些是互動開關，有些是視覺配置，有些是狀態同步，有些則是事件識別資料。

如果你用同一種方式理解所有 props，很容易誤會。例如 `name` 看起來像普通資料欄位，但它不控制文字顯示；真正顯示文字的是 default slot。`name` 的主要用途是讓 `on-close` 或 `on-change` 事件可以帶回「是哪一顆 Tag 被操作」。

---

## 5. Props 的責任分組

理解 `Tag` 的 props 時，建議不要按照宣告順序背誦，而是按照責任分組。

| 分組 | Props | 責任 | 閱讀時要回到哪裡 |
| --- | --- | --- | --- |
| 互動能力 | `closable`、`checkable` | 開啟關閉或點擊選取能力。 | template、methods、事件 emit。 |
| 狀態輸入 | `checked` | 提供初始選中狀態，並在外部 prop 改變時同步內部狀態。 | `data()`、`watch`、`check()`。 |
| 視覺輸入 | `color`、`type`、`size` | 影響 class、inline style 與 Less 視覺分支。 | computed class/style、`tag.less`。 |
| 事件識別 | `name` | 讓事件 payload 帶回業務識別值。 | `close(event)`、`check()`、官方 example。 |

這個分組可以幫助你建立閱讀路線。

例如你在看 `check()` 時，應該關注的是 `checkable`、`checked`、`isChecked`、`name` 和 `on-change`；你在看顏色 computed 時，應該關注的是 `color`、`type`、內建色清單和 inline style；你在看 close icon 時，則應該關注 `closable`、`name` 和 `on-close`。

換句話說，props 分組不是為了整理漂亮，而是為了讓你知道：**讀到某個方法或 computed 時，應該把哪些 public props 一起放進腦中。**

---

## 6. 重要 Contract 落差一：`color`

`color` 是本章最值得注意的 prop，因為它清楚展示了 runtime 與 type declaration 的落差。

runtime 中存在兩份顏色清單：

```js
const initColorList = ['default', 'primary', 'success', 'warning', 'error', 'blue', 'green', 'red', 'yellow', 'pink', 'magenta', 'volcano', 'orange', 'gold', 'lime', 'cyan', 'geekblue', 'purple'];

const colorList = ['pink', 'magenta', 'volcano', 'orange', 'gold', 'lime', 'cyan', 'geekblue', 'purple'];
```

其中，`initColorList` 可以理解成「runtime 會視為內建色的清單」。如果使用者傳入的 `color` 屬於內建色，元件會產生類似下面的 class：

```txt
ivu-tag-{color}
```

這類顏色通常會交給 Less 中對應的 class 規則處理。

但如果使用者傳入的 `color` 不在內建色清單內，runtime 會把它當成自定義 CSS color，並透過 inline style 處理背景、邊框、文字或 dot 顏色。也就是說，從執行時行為來看，`color` 不只是內建色 enum，它也支援任意 CSS 顏色字串。

問題在於 `.d.ts` 的 `color` 只描述成內建色 union，而不是更完整的：

```ts
color?: BuiltInColor | string
```

這代表 `.d.ts` 比 runtime 更窄。

這種情況在元件庫中很常見：runtime 為了彈性支援更多使用方式，但 TypeScript declaration 沒有完整跟上。閱讀時要分清楚兩層：

| 層次 | 對 `color` 的意義 |
| --- | --- |
| Runtime 行為 | 實際上支援內建色，也支援自定義 CSS color 字串。 |
| TypeScript contract | 對使用者提示內建色 union，但沒有完整表達自定義色。 |
| 筆記閱讀結論 | 實作行為要以 runtime 為準；型別限制則是 public typing 的描述落差。 |

這裡不要簡單得出「`.d.ts` 沒寫，所以不支援」的結論。對元件庫原始碼閱讀而言，真正決定執行行為的是 runtime source；`.d.ts` 是型別層的對外描述，可能不完整。

---

## 7. 重要 Contract 落差二：`type` 與 `size`

### 7.1 `type`：普通樣式不是獨立 runtime type

runtime 中的 `type` validator 只接受兩個值：

```js
validator (value) {
    return oneOf(value, ['border', 'dot']);
}
```

也就是說，runtime 明確承認的 `type` 只有：

```txt
border / dot
```

當使用者不傳 `type` 時，`this.type` 是 `undefined`，元件會走普通 Tag 分支。這裡的重點是：**普通樣式不是透過一個明確的 runtime type 值來表示，而是透過「沒有傳 type」形成預設分支。**

但 `.d.ts` 寫的是：

```ts
type?: '' | 'border' | 'dot';
```

這裡的空字串 `''` 更像是 TypeScript public surface 中為了容納 template 使用方式或歷史 API 所保留的寬鬆值，而不是 runtime validator 中一個具有獨立語意的類型。

閱讀時可以這樣記：

| 情境 | 正確理解 |
| --- | --- |
| `type="border"` | 進入 border 視覺分支。 |
| `type="dot"` | 進入 dot 視覺分支。 |
| 不傳 `type` | 進入普通 Tag 分支。 |
| `type=""` | `.d.ts` 允許，但 runtime validator 主軸仍是 `border` / `dot`。此處需要後續以完整 source 確認實際警告行為。 |

### 7.2 `size`：typing 比 runtime 更寬

`size` 則是另一種落差：runtime 比 `.d.ts` 更嚴格。

runtime 的 `size` validator 限制為：

```txt
default / medium / large
```

且預設值是：

```txt
default
```

但 `.d.ts` 寫成：

```ts
size?: string;
```

這表示 TypeScript 不會阻止使用者傳入任意字串，例如：

```vue
<Tag size="small">Tag</Tag>
```

可是 runtime validator 與樣式系統主要只支持 `default`、`medium`、`large`。因此，`size?: string` 不代表任何字串都有對應樣式。

這類落差要用兩層來看：

| 層次 | 對 `size` 的意義 |
| --- | --- |
| Runtime validator | 實際接受 `default`、`medium`、`large`，其他值可能觸發 Vue validator warning。 |
| Type declaration | 編譯期只說它是 `string`，因此提示過寬。 |
| 樣式結果 | 是否真的有效，還要回到 `tag.less` 是否有對應尺寸 class。 |

這裡可以得到一個閱讀原則：**當 `.d.ts` 比 runtime 寬時，不能只相信型別；要回去看 validator 與 style 是否真的支持。**

---

## 8. Event Listener Contract 與 Payload

`Tag` 的事件契約由兩個地方共同決定：

1. `tag.vue` 的 `emits`
2. `methods` 中實際 `$emit` 的參數

`tag.vue` 宣告：

```js
emits: ['on-change', 'on-close']
```

`.d.ts` 則使用 Vue listener prop 的形式描述：

```ts
onOnClose?: (event?: any) => any;
onOnChange?: (event?: any) => any;
```

這裡容易混淆。`onOnChange` / `onOnClose` 並不是一般使用者在 template 中手寫的 prop 名稱。使用者在模板中仍然會寫：

```vue
<Tag @on-change="handleChange" />
<Tag @on-close="handleClose" />
```

`onOnChange` / `onOnClose` 是 Vue 型別系統對事件 listener prop 的命名表達。

更重要的是，`.d.ts` 使用 `(event?: any) => any` 這種很寬的 typing，並沒有完整描述 runtime payload。因此，要理解事件實際會傳什麼，不能只看 `.d.ts`，一定要回到 `close(event)` 和 `check()`。

### 8.1 `on-close` 的 payload

`close(event)` 的 payload 取決於 `name` 是否存在。

| 條件 | Runtime emit |
| --- | --- |
| `name === undefined` | `this.$emit('on-close', event)` |
| `name !== undefined` | `this.$emit('on-close', event, this.name)` |

這表示如果使用者只是單獨使用一顆 Tag，可能只需要收到原生 click event；但如果是在列表中使用多顆 Tag，就可以透過 `name` 讓事件多帶回一個識別值。

官方 example：

```vue
<Tag
    v-for="item in count"
    :key="item"
    :name="item"
    closable
    @on-close="handleClose2"
>
    标签{{ item + 1 }}
</Tag>
```

在這種情境下，`name` 的角色不是顯示文字，而是讓 `handleClose2` 能知道「被關閉的是哪一個 item」，然後外部再決定是否從 `count` 陣列中移除該項。

### 8.2 `on-change` 的 payload

`check()` 的 payload 同樣取決於 `name` 是否存在。

| 條件 | Runtime emit |
| --- | --- |
| `name === undefined` | `this.$emit('on-change', checked)` |
| `name !== undefined` | `this.$emit('on-change', checked, this.name)` |

這裡的 `checked` 是切換後的選中狀態。當 `Tag` 被設為 `checkable` 時，使用者點擊根節點會觸發狀態切換，然後透過 `on-change` 通知外部。

如果沒有 `name`，外部只知道新的 checked 狀態；如果有 `name`，外部還能知道是哪一顆 Tag 的狀態改變。

這正是 `name` 的核心價值：**它把單顆元件的事件轉成列表場景可用的事件。**

---

## 9. `checked` 狀態模型：不是標準 `v-model`

`checked` 是 `Tag` 中最容易被誤解的 prop。它看起來像一個可以由外部控制的值，但它並不是 Vue 3 標準 `v-model` contract。

標準 Vue 3 `v-model` 通常會看到：

```txt
modelValue
update:modelValue
```

但依照 `Tag` 的實作是：

```js
data () {
    return {
        isChecked: this.checked
    };
},
watch: {
    checked (val) {
        this.isChecked = val;
    }
}
```

也就是說，`checked` 會在兩個時間點影響內部狀態：

1. **初始化時**  
   `data()` 會用 `this.checked` 建立內部 `isChecked`。

2. **外部 prop 改變時**  
   `watch.checked` 會把新的 `checked` 同步到 `isChecked`。

但當使用者點擊可選 Tag 時，元件會先改自己的 `isChecked`，再 emit `on-change`。這代表它不是完全由外部掌控的受控元件，而是有內部狀態，並允許外部透過 prop 重新同步。

可以把它理解成一種「內部狀態 + 外部同步」模型。

| 模型 | 特徵 | `Tag checked` 是否符合 |
| --- | --- | --- |
| 完全內部狀態 | 外部只給初始值，之後完全由元件自己管理。 | 不完全符合，因為有 watch 同步外部 `checked`。 |
| 標準 `v-model` | 使用 `modelValue` 與 `update:modelValue`。 | 不符合。 |
| 內部狀態 + 外部同步 | 元件內部維護狀態，但外部 prop 改變可重新覆蓋。 | 符合。 |

因此，如果外部寫成：

```vue
<Tag checkable :checked="selected" @on-change="handleChange">
    Option
</Tag>
```

那麼 `handleChange` 裡通常應該更新 `selected`，讓外部資料來源與畫面狀態保持一致。否則，畫面可能短期內由內部 `isChecked` 改變，但外部狀態沒有跟上，後續重新 render 或父層狀態更新時就可能出現不一致。

這也是為什麼後續閱讀 `TagSelectOption` 很重要：它會展示上層元件如何接管 `Tag` 的 `on-change`，並把單顆 Tag 的切換行為整合成列表選取模型。

---

## 10. 總結、常見誤區與自我檢查

### 10.1 本章總結

`Tag` 的 public contract 不能只看 props 表。完整理解至少要同時對照三個層次：

1. `tag.vue` 的 runtime props、validator、default、methods、watcher。
2. `types/tag.d.ts` 對 TypeScript 使用者暴露的型別描述。
3. `on-change` / `on-close` 的實際 emit payload。

從功能責任來看，`closable` 和 `checkable` 控制互動能力；`checked` 建立內部狀態與外部同步的關係；`color`、`type`、`size` 控制視覺分支；`name` 則用來讓事件 payload 帶回識別值。

本章最重要的兩個結論是：

第一，`color` 是 runtime 比 `.d.ts` 更寬的例子。runtime 支援內建色與自定義 CSS color，但 `.d.ts` 沒有完整表達自定義色。

第二，`checked` 不是 Vue 3 標準 `v-model`。它會初始化並同步內部 `isChecked`，但事件不是透過 `update:modelValue` 發出，而是透過 `on-change` 通知外部。

### 10.2 常見誤區

| 誤區 | 正確理解 |
| --- | --- |
| `closable` 會讓 Tag 被點擊後自動消失 | `closable` 只顯示 close icon 並 emit `on-close`；是否移除由外部狀態決定。 |
| `checkable` 等於外部受控選取 | `checkable` 只是允許點擊時切換內部 `isChecked`。 |
| `checked` 等於 `v-model` | `Tag` 沒有 `modelValue` / `update:modelValue`。 |
| `.d.ts` 沒允許自定義 `color`，所以 runtime 不支援 | runtime 支援任意字串 color，非內建色會走 inline style。 |
| `name` 是顯示文字 | 顯示文字來自 default slot；`name` 主要用於事件識別。 |
| `size?: string` 代表任何 size 都有對應樣式 | runtime validator 與樣式主要支援 `default`、`medium`、`large`。 |
| `type=""` 是一個明確 runtime 分支 | 普通樣式主要來自不傳 `type`；空字串在 `.d.ts` 中較像寬鬆 typing。 |

### 10.3 建議閱讀路線

讀這章之後，建議按照以下順序繼續深入：

1. 回到 `tag.vue`，對照 props 宣告、`data()`、`watch.checked`、`close()`、`check()`。
2. 打開 `types/tag.d.ts`，檢查 `color`、`type`、`size`、`onOnChange`、`onOnClose` 的 typing。
3. 打開官方 example，觀察 `name` 如何在 `closable` 列表中協助外部刪除資料。
4. 進入 `03-render-class-and-color-system.md`，理解 `color`、`type`、`size` 如何轉成 class 與 inline style。
5. 進入 `04-state-events-and-control-boundary.md`，深入分析 `checked`、`isChecked`、`on-change` 與外部同步。
6. 補看 `tag-select-option.vue`，理解 `Tag checkable` 如何被封裝成列表選取。

### 10.4 後續延伸方向

這份筆記後續可以拆成幾個更深入的主題：

| 延伸主題 | 可以回答的問題 |
| --- | --- |
| `Tag` 的 render / class / color system | `color`、`type`、`size` 如何共同決定 class 與 inline style？ |
| `Tag` 的事件與控制邊界 | `checkable`、`checked`、`isChecked`、`on-change` 如何形成半受控模型？ |
| `TagSelectOption` 如何封裝 `Tag` | 單顆 `Tag` 的事件如何被上層轉成列表選取？ |
| `.d.ts` 與 runtime contract 對照方法 | 如何系統性檢查元件庫的 typing 是否精準？ |
| 元件庫 API 設計取捨 | 為什麼有些 props 用 validator，有些 typing 卻寫得較寬或較窄？ |

### 10.5 自我檢查問題

1. `closable` 和 `checkable` 分別開啟什麼行為？
2. `checked` 如何進入內部狀態？外部 prop 改變後又如何同步到內部？
3. 為什麼說 `checked` 不是 Vue 3 標準 `v-model`？
4. `name` 不影響畫面，為什麼仍然是重要 public prop？
5. `color` 的 runtime contract 和 `.d.ts` 有什麼落差？
6. 如果 `color` 傳入非內建色，runtime 大致會如何處理？
7. `type` 的 runtime validator 與 `.d.ts` 中的 `'' | 'border' | 'dot'` 有什麼差異？
8. `size` 的 runtime validator 和 `.d.ts` 有什麼落差？
9. `on-close` 在有 `name` 和沒有 `name` 時，payload 分別是什麼？
10. `on-change` 在列表選取場景中，為什麼通常需要搭配 `name`？
11. 如果外部綁定 `:checked="selected"`，但在 `on-change` 裡沒有更新 `selected`，可能會有什麼問題？
12. 為什麼閱讀元件庫時不能只看 `.d.ts`，也不能只看 `.vue` runtime？