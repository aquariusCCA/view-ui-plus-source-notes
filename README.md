# View UI Plus 源碼學習筆記

這是一套用來閱讀 **View UI Plus** 的 Markdown 筆記骨架。建議搭配實際源碼閱讀，把每個章節的 `README.md` 當成固定模板填寫。

## 建議使用方式

1. 先完成 `00_總覽與讀碼策略`，建立讀碼規則。
2. 再閱讀 `01` ~ `09`，理解專案工程與元件庫入口。
3. 接著閱讀 `10` ~ `27`，拆解元件、指令、工具、樣式、型別與測試。
4. 最後進入 `28` ~ `39`，做高階專題、仿寫與企業後台封裝。
5. `99_總結` 用來整理最終成果、回查索引與下一階段學習計畫。

## 章節索引


- [00_總覽與讀碼策略](./00_總覽與讀碼策略/README.md)
- [01_專案啟動與版本選擇](./01_專案啟動與版本選擇/README.md)
- [02_根目錄與工程設定](./02_根目錄與工程設定/README.md)
- [03_package與依賴分析](./03_package與依賴分析/README.md)
- [04_build_打包腳本與建置流程](./04_build_打包腳本與建置流程/README.md)
- [05_dist_打包產物分析](./05_dist_打包產物分析/README.md)
- [06_src_入口與插件機制](./06_src_入口與插件機制/README.md)
- [07_元件註冊機制](./07_元件註冊機制/README.md)
- [08_全域配置與globalProperties](./08_全域配置與globalProperties/README.md)
- [09_元件庫整體設計模式](./09_元件庫整體設計模式/README.md)
- [10_src-components_元件總覽](./10_src-components_元件總覽/README.md)
- [11_基礎通用元件](./11_基礎通用元件/README.md)
- [12_布局與容器元件](./12_布局與容器元件/README.md)
- [13_表單與輸入元件](./13_表單與輸入元件/README.md)
- [14_表單驗證系統專題](./14_表單驗證系統專題/README.md)
- [15_資料展示與資料操作元件](./15_資料展示與資料操作元件/README.md)
- [16_導航元件](./16_導航元件/README.md)
- [17_回饋_彈層_命令式元件](./17_回饋_彈層_命令式元件/README.md)
- [18_業務型與增強型元件](./18_業務型與增強型元件/README.md)
- [19_src-directives_自訂指令](./19_src-directives_自訂指令/README.md)
- [20_src-utils_工具函式](./20_src-utils_工具函式/README.md)
- [21_src-mixins_混入與共用邏輯](./21_src-mixins_混入與共用邏輯/README.md)
- [22_src-locale_國際化](./22_src-locale_國際化/README.md)
- [23_src-styles_樣式系統](./23_src-styles_樣式系統/README.md)
- [24_types_型別宣告](./24_types_型別宣告/README.md)
- [25_examples_範例與Demo](./25_examples_範例與Demo/README.md)
- [26_test_測試](./26_test_測試/README.md)
- [27_assets_靜態資源](./27_assets_靜態資源/README.md)
- [28_高階專題_元件API設計](./28_高階專題_元件API設計/README.md)
- [29_高階專題_受控與非受控狀態](./29_高階專題_受控與非受控狀態/README.md)
- [30_高階專題_彈層與定位系統](./30_高階專題_彈層與定位系統/README.md)
- [31_高階專題_命令式API設計](./31_高階專題_命令式API設計/README.md)
- [32_高階專題_表單架構設計](./32_高階專題_表單架構設計/README.md)
- [33_高階專題_樣式主題與PrefixCls](./33_高階專題_樣式主題與PrefixCls/README.md)
- [34_高階專題_Mixin與CompositionAPI重構](./34_高階專題_Mixin與CompositionAPI重構/README.md)
- [35_高階專題_測試反推元件規格](./35_高階專題_測試反推元件規格/README.md)
- [36_仿寫與重構](./36_仿寫與重構/README.md)
- [37_迷你元件庫實作](./37_迷你元件庫實作/README.md)
- [38_企業後台元件封裝實戰](./38_企業後台元件封裝實戰/README.md)
- [39_ViewUIPlus設計模式總結](./39_ViewUIPlus設計模式總結/README.md)
- [99_總結](./99_總結/README.md)

## 固定筆記格式建議

每次讀碼時，建議至少留下以下資訊：

- 源碼位置
- 這段程式在整體架構中的角色
- 對外 API：props、events、slots、methods
- 內部狀態：data、computed、watch、provide/inject、composables
- 互動流程：使用者操作 → 事件 → 狀態變化 → UI 更新
- 可仿寫點
- 可回查問題

