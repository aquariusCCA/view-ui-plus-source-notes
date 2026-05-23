# Basic Components：View UI Plus 基礎元件閱讀指南

## 1. 本章定位

本篇筆記是一份「View UI Plus 基礎元件原始碼閱讀地圖」。它的目的不是直接講完每個元件的完整實作細節，而是先建立閱讀 `07-basic-components/` 這個目錄時應該具備的整體框架。

`07-basic-components/` 的核心任務，是整理 View UI Plus 中最小、最常被其他元件或業務畫面組合使用的基礎 UI 元件。這些元件通常不會像 `Table`、`Form`、`Modal` 那樣牽涉大型資料流、複雜校驗或彈層管理，但它們會反覆出現在整個元件庫中，是理解 View UI Plus 元件設計風格的入口。

讀完本篇後，讀者應該能理解三件事。

第一，基礎元件不是只看畫面長什麼樣子，而是要看它如何把 public props、computed class、slot 結構、事件輸出、shared utility、樣式檔與型別宣告串起來。

第二，不同基礎元件的閱讀難度不同。`Icon`、`Divider` 適合建立元件閱讀方法；`Button`、`Tag`、`Badge` 適合觀察互動狀態；`Avatar`、`Cell` 則適合觀察元件組合、fallback 與父子關係。

第三，閱讀元件庫時不能只看 `src/components/`。一個元件真正對外呈現的契約，通常需要同時對照 runtime source、style source、type declaration、component registry、plugin install 與 examples。

本篇不主要處理大型容器、導航結構、表單輸入、資料展示、彈層回饋、業務元件或全域服務。這些主題會放在其他目錄中獨立整理。

---

## 2. 學習前先建立的基本觀念

### 2.1 基礎元件是元件庫的最小設計單位

在元件庫中，基礎元件通常扮演兩種角色。

第一種角色是「直接被業務頁面使用」。例如按鈕、標籤、角標、頭像、分隔線，都是業務畫面中非常常見的 UI 元素。這些元件看似簡單，但它們的 API 設計會直接影響使用者寫頁面的體驗。

第二種角色是「被其他高階元件組合使用」。例如 `Button` 可能出現在表單、彈窗、確認框、操作區；`Icon` 可能出現在導航、選單、提示、狀態展示；`Badge` 可能出現在通知、選單或頭像上。也就是說，基礎元件雖然小，但它們是整個元件庫一致性的來源。

因此，閱讀基礎元件時，不應只問「這個元件怎麼畫出來」，而要問：「它如何定義穩定的 public contract，讓其他元件與業務頁面可以放心組合？」

### 2.2 閱讀元件庫時，要同時看 runtime、style、type 與 example

很多初學者閱讀元件庫時，只打開 `.vue` 檔案，試圖從 template、props、computed、methods 中理解一切。但在元件庫中，單看 runtime source 通常是不夠的。

一個元件真正的設計，需要至少對照三類檔案：

```txt
src/components/<component>/
src/styles/components/<component>.less
types/<component>.d.ts
```

runtime source 告訴你元件實際如何接收 props、計算 class、渲染 slot、處理事件；style source 告訴你 class 名稱背後的視覺規則、尺寸規則、狀態樣式與主題色；type declaration 則代表元件公開給 TypeScript 使用者的 public contract。

如果元件有官方 example，還應補看：

```txt
examples/routers/<component>.vue
```

example 的價值在於驗證「元件作者希望使用者怎麼用」。有時候 source code 可以看出很多能力，但 example 會告訴你哪些能力是主要使用場景，哪些只是補充支援。

### 2.3 public props 是元件對外承諾，不只是內部變數

在元件庫中，`props` 不是單純的資料入口，而是元件對外提供的使用契約。使用者不會關心元件內部如何計算 class，但會關心 `type`、`size`、`shape`、`loading`、`closable`、`checkable`、`count`、`dot`、`status`、`src`、`icon` 這類屬性是否穩定、可預期、容易理解。

因此閱讀基礎元件時，第一步通常不是直接看 methods，而是先看 public props。你要先建立一個問題：「這個元件希望使用者透過哪些 props 控制它？」接著再回頭看 runtime source 如何把 props 轉成 class、style、slot 結構或事件行為。

### 2.4 class 與 style 是元件狀態的視覺投影

