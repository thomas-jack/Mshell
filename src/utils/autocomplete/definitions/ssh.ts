
import type { CommandDefinition, CompletionContext, CompletionItem } from '../types';

/**
 * ssh 命令 - SSH 远程连接
 * 
 * 使用格式: ssh [选项] [user@]host [command]
 */
const sshCommand: CommandDefinition = {
    name: 'ssh',
    description: 'SSH 远程连接',
    options: [
        // 常用组合（推荐）
        { text: 'user@host', type: 'hint', description: '连接格式示例', priority: 100, usage: 'ssh root@192.168.1.1' },
        { text: 'root@', type: 'hint', description: 'root 用户', priority: 95 },
        // 端口相关
        { text: '-p', type: 'option', description: '端口 (需跟端口号)', priority: 90, usage: 'ssh -p 22 user@host' },
        // 认证相关
        { text: '-i', type: 'option', description: '私钥文件 (需跟路径)', priority: 88, usage: 'ssh -i ~/.ssh/id_rsa user@host' },
        { text: '-l', type: 'option', description: '用户名 (需跟用户名)', priority: 85, usage: 'ssh -l root host' },
        // 调试
        { text: '-v', type: 'option', description: '调试模式 (需跟主机)', priority: 80, usage: 'ssh -v user@host' },
        { text: '-vv', type: 'option', description: '更详细调试', priority: 75, usage: 'ssh -vv user@host' },
        { text: '-vvv', type: 'option', description: '最详细调试', priority: 70, usage: 'ssh -vvv user@host' },
        // 端口转发
        { text: '-L', type: 'option', description: '本地端口转发', priority: 65, usage: 'ssh -L 8080:localhost:80 user@host' },
        { text: '-R', type: 'option', description: '远程端口转发', priority: 60, usage: 'ssh -R 8080:localhost:80 user@host' },
        { text: '-D', type: 'option', description: 'SOCKS 代理', priority: 55, usage: 'ssh -D 1080 user@host' },
        // 其他常用
        { text: '-N', type: 'option', description: '不执行远程命令(用于转发)', priority: 50, usage: 'ssh -N -L 8080:localhost:80 user@host' },
        { text: '-f', type: 'option', description: '后台运行', priority: 45 },
        { text: '-o', type: 'option', description: '配置选项', priority: 40, usage: '-o StrictHostKeyChecking=no' },
        { text: '-X', type: 'option', description: 'X11 转发', priority: 35 },
        { text: '-A', type: 'option', description: '代理转发', priority: 30 },
        { text: '-t', type: 'option', description: '强制分配 TTY', priority: 25 },
        { text: '-C', type: 'option', description: '压缩传输', priority: 20 }
    ],
    generate: async (ctx: CompletionContext): Promise<CompletionItem[]> => {
        // 如果当前正在输入选项，让静态选项匹配
        if (ctx.currentArg.startsWith('-')) {
            return [];
        }

        // 检查前一个参数是否需要值
        const prevArg = ctx.args[ctx.args.length - 2];
        if (prevArg === '-p') {
            // 端口号补全
            return [
                { text: '22', type: 'hint' as const, description: '默认 SSH 端口', priority: 100, matchPart: '', restPart: '22' },
                { text: '2222', type: 'hint' as const, description: '常用备用端口', priority: 90, matchPart: '', restPart: '2222' }
            ];
        }
        if (prevArg === '-l') {
            // 用户名补全
            return [
                { text: 'root', type: 'hint' as const, description: 'root 用户', priority: 100, matchPart: '', restPart: 'root' },
                { text: 'admin', type: 'hint' as const, description: 'admin 用户', priority: 90, matchPart: '', restPart: 'admin' },
                { text: 'ubuntu', type: 'hint' as const, description: 'Ubuntu 默认', priority: 85, matchPart: '', restPart: 'ubuntu' },
                { text: 'ec2-user', type: 'hint' as const, description: 'AWS EC2', priority: 80, matchPart: '', restPart: 'ec2-user' }
            ];
        }
        if (prevArg === '-o') {
            // 常用配置选项
            return [
                { text: 'StrictHostKeyChecking=no', type: 'hint' as const, description: '跳过主机验证', priority: 100, matchPart: '', restPart: 'StrictHostKeyChecking=no' },
                { text: 'UserKnownHostsFile=/dev/null', type: 'hint' as const, description: '不记录主机', priority: 90, matchPart: '', restPart: 'UserKnownHostsFile=/dev/null' },
                { text: 'ConnectTimeout=10', type: 'hint' as const, description: '连接超时', priority: 85, matchPart: '', restPart: 'ConnectTimeout=10' },
                { text: 'ServerAliveInterval=60', type: 'hint' as const, description: '保持连接', priority: 80, matchPart: '', restPart: 'ServerAliveInterval=60' }
            ];
        }

        // 默认不补全，用户需要输入目标主机
        return [];
    }
};

export default sshCommand;
