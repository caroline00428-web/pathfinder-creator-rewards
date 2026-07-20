# Debug Handoff — Creator Reward Platform

## Status: 连接层已修复，DateTime 格式待重建

### 已修复
- Prisma 6 + Turso adapter 连接正常
- `@libsql/client@0.14.0` (从 0.7.0 升级，解决 migration jobs 400 错误)
- `PrismaLibSQL({ url, authToken })` — 正确的 adapter 初始化方式
- `serverExternalPackages` 已配置
- `DATABASE_URL=file:./dummy.db` 在 Vercel 环境变量中

### 待完成
- Turso 中所有 createdAt 字段存储格式为 `YYYY-MM-DD HH:MM:SS`
- Prisma 无法读取这些字段（类型转换失败）
- 根因：`migrate-turso.ts` 使用了 `DEFAULT (datetime('now'))`
- 已修改为 `DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
- 需在新 Turso 数据库中重建验证后切换

### 下一步
1. 在 Turso 新建临时库 `pathfinder-test`
2. 在新库运行 `npx tsx prisma/migrate-turso.ts`
3. 验证所有 DateTime 字段可被 Prisma 正常读取
4. Vercel 环境变量指向新库

### 关键文件
- `prisma/migrate-turso.ts` — Turso 建表 + 种子
- `src/lib/db.ts` — 数据库连接
- `next.config.ts` — serverExternalPackages
- `turso-backup.sql` — 当前数据库备份（21行）

### 包版本
prisma 6.19.3, @prisma/client 6.19.3, @prisma/adapter-libsql 6.19.3, @libsql/client 0.14.0

### 禁止
- 改 Prisma 版本或 adapter 初始化方式
- 改 DateTime 为 String
- DROP 旧 Turso 数据库
