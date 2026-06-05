# package.json 與 package-lock.json 教學筆記

這篇筆記用一個實際問題開始：

```text
我已經把 @kevinxiao0210/myui 的 0.1.1 發佈到 npm，
但是 apps/02-refactor-practice 重新安裝時，卻還是看到 0.1.0。
```

這個問題不是只跟某一個套件有關，而是 npm 專案裡非常常見的依賴管理觀念：

```text
package.json 宣告「允許安裝什麼」
package-lock.json 記錄「實際安裝了什麼」
```

如果只看 `package.json`，很容易誤以為 npm 每次都會自動裝到最新版本；但只要專案裡有 `package-lock.json`，實際安裝結果就會受到 lockfile 影響。

## `package.json` 是什麼？

`package.json` 是 npm 專案的描述檔。它記錄專案名稱、版本、指令、依賴套件、入口檔案等資訊。

常見欄位如下：

| 欄位 | 作用 |
| --- | --- |
| `name` | 套件或專案名稱 |
| `version` | 目前套件版本，發佈到 npm 時很重要 |
| `scripts` | 可執行指令，例如 `npm run dev`、`npm run build` |
| `dependencies` | 執行時需要的依賴 |
| `devDependencies` | 開發、建置、測試時才需要的依賴 |
| `peerDependencies` | 要求使用者專案自己提供的依賴 |
| `main` | CommonJS 入口 |
| `module` | ES Module 入口 |
| `types` | TypeScript 型別入口 |
| `exports` | 明確定義哪些路徑可以被 import |

以應用程式來說，最常看的通常是 `dependencies` 與 `devDependencies`：

```json
{
  "dependencies": {
    "@kevinxiao0210/myui": "^0.1.0",
    "vue": "^3.5.34"
  },
  "devDependencies": {
    "vite": "^8.0.6",
    "typescript": "~6.0.1"
  }
}
```

這裡要注意一件事：

```text
dependencies 裡寫的版本，不一定等於 node_modules 裡實際安裝的版本。
```

例如：

```json
{
  "dependencies": {
    "@kevinxiao0210/myui": "^0.1.0"
  }
}
```

這不是說一定安裝 `0.1.0`，而是說允許安裝符合 `^0.1.0` 這個範圍的版本。

## `package-lock.json` 是什麼？

`package-lock.json` 是 npm 根據實際安裝結果產生的 lockfile。

它記錄的不是「我想安裝什麼」，而是「這次真的安裝出了什麼」。

在 lockfile 裡，通常會看到類似這樣的內容：

```json
{
  "node_modules/@kevinxiao0210/myui": {
    "version": "0.1.0",
    "resolved": "https://registry.npmjs.org/@kevinxiao0210/myui/-/myui-0.1.0.tgz",
    "integrity": "sha512-..."
  }
}
```

幾個重要欄位：

| 欄位 | 作用 |
| --- | --- |
| `version` | 實際安裝的版本 |
| `resolved` | 實際下載的 tarball 位置 |
| `integrity` | 用來驗證下載內容是否一致 |
| `dependencies` | 該套件自己的依賴 |

所以 `package-lock.json` 的主要用途是讓不同環境安裝出相同的依賴樹。

例如：

```text
你的電腦
同事的電腦
CI/CD 環境
正式部署環境
```

這些環境都可以根據同一份 lockfile 安裝到一致的套件版本，降低「我這邊可以，你那邊不行」的機率。

## 版本範圍怎麼看？

`package.json` 裡常見的版本寫法有幾種。

### 固定版本

```json
{
  "dependencies": {
    "some-package": "1.2.3"
  }
}
```

這表示只允許 `1.2.3`。

### caret：`^`

```json
{
  "dependencies": {
    "some-package": "^1.2.3"
  }
}
```

一般情況下，`^1.2.3` 代表允許安裝 `1.x.x` 範圍內相容的新版，但不升到 `2.0.0`。

例如可能允許：

