# Avatar / AvatarList Source Map：閱讀入口與責任分工

## 0. 原始筆記問題分析

原本 `README.md` 已經列出 `avatar.vue`、`avatar-list.vue`、樣式、型別與 example，但還沒有把兩個元件之間的責任關係說清楚。

對 `Avatar` / `AvatarList` 來說，只列路徑不夠，因為它們的行為分成兩層：

1. `Avatar` 負責單一頭像的內容選擇、尺寸樣式、圖片錯誤事件與文字縮放。
2. `AvatarList` 負責多個頭像的資料展開、Tooltip 包裹、超出數量提示與列表重疊樣式。

這組元件還有一個重要閱讀點：`.d.ts` 不是完全可信的行為來源。`Avatar` 的 `size` runtime 支援數字尺寸，但型別只寫預設字串；`AvatarList` 的 `.d.ts` 更像是複製了 `Avatar` 的部分 props，漏掉多個 runtime props。

## 1. 本章定位

本章是一篇 source map 筆記。它不逐一分析每個 computed，也不深入展開所有 CSS selector，而是先建立完整閱讀地圖。

讀完後，應該能回答：

1. `Avatar` / `AvatarList` 的 runtime、style、type、example、registry 分別在哪裡。
2. 單一頭像行為由哪些檔案負責，列表聚合行為由哪些檔案負責。
3. 哪些 consumer 會直接組合 `Avatar`。
4. 為什麼閱讀這組元件時要特別對照 runtime source 與 type declaration。

## 2. Source Baseline

本章以本地保存的 View UI Plus `v1.3.20` 原始碼為準。

| 類型 | 路徑 | 角色 |
| --- | --- | --- |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/avatar.vue` | 定義 `Avatar` props、template branch、computed class/style、圖片錯誤事件與文字縮放。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar/index.js` | 匯出 `avatar.vue` 作為單元件入口。 |
| Runtime | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/avatar-list.vue` | 定義 `AvatarList` props、`currentList`、Tooltip 包裹、extra / excess slot。 |
| Runtime entry | `01-origin/source/view-ui-plus-v1.3.20/src/components/avatar-list/index.js` | 匯出 `avatar-list.vue` 作為單元件入口。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar.less` | 定義 `ivu-avatar`、形狀、尺寸、圖片、icon 與 slot 文字容器樣式。 |
| Component style | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/avatar-list.less` | 定義 `ivu-avatar-list`、重疊間距、白色邊框、excess 游標與大尺寸字體。 |
| Style entry | `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/index.less` | 透過 `@import "avatar";` 與 `@import "avatar-list";` 納入元件樣式集合。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar.d.ts` | 描述 `Avatar` 的 TypeScript public contract。 |
| Type declaration | `01-origin/source/view-ui-plus-v1.3.20/types/avatar-list.d.ts` | 描述 `AvatarList` typed contract，但和 runtime props 有明顯落差。 |
| Type export entry | `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts` | 透過 `export { Avatar }` 與 `export { AvatarList }` 匯出型別。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar.vue` | 展示單一頭像的 icon、文字、圖片、Badge 組合、錯誤處理與數字尺寸。 |
| Example | `01-origin/source/view-ui-plus-v1.3.20/examples/routers/avatar-list.vue` | 展示 `list`、`max` 與 `excessStyle` 的列表場景。 |
| Component registry | `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js` | 對外匯出 `Avatar` 與 `AvatarList`。 |
| Plugin install | `01-origin/source/view-ui-plus-v1.3.20/src/index.js` | 匯入整個 `components` map，並用 `app.component(key, ViewUI[key])` 間接註冊。 |

## 3. `Avatar` Runtime 責任分工

`avatar.vue` 是單一頭像的主要行為入口。它負責四件事。

第一，宣告 public props：

```txt
shape / size / src / icon / customIcon
```

第二，決定內容 branch：

```vue
<img v-if="src">
<Icon v-else-if="icon || customIcon">
<span v-else><slot></slot></span>
```

這表示 `src`、`icon/customIcon`、default slot 不是互相疊加，而是互斥分支。只要 `src` 有值，就會渲染圖片；只要沒有 `src` 但有 icon 類輸入，就會渲染 `Icon`；只有前兩者都沒有時，才會使用 default slot。

第三，把 props 轉成 class 與 style：

| Computed | 責任 |
| --- | --- |
| `classes` | 產生 `ivu-avatar`、形狀 class、圖片 / icon 狀態 class 與預設尺寸 class。 |
| `styles` | 當 `size` 不是 `small`、`large`、`default` 時，寫入 width、height、lineHeight、fontSize。 |
| `childrenStyle` | slot 文字顯示時，根據 `scale` 與 `childrenWidth` 寫入 transform 與置中位置。 |

第四，處理 DOM measurement 與事件：

| 區塊 | 責任 |
| --- | --- |
| `setScale()` | 讀取 slot 文字寬度與 avatar 寬度，必要時縮放文字。 |
| `handleError()` | 在圖片載入失敗時 emit `on-error`。 |
| `mounted()` / `updated()` / `size` watcher | 在掛載、更新或尺寸變更時重新計算文字縮放。 |

## 4. `AvatarList` Runtime 責任分工

`avatar-list.vue` 是列表聚合入口。它不接收任意 child slot 來讓使用者自己排版，而是根據 `list` 主動產生子 `Avatar`。

它負責三件事。

第一，宣告列表與展示控制 props：

```txt
list / shape / size / excessStyle / max / tooltip / placement / transfer
```

第二，根據 `currentList` 渲染列表項：

```txt
currentList
  -> v-for avatar-list-item
  -> if tooltip && item.tip: Tooltip wraps Avatar
  -> else: Avatar directly
