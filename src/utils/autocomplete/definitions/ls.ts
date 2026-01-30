
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteDirectories } from '../providers/file-system';

/**
 * ls 命令 - 列出目录内容
 */
const lsCommand: CommandDefinition = {
    name: 'ls',
    description: '列出目录内容',
    options: [
        { text: '-l', type: 'option', description: '详细列表格式', priority: 100 },
        { text: '-a', type: 'option', description: '显示隐藏文件', priority: 95 },
        { text: '-la', type: 'option', description: '详细列表 + 隐藏文件', priority: 90, usage: 'ls -la' },
        { text: '-lh', type: 'option', description: '人类可读的文件大小', priority: 85, usage: 'ls -lh' },
        { text: '-R', type: 'option', description: '递归列出子目录', priority: 80 },
        { text: '-t', type: 'option', description: '按修改时间排序', priority: 75 },
        { text: '-S', type: 'option', description: '按文件大小排序', priority: 70 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default lsCommand;
