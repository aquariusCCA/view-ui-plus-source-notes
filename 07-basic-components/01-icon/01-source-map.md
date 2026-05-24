# View UI Plus `Icon` 圖標元件原始碼地圖與閱讀指南

## 1. 本章定位

本章是一份 `Icon` 圖標元件的原始碼閱讀指南。它不以逐行解釋每一段程式碼為目標，而是先幫你建立一張完整的閱讀地圖：如果想理解 View UI Plus 的 `Icon` 元件，到底要看哪些檔案？這些檔案各自回答什麼問題？它們之間又如何串成一個可被使用者穩定使用的 public component？

在元件庫中，`Icon` 看起來是一個非常小的元件。從 runtime component 的角度，它可能只是輸出一個 `<i>` 標籤，並根據 props 綁定 class 與 style。但是，從元件庫作者的角度來看，一個可以對外穩定使用的 `Icon`，至少包含以下幾個層次：

```txt
使用者 API
  -> Vue runtime component
  -> TypeScript type declaration
  -> icon font style / font resource
  -> examples / documentation
  -> component registry
  -> plugin install
```

也就是說，`Icon` 不是只有 `icon.vue`。`icon.vue` 只負責把 props 轉成 DOM 上的 class 與 style；真正讓圖標顯示出來的是 icon font 樣式與字體檔；真正讓使用者能從元件庫中引入或全域使用它的，是 component registry 與 plugin install 機制。

因此，本章的閱讀目標不是「記住所有圖標名稱」，而是理解以下三件事：

1. `Icon` 的 public API 是什麼。
2. `Icon` 如何把 API 轉成 DOM class / style。
3. 這些 class 如何透過 icon font 變成畫面上的圖標。

---

## 2. 學習前需要建立的基本觀念

### 2.1 `Icon` 是元件庫裡的視覺原子

在 View UI Plus 這類元件庫中，`Icon` 通常屬於最底層的視覺原子。它不像 `Button` 需要處理 click、loading、disabled 等互動狀態，也不像 `Badge` 需要處理數值、圓點、溢出數字等顯示規則。`Icon` 的任務非常集中：根據使用者傳入的 props，產生正確的 class 與 inline style。

這種元件的設計重點不在複雜的狀態管理，而在「穩定、輕量、容易被其他元件組合」。例如 `Button`、`Menu`、`Input`、`Alert` 等元件都可能需要圖標，如果 `Icon` 本身過於複雜，就會增加整個元件庫的維護成本。

所以閱讀 `Icon` 時，要先把它理解成一個底層基礎元件。它本身不一定有複雜邏輯，但它連接了 API、class naming、CSS font icon 與元件庫安裝機制。

### 2.2 `Icon` 本身不是圖標資料庫，而是 class 轉接器

初學者很容易以為 `Icon` component 裡面存放了所有圖標，因為官方範例頁通常會列出大量圖標名稱，`Icon` component 的主要任務是根據 `type` 產生類似 `ivu-icon-ios-add` 的 class。

真正決定 `ivu-icon-ios-add` 顯示什麼圖形的，是 `src/styles/common/iconfont/` 底下的 icon font 樣式。這些樣式會定義 `.ivu-icon` 的字體、渲染方式，以及每個 `.ivu-icon-xxx:before` 對應的 Unicode `content`。

可以把 `Icon` 想成一個轉接器：

```txt
<Icon type="ios-add" />
        |
        v
產生 class：ivu-icon ivu-icon-ios-add
        |
        v
CSS 命中：.ivu-icon-ios-add:before
        |
        v
透過 icon font 顯示圖標字形
```

從這條鏈路可以看出，`Icon` component 和 icon font style 是分工合作的。component 負責產生 class，CSS 負責把 class 轉成實際可見的圖標。

### 2.3 讀元件庫時，要區分 runtime source 與 public surface

閱讀元件庫原始碼時，不能只看 runtime source。runtime source 告訴你元件在執行時怎麼渲染；public surface 則告訴你這個元件如何被使用者取得、引入、全域註冊與型別提示。

以 `Icon` 為例：

- `src/components/icon/icon.vue` 回答「元件執行時怎麼產生 DOM」。
- `types/icon.d.ts` 回答「使用者可以傳哪些 props」。
- `src/components/icon/index.js` 回答「這個資料夾如何輸出單一元件」。
- `src/components/index.js` 回答「元件庫如何集中 export `Icon`」。
- `src/index.js` 回答「完整安裝 View UI Plus 時，`Icon` 如何被全域註冊」。

