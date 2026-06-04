import { createApp } from 'vue'
import App from './App.vue'
import MyUI from '@kevinxiao0210/myui'
import '@kevinxiao0210/myui/style.css'

createApp(App)
.use(MyUI)
.mount('#app')