```text
1.2.4
1.3.0
1.9.9
```

但不允許：

```text
2.0.0
```

不過 `0.x` 版本比較特殊。因為 `0.x` 通常代表套件還在早期階段，npm 會更保守。

例如：

```text
^0.1.0
```

通常允許：

```text
0.1.1
0.1.2
```

但不允許：

```text
0.2.0
1.0.0
```

### tilde：`~`

```json
{
  "dependencies": {
    "some-package": "~1.2.3"
  }
}
```

`~1.2.3` 通常只允許 patch 版本更新。

例如可能允許：

```text
1.2.4
1.2.9
```

但不允許：

```text
1.3.0
2.0.0
```

### `latest`

`latest` 是 npm registry 上的 dist-tag，不一定永遠等於版本數字最大的版本，但一般情況下會指向最新穩定版。

可以用這些指令檢查：

```powershell
npm view @kevinxiao0210/myui version
npm view @kevinxiao0210/myui dist-tags
```

## `npm install`、`npm update`、`npm ci` 的差異

很多版本問題都來自於混淆這幾個指令。

### `npm install`

```powershell
npm install
```

這個指令通常用來根據目前的 `package.json` 與 `package-lock.json` 安裝依賴。

如果 lockfile 已經記錄某個套件是 `0.1.0`，而且這個版本仍然符合 `package.json` 的版本範圍，`npm install` 不一定會主動升級到 `0.1.1`。

所以 `npm install` 比較像是：

```text
把目前專案需要的依賴裝起來，並盡量維持 lockfile 記錄的結果。
```

### `npm install package@version`

```powershell
npm install @kevinxiao0210/myui@0.1.1
```

這是更新單一套件最明確的方式。

它會：

```text
更新 node_modules
更新 package.json
更新 package-lock.json
```

如果只是要把某個套件升到指定版本，這通常比刪除整份 lockfile 更乾淨。

### `npm update package`

```powershell
npm update @kevinxiao0210/myui
```

這會在 `package.json` 允許的版本範圍內更新套件。

例如 `package.json` 寫：

```json
{
  "dependencies": {
    "@kevinxiao0210/myui": "^0.1.0"
  }
}
```

如果 npm registry 上有 `0.1.1`，而且它符合 `^0.1.0`，那 `npm update @kevinxiao0210/myui` 就有機會把它更新到 `0.1.1`。

### `npm ci`

```powershell
npm ci
```

`npm ci` 通常用在 CI/CD。

它的重點是嚴格根據 `package-lock.json` 安裝，不用來隨機更新依賴。

適合：

```text
自動化測試
部署流程
需要高度重現性的環境
```

如果 `package.json` 和 `package-lock.json` 不一致，`npm ci` 會直接失敗，這也是它適合 CI 的原因。

## 回到實際案例

在 `apps/02-refactor-practice/package.json` 裡，依賴可能長這樣：

```json
{
  "dependencies": {
    "@kevinxiao0210/myui": "^0.1.0"
  }
}
```

這代表：

```text
這個專案允許使用 @kevinxiao0210/myui 的 0.1.x 相容版本。
```

所以 `0.1.1` 理論上符合這個範圍。

但是如果 `apps/02-refactor-practice/package-lock.json` 裡已經記錄：

```json
{
  "node_modules/@kevinxiao0210/myui": {
    "version": "0.1.0",
    "resolved": "https://registry.npmjs.org/@kevinxiao0210/myui/-/myui-0.1.0.tgz"
  }
}
```

那麼重新執行：

```powershell
npm install
```

不一定會升級到 `0.1.1`，因為 `0.1.0` 仍然符合 `^0.1.0`，而 lockfile 已經記錄目前實際安裝版本。

這就是為什麼：

```text
package.json 看起來允許 0.1.1
但實際安裝結果還是 0.1.0
```

## 正確更新單一套件

如果目標是把 `@kevinxiao0210/myui` 更新到 `0.1.1`，建議在 app 目錄執行：