元件狀態最後通常會反映到 class 或 inline style 上。例如尺寸、顏色、狀態、形狀、是否禁用、是否 loading、是否可關閉，最後都會進入樣式系統。

所以閱讀基礎元件時，不要把 `computed class` 當成瑣碎細節。它通常是元件設計的核心轉換層：

```txt
props / slot / global config
  -> computed class / computed style
  -> template / render output
  -> less 樣式規則
```

如果只看 props，不看 class，你會不知道狀態如何被渲染。如果只看 `.less`，不看 runtime source，你會不知道哪些 class 是動態生成的。這就是為什麼本區要強調 runtime source 與 style source 的對照閱讀。

### 2.5 slot 代表元件的內容擴充點

基礎元件通常需要在「預設行為」與「可自訂內容」之間取得平衡。slot 的作用，就是讓元件在維持外層結構與樣式一致的同時，允許使用者替換部分內容。

例如 `Divider` 可能需要支援分隔線中間的文字內容；`Badge` 可能需要包裹任意子內容；`Avatar` 可能需要在圖片、圖標與文字之間做 fallback；`Cell` 則可能需要透過 slot 組合標題、描述、額外內容或圖標。實際 slot 名稱與結構需要後續逐一對照原始碼確認，本篇先建立閱讀方向。

---

## 3. 整體概覽

### 3.1 本區核心閱讀主線

本區閱讀 View UI Plus 基礎元件時，可以固定使用下列主線：

```txt
props contract
  -> class / style 計算
  -> slot 結構
  -> event emit
  -> mixin / shared utility
  -> style file
  -> type declaration
```

這條主線的重點是：先理解元件對外提供什麼能力，再理解元件內部如何把這些能力轉成畫面結構、互動行為與樣式規則。

`props contract` 是入口，因為它決定使用者能控制什麼。`class / style 計算` 是中介層，負責把 props、slot、全域設定轉成實際的視覺狀態。`slot 結構` 決定元件能否被彈性組合。`event emit` 決定元件如何把使用者操作回傳給外部。`mixin / shared utility` 顯示元件是否復用共通行為。`style file` 與 `type declaration` 則分別代表視覺規格與型別契約。

### 3.2 本區收斂的元件範圍

本區先收斂在 10 個元件，但閱讀時可以合併成 7 組。這樣安排的原因，是部分元件本來就不是獨立存在，而是和主元件形成父子或輔助關係。

| 分組    | 元件                       | 定位                      | 適合觀察的重點                                      |
| ----- | ------------------------ | ----------------------- | -------------------------------------------- |
| 操作元件  | `Button` / `ButtonGroup` | 最典型的互動基礎元件              | `type`、`size`、`shape`、`loading`、link 行為、群組關係 |
| 圖標元件  | `Icon`                   | 最小視覺原子                  | class 命名、inline style、圖標字體或 class 系統         |
| 分隔元件  | `Divider`                | 低互動的結構型元件               | slot、方向、class 組合、結構樣式                        |
| 標籤元件  | `Tag`                    | 小型狀態元件                  | closable、checkable、自定義顏色、事件輸出                |
| 角標元件  | `Badge`                  | 小型數值 / 狀態展示元件           | count、dot、status、slot override、數值展示規則        |
| 頭像元件  | `Avatar` / `AvatarList`  | 圖片、圖標、文字 fallback 與列表聚合 | fallback 順序、列表聚合、可能的提示行為                     |
| 單元格元件 | `Cell` / `CellGroup`     | 邊界型基礎元件，介於展示與列表行容器之間    | `CellItem` 拆分、父子關係、點擊事件、provide/inject       |

`ButtonGroup`、`AvatarList`、`CellGroup` 不建議單獨孤立閱讀。它們更適合跟主元件放在同一篇筆記中，因為它們的重點不是單一元件的 props，而是父子關係、slot 包裹方式與事件傳遞。

### 3.3 Source Baseline

本區以 View UI Plus v1.3.20 作為閱讀基準。固定版本很重要，因為元件庫會隨版本調整 props、樣式、型別宣告或 example 寫法。如果沒有指定版本，之後回看筆記時很容易出現「筆記內容與目前原始碼對不上」的問題。

