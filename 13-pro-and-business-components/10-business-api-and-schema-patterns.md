# 業務元件 API 與 Schema 模式

## 學習目標

這篇整理業務元件常見 API 設計：schema、泛型、slot、event、permission、service adapter、transform。目標是讓 SearchForm、CrudTable、BusinessModal 這類封裝在彈性和可維護性之間取得平衡。

## 三種配置方式

| 方式 | 適合場景 | 風險 |
| --- | --- | --- |
| props | 小量固定配置 | props 膨脹 |
| schema | 多欄位、可配置、可迭代 | 過度抽象，型別複雜 |
| slots/render | 高度自訂內容 | 使用者要寫更多模板 |

業務元件通常需要三者並存。schema 決定大部分重複結構，slot 用來覆蓋特殊欄位。

## Schema 欄位

一個可維護的業務 schema 至少要分清楚：

```txt
key: 資料欄位
label: 顯示文字
component: 使用哪個基礎元件
props: 傳給基礎元件的 props
rules: 表單驗證
options: 選項資料
defaultValue: 初始值
visible/disabled: 狀態控制
transform: 輸出轉換
slot: 自訂渲染入口
permission: 權限控制
```

不要讓 schema 同時承載後端 response、表單狀態、顯示設定和操作邏輯，否則會變成難以測試的大物件。

## Event Payload

業務元件事件應回傳足夠上下文：

| 事件 | payload 建議 |
| --- | --- |
| `search` | transformed query、raw values |
| `reset` | reset values |
| `row-action` | action key、row、index |
| `batch-action` | action key、selected rows、selected keys |
| `submit` | mode、values、raw values、current row |
| `success` | mode、response、submitted values |

不要只 emit `click` 或 `change`。業務事件通常需要可直接驅動 service 的資料。

## Permission API

常見權限設計：

```ts
type Permission =
  | boolean
  | string
  | string[]
  | ((context: unknown) => boolean)
```

權限可以出現在欄位、按鈕、行操作、批量操作、彈窗模式上。設計時要決定無權限時是 hidden、disabled、prevent，還是顯示 fallback。

## Service Adapter

通用業務元件不應直接綁定公司 API response。可以用 adapter 隔開：

```ts
type ListAdapter<T> = {
  request: (params: Record<string, unknown>) => Promise<unknown>
  getData: (response: unknown) => T[]
  getTotal: (response: unknown) => number
}
```

這樣元件只知道它需要 `data` 和 `total`，不需要知道 response 是 `{ data: { list, total } }` 還是其他格式。

## 複習題

1. schema 型元件最大的好處和最大風險分別是什麼？
2. 哪些配置適合放 props，哪些適合放 schema？
3. event payload 為什麼應該包含 raw values 和 transformed values？
4. 權限失敗時 hidden、disabled、prevent 的使用情境有何不同？
5. service adapter 可以如何降低元件和後端 response 的耦合？
