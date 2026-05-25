# Vue `h()` 函數完整教學筆記

這篇筆記以 **Vue 3** 為主。你可以把 `h()` 理解成：

> **用 JavaScript 手動描述 template 要渲染出來的畫面。**

一般業務開發大多使用 `<template>`，因為可讀性較高；但當元件結構高度動態、需要大量條件組裝、封裝元件庫、處理 slot 或想用 JSX / render function 時，`h()` 就會派上用場。Vue 官方也明確說明，大多數情況建議使用 template，但在某些場景需要 JavaScript 完整程式能力時，render function 就很適合。

---

# 一、先建立核心觀念：`h()` 不是建立 DOM

很多人剛學 `h()` 時，會以為：

```ts
h('div')
```

等於：

```ts
document.createElement('div')
```

但這個理解不完全正確。

`h()` 建立的不是實際 DOM，而是 **VNode**，也就是 Virtual DOM Node。

也就是說：

```ts
h('div', { class: 'box' }, 'hello')
```

不是馬上產生：

```html
<div class="box">hello</div>
```

而是產生一個描述畫面的物件，概念上接近：

```ts
{
  type: 'div',
  props: {
    class: 'box'
  },
  children: 'hello'
}
```

Vue 會根據這個 VNode，再去建立、更新或移除真實 DOM。官方文件也說明，`h()` 的用途是建立 virtual DOM nodes，也就是 VNodes。([Vue.js][2])

---

# 二、`h` 這個名字是什麼意思？

`h()` 的 `h` 來自 **hyperscript**。

你可以簡單理解成：

> **hypertext script，也就是用 JavaScript 產生 HTML 結構。**

Vue 官方也提到，`h()` 是 hyperscript 的縮寫；更直白的名字其實可以叫 `createVNode()`，但因為 render function 裡可能會大量呼叫這個函數，所以使用較短的 `h()`。([Vue.js][3])

所以：

```ts
h('div', 'hello')
```

可以用白話翻譯成：

```txt
建立一個 div 的 VNode，內容是 hello
```

---

# 三、`h()` 的基本語法

Vue 3 官方簡化後的型別如下：

```ts
function h(
  type: string | Component,
  props?: object | null,
  children?: Children | Slot | Slots
): VNode
```

也就是：

```ts
h(type, props, children)
```

三個參數分別是：

| 參數         | 意義                      | 範例                                    |
| ---------- | ----------------------- | ------------------------------------- |
| `type`     | 要渲染什麼節點                 | `'div'`、`'button'`、`MyComponent`      |
| `props`    | 屬性、事件、class、style、key 等 | `{ class: 'box', onClick: fn }`       |
| `children` | 子內容                     | `'hello'`、`[h('span')]`、slot function |

官方文件也說明，第一個參數可以是原生 HTML 標籤字串或 Vue 元件，第二個參數是 props，第三個參數是 children。([Vue.js][2])

---

# 四、從 template 對照 `h()`

先看一個最簡單的 template：

```vue
<template>
  <div class="box">hello</div>
</template>
```

用 `h()` 寫就是：

```ts
import { h } from 'vue'

export default {
  render() {
    return h('div', { class: 'box' }, 'hello')
  }
}
```

你可以這樣對照：

```vue
<div class="box">hello</div>
```

等於：

```ts
h('div', { class: 'box' }, 'hello')
```

所以第一個學習公式是：

```ts
h('標籤名稱', { 屬性 }, 子內容)
```

---

# 五、第一個參數：`type`

`type` 決定你要建立什麼節點。

## 1. 建立原生 HTML 元素

```ts
h('div')
h('span')
h('button')
h('input')
h('ul')
h('li')
```

例如：

```ts
h('button', '送出')
```

對應：

```vue
<button>送出</button>
```

---

## 2. 建立 Vue 元件

假設有一個元件：

```ts
import MyButton from './MyButton.vue'
```

那麼可以這樣建立元件 VNode：

```ts
h(MyButton)
```

如果要傳 props：

```ts
h(MyButton, {
  type: 'primary',
  disabled: true
})
```

對應：

```vue
<MyButton type="primary" :disabled="true" />
```

所以第一個參數有兩種常見型態：

```ts
h('div')
```

代表原生 HTML 元素。

```ts
h(MyButton)
```

代表 Vue 元件。

---

# 六、第二個參數：`props`

`props` 是一個物件，用來放：

* HTML attribute
* DOM property
* Vue component props
* class
* style
* event listener
* key
* ref

例如：

