
import type { CommandDefinition } from '../types';

/**
 * ping 命令 - 网络测试
 */
const pingCommand: CommandDefinition = {
    name: 'ping',
    description: '网络连通性测试',
    options: [
        { text: '-c', type: 'option', description: '发送次数', priority: 100, usage: 'ping -c 4 host' },
        { text: '-i', type: 'option', description: '间隔秒数', priority: 90 },
        { text: '-W', type: 'option', description: '超时秒数', priority: 85 },
        { text: '-s', type: 'option', description: '包大小', priority: 80 },
        { text: '8.8.8.8', type: 'hint', description: 'Google DNS', priority: 75 },
        { text: 'google.com', type: 'hint', description: 'Google', priority: 70 },
        { text: 'localhost', type: 'hint', description: '本地', priority: 65 }
    ]
};

export default pingCommand;
