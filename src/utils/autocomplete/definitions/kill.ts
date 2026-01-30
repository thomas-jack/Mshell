
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * 获取运行中的进程列表
 */
async function getProcesses(ctx: CompletionContext): Promise<CompletionItem[]> {
    if (!ctx.sessionId || !ctx.electronAPI) return [];

    try {
        const result = await ctx.electronAPI.ssh?.executeCommand?.(
            ctx.sessionId,
            `ps aux --no-headers 2>/dev/null | head -20 | awk '{print $2 "|" $11}'`,
            3000
        );

        if (!result?.success || !result.data) return [];

        return result.data.split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => {
                const [pid, cmd] = line.split('|');
                const cmdName = cmd?.split('/').pop() || cmd;
                return {
                    text: pid,
                    displayText: `${pid} (${cmdName})`,
                    type: 'hint' as const,
                    description: cmdName,
                    priority: 80,
                    matchPart: '',
                    restPart: pid
                };
            });
    } catch {
        return [];
    }
}

/**
 * kill 命令 - 终止进程
 */
const killCommand: CommandDefinition = {
    name: 'kill',
    description: '终止进程',
    options: [
        { text: '-9', type: 'option', description: '强制终止 (SIGKILL)', priority: 100, usage: 'kill -9 PID' },
        { text: '-15', type: 'option', description: '正常终止 (SIGTERM)', priority: 95 },
        { text: '-HUP', type: 'option', description: '重新加载 (SIGHUP)', priority: 90 },
        { text: '-INT', type: 'option', description: '中断 (SIGINT)', priority: 85 }
    ],
    generate: getProcesses
};

export default killCommand;
