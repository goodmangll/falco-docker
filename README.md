![falco-docker](https://socialify.git.ci/goodmangll/falco-docker/image?description=1&descriptionEditable=%E6%9B%B4%E5%8A%A0%E5%BC%BA%E5%A4%A7%E7%9A%84%E5%AA%92%E4%BD%93%E6%9C%8D%E5%8A%A1%E4%BB%A3%E7%90%86%E5%B7%A5%E5%85%B7%E3%80%82&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Fgithub.com%2Fgoodmangll%2Ffalco-docker%2Fblob%2Fmaster%2Fassets%2Flogo.png%3Fraw%3Dtrue&name=1&owner=1&pattern=Floating%20Cogs&pulls=1&stargazers=1&theme=Light)

## 已知BUG。
- 当启动falco时alist未启动或者正在初始化，falco会进入阻塞状态，并且不能自动恢复，只能等待手动重启
- strm(alist链接) + jellyfin官方PC客户端外挂字幕无法加载

## 下个版本计划
- 支持plex直连。
- 提供多版本代理（可以同时代理多个jellyfin和emby服务端）
- 修复strm模式如果视频第一次播放，获取视频信息过慢的问题

## 功能
- 配合alist可实现jellyfin、emby直连。
- 可以配置用户与盘的映射，在播放时，会自动根据用户与盘的映射，自动转盘然后进行直连播放（可防止阿里云盘单账号多IP访问封号的风险）
- 转盘产生的临时文件会在退出播放后自动删除，防止网盘空间不足

## 建议
- jellyfin推荐使用镜像nyanmisaka/jellyfin:latest，优先在这个版本中做测试。

## 搭建

### 1. 准备：alist挂载多个盘（拥有直连互相秒传的盘，比如阿里云盘，115）

在alist盘配置中 **<u>开启秒传</u>**，**<u>移除方式改为删除（阿里云盘Open默认是回收站）</u>** 。

<img src="assets/image-20240130114921-9txb12m.png" width="150">

Q：为什么要把移除方式改为删除？

A：因为本程序有自动对临时目录进行清除的功能，只有在删除后才不会占用网盘空间。这样做是避免网盘在转存过多缓存后空间不足。

### 2. 拉取代码

```bash
git clone https://github.com/goodmangll/falco-docker.git
```

### 3. 配置

找到 `config/config.yml`​​ 进行配置

```yml
# Falco版本号
# 版本号会随着程序自动更新，不需要手动修改
version: 1.10.3

# 临时文件目录
tmpName: facloTmp

# alist相关配置
alist:
  # alist的token
  token: 123
  # alist的地址
  address: http://172.17.0.1:5244

# emby或者jellyfin的相关配置
emby:   
  # 地址
  address: http://172.17.0.1:8096
  # 认证令牌，在emby或者jellyfin后台获取
  apiKey: 123
  # 磁盘映射目录。比如我emby有个电影的媒体库路径为 “/home/webdav/CloudDrive/115/电影”
  # 而是我alist的中对应的这个路径为“/115/电影”，那么这里就填“/home/webdav/CloudDrive”
  # 公式：/home/webdav/CloudDrive/115/电影 - /115/电影 = /home/webdav/CloudDrive
  mountPath: /home/webdav/CloudDrive
  # 代理端口，如果使用host模式，请把端口改为宿主机没有占用的端口，并且在连接emby时使用此端口
  proxyPort: 80

# 不需要转盘的盘列表，即使在用户点播的视频不在这个用户的所属盘，但是也不需要转盘
# noTransferDiskList:
#   - /115
#   - /ali

# 游客模式，即使该用户没有配置所属盘但是也可以播放视频，但是如果播放需要转盘的视频，则播放失败
guestMode: false

# 本地磁盘路径，如果你在emby媒体库中配置了本地磁盘，那么这里就填磁盘路径
# localDiskPaths:
#   - /media01
#   - /media02

# 配置emby,jellyfin用户与所属盘的映射
# 比如 张三: /ali
# 张三是emby中的用户名称 : ali为alist中的盘路径
userDiskContext:
  张三: /ali
  李四: /ali01
```

### 4. 启动

回到根目录（docker-compose.yml所在的目录）​ 执行下面命令进行启动

```sh
docker-compose up -d
```

可使用docker ps 查看这两个容器进行启动

也可通过进入 `/logs`​​ 目录 执行以下目录进行查看日志，可以看到目录下面有三个日志文件
```text
all.log     全部类型的日志，排查问题时看这个日志
info.log    正常类型的日志，一般我们会看这个日志
error.log   错误类型的日志，程序异常时查看这个日志
```

```sh
tail -f info.log
```

如果容器正常启动，也可以通过web页面 http://localhost:13000/html/log.html 进行查看日志

## 如何使用？
在用客户端进行连接时：

bridge（默认）网络模式在连接时使用 **<u>8095（可配置）</u>**  的端口

host网络模式在连接时使用配置的 **<u>proxyPort</u>** 端口
