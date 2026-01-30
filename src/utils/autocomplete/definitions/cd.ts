
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteDirectories } from '../providers/file-system';

/**
 * cd 命令定义
 * 动态读取远程目录
 */
const cdCommand: CommandDefinition = {
    name: 'cd',
    description: '切换工作目录',
    options: [
        { text: '..', type: 'path', description: '返回上一级目录', priority: 100, usage: 'cd ..' },
        { text: '~', type: 'path', description: '前往用户主目录', priority: 95, usage: 'cd ~' },
        { text: '-', type: 'path', description: '返回上次目录', priority: 90, usage: 'cd -' },
        { text: '/', type: 'path', description: '根目录', priority: 85, usage: 'cd /' }
    ],
    generate: async (context: CompletionContext): Promise<CompletionItem[]> => {
        if (!context.sessionId || !context.electronAPI) {
            return [];
        }

        // 动态读取当前目录下的子目录
        const directories = await getRemoteDirectories(
            context.sessionId,
            context.currentArg,
            context.electronAPI
        );

        return directories;
    }
};

export default cdCommand;
