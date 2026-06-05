目前我參考 `View UI Plus` 的 Icon 組件進行訪寫練習。

`apps\01-clone-practice\src\components\icon\icon.vue` 是我訪寫的成果。

樣式的部分如下：

- `apps/01-clone-practice/src/style/common/iconfont/fonts/iconfont.ttf`
- `apps/01-clone-practice/src/style/common/iconfont/_icons.less`
- `apps/01-clone-practice/src/style/common/iconfont/_variables.less`
- `apps/01-clone-practice/src/style/common/iconfont/iconfont.less`

我的思路是:

- 先去 **Iconfont（阿里图标库）** 挑圖標。
- 下載至本地之後放到專案目錄下。
- 接著對這些樣式做加工:
    - 轉為 `.less`
    - 類名改為 `my-icon` 開頭
    - 定義 `font-family`

你認為 `docs/view-ui-plus-icon-note.md` 寫的教學筆記是否合理？