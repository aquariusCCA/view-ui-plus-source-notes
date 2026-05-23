# View UI Plus Tag：State、Events 與 Control Boundary 教材型筆記

## 0. 原始筆記問題分析

這份原始筆記的主題是 `View UI Plus` 中 `Tag` 元件的狀態、事件與外部控制邊界。原文已經抓到幾個重要觀察：`closable` 不會自動刪除、`checkable` 不等於 `v-model`、`checked` 不是唯一資料來源、`name` 會影響事件 payload。這些都是閱讀 `Tag` 原始碼時最容易混淆的地方。

不過，若要把它整理成適合長期複習的教材型筆記，還可以進一步補強幾個面向。

第一，原文已經列出 `checked`、`isChecked`、watcher、`check()`、`close()`，但它們之間的狀態流向還可以更明確。對初學者而言，只看到「watcher 會同步」還不夠，必須知道 `Tag` 的狀態模型不是純受控，也不是純非受控，而是「外部 prop 可同步、內部事件也會立即修改狀態」的混合模型。

第二，原文已經說明 `closable` 不會自動刪除，但可以再補充這種設計背後的元件邊界：`Tag` 只是一顆可互動標籤，它不應該擅自修改父層列表資料，也不應該自行決定是否從 DOM 中消失。它只負責發出「使用者想關閉」的意圖，真正刪除資料的責任留給外部。

第三，原文提到 `.stop` 很重要，但可以再拆開說明 root click 與 close icon click 的事件隔離。尤其當 `closable` 和 `checkable` 同時存在時，若沒有 `.stop`，點擊 close icon 可能同時觸發選取切換，這會讓使用者操作語意變得混亂。

第四，原文有提到 `TagSelectOption`，但可以把它升級成「控制邊界案例」。因為 `TagSelectOption` 正好展示了 `Tag` 如何被更高階的列表選取元件包裝：`Tag` 只處理單顆點擊，`TagSelectOption` 保存單一 option 狀態，`TagSelect` 則統一管理整個列表與 `modelValue`。

第五，這份筆記適合補上「常見誤解」、「設計取捨」、「閱讀路線」與「自我檢查問題」，讓它不只是事件流程速查表，而是可以反覆回查的原始碼閱讀筆記。

> 本章內容以原始筆記提供的 `tag.vue`、官方 example 片段與 `TagSelectOption` 片段為基準。未提供完整原始碼的部分，不延伸推測具體實作細節。

---

## 1. 本章定位

本章是一篇 `Tag` 元件的「狀態與事件控制邊界」筆記，重點不是樣式，也不是 props 型別對照，而是回答三個問題。

第一，`Tag` 如何保存與更新自己的選中狀態？這會牽涉到 `checked` prop、內部 `isChecked`、watcher，以及點擊時的 `check()` 方法。

第二，`Tag` 如何對外通知互動結果？這會牽涉到 `on-change`、`on-close`、事件 payload，以及 `name` 如何協助外部辨識是哪一顆標籤發生事件。

第三，`Tag` 的責任到哪裡為止？也就是它什麼事情自己做，什麼事情只通知外部，由父層或 consumer 決定。

這一章應該放在 `Tag` 學習路線中偏後的位置閱讀。建議先理解前面幾章：

| 前置章節 | 閱讀價值 |
| --- | --- |
| `01-source-map.md` | 先知道 `Tag` 的 runtime、style、type、example、consumer 分別在哪裡。 |
| `02-public-props-and-type-contract.md` | 先理解 `closable`、`checkable`、`checked`、`name`、事件 listener 的 public contract。 |
| `03-render-class-and-color-system.md` | 先理解 `checked` 如何影響 class 與視覺狀態。 |
| 本章 | 專注理解 `Tag` 如何處理狀態、事件與外部控制。 |

本章不深入分析 `tag.less` 的顏色與 class 規則。若要理解 `checked=false` 之後畫面為什麼變透明或改變樣式，應回到 `03-render-class-and-color-system.md` 對照樣式規則。

