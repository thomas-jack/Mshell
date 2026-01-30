
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * head 命令 - 查看文件头部
 */
const headCommand: CommandDefinition = {
    name: 'head',
    description: '查看文件头部内容',
    options: [
        { text: '-n', type: 'option', description: '显示行数', priority: 100, usage: 'head -n 20 file' },
        { text: '-c', type: 'option', description: '显示字节数', priority: 90 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default headCommand;
