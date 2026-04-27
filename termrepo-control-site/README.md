# TermRepo · 控制管理站（前端）

> TermRepo 系列中负责增强能力（token / 云同步 / AI / 工单）接入与管理的站点。
> 当前阶段没有真实后端，前端使用内置 mock 模拟全部接口，UI 风格参考 Vercel。

## 一、技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vue Router 5
- Pinia 3
- Axios（接 mock 适配层 / 真实后端可无缝切换）
- Vite 8 + vue-tsc

## 二、本地启动

```sh
npm install
npm run dev          # http://localhost:5173
```

默认演示账号（mock 内置）：

```
邮箱：demo@termrepo.dev
密码：demo1234
```

也可以自行注册新账户，mock 数据存在 `localStorage` 的 `trp.mock.db.v1`，刷新不会丢失。

清空 mock 数据：在浏览器 DevTools 控制台执行
```js
localStorage.clear(); location.reload();
```

## 三、生产构建 / 类型检查

```sh
npm run build        # type-check + vite build
npx vue-tsc --build  # 单独类型检查
```

## 四、目录结构

```
src/
├─ assets/                # 设计令牌（base.css）+ 全局样式（main.css）+ Geist 字体
├─ components/
│  ├─ layout/AppSidebar.vue
│  └─ ui/                 # UiSwitch / UiBadge / UiModal / ToastStack / CopyableCode / PageShell / StatusPill
├─ mock/
│  ├─ index.ts            # axios adapter（mock 路由分发器）
│  ├─ db.ts               # 内存 + localStorage 持久化的 mock 数据
│  └─ handlers/           # 各业务域的 mock 处理器
├─ services/              # 业务 API 客户端（每个文件对应一个业务域）
├─ stores/                # pinia store（auth、toast）
├─ utils/                 # 通用工具（日期格式化等）
├─ views/                 # 页面
│  ├─ auth/Login|Register
│  ├─ DashboardView.vue
│  ├─ TokenView.vue
│  ├─ SyncView.vue
│  ├─ AiView.vue
│  └─ tickets/Tickets|TicketDetail|NewTicket
├─ App.vue
├─ main.ts
└─ router/
```

## 五、Mock 与真实后端切换

`.env.development` 中：

```
VITE_USE_MOCK=true                # mock 模式（默认）
VITE_API_BASE_URL=/api/v1
```

后端就绪后，把 `VITE_USE_MOCK=false`，所有 axios 请求会走真实 `VITE_API_BASE_URL`。

## 六、API 接口契约

完整接口契约见 [API.md](./API.md)，本仓库 mock 严格按照该文档实现。
后端按文档实现即可与前端无缝对接。

主要业务域：

| 域 | 路径前缀 | 主要能力 |
| --- | --- | --- |
| 认证 | `/auth` | 注册 / 登录 / 当前用户 / 登出 |
| 内测资格 | `/beta` | 状态 / 申请 |
| Token | `/token` | 当前 token / 重新生成 / 校验 |
| 云同步 | `/sync` | 状态 / 开关 / 设备列表 / 冲突 / 手动同步 / 快照导入导出 |
| AI 能力 | `/ai` | 状态 / 开关 / 调用历史摘要 |
| 工单 | `/tickets` | 列表 / 详情 / 新建 / 回复 / 关闭 |

## 七、设计风格

- 颜色 / 阴影 / 圆角 / 字体令牌定义在 `src/assets/base.css`，命名遵循 `--ds-*`
- 字体 Geist & Geist Mono（开源、Vercel Design System）
- 浅色为主、克制的 8 / 12 / 999px 圆角，0px shadow border + 阴影双层包裹
- 所有交互组件都有 `:focus-visible` 蓝色焦点环，符合可访问性要求