如果只看 `icon.vue`，你會知道它如何渲染；但如果沒有看 registry 與 install，就不會知道它如何進入使用者真正能使用的元件庫 API。

---

## 3. Source Entry：`Icon` 原始碼入口地圖

下面這張表是本章最重要的閱讀地圖。它不是要你背路徑，而是幫你建立檔案責任邊界。每個檔案都回答不同層次的問題。

| 類型 | 路徑 | 角色 | 回答的問題 | 閱讀重點 |
| --- | --- | --- | --- | --- |
| Runtime Component | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/icon.vue` | 元件實作 | `Icon` 在執行時如何渲染？ | props、`classes`、`styles`、`<i>` 節點 |
| Component Entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/icon/index.js` | 單元件出口 | `icon` 資料夾如何對外輸出？ | 是否將 `icon.vue` 作為 default export |
| Type Declaration | `01-origin/source/view-ui-plus-v1.3.20/types/icon.d.ts` | 對外型別契約 | 使用者可以傳哪些 props？ | `type`、`size`、`color`、`custom` |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/icon.vue` | 官方使用範例 | 官方如何示範使用 `Icon`？ | 大量使用 `<Icon :type="item" />` 展示內建圖標 |
| Style Import | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/index.less` | common style 入口 | icon font 樣式從哪裡被匯入？ | 是否匯入 `iconfont/ionicons` |
| Icon Font | `01-origin/source/view-ui-plus-v1.3.20/src/styles/common/iconfont/` | 圖標字體系統 | class 如何變成圖標？ | `@font-face`、`.ivu-icon`、`.ivu-icon-xxx:before` |
| Public Registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 元件集中匯出 | `Icon` 是否是 public export 的一部分？ | `export { default as Icon } from './icon';` |
| Plugin Install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | Vue plugin 安裝入口 | 完整安裝時如何全域註冊？ | `ViewUI` 收集 components，`install(app)` 呼叫 `app.component` |

這張表可以拆成三條閱讀線：

第一條是 runtime 線，從 `icon.vue` 看 `Icon` 如何把 props 轉成 DOM。第二條是 style 線，從 `common/index.less` 追到 `iconfont/`，理解 class 如何對應字形。第三條是 public surface 線，從 `components/index.js` 與 `src/index.js` 理解它如何被元件庫對外提供。

---

## 4. 從使用方式反推 `Icon` 的元件設計

在正式看檔案前，可以先從使用者的角度想像 `Icon` 的基本用法：

```vue
<Icon type="ios-add" />
```

這段使用方式看似簡單，但背後其實隱含三個需求。

第一，`Icon` 必須接收一個 `type` prop，讓使用者用字串指定圖標名稱。第二，`Icon` 必須把這個圖標名稱轉成符合 View UI Plus 命名規則的 class，例如 `ivu-icon-ios-add`。第三，樣式系統必須已經定義好 `.ivu-icon-ios-add:before` 對應的字形，否則畫面上仍然不會顯示圖標。

如果使用者需要調整大小或顏色，則可能會寫成：

```vue
<Icon type="ios-add" :size="24" color="#2d8cf0" />
```

這時 `Icon` 又多了兩個責任：把 `size` 轉成 `font-size`，把 `color` 轉成 CSS color。圖標是字體圖標，所以控制大小與顏色，本質上是在控制字體大小與字體顏色。

如果使用者想接入自己的 icon font，則可能會使用 `custom`：

```vue
<Icon custom="i-icon i-icon-search" />
```

這表示 `Icon` 不只支援 View UI Plus 內建的 `ivu-icon-*` 命名，也保留一個擴充口，讓使用者可以接自己的 class。從元件庫 API 設計角度看，`type` 是內建圖標入口，`custom` 是外部圖標入口。

---

## 5. 核心檔案逐步講解

### 5.1 `icon.vue`：最小 runtime component

`src/components/icon/icon.vue` 是 `Icon` 的 runtime 實作。它的 template 非常短：

```vue
<i :class="classes" :style="styles"></i>
```

這段 template 告訴我們三件事。

第一，`Icon` 的實際 DOM 節點是 `<i>`。這是很多 icon font 元件常見的寫法，因為 `<i>` 在語意上常被用於 icon 類型的裝飾性元素。不過更重要的是，它提供一個可以掛 class 與 style 的 DOM 容器。

