
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * less 命令 - 分页查看
 */
const lessCommand: CommandDefinition = {
    name: 'less',
    description: '分页查看文件',
    options: [
        { text: '-N', type: 'option', description: '显示行号', priority: 90 },
        { text: '-S', type: 'option', description: '不换行', priority: 85 },
        { text: '-R', type: 'option', description: '支持颜色', priority: 80 },
        { text: '+F', type: 'option', description: '实时跟踪 (类似 tail -f)', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-') && !ctx.currentArg.startsWith('+')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default lessCommand;
