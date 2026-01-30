
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * umount 命令 - 卸载文件系统
 */
const umountCommand: CommandDefinition = {
    name: 'umount',
    description: '卸载文件系统',
    options: [
        { text: '-a', type: 'option', description: '卸载所有', priority: 100 },
        { text: '-f', type: 'option', description: '强制卸载', priority: 95 },
        { text: '-l', type: 'option', description: '懒卸载', priority: 90 },
        { text: '-r', type: 'option', description: '卸载失败则只读挂载', priority: 85 },
        { text: '-v', type: 'option', description: '详细输出', priority: 80 },
        { text: '-n', type: 'option', description: '不写入 mtab', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 显示已挂载的文件系统
            const result = await ctx.electronAPI?.ssh?.executeCommand?.(
                ctx.sessionId!,
                `mount | awk '{print $3}' | head -20`,
                3000
            );
            if (result?.success && result.data) {
                return result.data.split('\n')
                    .filter((line: string) => line.trim())
                    .map((mountpoint: string) => ({
                        text: mountpoint.trim(),
                        type: 'path' as const,
                        description: '挂载点',
                        priority: 90,
                        matchPart: '',
                        restPart: mountpoint.trim()
                    }));
            }
        }
        return [];
    }
};

export default umountCommand;
