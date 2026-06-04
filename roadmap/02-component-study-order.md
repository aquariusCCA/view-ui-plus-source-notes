# Component Study Order

本文件定義 View UI Plus 元件原始碼的學習順序。它不是只列核心 25 個元件，而是分成兩層：

- 主學習順序：以可獨立理解的父元件或能力群組為單位，避免把子元件拆成沒有上下文的章節。
- 全量元件盤點：以 `origin/source/view-ui-plus-v1.3.20/src/components/index.js` 的 128 個公開 export 為準，逐一列出並掛到對應學習單元。

## 來源與規則

| 項目 | 規則 |
|---|---|
| 全量來源 | `src/components/index.js` 的 `export { default as ... }` |
| Demo 參考 | `examples/main.js` 的 router path；只用來輔助學習，不作為全量來源 |
| 子元件 | 仍列入全量盤點，但跟著父元件一起讀，例如 `Option` 跟 `Select` |
| 優先級 | `P0` 是原本核心 25 個；`P1` 是常用補齊；`P2` 是進階/業務型；`隨 Px/元件` 代表跟父元件同批學 |

## 主學習順序

| 階段 | 學習單元 | 重點 |
|---:|---|---|
| 1 | `Icon`, `Button`, `Tag`, `Alert`, `Badge` | 最小可視元件、props、slots、class 命名、install/export 模式 |
| 2 | `Input`, `Radio`, `Checkbox`, `Switch`, `Select` | `v-model`、group 注入、表單值同步、dropdown/option 管理 |
| 3 | `Tooltip`, `Poptip`, `Modal`, `Drawer`, `Message`, `Notice` | overlay、portal/transfer、全域 API、z-index、confirm 類互動 |
| 4 | `Card`, `List`, `Table`, `Page` | 資料展示、render/slot、分頁狀態、複雜表格資料流 |
| 5 | `Form`, `Upload`, `DatePicker`, `Tree`, `Menu` | 表單驗證、檔案上傳、日期面板、樹狀資料、導覽狀態 |
| 6 | `Layout`, `Grid`, `Space`, `Divider`, `Affix`, `BackTop`, `Split` | 版面容器、響應式配置、固定定位、分割面板 |
| 7 | `InputNumber`, `AutoComplete`, `Cascader`, `TimePicker`, `Time`, `Slider`, `Rate`, `ColorPicker`, `Transfer`, `TreeSelect`, `City`, `WordCount` | 表單輸入補齊、複合選擇器、時間/數值/地區/字數類能力 |
| 8 | `Dropdown`, `Breadcrumb`, `Anchor`, `Tabs`, `Steps`, `Timeline`, `PageHeader`, `Scroll`, `ScrollTop`, `ScrollIntoView` | 導覽、錨點、頁面定位、分段流程與滾動工具 |
| 9 | `Progress`, `Spin`, `Skeleton`, `Circle`, `Avatar`, `AvatarList`, `Image`, `Carousel`, `Collapse`, `Cell`, `Calendar`, `Typography`, `Ellipsis`, `Result`, `Exception` | 顯示型元件、載入狀態、媒體、折疊、排版、結果頁 |
| 10 | `Notification`, `LoadingBar`, `TablePaste`, `TagSelect`, `DescriptionList`, `CountDown`, `CountUp`, `Numeral`, `NumberInfo`, `Trend`, `FooterToolbar`, `GlobalFooter`, `Login`, `Auth`, `Copy` | 進階回饋、企業/業務元件、資料貼上、登入表單、複製工具 |

## 全量元件盤點

