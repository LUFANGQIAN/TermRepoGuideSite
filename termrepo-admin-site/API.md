# TermRepo 控制管理站 API 接口文档

> 本文档描述 termrepo-control-site 与后端约定的 RESTful API。
> 当前前端仓库使用 mock 实现（见 `src/mock/`），后端按本文档实现即可与前端对接。

## 0. 通用约定

### 0.1 基础信息

- **API Base URL**：`/api/v1`
- **请求格式**：`application/json; charset=utf-8`
- **响应格式**：`application/json; charset=utf-8`
- **时间戳**：统一使用 ISO 8601（`2026-04-25T10:00:00.000Z`）
- **分页**：`page` 从 1 开始，`pageSize` 默认 20，最大 100

### 0.2 认证

除 `auth/login`、`auth/register`、`health` 之外，所有接口都需要在 Header 中携带：

```
Authorization: Bearer <accessToken>
```

`accessToken` 在登录/注册成功后由 `auth/login`、`auth/register` 接口返回。

### 0.3 统一响应结构

```jsonc
// 成功
{
  "code": 0,
  "message": "ok",
  "data": { /* 业务数据 */ }
}

// 失败
{
  "code": 40101,                  // 业务错误码（非 0）
  "message": "token 已失效",
  "data": null
}
```

| HTTP | 含义 |
| --- | --- |
| 200 | 业务成功（含 `code=0`） |
| 400 | 参数错误 |
| 401 | 未登录 / token 失效 |
| 403 | 已登录但无权限（如未通过内测申请） |
| 404 | 资源不存在 |
| 409 | 冲突（如重复申请） |
| 429 | 频率限制 |
| 500 | 服务端异常 |

### 0.4 业务错误码（code）

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 40001 | 参数校验失败 |
| 40101 | 未登录 |
| 40102 | accessToken 失效 |
| 40103 | 用户名或密码错误 |
| 40301 | 无内测资格 |
| 40302 | 功能未开通（AI / 云同步） |
| 40901 | 邮箱已被注册 |
| 42901 | 操作过于频繁 |
| 50001 | 服务端异常 |

---

## 1. 认证 Auth

### 1.1 注册

`POST /api/v1/auth/register`

```jsonc
// Request
{
  "email": "alice@example.com",
  "password": "********",
  "username": "alice"
}

// Response.data
{
  "accessToken": "eyJxxx...",
  "refreshToken": "eyJyyy...",
  "user": {
    "id": "u_001",
    "email": "alice@example.com",
    "username": "alice",
    "createdAt": "2026-04-25T10:00:00.000Z"
  }
}
```

### 1.2 登录

`POST /api/v1/auth/login`

```jsonc
// Request
{ "email": "alice@example.com", "password": "********" }

// Response.data —— 同注册
```

### 1.3 当前用户

`GET /api/v1/auth/me`

```jsonc
// Response.data
{
  "id": "u_001",
  "email": "alice@example.com",
  "username": "alice",
  "betaStatus": "approved",            // none | pending | approved | rejected
  "aiEnabled": true,
  "syncEnabled": true,
  "tokenValid": true,
  "createdAt": "2026-04-25T10:00:00.000Z"
}
```

### 1.4 登出

`POST /api/v1/auth/logout`

无 body，吊销当前 accessToken。

---

## 2. 内测资格 Beta

### 2.1 查询内测资格状态

`GET /api/v1/beta/status`

```jsonc
// Response.data
{
  "status": "approved",                 // none | pending | approved | rejected
  "appliedAt": "2026-04-20T10:00:00.000Z",
  "approvedAt": "2026-04-22T10:00:00.000Z",
  "scope": ["ai", "sync"],
  "note": "感谢赞助支持，已开通 AI + 同步内测"
}
```

### 2.2 申请内测资格

`POST /api/v1/beta/apply`

```jsonc
// Request
{
  "reason": "希望体验 AI 自动备注",
  "scope": ["ai", "sync"]
}

// Response.data
{ "status": "pending", "appliedAt": "2026-04-25T10:00:00.000Z" }
```

