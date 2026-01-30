
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * vim/vi 命令 - 文本编辑器
 */
const vimCommand: CommandDefinition = {
    name: 'vim',
    description: 'Vim 文本编辑器',
    options: [
        { text: '-R', type: 'option', description: '只读模式', priority: 90 },
        { text: '-r', type: 'option', description: '恢复文件', priority: 85 },
        { text: '+', type: 'option', description: '定位到行尾', priority: 80 },
        { text: '-O', type: 'option', description: '垂直分屏', priority: 75 },
        { text: '-o', type: 'option', description: '水平分屏', priority: 70 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-') && !ctx.currentArg.startsWith('+')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default vimCommand;
