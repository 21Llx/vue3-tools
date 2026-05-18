# 使用完整 Node 镜像（不是 alpine）
FROM node:18-bullseye AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 清理并重新安装
RUN npm install
    

# 复制源码
COPY . .

# 构建
RUN npm run build

# 生产阶段 - 使用 nginx alpine（这个没问题）
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]