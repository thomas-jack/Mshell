
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles } from '../providers/file-system';

/**
 * grep 命令 - 搜索文本
 */
const grepCommand: CommandDefinition = {
    name: 'grep',
    description: '搜索文本内容',
    options: [
        { text: '-r', type: 'option', description: '递归搜索目录', priority: 100 },
        { text: '-i', type: 'option', description: '忽略大小写', priority: 95 },
        { text: '-n', type: 'option', description: '显示行号', priority: 90 },
        { text: '-v', type: 'option', description: '反向匹配', priority: 85 },
        { text: '-l', type: 'option', description: '只显示文件名', priority: 80 },
        { text: '-c', type: 'option', description: '显示匹配行数', priority: 75 },
        { text: '-E', type: 'option', description: '使用扩展正则', priority: 70 },
        { text: '-A', type: 'option', description: '显示匹配后N行', priority: 65, usage: '-A 3' },
        { text: '-B', type: 'option', description: '显示匹配前N行', priority: 60, usage: '-B 3' },
        { text: '--include', type: 'option', description: '只搜索指定文件', priority: 55, usage: '--include="*.js"' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 第一个非选项参数是模式，后面的是文件
        const nonOptionArgs = ctx.args.slice(1).filter(a => !a.startsWith('-'));
        if (nonOptionArgs.length >= 1 && !ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

export default grepCommand;
