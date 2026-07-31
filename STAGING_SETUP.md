# 🚀 Staging 隔离测试环境搭建指南

本指南帮助你在生产环境之外创建一个完整隔离的测试环境，用于线上维护和测试新功能。

## 📋 架构概览

```
┌─────────────────────────────────────────┐
│   GitHub Branches                        │
├─────────────────────────────────────────┤
│  main          → Production (Vercel)     │
│  staging       → Staging (Vercel)        │
└─────────────────────────────────────────┘
         ↓                    ↓
┌─────────────────────────────────────────┐
│   Vercel Deployments                     │
├─────────────────────────────────────────┤
│  creator-reward-platform.vercel.app      │
│  creator-reward-staging.vercel.app       │
└─────────────────────────────────────────┘
         ↓                    ↓
┌─────────────────────────────────────────┐
│   Turso Databases                        │
├─────────────────────────────────────────┤
│  pathfiner (prod)                        │
│  creator-reward-staging (staging)        │
└─────────────────────────────────────────┘
```

## ✅ 配置步骤

### 1️⃣ 创建新的 Turso 测试数据库

```bash
# 访问 https://turso.tech 并登录

# 创建新数据库
turso db create creator-reward-staging

# 获取连接字符串和 token
turso db show creator-reward-staging --json
```

示例输出：
```json
{
  "url": "libsql://creator-reward-staging-xxx.turso.io",
  "token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
}
```

### 2️⃣ 配置本地 .env.staging

编辑 `.env.staging` 文件，填入你的 Turso 信息：

```bash
# 用上面获取的信息替换这些
TURSO_DATABASE_URL="libsql://creator-reward-staging-xxx.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."

# 生成新的 NEXTAUTH_SECRET (安全起见，与生产不同)
# Windows: 使用 openssl rand -base64 32 (需要 Git Bash 或 WSL)
# Mac/Linux: openssl rand -base64 32
NEXTAUTH_SECRET="[生成的新 secret]"

# 保持其他配置与生产相同即可
```

### 3️⃣ 本地测试 Staging 环境

```bash
# 安装依赖 (如果还没装)
npm install

# 启动 staging 开发服务器
npm run dev:staging

# 应该显示:
# ✅ Loaded XXX staging variables
# 🚀 Starting Next.js in Staging mode...
# ...ready - started server on 0.0.0.0:3000
```

访问 `http://localhost:3000` 测试，确保连接到 staging 数据库。

### 4️⃣ 推送 Staging 分支到 GitHub

```bash
# 确保在 staging 分支
git branch

# 推送到远程
git push -u origin staging

# 验证 GitHub 上有 staging 分支
# https://github.com/[你的用户]/creator-reward-platform/branches
```

### 5️⃣ 配置 Vercel 部署

#### 5A. 创建新的 Vercel 项目（或使用现有）

**选项 A: 使用现有项目的多环境**
```
Vercel 仪表板 
  → 选择项目 "creator-reward-platform"
  → Settings → Deployments
  → 勾选 "Automatic deployments for staging"
```

**选项 B: 创建独立项目** (推荐更隔离)
```
https://vercel.com/new
  → 导入 GitHub 仓库
  → 项目名: creator-reward-staging
  → Framework: Next.js
  → 不导入环境变量，下一步配置
```

#### 5B. 设置 Staging 环境变量

在 Vercel 项目 Settings → Environment Variables，为 `staging` 环境添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://creator-reward-staging-xxx.turso.io` | Staging |
| `TURSO_AUTH_TOKEN` | `[staging token]` | Staging |
| `NEXTAUTH_SECRET` | `[staging secret]` | Staging |
| `NEXTAUTH_URL` | `https://creator-reward-staging.vercel.app` | Staging |
| `YOUTUBE_API_KEY` | `[same as prod]` | All |
| `GMAIL_USER` | `[test or same]` | Staging |
| `GMAIL_APP_PASSWORD` | `[test or same]` | Staging |

#### 5C. 配置分支部署规则

Vercel Settings → Git → Deployments

