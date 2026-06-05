// 自己開發、展示、測試元件用
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'

import App from './App.vue'
import MyUI from '../src/index';
import '../src/style/index.less'
import './style/iconfont.less';

// 路由配置
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/my-icon',
            component: () => import('./routers/my-icon.vue')
        },
    ],
})

const app = createApp(App);
app.use(router);
app.use(MyUI);
app.mount('#app');