| 項目                 | 路徑                                                              | 閱讀重點                                        |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| Runtime components | `01-origin/source/view-ui-plus-v1.3.20/src/components/`         | 元件實際 props、computed、methods、render/template |
| Component styles   | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`  | BEM class、尺寸、狀態、主題色與結構樣式                    |
| Type declarations  | `01-origin/source/view-ui-plus-v1.3.20/types/`                  | 對外 TypeScript public contract               |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 元件是否被 public export                         |
| Plugin install     | `01-origin/source/view-ui-plus-v1.3.20/src/index.js`            | 元件如何被全域註冊，以及 `$VIEWUI` 全域設定如何影響元件           |
| Examples           | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/`       | 使用方式、slot 寫法與互動案例                           |

這張表不是單純的路徑索引，而是一個閱讀順序提示。一般來說，可以先看 `types/` 或 example 建立對外 API 印象，再回到 runtime source 看實作，最後對照 style source 驗證 class 與狀態樣式。

---

## 4. 核心內容逐步講解

### 4.1 用「元件契約」開始閱讀，而不是用 template 開始閱讀

閱讀基礎元件時，最常見的錯誤是打開 `.vue` 檔後立刻從 template 或 render 開始看。這樣做雖然能看到畫面結構，但很容易迷失在 class 名稱、條件判斷與 slot 分支中。

更好的方式是先建立元件契約。所謂元件契約，是指元件對外承諾使用者可以怎麼控制它、它會產生什麼效果、它會在什麼時機對外發出事件。

對每個元件，可以先問以下問題：

1. 這個元件有哪些 public props？
2. 哪些 props 是視覺控制，例如尺寸、顏色、形狀？
3. 哪些 props 是行為控制，例如 loading、closable、checkable？
4. 這個元件是否會 emit 事件？事件代表什麼使用者操作？
5. 這個元件是否支援 slot？slot 是主要內容，還是局部覆寫點？
6. 這個元件是否依賴全域設定、mixin 或 shared utility？

當這些問題有初步答案後，再去看 template / render，就會知道每個條件分支背後的設計目的。

### 4.2 從低狀態元件建立閱讀方法：`Icon` 與 `Divider`

`Icon` 與 `Divider` 適合放在最前面閱讀，原因不是它們最重要，而是它們的狀態相對少，干擾因素少，適合拿來建立基本閱讀方法。

`Icon` 是最小視覺原子。閱讀它時，重點不在複雜互動，而是觀察「元件如何把 props 轉成 class 或 inline style」。例如圖標元件通常會有圖標名稱、尺寸或顏色相關控制，這些控制最後會反映到 class 或 style 上。實際 props 名稱與支援範圍需要後續對照 `types/icon.d.ts` 與 `src/components/icon/icon.vue` 確認。

`Divider` 是低互動的結構型元件。它適合觀察 slot 與 class 組合，因為分隔線通常不需要複雜事件，但可能需要處理方向、文字位置或內容 slot。閱讀 `Divider` 時，要把注意力放在「元件如何用固定結構包住可變內容」。

先讀這兩個元件，可以建立一套最小閱讀流程：

```txt
props
  -> computed class / style
  -> template / slot
  -> less 樣式
  -> type declaration
  -> example 使用方式
```

這套流程建立後，再讀互動較多的元件，會比較不容易被細節淹沒。

### 4.3 再讀操作與狀態元件：`Button`、`Tag`、`Badge`

`Button`、`Tag`、`Badge` 這組元件開始出現比較多狀態與互動，是從「靜態展示元件」進入「可互動元件」的轉折點。

`Button` 是最典型的互動基礎元件。它通常需要處理 `type`、`size`、`shape`、`loading` 等視覺與行為狀態，也可能牽涉 link/navigation mixin。閱讀 `Button` 時，不能只看按鈕本身的樣式，還要觀察它如何在不同 props 組合下維持一致的 class 規則，以及 `ButtonGroup` 如何影響子按鈕的排列與樣式。

`Tag` 是小型狀態元件，適合觀察 closable、checkable、自定義顏色與事件輸出。它的重點是「一個看似簡單的標籤，如何同時支援展示、關閉、選取與自訂顏色」。閱讀時要特別注意狀態變化是否由內部管理，還是透過事件交給外部控制。實際資料流需要後續對照 `src/components/tag/tag.vue` 確認。

`Badge` 是小型數值 / 狀態展示元件。它可能處理 `count`、`dot`、`status`、slot override 等情境。閱讀 `Badge` 時，重點是理解「外層包裹內容」與「角標本體」的關係：角標不是單純文字，而是附著在某個內容容器上的狀態提示。

