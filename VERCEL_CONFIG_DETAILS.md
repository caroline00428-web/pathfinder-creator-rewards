# 🔐 Vercel Staging 配置详细数据

## ✅ 第 4 步：在 Vercel 中配置环境变量

### 访问地址
```
https://vercel.com/dashboard
```

### 项目选择
```
选择项目: creator-reward-platform
进入 Settings → Environment Variables
```

### 为 Staging 分支添加以下环境变量

在 "Environment Variables" 页面，为每个变量选择 **Staging** 环境分支：

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: TURSO_DATABASE_URL                             │
│ 值: libsql://turso-staging-caroline00428-web.aws-us-ea│
│     st-2.turso.io                                      │
│ 环境: Staging                                           │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: TURSO_AUTH_TOKEN                               │
│ 值: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnci│
│     LCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS│
│     03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1  │
│     FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsicm     │
│     lpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2      │
│     MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkV      │
│     xSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ                   │
│ 环境: Staging                                           │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: NEXTAUTH_SECRET                                │
│ 值: LhU3AUqyHaKocihwJ7SZxR4N77hVGz3p0tQtNppptJ4=     │
│ 环境: Staging                                           │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: NEXTAUTH_URL                                   │
│ 值: https://creator-reward-staging.vercel.app         │
│ 环境: Staging                                           │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: YOUTUBE_API_KEY                                │
│ 值: AIzaSyB6m_Vk2bmMXEuIZqw3TD9B5xiRC9fteno          │
│ 环境: All (Production, Preview, Development)          │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: GMAIL_USER                                     │
│ 值: galaxydefensefeedback@gmail.com                   │
│ 环境: All (Production, Preview, Development)          │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ 变量名: GMAIL_APP_PASSWORD                             │
│ 值: tedgfkidijqumntg                                   │
│ 环境: All (Production, Preview, Development)          │
└─────────────────────────────────────────────────────────┘
```

---

## 配置分支部署规则

### 访问 Settings → Git → Deployments

设置以下规则：

```
Production Branch: main
  → Deploy to: https://creator-reward-platform.vercel.app

Preview Branches: 
  → Add Branch: staging
  → Deploy to: https://creator-reward-staging.vercel.app
```

或者在项目设置中启用：
```
☑ Deploy on every push to main
☑ Automatically deploy pull requests
```

---

## 完整变量表（复制用）

```
TURSO_DATABASE_URL=libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ
NEXTAUTH_SECRET=LhU3AUqyHaKocihwJ7SZxR4N77hVGz3p0tQtNppptJ4=
NEXTAUTH_URL=https://creator-reward-staging.vercel.app
YOUTUBE_API_KEY=AIzaSyB6m_Vk2bmMXEuIZqw3TD9B5xiRC9fteno
GMAIL_USER=galaxydefensefeedback@gmail.com
GMAIL_APP_PASSWORD=tedgfkidijqumntg
```

---

## ✅ 验证配置完成

配置完成后，检查：
- [ ] 所有 7 个环境变量已添加
- [ ] Staging 分支已配置
- [ ] 部署规则已保存

完成后，回到 CLI 运行第 5 步推送代码。
