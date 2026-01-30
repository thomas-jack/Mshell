
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * cat 命令 - 查看文件内容
 */
const catCommand: CommandDefinition = {
    name: 'cat',
    description: '查看文件内容',
    options: [
        { text: '-n', type: 'option', description: '显示行号', priority: 90 },
        { text: '-b', type: 'option', description: '非空行显示行号', priority: 85 },
        { text: '-s', type: 'option', description: '压缩连续空行', priority: 80 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default catCommand;
