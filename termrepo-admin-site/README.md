# 管理站部署说明

`termrepo-admin-site` 是 TermRepo 的独立管理员后台，用于部署者配置服务级能力。

## 主要能力

- 配置全局 OpenAI-compatible AI 模型端点、模型名和 API Key。
- 测试 AI 模型连接状态。
- 配置新用户默认 AI 月额度和云同步词条上限。
- 查看用户列表并调整单个用户的角色、AI 额度、同步开关和词条上限。

## 启动前准备

后端 `.env` 需要至少配置：

```env
DATABASE_URL="postgresql://..."
AUTH_JWT_SECRET="replace-with-a-long-random-secret"
APP_SECRET_ENCRYPTION_KEY="replace-with-a-long-random-encryption-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_USERNAME="TermRepo Admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
PUBLIC_API_ENDPOINT="https://your-api.example.com/api/v1"
```

后端启动时会自动创建或更新管理员账号。

## 前端环境变量

管理站部署时配置：

```env
VITE_API_BASE_URL="https://your-api.example.com/api/v1"
```

## 使用流程

1. 使用 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录管理站。
2. 在“AI 模型”页填写 `Base URL`、`Model`、`API Key` 并测试连接。
3. 在“默认额度”页设置新用户 AI 月额度和云同步词条上限。
4. 在“用户管理”页根据需要调整单个用户额度或权限。
