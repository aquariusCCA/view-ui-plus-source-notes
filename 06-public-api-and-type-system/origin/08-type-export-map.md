# 型別導出地圖

## 學習目標

這篇分析 View UI Plus 的型別出口。重點是理解 `types/index.d.ts`、`types/viewuiplus.components.d.ts` 與單一元件 d.ts 如何組成使用者側的公開型別入口。

## 源碼位置

主要閱讀：

- `01-origin/source/view-ui-plus-v1.3.20/package.json`
- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/src/components/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`

## 入口鏈路

型別入口大致是：

```txt
package.json typings
  -> types/index.d.ts
  -> types/viewuiplus.components.d.ts
  -> types/button.d.ts
  -> export declare const Button
```

runtime 入口大致是：

```txt
src/index.js
  -> src/components/index.js
  -> src/components/button/index.js
  -> src/components/button/button.vue
```

這兩條鏈路要互相對齊。runtime 匯出了某個元件，type 也要匯出對應宣告；type 匯出的名稱如果 runtime 不存在，使用者匯入時也會出問題。

## `types/index.d.ts`

`types/index.d.ts` 有三個責任：

1. 匯出所有元件型別。
2. 宣告 install 函數。
3. 擴充 Vue component instance 的全域屬性。

它不是單純元件列表，而是整個套件型別系統的總入口。

## `viewuiplus.components.d.ts`

這個檔案集中做元件 re-export：

```ts
export { Button, ButtonGroup } from './button'
export { Modal, ModalInstance } from './modal'
export { Table, TableColumnConfig } from './table'
```

它對應 runtime 的 `src/components/index.js`。這種集中出口讓使用者可以：

```ts
import { Button, Table } from 'view-ui-plus';
```

而不是依賴內部路徑：

```ts
import Button from 'view-ui-plus/src/components/button';
```

對元件庫來說，穩定入口比內部檔案位置更重要。

## 輔助型別的導出

除了元件本身，有些檔案也導出輔助型別或配置型別，例如：

- `TableColumnConfig`
- `MessageConfig`
- `NoticeConfig`
- `LoadingBarConfig`
- `CopyConfig`
- `EditConfig`
- `EllipsisConfig`

這些型別讓使用者在業務程式中可以標註配置物件，而不只是在模板中使用元件。

## 新增元件時的同步點

新增一個元件時，至少要同步：

| 層級 | 要做的事 |
| --- | --- |
| runtime 實作 | 新增 `src/components/x/x.vue` |
| runtime 單一入口 | 新增或更新 `src/components/x/index.js` |
| runtime 集中入口 | 更新 `src/components/index.js` |
| type 單一宣告 | 新增 `types/x.d.ts` |
| type 集中入口 | 更新 `types/viewuiplus.components.d.ts` |
| plugin 安裝 | 確認完整安裝會註冊元件 |

漏掉任一層，都可能造成「能用但不能匯入」、「能匯入但沒有型別」、「有型別但 runtime 不存在」。

## 設計啟發

元件庫的公開型別出口要避免讓使用者知道內部資料夾結構。真正穩定的是套件入口匯出的名稱，而不是某個 `.vue` 檔案的位置。

越是大型元件庫，越需要把 runtime export map 和 type export map 當成同一份公開 API 維護。

## 檢查問題

1. `types/index.d.ts` 除了匯出元件，還負責什麼？
2. `viewuiplus.components.d.ts` 對應 runtime 的哪個檔案？
3. 為什麼使用者不應該依賴 `src/components/button/button.vue` 這類內部路徑？
4. 新增元件時，如果只更新 runtime 入口但忘了 d.ts，會發生什麼？
5. `TableColumnConfig` 這類輔助型別為什麼也屬於公開 API？
