# 青时（QingShi Focus Study）

> 前端开发实训课程作业：一款面向大学生、研究生的轻量化在线专注学习工具。

本项目严格按照课程项目计划书开发，使用 Vue 3 Composition API 构建单页应用，集番茄专注计时、学习任务管理、每日学习打卡和学习数据统计于一体。Axios 负责标准 RESTful 请求，Mock API 模拟后端服务，LocalStorage 在离线或接口异常时兜底。

## 作业信息

- 项目性质：前端实训课程作业
- 项目名称：青时 · 专注学习助手
- 核心技术：Vue 3、Composition API、Vite、Axios、ECharts
- 数据方案：Mock API 优先 + LocalStorage 持久化兜底
- 适用场景：课程学习、考试复习、科研阅读和阶段性任务管理

## 功能完成情况

- 番茄计时：自定义专注/休息时长、开始、暂停、重置、模式切换及结束提醒
- 稳定计时：基于结束时间计算倒计时，避免页面降频导致明显漂移，并在卸载时清理定时器
- 任务管理：新增、编辑、完成状态切换、单条删除、一键清空及空值校验
- 每日打卡：记录日期与当日专注分钟，同一天仅允许打卡一次
- 数据统计：近 7 天/30 天专注时长柱状图，自动计算累计、日均及最高时长
- 数据持久化：刷新浏览器后保留计时设置、任务、打卡与专注记录
- 异常兜底：接口失败时写入本地并加入同步队列，网络恢复后自动补交
- 响应式页面：适配电脑、平板和手机，无横向滚动

## 项目结构

```text
src/
├── assets/                  # 全局响应式样式
├── components/              # 页面功能组件
├── composables/             # Composition API 业务逻辑（计时器）
├── constants/               # 缓存键和默认配置
├── services/                # Axios、Mock API、业务接口与本地仓库
├── utils/                   # 日期及安全存储工具
├── App.vue                  # 页面组装与全局状态协调
└── main.js                  # Vue 应用入口
tests/                       # 单元测试
docs/                        # 作业接口与验收文档
```

## 本地运行

环境要求：Node.js 20.19 或更高版本。

```bash
npm install
npm run dev
```

浏览器访问终端显示的本地地址（通常为 `http://localhost:5173`）。

## 检查与构建

```bash
# 一次运行代码规范、单元测试和生产构建
npm run check

# 预览生产构建
npm run preview
```

构建结果输出到 `dist/`，可部署到 GitHub Pages、Vercel、Netlify 或任意静态服务器。

## Apifox 联调

项目默认启用浏览器内 Mock API，接口路径和返回结构与计划书保持一致。接入 Apifox Mock 地址时，复制 `.env.example` 为 `.env.local`：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-apifox-mock-url/api
```

接口失败时页面仍可使用 LocalStorage；失败的写操作会加入本地同步队列，并在浏览器触发 `online` 事件后自动重试。

完整接口清单见 [docs/API.md](docs/API.md)，验收记录见 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)。

## 数据说明

本项目无需真实后端和用户账号。学习数据默认保存在当前浏览器中，清理浏览器站点数据会同时清除学习记录。
