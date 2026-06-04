# Progress Tracker

本文件追蹤 View UI Plus 元件原始碼學習進度。全量清單以 `origin/source/view-ui-plus-v1.3.20/src/components/index.js` 的 128 個公開 export 為準。

## 優先級來源

本檔的 `P0`、`P1`、`P2`、`隨 Px/元件` 優先級沿用 `roadmap/02-component-study-order.md` 的「來源與規則」：
- `P0`：原本核心 25 個元件
- `P1`：常用補齊
- `P2`：進階/業務型元件
- `隨 Px/元件`：子元件或關聯元件，跟父元件同批學

## 狀態定義

| 狀態 | 定義 |
|---|---|
| 未開始 | 尚未閱讀或整理 |
| 閱讀中 | 已開始看 source/demo/type，但筆記未完成 |
| 已整理 | 已完成 source notes、API 關係與基本範例 |
| 已驗證 | 已補足測試/範例驗證或能穩定重現主要行為 |
| 延後 | 暫不納入近期學習，但仍保留追蹤 |

## 彙總

| 項目 | 數量 | 備註 |
|---|---:|---|
| 公開 export | 128 | 來自 `src/components/index.js` |
| 第一輪核心元件 | 25 | 沿用原 roadmap 的核心學習範圍 |
| 目前預設狀態 | 128 未開始 | 後續逐項更新 |

## 全量進度表

