
import type { CommandDefinition } from '../types';

/**
 * ssh 命令 - SSH 远程连接
 */
const sshCommand: CommandDefinition = {
    name: 'ssh',
    description: 'SSH 远程连接',
    options: [
        { text: '-p', type: 'option', description: '端口', priority: 100, usage: '-p 22' },
        { text: '-i', type: 'option', description: '私钥文件', priority: 95, usage: '-i ~/.ssh/id_rsa' },
        { text: '-l', type: 'option', description: '用户名', priority: 90, usage: '-l root' },
        { text: '-o', type: 'option', description: '配置选项', priority: 85, usage: '-o StrictHostKeyChecking=no' },
        { text: '-v', type: 'option', description: '详细输出', priority: 80 },
        { text: '-vv', type: 'option', description: '更详细输出', priority: 75 },
        { text: '-vvv', type: 'option', description: '最详细输出', priority: 70 },
        { text: '-N', type: 'option', description: '不执行命令', priority: 65 },
        { text: '-f', type: 'option', description: '后台运行', priority: 60 },
        { text: '-L', type: 'option', description: '本地端口转发', priority: 55, usage: '-L 8080:localhost:80' },
        { text: '-R', type: 'option', description: '远程端口转发', priority: 50, usage: '-R 8080:localhost:80' },
        { text: '-D', type: 'option', description: 'SOCKS 代理', priority: 45, usage: '-D 1080' },
        { text: '-X', type: 'option', description: 'X11 转发', priority: 40 },
        { text: '-A', type: 'option', description: '代理转发', priority: 35 },
        { text: '-t', type: 'option', description: '强制分配 TTY', priority: 30 },
        { text: '-C', type: 'option', description: '压缩传输', priority: 25 }
    ]
};

export default sshCommand;
