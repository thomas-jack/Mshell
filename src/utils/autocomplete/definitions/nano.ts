
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * nano 命令 - 简单文本编辑器
 */
const nanoCommand: CommandDefinition = {
    name: 'nano',
    description: 'Nano 文本编辑器',
    options: [
        { text: '-v', type: 'option', description: '只读模式', priority: 90 },
        { text: '-B', type: 'option', description: '备份旧文件', priority: 85 },
        { text: '-l', type: 'option', description: '显示行号', priority: 80 },
        { text: '-m', type: 'option', description: '启用鼠标', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default nanoCommand;
