
import type { CommandDefinition } from '../types';

/**
 * wget 命令 - 下载工具
 */
const wgetCommand: CommandDefinition = {
    name: 'wget',
    description: '文件下载工具',
    options: [
        { text: '-O', type: 'option', description: '指定输出文件名', priority: 100, usage: '-O filename' },
        { text: '-c', type: 'option', description: '断点续传', priority: 95 },
        { text: '-b', type: 'option', description: '后台下载', priority: 90 },
        { text: '-q', type: 'option', description: '静默模式', priority: 85 },
        { text: '-r', type: 'option', description: '递归下载', priority: 80 },
        { text: '-P', type: 'option', description: '下载目录', priority: 75, usage: '-P /path/to/dir' },
        { text: '--limit-rate', type: 'option', description: '限制速度', priority: 70, usage: '--limit-rate=1m' },
        { text: '--no-check-certificate', type: 'option', description: '忽略证书', priority: 65 },
        { text: '-U', type: 'option', description: 'User-Agent', priority: 60 },
        { text: '--header', type: 'option', description: '自定义头', priority: 55, usage: '--header="Cookie: ..."' }
    ]
};

export default wgetCommand;
