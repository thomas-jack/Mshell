
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * chown 命令 - 修改文件所有者
 */
const chownCommand: CommandDefinition = {
    name: 'chown',
    description: '修改文件所有者',
    options: [
        { text: '-R', type: 'option', description: '递归修改', priority: 100 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 90 },
        { text: 'root:root', type: 'hint', description: 'root 用户和组', priority: 85, usage: 'chown root:root file' },
        { text: 'www-data:www-data', type: 'hint', description: 'Web 服务器用户', priority: 80 },
        { text: 'nobody:nogroup', type: 'hint', description: '无权限用户', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 第一个非选项参数是用户:组，第二个是文件
        const nonOptions = ctx.args.slice(1).filter(a => !a.startsWith('-'));
        if (nonOptions.length >= 1 && !ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default chownCommand;
