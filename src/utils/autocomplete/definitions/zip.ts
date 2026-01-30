
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * zip 命令 - 创建 ZIP 压缩包
 */
const zipCommand: CommandDefinition = {
    name: 'zip',
    description: '创建 ZIP 压缩包',
    options: [
        { text: '-r', type: 'option', description: '递归压缩目录', priority: 100, usage: 'zip -r archive.zip folder/' },
        { text: '-q', type: 'option', description: '静默模式', priority: 85 },
        { text: '-9', type: 'option', description: '最高压缩率', priority: 80 },
        { text: '-e', type: 'option', description: '加密', priority: 75 },
        { text: '-x', type: 'option', description: '排除文件', priority: 70, usage: '-x "*.log"' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 可以压缩文件或目录
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default zipCommand;
