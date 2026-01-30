
import type { CommandDefinition } from '../types';

/**
 * iptables-restore 命令 - 恢复 iptables 规则
 */
const iptablesRestoreCommand: CommandDefinition = {
    name: 'iptables-restore',
    description: '恢复 iptables 规则',
    options: [
        { text: '-c', type: 'option', description: '恢复计数器', priority: 90 },
        { text: '-n', type: 'option', description: '不清空现有规则', priority: 85 },
        { text: '-t', type: 'option', description: '测试模式', priority: 80 }
    ]
};

export default iptablesRestoreCommand;