這組元件的共同閱讀重點是：props 不再只影響外觀，也會影響互動流程與事件輸出。因此閱讀時應同時追蹤「狀態來源」、「畫面變化」與「事件回傳」。

### 4.4 最後讀組合與邊界元件：`Avatar`、`AvatarList`、`Cell`、`CellGroup`

`Avatar` 與 `Cell` 這組元件適合放在後面，因為它們不只是單一 UI 原子，而是開始涉及組合關係與邊界設計。

`Avatar` 的重點是 fallback。頭像元件通常需要在 `src`、`icon`、slot 文字之間做選擇。這類邏輯的核心問題是：「當使用者提供多種內容來源時，元件如何決定優先順序？」如果圖片載入失敗，是否有 fallback 行為？如果提供 icon 與文字，誰優先？這些問題都需要後續對照原始碼確認。

`AvatarList` 則是聚合型元件。它不是單純顯示一個頭像，而是管理多個頭像的排列、數量與可能的提示行為。`AvatarList` 可透過 `Tooltip` 補充提示，因此閱讀時要觀察它是否只是排版容器，還是會主動處理超出數量、提示內容或子元件包裹。

`Cell` 是邊界型基礎元件，介於基礎展示與列表行容器之間。它不像 `Button` 那樣純粹表示操作，也不像 `Divider` 那樣只是結構分隔，而是常常承載「一列資訊」與「可點擊行為」。 `Cell` 會使用 `CellItem` 拆出內部結構，`CellGroup` 透過 provide/inject 接收子項點擊事件，因此閱讀時要觀察父子元件如何分工。

這一組元件的閱讀重點是「元件邊界」。你要觀察哪些責任放在主元件，哪些責任拆到 group 或 item，哪些行為透過 provide/inject 傳遞，哪些內容交給 slot。

### 4.5 對照 type declaration，確認真正的 public API

對元件庫而言，`types/<component>.d.ts` 不是附屬品，而是 TypeScript 使用者理解元件 API 的重要來源。

閱讀 `types/` 時，不只是看有哪些欄位，而是要把它和 runtime source 交叉驗證：

```txt
types/<component>.d.ts
  -> 使用者看得到的 props / events / slots 型別
src/components/<component>/
  -> runtime 實際接收與處理的 props
examples/routers/<component>.vue
  -> 官方展示的主要使用方式
```

如果 type declaration 有某個 prop，但 example 幾乎沒展示，代表它可能是補充能力；如果 example 展示某種寫法，但 type declaration 沒有清楚標示，則可能需要後續補充型別理解或版本差異說明。

此處需要後續補充：各元件的實際 `types/*.d.ts` 欄位表，以及 runtime props 是否與型別宣告完全一致。

### 4.6 對照 style source，理解狀態如何被視覺化

`src/styles/components/<component>.less` 是理解元件狀態的另一半。runtime source 會產生 class，但真正的視覺效果藏在 style source 中。

閱讀 style source 時，可以觀察幾個方向：

1. 元件根 class 是什麼。
2. 是否使用 BEM 或類 BEM 的命名方式。
3. 尺寸、顏色、狀態、禁用、loading、active 等 class 如何命名。
4. group 類元件是否透過父層 class 影響子元件樣式。
5. 是否有主題變數、顏色變數或 mixin。

不要把 `.less` 當成最後才看的附錄。對元件庫來說，runtime 與 style 是共同定義元件行為的兩個面向：runtime 負責決定「現在是什麼狀態」，style 負責決定「這個狀態看起來如何」。

### 4.7 對照 registry 與 plugin install，確認元件是否進入 public surface

`src/components/index.js` 與 `src/index.js` 的閱讀目的，和單一元件 source 不一樣。

`src/components/index.js` 可以幫助你確認元件是否被 public export。也就是說，某個檔案存在於 `src/components/` 不代表它一定是對外公開元件；有些可能只是內部輔助元件。

`src/index.js` 則用來理解 plugin install 流程。元件庫通常會透過 plugin install 把元件全域註冊到 Vue 應用中，也可能在這裡設定全域配置。`$VIEWUI` 全域設定會影響元件，因此閱讀基礎元件時，也要留意元件是否讀取全域設定，例如 prefix、size、transfer、zIndex 或其他全域選項。具體影響項目需要後續對照原始碼確認。

---

## 5. 表格整理

### 5.1 元件原始碼入口表

