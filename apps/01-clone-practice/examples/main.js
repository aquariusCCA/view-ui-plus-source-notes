// 自己開發、展示、測試元件用
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'

import App from './App.vue'
import MyUI from '../src/index';
import '../src/style/index.less'

// 路由配置
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/icon',
            component: () => import('./routers/icon.vue')
        },
    ],
})

const app = createApp(App);
app.use(router);
app.use(MyUI);
app.mount('#app');