```ts
h('button', {
  id: 'submit-btn',
  class: 'btn',
  disabled: true,
  type: 'button',
  onClick: () => {
    console.log('clicked')
  }
}, '送出')
```

對應：

```vue
<button
  id="submit-btn"
  class="btn"
  disabled
  type="button"
  @click="() => console.log('clicked')"
>
  送出
</button>
```

Vue 3 的 VNode props 結構是扁平化的，所以事件會直接寫成 `onClick`，`class`、`style`、`id`、`innerHTML` 等也直接放在同一層。這是 Vue 3 render function API 與 Vue 2 的重要差異之一。([Vue 3 遷移指南][4])

---

# 七、`class` 的寫法

在 `h()` 裡，`class` 可以寫字串：

```ts
h('div', {
  class: 'box'
}, 'hello')
```

對應：

```vue
<div class="box">hello</div>
```

也可以寫陣列：

```ts
h('div', {
  class: ['box', 'active']
}, 'hello')
```

對應：

```vue
<div class="box active">hello</div>
```

也可以寫物件：

```ts
h('div', {
  class: {
    box: true,
    active: true,
    disabled: false
  }
}, 'hello')
```

對應：

```vue
<div class="box active">hello</div>
```

也可以混合：

```ts
h('div', {
  class: [
    'box',
    {
      active: true,
      disabled: false
    }
  ]
}, 'hello')
```

官方文件也說明，`h()` 中的 `class` 和 `style` 支援與 template 類似的 object / array 寫法。([Vue.js][2])

---

# 八、`style` 的寫法

```ts
h('div', {
  style: {
    color: 'red',
    fontSize: '20px'
  }
}, 'hello')
```

對應：

```vue
<div :style="{ color: 'red', fontSize: '20px' }">
  hello
</div>
```

也可以搭配條件：

```ts
const isActive = true

h('div', {
  style: {
    color: isActive ? 'red' : 'gray',
    fontWeight: isActive ? 'bold' : 'normal'
  }
}, 'hello')
```

---

# 九、事件寫法：`onXxx`

在 template 裡：

```vue
<button @click="handleClick">送出</button>
```

在 `h()` 裡：

```ts
h('button', {
  onClick: handleClick
}, '送出')
```

更多例子：

```ts
h('input', {
  onInput: handleInput,
  onFocus: handleFocus,
  onBlur: handleBlur
})
```

對應：

```vue
<input
  @input="handleInput"
  @focus="handleFocus"
  @blur="handleBlur"
/>
```

事件名稱規則是：

```txt
@click      -> onClick
@input      -> onInput
@mouseenter -> onMouseenter
@keydown    -> onKeydown
```

官方文件也示範事件 listener 應以 `onXxx` 形式放在 props 物件中。([Vue.js][2])

---

# 十、第三個參數：`children`

`children` 代表子內容。

它可以是：

* 字串
* 數字
* VNode
* VNode 陣列
* slot function
* slots object
* `null`

---

## 1. 字串 children

```ts
h('div', null, 'hello')
```

對應：

```vue
<div>hello</div>
```

如果沒有 props，也可以簡寫成：

```ts
h('div', 'hello')
```

這裡你前面抓到的問題很重要。

完整語法是：

```ts
h(type, props, children)
```

所以嚴格來說，children 是第三個參數。

但 Vue 允許在沒有 props 時省略第二個參數，所以：

```ts
h('div', 'hello')
```

等於：

```ts
h('div', null, 'hello')
```

官方文件也明確示範，沒有 props 時可以省略 props 參數。([Vue.js][2])

---

## 2. 陣列 children

完整寫法：

```ts
h('div', null, [
  h('span', null, 'hello'),
  h('span', null, 'world')
])
```

對應：

```vue
<div>
  <span>hello</span>
  <span>world</span>
</div>
```

也可以簡寫：

```ts
h('div', [
  h('span', 'hello'),
  h('span', 'world')
])
```

這不是錯，因為第二個參數 props 被省略了。

不過初學時我建議先用完整寫法：

```ts
h('div', null, [
  h('span', 'hello'),
  h('span', 'world')
])
```

這樣比較容易建立正確的三參數模型。

---

## 3. 混合字串與 VNode

```ts
h('div', null, [
  'hello ',
  h('strong', null, 'Vue'),
  ' world'
])
```

對應：

```vue
<div>
  hello <strong>Vue</strong> world
</div>
```

官方文件也示範 children 陣列可以混合字串與 VNode。([Vue.js][3])

---

# 十一、完整寫法與簡寫規則

