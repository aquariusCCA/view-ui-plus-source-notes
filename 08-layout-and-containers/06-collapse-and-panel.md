# Collapse 與 Panel 折疊容器

## 學習目標

這篇分析 `Collapse` 與 `Panel`。它們是一組典型的父子狀態容器：父層管理目前展開的 key，子層負責顯示 header、content 和 transition，點擊子層時再回呼父層更新狀態。

讀完後，要能說明 active key 如何被正規化、`accordion` 如何改變切換邏輯，以及沒有傳 `name` 的 `Panel` 如何用內部 index 作為 fallback。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/collapse.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/panel.vue`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/collapse/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/collapse.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/collapse.less`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/base/collapse-transition.vue`

## 結構定位

`Collapse` 是狀態容器，`Panel` 是可展開項目。

核心資料流是：

```txt
Collapse modelValue
  -> currentValue
  -> provide CollapseInstance
  -> Panel isActive 讀 CollapseInstance.getActiveKey()
  -> Panel click toggle()
  -> CollapseInstance.toggle()
  -> emit update:modelValue / on-change
```

這裡的父子關係不是傳樣式設定，而是傳狀態查詢和狀態更新方法。

## Collapse 的 API

`Collapse` 的 props：

| Prop | 說明 |
| --- | --- |
| `modelValue` | 目前展開的 panel name，可用 `v-model` |
| `accordion` | 是否手風琴模式，每次最多展開一個 |
| `simple` | 是否使用簡潔樣式 |

事件：

| Event | 說明 |
| --- | --- |
| `update:modelValue` | 更新外部 `v-model` |
| `on-change` | 切換面板後回傳目前展開 key 陣列 |

`simple` 只影響 class：

```txt
simple -> ivu-collapse-simple
```

## active key 正規化

`getActiveKey()` 是理解 `Collapse` 的核心。它會把 `currentValue` 轉成穩定格式：

```txt
currentValue || []
  -> 若不是陣列，包成陣列
  -> 若 accordion 且長度大於 1，只保留第一個
  -> 每個 key 轉成字串
```

最後 `Panel` 判斷 active 時，一律用字串比較：

```txt
activeKey.indexOf(name) > -1
```

這能避免 `1` 和 `'1'` 在比較時造成不一致，也讓 `modelValue` 傳字串或陣列時可以共用同一套判斷。

## toggle 邏輯

`Collapse.toggle(data)` 接收：

| 欄位 | 說明 |
| --- | --- |
| `name` | 被點擊的 panel key |
| `isActive` | 點擊前是否已展開 |

手風琴模式：

```txt
accordion = true
  -> 若目前未展開，newActiveKey = [name]
  -> 若目前已展開，newActiveKey = []
```

一般模式：

```txt
accordion = false
  -> 若目前已展開，從 activeKey 移除 name
  -> 若目前未展開，把 name 加入 activeKey
```

更新後會同步：

```txt
currentValue = newActiveKey
emit update:modelValue(newActiveKey)
emit on-change(newActiveKey)
```

注意 `on-change` 回傳的是陣列，即使手風琴模式也是陣列。

## Panel 的 name 與 index

`Panel` 的 props：

| Prop | 說明 |
| --- | --- |
| `name` | 面板 key |
| `hideArrow` | 是否隱藏箭頭 |

如果沒有傳 `name`，`Panel` 會使用內部 `index`：

```txt
mounted
  -> index = CollapseInstance.panelCount + 1
  -> CollapseInstance.panelCount = index
```

這是 Vue 3 下的替代方案。原始碼註解指出父元件不能直接遍歷子元件實例，所以用 `panelCount` 讓每個 `Panel` 自己註冊順序。

這種做法適合靜態面板。若面板大量動態新增、移除或重排，最好由使用者明確提供穩定 `name`。

## Panel 的模板與 transition

`Panel` 分成 header 和 content：

| 區域 | 來源 |
| --- | --- |
| header | default slot，前方可顯示箭頭 Icon |
| content | `content` slot，包在 `collapse-transition` 中 |

`mounted` 狀態用來控制 transition 是否渲染：

```txt
mounted = false
mounted 後 -> true
v-if="mounted" 才渲染 collapse-transition
```

這避免初始渲染時 transition 狀態干擾內容顯示。

## Runtime 與 Type 對照

`types/collapse.d.ts` 宣告 `Collapse` 和 `Panel`。幾個值得注意的點：

| 項目 | runtime | type |
| --- | --- | --- |
| `modelValue` | `Array` 或 `String` | `'model-value'?: any[]` |
| `name` | `String` | `string` |
| `hideArrow` | camelCase | `'hide-arrow'` |
| `on-change` | emit 名稱 | 型別中是 `onOnChange` |
| `content` slot | 內容插槽 | 型別有宣告 |

runtime 允許 `modelValue` 是字串，但型別只寫陣列，這是本元件最明顯的型別漂移點。

## 設計啟發

`Collapse` / `Panel` 展示了狀態容器的幾個核心設計：

- 外部用 `v-model` 控制狀態。
- 內部把狀態正規化成穩定格式。
- 子元件不自己改 active 陣列，而是呼叫父層方法。
- 沒有使用者 key 時提供 index fallback。
- 展開內容用 transition 包裝，但不把 transition 細節暴露成使用者 API。

仿寫這類元件時，最重要的是先定義「外部狀態格式」與「內部比較格式」，避免切換邏輯散落在每個子元件。

## 複習題

1. `getActiveKey()` 為什麼要把 key 全部轉成字串？
2. `accordion` 模式下，點擊已展開的 panel 會產生什麼結果？
3. `Panel` 沒有傳 `name` 時如何取得 fallback key？
4. `Panel` 為什麼透過 `CollapseInstance.toggle()` 更新狀態，而不是自己 emit 給外部？
5. `types/collapse.d.ts` 和 runtime 在 `modelValue` 上有什麼差異？
