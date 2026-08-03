# 🚀 Staging 环境 - 部署完成清单

## ✅ 已完成

- ✅ Staging 分支已创建 (`git branch` 查看)
- ✅ Turso Staging 数据库已初始化 (16 个表)
- ✅ 本地开发脚本已配置 (`npm run dev:staging`)
- ✅ 所有文件已推送到 GitHub staging 分支

## 📝 最后一步：Vercel 配置

### 方案 A：使用现有项目的多分支部署（推荐）

```
1. 访问 https://vercel.com/dashboard
2. 点击项目 "creator-reward-platform"
3. 进入 Settings → Environment Variables

4. 添加这些变量（选择 "staging" 分支）:
   ┌─────────────────────────────────────────────────────────────┐
   │ Variable Name              │ Value                            │
   ├─────────────────────────────────────────────────────────────┤
   │ TURSO_DATABASE_URL        │ libsql://turso-staging-c...io    │
   │ TURSO_AUTH_TOKEN          │ eyJhbGciOiJFZERTQSIs...          │
   │ NEXTAUTH_SECRET           │ LhU3AUqyHaKocihwJ7SZ...          │
   │ NEXTAUTH_URL              │ https://creator-reward-staging...│
   │ YOUTUBE_API_KEY           │ AIzaSyB6m_Vk2...                 │
   │ GMAIL_USER                │ galaxydefensefeedback@gmail.com  │
   │ GMAIL_APP_PASSWORD        │ tedgfkidijqumntg                 │
   └─────────────────────────────────────────────────────────────┘

5. 进入 Settings → Git
6. 在 "Deployments" 部分配置：
   Production Branch: main
   Preview Branches: Add "staging"
   
7. 保存并返回

✅ 完成！现在 push 到 staging 分支会自动部署
```

### 方案 B：创建独立的 Staging 项目

```
1. 访问 https://vercel.com/new
2. 导入相同的 GitHub 仓库
3. 项目名: creator-reward-staging
4. Framework: Next.js
5. 在部署前配置环境变量（如上 4-5 步）
6. 部署

✅ 完成！会在 creator-reward-staging.vercel.app 上线
```

## 🧪 本地测试

```bash
# 1. 复制环境模板
cp .env.staging.example .env.staging

# 2. 编辑 .env.staging，填入你的 Turso 信息
#   TURSO_DATABASE_URL="libsql://turso-staging-caroline00428-web..."
#   TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."

# 3. 启动本地 staging 环境
npm run dev:staging

# 4. 访问 http://localhost:3000
```

## 🚀 第一次部署

```bash
# 确保在 staging 分支
git checkout staging

# 推送到 GitHub
git push

# 等待 Vercel 自动部署
# 在 https://vercel.com/dashboard 监控进度
# 完成后访问 https://creator-reward-staging.vercel.app
```

## 🔗 重要链接

| 环境 | 分支 | URL | 数据库 |
|------|------|-----|--------|
| **Production** | `main` | creator-reward-platform.vercel.app | pathfiner |
| **Staging** | `staging` | creator-reward-staging.vercel.app | turso-staging |
| **Local (Prod)** | `main` | localhost:3000 | dev.db |
| **Local (Staging)** | `staging` | localhost:3000 | turso-staging |

## 💡 日常工作流

```bash
# 开发新功能
git checkout staging
npm run dev:staging

# 提交并推送
git add .
git commit -m "feature: xyz"
git push

# Vercel 自动部署到 staging URL
# 测试完成后合并回 main
git checkout main
git merge staging
git push
```

## 🎯 下一步

1. ✅ 在 Vercel 中配置 staging 分支环境变量
2. ✅ 推送 staging 分支触发部署
3. ✅ 访问 staging URL 验证正常运行
4. ✅ 开始在 staging 中测试新功能

---

**提示**: 所有测试数据可以随意修改，staging 数据库完全隔离生产环境。如需重置，只需在 Turso 控制台删除并重建数据库。