`h()` 有完整寫法，也有簡寫。

## 1. 完整寫法

```ts
h('div', { class: 'box' }, 'hello')
```

結構清楚：

```txt
type     -> 'div'
props    -> { class: 'box' }
children -> 'hello'
```

---

## 2. 沒有 props 時，可以省略第二個參數

```ts
h('div', 'hello')
```

等於：

```ts
h('div', null, 'hello')
```

陣列 children 也一樣：

```ts
h('div', [
  h('span', 'hello')
])
```

等於：

```ts
h('div', null, [
  h('span', 'hello')
])
```

---

## 3. 有 props 時，不可以省略 `null`

這是錯誤觀念：

```ts
h('div', { class: 'box' })
```

這不是 children，而是 props。

它對應的是：

```vue
<div class="box"></div>
```

不是：

```vue
<div>{ class: 'box' }</div>
```

所以當第二個參數是物件時，通常會被 Vue 當成 props。

---

# 十二、在 Options API 中使用 `h()`

Options API 裡可以寫 `render()`：

```ts
import { h } from 'vue'

export default {
  data() {
    return {
      message: 'hello Vue'
    }
  },

  render() {
    return h('div', null, this.message)
  }
}
```

對應：

```vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return {
      message: 'hello Vue'
    }
  }
}
</script>
```

在 Options API 的 `render()` 裡，可以透過 `this` 存取元件實例上的 data、computed、methods、props 等。Vue 官方文件也有說明，`render()` option 可以透過 `this` 存取 component instance。([Vue.js][3])

---

# 十三、在 Composition API 中使用 `h()`

Composition API 裡常見寫法是：

```ts
import { ref, h } from 'vue'

export default {
  setup() {
    const count = ref(0)

    const handleClick = () => {
      count.value++
    }

    return () => {
      return h('button', {
        onClick: handleClick
      }, `count: ${count.value}`)
    }
  }
}
```

對應：

```vue
<template>
  <button @click="count++">
    count: {{ count }}
  </button>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>
```

這裡要注意：`setup()` 回傳的不是 VNode 本身，而是 **一個 render function**。

也就是：

```ts
return () => h(...)
```

而不是：

```ts
return h(...)
```

原因是 `setup()` 只會執行一次，但 render function 會在資料更新時被 Vue 重複呼叫。Vue 官方文件也提醒，使用 Composition API 搭配 render function 時，應該回傳一個函數，而不是直接回傳值。([Vue.js][3])

---

# 十四、用 `h()` 建立元件

假設有一個元件：

```ts
import BaseButton from './BaseButton.vue'
```

template 寫法：

```vue
<BaseButton type="primary" :disabled="false" />
```

`h()` 寫法：

```ts
h(BaseButton, {
  type: 'primary',
  disabled: false
})
```

如果元件有事件：

```vue
<BaseButton @click="handleClick" />
```

`h()` 寫法：

```ts
h(BaseButton, {
  onClick: handleClick
})
```

如果是 `v-model`：

```vue
<BaseInput
  :model-value="username"
  @update:model-value="username = $event"
/>
```

`h()` 寫法通常是：

```ts
h(BaseInput, {
  modelValue: username.value,
  'onUpdate:modelValue': (value: string) => {
    username.value = value
  }
})
```

注意這裡因為屬性名稱含有冒號，所以要用字串 key：

```ts
'onUpdate:modelValue'
```

---

# 十五、元件 children 通常是 slots

這是 `h()` 最重要、也最容易搞混的地方。

對原生 HTML 來說：

```ts
h('button', null, '送出')
```

就是：

```vue
<button>送出</button>
```

但對 Vue 元件來說，children 通常不是普通文字，而是 **slot**。

假設 template 是：

```vue
<BaseButton>
  送出
</BaseButton>
```

用 `h()` 可以寫成：

```ts
h(BaseButton, null, {
  default: () => '送出'
})
```

也可以在只有 default slot 時簡寫：

```ts
h(BaseButton, () => '送出')
```

官方文件特別說明，建立 component vnode 時，children 必須用 slot function 傳入；如果元件只有 default slot，可以傳單一 slot function，否則要傳 slots object。([Vue.js][2])

---

# 十六、Named Slots 的寫法

假設有一個 `BaseCard` 元件：

```vue
<BaseCard>
  <template #header>
    <h3>標題</h3>
  </template>

  <p>內容</p>

  <template #footer>
    <button>確認</button>
  </template>
</BaseCard>
```

用 `h()` 寫：