```

每個列表項只會把 `item.src` 傳給子 `Avatar`，並把 `AvatarList` 自己的 `size`、`shape` 傳下去。`item.tip` 只用在 `Tooltip`。

第三，渲染額外頭像：

```txt
有 #extra
  -> 顯示 extra avatar
else if list.length > max
  -> 顯示 excess avatar，預設內容為 +N
```

`extra` 的優先序高於 `excess`，而且不依賴是否真的超出 `max`。

## 5. Style 責任分工

`avatar.less` 負責單一頭像的基礎視覺。

| Less 區塊 | 責任 |
| --- | --- |
| `.ivu-avatar` | inline-block、置中、背景色、文字色、nowrap、relative、hidden、vertical-align。 |
| `.ivu-avatar-image` | 圖片模式背景改成 transparent。 |
| `.ivu-avatar .ivu-icon` | 微調 icon 垂直位置。 |
| `.avatar-size(...)` | 產生寬高、line-height、圓形 border-radius 與 icon font-size。 |
| `.ivu-avatar-large` / `.ivu-avatar-small` | 套用預設大 / 小尺寸。 |
| `.ivu-avatar-square` | 將預設圓形改成小圓角方形。 |
| `.ivu-avatar > img` | 圖片寬高填滿頭像容器。 |

`avatar-list.less` 負責列表聚合視覺。

| Less 區塊 | 責任 |
| --- | --- |
| `.ivu-avatar-list` | inline-block 根容器。 |
| `.ivu-avatar-list-item` | inline-block 列表項、負 margin 重疊、pointer cursor。 |
| `.ivu-avatar-list-item:first-child` | 第一個頭像不做負 margin。 |
| `.ivu-avatar-list-item .ivu-avatar` | 每個頭像加白色邊框，讓重疊時有分隔感。 |
| `.ivu-avatar-list-item-excess` | 額外頭像游標改成 auto。 |
| `.ivu-avatar-list-large` / `.ivu-avatar-list-default` | 調整不同尺寸下的重疊距離。 |

## 6. Type 與 Public Export

`types/avatar.d.ts` 描述 `Avatar` 的 `shape`、`size`、`src`、`icon`、`custom-icon` 與 `onOnError`。

這裡要注意一個落差：runtime 的 `size` 是 `String | Number`，官方 example 也展示了 `size="64"` 與 `size="42"`，但 `.d.ts` 只寫：

```txt
size?: 'large' | 'small' | 'default'
```

`types/avatar-list.d.ts` 的落差更大。runtime props 包含 `list`、`max`、`excessStyle`、`tooltip`、`placement`、`transfer`，但 `.d.ts` 沒有描述這些 props，反而保留了 `src`、`icon`、`custom-icon` 這些 `AvatarList` runtime 不接收的 props。

runtime public export 在 `src/components/index.js`：

```js
export { default as Avatar } from './avatar';
export { default as AvatarList } from './avatar-list';
```

typed public export 在 `types/viewuiplus.components.d.ts`：

```ts
export { Avatar } from './avatar'
export { AvatarList } from './avatar-list'
```

全域安裝則在 `src/index.js` 透過整個 component map 間接完成。

## 7. Consumer 的閱讀價值

除了官方 example，還可以看兩個直接 consumer。

| Consumer | 位置 | 閱讀價值 |
| --- | --- | --- |
| `NotificationItem` | `src/components/notification/notification-item.vue` | 依照 `icon`、`customIcon`、`avatar` 選擇不同 `Avatar` 輸入，並傳入 `shape`、`size`、style。 |
| `ListItemMeta` | `src/components/list/list-item-meta.vue` | 在列表元資料中用 `Avatar :src="avatar"` 作為 default avatar slot 的預設內容。 |

這些 consumer 可以驗證一件事：`Avatar` 在其他元件中常被當成可替換的展示原子，外部元件負責決定它應該顯示圖片、icon 還是 slot。

## 8. 建議閱讀順序

第一次閱讀時，建議按照以下順序。

1. 先讀 `types/avatar.d.ts` 與 `examples/routers/avatar.vue`，建立單一頭像 API 印象。
2. 回到 `avatar.vue`，先看 template branch，再看 `classes`、`styles`、`setScale()` 與 `handleError()`。
3. 讀 `avatar.less`，對照 shape、size、image、icon 與 square 樣式。
4. 讀 `avatar-list.vue`，確認 `currentList`、Tooltip 包裹與 `extra` / `excess` slot。
5. 讀 `avatar-list.less`，理解列表重疊與尺寸差異。
6. 最後讀 `.d.ts`、registry、install 與 consumer，確認 public export 與型別落差。

## 9. 本章總結

`Avatar` / `AvatarList` 的完整行為由 runtime、style、type、example 與 consumer 共同成立。`Avatar` 的重點是內容優先序、尺寸樣式與文字測量；`AvatarList` 的重點是資料展開、Tooltip 包裹與額外頭像規則。

這組元件很適合用來學習「基礎展示元件如何從單一原子延伸到列表聚合」，以及「為什麼閱讀元件庫不能只看 `.d.ts`」。

## 10. 自我檢查問題

1. `Avatar` 與 `AvatarList` 的單元件入口分別是哪個檔案？
2. `Avatar` 的內容 branch 優先序是什麼？
3. `AvatarList` 的 `Tooltip` 由哪個條件決定是否出現？
4. 為什麼 `types/avatar-list.d.ts` 不能當成 `AvatarList` runtime contract 的唯一來源？
5. 哪兩個 consumer 可以用來觀察 `Avatar` 如何被其他元件組合？
