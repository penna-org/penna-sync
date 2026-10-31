# Penna Sync

[Penna（羽笔）](https://github.com/penna-org) 浏览器扩展的**自部署同步服务**。配置和 Markdown 文档同步到你自己的服务器，不经过任何第三方。

- **没有注册登录**：服务器只有一个同步空间，浏览器用「访问密钥」配对即可
- **SQLite 单文件**：所有数据都在一个数据库文件里，备份就是复制这个文件
- **一条命令部署**：Docker / Docker Compose，或者直接用 Node.js 运行
- **与官方后端接口兼容**：扩展里切到「自部署服务器」就能用，同步逻辑完全一样
- 基于 [hazejs](https://github.com/penna-org/haze) 构建，MIT 协议开源

## 同步哪些数据

| 数据 | 说明 |
|------|------|
| 扩展配置 | 翻译、AI 网关（含 API Key）、新标签页、工具等全部设置。整份 JSON 用 `APP_KEY` 加密（AES-256-GCM）后存库 |
| Markdown 文档 | 编辑器里的文档，按篇增量同步；多台设备同时修改时保留冲突副本，删除会同步到其他设备 |
| 设备 | 每台配对过的浏览器一枚令牌，可在扩展「设备」页查看与移除 |

聊天室（好友、群聊）依赖账号体系，不在自部署版本中；AI 对话记录、便签、待办只存本机，从不上传。

## 快速开始

### Docker Compose（推荐）

```bash
curl -O https://raw.githubusercontent.com/penna-org/penna-sync/main/docker-compose.yml
docker compose up -d
docker compose logs penna-sync   # 找到「已生成访问密钥」那一行
```

### Docker

```bash
docker run -d --name penna-sync --restart unless-stopped \
  -p 3000:3000 -v penna-sync-data:/data \
  ghcr.io/penna-org/penna-sync:latest

docker logs penna-sync
```

从源码构建镜像：`docker build -t penna-sync .`

### Node.js（22.12 及以上）

```bash
git clone https://github.com/penna-org/penna-sync.git && cd penna-sync
pnpm install
pnpm build
pnpm start        # 首次启动自动生成 APP_KEY 与访问密钥，执行数据库迁移
```

### 在扩展中连接

1. 打开 Penna「设置 → 账号」，选择 **自部署服务器**
2. 填写服务器地址（如 `https://sync.example.com` 或 `http://192.168.1.10:3000`）和访问密钥
3. 点击「连接并同步」，浏览器提示授权访问该地址时选择允许

第一台设备连接时，本地配置会上传；之后的设备连接时以服务器上的配置为准。

## 访问密钥

- 没有设置 `SYNC_SECRET` 时，首次启动会生成一个并打印到日志，同时保存在 `/data/sync-secret`（Node 运行时为 `./data/sync-secret`）
- 忘记了可以查看：`docker exec penna-sync cat /data/sync-secret`
- 密钥只在配对时使用，配对后每台浏览器使用各自的设备令牌。**更换密钥不会让已配对的设备掉线**；想让某台设备失效，在扩展「设备」页移除它
- 配对接口限流为每个 IP 每分钟 10 次

## 配置项

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PORT` | `3000` | 监听端口 |
| `SYNC_SECRET` | 自动生成 | 访问密钥 |
| `APP_KEY` | 自动生成 | 加密配置用的密钥，保存在 `DATA_DIR/app-key`。**丢失后已存的配置无法解密** |
| `DATA_DIR` | `/data`（Docker）/ `./data` | 数据目录 |
| `DATABASE_URL` | `file:$DATA_DIR/…db` | SQLite 文件路径 |
| `SYNC_NAME` | `自部署同步` | 扩展「账号」页显示的名字 |
| `TRUST_PROXY` | `false` | 位于反向代理之后时设为 `true`，限流才能拿到真实 IP |
| `CORS_ORIGIN` | `*` | 允许跨域访问的来源，逗号分隔 |

## HTTPS 与反向代理

浏览器扩展可以访问 `http://` 地址，局域网内直接用 IP + 端口即可。要在公网使用，请放在反向代理之后并启用 HTTPS，例如 Caddy：

```caddyfile
sync.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

同时设置 `TRUST_PROXY=true`。

## 备份与迁移

所有数据都在数据目录（Docker 卷 `penna-sync-data`）里：

| 文件 | 内容 |
|------|------|
| `penna-sync.db`（Node 运行时为 `app.db`） | SQLite 数据库 |
| `app-key` | 配置加密密钥，与数据库一起备份 |
| `sync-secret` | 访问密钥 |

```bash
docker run --rm -v penna-sync-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/penna-sync-backup.tgz -C /data .
```

升级：`docker compose pull && docker compose up -d`，启动时会自动执行数据库迁移。

使用宿主机目录代替命名卷（`-v ./data:/data`）时，容器以 `node` 用户（uid 1000）运行，请先执行 `sudo chown 1000:1000 ./data`。

## 健康检查

- `GET /health/live`：进程存活
- `GET /health/ready`：数据库可用
- `GET /api/server`：服务信息（扩展据此识别自部署服务器）

## 接口

所有接口返回 `{ code, message, data }`，`code` 为 `0` 表示成功。除配对与服务信息外都需要 `Authorization: Bearer <设备令牌>`。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/server` | 服务信息 |
| `POST` | `/api/auth/pair` | `{ secret, device }` → `{ token, user }` |
| `GET` | `/api/auth/me` | 当前同步空间 |
| `POST` | `/api/auth/logout` | 吊销当前设备令牌 |
| `GET` | `/api/auth/tokens` | 设备列表 |
| `DELETE` | `/api/auth/tokens/:id` | 移除设备 |
| `GET` | `/api/settings` | 拉取配置 `{ config, version, updatedAt, updatedBy }` |
| `PUT` | `/api/settings` | `{ config, baseVersion }`；版本不一致返回 409 `settings_conflict` 并附带服务器上的配置 |
| `DELETE` | `/api/settings` | 清空配置 |
| `GET` | `/api/documents?since=` | 增量拉取文档 `{ documents, cursor }`，含已删除文档的墓碑 |
| `PUT` | `/api/documents/:id` | `{ title, content, baseVersion, createdAt }`；冲突返回 409 `document_conflict` |
| `DELETE` | `/api/documents/:id?baseVersion=` | 删除文档（软删除） |

## 开发

```bash
pnpm install
pnpm dev          # 开发服务器，改代码即时生效
pnpm test         # 测试（内存 SQLite）
pnpm typecheck
pnpm db:generate --name <名字>   # 修改 database/schema 后生成迁移
```

目录结构：

```
app/controller     接口
app/service        同步逻辑（配置、文档、访问密钥）
app/support        同步空间所有者（代替用户表）
config             配置
database           表结构与迁移
route              路由
scripts/start.mjs  生产启动：补齐密钥 → 迁移 → 启动
```

## License

[MIT](./LICENSE)
