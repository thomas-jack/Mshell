
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * mount 命令 - 挂载文件系统
 */
const mountCommand: CommandDefinition = {
    name: 'mount',
    description: '挂载文件系统',
    options: [
        { text: '-a', type: 'option', description: '挂载 fstab 中所有', priority: 100, usage: 'mount -a' },
        { text: '-t', type: 'option', description: '文件系统类型', priority: 95, usage: '-t ext4' },
        { text: '-o', type: 'option', description: '挂载选项', priority: 90, usage: '-o rw,noatime' },
        { text: '-r', type: 'option', description: '只读挂载', priority: 85 },
        { text: '-w', type: 'option', description: '读写挂载', priority: 80 },
        { text: '-v', type: 'option', description: '详细输出', priority: 75 },
        { text: '-n', type: 'option', description: '不写入 mtab', priority: 70 },
        { text: '-l', type: 'option', description: '显示挂载信息', priority: 65 },
        { text: '--bind', type: 'option', description: '绑定挂载', priority: 60, usage: '--bind /src /dest' },
        { text: '-L', type: 'option', description: '按标签挂载', priority: 55 },
        { text: '-U', type: 'option', description: '按 UUID 挂载', priority: 50 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 显示磁盘设备和目录
            const result = await ctx.electronAPI?.ssh?.executeCommand?.(
                ctx.sessionId!,
                `(ls /dev/sd* /dev/vd* /dev/nvme* 2>/dev/null; ls -d /*/ 2>/dev/null) | head -20`,
                3000
            );
            if (result?.success && result.data) {
                return result.data.split('\n')
                    .filter((line: string) => line.trim())
                    .map((item: string) => ({
                        text: item.trim(),
                        type: 'path' as const,
                        description: item.startsWith('/dev/') ? '设备' : '目录',
                        priority: 90,
                        matchPart: '',
                        restPart: item.trim()
                    }));
            }
        }
        return [];
    }
};

export default mountCommand;
