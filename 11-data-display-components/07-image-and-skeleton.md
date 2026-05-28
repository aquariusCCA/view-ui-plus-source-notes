# Image 與 Skeleton

## 學習目標

這篇分析 `Image`、`ImagePreview`、`Skeleton`、`SkeletonItem`。重點是圖片載入、錯誤、懶載入、預覽，以及資料載入前後如何用骨架屏維持版面穩定。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/image.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/image/image-preview.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/skeleton/skeleton.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/skeleton/skeleton-item.vue`
- `01-origin/source/view-ui-plus-v1.3.20/types/image.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/skeleton.d.ts`

## Image 狀態

Image 把圖片生命週期拆成幾個狀態：

| 狀態 | 用途 |
| --- | --- |
| `loadingImage` | 是否渲染 img DOM |
| `loading` | 是否顯示 placeholder |
| `imageError` | 是否顯示 error |
| `imagePreviewModal` | 是否開啟預覽浮層 |
| `observer` | lazy 模式下的 IntersectionObserver |

這些狀態不能混成一個 `status`，因為 img DOM 是否存在、placeholder 是否顯示、錯誤區塊是否顯示、preview modal 是否顯示，是四個不同層級的事情。

## Image props

| prop | 用途 |
| --- | --- |
| `src`、`alt` | 原生圖片資料 |
| `width`、`height` | 外層尺寸 |
| `fit` | 對應 `object-fit` |
| `lazy` | 是否懶載入 |
| `scrollContainer` | IntersectionObserver root selector |
| `preview` | 是否可點擊預覽 |
| `previewList`、`initialIndex` | 預覽資料與初始索引 |
| `infinite`、`maskClosable`、`toolbar` | 預覽浮層行為 |
| `transfer` | 預覽浮層是否移到 body |
| `renameImage` | 下載或展示時的圖片命名擴展 |

`fit` 只接受瀏覽器支援的 object-fit 值，最後轉成 inline style。

## 載入、錯誤與事件

流程可以畫成：

```txt
mounted / src changed
  -> handleImageEvent()
  -> lazy ? add observer : loadImage()
  -> img load/error
  -> on-load / on-error
```

事件：

| 事件 | 時機 |
| --- | --- |
| `on-load` | img load 成功 |
| `on-error` | img load 失敗 |
| `on-click` | preview 模式下點擊圖片 |
| `on-close` | preview 關閉 |
| `on-switch` | preview 切換圖片 |

slot：

| slot | 用途 |
| --- | --- |
| `placeholder` | 自訂載入中 |
| `error` | 自訂載入失敗 |
| `preview` | 自訂預覽遮罩 |

## Lazy loading

`lazy` 開啟後，元件使用 `IntersectionObserver`：

```txt
observe image wrapper
  -> entry.isIntersecting
  -> disconnect observer
  -> loadImage()
```

beforeUnmount 會呼叫 `offObserver()`，避免 observer 持續持有 DOM。

對照型別時要注意：runtime 的 `scrollContainer` prop type 只宣告 `String`，但程式內部有 `isElement(scrollContainer)` 判斷，型別檔則寫 `string | HTMLElement`。這是 runtime prop、內部邏輯和型別三者不完全一致的案例。

## Skeleton

Skeleton 的核心語意是：

```txt
loading=true  -> 渲染骨架屏
loading=false -> 渲染 default slot 真實內容
```

這和 Spin 不同。Spin 是覆蓋在內容上方，Skeleton 是在載入前用替代 DOM 保持版面節奏。

## Skeleton props

| prop | 用途 |
| --- | --- |
| `animated` | 是否顯示動畫 |
| `loading` | 是否顯示骨架 |
| `round` | paragraph 是否圓角 |
| `paragraph` | 行數與每行寬度 |
| `title` | 是否顯示標題佔位與標題寬度 |
| `avatar` | 是否顯示頭像佔位、形狀與尺寸 |

`paragraph`、`title`、`avatar` 都支援 boolean、number 或 object 形式，這讓簡單場景可以用短 API，複雜場景可以精準控制佔位形狀。

## SkeletonItem

SkeletonItem 是更底層的佔位塊：

| prop | 用途 |
| --- | --- |
| `type` | `circle`、`square`、`rect`、`image` |
| `size` | `small`、`large`、`default` |
| `width`、`height` | rect/image 尺寸 |
| `block` | 是否獨占一行 |
| `imgSrc` | image 類型背景圖 |

SkeletonItem 會 inject `SkeletonInstance`，繼承父層的 `animated` 和 `round`。這是小型父子協作：父層控制整體骨架語氣，子項仍能獨立定義形狀。

## Runtime 與型別對照

| 項目 | 觀察 |
| --- | --- |
| `Image.scrollContainer` | runtime prop type 是 String，內部和型別都暗示 HTMLElement 也可能被支援 |
| `Image.renameImage` | runtime 有 prop，`types/image.d.ts` 未列出 |
| `Skeleton` template slot | runtime 和型別都有 `template` |
| `SkeletonItem.imgSrc` | runtime 使用 `imgSrc` prop，型別以 kebab-case `img-src` 對外描述 |

## 設計啟發

Image 和 Skeleton 都是在解決「資料尚未穩定」時的展示問題：

```txt
Image: 媒體資源可能還沒載入、可能失敗、可能需要預覽
Skeleton: 業務資料可能還沒回來，但版面要先穩住
```

仿寫時要把狀態拆清楚，不要讓 loading、error、empty、preview 共用同一個布林值。

## 複習題

1. Image 為什麼需要同時有 `loadingImage`、`loading` 和 `imageError`？
2. lazy 模式為什麼要在圖片進入視窗後斷開 observer？
3. Skeleton 和 Spin 的 loading 語意有什麼差異？
4. SkeletonItem 如何從 Skeleton 繼承 animated 和 round？
5. Image 的 runtime prop、內部邏輯與型別在哪裡不一致？
