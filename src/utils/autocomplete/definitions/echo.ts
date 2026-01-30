
import type { CommandDefinition } from '../types';

/**
 * echo 命令 - 输出文本
 */
const echoCommand: CommandDefinition = {
    name: 'echo',
    description: '输出文本',
    options: [
        { text: '-n', type: 'option', description: '不换行', priority: 90 },
        { text: '-e', type: 'option', description: '解释转义字符', priority: 85 },
        { text: '$PATH', type: 'hint', description: '环境变量 PATH', priority: 80 },
        { text: '$HOME', type: 'hint', description: '用户主目录', priority: 75 },
        { text: '$USER', type: 'hint', description: '当前用户', priority: 70 },
        { text: '$PWD', type: 'hint', description: '当前目录', priority: 65 }
    ]
};

export default echoCommand;