第二，`Icon` 沒有 slot，也不包裹子節點。這代表它不是靠插入文字、SVG 或其他子元素顯示圖標，而是完全依靠 class 與 CSS pseudo-element，例如 `:before` 產生內容。

第三，`Icon` 的 runtime 重點集中在兩個 computed 結果：`classes` 與 `styles`。可以用以下方式理解：

```txt
props -> classes -> class attribute
props -> styles  -> style attribute
```

`classes` 負責決定 `<i>` 應該有哪些 class。至少會涉及基礎 class `ivu-icon`，以及由 `type` 推導出來的 `ivu-icon-${type}`。如果使用者傳入 `custom`，也會加入自訂 class。

`styles` 則負責根據 `size` 與 `color` 產生 inline style。由於 icon font 是字體圖標，所以 `size` 對應到 `font-size`，`color` 對應到文字顏色。

從元件設計角度看，這是一個非常典型的「props 映射型元件」。它不擁有複雜狀態，也不主動觸發資料流，而是把使用者輸入轉成畫面需要的 class / style。這也是它適合被其他元件大量組合使用的原因。

### 5.2 `types/icon.d.ts`：public API 的型別契約

`types/icon.d.ts` 是 `Icon` 對外的型別宣告。閱讀元件庫時，型別檔非常重要，因為它代表元件庫承諾給使用者的 public contract。

`Icon` 對外公開四個 props：

| Prop | Type | 主要責任 | 說明 |
| --- | --- | --- | --- |
| `type` | `string` | 指定內建圖標 | 圖標名稱，會對應到 `ivu-icon-${type}` |
| `size` | `number \| string` | 控制圖標大小 | 單位是 px，runtime 會轉成 `font-size` |
| `color` | `string` | 控制圖標顏色 | 轉成 CSS color |
| `custom` | `string` | 接入自訂 class | 用於外部 icon font 或自定義圖標 class |

這裡要特別注意：runtime source 告訴你「元件實際怎麼做」，type declaration 告訴你「使用者被允許怎麼用」。兩者都要看，才能掌握一個元件的完整 API。

例如，如果你只看 `icon.vue`，可能會知道內部用了 `custom`。但只有對照 `types/icon.d.ts`，才能確認 `custom` 是正式公開給使用者的 prop，而不是內部暫時使用的實作細節。

### 5.3 `src/components/icon/index.js`：單元件出口

`src/components/icon/index.js` 的角色通常很小，但它在元件庫中很常見。它負責把 `icon.vue` 作為這個資料夾的預設輸出。

這個檔案不是主要邏輯檔，也不是全域註冊入口。它的作用比較像「資料夾門面」。有了它之後，其他地方可以用較乾淨的方式引入 `Icon`，而不需要直接指定到 `icon.vue`。

可以把它理解成這一層：

```txt
src/components/icon/icon.vue
        |
        v
src/components/icon/index.js
        |
        v
其他模組從 './icon' 取得 Icon
```

閱讀時不需要在這個檔案停留太久，只要確認它是否正確輸出 runtime component 即可。

### 5.4 `src/styles/common/index.less`：common style 入口

`src/styles/common/index.less` 是 common style 的入口之一。它會匯入：

```less
@import "iconfont/ionicons";
```

這個匯入非常關鍵。因為 `Icon` component 只負責產生 class，如果 icon font 樣式沒有被載入，DOM 上即使有 `ivu-icon ivu-icon-ios-add`，畫面也不會出現正確圖標。

這也是閱讀 `Icon` 時不能只看 Vue component 的原因。對 icon font 類型的元件來說，CSS 不是附屬品，而是核心功能的一部分。

### 5.5 `src/styles/common/iconfont/`：真正的圖標字形系統

`src/styles/common/iconfont/` 是 `Icon` 真正能顯示圖標的關鍵。`ionicons.less` 會再匯入三類檔案：

```less
@import "_ionicons-variables";
@import "_ionicons-font";
@import "_ionicons-icons";
```

這三類檔案可以這樣理解：

| 檔案 | 主要責任 | 閱讀重點 |
| --- | --- | --- |
| `_ionicons-variables.less` | 定義 icon font 相關變數 | font path、font family 或其他可重用變數 |
| `_ionicons-font.less` | 定義字體與基礎 class | `@font-face`、`.ivu-icon` 的基礎樣式 |
| `_ionicons-icons.less` | 定義每個圖標 class | `.ivu-icon-xxx:before { content: ... }` |

