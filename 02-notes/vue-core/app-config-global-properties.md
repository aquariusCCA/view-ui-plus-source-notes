# Vue 3 全域屬性：`app.config.globalProperties` 使用筆記

## 一、本章學習目標

學完本章，你要能理解：

1. `app.config.globalProperties` 是什麼。
2. 如何在 `main.js / main.ts` 註冊全域屬性。
3. 如何在 `template`、Options API、Composition API 中使用。
4. `globalProperties` 和 `provide / inject` 的差異。
5. 實務上什麼情況適合用，什麼情況不適合用。

---

# 二、什麼是 `app.config.globalProperties`？

在 Vue 3 中，`app.config.globalProperties` 是用來註冊「整個 Vue App 都可以存取的屬性」的地方。

官方文件對它的定位是：可以把某個屬性掛到 Vue App 的全域設定中，讓所有元件實例都能存取。它也是 Vue 2 `Vue.prototype` 在 Vue 3 中的替代方案。不過官方也提醒，任何全域性的東西都應該謹慎使用。

你可以先把它想像成：

```js
app.config.globalProperties
```

就是 Vue App 裡面的一個「全域屬性倉庫」。

例如你把 `$user` 放進去：

```js
app.config.globalProperties.$user = {
  name: '梅長蘇',
  weapons: '長劍',
  title: '刺客'
}
```

之後元件裡就可以透過 `$user` 取得這個資料。

---

# 三、基本使用方式

## 1. 在 `main.js` 中註冊全域屬性

假設原本的 `main.js` 是這樣：

```js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')
```

現在要加入全域屬性，可以改成：

```js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.globalProperties.$user = {
  name: '梅長蘇',
  weapons: '長劍',
  title: '刺客'
}

app.mount('#app')
```

逐行理解：

```js
const app = createApp(App)
```

這一行建立 Vue 應用程式實例。

```js
app.config.globalProperties.$user = { ... }
```

這一行把 `$user` 註冊成整個 Vue App 都可以使用的全域屬性。

```js
app.mount('#app')
```

最後把 Vue App 掛載到頁面上的 `#app` 節點。

---

# 四、在 `template` 中使用

註冊完 `$user` 之後，可以直接在模板中使用：

```vue
<template>
  <div>
    <p>姓名：{{ $user.name }}</p>
    <p>武器：{{ $user.weapons }}</p>
    <p>稱號：{{ $user.title }}</p>
  </div>
</template>
```

官方文件也說明，透過 `app.config.globalProperties` 註冊的屬性，可以在任何元件的模板中使用，也可以透過元件實例的 `this` 存取。

所以這裡不需要：

```js
import user from './xxx'
```

也不需要：

```js
props
```

也不需要：

```js
inject
```

因為 `$user` 已經被掛在整個 Vue App 的全域屬性上。

---

# 五、在 Options API 中使用

如果你的元件是 Options API 寫法，可以透過 `this.$user` 使用：

```vue
<script>
export default {
  mounted() {
    console.log(this.$user)
    console.log(this.$user.name)
  },

  methods: {
    showUser() {
      alert(this.$user.name)
    }
  }
}
</script>
```

原因是：

```js
this
```

在 Options API 中代表目前這個 Vue 元件實例，而 `globalProperties` 註冊的屬性會掛到元件實例可以存取的範圍中。

---

# 六、在 Composition API 的 `setup()` 中使用

## 1. 為什麼不能直接用 `this.$user`？

在 Vue 3 的 Composition API 中，`setup()` 裡面沒有元件實例的 `this`。官方文件明確說明，`setup()` 本身無法存取元件實例，`this` 在 `setup()` 裡會是 `undefined`。

所以這樣寫是錯的：

```js
setup() {
  console.log(this.$user) // 錯誤：setup 裡不能這樣用 this
}
```

---

## 2. 使用 `getCurrentInstance()` 取得

可以透過 `getCurrentInstance()` 取得目前元件實例相關資訊：

```js
import { getCurrentInstance } from 'vue'

export default {
  setup() {
    const instance = getCurrentInstance()

    console.log(instance.appContext.config.globalProperties.$user)

    return {}
  }
}
```

這裡的重點是：

```js
instance.appContext.config.globalProperties.$user
```

意思是：

```text
目前元件實例
  → 所屬的 Vue App Context
    → App 的 config
      → globalProperties
        → $user
```

