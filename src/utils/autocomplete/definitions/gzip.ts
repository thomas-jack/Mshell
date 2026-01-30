
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * gzip 命令 - 压缩文件
 */
const gzipCommand: CommandDefinition = {
    name: 'gzip',
    description: '使用 gzip 压缩文件',
    options: [
        { text: '-d', type: 'option', description: '解压缩', priority: 100, usage: 'gzip -d file.gz' },
        { text: '-k', type: 'option', description: '保留原文件', priority: 95 },
        { text: '-v', type: 'option', description: '显示压缩比', priority: 90 },
        { text: '-9', type: 'option', description: '最高压缩率', priority: 85 },
        { text: '-1', type: 'option', description: '最快速度', priority: 80 },
        { text: '-r', type: 'option', description: '递归处理目录', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 检查是否有 -d 参数（解压模式）
            const isDecompress = ctx.args.includes('-d');

            if (isDecompress) {
                // 解压模式：只显示 .gz 文件
                const result = await ctx.electronAPI?.ssh?.executeCommand?.(
                    ctx.sessionId!,
                    `ls -1 2>/dev/null | grep -E '\\.gz$' | head -20`,
                    3000
                );
                if (result?.success && result.data) {
                    return result.data.split('\n')
                        .filter((line: string) => line.trim())
                        .map((file: string) => ({
                            text: file.trim(),
                            type: 'path' as const,
                            description: 'GZIP 文件',
                            priority: 90,
                            matchPart: '',
                            restPart: file.trim()
                        }));
                }
            } else {
                // 压缩模式：显示普通文件
                return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            }
        }
        return [];
    }
};

export default gzipCommand;