```ts
h(BaseCard, null, {
  header: () => h('h3', null, '標題'),

  default: () => h('p', null, '內容'),

  footer: () => h('button', null, '確認')
})
```

這裡的第三個參數是 slots object：

```ts
{
  header: () => ...,
  default: () => ...,
  footer: () => ...
}
```

注意中間的 `null` 很重要：

```ts
h(BaseCard, null, {
  default: () => '內容'
})
```

如果你寫成：

```ts
h(BaseCard, {
  default: () => '內容'
})
```

Vue 可能會把這個物件當成 props，而不是 slots。官方文件在 named slots 範例中特別標註，這裡需要 `null`，避免 slots object 被當成 props。([Vue.js][2])

---

# 十七、Scoped Slot 的寫法

template：

```vue
<UserList>
  <template #default="{ user }">
    <div>{{ user.name }}</div>
  </template>
</UserList>
```

`h()` 寫法：

```ts
h(UserList, null, {
  default: ({ user }) => {
    return h('div', null, user.name)
  }
})
```

如果是 named scoped slot：

```vue
<UserList>
  <template #item="{ user, index }">
    <div>{{ index }} - {{ user.name }}</div>
  </template>
</UserList>
```

`h()` 寫法：

```ts
h(UserList, null, {
  item: ({ user, index }) => {
    return h('div', null, `${index} - ${user.name}`)
  }
})
```

Vue 官方在 slots 文件裡也用 JavaScript function 的角度解釋 scoped slots：可以把 scoped slot 想成傳給子元件的一個函數，子元件呼叫這個函數時，把 slot props 傳進去。([Vue.js][5])

---

# 十八、把常見 template 語法翻譯成 `h()`

## 1. `v-if`

template：

```vue
<div v-if="visible">hello</div>
```

`h()`：

```ts
visible.value
  ? h('div', null, 'hello')
  : null
```

完整例子：

```ts
return () => {
  return visible.value
    ? h('div', null, 'hello')
    : null
}
```

---

## 2. `v-if / v-else`

template：

```vue
<div v-if="isLogin">已登入</div>
<div v-else>未登入</div>
```

`h()`：

```ts
return () => {
  return isLogin.value
    ? h('div', null, '已登入')
    : h('div', null, '未登入')
}
```

---

## 3. `v-for`

template：

```vue
<ul>
  <li v-for="item in list" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

`h()`：

```ts
h('ul', null, list.value.map(item => {
  return h('li', {
    key: item.id
  }, item.name)
}))
```

重點是：

```ts
list.map(item => h(...))
```

`v-for` 在 render function 裡通常就是 `map()`。

---

## 4. `v-bind`

template：

```vue
<button :disabled="disabled">
  送出
</button>
```

`h()`：

```ts
h('button', {
  disabled: disabled.value
}, '送出')
```

---

## 5. `v-on`

template：

```vue
<button @click="handleClick">
  送出
</button>
```

`h()`：

```ts
h('button', {
  onClick: handleClick
}, '送出')
```

---

## 6. `v-model`

template：

```vue
<input v-model="keyword" />
```

`h()`：

```ts
h('input', {
  value: keyword.value,
  onInput: (event: Event) => {
    keyword.value = (event.target as HTMLInputElement).value
  }
})
```

如果是元件上的 `v-model`：

```vue
<BaseInput v-model="keyword" />
```

`h()`：

```ts
h(BaseInput, {
  modelValue: keyword.value,
  'onUpdate:modelValue': (value: string) => {
    keyword.value = value
  }
})
```

---

# 十九、事件修飾符：`withModifiers`

template：

```vue
<button @click.stop.prevent="handleClick">
  送出
</button>
```

`h()` 可以使用 `withModifiers`：

```ts
import { h, withModifiers } from 'vue'

h('button', {
  onClick: withModifiers(handleClick, ['stop', 'prevent'])
}, '送出')
```

Vue 官方文件說明，`withModifiers()` 用來替事件處理函數加上內建的 `v-on` modifiers。([Vue.js][2])

---

# 二十、自訂指令：`withDirectives`

template：

```vue
<div v-pin:top.animate="200"></div>
```

`h()` 可以使用 `withDirectives`：

```ts
import { h, withDirectives } from 'vue'

const pin = {
  mounted(el: HTMLElement) {
    // ...
  },
  updated(el: HTMLElement) {
    // ...
  }
}