其中 `_ionicons-font.less` 通常會定義 `@font-face`，讓瀏覽器知道 icon font 的字體資源在哪裡；也會定義 `.ivu-icon` 的基礎樣式，讓所有圖標都有一致的字體、顯示方式與渲染規則。

`_ionicons-icons.less` 則負責把每個具體圖標名稱對應到 Unicode `content`。例如概念上可能會有類似這樣的規則：

```less
.ivu-icon-some-name:before {
  content: "...";
}
```

實際 content 值需要以原始碼為準。本章重點不是背每個 content，而是理解：`type` 產生的 class 必須能在 `_ionicons-icons.less` 中找到對應規則，圖標才會顯示。

### 5.6 `examples/routers/icon.vue`：官方範例如何使用 `Icon`

`examples/routers/icon.vue` 是官方範例頁。這個檔案會透過大量 `icons` 陣列搭配：

```vue
<Icon v-for="item in icons" :key="item" :type="item" />
```

這個範例的價值不是展示複雜互動，而是展示「內建圖標名稱如何被餵給 `type` prop」。它讓你確認 `Icon` 最主要的使用情境：傳入一個 icon name，然後讓元件產生對應 class。

對原始碼閱讀來說，example 的價值有兩個。

第一，它讓你知道元件作者預期使用者怎麼使用這個元件。第二，它提供大量實際可用的 icon name，方便你反查這些名稱是否能在 icon font 樣式中找到對應 class。

不過，初次閱讀時不需要把完整 icon 清單逐一看完。清單通常很長，逐項背誦沒有太大價值。比較好的做法是挑一兩個範例 icon name，追蹤它們從 `type` 到 class，再到 `_ionicons-icons.less` 的對應規則。

### 5.7 `src/components/index.js`：確認 `Icon` 是 public export

`src/components/index.js` 是元件集中匯出的地方。它包含：

```js
export { default as Icon } from './icon';
```

這一行代表 `Icon` 不是一個只存在於內部資料夾裡的私有元件，而是 View UI Plus public export 的一部分。

從元件庫作者角度看，這一層很重要。因為一個元件就算寫好了 runtime source，如果沒有被匯出，使用者仍然無法透過元件庫入口取得它。

所以閱讀這個檔案時，你要確認的是：`Icon` 是否有進入元件庫的集中匯出清單。這會影響使用者能否用具名匯入或完整安裝的方式取得它。

### 5.8 `src/index.js`：plugin install 與全域註冊

`src/index.js` 是 View UI Plus 的主要安裝入口之一。它會把 components 收集成 `ViewUI`，並在 `install(app)` 時呼叫：

```js
app.component(key, ViewUI[key]);
```

這代表當使用者完整安裝 View UI Plus plugin 時，`Icon` 會被註冊成全域元件。使用者就可以在 template 中直接寫：

```vue
<Icon type="ios-add" />
```

這裡要區分三個層級：

| 層級 | 檔案 | 作用 |
| --- | --- | --- |
| 單元件出口 | `src/components/icon/index.js` | 讓 `./icon` 可以代表 `icon.vue` |
| 元件庫集中匯出 | `src/components/index.js` | 把 `Icon` 放進 public components 清單 |
| Plugin 安裝 | `src/index.js` | 在 `install(app)` 時全域註冊元件 |

這三者很容易混在一起，但它們的責任不同。單元件出口解決「這個資料夾怎麼輸出」；集中匯出解決「元件庫有哪些公開元件」；plugin install 解決「使用者安裝後能不能全域使用」。

---

## 6. `Icon` 的完整渲染鏈路

理解 `Icon` 最有效的方式，是把它從使用者輸入一路追到畫面輸出。

```txt
使用者撰寫：
<Icon type="ios-add" :size="24" color="#2d8cf0" />

        |
        v

Vue props：
type = "ios-add"
size = 24
color = "#2d8cf0"

        |
        v

computed classes / styles：
classes -> ivu-icon、ivu-icon-ios-add
styles  -> font-size、color

        |
        v

渲染 DOM：
<i class="ivu-icon ivu-icon-ios-add" style="font-size: 24px; color: #2d8cf0;"></i>

        |
        v

CSS icon font：
.ivu-icon 提供 icon font 基礎樣式
.ivu-icon-ios-add:before 提供對應 content

        |
        v

瀏覽器透過 icon font 顯示圖標
```

