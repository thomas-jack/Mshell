
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteDirectories } from '../providers/file-system';

/**
 * du 命令 - 目录大小
 */
const duCommand: CommandDefinition = {
    name: 'du',
    description: '查看目录大小',
    options: [
        { text: '-h', type: 'option', description: '人类可读格式', priority: 100 },
        { text: '-s', type: 'option', description: '只显示总计', priority: 95, usage: 'du -sh dir/' },
        { text: '-sh', type: 'option', description: '总计+可读', priority: 90, usage: 'du -sh *' },
        { text: '-a', type: 'option', description: '包括文件', priority: 85 },
        { text: '-d', type: 'option', description: '深度限制', priority: 80, usage: 'du -d 1' },
        { text: '--max-depth', type: 'option', description: '最大深度', priority: 75, usage: '--max-depth=1' },
        { text: '-c', type: 'option', description: '显示总计', priority: 70 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default duCommand;