| 筆記分組                     | Runtime source                                                                                            | Style source                                                                  | Type source                                   | Example                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `Button` / `ButtonGroup` | `src/components/button/button.vue`, `src/components/button/button-group.vue`                              | `src/styles/components/button.less`                                           | `types/button.d.ts`                           | `examples/routers/button.vue`                                     |
| `Icon`                   | `src/components/icon/icon.vue`                                                                            | 由 icon font / class 系統支撐                                                      | `types/icon.d.ts`                             | `examples/routers/icon.vue`                                       |
| `Divider`                | `src/components/divider/divider.vue`                                                                      | `src/styles/components/divider.less`                                          | `types/divider.d.ts`                          | `examples/routers/divider.vue`                                    |
| `Tag`                    | `src/components/tag/tag.vue`                                                                              | `src/styles/components/tag.less`                                              | `types/tag.d.ts`                              | `examples/routers/tag.vue`                                        |
| `Badge`                  | `src/components/badge/badge.vue`                                                                          | `src/styles/components/badge.less`                                            | `types/badge.d.ts`                            | `examples/routers/badge.vue`                                      |
| `Avatar` / `AvatarList`  | `src/components/avatar/avatar.vue`, `src/components/avatar-list/avatar-list.vue`                          | `src/styles/components/avatar.less`, `src/styles/components/avatar-list.less` | `types/avatar.d.ts`, `types/avatar-list.d.ts` | `examples/routers/avatar.vue`, `examples/routers/avatar-list.vue` |
| `Cell` / `CellGroup`     | `src/components/cell/cell.vue`, `src/components/cell/cell-group.vue`, `src/components/cell/cell-item.vue` | `src/styles/components/cell.less`                                             | `types/cell.d.ts`                             | `examples/routers/cell.vue`                                       |

這張表應該作為每篇子筆記的起點。每閱讀一組元件，都不要只打開 runtime source，而是要同時打開 style、type 與 example。尤其是 `Button`、`Tag`、`Badge` 這類具有狀態與事件的元件，只看 `.vue` 很容易忽略 public API 與實際使用方式之間的關係。

### 5.2 元件閱讀重點表

| 元件組                      | 主要問題                 | 第一輪閱讀重點                        | 第二輪深入重點                                   |
| ------------------------ | -------------------- | ------------------------------ | ----------------------------------------- |
| `Icon`                   | 圖標如何被渲染與控制外觀？        | props、class、inline style       | icon font / class 系統如何接入                  |
| `Divider`                | 分隔線如何承載 slot 與結構樣式？  | slot、方向、class 組合               | 不同方向或內容位置的樣式規則                            |
| `Button` / `ButtonGroup` | 操作元件如何整合視覺狀態與互動？     | type、size、shape、loading、事件     | link/navigation mixin、group 對子元件樣式的影響     |
| `Tag`                    | 小型狀態元件如何支援關閉、選取與顏色？  | closable、checkable、color、事件    | 內部狀態與外部控制的邊界                              |
| `Badge`                  | 角標如何附著在內容上展示數值或狀態？   | count、dot、status、slot override | 數值格式、最大值、狀態樣式與 slot 覆寫                    |
| `Avatar` / `AvatarList`  | 頭像如何處理圖片、圖標、文字與列表聚合？ | src、icon、slot fallback         | 圖片失敗處理、列表聚合、Tooltip 關係                    |
| `Cell` / `CellGroup`     | 列表行容器如何拆分結構並傳遞事件？    | Cell、CellItem、CellGroup 分工     | provide/inject、點擊事件、link/navigation mixin |

這張表的用途，是幫助你在閱讀時避免平均用力。不同元件要觀察的問題不同：讀 `Icon` 時不需要期待複雜狀態管理；讀 `Cell` 時則不能只看單一檔案，必須把 group、item、事件傳遞一起看。

### 5.3 來源檔案角色表

| 檔案類型               | 位置                                       | 負責職責               | 閱讀重點                                               |
| ------------------ | ---------------------------------------- | ------------------ | -------------------------------------------------- |
| Runtime source     | `src/components/<component>/`            | 定義元件實際行為           | props、computed、methods、template / render、emit、slot |
| Style source       | `src/styles/components/<component>.less` | 定義元件視覺規格           | BEM class、尺寸、狀態、主題色、結構樣式                           |
| Type declaration   | `types/<component>.d.ts`                 | 定義對外 TypeScript 契約 | props 型別、事件型別、可用元件名稱                               |
| Component registry | `src/components/index.js`                | 統一輸出元件             | 元件是否被 public export                                |
| Plugin install     | `src/index.js`                           | 安裝與全域註冊            | 全域註冊流程、`$VIEWUI` 設定影響                              |
| Examples           | `examples/routers/<component>.vue`       | 展示官方使用方式           | 常見 props、slot 寫法、互動案例                              |

