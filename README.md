# GoalDay · 目标日

一个跨端的目标管理 / 周计划应用，灵感来自 GoalDay。核心是 **Todo–Doing–Done** 工作流 + **周历拖拽排程** + **日记复盘** + **统计**，本地优先、可选云账号同步，中英双语。

桌面端基于 **Tauri v2 + React + TypeScript**，前端代码将来可直接复用到 iOS / Android(Tauri mobile)。

## 功能

- **日计划(Day)**：单日分「早上 / 下午 / 晚上」三段,把任务拖进某一段即可归置;右侧「当日待办」放未分段任务、「收集箱」放未排期任务;可前后翻天/回到今天。
- **周计划(Week)**：周一到周日七列，从右侧收集箱把任务拖到某一天;每列可直接快速添加。
- **首页(Home)**：时段问候语 + 今日完成大环、完成率/连续天数/累计完成三张卡、今日任务 / 逾期任务 / **进行中** 三个清单、目标进度条。
- **记账(Money)**：记一笔收入 / 支出(8 类支出 + 4 类收入,带图标),月度收入 / 支出 / 结余汇总,支出构成占比条形图,按月翻看。
- **健身(Fitness)**：记录训练(8 种类型 + 时长 / 卡路里 / 组数),本周次数 / 时长 / 连续天数,本周训练量柱状图(点柱子切当天),当日训练清单。
- **备忘录(Notes)**：便签卡片,置顶、7 种颜色、实时搜索,点卡片弹侧边抽屉编辑。
- **日记(Journal)**：按天记录复盘与心情(5 档表情)。
- **统计(Stats)**：完成率、累计完成、连续天数、本周每日完成柱状图、按目标进度。
- **目标(Goals)**：设置里管理目标(名称 + 颜色),任务可关联到目标,统计页按目标看进度。
- **任务详情**:点任意任务卡从右侧滑出抽屉,改标题 / 开始日期 / 截止日期 / 优先级(低·中·高)/ 重复规则 / 关联目标 / 写备注。
- **开始 + 截止日期**:任务可跨多天 —— 抽屉里直接选开始日(排到任意一天,不必拖拽)和截止日;截止日显示在卡片上,逾期按截止日判断(没设截止日则回退到开始日,老数据行为不变)。
- **重复任务**:已排期的任务可设为每天 / 每周 / 每月;实例会**预先铺到你查看的日期**(翻到哪天就补到哪天),所以往后翻每天 / 每周都能看到它,且保留原时段(早/午/晚);每天的实例独立完成,漏做的那天照常显示逾期(卡片上有循环小图标)。
- **搜索筛选**:计划类视图顶部可按关键词搜索、按优先级或目标筛选。
- **键盘快捷键**:`1`–`9` 切换视图(1 首页 / 2 日计划 / 3 周计划 / 4 日记 / 5 记账 / 6 健身 / 7 备忘录 / 8 统计 / 9 设置),`n` 聚焦快速添加,`/` 聚焦搜索,`?` 打开帮助,`Esc` 关闭抽屉 / 弹层。
- **数据备份**:设置里可把全部任务 / 日记 / 目标导出为 JSON;导入时按更新时间合并,不覆盖本地数据。
- **删除撤销**:删除任务后左下角弹出提示,5 秒内可撤销。
- **深色模式**:浅色 / 深色 / 跟随系统三态,设置里切换。
- **云同步(可选)**：填入自己的 Supabase 项目即可多设备实时同步;不填则纯本地离线可用。
- **中英双语**：设置里一键切换。

数据本地存 `localStorage`,登录后通过 Supabase 双向合并(last-write-wins,含软删除),任意设备登录同一账号即同步。

## 开发运行

> ⚠️ 本机注意：默认 `node` 指向 ChatGPT.app 内置的、开启了 library validation 的 Node，无法加载 rollup/esbuild 等原生模块。请使用独立安装的 Node(如 `brew install node`,即 `/opt/homebrew/bin/node`)。

```bash
# 确保用的是 Homebrew 的 node
export PATH="/opt/homebrew/bin:$PATH"

pnpm install          # 首次
pnpm tauri dev        # 启动桌面开发(会自动拉起 Vite)
```

打包:

```bash
node_modules/.bin/tauri build   # release 编译 + 打包(pnpm tauri build 在本机会被 esbuild 脚本检查拦住)
```

产物(Apple Silicon):

- `.app`:`src-tauri/target/release/bundle/macos/GoalDay.app`
- `.dmg`:`src-tauri/target/release/bundle/dmg/GoalDay_0.1.0_aarch64.dmg`

> 未做代码签名 / 公证,首次打开需右键「打开」或在「系统设置 → 隐私与安全性」放行。

## Windows 版(Win10 / Win11)

同一套代码,Tauri 原生支持 Windows。**但在 macOS 上无法交叉编译出 Windows 安装包**(需要 MSVC 工具链 + 链接 WebView2),所以 Windows 打包放在 GitHub Actions 的 Windows runner 上完成 —— 见 `.github/workflows/windows-build.yml`。