```
Production Branch: main → https://creator-reward-platform.vercel.app
Staging Branch:    staging → https://creator-reward-staging.vercel.app
```

或者在 `vercel.json` 中添加 (可选):

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "env": {
    "staging": {
      "NEXTAUTH_URL": "https://creator-reward-staging.vercel.app"
    }
  }
}
```

### 6️⃣ 初始化 Staging 数据库

Staging 数据库现在是空的，需要初始化 schema：

```bash
# 远程连接 turso CLI 初始化 (或在本地运行后上传)
npm run build  # 会执行 prisma generate

# 或者通过 API 路由初始化 (下方提供初始化脚本)
curl -X POST https://creator-reward-staging.vercel.app/api/test/init-db \
  -H "Content-Type: application/json" \
  -d {"adminPassword": "test123"}
```

## 🎯 日常使用流程

### 开发新功能/修复 bug

```bash
# 1. 切换到 staging 分支
git checkout staging

# 2. 本地测试（使用 staging 数据库）
npm run dev:staging

# 3. 测试完成后提交
git add .
git commit -m "feat: new feature for testing"

# 4. 推送到 GitHub
git push

# 5. Vercel 自动部署到 staging URL
#    等待部署完成... → https://creator-reward-staging.vercel.app

# 6. 验证线上 staging 环境

# 7. 如果测试通过，合并回 main 分支
git checkout main
git merge staging
git push
```

### 在 Staging 环境测试

1. 访问 https://creator-reward-staging.vercel.app
2. 创建测试账户或使用测试数据
3. 测试新功能/修复
4. 检查日志和错误

### 查看部署日志

```
Vercel Dashboard
  → Deployments
  → 点击 staging 部署
  → Logs → Function Logs
```

## 🔄 同步 Staging 和 Main

保持 staging 分支与 main 同步：

```bash
# 切换到 staging
git checkout staging

# 从 main 拉取最新代码
git pull origin main

# 如果有冲突，解决后
git push origin staging
```

## 📝 创建初始化脚本（可选）

创建 `src/app/api/test/init-db/route.ts` 用于初始化 staging 数据库：

```typescript
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  // 只在非生产环境运行
  if (process.env.NODE_ENV === "production" && 
      !process.env.TURSO_DATABASE_URL?.includes("staging")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    // 创建测试活动
    await db.campaign.create({
      data: {
        name: "Test Campaign",
        platform: "YOUTUBE",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-12-31"),
      },
    });

    // 创建测试里程碑
    await db.milestone.create({
      data: {
        platform: "YOUTUBE",
        viewThreshold: 1000,
        creditsAwarded: 300,
      },
    });

    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

## ✨ 完成！

现在你有了完全隔离的测试环境：

| 环境 | URL | 数据库 | 分支 | 用途 |
|------|-----|--------|------|------|
| **Production** | creator-reward-platform.vercel.app | pathfiner | main | 真实用户数据 |
| **Staging** | creator-reward-staging.vercel.app | creator-reward-staging | staging | 测试新功能 |
| **Local Dev** | localhost:3000 | dev.db | staging | 本地开发 |

## 🚨 注意事项

- ❌ **不要** 在 main 分支直接修改生产数据库
- ✅ 所有新功能都先在 staging 测试
- ✅ staging 数据库可以随意重置/清空
- ✅ 定期同步 staging 与 main 分支
- ✅ 在 Vercel UI 中监控部署状态

## 🆘 故障排除

### "TURSO_DATABASE_URL 无效"
```
→ 检查 .env.staging 中的 URL 是否正确
→ 确认 Turso token 未过期
```

### "连接到生产数据库"
```
→ 运行 npm run dev:staging (不是 npm run dev)
→ 检查 .env.local 是否覆盖了 staging 变量
```

### Vercel 部署失败
```
→ 检查 Vercel 环境变量是否正确设置
→ 查看部署日志中的具体错误
→ 确认 staging 分支在 GitHub 上
```

## 🎓 参考资源

- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
- [Turso 文档](https://docs.turso.tech)
- [Next.js 部署](https://nextjs.org/docs/deployment)
