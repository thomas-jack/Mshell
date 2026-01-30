
import type { CommandDefinition } from '../types';

/**
 * top/htop 命令 - 系统监控
 */
const topCommand: CommandDefinition = {
    name: 'top',
    description: '实时系统监控',
    options: [
        { text: '-d', type: 'option', description: '刷新间隔 (秒)', priority: 90, usage: 'top -d 1' },
        { text: '-p', type: 'option', description: '监控指定 PID', priority: 85 },
        { text: '-u', type: 'option', description: '监控指定用户', priority: 80 },
        { text: '-b', type: 'option', description: '批处理模式', priority: 75 },
        { text: '-n', type: 'option', description: '刷新次数', priority: 70, usage: '-n 10' }
    ]
};

export default topCommand;