---

## 6. 範例或情境說明

### 6.1 閱讀 `Button` 的建議流程

假設你要開始閱讀 `Button`，不要一開始就鑽進所有條件分支。可以按照以下流程進行。

第一步，先看 `types/button.d.ts`，建立使用者可以傳入哪些 props 的印象。你要先知道 `Button` 對外承諾支援哪些能力，例如操作類型、尺寸、形狀、loading 或 link 相關行為。實際欄位需要後續對照原始碼補充。

第二步，再看 `examples/routers/button.vue`，觀察官方如何展示 `Button`。這一步能幫助你判斷哪些 props 是主要使用場景，哪些只是補充功能。

第三步，回到 `src/components/button/button.vue`，追蹤 props 如何被轉成 class、style、slot 與事件。這時候要特別注意 loading 狀態、click 事件、link/navigation mixin 是否參與行為處理。

第四步，閱讀 `src/components/button/button-group.vue` 與 `src/styles/components/button.less`，觀察 group 如何影響按鈕排列、邊框與圓角等樣式。`ButtonGroup` 不應孤立閱讀，因為它的意義在於改變一組 `Button` 的組合呈現。

最後，回到自己的筆記中整理一張表，把 public props、runtime 行為、class 對應、事件輸出與 example 寫法對齊。這樣才能真正形成可複習的元件閱讀筆記。

### 6.2 閱讀 `Tag` 的建議流程

閱讀 `Tag` 時，可以把它當成「小型狀態元件」來看。

第一步，確認 `Tag` 有哪些狀態能力。它包含 closable、checkable、自定義顏色與事件，因此閱讀時應圍繞這幾個問題：它是否能被關閉？是否能被選取？顏色是預設 enum 還是允許自訂？事件在什麼時機 emit？

第二步，觀察這些狀態如何影響 class 與 style。特別是自定義顏色，通常可能涉及 inline style 或特殊 class 分支。具體實作方式必須以原始碼為準。

第三步，觀察事件與狀態控制邊界。像 closable 或 checkable 這種行為，最值得學的是元件如何決定「自己管理狀態」與「通知外部更新狀態」的分工。

### 6.3 閱讀 `Cell` 的建議流程

`Cell` 不適合只看單一檔案，它包含 `cell.vue`、`cell-group.vue` 與 `cell-item.vue`。

閱讀 `Cell` 時，應先弄清楚三者分工。`Cell` 可能是對外使用的主元件，`CellItem` 可能負責拆分內部結構，`CellGroup` 則可能負責包裹一組 cell 並處理群組層級的行為。實際責任分工需要對照 source code 確認。

接著觀察 provide/inject。`CellGroup` 透過 provide/inject 接收子項點擊事件，這代表它不是單純的樣式容器，而可能承擔父子溝通責任。閱讀時要追蹤：誰 provide？誰 inject？子項 click 後如何回到 group？group 是否再向外 emit？這些問題會幫助你理解 Vue 元件庫中父子協作的常見模式。

---

## 7. 閱讀路線或學習路線

### 7.1 初次閱讀路線

初次閱讀本區時，建議採用「由低狀態到高組合」的順序。

第一階段先讀 `Icon` 與 `Divider`。這一階段的目的，是建立基礎元件閱讀方法。你要熟悉如何從 props 看到 computed class，如何從 slot 看到 template 結構，如何從 style source 驗證畫面規則。

第二階段讀 `Button` / `ButtonGroup`、`Tag`、`Badge`。這一階段的目的，是理解基礎元件如何處理互動狀態。你要開始追蹤事件、狀態切換、loading、closable、checkable、dot、status 與 slot override 等行為。

第三階段讀 `Avatar` / `AvatarList`、`Cell` / `CellGroup`。這一階段的目的，是理解元件組合與邊界設計。你要觀察 fallback、列表聚合、父子元件、provide/inject、事件傳遞與 group 對子元件的影響。

### 7.2 深入閱讀路線