| Export | 學習單元 | 角色 | 優先級 | Demo |
|---|---|---|---|---|
| `Affix` | `Affix` | 主元件 | P1 | `/affix` |
| `Alert` | `Alert` | 主元件 | P0 | `/alert` |
| `Anchor` | `Anchor` | 主元件 | P1 | `/anchor` |
| `AnchorLink` | `Anchor` | 子元件 | 隨 P1/Anchor | via `Anchor` |
| `Auth` | `Auth` | 主元件 | P2 | `/auth` |
| `AutoComplete` | `AutoComplete` | 主元件 | P1 | `/auto-complete` |
| `Avatar` | `Avatar` | 主元件 | P1 | `/avatar` |
| `AvatarList` | `AvatarList` | 主元件 | P2 | `/avatar-list` |
| `BackTop` | `BackTop` | 主元件 | P1 | `/backtop` |
| `Badge` | `Badge` | 主元件 | P0 | `/badge` |
| `Breadcrumb` | `Breadcrumb` | 主元件 | P1 | `/breadcrumb` |
| `BreadcrumbItem` | `Breadcrumb` | 子元件 | 隨 P1/Breadcrumb | via `Breadcrumb` |
| `Button` | `Button` | 主元件 | P0 | `/button` |
| `ButtonGroup` | `Button` | 子元件 | 隨 P0/Button | via `Button` |
| `Calendar` | `Calendar` | 主元件 | P2 | `/calendar` |
| `Captcha` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `Card` | `Card` | 主元件 | P0 | `/card` |
| `Carousel` | `Carousel` | 主元件 | P1 | `/carousel` |
| `CarouselItem` | `Carousel` | 子元件 | 隨 P1/Carousel | via `Carousel` |
| `Cascader` | `Cascader` | 主元件 | P1 | `/cascader` |
| `Cell` | `Cell` | 主元件 | P1 | `/cell` |
| `CellGroup` | `Cell` | 子元件 | 隨 P1/Cell | via `Cell` |
| `Checkbox` | `Checkbox` | 主元件 | P0 | `/checkbox` |
| `CheckboxGroup` | `Checkbox` | 子元件 | 隨 P0/Checkbox | via `Checkbox` |
| `Circle` | `Circle` | 主元件 | P1 | `/circle` |
| `City` | `City` | 主元件 | P2 | `/city` |
| `Col` | `Grid` | 版面子元件 | 隨 P1/Grid | via `Grid` |
| `Collapse` | `Collapse` | 主元件 | P1 | `/collapse` |
| `ColorPicker` | `ColorPicker` | 主元件 | P1 | `/color-picker` |
| `Content` | `Layout` | 版面子元件 | 隨 P1/Layout | via `Layout` |
| `Copy` | `Copy` | 工具型元件 | P2 | `/copy` |
| `CountDown` | `CountDown` | 主元件 | P2 | `/count-down` |
| `CountUp` | `CountUp` | 主元件 | P2 | `/count-up` |
| `DatePicker` | `DatePicker` | 主元件 | P0 | `/date` |
| `Description` | `DescriptionList` | 子元件 | 隨 P2/DescriptionList | via `DescriptionList` |
| `DescriptionList` | `DescriptionList` | 主元件 | P2 | `/description-list` |
| `Divider` | `Divider` | 主元件 | P1 | `/divider` |
| `Drawer` | `Drawer` | 主元件 | P0 | `/drawer` |
| `Dropdown` | `Dropdown` | 主元件 | P1 | `/dropdown` |
| `DropdownItem` | `Dropdown` | 子元件 | 隨 P1/Dropdown | via `Dropdown` |
| `DropdownMenu` | `Dropdown` | 子元件 | 隨 P1/Dropdown | via `Dropdown` |
| `Ellipsis` | `Ellipsis` | 主元件 | P2 | `/ellipsis` |
| `Email` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `Exception` | `Exception` | 主元件 | P2 | `/exception` |
| `Footer` | `Layout` | 版面子元件 | 隨 P1/Layout | via `Layout` |
| `FooterToolbar` | `FooterToolbar` | 主元件 | P2 | `/footer-toolbar` |
| `Form` | `Form` | 主元件 | P0 | `/form` |
| `FormItem` | `Form` | 子元件 | 隨 P0/Form | via `Form` |
| `GlobalFooter` | `GlobalFooter` | 主元件 | P2 | `/global-footer` |
| `Grid` | `Grid` | 主元件 | P1 | `/grid` |
| `GridItem` | `Grid` | 子元件 | 隨 P1/Grid | `/grid-component` |
| `Header` | `Layout` | 版面子元件 | 隨 P1/Layout | via `Layout` |
| `Icon` | `Icon` | 主元件 | P0 | `/icon` |
| `Image` | `Image` | 主元件 | P1 | `/image` |
| `ImagePreview` | `Image` | 子元件 | 隨 P1/Image | via `Image` |
| `Input` | `Input` | 主元件 | P0 | `/input` |
| `InputNumber` | `InputNumber` | 主元件 | P1 | `/input-number` |
| `Layout` | `Layout` | 主元件 | P1 | `/layout` |
| `Link` | `Typography` | 排版子元件 | 隨 P2/Typography | via `Typography` |
| `List` | `List` | 主元件 | P0 | `/list` |
| `ListItem` | `List` | 子元件 | 隨 P0/List | via `List` |
| `ListItemMeta` | `List` | 子元件 | 隨 P0/List | via `List` |
| `LoadingBar` | `LoadingBar` | API/服務型元件 | P2 | `/loading-bar` |
| `Login` | `Login` | 主元件 | P2 | `/login` |
| `Menu` | `Menu` | 主元件 | P0 | `/menu` |
| `MenuGroup` | `Menu` | 子元件 | 隨 P0/Menu | via `Menu` |
| `MenuItem` | `Menu` | 子元件 | 隨 P0/Menu | via `Menu` |
| `Message` | `Message` | API/服務型元件 | P0 | `/message` |
| `Mobile` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `Modal` | `Modal` | 主元件/API | P0 | `/modal` |
| `Notice` | `Notice` | API/服務型元件 | P0 | `/notice` |
| `Notification` | `Notification` | 主元件 | P2 | `/notification` |
| `NotificationItem` | `Notification` | 子元件 | 隨 P2/Notification | via `Notification` |
| `NotificationTab` | `Notification` | 子元件 | 隨 P2/Notification | via `Notification` |
| `NumberInfo` | `NumberInfo` | 主元件 | P2 | `/number-info` |
| `Numeral` | `Numeral` | 主元件 | P2 | `/numeral` |
| `Option` | `Select` | 子元件 | 隨 P0/Select | via `Select` |
| `OptionGroup` | `Select` | 子元件 | 隨 P0/Select | via `Select` |
| `Page` | `Page` | 主元件 | P0 | `/page` |
| `PageHeader` | `PageHeader` | 主元件 | P1 | `/page-header` |
| `Panel` | `Collapse` | 子元件 | 隨 P1/Collapse | via `Collapse` |
| `Paragraph` | `Typography` | 排版子元件 | 隨 P2/Typography | via `Typography` |
| `Password` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `Poptip` | `Poptip` | 主元件 | P0 | `/poptip` |
| `Progress` | `Progress` | 主元件 | P1 | `/progress` |
| `Radio` | `Radio` | 主元件 | P0 | `/radio` |
| `RadioGroup` | `Radio` | 子元件 | 隨 P0/Radio | via `Radio` |
| `Rate` | `Rate` | 主元件 | P1 | `/rate` |
| `Result` | `Result` | 主元件 | P2 | `/result` |
| `Row` | `Grid` | 版面子元件 | 隨 P1/Grid | via `Grid` |
| `Scroll` | `Scroll` | 主元件 | P1 | `/scroll` |
| `ScrollIntoView` | `ScrollIntoView` | 工具型元件 | P2 | `/scroll-into-view` |
| `ScrollTop` | `ScrollTop` | 工具型元件 | P2 | `/scroll-top` |
| `Select` | `Select` | 主元件 | P0 | `/select` |
| `Sider` | `Layout` | 版面子元件 | 隨 P1/Layout | via `Layout` |
| `Skeleton` | `Skeleton` | 主元件 | P1 | `/skeleton` |
| `SkeletonItem` | `Skeleton` | 子元件 | 隨 P1/Skeleton | via `Skeleton` |
| `Slider` | `Slider` | 主元件 | P1 | `/slider` |
| `Space` | `Space` | 主元件 | P1 | `/space` |
| `Spin` | `Spin` | 主元件/API | P1 | `/spin` |
| `Split` | `Split` | 主元件 | P1 | `/split` |
| `Step` | `Steps` | 子元件 | 隨 P1/Steps | via `Steps` |
| `Steps` | `Steps` | 主元件 | P1 | `/steps` |
| `Submenu` | `Menu` | 子元件 | 隨 P0/Menu | via `Menu` |
| `Submit` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `Switch` | `Switch` | 主元件 | P0 | `/switch` |
| `Table` | `Table` | 主元件 | P0 | `/table` |
| `TablePaste` | `TablePaste` | 主元件 | P2 | `/table-paste` |
| `TabPane` | `Tabs` | 子元件 | 隨 P1/Tabs | via `Tabs` |
| `Tabs` | `Tabs` | 主元件 | P1 | `/tabs` |
| `Tag` | `Tag` | 主元件 | P0 | `/tag` |
| `TagSelect` | `TagSelect` | 主元件 | P2 | `/tag-select` |
| `TagSelectOption` | `TagSelect` | 子元件 | 隨 P2/TagSelect | via `TagSelect` |
| `Text` | `Typography` | 排版子元件 | 隨 P2/Typography | via `Typography` |
| `Time` | `Time` | 主元件 | P1 | `/time` |
| `Timeline` | `Timeline` | 主元件 | P1 | `/timeline` |
| `TimelineItem` | `Timeline` | 子元件 | 隨 P1/Timeline | via `Timeline` |
| `TimePicker` | `TimePicker` | 主元件 | P1 | via `/date` |
| `Title` | `Typography` | 排版子元件 | 隨 P2/Typography | via `Typography` |
| `Tooltip` | `Tooltip` | 主元件 | P0 | `/tooltip` |
| `Transfer` | `Transfer` | 主元件 | P1 | `/transfer` |
| `Tree` | `Tree` | 主元件 | P0 | `/tree` |
| `TreeSelect` | `TreeSelect` | 主元件 | P2 | `/tree-select` |
| `Trend` | `Trend` | 主元件 | P2 | `/trend` |
| `Typography` | `Typography` | 主元件 | P2 | `/typography` |
| `Upload` | `Upload` | 主元件 | P0 | `/upload` |
| `UserName` | `Login` | 表單子元件 | 隨 P2/Login | via `Login` |
| `WordCount` | `WordCount` | 主元件 | P2 | `/word-count` |