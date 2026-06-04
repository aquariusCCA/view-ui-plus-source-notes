import type { App, Plugin } from 'vue'

export declare const version: string

// opts 對應 src/index.js 裡的 opts = {}。
// Record<string, unknown> 表示這是一個 key-value options 物件；
// unknown 比 any 保守，代表使用前需要先確認型別。
export declare function install(
    app: App,
    opts?: Record<string, unknown>
): void
export * from './myui.components';

// 對應 src/index.js 的 default export: { version, install, ...components }
// 意思是：「這個套件的 default export 是一個物件，它同時有 Vue Plugin 能力、version、install，以及所有元件。」
declare const API: Plugin & {
    version: string
    install: typeof install
} & typeof import('./myui.components')
export default API