這條鏈路有一個很重要的觀念：`Icon` 的成功渲染不是單一檔案完成的，而是 component、CSS selector、font resource 共同完成的。

因此，如果畫面沒有顯示圖標，問題可能出在不同層級：

- `type` 寫錯，導致 class 不存在。
- `Icon` 沒有正確渲染出 `ivu-icon-*` class。
- common style 沒有被載入。
- icon font 檔案沒有被正確載入。
- `_ionicons-icons.less` 沒有對應的 `.ivu-icon-xxx:before` 規則。
- 自訂 `custom` class 對應的外部 icon font 沒有載入。

這也是為什麼 source map 筆記對 `Icon` 很重要。它能幫你快速定位問題位於 runtime、style、資源或安裝層。

---

## 7. `type`、`custom`、`size`、`color` 的設計意義

### 7.1 `type`：內建圖標的入口

`type` 是 `Icon` 最核心的 prop。它代表使用者要使用哪一個內建圖標。`type` 會被轉成 `ivu-icon-${type}` 形式的 class。

例如：

```vue
<Icon type="ios-add" />
```

概念上會產生：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

這種設計有一個好處：component 不需要知道每一個 icon 的圖形資料。它只要按照命名規則產生 class，剩下交給 icon font 樣式處理。

### 7.2 `custom`：自訂 icon class 的擴充入口

`custom` 則是給外部 icon font 或自定義 class 使用的入口。其他範例或其他元件中可能會出現：

```vue
<Icon custom="i-icon i-icon-search" />
```

這代表使用者可以不走 View UI Plus 內建的 `ivu-icon-*` 命名，而是把自己的 class 傳給 `Icon`。

從元件庫設計角度看，這是一個很實用的擴充點。因為元件庫不可能包含所有業務系統需要的圖標。如果 `Icon` 只支援 `type`，使用者要接入公司內部 icon font 就會比較麻煩。`custom` 讓 `Icon` 同時支援內建圖標與自訂圖標。

### 7.3 `size`：透過字體大小控制圖標尺寸

因為 `Icon` 使用 icon font，所以圖標大小通常透過 `font-size` 控制。`size` prop 的型別是 `number | string`，單位是 px。

這裡要注意一件事：如果 runtime 會補上 `px`，那麼 `size` 比較適合傳數字或數字字串，例如 `16`、`24`、`"32"`。如果想傳入任意 CSS 單位，例如 `1.5rem`，就需要回到實際 runtime 實作確認是否支援，不能只根據型別 `string` 就推論一定支援所有 CSS 單位。

### 7.4 `color`：透過文字顏色控制圖標顏色

`color` prop 會轉成 CSS color。因為 icon font 本質上是字體，所以控制顏色的方式與文字相同。

例如：

```vue
<Icon type="ios-add" color="#2d8cf0" />
```

概念上會產生：

```html
<i class="ivu-icon ivu-icon-ios-add" style="color: #2d8cf0;"></i>
```

這種設計簡單直觀，也讓 `Icon` 很容易被放進其他元件中配合不同狀態改變顏色。

---

## 8. 建議閱讀路線

### 8.1 第一次閱讀：建立完整圖像

如果你是第一次系統性閱讀 `Icon`，不要一開始就鑽進完整 icon 清單。建議照以下順序閱讀：

| 順序 | 檔案 | 目標 |
| --- | --- | --- |
| 1 | `types/icon.d.ts` | 先確認 public props：`type`、`size`、`color`、`custom` |
| 2 | `src/components/icon/icon.vue` | 理解 props 如何轉成 `classes` 與 `styles` |
| 3 | `src/styles/common/index.less` | 確認 icon font 樣式從哪裡被匯入 |
| 4 | `src/styles/common/iconfont/_ionicons-font.less` | 理解 `.ivu-icon` 的基礎樣式與 `@font-face` |
| 5 | `src/styles/common/iconfont/_ionicons-icons.less` | 挑一兩個 icon name 追蹤 `:before content` |
| 6 | `examples/routers/icon.vue` | 看官方如何展示內建圖標 |
| 7 | `src/components/index.js`、`src/index.js` | 確認 `Icon` 如何進入 public export 與 plugin install |

這個順序的核心是：先 API，再 runtime，再 style，最後看元件庫出口。這樣可以避免一開始被大量 icon list 淹沒。

