
import type { CommandDefinition } from '../types';

/**
 * netstat 命令 - 网络状态
 */
const netstatCommand: CommandDefinition = {
    name: 'netstat',
    description: '查看网络连接状态',
    options: [
        { text: '-tulpn', type: 'option', description: '监听端口 (推荐)', priority: 100, usage: 'netstat -tulpn' },
        { text: '-an', type: 'option', description: '所有连接 (数字格式)', priority: 95, usage: 'netstat -an' },
        { text: '-t', type: 'option', description: 'TCP 连接', priority: 90 },
        { text: '-u', type: 'option', description: 'UDP 连接', priority: 85 },
        { text: '-l', type: 'option', description: '监听状态', priority: 80 },
        { text: '-p', type: 'option', description: '显示进程', priority: 75 },
        { text: '-n', type: 'option', description: '数字格式', priority: 70 },
        { text: '-r', type: 'option', description: '路由表', priority: 65 }
    ]
};

export default netstatCommand;
