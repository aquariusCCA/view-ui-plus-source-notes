# Header / Content / Footer 薄殼元件

## 1. 本章定位

本篇專注閱讀 `Header`、`Content`、`Footer`。

這三個元件的 runtime source 都很短：

```txt
src/components/layout/header.vue
src/components/layout/content.vue
src/components/layout/footer.vue
```

它們沒有 props、沒有 emits、沒有內部狀態，也沒有具名 slot。它們的主要價值是把頁面區塊穩定映射成 layout class，讓 Less 能建立一致的頁面骨架。

---

## 2. 共同 template 模型

三個元件都可以理解成同一個模型：

```vue
<div :class="wrapClasses">
    <slot></slot>
</div>
```

差異只在 `wrapClasses` 回傳的 class 名稱。

| 元件 | class |
| --- | --- |
| `Header` | `ivu-layout-header` |
| `Content` | `ivu-layout-content` |
| `Footer` | `ivu-layout-footer` |

這種元件不是為了封裝複雜 JavaScript，而是為了提供穩定 DOM 結構與語意 class。

---

## 3. `Header`：固定高度頂部區域

`Header` runtime：

```txt
wrapClasses -> ivu-layout-header
```

Less 中對應：

```less
&-header {
    background: @layout-header-background;
    padding: @layout-header-padding;
    height: @layout-header-height;
    line-height: @layout-header-height;
}
```

同時，`Header` 和 `Footer` 共用：

```less
&-header,
&-footer {
    flex: 0 0 auto;
}
```

所以 `Header` 的定位是：

| 面向 | 行為 |
| --- | --- |
| runtime | 輸出 class 與 default slot。 |
| layout | 在 column layout 中不吃掉剩餘空間。 |
| style | 使用 layout header 背景、高度、padding、line-height。 |

---

## 4. `Content`：主要內容伸展區

`Content` runtime：

```txt
wrapClasses -> ivu-layout-content
```

Less 中對應：

```less
&-content {
    flex: auto;
}
```

`Content` 的重點是接收剩餘空間：

```txt
Layout column
  -> Header flex: 0 0 auto
  -> Content flex: auto
  -> Footer flex: 0 0 auto
```

在有 `Sider` 的外層 `Layout` 中，`ivu-layout-has-sider` 還會影響直屬 `Content`：

```less
&&-has-sider {
    > .@{layout-prefix-cls},
    > .@{layout-prefix-cls}-content {
        width: 0;
    }
}
```

這讓 `Content` 在左右布局中更容易正確收縮與填滿。

---

## 5. `Footer`：底部區域

`Footer` runtime：

```txt
wrapClasses -> ivu-layout-footer
```

Less 中對應：

```less
&-footer {
    background: @layout-footer-background;
    padding: @layout-footer-padding;
    color: @text-color;
    font-size: @font-size-base;
}
```

`Footer` 與 `Header` 一樣使用：

```txt
flex: 0 0 auto
```

所以它不負責填滿剩餘空間，而是作為內容流中的底部區塊。

---

## 6. Less 變數來源

三個元件的主要尺寸與顏色來自：

```txt
src/styles/custom.less
```

相關變數包括：

| 變數 | 預設值 | 用途 |
| --- | --- | --- |
| `@layout-body-background` | `#f5f7f9` | `ivu-layout` 背景。 |
| `@layout-header-background` | `#515a6e` | `Header` 背景，也被 `Sider` 背景復用。 |
| `@layout-header-height` | `64px` | `Header` 高度與 line-height。 |
| `@layout-header-padding` | `0 50px` | `Header` padding。 |
| `@layout-footer-padding` | `24px 50px` | `Footer` padding。 |
| `@layout-footer-background` | `@layout-body-background` | `Footer` 背景。 |

閱讀這三個元件時，runtime 只能看到 class；真正的設計規格要回到 Less 變數和 component style。

---

## 7. Attribute fallthrough

因為這三個元件都是單一 root element，Vue 會把非 prop attributes fall through 到 root div。

官方 example 中有：

```vue
<Header :style="{background: '#eee'}">
```

這裡的 inline style 不是 `Header` prop，而是 Vue attribute fallthrough 到 root div 後生效。這也是為什麼 source 裡不需要定義 `style` prop。

同理，如果使用者要加 class，應優先理解成 Vue 原生 `class` attribute，而不是尋找 `className` prop。`Header`、`Content`、`Footer` source 中沒有 `className`。

---

## 8. 與 page footer 類元件的邊界

本目錄的 `Footer` 只是一個 layout shell 區塊：

```txt
Footer
  -> ivu-layout-footer
  -> default slot
```

不要把它和下列業務頁面元件混在一起：

```txt
FooterToolbar
GlobalFooter
PageHeader
```

那些元件有更明顯的業務語意、內容配置與獨立樣式，應放在其他目錄閱讀。

---

## 9. 本篇小結

`Header` / `Content` / `Footer` 可以用一句話理解：

```txt
thin Vue wrapper
  -> stable ivu-layout-* class
  -> layout.less defines visual and flex behavior
```

它們是讀 layout shell 時最簡單的部分，但也能提醒讀者：元件庫裡不是每個元件都需要複雜 runtime。有些元件的價值就在於提供穩定語意、樣式入口與組合邊界。