---

## 2. 先建立元件控制邊界的基本觀念

閱讀 `Tag` 的事件流程前，要先理解一個重要觀念：小型 UI 元件通常不應該擁有父層資料。

以 `Tag` 來說，它可以知道「自己目前是否被選中」，也可以知道「使用者是否點了關閉 icon」，但它不應該知道父層的列表資料長什麼樣子，也不應該直接修改父層陣列。因為同一顆 `Tag` 可能被用在很多場景，例如：

| 使用場景 | `Tag` 本體應該做什麼 | 外部應該做什麼 |
| --- | --- | --- |
| 單顆可關閉標籤 | 顯示 close icon，點擊後 emit `on-close` | 決定是否把 `v-if` 改成 `false` |
| 多顆可刪除標籤列表 | 點擊 close icon 後帶回 `name` | 從陣列中移除對應項目 |
| 可選取標籤 | 點擊後切換內部 `isChecked`，emit `on-change` | 決定是否同步外部 `checked` |
| `TagSelectOption` | 提供單顆標籤互動能力 | 由 `TagSelectOption` / `TagSelect` 管理列表選取狀態 |

因此，`Tag` 的設計重點不是「幫使用者完成所有狀態管理」，而是提供明確的互動訊號。這也是理解 `closable` 與 `checkable` 的前提。

---

## 3. `Tag` 的狀態模型

`Tag` 的內部狀態非常小，核心只有一個 `isChecked`。

```js
data () {
    return {
        isChecked: this.checked
    };
}
```

這段程式碼代表：元件建立時，`Tag` 會把外部傳入的 `checked` prop 當作初始值，放進自己的內部狀態 `isChecked`。也就是說，`checked` 是外部輸入，`isChecked` 是元件內部真正拿來判斷目前選中狀態的資料。

原始筆記指出，`checked` 的預設值是 `true`。因此，如果使用者只是寫：

```vue
<Tag>Label</Tag>
```

在狀態層面上，它一開始會被視為 checked；在 render/class 層面上，root 也會有類似 `ivu-tag-checked` 這樣的選中 class。至於這個 class 會造成什麼視覺效果，則要回到樣式章節看 `tag.less`。

這裡最容易誤解的是：`checked` 不是唯一資料來源。因為 `Tag` 點擊後會自己修改 `isChecked`，而不只是等待外部改變 `checked`。所以它不是嚴格意義上的「完全受控元件」。

---

## 4. `checked` prop 與 watcher 的同步關係

`Tag` 除了用 `checked` 初始化 `isChecked`，也透過 watcher 監聽外部 `checked` 的後續變化。

```js
watch: {
    checked (val) {
        this.isChecked = val;
    }
}
```

這段 watcher 的意義是：如果父層後來重新傳入不同的 `checked`，`Tag` 會把內部 `isChecked` 改成父層提供的新值。

可以把狀態流向想成兩條路。

| 狀態來源 | 觸發時機 | 結果 |
| --- | --- | --- |
| 外部 `checked` prop | 元件初始化時 | `isChecked = this.checked` |
| 外部 `checked` prop 變更 | watcher 觸發時 | `isChecked = val` |
| 使用者點擊 root | `check()` 執行時 | `isChecked = !isChecked` |

這就是本章的核心：`Tag` 允許外部同步狀態，也允許內部即時切換狀態。

如果使用 Vue 元件設計術語來描述，它比較像「可被外部同步的內部狀態元件」，而不是 Vue 3 標準的 `v-model` 元件。因為它沒有使用：

```txt
modelValue
update:modelValue
```

也沒有使用：

```txt
checked
update:checked
```

它使用的是 View UI Plus 自己的事件命名：

```txt
on-change
```

---

## 5. 選取流程：`checkable`、root click 與 `check()`

