
import type { CommandDefinition } from '../types';

/**
 * ps 命令 - 进程状态
 */
const psCommand: CommandDefinition = {
    name: 'ps',
    description: '查看进程状态',
    options: [
        { text: 'aux', type: 'option', description: '所有进程详细信息', priority: 100, usage: 'ps aux' },
        { text: '-ef', type: 'option', description: '所有进程完整格式', priority: 95, usage: 'ps -ef' },
        { text: '-e', type: 'option', description: '所有进程', priority: 90 },
        { text: '-f', type: 'option', description: '完整格式', priority: 85 },
        { text: '-u', type: 'option', description: '指定用户', priority: 80, usage: 'ps -u root' },
        { text: '--forest', type: 'option', description: '树形显示', priority: 75 },
        { text: '-p', type: 'option', description: '指定 PID', priority: 70 }
    ]
};

export default psCommand;
