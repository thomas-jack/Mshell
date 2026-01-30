
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles, getRemoteDirectories } from '../providers/file-system';

/**
 * mv 命令 - 移动或重命名文件
 */
const mvCommand: CommandDefinition = {
    name: 'mv',
    description: '移动或重命名文件',
    options: [
        { text: '-i', type: 'option', description: '覆盖前确认', priority: 90 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 85 },
        { text: '-n', type: 'option', description: '不覆盖已存在文件', priority: 80 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // ctx.args = ['mv', '-i', 'src', 'dest', '']
        const cmdIndex = ctx.args.findIndex(arg => arg === 'mv');
        if (cmdIndex === -1) return [];

        const argsAfterCmd = ctx.args.slice(cmdIndex + 1, -1);
        const nonOptionArgs = argsAfterCmd.filter(arg => arg && !arg.startsWith('-'));

        if (nonOptionArgs.length === 0) {
            // 第一个参数：源文件/目录，添加空格以便继续输入目标
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            return files.map(f => ({
                ...f,
                text: f.text + ' ',
            }));
        } else {
            // 第二个参数：目标目录
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
    }
};

export default mvCommand;