`Tag` 的 root 節點會綁定 click handler。

```vue
<div @click.stop="check">
```

這代表只要點擊 `Tag` 根節點，就會呼叫 `check()`。不過，真正能不能切換選中狀態，取決於 `checkable`。

原始筆記提供的 `check()` 流程如下：

```js
check () {
    if (!this.checkable) return;
    const checked = !this.isChecked;
    this.isChecked = checked;
    if (this.name === undefined) {
        this.$emit('on-change', checked);
    } else {
        this.$emit('on-change', checked, this.name);
    }
}
```

這段方法可以拆成四個步驟理解。

第一步，先檢查 `checkable`。如果 `checkable` 是 `false`，直接 `return`，不切換狀態，也不 emit `on-change`。

第二步，計算下一個 checked 狀態。

```js
const checked = !this.isChecked;
```

這裡的 `checked` 是「切換後的新狀態」，不是原本的 prop。這個命名容易讓初學者混淆，閱讀時要把它理解成 next checked state。

第三步，立即更新內部狀態。

```js
this.isChecked = checked;
```

因此，使用者點擊後，`Tag` 會先讓自己的畫面跟著變，而不是等父層回寫。

第四步，對外 emit `on-change`。如果沒有 `name`，只丟出新的 checked 值；如果有 `name`，就多丟一個識別值。

整體流程可以整理如下：

```txt
user click root
    ↓
check()
    ↓
checkable ?
    ├─ false → return
    └─ true
        ↓
    checked = !isChecked
        ↓
    isChecked = checked
        ↓
    emit on-change
        ├─ without name → on-change(checked)
        └─ with name    → on-change(checked, name)
```

這也說明了 `checkable` 和 `checked` 是兩個不同層次的 prop。

| Prop | 責任 |
| --- | --- |
| `checkable` | 決定使用者點擊 root 時能不能切換。 |
| `checked` | 提供初始選中狀態，並允許外部後續同步。 |

`checkable` 是互動能力開關，`checked` 是狀態輸入。不能把它們混成同一件事。

---

## 6. `on-change` 事件與 payload 設計

`on-change` 是 `Tag` 對外回報「選中狀態已經切換」的事件。

它的 payload 由 `name` 是否存在決定。

| 使用方式 | emit payload | 外部 handler 形狀 | 適合場景 |
| --- | --- | --- | --- |
| `<Tag checkable />` | `checked` | `handleChange(checked)` | 單顆標籤，只關心選中與否。 |
| `<Tag checkable name="a" />` | `checked, 'a'` | `handleChange(checked, name)` | 多顆標籤，需要知道是哪一顆。 |
| `<Tag checkable :name="0" />` | `checked, 0` | `handleChange(checked, name)` | 使用數字索引或數字 id。 |

原始碼判斷的是：

```js
this.name === undefined
```

因此，只有當 `name` 真的是 `undefined` 時，才會被視為沒有 name。以下值都會被當成有效 name：

| `name` 值 | 是否會出現在 payload | 原因 |
| --- | --- | --- |
| `0` | 會 | `0 !== undefined` |
| `''` | 會 | 空字串不是 `undefined` |
| `'a'` | 會 | 字串 id |
| `123` | 會 | 數字 id |

這個設計對列表元件很重要。因為在列表中，外部通常不只需要知道 checked 變成什麼，也需要知道是哪一顆 `Tag` 被操作。

例如：

```vue
<Tag
    v-for="item in tags"
    :key="item.id"
    :name="item.id"
    checkable
    @on-change="handleTagChange"
>
    {{ item.label }}
</Tag>
```

外部 handler 可以寫成：

```js
function handleTagChange(checked, name) {
    // checked：這顆 Tag 切換後的新狀態
    // name：這顆 Tag 的識別值，例如 item.id
}
```

這裡的 `name` 不負責顯示文字。顯示文字來自 default slot，`name` 只是事件識別資料。

---