### 8.2 第二次閱讀：從一個具體案例追完整鏈路

第二次閱讀時，建議挑一個具體圖標名稱，例如 `ios-add`，從頭追到尾：

```txt
examples/routers/icon.vue
  -> <Icon :type="item" />
  -> item = "ios-add"
  -> icon.vue 產生 ivu-icon-ios-add
  -> _ionicons-icons.less 找 .ivu-icon-ios-add:before
  -> _ionicons-font.less 確認 font-face 與基礎樣式
```

這種「用一個案例貫穿整條鏈路」的閱讀方式，比逐一閱讀所有 icon class 更有效。你只要理解一個 icon 怎麼跑通，其他 icon 通常只是同一套機制下的不同名稱。

### 8.3 第三次閱讀：觀察其他元件如何組合 `Icon`

當你理解 `Icon` 本身後，可以去看其他元件如何使用它。例如按鈕、選單、提示、表單相關元件中，常會出現 icon 需求。這時你的閱讀重點不再是 `Icon` 怎麼渲染，而是它作為底層視覺原子如何被組合到更高階元件。

這個階段可以觀察：

- 其他元件是傳 `type` 還是 `custom`。
- icon 是否會跟隨元件狀態改變顏色或大小。
- icon 是否會出現在 prefix、suffix、loading、clearable 等位置。
- 高階元件是否直接使用 `Icon`，或自己產生 icon class。

這會幫你從「單一元件閱讀」進入「元件庫設計閱讀」。

---

## 9. 常見誤區與正確理解

| 誤區 | 為什麼容易誤解 | 正確理解 |
| --- | --- | --- |
| 以為 `Icon` component 裡存放所有圖標 | 範例頁列出大量圖標名稱，看起來像 component 管理所有圖標 | 圖標字形在 icon font 樣式與字體檔中，component 只產生 class |
| 只看 `icon.vue` 就以為讀完了 | `Icon` runtime 很短，容易讓人覺得邏輯很簡單 | 還必須看 `src/styles/common/iconfont/`，才能知道 class 如何顯示成圖標 |
| 把 `type` 和 `custom` 當成同一件事 | 兩者最後都會變成 class | `type` 接內建 `ivu-icon-*` 命名；`custom` 接外部自訂 class |
| 看到 `size` 是 `number \| string` 就以為支援所有 CSS 單位 | 型別中的 `string` 看起來很寬 | runtime 會補上 `px`，是否支援 `rem`、`em` 等單位需看實際實作 |
| 以為 `src/components/icon/index.js` 是全域註冊入口 | 它也在做 export，容易和 plugin install 混淆 | 它只是單元件出口；全域註冊要看 `src/index.js` 的 `install(app)` |
| 以為圖標沒顯示一定是 Vue component 壞掉 | 使用時看到的是 `<Icon>`，直覺會先懷疑元件 | icon font 類元件還要檢查 style import、font resource、class naming 與 `:before content` |

---

## 10. 實務排錯路線

如果你在專案中使用：

```vue
<Icon type="ios-add" />
```

但畫面沒有顯示圖標，可以按照以下順序排查。

### 10.1 檢查 DOM 是否有正確 class

先打開 DevTools，看實際渲染出來的 `<i>` 是否包含類似：

```html
<i class="ivu-icon ivu-icon-ios-add"></i>
```

如果 class 沒有出現，問題可能在 `type` 沒有正確傳入，或 `Icon` runtime 的 `classes` 沒有如預期產生結果。

如果 class 有出現，代表 Vue component 大致正常，接下來要往 CSS 與 font resource 排查。

### 10.2 檢查 icon font 樣式是否載入

確認專案是否載入 View UI Plus 的 common style。如果 `.ivu-icon` 基礎樣式不存在，圖標通常不會正確顯示。

這時可以在 DevTools 的 Styles 面板搜尋 `.ivu-icon`，確認是否有對應規則。如果沒有，問題可能在樣式入口未匯入，或打包設定沒有包含相關 less/css。

### 10.3 檢查 `.ivu-icon-xxx:before` 是否存在

如果 `.ivu-icon` 存在，下一步要檢查具體圖標 class，例如 `.ivu-icon-ios-add:before` 是否有被定義。

如果沒有對應規則，可能是 `type` 名稱寫錯，或者目前版本的 icon font 清單中沒有這個圖標。

### 10.4 檢查 font resource 是否成功載入

