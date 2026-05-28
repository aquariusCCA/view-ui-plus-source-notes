# Mini Modal、Message

Modal 與 Message 都是回饋類元件，但使用方式不同。Modal 通常是受控元件，Message 則常以全域服務方式呼叫。把兩者放在同一篇，是為了練習「元件實例」與「程式式服務」的差異。

## 練習目標

- 練習受控彈窗的 `v-model` 設計。
- 練習 confirm/cancel 事件語意。
- 練習全域 Message 的動態掛載。
- 練習 overlay、z-index、關閉策略的最小模型。

## 對照源碼

主要對照：

- `src/components/modal/`
- `src/components/message/`
- `types/modal.d.ts`
- `types/message.d.ts`
- `src/styles/components/modal.less`
- `src/styles/components/message.less`

閱讀時關注：

- Modal 的 visible 如何同步。
- 點擊 mask、ESC、取消、確認是否走同一套關閉流程。
- Message 如何用函式 API 建立實例。
- 多個 Message 如何排列與銷毀。

## 最小實作範圍

仿寫 `MiniModal`：

- 支援 `modelValue`。
- 支援 `title`。
- 支援 `closable`。
- 支援 `maskClosable`。
- 支援 default slot。
- 支援 footer slot。
- emit `update:modelValue`、`ok`、`cancel`、`close`。

仿寫 `MiniMessage` 服務：

- 支援 `MiniMessage.info(content)`。
- 支援 `MiniMessage.success(content)`。
- 支援 `MiniMessage.error(content)`。
- 支援自動關閉 duration。
- 多個 message 依序堆疊。

先不實作：

- promise confirm。
- draggable modal。
- teleport container 自訂。
- notice。
- loading message update。
- server-side rendering。

## API 設計

`MiniModal`：

| 類型 | 名稱 | 說明 |
| --- | --- | --- |
| prop | `modelValue: boolean` | 顯示狀態 |
| prop | `title?: string` | 標題 |
| prop | `closable?: boolean` | 是否顯示關閉按鈕 |
| prop | `maskClosable?: boolean` | 點擊 mask 是否關閉 |
| emit | `update:modelValue(false)` | 關閉時同步 |
| emit | `ok()` | 點擊確認 |
| emit | `cancel()` | 點擊取消 |
| emit | `close()` | 任一關閉路徑 |
| slot | `default` | 內容 |
| slot | `footer` | 自訂 footer |

`MiniMessage`：

```ts
MiniMessage.info(content: string, duration?: number): MessageHandle
MiniMessage.success(content: string, duration?: number): MessageHandle
MiniMessage.error(content: string, duration?: number): MessageHandle
```

```ts
interface MessageHandle {
  close(): void
}
```

## 實作步驟

1. 建立 `MiniModal.vue`，使用 `modelValue` 控制顯示。
2. 建立 `close(reason)`，統一處理 close、cancel、mask close。
3. ok button emit `ok`，是否關閉由練習版固定關閉。
4. mask click 在 `maskClosable` 為 true 時關閉。
5. 建立 `MiniMessage.vue`，負責單個 message 顯示。
6. 建立 `message.ts`，用 `createVNode`、`render` 或 `createApp` 動態掛載。
7. 用陣列保存 message instances，關閉時移除。

## 驗收案例

- `v-model` 為 true 時 Modal 顯示，為 false 時消失。
- 點擊取消按鈕 emit `cancel`、`close`，並更新 `modelValue` 為 false。
- `maskClosable=false` 時點擊 mask 不關閉。
- 呼叫 `MiniMessage.success('done')` 後畫面出現 success message。
- message duration 到期後自動移除，手動 `handle.close()` 也能移除。

## 源碼反思

View UI Plus 的浮層系統還需要面對 teleport、focus trap、body scroll lock、z-index 管理、動畫生命週期與多服務共存。Message 還要處理全域配置與大量實例排序。

仿寫版保留兩個關鍵觀念：Modal 是由外部值控制的元件，Message 是由函式 API 建立的臨時 UI。