const vnode = withDirectives(
  h('div'),
  [
    [pin, 200, 'top', { animate: true }]
  ]
)
```

Vue 官方文件說明，`withDirectives()` 可以把自訂指令加到 VNode 上，第二個參數是指令陣列。([Vue.js][2])

---

# 二十一、合併 props：`mergeProps`

元件庫裡常常會遇到這種情境：

```ts
const baseProps = {
  class: 'btn',
  onClick: handleBaseClick
}

const userProps = {
  class: 'primary',
  onClick: handleUserClick
}
```

如果直接使用展開運算子：

```ts
{
  ...baseProps,
  ...userProps
}
```

後面的 `class` 和 `onClick` 可能會覆蓋前面的。

Vue 提供 `mergeProps()`，會對 `class`、`style`、`onXxx` 做特殊合併：

```ts
import { h, mergeProps } from 'vue'

h('button',
  mergeProps(baseProps, userProps),
  '送出'
)
```

官方文件說明，`mergeProps()` 會特別處理 `class`、`style` 和 `onXxx` 事件 listener；如果不需要這種合併行為，才使用原生 object spread。([Vue.js][2])

---

# 二十二、不要重複使用同一個 VNode

這是一個比較細但很重要的規則。

錯誤寫法：

```ts
const child = h('p', null, 'hello')

return h('div', null, [
  child,
  child
])
```

這看起來好像是兩個 `<p>`，但其實你重複使用了同一個 VNode 物件。

應該改成：

```ts
return h('div', null, [
  h('p', null, 'hello'),
  h('p', null, 'hello')
])
```

或者用工廠函數：

```ts
const createChild = () => h('p', null, 'hello')

return h('div', null, [
  createChild(),
  createChild()
])
```

Vue 官方文件也提醒，component tree 裡的 VNode 必須是唯一的；如果要重複渲染相同元素，應該每次建立新的 VNode。([Vue.js][3])

---

# 二十三、讀元件庫源碼時，如何看懂 `h()`

你之後讀 View UI Plus、Element Plus、Naive UI 這類元件庫時，常會看到類似結構：

```ts
return h('button', {
  class: classes.value,
  disabled: props.disabled,
  onClick: handleClick
}, [
  slots.icon?.(),
  h('span', null, slots.default?.())
])
```

你不要先被 JavaScript 嚇到，先翻譯成 template：

```vue
<button
  :class="classes"
  :disabled="disabled"
  @click="handleClick"
>
  <slot name="icon" />
  <span>
    <slot />
  </span>
</button>
```

閱讀心法是：

```ts
h('button', props, children)
```

翻譯成：

```vue
<button v-bind="props">
  children
</button>
```

如果看到：

```ts
h(Component, props, slots)
```

翻譯成：

```vue
<Component v-bind="props">
  slots
</Component>
```

---

# 二十四、實戰範例：用 `h()` 寫一個 Button 元件

## template 版本

```vue
<template>
  <button
    :class="classes"
    :disabled="disabled"
    @click="handleClick"
  >
    <span v-if="loading">Loading...</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const classes = computed(() => [
  'base-button',
  props.type ? `base-button--${props.type}` : '',
  {
    'is-disabled': props.disabled,
    'is-loading': props.loading
  }
])

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>
```

---

## `h()` 版本

```ts
import { computed, defineComponent, h } from 'vue'

