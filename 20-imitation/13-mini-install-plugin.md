# Mini Install Plugin

元件庫不只是一批 `.vue` 檔。它還需要提供全域安裝、按需引入、型別導出與全域服務掛載。這篇練習把前面做過的 Mini 元件整理成一個可安裝插件。

## 練習目標

- 練習 Vue plugin 的 `install(app)`。
- 練習元件的具名匯出與預設匯出。
- 練習全域註冊 component name。
- 練習全域服務掛到 `app.config.globalProperties`。
- 練習 package 入口的基本形狀。

## 對照源碼

主要對照：

- `src/index.ts`
- `src/components/*/index.ts`
- `src/utils/install.ts`
- `types/`
- `04-plugin-system/`
- `19-build-release/`

閱讀時關注：

- 每個元件如何提供 `install`。
- 整包安裝與按需引入是否共用同一套註冊邏輯。
- 全域服務如何掛到 app instance。
- 型別如何導出。

## 最小實作範圍

建立 mini library 入口：

- 每個元件有 `name`。
- 每個元件有 `install(app)`。
- `components.ts` 匯出元件陣列。
- `index.ts` 匯出 `install`。
- 支援 `app.use(MiniViewUI)`。
- 支援 `app.use(MiniButton)`。
- 支援 `import { MiniButton } from 'mini-view-ui'`。
- 將 `MiniMessage` 掛到 `app.config.globalProperties.$MiniMessage`。

先不實作：

- 真實 npm package。
- rollup/vite 打包。
- CSS 按需載入。
- Volar global component type。
- auto import resolver。

## API 設計

元件 install helper：

```ts
import type { App, Plugin } from 'vue'

export type SFCWithInstall<T> = T & Plugin

export function withInstall<T extends { name?: string }>(component: T) {
  ;(component as SFCWithInstall<T>).install = (app: App) => {
    if (component.name) app.component(component.name, component as any)
  }
  return component as SFCWithInstall<T>
}
```

整包入口：

```ts
const components = [MiniIcon, MiniButton, MiniInput]

export default {
  install(app) {
    components.forEach(component => app.use(component))
    app.config.globalProperties.$MiniMessage = MiniMessage
  }
}
```

## 實作步驟

1. 建立 `utils/with-install.ts`。
2. 每個元件目錄建立 `index.ts`，用 `withInstall` 包裝元件。
3. 建立 `components.ts` 統一收集可安裝元件。
4. 建立 library `index.ts`。
5. 將 `MiniMessage` 全域服務掛到 `globalProperties`。
6. 建立使用範例：整包安裝與按需安裝各一個。

## 驗收案例

- `app.use(MiniViewUI)` 後，可以在 template 使用 `<MiniButton />`。
- `app.use(MiniButton)` 後，只註冊 Button。
- `import { MiniInput }` 可以取得元件。
- `this.$MiniMessage.success('ok')` 或等價方式可呼叫 message。
- 重複 install 不應造成明顯錯誤。

## 源碼反思

View UI Plus 的插件系統還要考慮全域配置、指令、語言、全域服務、型別增強與打包產物。仿寫版先掌握最小主線：元件本身可安裝，整包也可安裝。

這篇的重點不是打包工具，而是公開入口設計。入口一旦混亂，後面使用者體驗、文件與型別都會跟著混亂。
