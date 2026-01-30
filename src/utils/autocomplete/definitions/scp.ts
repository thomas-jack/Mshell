
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * scp 命令 - 安全复制
 */
const scpCommand: CommandDefinition = {
    name: 'scp',
    description: '安全复制文件',
    options: [
        { text: '-r', type: 'option', description: '递归复制目录', priority: 100 },
        { text: '-P', type: 'option', description: '指定端口', priority: 95, usage: '-P 22' },
        { text: '-i', type: 'option', description: '指定密钥', priority: 90, usage: '-i ~/.ssh/id_rsa' },
        { text: '-v', type: 'option', description: '详细输出', priority: 85 },
        { text: '-C', type: 'option', description: '压缩传输', priority: 80 },
        { text: '-p', type: 'option', description: '保留属性', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // 如果包含 : 说明是远程路径，不补全
        if (ctx.currentArg.includes(':')) {
            return [];
        }

        // ctx.args = ['scp', '-r', 'file', 'remote:', '']
        const cmdIndex = ctx.args.findIndex(arg => arg === 'scp');
        if (cmdIndex === -1) return [];

        const argsAfterCmd = ctx.args.slice(cmdIndex + 1, -1);
        const nonOptionArgs = argsAfterCmd.filter(arg => arg && !arg.startsWith('-'));

        if (nonOptionArgs.length === 0) {
            // 第一个参数：本地文件，添加空格
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            return files.map(f => ({
                ...f,
                text: f.text + ' ',
            }));
        }
        // 第二个参数是目标（可能是远程），不补全
        return [];
    }
};

export default scpCommand;
