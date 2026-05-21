# Build a Mini View UI Plus Plugin

這篇用一個迷你版 plugin 重做 View UI Plus 的核心安裝模型。目的不是重寫完整 UI library，而是用少量程式碼理解 `src/index.js` 的設計。

你應該從這個練習學到：

- Vue plugin 的 `install(app, options)` 介面
- component map 如何轉成全域註冊
- directive map 如何轉成全域註冊
- install options 如何整理成 `$VIEWUI`
- service API 如何掛到 `app.config.globalProperties`
- runtime surface 和 type surface 為什麼要同步

## 1. Target Behavior

迷你 plugin 的使用方式：

```js
import { createApp } from 'vue';
import MiniViewUI from './mini-view-ui';

const app = createApp(App);

app.use(MiniViewUI, {
    size: 'large',
    transfer: true,
    message: {
        duration: 3
    }
});

app.mount('#app');
```

安裝後，使用者可以：

```vue
<template>
    <MiniButton v-focus>Save</MiniButton>
</template>

<script>
export default {
    mounted() {
        this.$Message.info('Ready');
        console.log(this.$VIEWUI.size);
    }
};
</script>
```

## 2. Minimal Component Map

View UI Plus 的 source 會從 `src/components/index.js` 匯入所有 components。迷你版可以先用兩個假 component 模擬。

```js
// mini-view-ui/components.js
export const MiniButton = {
    name: 'MiniButton',
    props: {
        type: {
            type: String,
            default: 'default'
        }
    },
    template: `<button class="mini-button"><slot /></button>`
};

export const MiniCard = {
    name: 'MiniCard',
    template: `<section class="mini-card"><slot /></section>`
};
```

重點不是 component 寫法，而是後面如何把它們收斂成 map。

## 3. Minimal Directive Map

View UI Plus 在 `src/index.js` 裡建立 `directives` map。迷你版可以先做一個 `focus` directive。

```js
// mini-view-ui/directives.js
export const focus = {
    mounted(el) {
        el.focus();
    }
};
```

## 4. Minimal Service API

View UI Plus 的 `$Message` 來自 `components.Message`，plugin system 只負責掛載，不負責深入 message service 內部。

迷你版可以先用 console 模擬：

```js
// mini-view-ui/message.js
export const Message = {
    info(content) {
        console.info(`[info] ${content}`);
    },
    error(content) {
        console.error(`[error] ${content}`);
    }
};
```

## 5. Plugin Entry

這是迷你版的核心。它對應 View UI Plus 的 `src/index.js`。

```js
// mini-view-ui/index.js
import { MiniButton, MiniCard } from './components';
import { focus } from './directives';
import { Message } from './message';

const components = {
    MiniButton,
    MiniCard
};

const directives = {
    focus
};

const defaultOptions = {
    size: '',
    transfer: '',
    message: {
        duration: 2
    }
};

export const install = function install(app, opts = {}) {
    if (install.installed) return;
    install.installed = true;

    Object.keys(components).forEach((key) => {
        app.component(key, components[key]);
    });

    Object.keys(directives).forEach((key) => {
        app.directive(key, directives[key]);
    });

    app.config.globalProperties.$VIEWUI = {
        size: opts.size || defaultOptions.size,
        transfer: 'transfer' in opts ? opts.transfer : defaultOptions.transfer,
        message: {
            duration: opts.message && opts.message.duration
                ? opts.message.duration
                : defaultOptions.message.duration
        }
    };

    app.config.globalProperties.$Message = Message;
};

const API = {
    install,
    MiniButton,
    MiniCard,
    Message
};

export {
    MiniButton,
    MiniCard,
    Message
};

export default API;
```

這段程式碼刻意保留 View UI Plus 的幾個設計形狀：

| Design | Mini plugin | View UI Plus |
| --- | --- | --- |
| default plugin export | `export default API` | `export default API` |
| install entry | `install(app, opts)` | `install(app, opts = {})` |
| component map | `components` | `ViewUI` |
| directive map | `directives` | `directives` |
| global config | `$VIEWUI` | `$VIEWUI` |
| service API | `$Message` | `$Message`、`$Modal`、`$Notice` 等 |
| named exports | `export { MiniButton }` | `export * from './components'` |

## 6. Type Surface

如果迷你 plugin 要支援 TypeScript，也要補 declaration。這對應 View UI Plus 的 `types/index.d.ts`。

```ts
// mini-view-ui/index.d.ts
import type { App } from 'vue';

interface MiniViewUIOptions {
    size?: string;
    transfer?: boolean | string;
    message?: {
        duration?: number;
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $VIEWUI: MiniViewUIOptions;
        $Message: {
            info(content: string): void;
            error(content: string): void;
        };
    }
}

export const install: (app: App, options?: MiniViewUIOptions) => void;
```

這裡的重點是：runtime 掛了什麼，types 就要宣告什麼。

## 7. Compare with View UI Plus Source

| Mini plugin step | View UI Plus source 對應 |
| --- | --- |
| `import components` | `import * as components from './components'` |
| 建立 component map | `const ViewUI = { ...components, iButton: components.Button, ... }` |
| 建立 directive map | `const directives = { display, width, resize, 'line-clamp', ... }` |
| `app.component` loop | `Object.keys(ViewUI).forEach(...)` |
| `app.directive` loop | `Object.keys(directives).forEach(...)` |
| 寫入 `$VIEWUI` | `app.config.globalProperties.$VIEWUI = { ... }` |
| 寫入 service API | `$Message`、`$Notice`、`$Modal`、`$Loading` 等 |
| 寫入 helper | `$Date = dayjs` |
| type declaration | `types/index.d.ts` |

## 8. What This Exercise Does Not Cover

這個 mini plugin 不處理：

- CSS 打包與 theme token
- component props/events/slots 的完整設計
- `$Message` 的 DOM rendering、queue、destroy
- locale merge 與 vue-i18n adapter
- build output 的 ESM/UMD 形狀

這些主題分別屬於：

- `07-components/`
- `10-imperative-api/`
- `12-style-system/`
- `14-build-release/`

## 9. Practice Tasks

可以用這幾個小練習確認你真的理解 plugin system：

| Task | 要驗證的觀念 |
| --- | --- |
| 新增 `MiniInput` 並讓 `<MiniInput />` 可用 | component map 和 `app.component` loop |
| 新增 `v-loading` directive | directive map 和 registration name |
| 新增 `$Confirm` service | globalProperties 和 type declaration |
| 新增 `button.rounded` option | install options 到 `$VIEWUI` 的資料流 |
| 刪除 `$Message` type declaration 但保留 runtime | runtime/type contract mismatch |

## Related Notes

- `04-plugin-system/01-install-flow.md`
- `04-plugin-system/02-component-registration.md`
- `04-plugin-system/03-directive-registration.md`
- `04-plugin-system/04-global-options-and-viewui-config.md`
- `04-plugin-system/05-global-properties.md`
- `04-plugin-system/07-runtime-type-contract.md`