```powershell
cd apps/02-refactor-practice
npm install @kevinxiao0210/myui@0.1.1
```

接著確認實際版本：

```powershell
npm ls @kevinxiao0210/myui
```

也可以檢查 lockfile 是否已更新：

```text
package-lock.json
  node_modules/@kevinxiao0210/myui
    version: 0.1.1
```

如果想先確認 npm registry 上目前版本：

```powershell
npm view @kevinxiao0210/myui version
npm view @kevinxiao0210/myui dist-tags
```

## 什麼時候要刪 `package-lock.json`？

刪除 `package-lock.json` 不是更新單一套件的首選。

因為刪掉 lockfile 後再執行：

```powershell
npm install
```

npm 會重新解析整棵依賴樹。這可能導致不只目標套件更新，其他依賴也一起變動。

比較適合刪除 lockfile 的情境通常是：

```text
依賴樹已經嚴重混亂
lockfile 和 package.json 長期不同步
專案明確想重新整理整套依賴
從其他 package manager 遷移回 npm
```

如果只是要更新單一套件，優先使用：

```powershell
npm install package@version
```

或：

```powershell
npm update package
```

## 常見誤解

### 誤解一：`package-lock.json` 是垃圾檔

不是。

`package-lock.json` 是專案依賴版本的實際紀錄。對應用程式來說，通常應該提交到 git。

它可以讓團隊與 CI 安裝出一致的依賴。

### 誤解二：`package.json` 寫 `^1.0.0` 就會每次自動裝最新版

不一定。

`^1.0.0` 只是版本範圍，實際安裝版本還會受到 lockfile 影響。

### 誤解三：重新執行 `npm install` 就等於更新套件

不一定。

`npm install` 通常是安裝與補齊依賴，不是主動更新所有依賴。

要更新指定套件，使用：

```powershell
npm install package@version
npm update package
```

### 誤解四：遇到版本問題就先刪 lockfile

不建議。

刪 lockfile 會讓整棵依賴樹重新解析，變動範圍比你想像的大。

先檢查：

```powershell
npm ls package
npm view package version
npm view package dist-tags
```

再決定要不要更新指定套件。

## 實務排查清單

遇到「明明有新版，但專案還裝舊版」時，可以照這個順序查。

### 1. 看 `package.json`

確認版本範圍：

```json
{
  "dependencies": {
    "@kevinxiao0210/myui": "^0.1.0"
  }
}
```

判斷新版是否符合這個範圍。

### 2. 看 `package-lock.json`

搜尋套件名稱：

```text
node_modules/@kevinxiao0210/myui
```

確認實際鎖定版本：

```json
{
  "version": "0.1.0"
}
```

### 3. 看目前實際安裝版本

```powershell
npm ls @kevinxiao0210/myui
```

### 4. 看 npm registry 上的版本

```powershell
npm view @kevinxiao0210/myui version
npm view @kevinxiao0210/myui dist-tags
```

### 5. 更新指定套件

```powershell
npm install @kevinxiao0210/myui@0.1.1
```

### 6. 再次確認

```powershell
npm ls @kevinxiao0210/myui
```

並確認 `package-lock.json` 裡的版本也已經變成 `0.1.1`。

## 總結

可以用這幾句話記住：

```text
package.json 是依賴需求與版本範圍
package-lock.json 是實際安裝結果
npm install 偏向重現目前依賴
npm install package@version 用來更新指定套件
npm update package 會在允許範圍內更新
npm ci 會嚴格根據 lockfile 安裝
```

所以在 `@kevinxiao0210/myui` 的案例裡，真正的重點不是 npm 沒看到 `0.1.1`，而是：

```text
package.json 允許 0.1.1，
但 package-lock.json 仍然記錄實際安裝 0.1.0。
```

要讓專案真的用上 `0.1.1`，應該明確更新這個依賴，並讓 npm 同步更新 `package-lock.json`。
