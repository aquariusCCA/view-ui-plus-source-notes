# 插件型別系統

## 學習目標

這篇分析 View UI Plus 的 TypeScript 宣告如何補上插件 runtime 行為。重點是理解：把東西掛到 `app.config.globalProperties` 只是 runtime 可用，TypeScript 仍需要型別宣告才能知道 `this.$Message`、`this.$VIEWUI` 存在。

## 對照源碼

- `01-origin/source/view-ui-plus-v1.3.20/src/index.js`
- `01-origin/source/view-ui-plus-v1.3.20/types/index.d.ts`
- `01-origin/source/view-ui-plus-v1.3.20/types/viewuiplus.components.d.ts`

## runtime 與 type 的對齊

runtime 端在 `install` 中寫入：

```js
app.config.globalProperties.$VIEWUI = { ... };
app.config.globalProperties.$Message = components.Message;
app.config.globalProperties.$Modal = components.Modal;
app.config.globalProperties.$Date = dayjs;
```

TypeScript 端則在 `types/index.d.ts` 擴充 Vue 的元件實例型別：

```ts
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: ViewUIPlusGlobalOptions;
        $Spin: any;
        $Loading: any;
        $Message: any;
        $Notice: any;
        $Modal: any;
        $ImagePreview: any;
        $Copy: any;
        $ScrollIntoView: any;
        $ScrollTop: any;
        $Date: any;
    }
}
```

這段宣告的作用是告訴 TypeScript：Vue 元件實例上的 `this` 會有這些屬性。

## 安裝選項型別

型別檔先定義全域設定：

```ts
interface ViewUIPlusGlobalOptions {
    size?: string;
    transfer?: boolean | string;
    modal?: {
        maskClosable: boolean | string;
    };
    // ...
}
```

再定義安裝選項：

```ts
interface ViewUIPlusInstallOptions extends ViewUIPlusGlobalOptions {
    locale?: any;
    i18n?: any;
}
```

最後宣告 `install`：

```ts
export const install: (app: App, options?: ViewUIPlusInstallOptions) => void;
```

這讓 `app.use(ViewUIPlus, opts)` 的 `opts` 至少有基本型別約束。

## 元件型別匯出

`types/index.d.ts` 也做了：

```ts
export * from './viewuiplus.components';
```

這對應 runtime 的：

```js
export * from './components';
```

也就是說：

- runtime 匯出真正的元件物件。
- type 匯出這些元件的 TypeScript 宣告。

完整的元件庫需要兩邊都存在，開發者在 IDE 裡才會得到正確提示。

## 為什麼不能只靠 runtime

JavaScript 執行時可以接受：

```js
this.$Message.success('Saved');
```

但 TypeScript 編譯時看不到 `install` 實際跑過，也不知道 `$Message` 被掛上去了。沒有 `ComponentCustomProperties` 擴充時，常見錯誤會是：

```txt
Property '$Message' does not exist on type ...
```

所以插件作者要同時處理：

- runtime：把功能掛到 app。
- type：把功能宣告到 Vue 型別系統。

## 設計重點

- Vue 3 插件全域屬性的型別要擴充 `@vue/runtime-core`。
- `ComponentCustomProperties` 對應 Options API 的 `this`。
- `install` 選項型別應該和 `$VIEWUI` 的實際設定保持一致。
- 元件具名匯出的型別也要跟 runtime 出口保持一致。

## 最小模仿

```ts
import type { App } from 'vue';

interface MyUIOptions {
    size?: 'small' | 'default' | 'large';
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $MY_UI: MyUIOptions;
        $Message: {
            success(content: string): void;
        };
    }
}

export const install: (app: App, options?: MyUIOptions) => void;
```

## 複習題

1. 為什麼 `globalProperties` 的 runtime 註冊不能取代型別宣告？
2. `ComponentCustomProperties` 解決哪一種使用場景？
3. `ViewUIPlusInstallOptions` 為什麼要繼承 `ViewUIPlusGlobalOptions`？