當第一輪閱讀完成後，可以進入第二輪深入閱讀。第二輪不再只是理解每個元件做什麼，而是比較不同元件之間的設計一致性。

第一，可以比較 `Button`、`Tag`、`Badge` 的狀態 class 命名方式是否一致。這能幫助你理解 View UI Plus 在狀態樣式上的設計風格。

第二，可以比較 `ButtonGroup`、`AvatarList`、`CellGroup` 的 group 設計。這三者都是「主元件 + 組合容器」的關係，但它們的父子協作方式可能不同。

第三，可以比較 runtime props 與 `types/*.d.ts` 是否一致。這對元件庫維護很重要，因為型別宣告如果落後於 runtime source，使用者會在 TypeScript 中得到錯誤或不完整的提示。

第四，可以比較 examples 中展示的 API 與 source code 中支援的 API。這能幫助你判斷哪些能力是主要推薦用法，哪些只是相容或補充功能。

### 7.3 可以暫時跳過的部分

初次閱讀時，可以先暫時跳過過細的樣式變數、所有瀏覽器相容細節、完整 icon font 生成流程，以及和大型元件高度耦合的案例。這些內容不是不重要，而是它們會讓初學者在還沒建立元件閱讀主線前，就陷入過多細節。

比較好的策略是先建立「元件契約 -> runtime 行為 -> style 對照 -> type 對照 -> example 驗證」這條主線。等主線穩定後，再回頭補細節。

---

## 8. 常見誤區

| 誤區                                              | 為什麼容易誤解                                        | 正確理解                                                        |
| ----------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| 只看 `.vue` 檔就認為讀完元件                              | runtime source 最直觀，所以容易忽略 style、type 與 example | 元件庫的完整設計必須同時看 runtime、style、type、registry、install 與 example |
| 把基礎元件當成很簡單，不需要深讀                                | `Icon`、`Divider`、`Tag` 等元件看起來畫面簡單              | 基礎元件是元件庫一致性的來源，props、class、slot、event 設計都值得研究               |
| 把 `ButtonGroup`、`AvatarList`、`CellGroup` 拆開孤立閱讀 | group 元件看似只是容器                                 | group 的價值在於父子關係、slot 包裹、樣式繼承與事件傳遞，應與主元件一起讀                  |
| 只背路徑，不理解檔案角色                                    | README 中有大量路徑表，容易變成查表                          | 路徑表應該服務於閱讀流程：先建立 API，再看 runtime，接著對照 style、type 與 example   |
| 看到 props 就直接記 API                               | props 很容易被當成速查表                                | props 是 public contract，要理解它如何影響 class、style、slot、事件與外部使用方式 |
| 忽略 type declaration                             | JavaScript runtime 看起來已經足夠                     | 元件庫面向 TypeScript 使用者時，`types/*.d.ts` 是 public API 的重要一部分    |
| 忽略 example                                      | source code 看起來比 example 更底層                   | example 能反映官方希望使用者怎麼使用元件，是理解主要場景的重要入口                       |
| 在沒有 source code 的情況下推測細節                        | 元件庫模式常見，容易根據經驗腦補                               | 未提供的實作細節只能標註「需要後續補充」，不能假裝已經確認                               |

---

## 9. 本章總結

`07-basic-components/` 的價值，不只是整理 View UI Plus 的幾個小元件，而是提供一個理解元件庫設計風格的入口。基礎元件雖然畫面上不一定複雜，但它們集中呈現了元件庫最重要的設計能力：public props 如何設計、class 與 style 如何計算、slot 如何提供彈性、event 如何向外溝通、mixin 與 shared utility 如何復用、style file 與 type declaration 如何共同定義元件契約。

本區應採用由淺入深的閱讀順序。先從 `Icon`、`Divider` 這類低狀態元件建立基本閱讀方法，再進入 `Button`、`Tag`、`Badge` 這類具有操作與狀態的元件，最後閱讀 `Avatar`、`Cell` 這類具有 fallback、組合與父子關係的元件。

閱讀時要避免只把 README 當成路徑索引。真正有效的源碼閱讀，是把每個元件放回元件庫整體設計中理解：它對外提供什麼 API，它內部如何轉換狀態，它的樣式如何命名，它的型別如何描述，它的 example 如何示範，以及它是否被 registry 與 plugin install 納入 public surface。

