
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * tail 命令 - 查看文件尾部
 */
const tailCommand: CommandDefinition = {
    name: 'tail',
    description: '查看文件尾部内容',
    options: [
        { text: '-f', type: 'option', description: '实时跟踪', priority: 100, usage: 'tail -f /var/log/syslog' },
        { text: '-n', type: 'option', description: '显示行数', priority: 95, usage: 'tail -n 100 file' },
        { text: '-F', type: 'option', description: '跟踪并重新打开', priority: 90 },
        { text: '--follow', type: 'option', description: '等同于 -f', priority: 85 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default tailCommand;
