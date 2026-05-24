# Layout Structure 與 `hasSider` 偵測流程

## 1. 本章定位

本篇專注閱讀 `Layout` 本身。

`Layout` 的 runtime source 很短，但它是整個 layout shell 的骨架開關：

```txt
src/components/layout/layout.vue
```

它真正要解決的問題是：

```txt
如果 Layout 裡面直接放了 Sider，就從上下排列變成左右排列。
```

這件事不是靠 prop 控制，而是靠 mounted 後檢查 slot 中是否有 `Sider`。

---

## 2. Template 與 class output

`Layout` template 只有一層：

```vue
<div :class="wrapClasses"><slot></slot></div>
```

`wrapClasses` 會輸出：

| 狀態 | class |
| --- | --- |
| 基礎狀態 | `ivu-layout` |
| `hasSider = true` | `ivu-layout-has-sider` |

也就是說，`Layout` 的 runtime 不負責直接調整 flex direction。它只把狀態轉成 class，真正的視覺布局由 Less 接住。

---

## 3. `hasSider` 狀態來源

`Layout` 的 data 只有一個欄位：

```txt
hasSider: false
```

mounted 後執行：

```txt
this.hasSider = this.findSider()
```

`findSider()` 的核心邏輯是檢查 default slot：

```txt
this.$slots.default().some(child => child.type.name === 'Sider')
```

所以判斷條件是：

| 條件 | 結果 |
| --- | --- |
| default slot 的直屬 vnode 中有 `type.name === 'Sider'` | `hasSider = true` |
| 沒有直屬 `Sider` | `hasSider = false` |

這不是遞迴查找，也不是透過 provide / inject 或 parent-child registry 完成。

---

## 4. Runtime 到 Less 的連接

`Layout` 產生：

```txt
ivu-layout ivu-layout-has-sider
```

`src/styles/components/layout.less` 接住：

```less
.@{layout-prefix-cls} {
    display: flex;
    flex-direction: column;
    flex: auto;

    &&-has-sider {
        flex-direction: row;

        > .@{layout-prefix-cls},
        > .@{layout-prefix-cls}-content {
            width: 0;
        }
    }
}
```

可以拆成兩層理解：

| class | Less 效果 |
| --- | --- |
| `ivu-layout` | `display: flex`，預設 `flex-direction: column`。 |
| `ivu-layout-has-sider` | 改成 `flex-direction: row`，讓直屬 `Sider` 與內容區左右排列。 |

`> .ivu-layout, > .ivu-layout-content { width: 0; }` 是為了讓右側巢狀 `Layout` 或 `Content` 在 row flex 中正確收縮 / 填滿，而不是被內容寬度撐開。

---

## 5. 典型結構

官方 example 使用的結構接近：

```vue
<Layout>
    <Sider />
    <Layout>
        <Header />
        <Content />
        <Footer />
    </Layout>
</Layout>
```

外層 `Layout` 在 mounted 後偵測到直屬 `Sider`，因此得到：

```txt
outer Layout
  -> ivu-layout
  -> ivu-layout-has-sider
  -> row direction
```

內層 `Layout` 沒有直屬 `Sider`，因此保持：

```txt
inner Layout
  -> ivu-layout
  -> column direction
```

這就是常見後台頁面骨架：

```txt
Sider | Header
      | Content
      | Footer
```

---

## 6. 偵測方式的限制

`Layout.findSider()` 的寫法很直接，也帶來幾個閱讀時需要標記的限制。

### 6.1 只看直屬 default slot

它檢查的是：

```txt
this.$slots.default()
```

不是遞迴搜尋所有後代。因此如果 `Sider` 被包在其他元件或 DOM 裡，外層 `Layout` 不一定會判斷為 `hasSider`。

### 6.2 依賴 vnode type name

判斷條件是：

```txt
child.type.name === 'Sider'
```

這代表它依賴 `Sider` 元件的 `name`。如果用 wrapper、匿名元件或其他轉接方式，判斷結果可能不同。

### 6.3 mounted 後才設定

`hasSider` 初始是 `false`，mounted 後才更新。這代表第一次 render 時只是 `ivu-layout`，mounted 後才可能多出 `ivu-layout-has-sider`。

### 6.4 不追蹤 slot 後續變化

source 中沒有 watch slot 或重新執行 `findSider()` 的更新流程。筆記中應把它理解成 mounted 階段的一次性偵測。

---

## 7. 與 `Sider` 的關係

`Layout` 和 `Sider` 之間沒有直接狀態同步。

```txt
Layout
  -> only detects Sider existence
  -> outputs ivu-layout-has-sider

Sider
  -> owns collapsed state
  -> owns width / trigger / breakpoint
```

`Layout` 不知道 `Sider` 是否收合，也不會接收 `Sider` 的 `modelValue`。兩者的配合點是 DOM 結構與 CSS flex。

---

## 8. 本篇小結

`Layout` 的核心可以濃縮成：

```txt
default slot direct child includes Sider
  -> hasSider = true after mounted
  -> ivu-layout-has-sider
  -> layout.less switches to row flex
```

讀這段 source 時，不要期待 `Layout` 有完整 layout manager 的能力。它更像一個很薄的骨架容器，透過一個 class 把「是否有側邊欄」交給 Less 處理。
