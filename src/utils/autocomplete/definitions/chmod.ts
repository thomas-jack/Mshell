
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * chmod 命令 - 修改文件权限
 */
const chmodCommand: CommandDefinition = {
    name: 'chmod',
    description: '修改文件权限',
    options: [
        { text: '-R', type: 'option', description: '递归修改', priority: 100 },
        { text: '-v', type: 'option', description: '显示详细信息', priority: 90 },
        { text: '755', type: 'hint', description: 'rwxr-xr-x (可执行)', priority: 85, usage: 'chmod 755 file' },
        { text: '644', type: 'hint', description: 'rw-r--r-- (普通文件)', priority: 80, usage: 'chmod 644 file' },
        { text: '700', type: 'hint', description: 'rwx------ (私有可执行)', priority: 75 },
        { text: '600', type: 'hint', description: 'rw------- (私有文件)', priority: 70 },
        { text: '+x', type: 'hint', description: '添加执行权限', priority: 65, usage: 'chmod +x script.sh' },
        { text: '-x', type: 'hint', description: '移除执行权限', priority: 60 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 如果不是选项且不是权限数字，补全文件
        if (!ctx.currentArg.startsWith('-') && !/^\d{3}$/.test(ctx.currentArg) && !/^[+-][rwx]/.test(ctx.currentArg)) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default chmodCommand;