## 7. 關閉流程：`closable`、close icon 與 `close()`

`closable` 控制的是 close icon 是否出現。

```vue
<Icon v-if="closable" @click.stop="close"></Icon>
```

當 `closable` 是 `true` 時，`Tag` 會渲染一個 close icon。使用者點擊 close icon 後會呼叫 `close(event)`。

原始筆記提供的 `close()` 流程如下：

```js
close (event) {
    if (this.name === undefined) {
        this.$emit('on-close', event);
    } else {
        this.$emit('on-close', event, this.name);
    }
}
```

這段方法有一個非常重要的特點：它只 emit 事件，不修改任何內部狀態，也不把元件從 DOM 中移除。

也就是說，`closable` 的語意不是「這顆 Tag 可以自己刪掉自己」，而是「這顆 Tag 會顯示關閉按鈕，並在使用者點擊時通知外部」。

整體流程可以整理成：

```txt
user click close icon
    ↓
close(event)
    ↓
name === undefined ?
    ├─ true  → emit on-close(event)
    └─ false → emit on-close(event, name)
    ↓
Tag 本身不刪除 DOM、不修改列表、不改變 isChecked
```

這種設計讓 `Tag` 可以被更彈性地使用。因為不同外部場景對「關閉」的處理可能不同：

| 場景 | 外部收到 `on-close` 後可能做什麼 |
| --- | --- |
| 單顆提示標籤 | 把 `show` 改成 `false`。 |
| 多顆標籤列表 | 從陣列中刪除對應 item。 |
| 需要確認的刪除 | 先跳出確認視窗，確認後才移除。 |
| 只做紀錄 | 不刪除，只記錄使用者點過 close。 |

如果 `Tag` 自己直接刪 DOM，反而會剝奪外部場景的控制能力。

---

## 8. `on-close` 事件與 payload 設計

`on-close` 的 payload 也由 `name` 是否存在決定，但它和 `on-change` 有一個關鍵差異：第一個參數不是 checked，而是 click event。

| 使用方式 | emit payload | 外部 handler 形狀 | 說明 |
| --- | --- | --- | --- |
| `<Tag closable />` | `event` | `handleClose(event)` | 單顆 close，只需要事件物件。 |
| `<Tag closable name="a" />` | `event, 'a'` | `handleClose(event, name)` | 多顆 close，需要知道是哪一顆。 |
| `<Tag closable :name="0" />` | `event, 0` | `handleClose(event, name)` | 數字索引或 id 也會被視為有效 name。 |

這裡要特別注意 `on-change` 與 `on-close` 的 payload 差異。

| 事件 | 第一個參數 | 第二個參數 |
| --- | --- | --- |
| `on-change` | 切換後的 `checked` | 有 `name` 時才帶 `name` |
| `on-close` | click `event` | 有 `name` 時才帶 `name` |

這個差異很重要。若外部 handler 把 `on-close` 的第一個參數誤以為是 checked，就會寫出錯誤邏輯。

---

## 9. 官方 example 中的外部控制模式

原始筆記提到，官方 example 中的單顆關閉是由外部控制。

```vue
<Tag v-if="show" closable @on-close="handleClose">标签三</Tag>
```

```js
handleClose () {
    this.show = false;
}
```

這個例子清楚展示了 `Tag` 的邊界：

1. `Tag` 負責顯示 close icon。
2. 使用者點擊 close icon。
3. `Tag` emit `on-close`。
4. 外部的 `handleClose()` 把 `show` 改成 `false`。
5. Vue 根據 `v-if="show"` 把 `Tag` 從畫面移除。

真正讓 `Tag` 消失的不是 `closable`，而是外部狀態 `show` 的改變。

列表關閉也是同樣邏輯。

```js
handleClose2 (event, name) {
    const index = this.count.indexOf(name);
    this.count.splice(index, 1);
}
```