如果 class 與 CSS 規則都存在，但圖標仍然顯示成方塊或亂碼，就要檢查 icon font 字體檔是否成功載入。這通常可以從 Network 面板確認字體檔是否有 404、路徑錯誤、跨域問題或打包後資源路徑錯誤。

### 10.5 如果使用 `custom`，檢查外部 icon font

如果你使用的是：

```vue
<Icon custom="i-icon i-icon-search" />
```

那就不應該只檢查 View UI Plus 的 `ivu-icon-*`。你還要確認自己的 `i-icon`、`i-icon-search` 樣式與對應 font resource 是否已經載入。

---

## 11. 本章總結

`Icon` 是 View UI Plus 裡非常小但很重要的基礎元件。它的 runtime component 可能只有一個 `<i>`，但完整理解它時，不能只停在 `icon.vue`。你需要同時看 public API、runtime mapping、icon font style、官方範例、component registry 與 plugin install。

本章最核心的理解是：`Icon` 本身不是圖標資料庫，而是一個 class 轉接器。使用者透過 `type` 指定內建圖標名稱，component 產生 `ivu-icon-*` class，CSS icon font 再透過 `.ivu-icon-xxx:before` 與 `@font-face` 顯示真正的圖標字形。

從元件庫作者角度看，這種設計有幾個優點。第一，runtime component 很輕量，容易被其他元件組合。第二，圖標清單集中在 style / font 系統中，component 不需要知道每個圖標的內容。第三，`custom` prop 提供了外部 icon font 的擴充能力。第四，透過 type declaration、registry 與 install，`Icon` 被包裝成穩定的 public component。

未來閱讀其他 View UI Plus 元件時，也可以套用同樣方法：不要只看 `.vue` 檔，而要同時追 API、樣式、範例、匯出與安裝入口。這才是閱讀元件庫原始碼時比較完整的視角。

---

## 12. 自我檢查問題

1. `Icon` 的 runtime component、type declaration、icon font style 各自回答什麼問題？
2. 為什麼說 `Icon` 是「class 轉接器」，而不是「圖標資料庫」？
3. `<Icon type="ios-add" />` 從使用者寫法到畫面顯示，中間會經過哪些步驟？
4. `type` 和 `custom` 都會影響 class，那它們的設計目的有什麼差別？
5. 為什麼只看 `src/components/icon/icon.vue` 不足以完整理解 `Icon`？
6. `src/components/icon/index.js`、`src/components/index.js`、`src/index.js` 三者在元件庫中的責任有什麼不同？
7. 如果 DOM 上有 `ivu-icon-ios-add`，但畫面沒有圖標，你會優先檢查哪些東西？
8. 為什麼 `size` prop 雖然可以是 `string`，但仍不能直接推論它支援任意 CSS 單位？
9. 官方範例頁 `examples/routers/icon.vue` 對原始碼閱讀有什麼價值？
10. 如果你要接入公司內部自訂 icon font，你會優先研究 `type` 還是 `custom`？為什麼？

---

## 13. 後續延伸方向

這份筆記是 `Icon` 的 source map 與閱讀指南。如果要繼續深入，可以拆成以下幾篇獨立筆記。

### 13.1 `Icon` runtime 實作逐行解析

後續可以專門針對 `src/components/icon/icon.vue` 做逐行解析，包含 props 定義、computed `classes`、computed `styles`，以及 `type`、`custom` 同時存在時的 class 組合規則。

### 13.2 View UI Plus icon font 系統解析

可以深入閱讀 `src/styles/common/iconfont/`，整理 `@font-face`、font path、`.ivu-icon` 基礎樣式、`.ivu-icon-xxx:before` 命名規則與 content 對應方式。

### 13.3 元件庫 public surface：從 component export 到 plugin install

可以以 `Icon` 為例，延伸整理 View UI Plus 如何把單一元件放進集中 export，再透過 plugin install 全域註冊。這對理解整個元件庫架構很重要。

### 13.4 其他元件如何組合 `Icon`

可以追蹤 `Button`、`Input`、`Menu` 等元件中對 `Icon` 的使用，觀察底層視覺原子如何被組合成高階元件功能。

### 13.5 icon font 與 SVG icon 的設計取捨

可以進一步比較 icon font 與 SVG icon 的差異，例如色彩控制、可訪問性、打包體積、圖標更新、瀏覽器渲染與自訂能力。這會幫助你理解為什麼不同元件庫會選擇不同的圖標方案。
