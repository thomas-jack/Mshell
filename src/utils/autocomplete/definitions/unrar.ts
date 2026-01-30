
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * 获取 rar 压缩文件
 */
async function getRarFiles(ctx: CompletionContext): Promise<CompletionItem[]> {
    if (!ctx.sessionId || !ctx.electronAPI) return [];

    try {
        const result = await ctx.electronAPI.ssh?.executeCommand?.(
            ctx.sessionId,
            `ls -1 2>/dev/null | grep -E '\\.rar$' | head -20`,
            3000
        );

        if (!result?.success || !result.data) return [];

        return result.data.split('\n')
            .filter((line: string) => line.trim())
            .map((file: string) => ({
                text: file.trim(),
                type: 'path' as const,
                description: 'RAR 文件',
                priority: 90,
                matchPart: '',
                restPart: file.trim()
            }));
    } catch {
        return [];
    }
}

/**
 * unrar 命令 - 解压 RAR 文件
 */
const unrarCommand: CommandDefinition = {
    name: 'unrar',
    description: '解压 RAR 文件',
    options: [
        { text: 'x', type: 'subcommand', description: '解压并保持目录结构', priority: 100, usage: 'unrar x file.rar' },
        { text: 'e', type: 'subcommand', description: '解压到当前目录', priority: 95, usage: 'unrar e file.rar' },
        { text: 'l', type: 'subcommand', description: '列出内容', priority: 90, usage: 'unrar l file.rar' },
        { text: 't', type: 'subcommand', description: '测试完整性', priority: 85 }
    ],
    subcommands: {
        'x': { name: 'x', description: '解压', options: [], generate: getRarFiles },
        'e': { name: 'e', description: '解压', options: [], generate: getRarFiles },
        'l': { name: 'l', description: '列表', options: [], generate: getRarFiles },
        't': { name: 't', description: '测试', options: [], generate: getRarFiles }
    }
};

export default unrarCommand;
