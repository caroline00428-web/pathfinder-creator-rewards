# 🔧 生产数据修复指南

## 📋 概览

这个文档说明如何修复生产环境中的 POINTS 方案奖励错误。

**错误描述：**
- POINTS 方案玩家领取的点数被记录为原始钻石数量，而不是正确的转换值（钻石÷100）
- 例：300 钻石应该给 3 点数，但被记录成 300 点数

**修复办法：**
- 创建 REFUND 交易撤销错误金额
- 创建 MILESTONE_REWARD 交易授予正确金额
- 更新钱包余额
- 完整的审计跟踪

---

## 🚀 使用步骤

### Step 1: 准备凭证

获取生产数据库凭证（从 Vercel 或 .env.local）：

```bash
# 从 .env.local 获取
TURSO_DATABASE_URL="libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIs..."
```

### Step 2: 运行修复脚本

```bash
cd C:\Users\Leocool\creator-reward-platform

# 方式 A: 使用环境变量
$env:DATABASE_URL="libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io"
$env:AUTH_TOKEN="eyJhbGciOiJFZERTQSIs..."
node scripts/repair_production.js

# 方式 B: 命令行传递（如果方式 A 不工作）
DATABASE_URL="libsql://pathfinder-test-..." AUTH_TOKEN="eyJ..." node scripts/repair_production.js
```

### Step 3: 验证修复

脚本会输出：
```
✅ 修复完成！
📊 受影响的 Creator 数: X
💰 撤销的总金额: Y 点数
💎 授予的正确金额: Z 点数
💵 修复的多给金额: Y-Z 点数
```

修复日志会保存到 `repair_log_YYYY-MM-DD.json`

---

## 📊 修复逻辑

对每个 POINTS 方案的 Creator：

1. **查询所有 Milestone Claims**
2. **对每个 Claim：**
   ```
   原始值 = milestone.creditsAwarded（如 300）
   错误记录 = 300 点数
   正确值 = 300 ÷ 100 = 3 点数
   ```
3. **创建两条交易记录：**
   - REFUND: -300（撤销错误）
   - MILESTONE_REWARD: +3（授予正确）
4. **更新钱包余额**
   ```
   新余额 = 当前余额 - (错误值 - 正确值)
         = 当前余额 - (300 - 3)
         = 当前余额 - 297
   ```

---

## ✅ 验证修复

修复后检查数据库：

```sql
-- 检查钱包余额是否正确
SELECT c.displayName, c.rewardScheme, cw.balance
FROM Creator c
LEFT JOIN CreditWallet cw ON c.id = cw.creatorId
WHERE c.rewardScheme = 'POINTS';

-- 检查交易历史
SELECT ct.creatorId, ct.amount, ct.type, ct.reason
FROM CreditTransaction ct
WHERE ct.type IN ('REFUND', 'MILESTONE_REWARD')
ORDER BY ct.createdAt DESC;
```

---

## ⚠️ 注意事项

1. **一次性操作**：脚本应该只运行一次。重复运行会导致多次扣除。
2. **备份**：修复前已有完整备份（`production_backup_*.json`）
3. **审计跟踪**：所有修复都会记录在 CreditTransaction 表中
4. **玩家通知**：修复后请单独通知受影响的玩家

---

## 📝 修复日志示例

```json
{
  "timestamp": "2026-08-04T12:00:00.000Z",
  "database": "libsql://pathfinder-test-...",
  "affectedCreators": 5,
  "repairs": [
    {
      "creatorId": "c_001",
      "displayName": "Player A",
      "previousBalance": 300,
      "newBalance": 3,
      "wrongTotal": 300,
      "correctTotal": 3,
      "overchargedBy": 297,
      "claimCount": 1
    }
  ],
  "summary": {
    "totalAffected": 5,
    "totalRefunded": 1500,
    "totalCorrected": 15,
    "totalOvercharged": 1485
  }
}
```

---

## 🆘 常见问题

**Q: 脚本运行失败怎么办？**
A: 检查：
- 数据库 URL 和 Token 是否正确
- 网络连接是否正常
- 凭证是否有读写权限

**Q: 如何回滚？**
A: 恢复备份 `production_backup_*.json` 中的数据

**Q: 可以修改单个 Creator 吗？**
A: 脚本会修复所有 POINTS 方案的 Creator。如需修改单个，请单独编写 SQL

---

## 📞 联系

有问题请查看：
- 备份：`production_backup_*.json`
- 分析：`repair_analysis.json`
- 代码：`scripts/repair_production.js`
