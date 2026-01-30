
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * rm 命令 - 删除文件或目录
 */
const rmCommand: CommandDefinition = {
    name: 'rm',
    description: '删除文件或目录',
    options: [
        { text: '-r', type: 'option', description: '递归删除目录', priority: 100 },
        { text: '-f', type: 'option', description: '强制删除', priority: 95 },
        { text: '-rf', type: 'option', description: '递归强制删除', priority: 90, usage: 'rm -rf dir/' },
        { text: '-i', type: 'option', description: '删除前确认', priority: 85 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 80 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default rmCommand;
