
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteDirectories } from '../providers/file-system';

/**
 * find 命令 - 查找文件
 */
const findCommand: CommandDefinition = {
    name: 'find',
    description: '查找文件',
    options: [
        { text: '.', type: 'path', description: '当前目录', priority: 100 },
        { text: '-name', type: 'option', description: '按名称匹配', priority: 95, usage: 'find . -name "*.js"' },
        { text: '-type', type: 'option', description: '按类型匹配', priority: 90, usage: '-type f (文件) -type d (目录)' },
        { text: '-mtime', type: 'option', description: '按修改时间', priority: 85, usage: '-mtime -7 (7天内)' },
        { text: '-size', type: 'option', description: '按大小匹配', priority: 80, usage: '-size +100M' },
        { text: '-exec', type: 'option', description: '执行命令', priority: 75, usage: '-exec rm {} \\;' },
        { text: '-delete', type: 'option', description: '删除匹配文件', priority: 70 },
        { text: '-maxdepth', type: 'option', description: '最大搜索深度', priority: 65, usage: '-maxdepth 2' },
        { text: '-print', type: 'option', description: '打印结果', priority: 60 }
    ],
    subcommands: {
        '-type': {
            name: '-type',
            description: '文件类型',
            options: [
                { text: 'f', type: 'hint', description: '普通文件', priority: 100 },
                { text: 'd', type: 'hint', description: '目录', priority: 95 },
                { text: 'l', type: 'hint', description: '符号链接', priority: 90 }
            ]
        }
    },
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 补全起始目录
        if (!ctx.currentArg.startsWith('-') && ctx.currentArgIndex <= 2) {
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default findCommand;