這裡 `Tag` 只負責把 `name` 帶回來。至於 `count` 是陣列、要怎麼找 index、要不要 splice，全部都是外部資料層的責任。

這種設計符合 Vue 元件開發的一個重要原則：子元件回報事件，父層修改資料。

---

## 10. Close 與 Check 的事件隔離

`Tag` 的 root click 使用 `.stop`。

```vue
@click.stop="check"
```

close icon click 也使用 `.stop`。

```vue
@click.stop="close"
```

`.stop` 對應的是 Vue 的事件修飾符，用來阻止事件繼續冒泡。放在 `Tag` 裡面，它有兩層意義。

第一，點擊 `Tag` root 時，click 不會繼續往外層冒泡。這讓 `Tag` 在列表、篩選區、表單或其他複合元件中比較像一個獨立互動單元，不容易意外觸發父層 click handler。

第二，點擊 close icon 時，click 不會冒泡回 root。因此在 `closable` 和 `checkable` 同時存在的情況下，點擊關閉 icon 只會觸發 `close()`，不會順便觸發 root 的 `check()`。

如果沒有 close icon 上的 `.stop`，可能會發生這種錯誤互動：

```txt
user click close icon
    ↓
close icon handler 執行 close()
    ↓
事件冒泡到 root
    ↓
root handler 又執行 check()
    ↓
同一次點擊同時觸發 close 和 checked 切換
```

這會讓使用者操作語意變得不乾淨。使用者明明只是想關閉，卻可能順便切換選中狀態。因此，`.stop` 在這裡不是單純語法細節，而是元件互動語意的一部分。

---

## 11. 受控、非受控與「類受控」用法

`Tag` 的 `checked` 設計容易被誤解。它不是標準 `v-model`，但也不是完全不受外部控制。比較準確的理解方式，是把它分成三種使用模式。

### 11.1 非受控式 `checkable`

最簡單的寫法是只開啟 `checkable`。

```vue
<Tag checkable>Label</Tag>
```

這種情況下，外部沒有綁定 `checked`，所以 `Tag` 會用預設 `checked=true` 初始化 `isChecked`。之後每次點擊都由 `Tag` 自己反轉 `isChecked`。

這種模式適合單純讓畫面有切換效果，但外部不需要嚴格保存狀態的場景。

```txt
初始：isChecked = true
點擊：isChecked = false，emit on-change(false)
再點：isChecked = true，emit on-change(true)
```

外部可以監聽 `on-change`，但不一定要回寫狀態。

### 11.2 類受控式 `checked`

若外部想保存狀態，可以綁定 `checked` 並在 `on-change` 中回寫。

```vue
<Tag :checked="checked" checkable @on-change="checked = $event">Label</Tag>
```

這種模式的流程是：

```txt
外部 checked 傳入 Tag
    ↓
Tag 初始化 / watcher 同步 isChecked
    ↓
使用者點擊 Tag
    ↓
Tag 先改內部 isChecked
    ↓
Tag emit on-change(newChecked)
    ↓
外部 handler 更新 checked
    ↓
watcher 再同步內部 isChecked
```

這看起來像受控元件，但還不是標準受控元件。因為標準 Vue 3 受控介面通常會是：

```vue
<Tag v-model="checked" />
```

或者：

```vue
<Tag :model-value="checked" @update:model-value="checked = $event" />
```

但本元件使用的是 `checked` + `on-change`。所以本章稱它為「類受控式」用法。

### 11.3 外部強制同步

官方 example 中有類似這樣的用法：

```vue
<Tag :checked="checked" checkable>test</Tag>
<Button @click="toggle">Toggle</Button>
```

當外部按鈕改變 `checked` 時，`Tag` 的 watcher 會把新的 prop 值同步到 `isChecked`。這證明外部仍然可以強制改變 `Tag` 的狀態。

這種模式適合外部有其他控制來源的情境，例如重置篩選、全選、取消全選或套用預設條件。

---

