FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# 将 dist 同步到挂载的宿主机目录（项目内 ./dist）
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist

VOLUME ["/output"]

CMD ["sh", "-c", "rm -rf /output/* && cp -a /app/dist/. /output/ && echo '已输出到项目 dist 目录' && ls -la /output"]



/home/akado/sys/vue-project/dist