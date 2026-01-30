
import type { CommandDefinition } from '../types';

/**
 * history 命令 - 命令历史
 */
const historyCommand: CommandDefinition = {
    name: 'history',
    description: '查看命令历史',
    options: [
        { text: '-c', type: 'option', description: '清空历史', priority: 90 },
        { text: '-d', type: 'option', description: '删除指定行', priority: 85 },
        { text: '10', type: 'hint', description: '显示最近 10 条', priority: 80, usage: 'history 10' },
        { text: '| grep', type: 'hint', description: '搜索历史', priority: 75, usage: 'history | grep keyword' }
    ]
};

export default historyCommand;