## 12. `TagSelectOption`：理解控制邊界的最佳案例

`TagSelectOption` 是理解 `Tag` 控制邊界的重要 consumer。原始筆記提供的 template 如下：

```vue
<Tag checkable :checked="checked" @on-change="handleChange" :color="color" v-bind="tagProps">
    <slot></slot>
</Tag>
```

這段程式碼說明：`TagSelectOption` 並沒有重新實作一顆可點擊標籤，而是直接使用 `Tag` 的 `checkable` 能力。它把 `checked` 傳給 `Tag`，並接住 `Tag` emit 出來的 `on-change`。

原始筆記提供的 `handleChange` 如下：

```js
handleChange (checked) {
    this.checked = checked;
    this.TagSelectInstance.handleChangeTag(this.name);
}
```

這裡可以看出三層分工。

| 層次 | 責任 | 說明 |
| --- | --- | --- |
| `Tag` | 處理單顆標籤點擊，切換 `isChecked`，emit `on-change` | 它不知道整個列表，也不知道 `modelValue`。 |
| `TagSelectOption` | 保存單一 option 的 `checked`，並通知上層哪個 option 改變 | 它是 `Tag` 與 `TagSelect` 之間的中介。 |
| `TagSelect` | 收集所有 option，更新 `modelValue`，處理全選、展開等列表邏輯 | 它才是列表狀態的主要管理者。 |

這個案例很適合用來理解元件設計中的「單一責任」。`Tag` 的功能很小，但因為它的事件輸出清楚，所以可以被 `TagSelectOption` 包裝成更高階的選取系統。

換句話說，`Tag` 不需要知道自己在不在 `TagSelect` 裡。它只要穩定提供「單顆標籤互動」能力即可。

---

## 13. 狀態與事件責任總表

為了方便複習，可以把 `Tag` 的幾個關鍵 props、內部狀態與事件放在同一張表。

| 名稱 | 類型 | 所屬層次 | 責任 | 是否直接改畫面 |
| --- | --- | --- | --- | --- |
| `checked` | prop | 外部輸入 | 初始化並同步 `isChecked` | 間接，透過 `isChecked` 影響 class |
| `isChecked` | internal state | 元件內部 | 表示目前實際選中狀態 | 是，會影響 `ivu-tag-checked` |
| `checkable` | prop | 互動能力 | 決定 root click 是否能切換 | 間接，允許點擊後改變 `isChecked` |
| `closable` | prop | 互動能力 / DOM 分支 | 決定是否渲染 close icon | 是，會讓 close icon 出現 |
| `name` | prop | 事件識別 | 讓事件 payload 帶回識別值 | 否，不負責顯示文字 |
| `on-change` | event | 對外通知 | 通知 checked 狀態已切換 | 否，外部可選擇是否處理 |
| `on-close` | event | 對外通知 | 通知使用者點擊 close icon | 否，外部決定是否移除資料 |

這張表可以幫助你在閱讀原始碼時快速定位：某個名稱是在描述狀態、互動能力、DOM 分支，還是對外通知。

---

## 14. 常見誤區與正確理解

| 常見誤區 | 正確理解 |
| --- | --- |
| `closable` 代表點擊後元件會自動消失 | `closable` 只顯示 close icon 並 emit `on-close`；是否移除由外部決定。 |
| `checkable` 等於 `checked` | `checkable` 是能不能點擊切換；`checked` 是初始與同步狀態。 |
| `checked` 是標準 `v-model` | `Tag` 沒有 `modelValue` / `update:modelValue`，也沒有 `update:checked`。 |
| `on-change` 的第一個參數是 event | `on-change` 第一個參數是切換後的 checked。 |
| `on-close` 的第一個參數是 checked | `on-close` 第一個參數是 click event。 |
| `name=0` 會被當成沒有 name | runtime 判斷是 `name === undefined`，所以 `0` 是有效 name。 |
| 點 close icon 也會觸發 check | close icon 使用 `@click.stop`，不會冒泡到 root 的 `check()`。 |
| `TagSelect` 的列表選取是 `Tag` 本體負責 | `Tag` 只負責單顆互動，列表狀態由 `TagSelectOption` / `TagSelect` 管理。 |

