
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * fdisk 命令 - 磁盘分区管理
 */
const fdiskCommand: CommandDefinition = {
    name: 'fdisk',
    description: '磁盘分区管理',
    options: [
        { text: '-l', type: 'option', description: '列出所有分区', priority: 100, usage: 'fdisk -l' },
        { text: '-s', type: 'option', description: '显示分区大小', priority: 90 },
        { text: '-u', type: 'option', description: '以扇区为单位', priority: 85 },
        { text: '-b', type: 'option', description: '指定扇区大小', priority: 80, usage: '-b 512' },
        { text: '-c', type: 'option', description: '兼容模式', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 显示磁盘设备
            const result = await ctx.electronAPI?.ssh?.executeCommand?.(
                ctx.sessionId!,
                `ls /dev/sd* /dev/vd* /dev/nvme* 2>/dev/null | head -20`,
                3000
            );
            if (result?.success && result.data) {
                return result.data.split('\n')
                    .filter((line: string) => line.trim())
                    .map((device: string) => ({
                        text: device.trim(),
                        type: 'path' as const,
                        description: '磁盘设备',
                        priority: 90,
                        matchPart: '',
                        restPart: device.trim()
                    }));
            }
        }
        return [];
    }
};

export default fdiskCommand;
