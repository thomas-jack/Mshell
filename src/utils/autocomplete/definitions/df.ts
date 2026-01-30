
import type { CommandDefinition } from '../types';

/**
 * df 命令 - 磁盘使用情况
 */
const dfCommand: CommandDefinition = {
    name: 'df',
    description: '查看磁盘使用情况',
    options: [
        { text: '-h', type: 'option', description: '人类可读格式', priority: 100, usage: 'df -h' },
        { text: '-T', type: 'option', description: '显示文件系统类型', priority: 95 },
        { text: '-i', type: 'option', description: '显示 inode 信息', priority: 90 },
        { text: '-a', type: 'option', description: '显示所有文件系统', priority: 85 },
        { text: '-l', type: 'option', description: '仅本地文件系统', priority: 80 }
    ]
};

export default dfCommand;