产出的是 **NSIS 安装向导(`.exe`)**,已配置:

- **WebView2 自动安装**:Win11 自带 WebView2;Win10 若缺,安装器会自动下载运行时(`downloadBootstrapper` 模式)。
- **中 / 英文安装界面**:安装时可选语言。
- **免管理员安装**:`currentUser` 模式,装到当前用户目录,不需要管理员权限。

**怎么构建出安装包:**

1. 把本项目推到一个 GitHub 仓库(见下方「首次推送」)。
2. 二选一触发构建:
   - **打版本 tag**:`git tag v0.1.0 && git push origin v0.1.0` —— CI 构建完会自动创建一个 GitHub Release,把 `.exe` 挂在上面供下载。
   - **手动触发**:仓库 **Actions → Windows Build → Run workflow** —— 构建完在该次运行的 **Artifacts** 里下载 `goalday-windows-nsis`。
3. 下载 `GoalDay_0.1.0_x64-setup.exe`,在 Win10 / Win11 双击安装即可。

> 同样未做代码签名,首次运行 Windows SmartScreen 可能提示「未知发布者」,点「更多信息 → 仍要运行」即可。要去掉这个提示需购买代码签名证书。

### Windows 运行冒烟测试(自动)

光「编译通过」不能保证在 Windows 上跑得起来。`.github/workflows/windows-smoke.yml` 在每次推到 `main` / 提 PR / 手动触发时,会在 Windows runner 上**真实运行** app 做两层验证:

- **第一层 · 启动不崩溃(硬门禁)**:构建 debug 二进制并启动,等 8 秒确认进程没退出 —— 抓「WebView2 缺失 / DLL / 初始化失败」这类根本起不来的问题。**这一层过了就证明 app 能在 Windows 上真实启动、WebView2 初始化正常**,是"能不能运行"的核心答案。
- **第二层 · UI 能渲染+可交互(best-effort,不阻塞)**:通过 `tauri-driver` + WebDriver 连上运行中的窗口,断言侧边栏渲染、品牌文案存在、点导航不崩。因为它依赖 msedgedriver 与 Edge 版本匹配 —— 这在 CI 上天生容易 flaky —— 所以设为 `continue-on-error`,失败不会让整个 job 变红,只作为额外信号看日志。

冒烟脚本在 `webdriver/`(独立依赖,不进主 `package.json`)。

### 首次推送到 GitHub

本项目当前还不是 git 仓库。初始化并推送:

```bash
git init
git add .
git commit -m "GoalDay desktop app"
git branch -M main
git remote add origin https://github.com/<你的用户名>/goalday.git
git push -u origin main
```

推上去后,`.github/workflows/windows-build.yml` 就会在打 tag 或手动触发时跑起来。

## 配置云同步(Supabase)

1. 在 [supabase.com](https://supabase.com) 新建项目(记住数据库区域,越近越快)。
2. 打开 **SQL Editor → New query**,把仓库根目录 `supabase-schema.sql` 全文粘进去执行。它会建 `tasks` / `journals` / `goals` / `transactions` / `workouts` / `notes` 六张表 + 索引,并开启行级安全(RLS),每个用户只能读写自己的行。脚本可重复执行(`create ... if not exists`),已有旧库再跑一遍即可补上记账 / 健身 / 备忘录三张新表。
3. 在 **Settings → API** 复制 **Project URL** 和 **anon / public key**(不要用 `service_role` key)。
4. 应用内「设置 → 云同步」填入这两项并「保存」。
5. 用邮箱注册 / 登录:
   - ⚠️ **默认开启了邮箱确认**:注册后要先去邮箱点确认链接,回来再登录才会拿到会话、开始同步。想跳过可在 Supabase **Authentication → Providers → Email** 关掉「Confirm email」(仅建议自用)。
6. 登录后应用会自动做一次双向同步;之后任何本地改动 1.5s 防抖后自动推送。侧边栏底部圆点显示同步状态(绿=已同步 / 黄=同步中 / 红=失败 / 灰=本地模式)。

同步为 **last-write-wins**:按 `id` 合并,`updatedAt` 新的一方胜出;软删除(`deleted=true`)也带 `updatedAt`,因此删除会正确传播到其它设备。核心映射与合并逻辑有单测覆盖:

```bash
pnpm test   # node --experimental-strip-types --test,无需额外依赖
```

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面壳 | Tauri v2(Rust) |
| 前端 | React 19 + TypeScript + Vite 7 |
| 样式 | Tailwind CSS v4 |
| 状态 | Zustand |
| 拖拽 | @dnd-kit |
| 日期 | Day.js |
| 云端 | Supabase(Postgres + Auth) |

## 手机端(下一步)

前端为纯 Web 技术,计划用 **Tauri mobile** 复用同一套 `src/` 代码打包 iOS / Android;数据层与同步逻辑已与平台解耦(`localStorage` + Supabase),迁移时主要替换本地存储适配即可。
