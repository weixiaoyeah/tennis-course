# 服务更新说明 · 部署 SOP

> **每次发布/部署新功能、修复、数据变更时，必须严格按本文档执行。**
> 发布完成后，在 `deploy/RELEASES.md` 顶部登记。

## 一、版本体系总览

本项目采用 **代码 / 服务 / 数据 三层版本管理**：

| 层 | 版本标识 | 存储位置 | 变更方式 |
|----|----------|----------|----------|
| **代码** | Git 短 SHA（GitHub `main`） | GitHub：`weixiaoyeah/tennis-course` | `git commit` + `git push` |
| **服务** | systemd 服务 + 构建产物 | 服务器 `/root/tennis-course` | 服务器 `git fetch` + 构建 + 重启 |
| **数据** | `backups/*.json` 归档 | 仓库 `backups/` 目录 | 备份/回滚（见第五节） |

## 二、环境与访问信息

- **服务器**：火山云 ECS，IP `115.190.216.16`，SSH 用户 `root`（密钥 `1016D.pem`）
- **项目路径**：`/root/tennis-course`
- **访问地址**：`http://115-190-216-16.nip.io`
- **前端服务**：systemd `tennis-frontend`，`serve` 静态 dist，端口 3000
- **后端服务**：systemd `tennis-backend`，Express，端口 5000
- **反向代理**：nginx（`/` → 3000，`/api` → 5000）
- **Node 版本**：`/root/.nvm/versions/node/v20.20.2/bin`
- **数据库**：Supabase 云端（`COZE_SUPABASE_URL`），配置在 `server/.env`（不进 git）

## 三、代码变更流程（本地 → GitHub）

1. 本地修改代码
2. 静态校验通过：
   ```bash
   pnpm -w lint:all
   ```
3. 提交并推送：
   ```bash
   git add -A
   git commit -m "feat/fix/docs: 描述"
   git push origin main
   ```
4. 记录本次发布功能到 `deploy/RELEASES.md`

## 四、部署流程（服务器）

> 服务器无法直连 GitHub，需走国内镜像 `ghproxy.net`。

```bash
# 1. 拉取最新代码
ssh -i /tmp/1016D.pem root@115.190.216.16 \
  'cd /root/tennis-course && \
   git fetch https://ghproxy.net/https://github.com/weixiaoyeah/tennis-course.git main && \
   git reset --hard FETCH_HEAD'

# 2. 重建前后端（Node 20 路径）
ssh -i /tmp/1016D.pem root@115.190.216.16 \
  'cd /root/tennis-course && export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH && \
   (cd server && npm run build) && \
   (cd client && npx expo export --platform web)'

# 3. 重启服务
ssh -i /tmp/1016D.pem root@115.190.216.16 \
  'systemctl restart tennis-backend tennis-frontend'

# 4. 服务状态
ssh -i /tmp/1016D.pem root@115.190.216.16 \
  'systemctl is-active tennis-backend tennis-frontend'
```

## 五、数据备份 / 回滚流程 [CRITICAL]

> **线上 Supabase 是唯一真实数据版本，任何数据变更前必须备份。**

### 5.1 备份（快照）
```bash
# 本地：从 dev 后端导出各表快照到 backups/
curl -s http://localhost:9091/api/v1/lessons   > backups/lessons_<date>.json
curl -s http://localhost:9091/api/v1/teachers  > backups/teachers_<date>.json
curl -s http://localhost:9091/api/v1/courses   > backups/courses_<date>.json
curl -s http://localhost:9091/api/v1/stats     > backups/stats_<date>.json
```

### 5.2 回滚（仅删确认为测试/非真实的数据）
1. 先写 `*_pre_rollback_<date>.json` 快照存档
2. 删除测试数据（通过 SQL 或后端逻辑）
3. 沉淀 `*_rollback_<date>.json` 真实基线
4. 更新 `backups/README_<date>.md`

### 5.3 数据变更黄金法则
- **删除前必须备份**
- **只删测试/非真实数据**，真实数据保留
- 排期状态被误改时，恢复正确状态
- 完成后更新 `deploy/RELEASES.md` 数据版本

## 六、发布前检查清单 [CRITICAL]

完成以下所有项方可交付：

- [ ] 代码静态校验通过（`pnpm -w lint:all`）
- [ ] 路由一致性检查通过（`app_check`）
- [ ] 本地/生产后端接口 curl 冒烟通过
- [ ] 前端页面与 API 存活（5000/3000，页面 200，`/api/v1/health` ok）
- [ ] 服务日志无新报错
- [ ] **本地测试数据已清理干净，未污染线上**
- [ ] `deploy/RELEASES.md` 已登记本次版本
- [ ] 生产功能已通过 `http://115-190-216-16.nip.io` 验证

## 七、回滚教程（功能异常时）

服务异常时，回退到上一个已知良好版本：

```bash
# 服务器回退到上一个提交
ssh -i /tmp/1016D.pem root@115.190.216.16 \
  'cd /root/tennis-course && git log --oneline -5 && \
   git reset --hard <上一步的SHA> && \
   export PATH=/root/.nvm/versions/node/v20.20.2/bin:$PATH && \
   (cd server && npm run build) && (cd client && npx expo export --platform web) && \
   systemctl restart tennis-backend tennis-frontend'
```

## 八、常见问题
- **服务器重启后服务未自启**：`systemctl is-enabled tennis-backend tennis-frontend`，未启用则 `systemctl enable`
- **前端构建产物未包含改动**：确认 `npx expo export --platform web` 成功且 dist 时间戳为最新
- **SSH 连接失败**：确认密钥 `/tmp/1016D.pem` 存在且 `chmod 600`