這種寫法比較接近「從 Vue App 內部設定裡拿資料」。

---

## 3. 使用 `proxy.$user`

有些文章會寫成：

```js
import { getCurrentInstance } from 'vue'

export default {
  setup() {
    const { proxy } = getCurrentInstance()

    console.log(proxy.$user)

    return {}
  }
}
```

這裡的 `proxy` 可以理解成「元件公開實例的代理物件」，所以可以透過：

```js
proxy.$user
```

取得全域屬性。

不過實務上，如果你大量在 Composition API 裡面用 `getCurrentInstance()` 拿全域資料，程式會比較隱晦。更建議的做法通常是：

```text
共用工具函式 → 直接 import
跨層級依賴 → provide / inject
全域狀態 → Pinia
少量全域工具 → globalProperties
```

---

# 七、`globalProperties` 和 `provide / inject` 的差異

這是本章最重要的觀念。

## 1. `globalProperties` 是掛在 Vue App 全域實例上的屬性

例如：

```js
app.config.globalProperties.$user = {
  name: '梅長蘇'
}
```

之後元件可以直接用：

```vue
<template>
  <p>{{ $user.name }}</p>
</template>
```

或 Options API：

```js
this.$user
```

它比較像是「全 App 都能存取的公開屬性」。

---

## 2. `provide / inject` 是元件樹的依賴注入機制

`provide / inject` 是為了讓父層元件提供資料，子孫元件注入資料。

Composition API 寫法如下：

```vue
<script setup>
import { provide } from 'vue'

provide('message', 'hello')
</script>
```

子孫元件取得：

```vue
<script setup>
import { inject } from 'vue'

const message = inject('message')
</script>
```

官方文件說明，`provide()` 接收兩個參數：第一個是 injection key，可以是字串或 Symbol；第二個是要提供的值。子孫元件會透過相同 key 找到對應的值。

---

# 八、用範例理解 `provide / inject` 的覆蓋關係

假設元件層級如下：

```text
App.vue
  └─ Parent.vue
       └─ Child.vue
```

---

## 1. `App.vue` 提供資料

```js
export default {
  provide() {
    return {
      call: '我去',
      test: '試試就試試'
    }
  }
}
```

---

## 2. `Parent.vue` 也提供同名資料

```js
export default {
  provide() {
    return {
      call: '你好'
    }
  }
}
```

---

## 3. `Child.vue` 注入資料

```js
export default {
  inject: ['call', 'test'],

  mounted() {
    console.log(this.call)
    console.log(this.test)
  }
}
```

結果會是：

```text
call → 你好
test → 試試就試試
```

原因如下：

`Child.vue` 要找 `call` 時，會先往最近的父層 `Parent.vue` 找。

`Parent.vue` 有提供：

```js
call: '你好'
```

所以 `Child.vue` 取得的是：

```text
你好
```

至於 `test`，`Parent.vue` 沒有提供，所以 Vue 會繼續往上找，最後在 `App.vue` 找到：

```js
test: '試試就試試'
```

因此 `Child.vue` 取得的是：

```text
試試就試試
```

官方文件也說明，如果多個父層提供相同 key，距離注入元件最近的那個 provider 會遮蔽更上層的同名 provider。

---

# 九、`globalProperties` vs `provide / inject` 對照表

| 比較項目     | `globalProperties`      | `provide / inject`         |
| -------- | ----------------------- | -------------------------- |
| 核心概念     | App 全域屬性                | 元件樹依賴注入                    |
| 設定位置     | 通常在 `main.js / main.ts` | 父元件、祖先元件，或 `app.provide()` |
| 使用方式     | `this.$xxx`、模板中 `$xxx`  | `provide()` 搭配 `inject()`  |
| 是否需要明確注入 | 不需要                     | 需要                         |
| 適用範圍     | 整個 App                  | 預設是提供者的子孫元件                |
| 同名衝突     | 元件自身屬性優先於全域屬性           | 最近的 provider 優先            |
| 適合用途     | 全域工具、插件、格式化方法、少量共用物件    | 表單上下文、主題設定、父子孫跨層級資料、插件依賴   |
| 不適合用途    | 大量業務狀態、複雜響應式狀態          | 無關元件之間的大型全域狀態              |