---

## 3. Token 管理

### 3.1 获取当前 token 信息

`GET /api/v1/token/current`

```jsonc
// Response.data
{
  "token": "trp_live_xxxxxxxxxxxxx",
  "endpoint": "https://api.termrepo.dev/v1",
  "version": "v1",
  "valid": true,
  "issuedAt": "2026-04-01T10:00:00.000Z",
  "expiresAt": "2026-07-01T10:00:00.000Z",
  "scopes": ["ai.suggest", "sync.read", "sync.write"],
  "scopeDescriptions": {
    "ai.suggest": "调用 AI 备注建议",
    "sync.read":  "读取云端词库快照",
    "sync.write": "上传/合并云端词库"
  }
}
```

### 3.2 重新生成 token

`POST /api/v1/token/regenerate`

无 body。返回结构同 3.1，旧 token 立即失效。

### 3.3 校验 token

`POST /api/v1/token/validate`

```jsonc
// Request
{ "token": "trp_live_xxxx" }

// Response.data
{ "valid": true, "expiresAt": "2026-07-01T10:00:00.000Z" }
```

---

## 4. 云同步 Sync

### 4.1 同步状态总览

`GET /api/v1/sync/status`

```jsonc
// Response.data
{
  "enabled": true,
  "termCount": 482,
  "lastSyncAt": "2026-04-25T09:42:13.000Z",
  "lastSyncStatus": "success",          // success | conflict | failed
  "pendingConflicts": 2,
  "snapshotVersion": 17
}
```

### 4.2 切换同步开关

`POST /api/v1/sync/toggle`

```jsonc
// Request
{ "enabled": true }

// Response.data —— 同 4.1
```

### 4.3 设备列表

`GET /api/v1/sync/devices`

```jsonc
// Response.data
{
  "items": [
    {
      "id": "dev_001",
      "name": "MacBook Pro 16",
      "platform": "vscode-darwin",
      "current": true,
      "lastActiveAt": "2026-04-25T09:42:13.000Z",
      "registeredAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

### 4.4 移除设备

`DELETE /api/v1/sync/devices/:id`

### 4.5 手动触发同步

`POST /api/v1/sync/trigger`

```jsonc
// Response.data
{
  "jobId": "job_xxxx",
  "status": "running",                  // running | success | conflict | failed
  "startedAt": "2026-04-25T10:00:00.000Z"
}
```

### 4.6 冲突列表

`GET /api/v1/sync/conflicts`

```jsonc
// Response.data
{
  "items": [
    {
      "id": "cf_001",
      "term": "userIdToken",
      "localUpdatedAt":  "2026-04-25T08:00:00.000Z",
      "remoteUpdatedAt": "2026-04-25T08:30:00.000Z",
      "localValue":  { "note": "用户主 ID（旧）" },
      "remoteValue": { "note": "用户主 ID Token" }
    }
  ]
}
```

### 4.7 解决冲突

`POST /api/v1/sync/conflicts/:id/resolve`

```jsonc
// Request
{ "resolution": "local" }   // local | remote | merge
```

### 4.8 导出云端快照

`GET /api/v1/sync/snapshot/export`

返回 `application/json` 文件流，包含完整词库 JSON。

### 4.9 导入云端快照

`POST /api/v1/sync/snapshot/import`

```jsonc
// Request
{
  "mode": "overwrite",          // overwrite | merge
  "snapshot": { /* 词库 JSON */ }
}

// Response.data
{ "imported": 482, "skipped": 0, "snapshotVersion": 18 }
```

---

## 5. AI 能力 AI

### 5.1 AI 状态总览

`GET /api/v1/ai/status`

```jsonc
// Response.data
{
  "enabled": true,
  "model": "claude-haiku-4-5",
  "quota": {
    "weekly":  { "limit": 200,  "used":  36 },
    "monthly": { "limit": 1000, "used": 148 }
  },
  "resetAt": {
    "weekly":  "2026-05-04T00:00:00.000Z",
    "monthly": "2026-05-01T00:00:00.000Z"
  }
}
```

### 5.2 切换 AI 开关

`POST /api/v1/ai/toggle`

```jsonc
// Request
{ "enabled": true }

