# 🎯 Staging 环境快速开始指南

你的 staging 分支已创建并推送。下面是 **立即行动清单**：

## 📝 必需的手动步骤

### 1️⃣ 创建 Turso Staging 数据库 (5 分钟)

```bash
# 登录 https://turso.tech

# 创建新数据库
turso db create creator-reward-staging

# 获取连接信息
turso db show creator-reward-staging
```

复制输出的：
- **Database URL**: `libsql://creator-reward-staging-xxx.turso.io`
- **Auth Token**: `eyJhbGciOiJFZERTQSIsInR5...`

### 2️⃣ 配置本地 .env.staging (2 分钟)

```bash
# 复制模板
cp .env.staging.example .env.staging

# 编辑并填入上面的 Turso 信息
# .env.staging
TURSO_DATABASE_URL="libsql://creator-reward-staging-xxx.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5..."
NEXTAUTH_SECRET="[生成新的，参考下方]"
NEXTAUTH_URL="https://creator-reward-staging.vercel.app"
```

**生成 NEXTAUTH_SECRET** (任选一个):
```bash
# Git Bash / WSL
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Random]::new().GetBytes(32))
```

### 3️⃣ 本地测试 Staging 环境 (1 分钟)

```bash
# 启动 staging 开发服务器
npm run dev:staging

# 应该看到:
# ✅ Loaded XXX staging variables
# 🚀 Starting Next.js in Staging mode...
# ready - started server on 0.0.0.0:3000

# 访问 http://localhost:3000 测试
```

### 4️⃣ 在 Vercel 配置 Staging 部署 (10 分钟)

#### 方案 A: 同一项目中添加 Staging（简单）

```
1. 访问 https://vercel.com/dashboard
2. 点击你的项目 "creator-reward-platform"
3. Settings → Environment Variables
4. 添加新环境变量（为 "staging" 环境）:

   变量名                    值
   ─────────────────────────────────────────────
   TURSO_DATABASE_URL       libsql://creator-reward-staging-xxx.turso.io
   TURSO_AUTH_TOKEN         [staging token]
   NEXTAUTH_SECRET          [staging secret]
   NEXTAUTH_URL             https://creator-reward-staging.vercel.app

5. Settings → Git → Deployments → 添加 Staging 分支
   Production: main → creator-reward-platform.vercel.app
   Staging:    staging → creator-reward-staging.vercel.app
```

#### 方案 B: 独立项目（更隔离）

```
1. https://vercel.com/new
2. 导入相同的 GitHub 仓库
3. 项目名: creator-reward-staging
4. Framework: Next.js
5. 配置相同的环境变量（如上）
6. 部署
```

### 5️⃣ 推送代码触发部署

```bash
git checkout staging

# 对 staging 做任何更改后
git add .
git commit -m "your change"
git push

# Vercel 自动部署到 https://creator-reward-staging.vercel.app
# 在 Vercel Dashboard 监控部署进度
```

## ✅ 完成检查清单

完成以下检查后，staging 环境就可以使用了：

- [ ] ✅ Turso Staging 数据库已创建
- [ ] ✅ 本地 .env.staging 已配置
- [ ] ✅ `npm run dev:staging` 可以成功启动
- [ ] ✅ Vercel 已配置 staging 分支
- [ ] ✅ 可以访问 https://creator-reward-staging.vercel.app

## 🚀 日常工作流

### 开发新功能

```bash
# 1. 切换到 staging 分支
git checkout staging

# 2. 本地开发测试
npm run dev:staging

# 3. 测试完成后提交
git add .
git commit -m "feature: xxx"
git push

# 4. Vercel 自动部署到 staging
# 5. 访问线上 staging 环境验证

# 6. 如果没问题，合并到 main
git checkout main
git pull
git merge staging
git push
```

### 快速参考

| 命令 | 用途 |
|------|------|
| `npm run dev` | 本地开发（使用 dev.db） |
| `npm run dev:staging` | 本地开发（使用 staging Turso） |
| `git checkout staging` | 切换到 staging 分支 |
| `git push` | 自动部署到 Vercel staging |

## 🔗 重要链接

| 链接 | 用途 |
|------|------|
| [GitHub Staging](https://github.com/caroline00428-web/pathfinder-creator-rewards/tree/staging) | Staging 分支 |
| [Vercel Staging](https://creator-reward-staging.vercel.app) | 线上 staging 环境 |
| [Turso Dashboard](https://turso.tech) | Staging 数据库管理 |
| [STAGING_SETUP.md](./STAGING_SETUP.md) | 详细配置指南 |

## 💡 Pro Tips

1. **快速重置 staging 数据库**:
   ```bash
   turso db destroy creator-reward-staging
   turso db create creator-reward-staging
   # 重新部署即可初始化
   ```

2. **比较两个环境**:
   ```bash
   # Prod: https://creator-reward-platform.vercel.app
   # Staging: https://creator-reward-staging.vercel.app
   # 两个 URL 并排打开对比测试
   ```

3. **查看部署日志**:
   ```
   Vercel Dashboard → Deployments → 点击部署 → Logs
   ```

## 🆘 遇到问题？

### "npm run dev:staging 失败"
```
→ 确保 .env.staging 存在且有效
→ 检查 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN
→ 运行 npm install 重新安装依赖
```

### "Vercel 部署失败"
```
→ 查看 Vercel Dashboard 的部署日志
→ 确认环境变量已正确设置
→ 检查 staging 分支是否在 GitHub 上
```

### "连接到生产数据库了"
```
→ 不要运行 npm run dev，用 npm run dev:staging
→ 检查 .env.local 是否覆盖变量
→ 确认当前分支是 staging (git branch)
```

---

**下一步**: 完成上面的 5 个步骤后，你就有了一个完整隔离的测试环境，可以随时在线上测试新功能了！ 🎉
