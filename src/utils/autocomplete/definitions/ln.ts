
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * ln 命令 - 创建链接
 */
const lnCommand: CommandDefinition = {
    name: 'ln',
    description: '创建链接',
    options: [
        { text: '-s', type: 'option', description: '创建符号链接', priority: 100, usage: 'ln -s target link' },
        { text: '-f', type: 'option', description: '强制覆盖', priority: 90 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 85 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // ctx.args = ['ln', '-s', 'target', 'link', '']
        const cmdIndex = ctx.args.findIndex(arg => arg === 'ln');
        if (cmdIndex === -1) return [];

        const argsAfterCmd = ctx.args.slice(cmdIndex + 1, -1);
        const nonOptionArgs = argsAfterCmd.filter(arg => arg && !arg.startsWith('-'));

        if (nonOptionArgs.length === 0) {
            // 第一个参数：目标文件，添加空格
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            return files.map(f => ({
                ...f,
                text: f.text + ' ',
            }));
        }
        // 第二个参数是链接名，用户自己输入
        return [];
    }
};

export default lnCommand;
