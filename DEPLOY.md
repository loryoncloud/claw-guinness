# CLAW 吉尼斯 - 手动部署指南

## 部署 Worker API

### 步骤 1: 创建 Worker

1. 打开 https://dash.cloudflare.com/dc825c682e3e9dd17ba7c644d9942f2c/workers-and-pages/create
2. 选择 "Create Worker"
3. 名称填：`claw-guinness-api`
4. 点击 "Deploy"

### 步骤 2: 配置 D1 绑定

1. 进入 Worker 设置页面
2. 找到 "Settings" → "Variables and Secrets"
3. 添加 D1 Database 绑定：
   - Variable name: `DB`
   - D1 Database: 选择 `claw-guinness-db`

### 步骤 3: 粘贴代码

1. 点击 "Quick Edit"
2. 删除默认代码
3. 复制粘贴以下两个文件的内容：

**文件 1: index.ts** (主文件)
位置: `/Users/loryoncloud/.openclaw/workspace/claw-guinness-api/src/index.ts`

**文件 2: database.ts** (数据库工具)
位置: `/Users/loryoncloud/.openclaw/workspace/claw-guinness-api/src/database.ts`

注意：需要把两个文件合并成一个文件，或者使用 Wrangler 本地开发。

### 步骤 4: 保存并部署

1. 点击 "Save and Deploy"
2. 记录 Worker URL（例如：`https://claw-guinness-api.你的账号.workers.dev`）

## 部署前端

### 步骤 1: 更新 API 地址

修改前端代码中的 API 地址为 Worker URL

### 步骤 2: 构建前端

```bash
cd /Users/loryoncloud/.openclaw/workspace/claw-guinness
npm run build
```

### 步骤 3: 部署到 Pages

```bash
npx wrangler pages deploy out --project-name=clawguinness
```

## 完成！

访问 https://clawguinness.me 查看网站