// Response.data —— 同 5.1
```

### 5.3 调用历史摘要

`GET /api/v1/ai/usage?range=7d`

`range` 取值：`24h | 7d | 30d`

```jsonc
// Response.data
{
  "summary": {
    "totalCalls": 36,
    "successRate": 0.97,
    "avgLatencyMs": 820
  },
  "items": [
    {
      "id": "log_001",
      "calledAt": "2026-04-24T10:00:00.000Z",
      "kind": "annotate",            // annotate | split-suggest | rename
      "input":  "userIdToken",
      "outputPreview": "用户主 ID Token，常用于鉴权…",
      "latencyMs": 740,
      "success": true
    }
  ]
}
```

---

## 6. 工单系统 Tickets

工单状态机：`open → pending → resolved | closed`

| 状态 | 含义 |
| --- | --- |
| open | 新建，等待官方处理 |
| pending | 已回复，等用户补充 |
| resolved | 已解决 |
| closed | 已关闭 |

### 6.1 工单列表

`GET /api/v1/tickets?status=open&page=1&pageSize=20`

```jsonc
// Response.data
{
  "items": [
    {
      "id": "tk_001",
      "title": "AI 备注偶发超时",
      "category": "ai",                 // ai | sync | token | account | other
      "status": "open",
      "priority": "normal",             // low | normal | high | urgent
      "lastReplyAt": "2026-04-24T15:00:00.000Z",
      "createdAt": "2026-04-23T10:00:00.000Z",
      "messageCount": 2
    }
  ],
  "total": 4,
  "page": 1,
  "pageSize": 20
}
```

### 6.2 工单详情

`GET /api/v1/tickets/:id`

```jsonc
// Response.data
{
  "id": "tk_001",
  "title": "AI 备注偶发超时",
  "category": "ai",
  "status": "open",
  "priority": "normal",
  "createdAt": "2026-04-23T10:00:00.000Z",
  "messages": [
    {
      "id": "msg_001",
      "from": "user",                   // user | staff
      "authorName": "alice",
      "content": "今天上午调用 AI 备注，约有 1/3 概率 timeout",
      "attachments": [],
      "createdAt": "2026-04-23T10:00:00.000Z"
    },
    {
      "id": "msg_002",
      "from": "staff",
      "authorName": "TermRepo 支持",
      "content": "已收到反馈，初步定位是上游限流，将在 24h 内修复",
      "attachments": [],
      "createdAt": "2026-04-23T18:00:00.000Z"
    }
  ]
}
```

### 6.3 创建工单

`POST /api/v1/tickets`

```jsonc
// Request
{
  "title": "AI 备注偶发超时",
  "category": "ai",
  "priority": "normal",
  "content": "今天上午调用 AI 备注，约有 1/3 概率 timeout",
  "attachments": []
}

// Response.data —— 同 6.2
```

### 6.4 回复工单

`POST /api/v1/tickets/:id/reply`

```jsonc
// Request
{ "content": "刚刚又复现了一次", "attachments": [] }

// Response.data —— 单条 message 对象（同 6.2 messages 里一条）
```

### 6.5 关闭工单

`POST /api/v1/tickets/:id/close`

无 body。

---

## 7. 健康检查

`GET /api/v1/health`

```jsonc
{ "code": 0, "message": "ok", "data": { "status": "up", "time": "2026-04-25T10:00:00.000Z" } }
```

---

## 附录 A · Mock 数据约定

> 前端仓库 `src/mock/` 实现了上述全部接口的内存级 mock。
> Mock 通过 `src/services/http.ts` 的 axios `request` 拦截层路由到 `src/mock/index.ts`。
> 切换为真实后端时，将 `VITE_USE_MOCK=false` 即可走真实 `VITE_API_BASE_URL`。