| Export | 學習單元 | 角色 | 優先級 | 狀態 | 驗收重點 |
|---|---|---|---|---|---|
| `Affix` | `Affix` | 主元件 | P1 | 未開始 | fixed/offset/scroll target 行為 |
| `Alert` | `Alert` | 主元件 | P0 | 未開始 | type、show-icon、closable、slot fallback |
| `Anchor` | `Anchor` | 主元件 | P1 | 未開始 | active link、scroll offset、container |
| `AnchorLink` | `Anchor` | 子元件 | 隨 P1/Anchor | 未開始 | href/title 與父層註冊 |
| `Auth` | `Auth` | 主元件 | P2 | 未開始 | 權限判斷與 slot 顯示 |
| `AutoComplete` | `AutoComplete` | 主元件 | P1 | 未開始 | filter、remote data、Option 整合 |
| `Avatar` | `Avatar` | 主元件 | P1 | 未開始 | size、shape、icon/src fallback |
| `AvatarList` | `AvatarList` | 主元件 | P2 | 未開始 | overflow 顯示與 Avatar 組合 |
| `BackTop` | `BackTop` | 主元件 | P1 | 未開始 | scroll threshold、target、動畫 |
| `Badge` | `Badge` | 主元件 | P0 | 未開始 | count、dot、overflow-count、slot 包裹 |
| `Breadcrumb` | `Breadcrumb` | 主元件 | P1 | 未開始 | separator、item 註冊、link 行為 |
| `BreadcrumbItem` | `Breadcrumb` | 子元件 | 隨 P1/Breadcrumb | 未開始 | href/to 與 separator |
| `Button` | `Button` | 主元件 | P0 | 未開始 | type、size、loading、disabled、icon、slot |
| `ButtonGroup` | `Button` | 子元件 | 隨 P0/Button | 未開始 | size/shape 傳遞與 class 組合 |
| `Calendar` | `Calendar` | 主元件 | P2 | 未開始 | month/year panel、事件資料 |
| `Captcha` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login.Item 註冊與驗證 |
| `Card` | `Card` | 主元件 | P0 | 未開始 | title/extra/header slots、padding/shadow |
| `Carousel` | `Carousel` | 主元件 | P1 | 未開始 | autoplay、loop、trigger、indicator |
| `CarouselItem` | `Carousel` | 子元件 | 隨 P1/Carousel | 未開始 | item 註冊與動畫狀態 |
| `Cascader` | `Cascader` | 主元件 | P1 | 未開始 | options、lazy、filter、value path |
| `Cell` | `Cell` | 主元件 | P1 | 未開始 | title/label/extra、selected、link |
| `CellGroup` | `Cell` | 子元件 | 隨 P1/Cell | 未開始 | group 樣式與 slot 組合 |
| `Checkbox` | `Checkbox` | 主元件 | P0 | 未開始 | checked、indeterminate、disabled、group |
| `CheckboxGroup` | `Checkbox` | 子元件 | 隨 P0/Checkbox | 未開始 | modelValue 陣列同步 |
| `Circle` | `Circle` | 主元件 | P1 | 未開始 | percent、stroke、dashboard/circle render |
| `City` | `City` | 主元件 | P2 | 未開始 | 地區資料、選擇值、Select/Cascader 關係 |
| `Col` | `Grid` | 版面子元件 | 隨 P1/Grid | 未開始 | span、offset、responsive props |
| `Collapse` | `Collapse` | 主元件 | P1 | 未開始 | accordion、active key、Panel 註冊 |
| `ColorPicker` | `ColorPicker` | 主元件 | P1 | 未開始 | format、alpha、palette、dropdown |
| `Content` | `Layout` | 版面子元件 | 隨 P1/Layout | 未開始 | layout class 與容器語義 |
| `Copy` | `Copy` | 工具型元件 | P2 | 未開始 | clipboard、成功/失敗回饋 |
| `CountDown` | `CountDown` | 主元件 | P2 | 未開始 | target time、format、timer cleanup |
| `CountUp` | `CountUp` | 主元件 | P2 | 未開始 | easing、precision、start/end |
| `DatePicker` | `DatePicker` | 主元件 | P0 | 未開始 | date/range、panel、format、disabledDate |
| `Description` | `DescriptionList` | 子元件 | 隨 P2/DescriptionList | 未開始 | term/content slot |
| `DescriptionList` | `DescriptionList` | 主元件 | P2 | 未開始 | layout、responsive、Description 組合 |
| `Divider` | `Divider` | 主元件 | P1 | 未開始 | orientation、dashed、vertical |
| `Drawer` | `Drawer` | 主元件 | P0 | 未開始 | placement、mask、closable、body scroll |
| `Dropdown` | `Dropdown` | 主元件 | P1 | 未開始 | trigger、placement、visible、transfer |
| `DropdownItem` | `Dropdown` | 子元件 | 隨 P1/Dropdown | 未開始 | name、disabled、selected、click |
| `DropdownMenu` | `Dropdown` | 子元件 | 隨 P1/Dropdown | 未開始 | menu slot 與事件轉發 |
| `Ellipsis` | `Ellipsis` | 主元件 | P2 | 未開始 | line clamp、tooltip、expand |
| `Email` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login.Item 註冊與驗證 |
| `Exception` | `Exception` | 主元件 | P2 | 未開始 | typeConfig、slot/action |
| `Footer` | `Layout` | 版面子元件 | 隨 P1/Layout | 未開始 | layout class 與容器語義 |
| `FooterToolbar` | `FooterToolbar` | 主元件 | P2 | 未開始 | fixed bottom、actions slot |
| `Form` | `Form` | 主元件 | P0 | 未開始 | model、rules、validate/reset、provide/inject |
| `FormItem` | `Form` | 子元件 | 隨 P0/Form | 未開始 | prop path、rule trigger、error 狀態 |
| `GlobalFooter` | `GlobalFooter` | 主元件 | P2 | 未開始 | links/copyright slot |
| `Grid` | `Grid` | 主元件 | P1 | 未開始 | Grid/GridItem API 與 Row/Col 差異 |
| `GridItem` | `Grid` | 子元件 | 隨 P1/Grid | 未開始 | item layout 與 click |
| `Header` | `Layout` | 版面子元件 | 隨 P1/Layout | 未開始 | layout class 與容器語義 |
| `Icon` | `Icon` | 主元件 | P0 | 未開始 | icon font、custom、class prefix |
| `Image` | `Image` | 主元件 | P1 | 未開始 | src、fit、lazy、preview |
| `ImagePreview` | `Image` | 子元件 | 隨 P1/Image | 未開始 | viewer、toolbar、close/zoom |
| `Input` | `Input` | 主元件 | P0 | 未開始 | v-model、clearable、prefix/suffix、textarea |
| `InputNumber` | `InputNumber` | 主元件 | P1 | 未開始 | min/max、step、precision、formatter/parser |
| `Layout` | `Layout` | 主元件 | P1 | 未開始 | Header/Sider/Content/Footer 結構 |
| `Link` | `Typography` | 排版子元件 | 隨 P2/Typography | 未開始 | href/disabled 與 Typography props |
| `List` | `List` | 主元件 | P0 | 未開始 | item layout、border、loading、slot |
| `ListItem` | `List` | 子元件 | 隨 P0/List | 未開始 | actions/meta/extra slot |
| `ListItemMeta` | `List` | 子元件 | 隨 P0/List | 未開始 | avatar/title/description |
| `LoadingBar` | `LoadingBar` | API/服務型元件 | P2 | 未開始 | start/update/finish/error API |
| `Login` | `Login` | 主元件 | P2 | 未開始 | LoginItem、Form 整合、slots |
| `Menu` | `Menu` | 主元件 | P0 | 未開始 | active/open、mode、theme、嵌套 |
| `MenuGroup` | `Menu` | 子元件 | 隨 P0/Menu | 未開始 | group title 與 item 結構 |
| `MenuItem` | `Menu` | 子元件 | 隨 P0/Menu | 未開始 | name、active、disabled、click |
| `Message` | `Message` | API/服務型元件 | P0 | 未開始 | instance queue、duration、type API |
| `Mobile` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login.Item 註冊與驗證 |
| `Modal` | `Modal` | 主元件/API | P0 | 未開始 | v-model、footer、confirm API、scroll lock |
| `Notice` | `Notice` | API/服務型元件 | P0 | 未開始 | notification instance、type、duration |
| `Notification` | `Notification` | 主元件 | P2 | 未開始 | tab/item 組合、badge/count |
| `NotificationItem` | `Notification` | 子元件 | 隨 P2/Notification | 未開始 | item schema 與事件 |
| `NotificationTab` | `Notification` | 子元件 | 隨 P2/Notification | 未開始 | tab state 與列表渲染 |
| `NumberInfo` | `NumberInfo` | 主元件 | P2 | 未開始 | total/subTotal/status/trend |
| `Numeral` | `Numeral` | 主元件 | P2 | 未開始 | format、value、locale |
| `Option` | `Select` | 子元件 | 隨 P0/Select | 未開始 | value/label、disabled、select 註冊 |
| `OptionGroup` | `Select` | 子元件 | 隨 P0/Select | 未開始 | group label 與 option 分組 |
| `Page` | `Page` | 主元件 | P0 | 未開始 | current、page-size、total、change events |
| `PageHeader` | `PageHeader` | 主元件 | P1 | 未開始 | back、breadcrumb、title/content slot |
| `Panel` | `Collapse` | 子元件 | 隨 P1/Collapse | 未開始 | name、hide-arrow、slot |
| `Paragraph` | `Typography` | 排版子元件 | 隨 P2/Typography | 未開始 | editable/copyable/ellipsis |
| `Password` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login.Item 註冊與驗證 |
| `Poptip` | `Poptip` | 主元件 | P0 | 未開始 | confirm、title/content、trigger |
| `Progress` | `Progress` | 主元件 | P1 | 未開始 | percent、status、stroke、text |
| `Radio` | `Radio` | 主元件 | P0 | 未開始 | checked、value、group、button style |
| `RadioGroup` | `Radio` | 子元件 | 隨 P0/Radio | 未開始 | modelValue、button/vertical、size |
| `Rate` | `Rate` | 主元件 | P1 | 未開始 | allow-half、clearable、custom icon |
| `Result` | `Result` | 主元件 | P2 | 未開始 | type、title、description、actions |
| `Row` | `Grid` | 版面子元件 | 隨 P1/Grid | 未開始 | gutter、align、justify |
| `Scroll` | `Scroll` | 主元件 | P1 | 未開始 | on-reach、loading、pull/refresh |
| `ScrollIntoView` | `ScrollIntoView` | 工具型元件 | P2 | 未開始 | target 定位與滾動 |
| `ScrollTop` | `ScrollTop` | 工具型元件 | P2 | 未開始 | visibility threshold、container |
| `Select` | `Select` | 主元件 | P0 | 未開始 | value、multiple、filterable、remote |
| `Sider` | `Layout` | 版面子元件 | 隨 P1/Layout | 未開始 | collapsible、breakpoint、trigger |
| `Skeleton` | `Skeleton` | 主元件 | P1 | 未開始 | loading、animated、avatar/title/paragraph |
| `SkeletonItem` | `Skeleton` | 子元件 | 隨 P1/Skeleton | 未開始 | variant 與尺寸 |
| `Slider` | `Slider` | 主元件 | P1 | 未開始 | min/max、range、marks、tooltip |
| `Space` | `Space` | 主元件 | P1 | 未開始 | size、direction、wrap、align |
| `Spin` | `Spin` | 主元件/API | P1 | 未開始 | fix、size、slot、global spin |
| `Split` | `Split` | 主元件 | P1 | 未開始 | mode、min/max、drag resize |
| `Step` | `Steps` | 子元件 | 隨 P1/Steps | 未開始 | title/content/icon/status |
| `Steps` | `Steps` | 主元件 | P1 | 未開始 | current、direction、status |
| `Submenu` | `Menu` | 子元件 | 隨 P0/Menu | 未開始 | open state、title slot、nested |
| `Submit` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login submit flow |
| `Switch` | `Switch` | 主元件 | P0 | 未開始 | true-value、false-value、loading、disabled |
| `Table` | `Table` | 主元件 | P0 | 未開始 | columns/data、render/slot、sort/filter、fixed |
| `TablePaste` | `TablePaste` | 主元件 | P2 | 未開始 | paste parsing、Table 整合 |
| `TabPane` | `Tabs` | 子元件 | 隨 P1/Tabs | 未開始 | name/label、closable、lazy |
| `Tabs` | `Tabs` | 主元件 | P1 | 未開始 | active key、ink bar、editable |
| `Tag` | `Tag` | 主元件 | P0 | 未開始 | closable、color、checkable、slot |
| `TagSelect` | `TagSelect` | 主元件 | P2 | 未開始 | multiple、expand、option 管理 |
| `TagSelectOption` | `TagSelect` | 子元件 | 隨 P2/TagSelect | 未開始 | value、checked、disabled |
| `Text` | `Typography` | 排版子元件 | 隨 P2/Typography | 未開始 | type、strong、copyable、ellipsis |
| `Time` | `Time` | 主元件 | P1 | 未開始 | relative time、interval、locale |
| `Timeline` | `Timeline` | 主元件 | P1 | 未開始 | pending、reverse、mode |
| `TimelineItem` | `Timeline` | 子元件 | 隨 P1/Timeline | 未開始 | color/dot、content slot |
| `TimePicker` | `TimePicker` | 主元件 | P1 | 未開始 | time/range、format、steps |
| `Title` | `Typography` | 排版子元件 | 隨 P2/Typography | 未開始 | level、editable/copyable |
| `Tooltip` | `Tooltip` | 主元件 | P0 | 未開始 | trigger、placement、transfer、Popper |
| `Transfer` | `Transfer` | 主元件 | P1 | 未開始 | source/target、filter、operations |
| `Tree` | `Tree` | 主元件 | P0 | 未開始 | data、check/select/expand、render |
| `TreeSelect` | `TreeSelect` | 主元件 | P2 | 未開始 | Tree + Select 整合、checked strategy |
| `Trend` | `Trend` | 主元件 | P2 | 未開始 | flag、reverseColor、prefix/suffix |
| `Typography` | `Typography` | 主元件 | P2 | 未開始 | Title/Text/Paragraph/Link 共用 props |
| `Upload` | `Upload` | 主元件 | P0 | 未開始 | ajax、before-upload、file-list、progress |
| `UserName` | `Login` | 表單子元件 | 隨 P2/Login | 未開始 | Login.Item 註冊與驗證 |
| `WordCount` | `WordCount` | 主元件 | P2 | 未開始 | count/max、Input 整合 |

## 練習追蹤

| 練習 | 目標 | 進度 | 狀態 |
|---|---|---:|---|
| `01-clone-practice` | 從 P0 選 8 到 10 個元件做最小 clone | 0 / 10 | 未開始 |
| `02-refactor-practice` | 選 1 個複雜元件重構內部資料流筆記 | 0 / 1 | 未開始 |
| `03-enterprise-wrapper` | 選 1 個企業型元件包裝成業務用法 | 0 / 1 | 未開始 |
