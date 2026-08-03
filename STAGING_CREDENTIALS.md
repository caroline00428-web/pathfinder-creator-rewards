# 🎯 Staging 配置速查表

## 📊 Turso Staging 数据库信息

```
数据库名称:  turso-staging-caroline00428-web
数据库 URL:  libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io
Auth Token:  eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ
```

## 🔐 Staging 环境密钥

```
NEXTAUTH_SECRET:  LhU3AUqyHaKocihwJ7SZxR4N77hVGz3p0tQtNppptJ4=
NEXTAUTH_URL:     https://creator-reward-staging.vercel.app
```

## 📧 邮件配置（可选）

```
GMAIL_USER:           galaxydefensefeedback@gmail.com
GMAIL_APP_PASSWORD:   tedgfkidijqumntg
```

## 🎮 其他配置（共享）

```
YOUTUBE_API_KEY:      AIzaSyB6m_Vk2bmMXEuIZqw3TD9B5xiRC9fteno
DISCORD_CLIENT_ID:    (optional)
DISCORD_CLIENT_SECRET: (optional)
```

## 📋 创建 .env.staging

```bash
# 复制模板
cp .env.staging.example .env.staging

# 编辑并复制粘贴上面的值
```

## ✅ 验证清单

- [ ] Turso 数据库已初始化（16 个表）
- [ ] 本地 .env.staging 已配置
- [ ] `npm run dev:staging` 可以成功启动
- [ ] Vercel 环境变量已设置
- [ ] GitHub staging 分支已推送
- [ ] 第一次部署已完成

## 🚀 命令速查

```bash
# 本地开发
npm run dev:staging         # 使用 staging 数据库开发

# Git 操作
git checkout staging        # 切换到 staging 分支
git push                    # 推送触发 Vercel 自动部署

# Turso 管理
turso db show turso-staging   # 查看数据库状态
turso db destroy turso-staging # 删除数据库（谨慎！）
```

## 🔗 访问链接

| 链接 | 用途 |
|------|------|
| [Vercel Dashboard](https://vercel.com/dashboard) | 监控部署 |
| [Turso Console](https://turso.tech) | 管理数据库 |
| [GitHub Staging Branch](https://github.com/caroline00428-web/pathfinder-creator-rewards/tree/staging) | 代码管理 |
| https://creator-reward-staging.vercel.app | Staging URL (部署后) |

## 💾 数据库表列表

已创建 16 个表：
```
✅ User                      ✅ CreditWallet
✅ Creator                   ✅ CreditTransaction
✅ Campaign                  ✅ ShopItem
✅ Video                     ✅ RewardOrder
✅ ViewCountHistory          ✅ RewardOrderItem
✅ Milestone                 ✅ ExportBatch
✅ MilestoneClaim           ✅ SpecialReward
✅ Announcement             ✅ SpecialRewardApplication
                            ✅ CreatorAccount
```

---

保存此文档便于日后参考！
