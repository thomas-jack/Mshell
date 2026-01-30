
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteDirectories } from '../providers/file-system';

/**
 * mkdir 命令 - 创建目录
 */
const mkdirCommand: CommandDefinition = {
    name: 'mkdir',
    description: '创建目录',
    options: [
        { text: '-p', type: 'option', description: '递归创建父目录', priority: 100, usage: 'mkdir -p a/b/c' },
        { text: '-v', type: 'option', description: '显示创建过程', priority: 90 },
        { text: '-m', type: 'option', description: '设置权限', priority: 85, usage: 'mkdir -m 755 dir' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 补全现有目录路径前缀
        if (!ctx.currentArg.startsWith('-') && ctx.currentArg.includes('/')) {
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default mkdirCommand;
