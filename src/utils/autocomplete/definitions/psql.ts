
import type { CommandDefinition } from '../types';

/**
 * psql 命令 - PostgreSQL 客户端
 */
const psqlCommand: CommandDefinition = {
    name: 'psql',
    description: 'PostgreSQL 数据库客户端',
    options: [
        { text: '-U', type: 'option', description: '用户名', priority: 100, usage: '-U postgres' },
        { text: '-d', type: 'option', description: '数据库名', priority: 95, usage: '-d mydb' },
        { text: '-h', type: 'option', description: '主机地址', priority: 90, usage: '-h localhost' },
        { text: '-p', type: 'option', description: '端口', priority: 85, usage: '-p 5432' },
        { text: '-c', type: 'option', description: '执行命令', priority: 80, usage: '-c "SELECT * FROM users"' },
        { text: '-f', type: 'option', description: '执行 SQL 文件', priority: 75, usage: '-f script.sql' },
        { text: '-l', type: 'option', description: '列出数据库', priority: 70 },
        { text: '-t', type: 'option', description: '仅输出数据', priority: 65 },
        { text: '-A', type: 'option', description: '非对齐模式', priority: 60 },
        { text: '-F', type: 'option', description: '字段分隔符', priority: 55, usage: '-F ","' },
        { text: '-w', type: 'option', description: '不提示密码', priority: 50 },
        { text: '-W', type: 'option', description: '强制提示密码', priority: 45 }
    ]
};

export default psqlCommand;
