# 项目常用命令

## 后端开发
```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产模式启动
npm start

# 代码检查
npm run lint

# 代码自动修复
npm run lint:fix

# 运行测试
npm run test
```

## 前端开发
```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## Docker 部署
```bash
# 配置云端 API 密钥
cp config/cloud-api.env.template .env.cloud
# 编辑 .env.cloud 文件，设置 API 密钥

# 启动云端 API 服务
./scripts/docker-start.sh

# 或使用 docker-compose
docker-compose up -d

# 查看服务状态
./scripts/docker-status.sh

# 测试服务功能
./scripts/docker-test.sh

# 停止服务
docker-compose down
```

## 数据库操作
```bash
# 创建数据库表
npm run db:migrate

# 填充测试数据
npm run db:seed
```