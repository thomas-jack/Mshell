
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * gunzip 命令 - 解压 gzip 文件
 */
const gunzipCommand: CommandDefinition = {
    name: 'gunzip',
    description: '解压 gzip 文件',
    options: [
        { text: '-k', type: 'option', description: '保留原文件', priority: 95 },
        { text: '-v', type: 'option', description: '显示详情', priority: 90 },
        { text: '-f', type: 'option', description: '强制覆盖', priority: 85 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 只显示 .gz 文件
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
        }
        return [];
    }
};

export default gunzipCommand;