export default defineComponent({
  name: 'BaseButton',

  props: {
    type: {
      type: String,
      default: 'default'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['click'],

  setup(props, { emit, slots }) {
    const classes = computed(() => [
      'base-button',
      props.type ? `base-button--${props.type}` : '',
      {
        'is-disabled': props.disabled,
        'is-loading': props.loading
      }
    ])

    const handleClick = (event: MouseEvent) => {
      if (props.disabled || props.loading) return
      emit('click', event)
    }

    return () => {
      return h('button', {
        class: classes.value,
        disabled: props.disabled || props.loading,
        onClick: handleClick
      }, [
        props.loading
          ? h('span', { class: 'base-button__loading' }, 'Loading...')
          : null,

        h('span', { class: 'base-button__content' }, slots.default?.())
      ])
    }
  }
})
```

這段可以拆成三層來讀：

```ts
h('button', props, children)
```

第一層是外部按鈕。

```ts
{
  class: classes.value,
  disabled: props.disabled || props.loading,
  onClick: handleClick
}
```

第二層是 button 的屬性與事件。

```ts
[
  props.loading ? h('span', ...) : null,
  h('span', ..., slots.default?.())
]
```

第三層是 button 裡面的內容。

---

# 二十五、常見錯誤整理

## 錯誤 1：以為 `h()` 會產生真實 DOM

錯誤理解：

```ts
const el = h('div')
document.body.appendChild(el)
```

這是不對的，因為 `h()` 回傳的是 VNode，不是 HTMLElement。

正確理解：

```ts
h('div')
```

代表：

```txt
建立一個描述 div 的 VNode
```

---

## 錯誤 2：搞混 props 和 children

```ts
h('div', { class: 'box' })
```

這是 props，不是 children。

如果你要 children 是陣列，建議寫：

```ts
h('div', null, [
  h('span', 'hello')
])
```

---

## 錯誤 3：元件 slot 沒有用函數

不建議：

```ts
h(BaseButton, null, '送出')
```

建議：

```ts
h(BaseButton, null, {
  default: () => '送出'
})
```

或 default slot 簡寫：

```ts
h(BaseButton, () => '送出')
```

---

## 錯誤 4：named slots 忘記中間的 `null`

容易出錯：

```ts
h(BaseCard, {
  header: () => h('h3', '標題'),
  default: () => h('p', '內容')
})
```

建議：

```ts
h(BaseCard, null, {
  header: () => h('h3', '標題'),
  default: () => h('p', '內容')
})
```

---

## 錯誤 5：在 `setup()` 直接回傳 VNode

不建議：

```ts
setup() {
  return h('div', 'hello')
}
```

應該：

```ts
setup() {
  return () => h('div', 'hello')
}
```

---

# 二十六、學習 `h()` 的建議順序

你可以按照這個順序練習：

## 第一階段：原生元素

先練：

```ts
h('div', 'hello')
h('button', { onClick: fn }, 'click')
h('ul', null, [
  h('li', 'A'),
  h('li', 'B')
])
```

目標是熟悉：

```ts
h(type, props, children)
```

---

## 第二階段：template 翻譯

把這段：

```vue
<div class="card">
  <h3>標題</h3>
  <p>內容</p>
</div>
```

翻成：

```ts
h('div', { class: 'card' }, [
  h('h3', '標題'),
  h('p', '內容')
])
```

---

## 第三階段：條件與列表

練習把：

```vue
<li v-for="item in list" :key="item.id">
  {{ item.name }}
</li>
```

翻成：

```ts
list.map(item => {
  return h('li', { key: item.id }, item.name)
})
```

---

## 第四階段：元件與 props

練習：

```vue
<BaseButton type="primary" @click="handleClick">
  送出
</BaseButton>
```

翻成：

```ts
h(BaseButton, {
  type: 'primary',
  onClick: handleClick
}, {
  default: () => '送出'
})
```

---

## 第五階段：slot 與 scoped slot

練習：

```vue
<BaseTable :data="list">
  <template #name="{ row }">
    <span>{{ row.name }}</span>
  </template>
</BaseTable>
```

翻成：

```ts
h(BaseTable, {
  data: list.value
}, {
  name: ({ row }) => h('span', row.name)
})
```

---

# 二十七、總結

`h()` 的核心不難，真正要掌握的是三件事。

第一，`h()` 是用 JavaScript 建立 VNode：

```ts
h('div', { class: 'box' }, 'hello')
```

可以翻譯成：

```vue
<div class="box">hello</div>
```

第二，完整模型永遠是：

```ts
h(type, props, children)
```

沒有 props 時，可以簡寫：

```ts
h('div', 'hello')
h('div', [h('span', 'hello')])
```

但初學時建議先用完整寫法：

```ts
h('div', null, 'hello')
h('div', null, [h('span', 'hello')])
```

第三，建立 Vue 元件時，children 通常是 slots：

```ts
h(BaseButton, null, {
  default: () => '送出'
})
```

讀元件庫源碼時，只要把每個 `h()` 翻回 template，就會清楚很多：

```ts
h('button', props, children)
```

腦中翻譯成：

```vue
<button v-bind="props">
  children
</button>
```

掌握這個心法後，`render()`、`h()`、slot、元件庫源碼的可讀性會大幅提升。

[1]: https://cn.vuejs.org/guide/extras/render-function?utm_source=chatgpt.com "渲染函数& JSX"
[2]: https://vuejs.org/api/render-function "Render Function APIs | Vue.js"
[3]: https://vuejs.org/guide/extras/render-function "Render Functions & JSX | Vue.js"
[4]: https://v3-migration.vuejs.org/breaking-changes/render-function-api "Render Function API | Vue 3 Migration Guide"
[5]: https://vuejs.org/guide/components/slots "Slots | Vue.js"
