# 部署配置备份
# 用于火山云 ECS 服务器 (115.190.216.16)

## 目录
- user: root
- 项目路径: /root/tennis-course
- 前端: serve 静态服务, dist 目录, 端口 3000
- 后端: express, 端口 5000
- 反向代理: nginx, 域名 115-190-216-16.nip.io, 端口 80

## 服务单元文件

### /etc/systemd/system/tennis-backend.service
[Unit]
Description=Tennis Course Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/tennis-course/server
ExecStart=/tmp/node-v20.18.0-linux-x64/bin/node dist/index.js
Environment=NODE_ENV=production
Environment=PORT=5000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

### /etc/systemd/system/tennis-frontend.service
[Unit]
Description=Tennis Course Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/tennis-course/client
ExecStart=/tmp/node-v20.18.0-linux-x64/bin/serve dist -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

## Nginx 配置 (倒代)
### /etc/nginx/sites-enabled/tennis-app
server {
    listen 80;
    server_name 115-190-216-16.nip.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

## 环境变量 (敏感, 保存在 .env 文件)
- server/.env: COZE_SUPABASE_URL / COZE_SUPABASE_ANON_KEY / COZE_SUPABASE_SERVICE_ROLE_KEY
- client/.env: EXPO_PUBLIC_BACKEND_BASE_URL=http://115.190.216.16:5000