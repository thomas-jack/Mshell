
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getPM2Processes, getRemoteFiles } from '../providers/file-system';

/**
 * PM2 命令定义
 * 支持动态读取运行中的 PM2 进程
 */

// 通用进程选择器
const createProcessSelector = (name: string, desc: string): CommandDefinition => ({
    name,
    description: desc,
    options: [
        { text: 'all', type: 'hint', description: '所有进程', priority: 100 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        const processes = await getPM2Processes(ctx.sessionId!, ctx.electronAPI);
        return [
            { text: 'all', type: 'hint', description: '所有进程', priority: 100, matchPart: '', restPart: 'all' },
            ...processes.filter(p => !ctx.currentArg || p.text.includes(ctx.currentArg))
        ];
    }
});

// pm2 start 子命令
const pm2Start: CommandDefinition = {
    name: 'start',
    description: '启动应用',
    options: [
        { text: '--name', type: 'option', description: '进程名称', priority: 90, usage: '--name my-app' },
        { text: '-i', type: 'option', description: '实例数量', priority: 85, usage: '-i max' },
        { text: '--watch', type: 'option', description: '监听文件变化', priority: 80 },
        { text: '--max-memory-restart', type: 'option', description: '内存限制重启', priority: 75, usage: '--max-memory-restart 500M' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 可以启动文件或已存在的进程
        if (!ctx.currentArg.startsWith('-')) {
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            // 过滤出 JS 文件和 JSON 配置
            const jsFiles = files.filter(f =>
                f.text.endsWith('.js') ||
                f.text.endsWith('.ts') ||
                f.text.endsWith('.json') ||
                f.text.endsWith('/')
            );
            return jsFiles;
        }
        return [];
    }
};

// pm2 logs 子命令
const pm2Logs: CommandDefinition = {
    name: 'logs',
    description: '查看日志',
    options: [
        { text: '--lines', type: 'option', description: '显示行数', priority: 90, usage: '--lines 100' },
        { text: '--err', type: 'option', description: '仅错误日志', priority: 85 },
        { text: '--out', type: 'option', description: '仅输出日志', priority: 85 },
        { text: '--raw', type: 'option', description: '原始格式', priority: 80 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getPM2Processes(ctx.sessionId!, ctx.electronAPI);
        }
        return [];
    }
};

// pm2 monit 子命令
const pm2Monit: CommandDefinition = {
    name: 'monit',
    description: '实时监控',
    options: []
};

// pm2 save 子命令
const pm2Save: CommandDefinition = {
    name: 'save',
    description: '保存进程列表',
    options: [
        { text: '--force', type: 'option', description: '强制保存', priority: 90 }
    ]
};

// pm2 startup 子命令
const pm2Startup: CommandDefinition = {
    name: 'startup',
    description: '配置开机启动',
    options: [
        { text: 'systemd', type: 'hint', description: 'Systemd', priority: 90 },
        { text: 'upstart', type: 'hint', description: 'Upstart', priority: 85 },
        { text: 'launchd', type: 'hint', description: 'macOS', priority: 80 }
    ]
};

// 主 pm2 命令
const pm2Command: CommandDefinition = {
    name: 'pm2',
    description: 'Node.js 进程管理器',
    options: [
        { text: 'list', type: 'subcommand', description: '列出所有进程', priority: 100, usage: 'pm2 list' },
        { text: 'start', type: 'subcommand', description: '启动应用', priority: 95, usage: 'pm2 start app.js' },
        { text: 'stop', type: 'subcommand', description: '停止进程', priority: 90, usage: 'pm2 stop all' },
        { text: 'restart', type: 'subcommand', description: '重启进程', priority: 90, usage: 'pm2 restart all' },
        { text: 'reload', type: 'subcommand', description: '零停机重载', priority: 85, usage: 'pm2 reload all' },
        { text: 'delete', type: 'subcommand', description: '删除进程', priority: 85, usage: 'pm2 delete all' },
        { text: 'logs', type: 'subcommand', description: '查看日志', priority: 80, usage: 'pm2 logs' },
        { text: 'monit', type: 'subcommand', description: '实时监控', priority: 80, usage: 'pm2 monit' },
        { text: 'save', type: 'subcommand', description: '保存进程列表', priority: 75, usage: 'pm2 save' },
        { text: 'resurrect', type: 'subcommand', description: '恢复进程', priority: 70, usage: 'pm2 resurrect' },
        { text: 'startup', type: 'subcommand', description: '开机启动', priority: 70, usage: 'pm2 startup' },
        { text: 'flush', type: 'subcommand', description: '清空日志', priority: 65, usage: 'pm2 flush' },
        { text: 'update', type: 'subcommand', description: '更新 PM2', priority: 60, usage: 'pm2 update' }
    ],
    subcommands: {
        'start': pm2Start,
        'stop': createProcessSelector('stop', '停止进程'),
        'restart': createProcessSelector('restart', '重启进程'),
        'reload': createProcessSelector('reload', '重载进程'),
        'delete': createProcessSelector('delete', '删除进程'),
        'logs': pm2Logs,
        'monit': pm2Monit,
        'save': pm2Save,
        'startup': pm2Startup
    }
};

export default pm2Command;