---

## 15. 設計取捨：為什麼 `Tag` 不直接做更多事情？

從使用者角度看，可能會覺得 `closable` 既然叫可關閉，點擊後就應該自動消失；`checked` 既然是選中狀態，就應該直接支援 `v-model`。但從元件庫設計角度看，`Tag` 保持較小的責任範圍是合理的。

第一，`Tag` 無法知道外部資料結構。單顆標籤可能由 `v-if` 控制，也可能來自陣列，也可能是遠端資料回傳結果。若 `Tag` 自己直接刪除，就會與外部資料來源失去同步。

第二，`Tag` 的 close 行為可能需要被攔截。例如使用者點擊 close 後，外部可能要做確認、紀錄、動畫、API 請求，甚至根本不刪除。只 emit `on-close` 可以保留這些彈性。

第三，`Tag` 的 checked 狀態既要支援簡單使用，也要能被 `TagSelectOption` 包裝。如果設計成完全依賴外部回寫，簡單使用會變麻煩；如果設計成完全內部狀態，又不利於外部同步。因此它採用「內部可切換 + 外部可同步」的折衷模型。

這種設計在元件庫中很常見：底層元件提供小而穩定的行為，高階元件再把它包裝成完整資料模型。

---

## 16. 閱讀原始碼時的建議路線

如果你要重新打開 `Tag` 相關原始碼，建議按照以下順序閱讀。

### 16.1 先讀 props 與 emits

先確認 `Tag` 對外開了哪些互動入口。

```txt
closable
checkable
checked
name
emits: ['on-change', 'on-close']
```

這一步的目的，是先知道外部使用者能控制什麼，以及能監聽什麼。

### 16.2 再讀 `data()` 與 watcher

接著看 `checked` 如何進入 `isChecked`，以及外部 prop 後續變化如何同步。

```txt
checked prop → isChecked internal state
checked watcher → sync isChecked
```

這一步是理解「不是標準 v-model，但可被外部同步」的關鍵。

### 16.3 再讀 `check()`

接著讀 root click 如何進入 `check()`，並觀察 `checkable`、`isChecked`、`on-change`、`name` 的關係。

```txt
root click → checkable guard → toggle isChecked → emit on-change
```

這一步要特別注意：`on-change` 的第一個參數是新的 checked。

### 16.4 再讀 `close()`

接著讀 close icon 如何進入 `close()`，並觀察它只 emit、不刪除、不改狀態。

```txt
close icon click → emit on-close → external handles removal
```

這一步要特別注意：`on-close` 的第一個參數是 event。

### 16.5 最後讀 `TagSelectOption`

最後看 `TagSelectOption` 如何消費 `Tag` 的 `checkable` 與 `on-change`。這可以幫助你理解 `Tag` 為什麼不需要自己管理列表狀態。

---

## 17. 後續延伸方向

這份筆記之後可以拆成幾個更深入的主題。

| 延伸主題 | 可以研究的問題 |
| --- | --- |
| `Tag` 與 Vue 3 `v-model` 設計比較 | 如果要重構成 `v-model:checked`，API 應該如何設計？ |
| `TagSelect` 原始碼閱讀 | `TagSelect` 如何收集 option、同步 `modelValue`、處理全選與展開？ |
| 元件庫事件命名慣例 | 為什麼 View UI Plus 使用 `on-change`、`on-close` 這種命名？和 Vue 原生 `update:*` 有何差異？ |
| 可關閉元件的資料所有權 | `Tag`、`Alert`、`Modal` 這類元件對「關閉」的責任邊界有何不同？ |
| 受控與非受控元件設計 | 在 Vue 元件中，什麼時候應該讓元件自己保存狀態？什麼時候應該完全交給外部？ |

