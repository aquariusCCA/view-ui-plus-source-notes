// 元件庫真正對外暴露的入口
import * as components from './components';
import pkg from '../package.json';

const MyUI = {
    ...components
};

export const version = pkg.version;
export const install = function(app, opts = {}) {
    Object.keys(MyUI).forEach(key => {
        app.component(key, MyUI[key]);
    });
}
export * from './components';
const API = {
    version,
    install,
    ...components
};
export default API;