補充：Vue 也支援 `app.provide()`，這可以在 App 層級提供資料，使整個 App 裡的元件都能注入。這在寫插件時特別常見。

---

# 十、什麼時候適合用 `globalProperties`？

適合放：

```text
全域工具函式
全域格式化方法
全域 API Client
全域常數
插件暴露的方法
少量不常變動的共用資料
```

例如：

```js
app.config.globalProperties.$formatDate = function(date) {
  return new Intl.DateTimeFormat('zh-TW').format(date)
}
```

元件中使用：

```vue
<template>
  <p>{{ $formatDate(new Date()) }}</p>
</template>
```

或：

```js
this.$formatDate(new Date())
```

---

# 十一、什麼時候不適合用 `globalProperties`？

不適合放：

```text
登入狀態
購物車資料
大量業務資料
複雜響應式狀態
需要頻繁修改的資料
跨頁面共享的大型狀態
```

例如這種資料：

```js
app.config.globalProperties.$user = {
  id: 1,
  name: '小明',
  token: 'xxx',
  permissions: [],
  cartItems: [],
  currentPageState: {}
}
```

如果越放越多，最後會變成「隱形全域狀態」，維護上會很痛苦。

這類情境更適合：

```text
Pinia
Composable
provide / inject
明確 import 的 service module
```

---

# 十二、TypeScript 專案中的補充寫法

如果你用 Vue 3 + TypeScript，直接使用：

```ts
this.$user
```

TypeScript 可能不知道 `$user` 是什麼。

這時需要補充型別宣告。

例如新增：

```ts
// src/types/global-properties.d.ts

export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    $user: {
      name: string
      weapons: string
      title: string
    }
  }
}
```

Vue 官方文件也說明，若插件或全域屬性透過 `app.config.globalProperties` 安裝到所有元件實例上，為了讓 TypeScript 正確推導，需要擴充 `ComponentCustomProperties` 介面。

之後在 Options API 裡：

```ts
export default {
  mounted() {
    console.log(this.$user.name)
  }
}
```

TypeScript 就能知道：

```ts
this.$user.name
```

是 `string`。

---

# 十三、完整範例整理

## 1. `main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.globalProperties.$user = {
  name: '梅長蘇',
  weapons: '長劍',
  title: '刺客'
}

app.mount('#app')
```

---

## 2. `UserInfo.vue`

```vue
<template>
  <section>
    <h2>角色資訊</h2>

    <p>姓名：{{ $user.name }}</p>
    <p>武器：{{ $user.weapons }}</p>
    <p>稱號：{{ $user.title }}</p>
  </section>
</template>
```

---

## 3. Options API 使用

```vue
<script>
export default {
  mounted() {
    console.log('姓名：', this.$user.name)
    console.log('武器：', this.$user.weapons)
    console.log('稱號：', this.$user.title)
  }
}
</script>
```

---

## 4. Composition API 使用

```vue
<script>
import { getCurrentInstance } from 'vue'

export default {
  setup() {
    const instance = getCurrentInstance()

    const user = instance.appContext.config.globalProperties.$user

    console.log(user.name)

    return {
      user
    }
  }
}
</script>

<template>
  <p>{{ user.name }}</p>
</template>
```

---

# 十四、本章重點總結

`app.config.globalProperties` 是 Vue 3 中用來註冊全域屬性的地方，可以讓所有元件透過模板或元件實例取得資料。

它適合放「少量、穩定、全 App 都可能用到」的工具或資料，例如格式化函式、API Client、全域工具方法。

但是它不適合拿來管理大量業務狀態。只要資料會頻繁變動、需要明確資料流、需要多人維護，就應該優先考慮 Pinia、Composable、`provide / inject` 或明確的 module import。

一句話記憶：

```text
globalProperties 適合放全域工具；
provide / inject 適合做跨層級依賴注入；
大型狀態管理請交給 Pinia。
```

[1]: https://vuejs.org/api/application "Application API | Vue.js"
[2]: https://vuejs.org/api/composition-api-setup "Composition API: setup() | Vue.js"
[3]: https://vuejs.org/guide/components/provide-inject "Provide / Inject | Vue.js"
[4]: https://vuejs.org/api/composition-api-dependency-injection "Composition API: Dependency Injection | Vue.js"
[5]: https://vuejs.org/guide/typescript/options-api "TypeScript with Options API | Vue.js"
