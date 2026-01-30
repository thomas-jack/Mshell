
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles, getRemoteDirectories } from '../providers/file-system';

/**
 * cp 命令 - 复制文件或目录
 */
const cpCommand: CommandDefinition = {
    name: 'cp',
    description: '复制文件或目录',
    options: [
        { text: '-r', type: 'option', description: '递归复制目录', priority: 100, usage: 'cp -r src/ dest/' },
        { text: '-i', type: 'option', description: '覆盖前确认', priority: 90 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 85 },
        { text: '-p', type: 'option', description: '保留权限和时间戳', priority: 80 },
        { text: '-a', type: 'option', description: '归档模式 (保留所有属性)', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // ctx.args = ['cp', '-r', 'src', 'dest', '']
        // 找到 'cp' 之后的非选项参数（排除当前正在输入的）
        const cmdIndex = ctx.args.findIndex(arg => arg === 'cp');
        if (cmdIndex === -1) return [];

        const argsAfterCmd = ctx.args.slice(cmdIndex + 1, -1); // 排除最后一个（当前输入）
        const nonOptionArgs = argsAfterCmd.filter(arg => arg && !arg.startsWith('-'));

        if (nonOptionArgs.length === 0) {
            // 第一个参数：源文件/目录，添加空格以便继续输入目标
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            return files.map(f => ({
                ...f,
                text: f.text + ' ',  // 添加空格
            }));
        } else {
            // 第二个参数：目标目录
            return getRemoteDirectories(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
    }
};

export default cpCommand;
