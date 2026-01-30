
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * 获取 7z 压缩文件
 */
async function get7zFiles(ctx: CompletionContext): Promise<CompletionItem[]> {
    if (!ctx.sessionId || !ctx.electronAPI) return [];

    try {
        const result = await ctx.electronAPI.ssh?.executeCommand?.(
            ctx.sessionId,
            `ls -1 2>/dev/null | grep -E '\\.(7z|zip|rar|tar|gz|bz2|xz)$' | head -20`,
            3000
        );

        if (!result?.success || !result.data) return [];

        return result.data.split('\n')
            .filter((line: string) => line.trim())
            .map((file: string) => ({
                text: file.trim(),
                type: 'path' as const,
                description: '压缩文件',
                priority: 90,
                matchPart: '',
                restPart: file.trim()
            }));
    } catch {
        return [];
    }
}

/**
 * 7z 命令 - 7-Zip 压缩工具
 */
const sevenZipCommand: CommandDefinition = {
    name: '7z',
    description: '7-Zip 压缩工具',
    options: [
        { text: 'a', type: 'subcommand', description: '添加/创建压缩包', priority: 100, usage: '7z a archive.7z files' },
        { text: 'x', type: 'subcommand', description: '解压并保持目录', priority: 95, usage: '7z x archive.7z' },
        { text: 'e', type: 'subcommand', description: '解压到当前目录', priority: 90, usage: '7z e archive.7z' },
        { text: 'l', type: 'subcommand', description: '列出内容', priority: 85, usage: '7z l archive.7z' },
        { text: 't', type: 'subcommand', description: '测试完整性', priority: 80 }
    ],
    subcommands: {
        'a': {
            name: 'a',
            description: '创建压缩包',
            options: [
                { text: '-mx9', type: 'option', description: '最高压缩率', priority: 90 },
                { text: '-p', type: 'option', description: '设置密码', priority: 85 }
            ]
        },
        'x': { name: 'x', description: '解压', options: [], generate: get7zFiles },
        'e': { name: 'e', description: '解压', options: [], generate: get7zFiles },
        'l': { name: 'l', description: '列表', options: [], generate: get7zFiles },
        't': { name: 't', description: '测试', options: [], generate: get7zFiles }
    }
};

export default sevenZipCommand;
