
import type { CommandDefinition } from '../types';

/**
 * ss 命令 - Socket 统计
 */
const ssCommand: CommandDefinition = {
    name: 'ss',
    description: 'Socket 统计 (替代 netstat)',
    options: [
        { text: '-tulpn', type: 'option', description: '监听端口 (推荐)', priority: 100, usage: 'ss -tulpn' },
        { text: '-an', type: 'option', description: '所有连接', priority: 95 },
        { text: '-t', type: 'option', description: 'TCP 连接', priority: 90 },
        { text: '-u', type: 'option', description: 'UDP 连接', priority: 85 },
        { text: '-l', type: 'option', description: '监听状态', priority: 80 },
        { text: '-p', type: 'option', description: '显示进程', priority: 75 },
        { text: '-n', type: 'option', description: '数字格式', priority: 70 },
        { text: '-s', type: 'option', description: '统计摘要', priority: 65 }
    ]
};

export default ssCommand;
