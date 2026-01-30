const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../public/specs/docker.json');

const translations = {
    // --- Commands ---
    "A self-sufficient runtime for containers": "容器运行时",
    "Attach local standard input, output, and error streams to a running container,": "连接到正在运行的容器的标准输入/输出",
    "Build an image from a Dockerfile": "从 Dockerfile 构建镜像",
    "Create a new image from a container's changes": "从容器的更改创建新镜像",
    "Copy files/folders between a container and the local filesystem": "在容器和本地文件系统之间复制文件/文件夹",
    "Create a new container": "创建一个新容器",
    "Inspect changes to files or directories on a container's filesystem": "检查容器文件系统的更改",
    "Get real time events from the server": "从服务器获取实时事件",
    "Run a command in a running container": "在运行的容器中执行命令",
    "Export a container's filesystem as a tar archive": "将容器文件系统导出为 tar 归档",
    "Show the history of an image": "显示镜像历史",
    "List images": "列出镜像",
    "Import the contents from a tarball to create a filesystem image": "导入 tarball 内容以创建文件系统镜像",
    "Return low-level information on Docker objects": "查看 Docker 对象的底层信息",
    "Kill one or more running containers": "强制停止一个或多个运行中的容器",
    "Load an image from a tar archive or STDIN": "从 tar 归档或 STDIN 加载镜像",
    "Log in to a Docker registry": "登录 Docker 仓库",
    "Log out from a Docker registry": "登出 Docker 仓库",
    "Fetch the logs of a container": "获取容器日志",
    "Pause all processes within one or more containers": "暂停容器内的所有进程",
    "List port mappings or a specific mapping for the container": "列出容器的端口映射",
    "List containers": "列出容器",
    "Pull an image or a repository from a registry": "从仓库拉取镜像",
    "Push an image or a repository to a registry": "将镜像推送到仓库",
    "Rename a container": "重命名容器",
    "Restart one or more containers": "重启一个或多个容器",
    "Remove one or more containers": "删除一个或多个容器",
    "Remove one or more images": "删除一个或多个镜像",
    "Run a command in a new container": "在容器中运行命令",
    "Save one or more images to a tar archive (streamed to STDOUT by default)": "将镜像保存为 tar 归档",
    "Search the Docker Hub for images": "在 Docker Hub 搜索镜像",
    "Start one or more stopped containers": "启动一个或多个停止的容器",
    "Display a live stream of container(s) resource usage statistics": "显示容器资源使用统计的实时流",
    "Stop one or more running containers": "停止一个或多个运行中的容器",
    "Manage Docker": "管理 Docker",
    "Display system-wide information": "显示系统级信息",
    "Show the Docker version information": "显示 Docker 版本信息",
    "Update configuration of one or more containers": "更新一个或多个容器的配置",
    "Manage volumes": "管理数据卷",
    "Manage networks": "管理网络",
    "Manage Swarm": "管理 Swarm 集群",
    "Unpause all processes within one or more containers": "恢复容器内所有暂停的进程",
    "Manage trusts": "管理信任",
    "Manage Docker secrets": "管理 Docker 密钥",
    "Manage Docker configs": "管理 Docker 配置",
    "Manage Docker plugins": "管理 Docker 插件",
    "Manage Docker nodes": "管理 Docker 节点",
    "Manage Docker services": "管理 Docker 服务",
    "Manage Docker stacks": "管理 Docker 栈",

    // --- Common Options ---
    "Assign a name to the container": "为容器指定一个名称",
    "Publish a container's port(s) to the host": "将容器端口映射到宿主机",
    "Publish all exposed ports to random ports": "将所有暴露端口映射到随机端口",
    "Keep STDIN open even if not attached": "保持 STDIN 打开",
    "Allocate a pseudo-TTY": "分配一个伪终端",
    "Run container in background and print container ID": "后台运行容器并打印容器 ID",
    "Automatically remove the container when it exits": "容器退出时自动删除",
    "Bind mount a volume": "挂载数据卷",
    "Set environment variables": "设置环境变量",
    "Read in a file of environment variables": "从文件读取环境变量",
    "Set the working directory for the RUN instructions during build": "设置工作目录",
    "Working directory inside the container": "容器内的工作目录",
    "Username or UID (format: <name|uid>[:<group|gid>])": "用户名或 UID",
    "Set metadata on an image": "设置镜像元数据",
    "Set metadata for an image": "设置镜像元数据",
    "Set meta data on a container": "设置容器元数据",
    "Name and optionally a tag in the 'name:tag' format": "镜像名称及标签 (name:tag)",
    "Dockerfile name (Default is 'PATH/Dockerfile')": "Dockerfile 名称",
    "Name of the Dockerfile (Default is 'PATH/Dockerfile')": "Dockerfile 名称 (默认为 PATH/Dockerfile)",
    "Do not use cache when building the image": "构建时不使用缓存",
    "Always attempt to pull a newer version of the image": "总是尝试拉取镜像的更新版本",
    "Suppress the build output and print image ID on success": "静默模式，仅在成功时打印镜像 ID",
    "Print usage": "打印帮助信息",
    "Show the version": "显示版本",
    "Output destination (format: type=local,dest=path)": "输出目标",
    "Secret file to expose to the build (only if BuildKit enabled): id=mysecret,src=/local/secret": "暴露给构建的密钥文件",
    "SSH agent socket or keys to expose to the build (only if BuildKit enabled) (format: default|<id>[=<socket>|<key>[,<key>]])": "暴露给构建的 SSH agent",
    "Container host name": "容器主机名",
    "IPv4 address (e.g., 172.30.100.104)": "IPv4 地址",
    "IPv6 address (e.g., 2001:db8::33)": "IPv6 地址",
    "Container MAC address (e.g., 92:d0:c6:0a:29:33)": "容器 MAC 地址",
    "Add a custom host-to-IP mapping (host:ip)": "添加自定义主机名到 IP 的映射",
    "Connect a container to a network": "将容器连接到网络",
    "Attach to STDIN, STDOUT or STDERR": "连接到 STDIN, STDOUT 或 STDERR",
    "CPU shares (relative weight)": "CPU 份额 (相对权重)",
    "Memory limit": "内存限制",
    "Run an init inside the container that forwards signals and reaps processes": "在容器内运行 init 进程",
    "Set custom DNS servers": "设置自定义 DNS 服务器",
    "Proxy all received signals to the process (default true)": "代理所有接收到的信号到进程"
};

try {
    const data = fs.readFileSync(targetFile, 'utf8');
    let json = JSON.parse(data);
    let count = 0;

    function translate(obj) {
        if (obj.description) {
            // Direct match
            if (translations[obj.description]) {
                obj.description = translations[obj.description];
                count++;
            }
            // Partial match for "default" values often found in brackets?
            // For now, stick to direct map to avoid bad grammar.
        }

        if (obj.subcommands) {
            obj.subcommands.forEach(translate);
        }
        if (obj.options) {
            obj.options.forEach(translate);
        }
        if (obj.args) {
            if (Array.isArray(obj.args)) {
                obj.args.forEach(translate);
            } else {
                translate(obj.args);
            }
        }
        if (obj.suggestions) {
            obj.suggestions.forEach(translate);
        }
    }

    translate(json);

    fs.writeFileSync(targetFile, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Docker spec translated successfully. Modified ${count} descriptions.`);
} catch (err) {
    console.error(err);
    process.exit(1);
}