這樣整理後，`07-basic-components/README.md` 就不只是「有哪些元件可以讀」，而是一份能引導後續每篇元件筆記的閱讀地圖。

---

## 10. 自我檢查問題

1. 為什麼閱讀 View UI Plus 基礎元件時，不應只看 `src/components/<component>/`，還要對照 style、type 與 example？
2. `props contract -> class / style 計算 -> slot 結構 -> event emit -> mixin / shared utility -> style file -> type declaration` 這條主線中，每一步各自負責什麼？
3. 為什麼建議先讀 `Icon` 與 `Divider`，再讀 `Button`、`Tag`、`Badge`？
4. `ButtonGroup`、`AvatarList`、`CellGroup` 為什麼不建議單獨孤立閱讀？
5. 對一個基礎元件來說，`types/<component>.d.ts` 的價值是什麼？它和 runtime source 有什麼關係？
6. 閱讀 `Tag` 時，為什麼 closable、checkable、自定義顏色與事件輸出是重要觀察點？
7. 閱讀 `Badge` 時，為什麼要同時理解「被包裹內容」與「角標本體」的關係？
8. 閱讀 `Cell` / `CellGroup` 時，provide/inject 可能代表什麼樣的父子溝通模式？
9. 如果 example 中展示的 API 與 type declaration 中看到的 API 不一致，你會如何進一步確認？
10. 在沒有實際 source code 的情況下，哪些內容可以合理說明，哪些內容必須標註「此處需要後續補充」？

---

## 11. 後續延伸方向

這份 README 是 `07-basic-components/` 的總覽筆記，後續可以拆成多篇更細的元件源碼閱讀筆記。

### 11.1 元件個別閱讀筆記

後續可以為每一組元件建立獨立筆記：

1. `Icon` 原始碼閱讀筆記：聚焦 class、inline style、icon font / class 系統。
2. `Divider` 原始碼閱讀筆記：聚焦 slot、方向、文字位置與結構樣式。
3. `Button` / `ButtonGroup` 原始碼閱讀筆記：聚焦 props contract、loading、link 行為、事件與 group 樣式。
4. `Tag` 原始碼閱讀筆記：聚焦 closable、checkable、color、事件與狀態控制。
5. `Badge` 原始碼閱讀筆記：聚焦 count、dot、status、slot override 與角標定位。
6. `Avatar` / `AvatarList` 原始碼閱讀筆記：聚焦 fallback、列表聚合與 Tooltip 關係。
7. `Cell` / `CellGroup` 原始碼閱讀筆記：聚焦 `CellItem`、provide/inject、點擊事件與 link 行為。

### 11.2 橫向主題筆記

除了逐一閱讀元件，也可以整理橫向主題：

1. View UI Plus 基礎元件的 props 設計模式。
2. View UI Plus 的 class 命名與 BEM 風格整理。
3. View UI Plus 的 slot 設計模式。
4. View UI Plus 元件事件 emit 設計整理。
5. View UI Plus type declaration 與 runtime props 對照筆記。
6. View UI Plus group 類元件設計：`ButtonGroup`、`AvatarList`、`CellGroup` 比較。
7. View UI Plus link/navigation mixin 使用位置與設計分析。
8. View UI Plus `$VIEWUI` 全域設定如何影響基礎元件。

### 11.3 待補充清單

由於目前本篇只基於 README 重構，以下內容需要後續閱讀實際 source code 後再補齊：

| 待補充項目                    | 需要對照的檔案                                           | 補充目的                                          |
| ------------------------ | ------------------------------------------------- | --------------------------------------------- |
| 每個元件完整 props 表           | `types/*.d.ts`、`src/components/*/*.vue`           | 確認 public API 與 runtime props 是否一致            |
| 每個元件完整事件表                | `src/components/*/*.vue`、`examples/routers/*.vue` | 確認事件名稱、觸發時機與 payload                          |
| 每個元件 slot 表              | `src/components/*/*.vue`、`examples/routers/*.vue` | 確認 default slot 與 named slot 支援情況             |
| class 命名與樣式狀態表           | `src/styles/components/*.less`                    | 建立 props 到 class / style 的對照                  |
| shared utility / mixin 表 | 需要後續定位實際檔案                                        | 確認 `Button`、`Cell` 等元件如何復用 link/navigation 行為 |
| `$VIEWUI` 影響範圍           | `src/index.js`、各元件 runtime source                 | 確認全域設定如何影響基礎元件                                |
