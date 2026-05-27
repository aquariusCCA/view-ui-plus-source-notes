# 表單與輸入類元件總覽

## 學習目標

這篇建立 `10-form-and-input-components` 的閱讀方法。表單輸入元件的核心不是渲染一個控制項，而是把使用者輸入轉成可驗證、可同步、可提交的資料。

讀完後，要能用同一套流程分析 Form、Input、Select、Checkbox、Radio、DatePicker、Upload 這類元件，並分辨它們各自處理的是欄位驗證、文字輸入、選項選擇、布林切換、日期時間、階層選擇，還是檔案上傳。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/components/form/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/input-number/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/select/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/date-picker/`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/upload/`
- `01-origin/source/view-ui-plus-v1.3.20/types/`
- `01-origin/source/view-ui-plus-v1.3.20/src/styles/components/`

## 元件分類

| 類型 | 代表元件 | 閱讀重點 |
| --- | --- | --- |
| 表單容器 | `Form`、`FormItem` | 欄位註冊、rules、驗證狀態、reset |
| 文字與數字輸入 | `Input`、`InputNumber` | current value、輸入事件、clear、focus、formatter |
| 選項選擇 | `Select`、`AutoComplete`、`TagSelect` | option 註冊、filter、remote、多選 tag |
| 布林與群組選擇 | `Checkbox`、`Radio`、`Switch` | group 注入、label/value、true/false value |
| 日期時間 | `DatePicker`、`TimePicker`、`Calendar` | parser、formatter、panel、range、confirm |
| 視覺化輸入 | `Slider`、`Rate`、`ColorPicker` | 拖曳、hover、顏色模型、視覺狀態 |
| 複合選擇 | `Cascader`、`TreeSelect`、`Transfer` | 階層資料、左右資料、filter、選中集合 |
| 檔案輸入 | `Upload` | 原生 file input、before hook、XHR、fileList |

這些元件的共同特徵是：對外都有一個「值」，內部通常還有一份為了顯示、互動或驗證而存在的 mirror state。

## 閱讀順序

建議每組元件都按照這個順序讀：

1. 看 `index.js`，確認主元件導出與子元件掛載方式。
2. 找 `modelValue`、`value`、`currentValue`、`values` 或 `fileList`，先畫出值狀態。
3. 找 `update:modelValue`、`on-change`、`on-input`、`on-clear` 等事件。
4. 看是否注入 `FormItemInstance`，確認何時觸發 blur/change 驗證。
5. 若有子元件，追 provide/inject、註冊、移除與選中同步。
6. 若有浮層或拖曳，追 click outside、keyboard、mousemove、scroll 與 cleanup。
7. 看 `.d.ts`，核對 runtime API、事件 payload 和 slots 是否一致。
8. 看 less，確認 disabled、focused、error、selected、checked、uploading 等狀態 class。

## 值流模型

表單輸入元件可以先畫成：

```txt
使用者操作 / 外部 modelValue
  -> 內部 current state
  -> 顯示文字、選中項、panel 或 fileList
  -> update:modelValue / on-change
  -> FormItem validate trigger
```

`FormItem` 位在最後一段，它不直接知道每個輸入元件如何互動，只接收欄位值變化後的驗證觸發。

## 和其他章節的關係

- 父子通訊可回看 `05-shared-logic/04-component-tree-communication.md`。
- Props、Events、Slots、`.d.ts` 的判讀方法放在 `06-public-api-and-type-system/`。
- Button、Icon、Tag、Badge 等基礎元件可回看 `07-basic-components/`。
- Dropdown、Tooltip、Poptip 的浮層行為可在 `12-feedback-and-overlays/` 交叉整理。
- Tree 本體是資料展示元件；TreeSelect 是表單選擇器，因此放在本章交叉分析。

## 設計啟發

表單元件 API 的核心是穩定管理「值」和「值的合法性」。例如：

- `Form` 把所有欄位驗證收斂成 `validate`、`validateField`、`resetFields`。
- `Input` 把原生 input/textarea、clear、search、prefix/suffix 整合成一個輸入 API。
- `Select` 把 option instance、顯示 label、實際 value、filter query 和 remote loading 分開管理。
- `DatePicker` 把 `Date`、字串、range array 和面板選擇過程分層處理。
- `Upload` 把原生 `File` 包裝成帶有 `uid`、`status`、`percentage` 的檔案狀態。

讀表單輸入元件時，重點是分清楚：

```txt
提交值是什麼
顯示值是什麼
暫存互動值是什麼
什麼時候通知外部
什麼時候觸發表單驗證
```

## 複習題

1. 表單輸入元件和導航元件最重要的狀態差異是什麼？
2. 為什麼輸入元件常需要 `currentValue` 這類 mirror state？
3. `update:modelValue` 和 `on-change` 分別服務什麼場景？
4. 哪些元件需要子項註冊？註冊資料通常包含哪些欄位？
5. 為什麼表單驗證不應直接綁死在某一種原生 DOM 事件上？
