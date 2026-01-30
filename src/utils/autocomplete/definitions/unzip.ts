
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * 获取 ZIP 文件
 */
async function getZipFiles(ctx: CompletionContext): Promise<CompletionItem[]> {
    if (!ctx.sessionId || !ctx.electronAPI) return [];

    try {
        const result = await ctx.electronAPI.ssh?.executeCommand?.(
            ctx.sessionId,
            `ls -1 2>/dev/null | grep -E '\\.zip$' | head -20`,
            3000
        );

        if (!result?.success || !result.data) return [];

        return result.data.split('\n')
            .filter((line: string) => line.trim())
            .map((file: string) => ({
                text: file.trim(),
                type: 'path' as const,
                description: 'ZIP 文件',
                priority: 90,
                matchPart: '',
                restPart: file.trim()
            }));
    } catch {
        return [];
    }
}

/**
 * unzip 命令 - 解压 ZIP 文件
 */
const unzipCommand: CommandDefinition = {
    name: 'unzip',
    description: '解压 ZIP 文件',
    options: [
        { text: '-l', type: 'option', description: '列出内容不解压', priority: 90 },
        { text: '-o', type: 'option', description: '覆盖已存在文件', priority: 85 },
        { text: '-d', type: 'option', description: '指定解压目录', priority: 80, usage: 'unzip file.zip -d /target' },
        { text: '-q', type: 'option', description: '静默模式', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getZipFiles(ctx);
        }
        return [];
    }
};

export default unzipCommand;
