
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * 获取压缩文件
 */
async function getArchiveFiles(ctx: CompletionContext): Promise<CompletionItem[]> {
    if (!ctx.sessionId || !ctx.electronAPI) return [];

    try {
        const result = await ctx.electronAPI.ssh?.executeCommand?.(
            ctx.sessionId,
            `ls -1 2>/dev/null | grep -E '\\.(tar|tar\\.gz|tgz|tar\\.bz2|tar\\.xz)$' | head -20`,
            3000
        );

        if (!result?.success || !result.data) return [];

        return result.data.split('\n')
            .filter((line: string) => line.trim())
            .map((file: string) => ({
                text: file.trim(),
                type: 'path' as const,
                description: '归档文件',
                priority: 90,
                matchPart: '',
                restPart: file.trim()
            }));
    } catch {
        return [];
    }
}

/**
 * tar 命令 - 归档工具
 */
const tarCommand: CommandDefinition = {
    name: 'tar',
    description: '归档和压缩工具',
    options: [
        { text: '-cvf', type: 'option', description: '创建归档', priority: 100, usage: 'tar -cvf archive.tar files/' },
        { text: '-xvf', type: 'option', description: '解压归档', priority: 95, usage: 'tar -xvf archive.tar' },
        { text: '-czvf', type: 'option', description: '创建 gzip 压缩归档', priority: 90, usage: 'tar -czvf archive.tar.gz files/' },
        { text: '-xzvf', type: 'option', description: '解压 gzip 归档', priority: 85, usage: 'tar -xzvf archive.tar.gz' },
        { text: '-cjvf', type: 'option', description: '创建 bzip2 压缩归档', priority: 80, usage: 'tar -cjvf archive.tar.bz2 files/' },
        { text: '-xjvf', type: 'option', description: '解压 bzip2 归档', priority: 75, usage: 'tar -xjvf archive.tar.bz2' },
        { text: '-tvf', type: 'option', description: '查看归档内容', priority: 70, usage: 'tar -tvf archive.tar' },
        { text: '-C', type: 'option', description: '指定解压目录', priority: 65, usage: '-C /target/dir' },
        { text: '--exclude', type: 'option', description: '排除文件', priority: 60, usage: '--exclude="*.log"' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // 检查是解压还是创建
        const isExtract = ctx.args.some(arg => arg.includes('x'));
        const isCreate = ctx.args.some(arg => arg.includes('c'));
        const isList = ctx.args.some(arg => arg.includes('t'));

        // 找到 tar 命令位置
        const cmdIndex = ctx.args.findIndex(arg => arg === 'tar');
        if (cmdIndex === -1) return [];

        const argsAfterCmd = ctx.args.slice(cmdIndex + 1, -1);
        const nonOptionArgs = argsAfterCmd.filter(arg => arg && !arg.startsWith('-'));

        if (isExtract || isList) {
            // 解压/查看模式：显示归档文件
            return getArchiveFiles(ctx);
        } else if (isCreate) {
            // 创建模式：先是归档名，然后是要压缩的文件
            if (nonOptionArgs.length === 0) {
                // 用户需要输入归档名，不补全
                return [];
            } else {
                // 已有归档名，补全要打包的文件，添加空格以便继续添加
                const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
                return files.map(f => ({
                    ...f,
                    text: f.text + ' ',  // 可以继续添加更多文件
                }));
            }
        }

        // 默认显示文件
        return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
    }
};

export default tarCommand;
