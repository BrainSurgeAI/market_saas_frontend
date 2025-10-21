#!/bin/bash
set -e  # 任何命令失败时退出

# 注册表配置
registry="swr.cn-north-4.myhuaweicloud.com/cloud-blh"

# 前端配置
frontend_version="v0.7.42"
frontend_image="$registry/market-saas-frontend:$frontend_version"

# Nginx配置
nginx_version="alpine3.19-perl"  # 更新到实际存在的版本
nginx_image="$registry/nginx:$nginx_version"

echo "===== 构建前端镜像 ====="
docker build --no-cache -t $frontend_image .
echo "前端镜像构建完成: $frontend_image"

echo "===== 推送前端镜像 ====="
docker push $frontend_image
echo "前端镜像推送完成"

echo "===== 清理前端镜像 ====="
docker rmi $frontend_image

echo "所有镜像构建和推送已完成"