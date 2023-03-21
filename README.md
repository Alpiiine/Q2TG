# Q2TG
QQ 群与 Telegram 群相互转发的 bot

## 安装方法
### 部署 Chat-Record-Viewer

Q2TG 会使用这个 Chat-Record-Viewer 实例来保存和展示转发的多条消息记录

1. 登录 Cloudflare 并创建一个 [KV 命名空间](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces)
2. Fork 或者在自己账号下导入 [Chatrecord-viewer](https://github.com/Clansty/chatrecord-viewer-frontend)仓库。如果用[导入](https://github.com/new/import)的话，可以设置成私有
3. [创建一个新的 Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages/new)，选择刚刚 Fork 的仓库
4. 设置构建命令为 `yarn build`，构建输出目录为 `dist`
5. 在环境变量中设置一个名称为 `API_KEY` 的变量，值可以随机生成一串密钥，待会儿将作为 API Key
6. 部署完成后，进入「设置」「函数」，将变量名称 `DATA_STORE` 绑定到前面创建的 KV 命名空间

可选绑定域名

### 获取 Telegram API ID

1. 打开 [My Telegram Core](https://my.telegram.org/apps) 并登录
2. 设置你应用的信息
3. 提交后，可以获取 `api_id` 和 `api_hash`

### 创建 Telegram 机器人

如果你已经有了 Telegram Bot Token 并且已经确保关闭 Group Privacy，可以跳过此步骤

1. 在 Telegram 中找到 [BotFather](https://t.me/botfather)
2. 输入 `/newbot` 命令，根据提示创建一个新的机器人账号
3. 输入 `/setprivacy` 命令，关闭你刚才创建的机器人账号的 Group Privacy

### 部署 Q2TG v2

需要准备一台安装了 Docker 和 docker-compose，能同时连接 QQ 和 Telegram 服务器，并能保持开启的机器

Q2TG v2 需要 PostgreSQL，如果没有的话，会在 docker-compose 时创建一个。请确保服务器资源充足

1. 在服务器上，创建一个文件夹用来保存 Q2TG 的数据
2. 下载 [docker-compose.yaml](https://raw.githubusercontent.com/Alpiiine/Q2TG/rainbowcat/docker-compose.yaml)
3. 修改下方的环境变量

    ```yaml
    - TG_API_ID=刚才获取的 api_id
    - TG_API_HASH=刚才获取的 api_hash
    - TG_BOT_TOKEN=刚才创建的 Bot Token
    - DATABASE_URL=postgres://user:password@postgres/db_name
    - CRV_API=第一步部署 Char-Record-Viewer 的地址加上 /api，比如说 https://example.pages.dev/api
    - CRV_KEY=第一步设置的 API Key
    # 如果不需要通过代理上网，则不需要下面两个变量
    - PROXY_IP=代理服务器的 IP 地址
    - PROXY_PORT=代理服务器的端口
    ```

4. `docker compose up -d`

v2.x 版本同时需要机器人账号以及登录 Telegram 个人账号，需要自己注册 Telegram API ID，并且还需要配置一些辅助服务。如果没有条件，可以使用 [v1.x](https://github.com/Clansty/Q2TG/tree/main) 版本

### 配置机器人
由于个人模式可能会被 Telegram 封号（详见原 Repo issues），所以建议使用群组模式。

1. 把 Telegram 机器人拉入 Telegram 群组，并设置为管理员。
2. 私聊机器人 `/setup`，并选择`群组模式`。
3. 输入要在 QQ 上使用的号码，然后输入密码。
4. 如果出现登录验证，请按提示操作。
5. 登录完成后，按提示登录 Telegram 个人账号。
6. 登录完成后，发送 `/newinstance` 创建一个新的转发实例。
7. 选择要转发的 QQ 群，然后选择要转发到的 Telegram 群。
8. 完成配置。

## 支持的消息类型

- [x] 文字（双向）
- [x] 图片（双向）
  - [x] GIF
  - [x] 闪照

    闪照每个 TG 用户也只能查看 5 秒
- [x] 图文混排消息（双向）
- [x] 大表情（双向）
  - [x] TG 中的动态 Sticker

    目前是[转换成 GIF](https://github.com/ed-asriyan/tgs-to-gif) 发送的，并且可能有些[问题](https://github.com/ed-asriyan/tgs-to-gif/issues/13#issuecomment-633244547)
- [x] 视频（双向）
- [x] 语音（双向）
- [x] 小表情（可显示为文字）
- [x] 链接（双向）
- [x] JSON/XML 卡片

  （包括部分转化为小程序的链接）
- [x] 位置（TG -> QQ）
- [x] 群公告
- [x] 回复（双平台原生回复）
- [x] 文件

  QQ -> TG 按需获取下载地址

  TG -> QQ 将自动转发 20M 一下的小文件
- [x] 转发多条消息记录
- [x] TG 编辑消息（撤回再重发）
- [x] 双向撤回消息
- [x] 戳一戳

## 关于模式

### 群组模式

群组模式就是 1.x 版本唯一的模式，是给群主使用的。如果群组想要使自己的 QQ 群和 Telegram 群联通起来，就使用这个模式。群组模式只可以给群聊配置转发，并且转发消息时会带上用户在当前平台的发送者名称。

### 个人模式

个人模式适合 QQ 轻度使用者，TG 重度使用者。可以把 QQ 的好友和群聊搬到 Telegram 中。个人模式一定要登录机器人主人自己的 Telegram 账号作为 UserBot。可以自动为 QQ 中的好友和群组创建对应的 Telegram 群组，并同步头像简介等信息。当有没有创建关联的好友发起私聊的时候会自动创建 Telegram 中的对应群组。个人模式在初始化的时候会自动在 Telegram 个人账号中创建一个文件夹来存储所有来自 QQ 的对应群组。消息在从 TG 转发到 QQ 时不会带上发送者昵称，因为默认发送者只有一个人。

## 如何撤回消息

在 QQ 中，直接撤回相应的消息，撤回操作会同步到 TG

在 TG 中，可以选择以下操作之一：

- 将消息内容编辑为 `/rm`
- 回复要撤回的消息，内容为 `/rm`。如果操作者在 TG 群组中没有「删除消息」权限，则只能撤回自己的消息
- 如果正确配置了个人账号的 User Bot，可以直接删除消息

为了使撤回功能正常工作，TG 机器人需要具有「删除消息」权限，QQ 机器人需要为管理员或群主

即使 QQ 机器人为管理员，也无法撤回其他管理员在 QQ 中发送的消息

## 免责声明

一切开发旨在学习，请勿用于非法用途。本项目完全免费开源，不会收取任何费用，无任何担保。请勿将本项目用于商业用途。由于使用本程序造成的任何问题，由使用者自行承担，项目开发者不承担任何责任。

本项目基于 AGPL 发行。修改、再发行和运行服务需要遵守 AGPL 许可证，源码需要和服务一起提供。

## 许可证

```
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
