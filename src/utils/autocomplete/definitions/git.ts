
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';
import { getRemoteFiles, getGitBranches, getGitRemotes } from '../providers/file-system';

/**
 * Git 命令定义
 * 支持动态读取分支、远程仓库、文件列表
 */

// git add 子命令
const gitAdd: CommandDefinition = {
    name: 'add',
    description: '添加文件到暂存区',
    options: [
        { text: '.', type: 'path', description: '所有更改', priority: 100, usage: 'git add .' },
        { text: '-A', type: 'option', description: '所有更改（包括删除）', priority: 95 },
        { text: '-u', type: 'option', description: '仅更新已跟踪文件', priority: 90 },
        { text: '-p', type: 'option', description: '交互式选择', priority: 85 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 动态读取当前目录的文件
        if (!ctx.currentArg.startsWith('-')) {
            return getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        }
        return [];
    }
};

// git commit 子命令
const gitCommit: CommandDefinition = {
    name: 'commit',
    description: '提交更改',
    options: [
        { text: '-m', type: 'option', description: '提交信息', priority: 100, usage: 'git commit -m "message"' },
        { text: '-a', type: 'option', description: '自动暂存已修改文件', priority: 90 },
        { text: '--amend', type: 'option', description: '修改上次提交', priority: 85 },
        { text: '-am', type: 'option', description: '暂存并提交', priority: 80, usage: 'git commit -am "message"' }
    ]
};

// git push 子命令
const gitPush: CommandDefinition = {
    name: 'push',
    description: '推送到远程仓库',
    options: [
        { text: '-f', type: 'option', description: '强制推送', priority: 70 },
        { text: '--set-upstream', type: 'option', description: '设置上游分支', priority: 70, usage: '-u origin master' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        const argIndex = ctx.currentArgIndex;
        // git push <remote> <branch>
        // argIndex 2 = remote, argIndex 3 = branch
        if (argIndex === 2 || (argIndex === 1 && ctx.args[1] === 'push')) {
            // 补全远程仓库
            return getGitRemotes(ctx.sessionId!, ctx.electronAPI);
        } else if (argIndex >= 3) {
            // 补全分支
            return getGitBranches(ctx.sessionId!, ctx.electronAPI);
        }
        return [];
    }
};

// git pull 子命令
const gitPull: CommandDefinition = {
    name: 'pull',
    description: '从远程仓库拉取',
    options: [
        { text: '--rebase', type: 'option', description: '使用变基', priority: 90 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        const argIndex = ctx.currentArgIndex;
        if (argIndex === 2) {
            return getGitRemotes(ctx.sessionId!, ctx.electronAPI);
        } else if (argIndex >= 3) {
            return getGitBranches(ctx.sessionId!, ctx.electronAPI);
        }
        return [];
    }
};

// git checkout 子命令
const gitCheckout: CommandDefinition = {
    name: 'checkout',
    description: '切换分支或还原文件',
    options: [
        { text: '-b', type: 'option', description: '创建并切换分支', priority: 95, usage: 'git checkout -b new-branch' }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            // 优先显示分支，也支持文件
            const branches = await getGitBranches(ctx.sessionId!, ctx.electronAPI);
            const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
            return [...branches, ...files.slice(0, 10)];
        }
        return [];
    }
};

// git branch 子命令
const gitBranch: CommandDefinition = {
    name: 'branch',
    description: '管理分支',
    options: [
        { text: '-a', type: 'option', description: '显示所有分支', priority: 95 },
        { text: '-d', type: 'option', description: '删除分支', priority: 90 },
        { text: '-D', type: 'option', description: '强制删除分支', priority: 85 },
        { text: '-m', type: 'option', description: '重命名分支', priority: 80 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 对于 -d 等操作，补全分支名
        const prevArg = ctx.args[ctx.currentArgIndex - 1];
        if (['-d', '-D', '-m'].includes(prevArg)) {
            return getGitBranches(ctx.sessionId!, ctx.electronAPI);
        }
        return [];
    }
};

// git merge 子命令
const gitMerge: CommandDefinition = {
    name: 'merge',
    description: '合并分支',
    options: [
        { text: '--no-ff', type: 'option', description: '禁用快进合并', priority: 80 },
        { text: '--squash', type: 'option', description: '压缩提交', priority: 75 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        if (!ctx.currentArg.startsWith('-')) {
            return getGitBranches(ctx.sessionId!, ctx.electronAPI);
        }
        return [];
    }
};

// git stash 子命令
const gitStash: CommandDefinition = {
    name: 'stash',
    description: '暂存更改',
    options: [
        { text: 'push', type: 'subcommand', description: '保存更改', priority: 90, usage: 'git stash push -m "msg"' },
        { text: 'pop', type: 'subcommand', description: '恢复并删除', priority: 90 },
        { text: 'apply', type: 'subcommand', description: '恢复但保留', priority: 85 },
        { text: 'list', type: 'subcommand', description: '列出所有', priority: 80 },
        { text: 'drop', type: 'subcommand', description: '删除暂存', priority: 75 },
        { text: 'clear', type: 'subcommand', description: '清空所有', priority: 70 }
    ]
};

// git log 子命令
const gitLog: CommandDefinition = {
    name: 'log',
    description: '查看提交历史',
    options: [
        { text: '--oneline', type: 'option', description: '单行显示', priority: 100 },
        { text: '-n', type: 'option', description: '显示条数', priority: 90, usage: '-n 10' },
        { text: '--graph', type: 'option', description: '图形化显示', priority: 85 },
        { text: '--all', type: 'option', description: '所有分支', priority: 80 }
    ]
};

// git diff 子命令
const gitDiff: CommandDefinition = {
    name: 'diff',
    description: '查看差异',
    options: [
        { text: '--staged', type: 'option', description: '已暂存的更改', priority: 95 },
        { text: '--cached', type: 'option', description: '等同于 --staged', priority: 90 },
        { text: 'HEAD', type: 'hint', description: '与最新提交对比', priority: 85 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 可以补全文件或分支
        const branches = await getGitBranches(ctx.sessionId!, ctx.electronAPI);
        const files = await getRemoteFiles(ctx.sessionId!, ctx.currentArg, ctx.electronAPI);
        return [...branches.slice(0, 5), ...files.slice(0, 10)];
    }
};

// 主 git 命令
const gitCommand: CommandDefinition = {
    name: 'git',
    description: '分布式版本控制系统',
    options: [
        { text: 'status', type: 'subcommand', description: '查看状态', priority: 100, usage: 'git status' },
        { text: 'add', type: 'subcommand', description: '添加文件', priority: 95, usage: 'git add .' },
        { text: 'commit', type: 'subcommand', description: '提交更改', priority: 95, usage: 'git commit -m "msg"' },
        { text: 'push', type: 'subcommand', description: '推送更改', priority: 90, usage: 'git push origin master' },
        { text: 'pull', type: 'subcommand', description: '拉取更改', priority: 90, usage: 'git pull' },
        { text: 'checkout', type: 'subcommand', description: '切换分支', priority: 85, usage: 'git checkout dev' },
        { text: 'branch', type: 'subcommand', description: '管理分支', priority: 85, usage: 'git branch -a' },
        { text: 'merge', type: 'subcommand', description: '合并分支', priority: 80, usage: 'git merge dev' },
        { text: 'clone', type: 'subcommand', description: '克隆仓库', priority: 80, usage: 'git clone <url>' },
        { text: 'log', type: 'subcommand', description: '查看日志', priority: 75, usage: 'git log --oneline' },
        { text: 'diff', type: 'subcommand', description: '查看差异', priority: 75, usage: 'git diff' },
        { text: 'stash', type: 'subcommand', description: '暂存更改', priority: 70, usage: 'git stash' },
        { text: 'reset', type: 'subcommand', description: '重置更改', priority: 65, usage: 'git reset HEAD~1' },
        { text: 'rebase', type: 'subcommand', description: '变基', priority: 60, usage: 'git rebase master' },
        { text: 'fetch', type: 'subcommand', description: '获取更新', priority: 60, usage: 'git fetch origin' }
    ],
    subcommands: {
        'add': gitAdd,
        'commit': gitCommit,
        'push': gitPush,
        'pull': gitPull,
        'checkout': gitCheckout,
        'branch': gitBranch,
        'merge': gitMerge,
        'stash': gitStash,
        'log': gitLog,
        'diff': gitDiff
    }
};

export default gitCommand;
