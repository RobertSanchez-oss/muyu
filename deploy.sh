#!/bin/bash

# ============ 配置区域 - 修改这里 ============
SERVER_USER="root"                    # 服务器用户名
SERVER_IP="你的服务器IP"               # 服务器 IP 地址
SERVER_PATH="/var/www/muyu"           # 服务器上的目标路径
# ============================================

echo "📦 打包项目..."
npm run build

echo "🚀 上传到服务器..."
scp -r dist/* ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}

echo "✅ 部署完成！"
