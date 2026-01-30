
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * source 命令 - 执行脚本
 */
const sourceCommand: CommandDefinition = {
    name: 'source',
    description: '在当前 Shell 中执行脚本',
    options: [],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
    }
};

export default sourceCommand;