---

## 18. 本章總結

`Tag` 的狀態與事件模型可以用一句話概括：`Tag` 管單顆標籤的即時互動，外部管資料來源與是否移除。

`checked` 會初始化並同步內部 `isChecked`，但 `Tag` 點擊時也會自己反轉 `isChecked`，所以它不是標準 `v-model`。`checkable` 是互動開關，只有它為 `true` 時，root click 才會切換選中狀態並 emit `on-change`。

`closable` 只負責讓 close icon 出現。點擊 close icon 後，`Tag` 只 emit `on-close`，不會修改內部狀態，也不會自動從畫面消失。真正的刪除、隱藏或列表更新都由外部負責。

`name` 不是顯示文字，而是事件識別值。當 `name !== undefined` 時，`on-change` 和 `on-close` 都會把 `name` 作為額外參數帶回外部，這讓列表場景可以知道是哪一顆 `Tag` 被操作。

最後，`.stop` 是這個元件互動語意的重要細節。它讓 root click 與 close icon click 彼此隔離，避免點擊關閉時意外觸發選取切換。

---

## 19. 自我檢查問題

1. `Tag` 的 `isChecked` 在什麼時候初始化？初始化來源是什麼？
2. 外部改變 `checked` prop 時，`Tag` 透過哪個機制同步內部狀態？
3. 為什麼說 `Tag` 的 `checked` 不是標準 Vue 3 `v-model`？
4. `checkable=false` 時，使用者點擊 root 會發生什麼？
5. `checkable=true` 時，`check()` 的完整流程是什麼？
6. `on-change` 在沒有 `name` 與有 `name` 時，payload 分別是什麼？
7. `on-close` 的第一個參數是什麼？它和 `on-change` 的第一個參數有什麼不同？
8. 為什麼 `closable` 不代表 `Tag` 會自動消失？
9. 為什麼 `name=0` 仍然會被當成有效 name？
10. `closable + checkable` 同時存在時，為什麼點 close icon 不會觸發 root 的 `check()`？
11. `TagSelectOption` 如何展示 `Tag` 與列表狀態管理之間的責任分工？
12. 如果你要把 `Tag` 改成支援標準 `v-model:checked`，你會新增或調整哪些事件與 prop？

---

## 20. 資訊不足與後續確認

本章根據原始筆記中提供的程式片段與說明重構，以下內容需要在後續閱讀完整原始碼時再確認。

| 待確認項目 | 為什麼需要確認 |
| --- | --- |
| `TagSelect` 完整實作 | 原始筆記只提供 `TagSelectOption` 的局部片段，尚未展開 `TagSelect` 如何管理 `modelValue`、全選與展開。 |
| 官方 example 的完整上下文 | 原始筆記提供了關鍵片段，但若要精準整理所有 demo 場景，仍需回到完整 `examples/routers/tag.vue`。 |
| Vue 版本與事件 typing 細節 | 若要進一步分析 `onOnChange`、`onOnClose` 在 `.d.ts` 中的型別生成方式，需要對照完整 type declaration。 |
| 是否存在歷史相容 API | 若要判斷事件命名是否受 View UI / iView 歷史影響，需要延伸閱讀版本演進。 |

---

## 21. 品質檢查

- 已保留原始筆記中的核心資訊：`checked`、`isChecked`、watcher、`check()`、`close()`、`on-change`、`on-close`、`name`、`.stop`、`TagSelectOption`。
- 已把原本偏流程速查的內容補成段落式教學說明。
- 已補上 `Tag` 狀態模型、事件 payload、控制邊界與設計取捨。
- 已使用 Markdown 標題、表格、程式碼區塊與流程圖式文字整理。
- 已標註資訊不足處，避免推測未提供的完整原始碼細節。
- 已加入本章總結、自我檢查問題與後續延伸方向。
