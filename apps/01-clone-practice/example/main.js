// 自己開發、展示、測試元件用

import { createApp } from 'vue'
import App from './App.vue'

import ViewUIPlus from '../src/index';
import { HelloWorld } from '../src/index';

import '../src/style/index.less'

const app = createApp(App);
app.use(ViewUIPlus);
app.mount('#app');
